import { Injectable } from '@nestjs/common';
import { ProductsService } from '../products/products.service';
import { initialData } from './data/seed-data';

@Injectable()
export class SeedService {
  constructor(private readonly productService: ProductsService) {}

  async runSeed() {
    await this.insertNewProducts();
  }

  private async insertNewProducts() {
    await this.productService.deleteAllProducts();

    const promisesArray = initialData.products.map((prod) => {
      return this.productService.create(prod);
    });

    return await Promise.all(promisesArray);
  }
}
