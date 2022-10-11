import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsPositive, Min } from 'class-validator';

export class PaginationDto {
  @ApiProperty({ default: 10, description: 'Results Quantity' })
  @IsOptional()
  @IsPositive()
  @Type(() => Number) //Este es una alternativa al metodo que usamos en pokedex para transformar los valores implicitamente desde el middelware app.useGlobalPipes
  limit?: number;

  @ApiProperty({ default: 0, description: 'Results start' })
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  offset?: number;
}
