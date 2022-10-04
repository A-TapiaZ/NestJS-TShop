import {
  CanActivate,
  ExecutionContext,
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { META_ROLES } from '../decorators/role-protected.decorator';

@Injectable()
export class UseRoleGuard implements CanActivate {
  /**
   * REFLECTOR: Me ayuda a ver informacion acerca de los decoradores, y otra informacion de la metadata del mismo controlador donde sea llamado.
   */
  constructor(private readonly reflector: Reflector) {}

  //Para que un guard sea valido tiene que implementar el metodo de canActivate. El cual retorna un booleano, etc. El cual me indica si cumple o no
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    //Obtenemos la informacion anteriormente seteada en nuestro decorador @SetMetadata, que luego fue reemplazado por el decorador personalizado role-protected. No explica porque usa el context.getHandler, solo dice que leamos la documentacion.
    //META_ROLES: Es como un alias que le damos al grupo de valores que se setearon por el role-protected.decorator, el cual esta definido en role-protected.decorator.
    //Obtenemos los roles que tienen permitido ver esta ruta
    const validRoles: string[] = this.reflector.get(
      META_ROLES,
      context.getHandler(),
    );

    // Esta validacion es PELIGROsa ya que si se nos olvida implementar la validacion de roles en una ruta(role-protected.decorator el cual setea los roles con los ENUM), esta validacion va hacer que no reviente, haciendola pasar por como si fuera una ruta publica
    //Si no hay una restriccion por roles para consultar esta ruta, dejamos pasasar, de lo contrario procedemos a realizar la validacion de roles
    if (!validRoles || validRoles.length === 0) {
      return true;
    }

    //Este context esta definido en el metood por defecto (se define así cuando lo creamos por medio de CLI) [Me refiero a que antes la habiamos nombrado como ctx en otro archivo porque lo habíamos creado desde 0, como este guard se creó por medio de CLI, la palabra viene definida así por default].
    //Obtenemos la request
    const req = context.switchToHttp().getRequest();
    // Obtenemos el usaurio que esta seteado en los headers (si no estoy mal, se setea al momento de validar el token, por qué en los headers? Creo que lo hace automaticamnte el modulo de JwtPassport)
    const user = req.user;

    //Si no existe un usuario en la request, es como si el usuario no estuviera autenticado, entonces retornamos error.
    if (!user) {
      throw new BadRequestException('User not found');
    }

    //###### VALIDACION DE ROLES ######
    //Esta fue la manera como yo lo hice y no funciona, es como si la funciona no alcanzara a recibir el true que retorno dentro del forEach/map.
    // user.roles.forEach((rol) => {
    //   if (validRoles.includes(rol)) {
    //     return true;
    //   }
    // });

    //Mientras que para este for, la funcion si alcanza a recibir el valor del return
    //Verificamos que los rol/es que estan definidos en el usuario se encuentren dentro de los rol/es autorizados para ingresar a esta ruta.
    for (const rol of user.roles) {
      if (validRoles.includes(rol)) {
        return true;
      }
    }

    //Si llegamos hasta este punto, quiere decir que ninguna de las validaciones se cumplió por lo que en pocas palabras, nos dice que la ruta no es publica o que el usuario no tiene los suficientes privilegios.
    throw new ForbiddenException(`${user.fullName} does not have permissions`);
  }
}
