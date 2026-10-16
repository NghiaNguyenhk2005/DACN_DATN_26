import Link from "next/link";
import { Leaf } from "lucide-react";
import type { Schema } from "@farmery/contract";
import { Button } from "@/components/ui/button";
import { formatVnd } from "@/lib/format";
import { CERT_LABELS } from "@/lib/labels";
import { productHref } from "@/lib/slug";
import { SafeImage } from "./safe-image";

/**
 * Thẻ sản phẩm. Viền 1.5px #d5ddd0, bo 12px, không đổ bóng.
 * Ảnh: cao 150px (desktop) / 120px (mobile). Nút Thêm giữ đúng vị trí, chưa nối giỏ hàng.
 */
export function ProductCard({ product: p }: { product: Schema<"ProductCard"> }) {
  const href = productHref(p);
  const cert = p.certifications[0];
  const soldOut = !p.listing || p.listing.available <= 0;

  return (
    <article className="flex flex-col overflow-hidden rounded-card border-[1.5px] border-line-strong bg-background">
      <Link href={href} className="relative block h-[120px] md:h-[150px]" aria-label={p.name}>
        <SafeImage
          src={p.imageUrl}
          alt={p.name}
          fill
          sizes="(min-width:1280px) 20vw, (min-width:1024px) 25vw, 50vw"
          className="object-cover"
        />
        {cert && (
          <span className="absolute left-2 top-2 rounded-tag bg-primary/90 px-2 py-[3px] text-[10.5px] font-semibold text-white">
            {CERT_LABELS[cert]}
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-[5px] p-[11px] md:p-[13px]">
        <h3 className="text-[13.5px] font-semibold leading-[1.35] text-ink md:text-title">
          <Link href={href} className="text-ink hover:text-ink">
            {p.name}
          </Link>
        </h3>
        <p className="truncate text-[12px] text-muted-foreground">{p.supplier.displayName}</p>
        {p.inSeason && (
          <p className="flex items-center gap-[5px] text-micro font-medium text-success">
            <Leaf className="size-3" aria-hidden /> Đang vào mùa
          </p>
        )}
        <p className="mt-1 flex flex-wrap items-baseline gap-x-1.5">
          {p.listing ? (
            <>
              <span className="text-[15px] font-bold text-ink md:text-price">{formatVnd(p.listing.unitPrice)}</span>
              <span className="text-[12px] text-muted-foreground">/ {p.listing.saleUnit}</span>
            </>
          ) : (
            <span className="text-small font-semibold text-muted-foreground">Chưa mở bán</span>
          )}
        </p>
        {p.listing && soldOut && <p className="text-micro font-semibold text-danger">Hết hàng</p>}
        <div className="mt-auto pt-2 md:flex md:justify-end md:pt-[9px]">
          <Button
            type="button"
            variant="outline"
            disabled={soldOut}
            className="h-10 w-full rounded-[7px] border-chip bg-transparent px-[11px] text-[13px] font-semibold text-primary hover:bg-surface hover:text-primary md:h-auto md:w-auto md:py-1.5 md:text-[12px]"
          >
            <span className="md:hidden">Thêm vào giỏ</span>
            <span className="hidden md:inline">Thêm</span>
          </Button>
        </div>
      </div>
    </article>
  );
}
