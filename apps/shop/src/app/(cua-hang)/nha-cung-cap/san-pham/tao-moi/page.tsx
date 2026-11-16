import { randomUUID } from "node:crypto";
import type { Metadata } from "next";
import Link from "next/link";
import type { Schema } from "@farmery/contract";
import { ArrowLeft } from "lucide-react";
import { getCategories } from "@/lib/data";
import { getSellerCertifications } from "@/lib/data/seller";
import { CreateProductForm, type CategoryOption } from "./create-product-form";

export const metadata: Metadata = { title: "Đăng sản phẩm" };

function leafOptions(categories: Schema<"Category">[], parents: string[] = []): CategoryOption[] {
  return categories.flatMap((c) =>
    c.isLeaf || c.children.length === 0
      ? [{ id: c.id, label: [...parents, c.name].join(" › ") }]
      : leafOptions(c.children, [...parents, c.name]),
  );
}

export default async function NewProductPage() {
  const [categories, certifications] = await Promise.all([getCategories(), getSellerCertifications().catch(() => [])]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <Link href="/nha-cung-cap/san-pham" className="inline-flex items-center gap-1.5 self-start text-small font-medium text-ink-2 hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden /> Sản phẩm của tôi
      </Link>
      <section className="rounded-panel border border-line p-5 sm:p-7">
        <h2 className="text-h2-sm font-bold text-ink md:text-h2">Đăng sản phẩm</h2>
        <p className="mb-5 mt-1 text-small text-ink-2">Sản phẩm được duyệt mới dùng để khai báo lô và mở bán. Thường có kết quả trong 48 giờ.</p>
        <CreateProductForm categories={leafOptions(categories)} idempotencyKey={randomUUID()} certifications={certifications} />
      </section>
    </div>
  );
}
