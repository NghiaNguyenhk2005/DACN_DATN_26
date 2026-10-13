import { Injectable } from "@nestjs/common";
import { createSeed } from "@farmery/mock-data";
import { DemoResetRegistry, type Resettable } from "../../core/demo-reset.registry";
import { CategoryRepository, type Category } from "./category.repository";

@Injectable()
export class InMemoryCategoryRepository extends CategoryRepository implements Resettable {
  private categories: Category[] = createSeed().categories;

  constructor(registry: DemoResetRegistry) {
    super();
    registry.register(this);
  }

  reset(): void {
    this.categories = createSeed().categories;
  }

  async findTree(): Promise<Category[]> {
    return structuredClone(this.categories);
  }
}
