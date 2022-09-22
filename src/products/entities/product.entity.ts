import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

//OJO: Hay que usar el decorador @Entity de typeORM
@Entity()
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
}
