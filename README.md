<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

# Teslo API

1. ` yarn install`
2. Clonar el archivo **.env.template** y renombrarlo a `.env `
3. Actualizar las variables de entorno
4. Levantar la DB con:

```
docker-compose up -d
```

5. Ejecutar el seed:

```
http://localhost:3000/api/seed
```

6. Levantar el proyecto:

```
yarn start:dev
```

# Readme para mi

1. Generamos el proyecto y borramos los archivos que no necesitamos (hasta el momento son el archivo spec, controller y service).

```
nest new teslo-shop
```

2. Creamos el docker-compose file.
3. Definimos las variables de entorno.
4. **ACTUALIZAR** .gitignore `IMPORTANTISIMO`
5. Para poder usar las variables de entorno, tenemos que instalar una dependencia, e importarla en el app.module.

```
yarn add @nestjs/config
```

    ConfigModule.forRoot()

6. Instalamos ORM que nos ofrece nest, si no conocemos el nombre del paquete para la db que vamos a usar, al inicializar el proyecto este va a arrojar un error indicandonos cual es el nombre del paquete a instalar.

```
yarn add @nestjs/typeorm typeorm
```

7. Configuramos TypeORM en el app.module. La propiedad **forRoot** es unica en el proyecto, no pueden haber más de una.

```
  TypeOrmModule.forRoot({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: +process.env.DB_PORT,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    autoLoadEntities: true,
    synchronize: true,
  }),
```

8. Creamos nuestro primer recurso:

```
nest g res product --no-spec
```

9. Para definir una entidad tenemos que usar el decorador `@Entity` que nos ofrece TypeORM (obviamente en caso de estar usando TypeORM)

10. Una vez definamos la entidad, debemos importar la entidad en el modulo de nuestro recurso (para este caso el product.module):

```
 imports: [TypeOrmModule.forFeature([Product])],
```

11. Una vez hemos definido las entities, procedemos a definir los dto (data transfer object) y usamos la dependencia class-validator la cual debemos instalar:

```
yarn add class-validator class-transformer
```

12. Ademas debemos usar la configuracion de globalPipe en el archivo **main.ts** para poder realizar las validaciones usando los dtos.

```
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
      })
    );

```

13. Una vez ya estamos validando la informacion que nos envían por medio de los DTO, podemos empezar a insertar registros en la DB. Para realizar realizar estas inserciones usamos el patron repositorio, el cual debemos inyectar en el constructor del services dentro del modulo:

```
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}
```

- El decorador InjectRepository se importa de `@nestjs/typeorm`
- Product es la entity que se definio en pasos anteriores
- Repository se importa de `typeorm`
