"use client";

import { useActionState, useEffect, useRef } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import type { Schema } from "@farmery/contract";
import { createCertificationAction, type CertificationResult } from "@/lib/data/seller-actions";
import { CERT_LABELS } from "@/lib/labels";

export const sellerField =
  "w-full rounded-btn border border-line-strong bg-background px-3.5 py-2.5 text-title text-ink outline-none focus:border-primary focus:ring-2 focus:ring-ring/30";
export const sellerLabel = "block text-title font-semibold text-ink";

/**
 * Form khai báo chứng nhận (FR3.1): dùng ở trang Hồ sơ & chứng nhận và trong sheet nhập tại chỗ khi đăng sản phẩm.
 * Lưu xong gọi `onSaved` để nơi mở form cập nhật danh sách (vd tự tích chứng nhận vừa thêm).
 */
export function CertificationForm({
  defaultType,
  returnTo,
  onSaved,
}: {
  defaultType?: Schema<"CertType">;
  returnTo: string;
  onSaved?: (c: Schema<"SellerCertification">) => void;
}) {
  const [state, action, pending] = useActionState<CertificationResult | null, FormData>(createCertificationAction, null);
  const formRef = useRef<HTMLFormElement>(null);
  const savedRef = useRef<string | null>(null);

  useEffect(() => {
    if (state?.ok && state.certification && savedRef.current !== state.certification.id) {
      savedRef.current = state.certification.id;
      formRef.current?.reset();
      onSaved?.(state.certification);
    }
  }, [state, onSaved]);

  return (
    <form
      ref={formRef}
      action={action}
      // Mỗi lần bấm gửi tạo một Idempotency-Key mới.
      onSubmit={(e) => {
        const input = e.currentTarget.elements.namedItem("idempotencyKey") as HTMLInputElement;
        input.value = crypto.randomUUID();
      }}
      className="flex flex-col gap-4"
    >
      <input type="hidden" name="idempotencyKey" defaultValue="" />
      <input type="hidden" name="returnTo" value={returnTo} />
      {state && (
        <p
          role="status"
          className={`flex items-start gap-2.5 rounded-card border px-3.5 py-3 text-small ${
            state.ok ? "border-success-soft bg-success-soft text-ink" : "border-danger-line bg-danger-soft text-danger-ink"
          }`}
        >
          {state.ok ? <CheckCircle2 className="mt-0.5 size-4 flex-none text-success" aria-hidden /> : <AlertCircle className="mt-0.5 size-4 flex-none text-danger" aria-hidden />}
          {state.message}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className={sellerLabel}>
            Loại chứng nhận <span className="text-danger">*</span>
          </span>
          <select name="type" required defaultValue={defaultType ?? ""} className={sellerField}>
            <option value="" disabled>
              Chọn loại
            </option>
            {Object.entries(CERT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={sellerLabel}>
            Số chứng nhận <span className="text-danger">*</span>
          </span>
          <input name="certificateNumber" required minLength={2} maxLength={100} placeholder="Ví dụ: VG-2025-LD-0842" className={sellerField} />
        </label>
      </div>
      <label className="flex flex-col gap-1.5">
        <span className={sellerLabel}>
          Cơ quan cấp <span className="text-danger">*</span>
        </span>
        <input
          name="issuingAuthority"
          required
          minLength={2}
          maxLength={200}
          placeholder="Ví dụ: Chi cục Trồng trọt và Bảo vệ thực vật Lâm Đồng"
          className={sellerField}
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className={sellerLabel}>
            Ngày cấp <span className="text-danger">*</span>
          </span>
          <input name="issuedDate" type="date" required className={sellerField} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={sellerLabel}>
            Ngày hết hiệu lực <span className="text-danger">*</span>
          </span>
          <input name="expiryDate" type="date" required className={sellerField} />
        </label>
      </div>
      <p className="text-small text-ink-2">
        Ảnh giấy chứng nhận: gửi cho nhân viên hỗ trợ vùng qua Zalo của hợp tác xã; tải ảnh lên trực tiếp sẽ có ở bản chính thức.
      </p>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-12 items-center justify-center gap-2 rounded-btn bg-cta px-6 text-title font-semibold text-white hover:bg-cta-hover disabled:opacity-50"
      >
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden /> Đang gửi…
          </>
        ) : (
          "Gửi duyệt chứng nhận"
        )}
      </button>
    </form>
  );
}
