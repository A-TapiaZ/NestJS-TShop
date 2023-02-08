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
yarn start:dev
```

6. Levantar el proyecto:

```
http://localhost:3000/api/seed

```

#

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

13. Una vez ya estamos validando la informacion que nos envían por medio de los DTO, podemos empezar a insertar registros en la DB. Para realizar estas inserciones usamos el patron repositorio, el cual debemos inyectar en el constructor del services dentro del modulo:

```
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}
```

- El decorador InjectRepository se importa de `@nestjs/typeorm`
- Product es la entity que se definio en pasos anteriores
- Repository se importa de `typeorm`

#

# Autenticacion y autorizacion

1. Generamos un recurso que se llame auth.

```
nest g res auth --no-spec
```

2. Modificamos el archivo entity y lo renombramos user.entity.ts. Renombramos la clase dentro del archivo por `User`. Colocamos el decorador `@Entity('users')` de typeorm y definimos las propiedades de la entidad.

3. Para crear la tabla en la DB, es necesario importar el modulo `TypeOrmModule.forFeature` dentro del modulo que se esta trabanjando y pasarle la entidad anteriormente definida.

4. Una vez tengamos definida nuestra entidad podemos empezar a trabajar sobre nuestros controladores. Por ejemplo definiendo los DTO con los que vamos a trabajar. Para realizar validaciones podemos usar el paquete `class-validator`.

5. Una vez creado nuestro DTO y definido nuestro controlador, podemos empezar a insertar registros dentro de la DB. Para realizar esto debemos injectar nuestro repositorio en el servicio del modulo donde estamos trabajando. Para realizar la inyeccion debemos importar el decorador `@InjectRepository(User)` y pasarle la definicion de nuestra entidad. Una vez hecho esto podemos crear la definicion de nuestro repositorio `private readonly userRepository: Repository<User>`

6. Al tener esta inyeccion lista, podemos realizar cambios en nuestra DB usando el repositorio, para este caso crear un nuevo usuario.

7. Para realizar el login vamos a usar `passport` con `passport-jwt` para eso instalamos passport:

```
yarn add @nestjs/passport passport
yarn add @nestjs/jwt passport-jwt
yarn add -D @types/passport-jwt
```

Despues de instalarlos, procedemos a importarlo en el modulo donde donde nos estamos autenticando en este caso en el auth.module.ts. Usamos `JwtModule.registerAsync` de forma asincrona para esperar a que todos los modulos esten cargados.

```
PassportModule.register({ defaultStrategy: 'jwt' }),
JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          secret: configService.get('JWT_SECRET'),
          signOptions: {
            expiresIn: '2h',
          },
        };
      },
    }),
```

8. Para realizar la verificacion de los jwt-tokens, lo realizamos mediante una strategia. Una vez tengamos la estrategia definida, usamos el decorador `@Injectable()` y lo implementamos en el auth.module

#

# Documentar

1. Para documentar usando OpenAPI nos podemos dirigir a la siguiente **[URL](https://docs.nestjs.com/openapi/introduction)** donde encontraremos el paquete que debemos instalar y la configuracion de este modulo en el arcchivo main.

```
yarn add @nestjs/swagger

```

```
const config = new DocumentBuilder()
  .setTitle('Cats example')
  .setDescription('The cats API description')
  .setVersion('1.0')
  .addTag('cats')
  .build();
const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api', app, document);
```

2. Una vez configurado el modulo ppal, podemos ir a cada uno de los controladores y agregar el decorador `@ApiTags()` para darle un nombre/tag a la seccion.

3. Si queremos detallar las respuestas usamos el decorador `@ApiResponse()` debajo del decorador REST de cada uno de los controladores.

4. Si dentro del decorador ApiResponse usamos como type(es una propiedad del decorador) por ejemplo una entidad, podemos usar el decorador `@ApiProperty()` **EN** la definicion de la misma para que sea mostrada en la documentacion.

```
@ApiProperty({
  example: 'ui123-3123sdasd-s54dad3as',
  uniqueItems: true,
  description: 'Product id',
})
```

5. De igual forma `@ApiProperty()` puede ser usado en los dto's y además si un algun dto llegara a ser completamente la implementacion de otro como lo es **UpdateProductDto** entonces podriamos importar **PartialType**, no de `'@nestjs/mapped-types'` como lo hace por defecto, sino de `'@nestjs/swagger'`.

#

# WebSockects

1. Primero que todo para trabajar con webSockets debemos instalar estas dependencias, tomadas de la documentacion de la pagina:

```
yarn add @nestjs/websockets @nestjs/platform-socket.io socket.io

```

2. Una vez tengamos las dependencias instaladas, generamos un recurso con el comando, OJO, elegir crear la opcion de WebSockets, para este caso decidimos no implementar el CRUD que ofrece el CLI.

```
nest g res nombreRecurso
```

3. Al crear el recurso nos dirigimos al recurso con extension gateway.ts y habilitamos los CORS dentro del decorador `@WebSocketGateway({cors:true})`

4. Para poder saber quien se conecta y quien se desconecta la clase debe implementar 2 interfaces `OnGatewayConnection, OnGatewayDisconnect`

5. Ahora nos vamos para el cliente e instalamos la dependencia de socket para cliente (socket.io-client). Creando una instancia de `Manager`, le pasamos la url de donde van a estar disponible los sockets `http://localhost:3000/socket.io/socket.io.js` para este caso. Para conectar el cliente con el servidor es necesario especificar el namespace implementando la instancia de manager que realizamos antes `const socket = manager.socket('/')`

6. En el servidor para indentificar quien es cada cliente, lo podemos almacenamos en el servidor en memoria o si son muchos clientes la mejor opcion es hacerlo por DB.

7. Para emitir/recibir un mensaje de todos los clientes conectados a un mismo espacio, podemos usar el decorador `@WebSocketServer() wss: Server;`. Para emitir un evento es necesario especificar el tipo de evento que se va a emitir, y el valor. i.e `this.wss.emit('clients-updated', this.messagesWsService.getClientsOnline());`

8. Para que el cliente pueda recibir el evento y su valor correspondiente, debe estar pendiente (metodo `.on`) del mismo tipo de evento:

```
socket.on("clients-updated", (clients: string[]) => {
    let clientsHtml = "";

    clients.forEach((clientId) => {
      clientsHtml += `
        <li>${clientId}</li>
      `;
    });

    clientesUL.innerHTML = clientsHtml;
  });
```

9. Para que el cliente pueda enviar un evento este debe usar el metodo `.emit` en el cual se define el "nombre" del evento y el valor a enviar:

```
socket.emit("message-sent-client", {
      id: "Yo",
      message: messageInput.value,
    });
```

10. Para que el servidor **"escuche"** el evento que esta enviando el cliente usamos un decorador que nos facilita nest, `@SubscribeMessage('nombreDelEvento')` y despues definimos una funcion para recibir tanto el cliente como la info que nos está mandando:

```
  @SubscribeMessage('message-sent-client')
  handleMessageFromClient(client: Socket, payload: NewMessageDto) {
    console.log(client.id, payload);
```

11. Hay varias formas de emitir informacion desde el servidor con diferentes fines:

    1. `client.emit`: Emitimos unicamente al cliente que estamos recibiendo.
    2. `client.broadcast.emit`: Emitimos a todos los clientes del namespace excepto al cliente que estamos recibiendo.
    3. `this.wss.emit`: Por medio de la instancia que creamos en el punto _7_, podemos emitir a todos los clientes incluyendo el cliente emisor.

12. Para agregar headers a los payload que realiza el cliente, modificamos la instancia que creamos en el punto 5 y agregamos una propiedad que se llama `extraHeaders`:

```
  const manager = new Manager("http://localhost:3000/socket.io/socket.io.js", {
    extraHeaders: {
      authentication: token,
    },
  });
```

13. La informacion que se envia usando la propiedad _extraheaders_ se puede obtener del cliente en el servidor de la siguiente manera:

```
  const token = client.handshake.headers.authentication as string;
```

- Para este caso estabamos enviando el JWToken del cliente al momento de conectarse, para realizar la respectiva verificacion en el servidor y si el JWToken era valido, permitirle la conexion.

# Recordatorio

1. Recordar usar el tryCatch
2. poner el await en las peticiones que realizan acciones con nuestra db
