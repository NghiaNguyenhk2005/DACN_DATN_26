"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { SafeImage } from "./safe-image";

/** Ảnh sản phẩm: ≥md ảnh lớn + ảnh nhỏ 84×70 (đang chọn viền 2px #1f5132); mobile full-width cao 300px + chấm phân trang. */
export function ProductGallery({ images, alt }: { images: string[]; alt: string }) {
  const [active, setActive] = useState(0);
  const list = images.length > 0 ? images : [null];

  return (
    <div>
      <div className="relative -mx-4 h-[300px] overflow-hidden md:mx-0 md:rounded-panel lg:h-[400px]">
        <SafeImage
          src={list[active]}
          alt={alt}
          fill
          priority
          sizes="(min-width:1024px) 520px, 100vw"
          className="object-cover"
        />
      </div>
      {list.length > 1 && (
        <>
          <div className="mt-2.5 flex justify-center gap-1.5 md:hidden" role="tablist" aria-label="Chọn ảnh">
            {list.map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === active}
                aria-label={`Ảnh ${i + 1}`}
                onClick={() => setActive(i)}
                className="grid h-6 place-items-center px-0.5"
              >
                <span className={cn("block h-1.5 rounded-full", i === active ? "w-5 bg-primary" : "w-1.5 bg-line-strong")} />
              </button>
            ))}
          </div>
          <ul className="mt-3 hidden gap-2.5 md:flex">
            {list.map((src, i) => (
              <li key={i}>
                <button
                  type="button"
                  aria-label={`Xem ảnh ${i + 1}`}
                  aria-pressed={i === active}
                  onClick={() => setActive(i)}
                  className={cn(
                    "relative block h-[70px] w-[84px] overflow-hidden rounded-[9px] border-2",
                    i === active ? "border-primary" : "border-transparent",
                  )}
                >
                  <SafeImage src={src} alt="" fill sizes="84px" className="object-cover" />
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
