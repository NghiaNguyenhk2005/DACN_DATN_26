"use client";

import { useActionState, useCallback, useState } from "react";
import Link from "next/link";
import { AlertCircle, Loader2, Plus } from "lucide-react";
import type { Schema } from "@farmery/contract";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { createProductAction } from "@/lib/data/seller-actions";
import { CERT_LABELS, REVIEW_STATUS_LABELS } from "@/lib/labels";
import { CertificationForm, sellerField, sellerLabel } from "../../certification-form";

export type CategoryOption = { id: string; label: string };
type CertType = Schema<"CertType">;

const UNIT_SUGGESTIONS = ["kg", "hộp 250g", "hộp 500g", "túi 1kg", "bó 300g", "khay 200g"];
const CERT_TYPES = Object.keys(CERT_LABELS) as CertType[];

/**
 * Đăng sản phẩm (design/03 F3): chọn chứng nhận sản phẩm đạt từ chứng nhận đã khai; chưa có thì "Thêm chứng nhận"
 * mở sheet nhập tại chỗ, lưu xong tự tích loại đó và quay lại form.
 */
export function CreateProductForm({
  categories,
  idempotencyKey,
  certifications,
}: {
  categories: CategoryOption[];
  idempotencyKey: string;
  certifications: Schema<"SellerCertification">[];
}) {
  const [state, formAction, isPending] = useActionState(createProductAction, null);
  const [certs, setCerts] = useState(certifications);
  const [checked, setChecked] = useState<Set<CertType>>(new Set());
  const [sheetType, setSheetType] = useState<CertType | null>(null);

  const declared = (t: CertType) => certs.find((c) => c.type === t && c.status !== "rejected");
  const toggle = (t: CertType) =>
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  const onSaved = useCallback((c: Schema<"SellerCertification">) => {
    setCerts((prev) => [c, ...prev]);
    setChecked((prev) => new Set(prev).add(c.type));
    setSheetType(null);
  }, []);

  return (
    <>
      <form action={formAction} className="flex flex-col gap-5">
        <input type="hidden" name="idempotencyKey" value={idempotencyKey} />

        {state && !state.ok && state.message && (
          <p role="alert" className="flex items-start gap-2.5 rounded-card border border-danger-line bg-danger-soft px-4 py-3 text-small text-danger-ink">
            <AlertCircle className="mt-0.5 size-5 flex-none text-danger" aria-hidden />
            <span>
              <strong className="font-semibold">Chưa đăng được sản phẩm.</strong> {state.message}
            </span>
          </p>
        )}

        <label className="flex flex-col gap-1.5">
          <span className={sellerLabel}>
            Tên sản phẩm <span className="text-danger">*</span>
          </span>
          <input name="name" required minLength={2} maxLength={200} placeholder="Ví dụ: Dâu tây Hana Đà Lạt" className={sellerField} />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className={sellerLabel}>
              Danh mục <span className="text-danger">*</span>
            </span>
            <select name="categoryId" required defaultValue="" className={sellerField}>
              <option value="" disabled>
                Chọn danh mục
              </option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={sellerLabel}>
              Đơn vị bán <span className="text-danger">*</span>
            </span>
            <input name="unit" required list="unit-suggestions" placeholder="Ví dụ: hộp 500g" className={sellerField} />
            <datalist id="unit-suggestions">
              {UNIT_SUGGESTIONS.map((u) => (
                <option key={u} value={u} />
              ))}
            </datalist>
            <span className="text-small text-ink-2">Ghi rõ khối lượng để người mua so giá (hộp 500g, túi 1kg).</span>
          </label>
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className={`${sellerLabel} mb-1`}>Sản phẩm đạt chứng nhận</legend>
          <ul className="flex flex-col gap-2">
            {CERT_TYPES.map((t) => {
              const cert = declared(t);
              return (
                <li key={t} className="flex min-h-11 items-center justify-between gap-3 rounded-btn border border-line px-3.5 py-2">
                  {cert ? (
                    <label className="flex flex-1 cursor-pointer items-center gap-2.5 text-title text-ink">
                      <input
                        type="checkbox"
                        name="certifications"
                        value={t}
                        checked={checked.has(t)}
                        onChange={() => toggle(t)}
                        className="size-5 accent-[var(--primary)]"
                      />
                      {CERT_LABELS[t]}
                      {cert.status === "pending_review" && <span className="text-small text-warning">({REVIEW_STATUS_LABELS[cert.status]})</span>}
                    </label>
                  ) : (
                    <>
                      <span className="text-title text-subtle">{CERT_LABELS[t]} — chưa khai báo</span>
                      <button type="button" onClick={() => setSheetType(t)} className="inline-flex flex-none items-center gap-1 whitespace-nowrap text-small font-semibold text-primary">
                        <Plus className="size-4" aria-hidden /> Thêm chứng nhận
                      </button>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className={sellerLabel}>Giá bán lẻ tham khảo (₫)</span>
            <input name="referenceRetailPrice" type="number" min={0} step={1000} placeholder="Ví dụ: 120000" className={sellerField} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={sellerLabel}>Mùa vụ</span>
            <input name="seasonality" placeholder="Ví dụ: Tháng 11 – tháng 4" className={sellerField} />
          </label>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className={sellerLabel}>Mô tả</span>
          <textarea name="description" rows={4} maxLength={5000} placeholder="Giống, cách trồng, hương vị, cách bảo quản…" className={sellerField} />
        </label>

        <div className="flex items-center justify-end gap-3 border-t border-line pt-5">
          <Link href="/nha-cung-cap/san-pham" className="inline-flex h-12 items-center rounded-btn border border-line-strong px-5 text-title font-medium text-ink hover:bg-surface hover:text-ink">
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

      <Sheet open={sheetType !== null} onOpenChange={(open) => !open && setSheetType(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Thêm chứng nhận {sheetType ? CERT_LABELS[sheetType] : ""}</SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-6">
            {sheetType && <CertificationForm key={sheetType} defaultType={sheetType} returnTo="/nha-cung-cap/san-pham/tao-moi" onSaved={onSaved} />}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
