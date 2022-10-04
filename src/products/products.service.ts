import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { validate as isUUID } from 'uuid';
import { Product, ProductImage } from './entities';
import { User } from '../auth/entities/user.entity';

@Injectable()
export class ProductsService {
  //Console.log personalizado de nestJS
  private readonly logger = new Logger('ProductsService');

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductImage)
    private readonly productImageRepository: Repository<ProductImage>,
    private readonly dataSource: DataSource,
  ) {}

  //Debido a que creamos una relacion user-productos, debimos modificar el servicio de controlador para que tambien recibiera la informacion del usaurio que creó el/los producto/s.
  async create(createProductDto: CreateProductDto, user: User) {
    try {
      //Esta validacion la usamos en la definicion del entity, cuando usamos la funcion de typerorm 'BeforeInsert'
      /*if (!createProductDto.slug) {
        createProductDto.slug = createProductDto.title
          .toLowerCase()
          .replaceAll(' ', '_')
          .replaceAll("'", '');
      }*/

      //Debemos extraer las imagenes ya que estas son una entidad diferente, por lo que debe ser tratada como tal. En otras palabras la entidad usuario espera entidades de imagenes, más no strigns, que son como vienen dentro del createProductDto.
      const { images = [], ...restCreateProductDto } = createProductDto;

      //Para poder crear el registro en la db primero se crea un elemento temporal
      const product = this.productRepository.create({
        ...restCreateProductDto,
        //Esto es lo que mencionabamos antes, ya que las imagenes son una "Relacion", no podemos guardarlas como strings, sino que debemos crearlas como instancias y ahí si, podemos crear la relacion con la entidad producto
        images: images.map((image) =>
          this.productImageRepository.create({ url: image }),
        ),
        user,
      });

      // Una vez tenemos el objeto temporal, ya podemos insertarlo en la DB
      return await this.productRepository.save(product);
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async findAll({ limit = 10, offset = 0 }) {
    try {
      const products = await this.productRepository.find({
        take: limit,
        skip: offset,
        relations: {
          images: true,
        },
      });

      //Transformamos el contenido de images antes de enviarlas, realmente no es necesario pero el sensei le parecía mejor retornarlo como un array de strings y no de objetos como lo retorna typeOrm.
      return products.map(({ images, ...rest }) => ({
        ...rest,
        images: images.map((img) => img.url),
      }));
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async findOne(term: string) {
    let product: Product;

    //Este metodo busca un producto, bien sea por su id o por el titulo o slug.
    if (isUUID(term)) {
      //Para traer la entidad con sus relaciones es necesario habilitar el eager en las propiedades de la entidad
      product = await this.productRepository.findOneBy({ id: term });
    } else {
      //Cuando solo buscaba por slug, implementabamos este metodo.
      //product = await this.productRepository.findOneBy({ slug: term });

      //Este NUEVO metodo me permite encontrar un elemento cuando lo buscan con el tittle o el slug
      //prod: es un alias para la tabla producto.
      const query = this.productRepository.createQueryBuilder('prod');

      //Upper es una funcion propia de postgress para convertir la busqueda en mayuscula
      //Convertimos a mayusculas para evitar el caseSensitive. El termino ':title' o ':slug' es la forma de pasarle "parametros" a la consulta.
      product = await query
        .where('UPPER(title) = :title or slug = :slug', {
          title: term.toUpperCase(),
          slug: term.toLowerCase(),
        })
        //El segundo parametro es un alias para la tabla de relacion.
        .leftJoinAndSelect('prod.images', 'images')
        .getOne();
    }

    if (!product) {
      throw new NotFoundException(`Product ${term} not found`);
    }

    //Si modificamos este return, el metodo para remover nos molestaría porque no estariamos enviando la instancia sino un objeto, debido a que compiamos todas las propiedades para poder enviar solo las url de las imagenes, por lo que debemos crear otro metodo(findOnePlain) que use este, para el controlador de busqueda. Todo esto surge porque queremos modificar la estructura de la respuesta de la DB.
    return product;
  }

  //Leer el comentario del return de arriba.
  async findOnePlain(term: string) {
    const { images, ...restProductProperties } = await this.findOne(term);

    return {
      ...restProductProperties,
      images: images.map((image) => image.url),
    };
  }

  async update(id: string, updateProductDto: UpdateProductDto, user: User) {
    //Manejamos la informacion de esta forma porque las imagenes son una entidad y se deben tratar como tal al momento de realizar operaciones en la DB, no las podemos pasar como propiedades(me refiero a cualquier otro tipo de dato que no sea una entidad) de otra entidad.
    const { images, ...restProperties } = updateProductDto;

    //Esto se encarga de buscar para verficar si el producto existe
    const product = await this.productRepository.preload({
      id,
      ...restProperties,
    });

    if (!product) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }

    //NOTA MUY IMPORTANTE: Creamos el query runner. Para poder usarlo debemos inyectar un servicio, exactamente el del dataSource
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      //Vamos a borrar las imagenes previas y a poner las nuevas. Esto solo lo hacemos así porque así se diseño la logica para este caso en particular, pero normalmente NUNCA se deben borrar cosas de la DB
      if (images) {
        //Usamos la propiedad product como criterio, ya que así se llama nuestra columna en nuestra entidad ProducImages con la que estamos relacionando el producto con las imagenes
        await queryRunner.manager.delete(ProductImage, { product: { id } });

        //Creamos instancias de imagen con los strings que nos envian en el updateProductDto.
        product.images = images.map((img) =>
          this.productImageRepository.create({ url: img }),
        );
      } else {
        //Creo que si en el updateProductDto no vienen imagenes nuevas, simplemente consultamos las que tenemos y las volvemos asignar.
        product.images = await this.productImageRepository.findBy({
          product: { id },
        });
      }

      //Esto se agrego en un video despues, ya que creamos una relacion con la cual identificamos el usuario que esta actualizando el producto, por eso quedó tan atravesado.
      product.user = user;

      //Esto es un PRE-Guardado, pero quien aplica los cambios es la linea siguiente.
      await queryRunner.manager.save(product);
      //Esto se usa para aplicar los cambios en la DB, todos los pasos anteriores de borrar imagenes y crear instancias de las nuevas, no se realizan hasta que no se realiza el commit (como en git)
      await queryRunner.commitTransaction();
      //CERRAMOS la conexion.
      await queryRunner.release();

      //Este es un metodo que creamos anteriormente.Es una alternativa para responder mostrando la relacion con las imagenes.
      //return this.findOnePlain(id);
      return product;
      //este return lo usabamos antes de tener relaciones.
      //return await this.productRepository.save(product);
    } catch (error) {
      //Esto se ejecuta en caso de que haya un error, lo cual no va a permitir que el commit sea realizado y deshace los cambios.
      await queryRunner.rollbackTransaction();
      //Al igual que cuando ejecutamos el commit, debemos CERRAR la conexion
      await queryRunner.release();

      this.handleDBExceptions(error);
    }
  }

  async remove(term: string) {
    // buscamos el producto por algun termino, uudi, nombre o slug.
    await this.findOne(term);
    try {
      //Esto no se debería hacer, lo de eliminar el producto, solo debemos inactivarlo para no generar problemas despues con las relaciones.
      return await this.productRepository.delete(term);
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  //Este metodo lo usamos en el seed al momento de inicializar.
  async deleteAllProducts() {
    try {
      const query = this.productRepository.createQueryBuilder('product');

      //La clave aca es poner el where sin ninguna condicion, Lo cual sería un GRANDISIMO PROBLEMA.
      return await query.delete().where({}).execute();
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  private handleDBExceptions(error: any) {
    if (error.code === '23505') {
      throw new BadRequestException(error.detail);
    }

    this.logger.error(error);
    throw new InternalServerErrorException('Check logs');
  }
}
