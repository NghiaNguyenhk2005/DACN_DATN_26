"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import type { Schema } from "@farmery/contract";
import { AlertCircle, Loader2, PlusCircle, ShieldCheck } from "lucide-react";
import { createBatchAction } from "@/lib/data/seller-actions";

interface CreateBatchFormProps {
  products: Schema<"SellerProduct">[];
  initialProductId?: string;
}

function getDefaultHarvestDate() {
  return new Date().toISOString().slice(0, 10);
}

function getDefaultBestBefore() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().slice(0, 10);
}

export function CreateBatchForm({ products, initialProductId }: CreateBatchFormProps) {
  const [state, formAction, isPending] = useActionState(createBatchAction, null);

  const [selectedProductId, setSelectedProductId] = useState<string>(
    initialProductId && products.some((p) => p.id === initialProductId)
      ? initialProductId
      : products[0]?.id ?? "",
  );

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  const [harvestDate, setHarvestDate] = useState<string>(getDefaultHarvestDate);
  const [bestBefore, setBestBefore] = useState<string>(getDefaultBestBefore);

  return (
    <form action={formAction} className="space-y-6">
      {state && !state.ok && state.message && (
        <div className="flex items-start gap-3 rounded-xl border border-danger-line bg-danger-soft p-4 text-small text-danger-ink">
          <AlertCircle className="mt-0.5 size-5 shrink-0 text-danger" />
          <div>
            <strong className="font-semibold">Chưa thể gửi thông tin lô:</strong>
            <p className="mt-0.5">{state.message}</p>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="productId" className="block text-title font-semibold text-ink">
          Sản phẩm nông sản <span className="text-danger">*</span>
        </label>
        <select
          id="productId"
          name="productId"
          value={selectedProductId}
          onChange={(e) => setSelectedProductId(e.target.value)}
          required
          className="w-full rounded-btn border border-line bg-surface px-3.5 py-2.5 text-title text-ink shadow-2xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        >
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} (Quy cách: {p.unit})
            </option>
          ))}
        </select>
        {selectedProduct && (
          <p className="text-caption text-ink-2">
            Đơn vị tính quy ước: <strong className="font-medium text-ink">{selectedProduct.unit}</strong>
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="harvestDate" className="block text-title font-semibold text-ink">
            Ngày thu hoạch (dự kiến/thực tế) <span className="text-danger">*</span>
          </label>
          <input
            id="harvestDate"
            name="harvestDate"
            type="date"
            value={harvestDate}
            onChange={(e) => setHarvestDate(e.target.value)}
            required
            className="w-full rounded-btn border border-line bg-surface px-3.5 py-2.5 text-title text-ink shadow-2xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <p className="text-caption text-subtle">
            Có thể khai báo trước đợt thu hoạch 1-2 ngày
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor="bestBefore" className="block text-title font-semibold text-ink">
            Hạn dùng tốt nhất (Best Before) <span className="text-danger">*</span>
          </label>
          <input
            id="bestBefore"
            name="bestBefore"
            type="date"
            value={bestBefore}
            onChange={(e) => setBestBefore(e.target.value)}
            min={harvestDate}
            required
            className="w-full rounded-btn border border-line bg-surface px-3.5 py-2.5 text-title text-ink shadow-2xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <p className="text-caption text-subtle">
            Phải sau ngày thu hoạch
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="declaredQuantity" className="block text-title font-semibold text-ink">
          Sản lượng khai báo ({selectedProduct?.unit ?? "đơn vị"}) <span className="text-danger">*</span>
        </label>
        <div className="relative">
          <input
            id="declaredQuantity"
            name="declaredQuantity"
            type="number"
            min={1}
            step={1}
            defaultValue={100}
            required
            placeholder="Ví dụ: 250"
            className="w-full rounded-btn border border-line bg-surface px-3.5 py-2.5 text-title text-ink shadow-2xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <p className="text-caption text-subtle">
          Số lượng thực tế nhập kho để mở bán trên sàn thương mại điện tử
        </p>
      </div>

      <div className="rounded-xl border border-leaf-soft bg-leaf-soft/30 p-4 text-small text-ink">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
          <div className="space-y-1">
            <h4 className="font-semibold text-primary">Cơ chế kiểm duyệt và cấp mã QR tự động</h4>
            <p className="text-caption text-ink-2">
              Lô hàng sau khi tạo sẽ được đưa vào <strong>Hàng đợi kiểm duyệt</strong>. Khi bộ phận vận hành hoặc hệ thống xác nhận đạt chuẩn chỉ tiêu chất lượng, lô hàng sẽ tự động chuyển sang trạng thái <strong>Đã duyệt</strong> và sinh mã QR truy xuất độc nhất để dán lên bao bì sản phẩm.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-line/60 pt-5">
        <Link
          href="/nha-cung-cap/lo-hang"
          className="inline-flex h-11 items-center justify-center rounded-btn border border-line bg-surface px-5 text-title font-medium text-ink transition-colors hover:bg-surface-2"
        >
          Hủy bỏ
        </Link>

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-btn bg-cta px-6 text-title font-semibold text-white shadow-xs transition-colors hover:bg-cta-hover disabled:opacity-50"
        >
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              <span>Đang gửi thông tin...</span>
            </>
          ) : (
            <>
              <PlusCircle className="size-4" />
              <span>Gửi duyệt lô hàng</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
