import { ProductImage } from './product-images.entity';
import { User } from '../../auth/entities/user.entity';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

//OJO: Hay que usar el decorador @Entity de typeORM, y la propiedad name es el nombre con la cual queremos que quede nombrada la tabla en la DB.
@Entity({
  name: 'products',
})
export class Product {
  //En vez de usar un numero que autoincrementa, usamos un uuid como PK
  @ApiProperty({
    example: 'ui123-3123sdasd-s54dad3as',
    uniqueItems: true,
    description: 'Product id',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  //Tener cuidado con los types que van dentro del decorador ya que se listan todos los que estan disponibles en todos los tipos de DB que usa TypeORM (Mysql, sql, postgres, etc)
  @ApiProperty({})
  @Column('text', { unique: true })
  title: string;

  @ApiProperty({})
  @Column('float', {
    default: 0,
  })
  price: number;

  @ApiProperty({})
  @Column({
    type: 'text',
    nullable: true,
  })
  description?: string;

  @ApiProperty({})
  @Column('text', { unique: true })
  slug: string;

  @ApiProperty({})
  @Column('int', {
    default: 0,
  })
  stock: number;

  @ApiProperty({})
  @Column('text', {
    array: true,
  })
  sizes: string[];

  @ApiProperty({})
  @Column('text')
  gender: string;

  @ApiProperty({})
  @Column('text', {
    array: true,
    default: [],
  })
  tags: string[];

  //Cascade es para que las acciones que realicemos en nuestra DB se hagan en cascada
  //eager: es una configuracion que habilita la consulta con relaciones usando cualquier metodo find*
  @OneToMany(() => ProductImage, (productImage) => productImage.product, {
    cascade: true,
    eager: true,
  })
  images?: ProductImage[];

  //eager: es una configuracion que habilita la consulta con relaciones usando cualquier metodo find*
  @ManyToOne(() => User, (user) => user.product, { eager: true })
  user: User;

  @BeforeInsert()
  checkSlugInsert() {
    if (!this.slug) {
      this.slug = this.title
        .toLowerCase()
        .replaceAll(' ', '_')
        .replaceAll("'", '');
    } else {
      this.slug = this.slug
        .toLowerCase()
        .replaceAll(' ', '_')
        .replaceAll("'", '');
    }
  }

  @BeforeUpdate()
  checkSlugUpdate() {
    this.slug = this.slug
      .toLowerCase()
      .replaceAll(' ', '_')
      .replaceAll("'", '');
  }
}
