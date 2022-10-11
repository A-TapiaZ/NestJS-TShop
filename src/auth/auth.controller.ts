import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  SetMetadata,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { Auth, GetRawHeaders, GetUser, RoleProtected } from './decorators';

import { CreateUserDto, LoginUserDto } from './dto';
import { User } from './entities/user.entity';
import { UseRoleGuard } from './guards/use-role.guard';
import { ValidRoles } from './interfaces';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  createUser(@Body() createUserDto: CreateUserDto) {
    return this.authService.create(createUserDto);
  }
  @Post('login')
  loginUser(@Body() loginUserDto: LoginUserDto) {
    return this.authService.login(loginUserDto);
  }

  @Get('check-auth-status')
  @Auth()
  checkAuthStatus(@GetUser() user: User) {
    return this.authService.checkAuthStatus(user);
  }

  @Get('private')
  //AuthGuard es un Guard que nos provee nestjs/passport, el cual se encarga de validar que la persona que quiera ver esta ruta tenga un token vigente
  @UseGuards(AuthGuard())
  testingPrivateRoute(
    //Si deseo obtener la informacion del usuario que me esta enviando la Strategy tengo 2 formas de acceder a ella. Directamente por la req o bien, usando un decorador personalizado
    //No estoy seguro, pero en un video fercho dice que los decoradores que van en los parametros de los controladores deben ser manuales, de resto se pueden generar por CLI
    //@Req() request: Express.Request,
    //Con este decorador obtengo el usuario completo de la req.
    @GetUser() user: User,
    //Con este otro, le estoy especificando que solo quiero el correo en caso tal de encontrarlo
    @GetUser('email') userEmail: User,
    //Con este extraigo los headers.
    @GetRawHeaders() rawHeaders: string[],
  ) {
    return {
      ok: true,
      message: 'Hola mundo ruta privada',
      user,
      email: userEmail,
      rawHeaders,
    };
  }

  @Get('private2')
  //Es un decorador que creamos con el fin de validar los roles que pueden entrar a esta ruta. Este decorador lo que hace es que practimante define un setMetadata con lo que sea que le pasemos en los parametros.
  //ValidRoles es un enum que definimos en las interfaces, con el fin de evitar problemas de escritura(copiar mal los roles)
  @RoleProtected(ValidRoles.superUser)
  //SetMEtada: como su nombre lo indica se encarga de setear informacion extra en el metodo (rara vez se usa). En este caso esta agregando informacion acerca de que rol puede entrar a esta ruta
  //como escribir los valores se presta para errores de escritura humanos, vamos a cambiar este decorador por uno personalizado
  //@SetMetadata('roles', ['admin', 'super-user'])
  //NOTA MUY IMPORTANTE: LOS GUARDS PERSONALIZADOS LOS USAMOS SIN CREAR LA INSTANCIA, O SEA 'NEW GUARDPERSONALIZADO()' <- así no.
  //UseRoleGuard: se debió haber llamado userRoleGuard, valida los roles de los usuarios y retorna true en caso de que la persona tenga los suficientes privilegios para entrar a este endpoint.
  @UseGuards(AuthGuard(), UseRoleGuard)
  privateRoute2(@GetUser() user: User) {
    return {
      ok: true,
      user,
    };
  }

  //Auth: es un decorador personalizado, el cual su funciones es la de agrupar decoradores. Este archivo lo creamos manualmentes, sin usar el CLI y su contenido lo copiamos de la documentacion de nest. Obviamente los decoradores que contiene son los que creamos en este proyecto, son practicamente estos: @RoleProtected(ValidRoles.superUser), @UseGuards(AuthGuard(), UseRoleGuard). Lo creamos con el fin de ahorrar unas cuantas lineas.
  @Get('private3')
  @Auth(ValidRoles.superUser, ValidRoles.admin)
  privateRoute3(@GetUser() user: User) {
    return {
      ok: true,
      user,
    };
  }
}
