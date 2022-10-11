import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { diskStorage } from 'multer';
import { FilesService } from './files.service';
import { fileFilter, fileNamer } from './helper';

@ApiTags('Files')
@Controller('files')
export class FilesController {
  constructor(
    private readonly configService: ConfigService,
    private readonly filesService: FilesService,
  ) {}

  @Get('product/:imageName')
  findProductImage(
    //Esto lo usamos para habilitar la descarga del archivo. Al poner esto le decimos a NEST que nosotros nos vamos a encargar de manejar el manejo del api. Debemos tener cuidado cuando usamos esta funcionalidad ya que los interceptors y otras funcionalidades que nos aporta rest quedan "desactivados" para este controller.
    @Res() res: Response,
    @Param('imageName') imageName: string,
  ) {
    const path = this.filesService.getStaticProducImage(imageName);

    res.sendFile(path);
  }

  @Post('product')
  @UseInterceptors(
    FileInterceptor('file', {
      //Mucho ojo que mandamos la referencia de la funcion, no la ejecutamos, es decir, no le ponemos parentesis al final
      fileFilter: fileFilter,
      storage: diskStorage({
        destination: './static/uploads',
        filename: fileNamer,
      }),
    }),
  )
  uploadProductImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Make sure the file is an image');
    }

    const secureURL = `${this.configService.get<string>(
      'hostApi',
    )}/files/product/${file.filename}`;

    return secureURL;
  }
}
