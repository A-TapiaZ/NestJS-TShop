import { Controller, Get } from '@nestjs/common';
import { ValidRoles } from '../auth/interfaces';
import { Auth } from '../auth/decorators';
import { SeedService } from './seed.service';

@Controller('seed')
export class SeedController {
  constructor(private readonly seedService: SeedService) {}

  @Get()
  //Lo habiamos colocado para probar la ejecucion de este endpoint con autorizacion, pero realmente no tiene logico ponerlo porque al momento de ejecutarlo no existen valores en nuestra db, o eso se supone.
  //@Auth(ValidRoles.admin)
  excuteSeed() {
    return this.seedService.runSeed();
  }
}
