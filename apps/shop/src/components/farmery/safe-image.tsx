"use client";

import { useState } from "react";
import Image, { type ImageProps } from "next/image";
import { ImageOff } from "lucide-react";
import { isAllowedImageHost } from "@/lib/image-hosts";
import { cn } from "@/lib/utils";

type Props = Omit<ImageProps, "src" | "alt"> & { src: string | null | undefined; alt: string };

/**
 * Ảnh sản phẩm/nhà vườn từ API. Không có ảnh hoặc tải lỗi → ô thay thế, không vỡ trang.
 * Host ngoài danh sách `remotePatterns` thì bỏ tối ưu ảnh thay vì để Next báo lỗi.
 */
export function SafeImage({ src, alt, className, fill, ...rest }: Props) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (!src || failedSrc === src) {
    return (
      <span
        role="img"
        aria-label={alt}
        className={cn("grid place-items-center bg-surface-2 text-faint", fill && "absolute inset-0", className)}
      >
        <ImageOff className="size-6" aria-hidden />
      </span>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      unoptimized={!isAllowedImageHost(src)}
      onError={() => setFailedSrc(src)}
      className={className}
      {...rest}
    />
  );
}
