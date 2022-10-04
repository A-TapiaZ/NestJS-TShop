import { Product } from '../../products/entities/product.entity';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { unique: true })
  email: string;

  //select: Indicates if column is always selected by QueryBuilder and find operations. Default value is "true".
  @Column('text', { select: false })
  password: string;

  @Column('text')
  fullName: string;

  @Column('boolean', { default: true })
  isActive: boolean;

  @Column('text', { array: true, default: ['user'] })
  roles: string[];

  @OneToMany(() => Product, (product) => product.user)
  product: Product;

  @BeforeInsert()
  transformBeforeInsert() {
    //quitamos espacios y pasamos a minuscula el correo.
    this.email = this.email.toLowerCase().trim();
  }

  @BeforeUpdate()
  transformBeforeUpdate() {
    this.transformBeforeInsert();
  }
}
