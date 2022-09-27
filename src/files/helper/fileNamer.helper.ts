import { Request } from 'express';
import { v4 as uuid } from 'uuid';

export const fileNamer = (
  req: Request,
  file: Express.Multer.File,
  cb: Function,
) => {
  //Esta validacion es innecesaria ya que el helper anterior se encarga de evaluar si el formato es valido o si sí viene un archivo adjunto.
  if (!file) return cb(new Error('File is empty'), false);

  const fileExtension = file.mimetype.split('/').at(-1);

  const fileName = `${uuid()}.${fileExtension}`;

  cb(null, fileName);
};
