import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import { validate as isUUID } from 'uuid';

@Injectable()
export class ProductsService {
  //Console.log personalizado de nestJS
  private readonly logger = new Logger('ProductsService');

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async create(createProductDto: CreateProductDto) {
    try {
      //Esta validacion la usamos en la definicion del entity
      /*if (!createProductDto.slug) {
        createProductDto.slug = createProductDto.title
          .toLowerCase()
          .replaceAll(' ', '_')
          .replaceAll("'", '');
      }*/

      //Para poder crear el registro en la db primero se crea un elemento temporal
      const product = this.productRepository.create(createProductDto);

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
      });
      return products;
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async findOne(term: string) {
    let product: Product;

    if (isUUID(term)) {
      product = await this.productRepository.findOneBy({ id: term });
    } else {
      //product = await this.productRepository.findOneBy({ slug: term });

      const query = await this.productRepository.createQueryBuilder();

      //Upper es una funcion propia de postgress para convertir la busqueda en mayuscula
      //Convertimos a mayusculas para evitar el caseSensitive
      product = await query
        .where('UPPER(title) = :title or slug = :slug', {
          title: term.toUpperCase(),
          slug: term.toLowerCase(),
        })
        .getOne();
    }

    if (!product) {
      throw new NotFoundException(`Product ${term} not found`);
    }

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const product = await this.productRepository.preload({
      id,
      ...updateProductDto,
    });

    if (!product) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }

    try {
      return await this.productRepository.save(product);
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async remove(term: string) {
    await this.findOne(term);
    try {
      return await this.productRepository.delete(term);
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
