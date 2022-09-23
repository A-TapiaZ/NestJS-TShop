import { Type } from 'class-transformer';
import { IsOptional, IsPositive, Min } from 'class-validator';

export class PaginationDto {
  @IsOptional()
  @IsPositive()
  @Type(() => Number) //Este es una alternativa al metodo que usamos en pokedex para transformar los valores implicitamente desde el middelware app.useGlobalPipes
  limit?: number;

  @IsOptional()
  @Min(0)
  @Type(() => Number)
  offset?: number;
}
