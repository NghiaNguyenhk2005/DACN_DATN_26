import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Schema } from "@farmery/contract";
import { getCategories } from "@/lib/data";
import { getSellerCertifications, getSellerProducts } from "@/lib/data/seller";
import { suggestedShelfDays, todayVn } from "@/lib/decision";
import { CreateBatchForm, type BatchProductOption } from "./create-batch-form";

export const metadata: Metadata = { title: "Khai báo lô" };

/** Tên danh mục cấp 1 theo id danh mục lá, để gợi ý số ngày hạn sử dụng. */
function rootNames(tree: Schema<"Category">[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const root of tree) {
    map.set(root.id, root.name);
    for (const c of root.children) map.set(c.id, root.name);
  }
  return map;
}

export default async function NewBatchPage({ searchParams }: PageProps<"/nha-cung-cap/lo-hang/tao-moi">) {
  const sp = await searchParams;
  const productId = typeof sp.productId === "string" ? sp.productId : undefined;
  const [products, categories, certifications] = await Promise.all([
    getSellerProducts(),
    getCategories().catch(() => []),
    getSellerCertifications().catch(() => []),
  ]);
  const roots = rootNames(categories);
  const options: BatchProductOption[] = products
    .filter((p) => p.status === "approved")
    .map((p) => ({ id: p.id, name: p.name, unit: p.unit, shelfDays: suggestedShelfDays(roots.get(p.categoryId)) }));

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <Link href="/nha-cung-cap/lo-hang" className="inline-flex items-center gap-1.5 self-start text-small font-medium text-ink-2 hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden /> Danh sách lô
      </Link>
      <section className="rounded-panel border border-line p-5 sm:p-7">
        <h2 className="text-h2-sm font-bold text-ink md:text-h2">Khai báo lô thu hoạch</h2>
        <p className="mb-5 mt-1 text-small text-ink-2">Mỗi đợt thu hoạch là một lô. Lô được duyệt có mã QR để in tem và mở bán.</p>
        <CreateBatchForm products={options} initialProductId={productId} certifications={certifications} today={todayVn()} />
      </section>
    </div>
  );
}
