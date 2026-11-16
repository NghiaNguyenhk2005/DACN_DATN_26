import { Injectable } from "@nestjs/common";
import { CategoryRepository } from "../category.repository";
import { ProductRepository } from "../product.repository";
import { fold, tokenize, type Token } from "./text-match";

export interface SearchHit {
  productId: string;
  score: number;
}

/** Một sản phẩm công khai đã tách từ sẵn, dùng chung cho các bộ tìm trong bộ nhớ. */
export interface SearchDoc {
  id: string;
  name: Token[];
  /** Tên sản phẩm bỏ dấu, bỏ khoảng trắng — khớp kiểu gõ liền "dautay". */
  nameCompact: string;
  leafCategory: Token[];
  /** Tên danh mục lá và cha, bỏ dấu, nguyên chuỗi. */
  categoryKeys: string[];
  description: Token[];
  certifications: string[];
}

export const categoryKey = (name: string) => fold(name).replace(/\s+/g, " ").trim();

@Injectable()
export class SearchCorpus {
  constructor(
    private readonly products: ProductRepository,
    private readonly categories: CategoryRepository,
  ) {}

  async docs(): Promise<SearchDoc[]> {
    const [records, tree] = await Promise.all([this.products.listPublicRecords(), this.categories.findTree()]);
    const parentOf = new Map<string, string>();
    for (const parent of tree) for (const child of parent.children) parentOf.set(child.id, parent.name);
    return records.map((p) => {
      const leaf = p.categoryName ?? "";
      const parent = p.categoryId ? parentOf.get(p.categoryId) : undefined;
      return {
        id: p.id,
        name: tokenize(p.name),
        nameCompact: fold(p.name).replace(/[^\p{L}\p{N}]+/gu, ""),
        leafCategory: tokenize(leaf),
        categoryKeys: [leaf, parent].filter((c): c is string => Boolean(c)).map(categoryKey),
        description: tokenize(p.description ?? ""),
        certifications: p.certifications.map((c) => c.toLowerCase()),
      };
    });
  }
}
