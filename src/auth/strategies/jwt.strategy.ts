import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { ConfigService } from '@nestjs/config';
import { Injectable, UnauthorizedException } from '@nestjs/common';

//TODAS LAS ESTRATEGIAS SON PROVIDERS, por lo que pueden ser ineyectadas
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  //Va a revisar el JWToken, y me va a decir si el token es valido o no

  /**
   * Inyectamos el user repository con el fin de que si el token es valido retornamos la informacion del usuario actualizada desde la DB.
   */
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    configService: ConfigService,
  ) {
    //Como esta clase extiende de otra (passportStrategy), es necesario inicializar el constructor del padre
    //Estamos incializando la clase padre (PassportStrategy) con el secreto con el cual firmamos nuestros tokens y el jwtFromRequest para indicarle en donde va a encontrar el token
    super({
      secretOrKey: configService.get('jwtSecret'),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    });
  }

  //Si la validacion del token es correcto, retorna una instancia de User
  async validate(payload: JwtPayload): Promise<User> {
    const { id } = payload;

    const user = await this.userRepository.findOneBy({ id });

    if (!user) {
      throw new UnauthorizedException('Token no valid');
    }
    if (!user.isActive) {
      throw new UnauthorizedException('User is not active');
    }

    return user;
  }
}
