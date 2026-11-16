import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Breadcrumb } from "@/components/farmery/breadcrumb";
import { ProductFilters } from "@/components/farmery/filter-sidebar";
import { ProductResults } from "@/components/farmery/product-results";
import { getSearchSuggest, searchProducts } from "@/lib/data";
import {
  countFilters,
  filtersFromInterpretation,
  filtersToSearch,
  parseFilters,
  parseQ,
  toProductQuery,
  type RawSearchParams,
} from "@/lib/filters";

export async function generateMetadata({ searchParams }: PageProps<"/tim-kiem">): Promise<Metadata> {
  const q = parseQ(await searchParams);
  return { title: q ? `Tìm “${q}”` : "Tìm sản phẩm" };
}

const one = (sp: RawSearchParams, key: string) => {
  const v = sp[key];
  return (Array.isArray(v) ? v[0] : v)?.trim() || undefined;
};

/**
 * Tìm kiếm. Câu tìm có cụm lọc ("hữu cơ", "dưới 200k", "Đơn Dương") và chưa có bộ lọc nào → chuyển sang URL có bộ lọc
 * tương ứng, giữ câu gốc ở `tu` để hiện "Đã hiểu …"; `nguyen-van=1` để tìm đúng câu gốc.
 */
export default async function SearchPage({ searchParams }: PageProps<"/tim-kiem">) {
  const sp = await searchParams;
  const q = parseQ(sp);
  const filters = parseFilters(sp);
  const literal = one(sp, "nguyen-van") === "1";
  const understoodFrom = one(sp, "tu");

  const suggest = q ? await getSearchSuggest(q).catch(() => null) : null;
  const interp = suggest?.interpretation;
  if (q && interp && interp.phrases.length > 0 && !literal && countFilters(filters) === 0 && !filters.inStock && !filters.inSeason) {
    const target = filtersToSearch(interp.keywords || undefined, filtersFromInterpretation(interp));
    redirect(`/tim-kiem${target}${target ? "&" : "?"}tu=${encodeURIComponent(q)}`);
  }

  const query = toProductQuery(q, filters, { limit: 20 });
  const page = await searchProducts(query);
  const correction = page.items.length === 0 ? suggest?.correction : null;

  return (
    <div className="pb-6 pt-3.5 md:pt-5">
      <Breadcrumb items={[{ label: "Trang chủ", href: "/" }, { label: "Tìm kiếm" }]} />
      <h1 className="mb-3.5 mt-2 font-serif text-h1-sm font-bold text-ink md:mb-5 md:text-h1">
        {q ? `Kết quả cho “${q}”` : understoodFrom ? `Kết quả cho “${understoodFrom}”` : "Tất cả sản phẩm"}
      </h1>
      {understoodFrom && (
        <p className="-mt-1.5 mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-tile bg-surface px-3.5 py-2.5 text-small text-ink-2 md:-mt-2.5">
          <Sparkles className="size-4 flex-none text-primary" aria-hidden />
          <span>Đã chuyển phần mô tả trong câu tìm thành bộ lọc bên dưới.</span>
          <Link href={`/tim-kiem?q=${encodeURIComponent(understoodFrom)}&nguyen-van=1`} className="font-semibold">
            Tìm đúng nguyên văn “{understoodFrom}”
          </Link>
        </p>
      )}
      {correction && (
        <p className="mb-4 text-title text-ink-2">
          Có phải bạn muốn tìm{" "}
          <Link href={`/tim-kiem?q=${encodeURIComponent(correction)}`} className="font-semibold">
            “{correction}”
          </Link>
          ?
        </p>
      )}
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
