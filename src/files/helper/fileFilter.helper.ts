import { Request } from 'express';

export const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: Function,
) => {
  if (!file) return cb(new Error('File is empty'), false);

  const fileExtension = file.mimetype.split('/').at(-1);
  const validExtensions = ['jpg', 'jpeg', 'png', 'gif'];

  if (validExtensions.includes(fileExtension)) {
    return cb(null, true);
  }

  cb(null, false);
};
