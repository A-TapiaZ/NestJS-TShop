import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductsService } from '../products/products.service';
import { initialData } from './data/seed-data';
import { User } from '../auth/entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SeedService {
  constructor(
    //Inyectamos un servicio de otro modulo. Pero primero debemos exportarlo en el modulo al que pertenece e importarlo en este modulo.
    private readonly productService: ProductsService,
    //Inyectamos el repositorio de User directamente.
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async runSeed() {
    await this.deleteTables();
    const adminUser = await this.insertNewUsers();
    await this.insertNewProducts(adminUser);

    return 'Seed Executed';
  }

  //Creamos un metodd para limpiar la DB de forma controlada, debido que si se hace a la maldita sea, las relaciones posiblemente no nos permitan eliminarlo
  private async deleteTables() {
    //Como tenemos cascade en la relacion de nuestros productos con las imagenes, una vez yo elimino un producto, este va y elimina tambien las imagenes relacionadas a dicho producto
    //Este metodo se encuentra definido en el servicio de Productos.
    this.productService.deleteAllProducts();

    const queryBuilder = this.userRepository.createQueryBuilder();

    //Eliminamos los registros de usaurios
    await queryBuilder.delete().where({}).execute();
  }

  private async insertNewUsers() {
    //Este es la primera forma que aprendimos de insertar en la db multiples registros
    // const promisesArray = initialData.users.map((user) => {
    //   return this.userRepository.create(user);
    // });

    // return await Promise.all(promisesArray);

    //Esta otra es una alternativa.
    //Tomamos los usuarios del archivo que contiene la data que vamos a guardar.
    const seedUsers = initialData.users;

    //Encrittamos las contraseñas para que al momento de loguearnos con estos usuarios, estos puedan funcionar. Por lo de que comparamos las contraseñas con bcrypt.
    for (const user of seedUsers) {
      user.password = bcrypt.hashSync(user.password, 10);
    }

    const users: User[] = [];

    //Creamos instancias de User y los insertamos en el array users.
    seedUsers.forEach((user) => {
      //Esto es un metood sincrono, porque este no es el metodo que salva en la DB, por tal motivo no lleva el await
      users.push(this.userRepository.create(user));
    });

    //Una vez guardados en la db nos retorna los usuarios con sus ids, los cuales son necesarios para la relacion de User-Products.
    const usersWithId = await this.userRepository.save(users);

    //Solo retornamos un usuario.
    return usersWithId[0];
  }

  //Creamos los productos en nuestra DB. Es necesario el id de un usario para saber quien fue el que los creó.
  private async insertNewProducts(adminUser: User) {
    const promisesArray = initialData.products.map((prod) => {
      return this.productService.create(prod, adminUser);
    });

    return await Promise.all(promisesArray);
  }
}
