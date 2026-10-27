import Link from "next/link";
import { FilterChip } from "@/components/farmery/filter-chip";
import { ProductResults } from "@/components/farmery/product-results";
import { SafeImage } from "@/components/farmery/safe-image";
import { TraceLookup } from "@/components/farmery/trace-lookup";
import { searchProducts } from "@/lib/data";
import { filtersToSearch, REGION_OPTIONS, type ProductQuery } from "@/lib/filters";

const QUICK_FILTERS = [
  { label: "VietGAP", href: `/tim-kiem${filtersToSearch(undefined, { cert: "VietGAP" })}` },
  { label: "Hữu cơ", href: `/tim-kiem${filtersToSearch(undefined, { cert: "organic" })}` },
  { label: "OCOP", href: `/tim-kiem${filtersToSearch(undefined, { cert: "OCOP" })}` },
  { label: "Còn hàng", href: `/tim-kiem${filtersToSearch(undefined, { inStock: true })}` },
  ...REGION_OPTIONS.map((r) => ({ label: r, href: `/tim-kiem${filtersToSearch(undefined, { region: r })}` })),
];

/**
 * Trang chủ theo mùa. ≥lg: hàng [hero 1fr | tra nguồn gốc 336px] gap 20px, hero cao 320px.
 * <lg: hero cao 240px, chữ ở đáy ảnh, ô tra nguồn gốc xếp dưới hero.
 */
export default async function HomePage() {
  const query: ProductQuery = { inSeason: true, limit: 10 };
  const page = await searchProducts(query);
  const heroImage = page.items.find((p) => p.imageUrl)?.imageUrl;

  return (
    <>
      <div className="grid gap-3.5 pt-4 md:pt-6 lg:grid-cols-[1fr_336px] lg:gap-5">
        <section className="relative h-60 overflow-hidden rounded-panel bg-dark lg:h-80">
          {heroImage && (
            <SafeImage src={heroImage} alt="" fill priority sizes="(min-width:1024px) 70vw, 100vw" className="object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[rgba(15,32,20,.88)] via-[rgba(15,32,20,.35)] to-[rgba(15,32,20,.1)] lg:bg-gradient-to-r lg:from-[rgba(15,32,20,.86)] lg:via-[rgba(15,32,20,.5)] lg:to-[rgba(15,32,20,.1)]" />
          <div className="absolute inset-x-0 bottom-0 max-w-[560px] p-5 lg:inset-y-0 lg:flex lg:flex-col lg:justify-center lg:p-11">
            <h1 className="mb-2 font-serif text-display-sm font-bold text-white lg:mb-3 lg:text-display">
              Nông sản Đà Lạt vào mùa, giao tận bếp nhà bạn
            </h1>
            <p className="mb-3.5 max-w-[430px] text-small leading-[1.55] text-[#d7e2d1] lg:mb-[22px] lg:text-title lg:leading-[1.6]">
              Đặt thẳng từ nhà vườn và hợp tác xã. Biết rõ ai trồng, trồng ở đâu, thu hoạch ngày nào.
            </p>
            <Link
              href="/tim-kiem"
              className="inline-block self-start rounded-btn bg-cta px-5 py-[11px] text-title font-semibold text-white hover:bg-cta-hover hover:text-white lg:px-[22px] lg:py-3"
            >
              Đi chợ hôm nay
            </Link>
          </div>
        </section>
        <div id="tra-nguon-goc" className="scroll-mt-4">
          <TraceLookup className="h-full" />
        </div>
      </div>

      <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 py-4 md:mx-0 md:px-0 lg:flex-wrap lg:pb-0 lg:pt-5">
        {QUICK_FILTERS.map((f) => (
          <FilterChip key={f.href} label={f.label} href={f.href} />
        ))}
      </div>

      <section className="pt-1 md:pt-10" aria-labelledby="dang-vao-mua">
        <div className="mb-3 flex items-baseline justify-between md:mb-4">
          <h2 id="dang-vao-mua" className="text-h2-sm font-bold text-ink md:text-h2">
            Đang vào mùa
          </h2>
          <Link href={`/tim-kiem${filtersToSearch(undefined, { inSeason: true })}`} className="text-small font-semibold">
            Xem tất cả
          </Link>
        </div>
        <ProductResults
          initial={page}
          query={query}
          empty={{ title: "Chưa có sản phẩm vào mùa", description: "Xem toàn bộ sản phẩm đang bán.", action: { label: "Xem tất cả sản phẩm", href: "/tim-kiem" } }}
        />
      </section>
    </>
  );
}
