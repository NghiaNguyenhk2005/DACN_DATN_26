import type { Metadata } from "next";
import { Breadcrumb } from "@/components/farmery/breadcrumb";
import { ProductFilters } from "@/components/farmery/filter-sidebar";
import { ProductResults } from "@/components/farmery/product-results";
import { searchProducts } from "@/lib/data";
import { filtersToSearch, parseFilters, parseQ, toProductQuery } from "@/lib/filters";

export async function generateMetadata({ searchParams }: PageProps<"/tim-kiem">): Promise<Metadata> {
  const q = parseQ(await searchParams);
  return { title: q ? `Tìm “${q}”` : "Tìm sản phẩm" };
}

export default async function SearchPage({ searchParams }: PageProps<"/tim-kiem">) {
  const sp = await searchParams;
  const q = parseQ(sp);
  const filters = parseFilters(sp);
  const query = toProductQuery(q, filters, { limit: 20 });
  const page = await searchProducts(query);

  return (
    <div className="pb-6 pt-3.5 md:pt-5">
      <Breadcrumb items={[{ label: "Trang chủ", href: "/" }, { label: "Tìm kiếm" }]} />
      <h1 className="mb-3.5 mt-2 font-serif text-h1-sm font-bold text-ink md:mb-5 md:text-h1">
        {q ? `Kết quả cho “${q}”` : "Tất cả sản phẩm"}
      </h1>
      <ProductFilters basePath="/tim-kiem" q={q} filters={filters}>
        <ProductResults
          key={JSON.stringify(query)}
          initial={page}
          query={query}
          withSidebar
          empty={{
            title: q ? `Không tìm thấy sản phẩm cho “${q}”` : undefined,
            action: { label: "Bỏ bộ lọc", href: `/tim-kiem${filtersToSearch(q, {})}` },
          }}
        />
      </ProductFilters>
    </div>
  );
}
