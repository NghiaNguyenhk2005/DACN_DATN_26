import { Controller, Get, Param, Query } from "@nestjs/common";
import type { Schema } from "@farmery/contract";
import type { Category } from "./category.repository";
import type { ProductDetail, ProductSearchResult } from "./product.repository";
import { CatalogService, type TraceView } from "./catalog.service";

@Controller()
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get("categories")
  listCategories(): Promise<Category[]> {
    return this.catalog.listCategories();
  }

  @Get("products")
  searchProducts(
    @Query("q") q?: string,
    @Query("categoryId") categoryId?: string,
    @Query("region") region?: string,
    @Query("cert") cert?: Schema<"CertType">,
    @Query("inStock") inStock?: string | boolean,
    @Query("inSeason") inSeason?: string | boolean,
    @Query("minPrice") minPrice?: string | number,
    @Query("maxPrice") maxPrice?: string | number,
    @Query("cursor") cursor?: string,
    @Query("limit") limit?: string | number,
  ): Promise<ProductSearchResult> {
    const parseBool = (v: unknown): boolean | undefined => {
      if (v === undefined || v === "") return undefined;
      return String(v) === "true" || v === true;
    };
    const parseNum = (v: unknown): number | undefined => {
      if (v === undefined || v === "") return undefined;
      const parsed = Number(v);
      return Number.isNaN(parsed) ? undefined : parsed;
    };

    return this.catalog.searchProducts({
      q,
      categoryId,
      region,
      cert,
      inStock: parseBool(inStock),
      inSeason: parseBool(inSeason),
      minPrice: parseNum(minPrice),
      maxPrice: parseNum(maxPrice),
      cursor,
      limit: parseNum(limit),
    });
  }

  @Get("products/:productId")
  getProduct(@Param("productId") productId: string): Promise<ProductDetail> {
    return this.catalog.getProduct(productId);
  }

  @Get("public/trace/:traceCode")
  getPublicTrace(@Param("traceCode") traceCode: string): Promise<TraceView> {
    return this.catalog.getPublicTrace(traceCode);
  }
}
