import { Inject, Injectable } from "@nestjs/common";
import { PRISMA_CLIENT, type PrismaClient } from "../../core/prisma";
import { CategoryRepository, type Category } from "./category.repository";

// Bản PostgreSQL của CategoryRepository (schema catalog); chưa có imageUrl vì bảng categories không có cột ảnh.
@Injectable()
export class PrismaCategoryRepository extends CategoryRepository {
  constructor(@Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient) {
    super();
  }

  async findTree(): Promise<Category[]> {
    const rows = await this.prisma.category.findMany({ orderBy: { id: "asc" } });
    const nodes = new Map<string, Category>(
      rows.map((r) => [r.id.toString(), { id: r.id.toString(), name: r.name, isLeaf: r.isLeaf, children: [] }]),
    );
    const roots: Category[] = [];
    for (const r of rows) {
      const node = nodes.get(r.id.toString())!;
      const parent = r.parentId === null ? undefined : nodes.get(r.parentId.toString());
      (parent ? parent.children : roots).push(node);
    }
    return roots;
  }
}
