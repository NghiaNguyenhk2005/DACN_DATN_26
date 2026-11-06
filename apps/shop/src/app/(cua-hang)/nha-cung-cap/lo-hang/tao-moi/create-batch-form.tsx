"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { AlertCircle, AlertTriangle, Loader2, ShieldCheck } from "lucide-react";
import type { Schema } from "@farmery/contract";
import { createBatchAction } from "@/lib/data/seller-actions";
import { formatDateVi } from "@/lib/format";
import { CERT_LABELS } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { sellerField, sellerLabel } from "../../certification-form";

export type BatchProductOption = { id: string; name: string; unit: string; shelfDays: number };

const QUICK_DAYS = [3, 5, 7, 14];

function addDays(date: string, days: number) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Khai báo lô (design/05 N3): sản phẩm → ngày thu hoạch → hạn sử dụng (gợi ý theo danh mục, chip +N ngày) → sản lượng
 * theo đơn vị bán → chứng nhận đi kèm lô (chỉ đọc, cảnh báo nếu hết hiệu lực trước hạn sử dụng).
 */
function newUuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
    (+c ^ (Math.floor(Math.random() * 16) & (15 >> (+c / 4)))).toString(16),
  );
}

export function CreateBatchForm(
{
  products,
  initialProductId,
  certifications,
  today,
}: {
  products: BatchProductOption[];
  initialProductId?: string;
  certifications: Schema<"SellerCertification">[];
  today: string;
}) {
  const [state, formAction, isPending] = useActionState(createBatchAction, null);
  // Idempotency key ổn định trong vòng đời render, tránh gửi trùng khi mạng chập chờn
  const [idempotencyKey] = useState(() => newUuid());
  const [productId, setProductId] = useState(
    initialProductId && products.some((p) => p.id === initialProductId) ? initialProductId : (products[0]?.id ?? ""),
  );
  const product = products.find((p) => p.id === productId);
  const [harvestDate, setHarvestDate] = useState(today);
  const [shelfDays, setShelfDays] = useState(product?.shelfDays ?? 7);
  const bestBefore = addDays(harvestDate, shelfDays);
  const approved = certifications.filter((c) => c.status === "approved");

  if (products.length === 0) {
    return (
      <p className="rounded-card border border-dashed border-line-strong px-5 py-6 text-small text-ink-2">
        Chưa có sản phẩm nào được duyệt. <Link href="/nha-cung-cap/san-pham/tao-moi">Đăng sản phẩm</Link> trước, sản phẩm được duyệt mới
        khai báo lô được.
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
      {state && !state.ok && state.message && (
        <p role="alert" className="flex items-start gap-2.5 rounded-card border border-danger-line bg-danger-soft px-4 py-3 text-small text-danger-ink">
          <AlertCircle className="mt-0.5 size-5 flex-none text-danger" aria-hidden />
          <span>
            <strong className="font-semibold">Chưa gửi được lô.</strong> {state.message}
          </span>
        </p>
      )}

      <label className="flex flex-col gap-1.5">
        <span className={sellerLabel}>
          Sản phẩm <span className="text-danger">*</span>
        </span>
        <select
          name="productId"
          value={productId}
          onChange={(e) => {
            setProductId(e.target.value);
            setShelfDays(products.find((p) => p.id === e.target.value)?.shelfDays ?? 7);
          }}
          required
          className={sellerField}
        >
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className={sellerLabel}>
            Ngày thu hoạch <span className="text-danger">*</span>
          </span>
          <input name="harvestDate" type="date" value={harvestDate} max={addDays(today, 2)} onChange={(e) => setHarvestDate(e.target.value)} required className={sellerField} />
          <span className="text-small text-ink-2">Khai trước được 1–2 ngày nếu sắp thu hoạch.</span>
        </label>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="bestBefore" className={sellerLabel}>
            Hạn sử dụng <span className="text-danger">*</span>
          </label>
          <input
            id="bestBefore"
            name="bestBefore"
            type="date"
            value={bestBefore}
            min={addDays(harvestDate, 1)}
            onChange={(e) => {
              const days = Math.round((Date.parse(e.target.value) - Date.parse(harvestDate)) / 86_400_000);
              if (Number.isFinite(days)) setShelfDays(days);
            }}
            required
            className={sellerField}
          />
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Chọn nhanh số ngày hạn sử dụng">
            {[...new Set([product?.shelfDays ?? 7, ...QUICK_DAYS])]
              .filter((d) => d <= 60)
              .sort((a, b) => a - b)
              .map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setShelfDays(d)}
                  aria-pressed={shelfDays === d}
                  className={cn(
                    "min-h-9 rounded-full border px-3 text-small",
                    shelfDays === d ? "border-chip bg-surface font-semibold text-primary" : "border-line text-ink-2",
                  )}
                >
                  +{d} ngày{d === product?.shelfDays ? " (gợi ý)" : ""}
                </button>
              ))}
          </div>
        </div>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className={sellerLabel}>
          Sản lượng <span className="text-danger">*</span>
        </span>
        <span className="flex items-center rounded-btn border border-line-strong focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/30">
          <input
            name="declaredQuantity"
            type="number"
            inputMode="decimal"
            min={0.001}
            step="any"
            required
            placeholder="Ví dụ: 250 hoặc 0,5"
            className="w-full min-w-0 rounded-btn bg-transparent px-3.5 py-2.5 text-title text-ink outline-none"
          />
          <span className="flex-none px-3.5 text-title text-ink-2">{product?.unit}</span>
        </span>
        <span className="text-small text-ink-2">Số đơn vị bán thu hoạch được trong lô này.</span>
      </label>

      <section className="rounded-card border border-line p-4" aria-labelledby="cn-di-kem">
        <h3 id="cn-di-kem" className="flex items-center gap-2 text-title font-semibold text-ink">
          <ShieldCheck className="size-5 text-primary" aria-hidden /> Chứng nhận đi kèm lô
        </h3>
        {approved.length === 0 ? (
          <p className="mt-1.5 text-small text-ink-2">
            Chưa có chứng nhận đã duyệt. <Link href="/nha-cung-cap/ho-so">Khai báo chứng nhận</Link> để lô có nhãn chứng nhận.
          </p>
        ) : (
          <ul className="mt-2 flex flex-col gap-1.5">
            {approved.map((c) => {
              const lapses = c.expiryDate < bestBefore;
              return (
                <li key={c.id} className="flex flex-wrap items-center gap-x-2 text-small text-ink-2">
                  <strong className="text-ink">{CERT_LABELS[c.type]}</strong>
                  <span>hiệu lực đến {formatDateVi(c.expiryDate)}</span>
                  {lapses && (
                    <span className="inline-flex items-center gap-1 font-semibold text-warning">
                      <AlertTriangle className="size-4" aria-hidden /> hết hiệu lực trước hạn sử dụng của lô
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        <p className="mt-2 text-small text-ink-2">Kiểm duyệt viên đối chiếu lô với nhật ký và chứng nhận, thường trong 48 giờ; duyệt xong lô có mã QR để in tem.</p>
      </section>

      <div className="flex items-center justify-end gap-3 border-t border-line pt-5">
        <Link href="/nha-cung-cap/lo-hang" className="inline-flex h-12 items-center rounded-btn border border-line-strong px-5 text-title font-medium text-ink hover:bg-surface hover:text-ink">
          Hủy
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex h-12 items-center gap-2 rounded-btn bg-cta px-6 text-title font-semibold text-white hover:bg-cta-hover disabled:opacity-50"
        >
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden /> Đang gửi…
            </>
          ) : (
            "Gửi duyệt"
          )}
        </button>
      </div>
    </form>
  );
}
