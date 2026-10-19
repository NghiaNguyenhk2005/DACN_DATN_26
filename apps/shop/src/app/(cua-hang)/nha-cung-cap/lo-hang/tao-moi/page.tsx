import Link from "next/link";
import { ArrowLeft, PlusCircle } from "lucide-react";
import { getSellerProducts } from "@/lib/data/seller";
import { CreateBatchForm } from "./create-batch-form";

interface PageProps {
  searchParams: Promise<{
    productId?: string;
  }>;
}

export default async function NewBatchPage({ searchParams }: PageProps) {
  const { productId } = await searchParams;
  const products = await getSellerProducts();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href="/nha-cung-cap/lo-hang"
          className="inline-flex items-center gap-1.5 text-small font-medium text-ink-2 transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-4" />
          <span>Quay lại danh sách lô</span>
        </Link>
      </div>

      <div className="rounded-2xl border border-line bg-surface p-6 shadow-2xs sm:p-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 text-primary">
            <PlusCircle className="size-5" />
            <span className="text-small font-semibold uppercase tracking-wider">
              Khai báo nguồn cung
            </span>
          </div>
          <h2 className="mt-1 font-heading text-h2 font-bold text-ink">
            Tạo lô thu hoạch mới
          </h2>
          <p className="mt-1 text-small text-ink-2">
            Nhập chi tiết đợt thu hoạch nông sản sạch để nộp hồ sơ kiểm định an toàn và phát hành mã QR truy xuất nguồn gốc.
          </p>
        </div>

        <CreateBatchForm products={products} initialProductId={productId} />
      </div>
    </div>
  );
}
