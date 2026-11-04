import Link from "next/link";
import type { Schema } from "@farmery/contract";
import { categoryHref } from "@/lib/slug";
import { SafeImage } from "./safe-image";

/**
 * "Mua theo danh mục" ở trang chủ. ≥md: lưới 5 cột. <md: slider cuộn ngang có snap, ô rộng 40% để thấy 2,5 ô
 * (gợi ý vuốt), không mũi tên.
 */
export function CategoryTiles({ categories }: { categories: Schema<"Category">[] }) {
  if (categories.length === 0) return null;
  return (
    <section className="pt-6 md:pt-10" aria-labelledby="mua-theo-danh-muc">
      <h2 id="mua-theo-danh-muc" className="mb-3 text-h2-sm font-bold text-ink md:mb-4 md:text-h2">
        Mua theo danh mục
      </h2>
      <ul className="scrollbar-none -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-5 md:gap-4 md:overflow-visible md:px-0">
        {categories.map((c) => (
          <li key={c.id} className="w-[40%] flex-none snap-start md:w-auto">
            <Link
              href={categoryHref(c)}
              className="group block overflow-hidden rounded-card border-[1.5px] border-line-strong bg-background text-ink hover:border-primary hover:text-ink"
            >
              <span className="relative block aspect-[4/3] bg-surface">
                <SafeImage
                  src={c.imageUrl}
                  alt=""
                  fill
                  sizes="(min-width:768px) 20vw, 40vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </span>
              <span className="block px-3 py-2.5">
                <span className="block text-title font-semibold leading-snug">{c.name}</span>
                {c.productCount !== undefined && (
                  <span className="mt-0.5 block text-caption text-muted-foreground">{c.productCount} sản phẩm</span>
                )}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
