import { ProductImage } from './product-images.entity';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

//OJO: Hay que usar el decorador @Entity de typeORM
@Entity({
  name: 'products',
})
export class Product {
  //En vez de usar un numero que autoincrementa, usamos un uuid como PK
  @PrimaryGeneratedColumn('uuid')
  id: string;

  //Tener cuidado con los types que van dentro del decorador ya que se listan todos los que estan disponibles en todos los tipos de DB que usa TypeORM (Mysql, sql, postgres, etc)
  @Column('text', { unique: true })
  title: string;

  @Column('float', {
    default: 0,
  })
  price: number;

  @Column({
    type: 'text',
    nullable: true,
  })
  description?: string;

  @Column('text', { unique: true })
  slug: string;

  @Column('int', {
    default: 0,
  })
  stock: number;

  @Column('text', {
    array: true,
  })
  sizes: string[];

  @Column('text')
  gender: string;

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
