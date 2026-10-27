import { randomUUID } from "node:crypto";
import Link from "next/link";
import type { Schema } from "@farmery/contract";
import { ArrowLeft, PackagePlus } from "lucide-react";
import { getCategories } from "@/lib/data";
import { CreateProductForm, type CategoryOption } from "./create-product-form";

function leafOptions(categories: Schema<"Category">[], parents: string[] = []): CategoryOption[] {
  return categories.flatMap((c) =>
    c.isLeaf || c.children.length === 0
      ? [{ id: c.id, label: [...parents, c.name].join(" › ") }]
      : leafOptions(c.children, [...parents, c.name]),
  );
}

export default async function NewProductPage() {
  const categories = leafOptions(await getCategories());

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href="/nha-cung-cap"
          className="inline-flex items-center gap-1.5 text-small font-medium text-ink-2 transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-4" />
          <span>Quay lại sản phẩm của tôi</span>
        </Link>
      </div>

      <div className="rounded-2xl border border-line bg-surface p-6 shadow-2xs sm:p-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 text-primary">
            <PackagePlus className="size-5" />
            <span className="text-small font-semibold uppercase tracking-wider">Đăng ký mặt hàng</span>
          </div>
          <h2 className="mt-1 font-heading text-h2 font-bold text-ink">Đăng sản phẩm mới</h2>
          <p className="mt-1 text-small text-ink-2">
            Sản phẩm mới cần được kiểm duyệt trước khi dùng để khai báo lô thu hoạch và mở bán.
          </p>
        </div>

        <CreateProductForm categories={categories} idempotencyKey={randomUUID()} />
      </div>
    </div>
  );
}
