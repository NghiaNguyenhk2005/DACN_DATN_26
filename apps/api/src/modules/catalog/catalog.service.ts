import { Injectable } from "@nestjs/common";
import { CategoryRepository, type Category } from "./category.repository";

@Injectable()
export class CatalogService {
  constructor(private readonly categories: CategoryRepository) {}

  listCategories(): Promise<Category[]> {
    return this.categories.findTree();
  }
}
