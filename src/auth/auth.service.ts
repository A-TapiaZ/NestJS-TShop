import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { CreateUserDto, LoginUserDto } from './dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    //Este servicio es proveido por el JwtModule que se encuentra en el auth.module
    private readonly jwtService: JwtService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    //Encriptamos contraseña
    createUserDto.password = bcrypt.hashSync(createUserDto.password, 10);

    //ESTA NO ES LA INSERCION, ES COMO PREPARARSE PARA DESPUES SALVAR
    const user = this.userRepository.create(createUserDto);
    try {
      await this.userRepository.save(user);
      //eliminamos la contraseña de la respuesta de la DB
      delete user.password;
      return {
        ...user,
        token: this.getJwtToken({ id: user.id }),
      };
    } catch (error) {
      this.handleDbErrors(error);
    }
  }

  async login(loginUserDto: LoginUserDto) {
    const { email, password } = loginUserDto;

    //Este es el unico lugar en donde vamos a querer traer la contraseña almacenada en la DB para poder compararla con la que esta enviando el usuario.
    const user = await this.userRepository.findOne({
      where: { email },
      select: { email: true, password: true, id: true },
    });

    if (!user || !bcrypt.compareSync(password, user.password)) {
      throw new UnauthorizedException('Email or password wrong');
    }

    return { ...user, token: this.getJwtToken({ id: user.id }) };
  }

  async checkAuthStatus(user: User) {
    //Si llega hasta aca, quiere decir que el superó la validacion del token
    const { id } = user;

    return { ...user, token: this.getJwtToken({ id }) };
  }

  private getJwtToken(payload: JwtPayload) {
    const token = this.jwtService.sign(payload);
    return token;
  }

  private handleDbErrors(error): never {
    if (error.code === '23505') {
      throw new BadRequestException(error.detail);
    }
    console.log(error);
    throw new InternalServerErrorException('Check logs');
  }
}
