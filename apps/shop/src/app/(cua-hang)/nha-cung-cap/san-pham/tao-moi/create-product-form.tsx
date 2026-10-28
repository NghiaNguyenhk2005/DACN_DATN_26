"use client";

import { useActionState } from "react";
import Link from "next/link";
import { AlertCircle, Loader2, PackagePlus } from "lucide-react";
import { createProductAction } from "@/lib/data/seller-actions";

export type CategoryOption = { id: string; label: string };

const UNIT_SUGGESTIONS = ["kg", "Hộp 250g", "Hộp 500g", "Túi 1kg", "Bó 300g", "Gói 100g"];

const inputClass =
  "w-full rounded-btn border border-line bg-surface px-3.5 py-2.5 text-title text-ink shadow-2xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

export function CreateProductForm({ categories, idempotencyKey }: { categories: CategoryOption[]; idempotencyKey: string }) {
  const [state, formAction, isPending] = useActionState(createProductAction, null);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />

      {state && !state.ok && state.message && (
        <div className="flex items-start gap-3 rounded-xl border border-danger-line bg-danger-soft p-4 text-small text-danger-ink">
          <AlertCircle className="mt-0.5 size-5 shrink-0 text-danger" />
          <div>
            <strong className="font-semibold">Chưa thể đăng sản phẩm:</strong>
            <p className="mt-0.5">{state.message}</p>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="name" className="block text-title font-semibold text-ink">
          Tên sản phẩm <span className="text-danger">*</span>
        </label>
        <input id="name" name="name" required minLength={2} maxLength={200} placeholder="Ví dụ: Dâu tây Mộc Châu" className={inputClass} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="categoryId" className="block text-title font-semibold text-ink">
            Danh mục <span className="text-danger">*</span>
          </label>
          <select id="categoryId" name="categoryId" required defaultValue="" className={inputClass}>
            <option value="" disabled>
              -- Chọn danh mục --
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="unit" className="block text-title font-semibold text-ink">
            Quy cách bán <span className="text-danger">*</span>
          </label>
          <input id="unit" name="unit" required list="unit-suggestions" placeholder="Ví dụ: Hộp 500g" className={inputClass} />
          <datalist id="unit-suggestions">
            {UNIT_SUGGESTIONS.map((u) => (
              <option key={u} value={u} />
            ))}
          </datalist>
          <p className="text-caption text-subtle">Phải thuộc đơn vị hợp lệ của danh mục</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="referenceRetailPrice" className="block text-title font-semibold text-ink">
            Giá bán lẻ tham khảo (₫)
          </label>
          <input id="referenceRetailPrice" name="referenceRetailPrice" type="number" min={0} step={1000} placeholder="Ví dụ: 120000" className={inputClass} />
        </div>

        <div className="space-y-2">
          <label htmlFor="seasonality" className="block text-title font-semibold text-ink">
            Mùa vụ
          </label>
          <input id="seasonality" name="seasonality" placeholder="Ví dụ: Tháng 11 – tháng 4" className={inputClass} />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="description" className="block text-title font-semibold text-ink">
          Mô tả
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          maxLength={5000}
          placeholder="Giống, cách trồng, đặc điểm hương vị, cách bảo quản..."
          className={inputClass}
        />
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-line/60 pt-5">
        <Link
          href="/nha-cung-cap"
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
              <span>Đang gửi...</span>
            </>
          ) : (
            <>
              <PackagePlus className="size-4" />
              <span>Gửi duyệt sản phẩm</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
