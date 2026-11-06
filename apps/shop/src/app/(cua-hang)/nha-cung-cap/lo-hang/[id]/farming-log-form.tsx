"use client";

import { useActionState, useCallback, useEffect, useRef, useState } from "react";
import type { Schema } from "@farmery/contract";
import {
  AlertCircle,
  CheckCircle2,
  Droplets,
  FileText,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Scissors,
  ShieldAlert,
  Sprout,
} from "lucide-react";
import { appendFarmingLogAction } from "@/lib/data/seller-actions";
import { todayVn } from "@/lib/decision";
import { formatDateVi } from "@/lib/format";
import { ACTIVITY_LABELS } from "@/lib/labels";

interface FarmingLogFormProps {
  batchId: string;
  existingLogs: Schema<"FarmingLog">[];
  /** Khi được set, form tự mở ở chế độ đính chính cho dòng này */
  initialEditLogId?: string;
}

const ACTIVITIES: {
  value: Schema<"FarmingActivity">;
  label: string;
  icon: typeof Sprout;
  hint: string;
}[] = [
  {
    value: "planting",
    label: ACTIVITY_LABELS.planting,
    icon: Sprout,
    hint: "Xuống giống cây mô dâu tây Hana F1 trên giàn treo cao 1.2m, sử dụng giá thể xơ dừa phối trộn phân trùn quế vi sinh.",
  },
  {
    value: "care",
    label: ACTIVITY_LABELS.care,
    icon: Droplets,
    hint: "Tỉa nhánh phụ và hoa bói đợt đầu; điều chỉnh hệ thống tưới nhỏ giọt Israel EC = 1.2 mS/cm, pH = 5.8.",
  },
  {
    value: "treatment",
    label: ACTIVITY_LABELS.treatment,
    icon: ShieldAlert,
    hint: "Phun phòng ngừa nấm phấn trắng bằng dung dịch nấm đối kháng Trichoderma harzianum nồng độ 0.5%, không dùng thuốc BVTV hóa học.",
  },
  {
    value: "harvest",
    label: ACTIVITY_LABELS.harvest,
    icon: Scissors,
    hint: "Thu hoạch quả chín sáng sớm độ đường Brix đạt 10.5, phân loại dâu VIP và dâu loại 1, xếp khay đệm giấy chống dập.",
  },
  {
    value: "other",
    label: ACTIVITY_LABELS.other,
    icon: FileText,
    hint: "Vệ sinh nhà màng, kiểm tra nhiệt độ giàn treo và kiểm tra độ ẩm định kỳ.",
  },
];

/** Sinh UUID chống trùng mỗi lần mở form */
function newKey() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;
}

export function FarmingLogForm({ batchId, existingLogs, initialEditLogId }: FarmingLogFormProps) {
  const [isOpen, setIsOpen] = useState(!!initialEditLogId);
  const [state, formAction, isPending] = useActionState(appendFarmingLogAction, null);
  const today = todayVn();

  const [selectedActivity, setSelectedActivity] = useState<Schema<"FarmingActivity">>("care");
  const formRef = useRef<HTMLFormElement>(null);
  const descRef = useRef<HTMLTextAreaElement>(null);
  const savedRef = useRef<string | null>(null);

  // Chế độ đính chính: id của dòng cần sửa (không chèn sẵn nội dung cũ)
  const [supersedesId, setSupersedesId] = useState(initialEditLogId ?? "");
  // Idempotency key mới mỗi lần mở form
  const [idempotencyKey, setIdempotencyKey] = useState(newKey);

  const openForm = useCallback((editLogId?: string) => {
    setSelectedActivity("care");
    if (descRef.current) descRef.current.value = "";
    setSupersedesId(editLogId ?? "");
    setIdempotencyKey(newKey());
    setIsOpen(true);
  }, []);

  const closeForm = useCallback(() => {
    setIsOpen(false);
    setSupersedesId("");
  }, []);

  // Sau khi submit thành công: xóa nội dung form (reset DOM trực tiếp)
  useEffect(() => {
    if (state?.ok && savedRef.current !== state.message) {
      savedRef.current = state.message ?? "ok";
      formRef.current?.reset();
      if (descRef.current) descRef.current.value = "";
    }
  }, [state]);

  const handleApplyTemplate = (hint: string) => {
    if (descRef.current) {
      descRef.current.value = hint;
    }
  };

  // Danh sách dòng chưa bị superseded (lọc để hiển thị ở dropdown đính chính)
  const correctableL = existingLogs.filter((l) => !l.superseded);

  return (
    <div className="rounded-panel border border-line bg-surface p-5">
      {!isOpen ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h4 className="text-title font-bold text-ink">
              Ghi nhật ký canh tác
            </h4>
            <p className="mt-0.5 text-small text-ink-2">
              Người mua xem được nhật ký qua mã QR. Ghi sai thì gửi bản đính chính; dòng cũ vẫn được giữ và đánh dấu.
            </p>
          </div>
          <button
            type="button"
            onClick={() => openForm()}
            className="inline-flex min-h-[48px] items-center gap-1.5 self-start rounded-btn bg-primary px-4 py-3 text-small font-semibold text-white transition-colors hover:bg-primary-hover sm:self-auto"
          >
            <Plus className="size-4" />
            <span>Thêm nhật ký</span>
          </button>
        </div>
      ) : (
        <form ref={formRef} action={formAction} className="space-y-4">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-btn bg-primary/10 text-primary">
                {supersedesId ? <Pencil className="size-4" /> : <Plus className="size-4" />}
              </div>
              <h4 className="text-title font-bold text-ink">
                {supersedesId ? "Đính chính nhật ký" : "Thêm nhật ký canh tác"}
              </h4>
            </div>
            <button
              type="button"
              onClick={closeForm}
              className="inline-flex min-h-[44px] items-center rounded-btn px-3 py-2 text-small text-subtle transition-colors hover:bg-surface-2 hover:text-ink"
            >
              Đóng
            </button>
          </div>

          <input type="hidden" name="batchId" value={batchId} />
          <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
          {supersedesId && <input type="hidden" name="supersedesId" value={supersedesId} />}

          {supersedesId && (
            <div className="flex items-center gap-2 rounded-card border border-warning-line/60 bg-warning-soft/30 px-3.5 py-2.5">
              <RefreshCw className="size-4 shrink-0 text-warning-dot" />
              <p className="text-small font-medium text-ink">
                Đính chính cho dòng{" "}
                <span className="font-mono font-semibold">#{supersedesId}</span>
                {" — "}
                {(() => {
                  const t = existingLogs.find((l) => l.id === supersedesId);
                  return t ? `${formatDateVi(t.activityDate)} · ${ACTIVITY_LABELS[t.activity]}` : "";
                })()}
              </p>
            </div>
          )}

          {state && (
            <div
              className={`flex items-start gap-2 rounded-card p-3.5 text-small ${
                state.ok
                  ? "border border-leaf-soft bg-leaf-soft/50 text-primary font-medium"
                  : "border border-danger-line bg-danger-soft text-danger"
              }`}
            >
              {state.ok ? (
                <CheckCircle2 className="size-4.5 shrink-0" />
              ) : (
                <AlertCircle className="size-4.5 shrink-0" />
              )}
              <span>{state.message}</span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="activityDate" className="block text-small font-semibold text-ink">
                Ngày thực hiện <span className="text-danger">*</span>
              </label>
              <input
                id="activityDate"
                name="activityDate"
                type="date"
                defaultValue={today}
                max={today}
                required
                className="w-full rounded-btn border border-line bg-surface px-3.5 py-2.5 text-small text-ink outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <span className="text-small text-subtle">
                (Không thể chọn ngày trong tương lai)
              </span>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="activity" className="block text-small font-semibold text-ink">
                Loại hoạt động canh tác <span className="text-danger">*</span>
              </label>
              <select
                id="activity"
                name="activity"
                value={selectedActivity}
                onChange={(e) => setSelectedActivity(e.target.value as Schema<"FarmingActivity">)}
                required
                className="w-full rounded-btn border border-line bg-surface px-3.5 py-2.5 text-small text-ink outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                {ACTIVITIES.map((act) => (
                  <option key={act.value} value={act.value}>
                    {act.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-card border border-line/60 bg-surface-2/40 p-3">
            <div className="flex items-center justify-between text-small text-subtle">
              <span>Gợi ý nội dung mẫu cho hoạt động đã chọn:</span>
              <button
                type="button"
                onClick={() => {
                  const current = ACTIVITIES.find((a) => a.value === selectedActivity);
                  if (current) handleApplyTemplate(current.hint);
                }}
                className="font-medium text-primary hover:underline"
              >
                Điền mẫu này
              </button>
            </div>
            <p className="mt-1 text-small text-ink-2 italic">
              &quot;{ACTIVITIES.find((a) => a.value === selectedActivity)?.hint}&quot;
            </p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="description" className="block text-small font-semibold text-ink">
              Mô tả chi tiết công việc canh tác <span className="text-danger">*</span>
            </label>
            <textarea
              ref={descRef}
              id="description"
              name="description"
              rows={3}
              defaultValue=""
              required
              placeholder="Nhập thông tin chi tiết: định lượng phân bón, độ ẩm đất, chế phẩm sinh học sử dụng, chỉ số kiểm tra..."
              className="w-full rounded-btn border border-line bg-surface p-3.5 text-small text-ink outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Chọn thủ công dòng cần đính chính (khi không dùng nút "Sửa dòng này") */}
          {!supersedesId && correctableL.length > 0 && (
            <div className="rounded-card border border-line/60 bg-surface-2/30 p-3.5">
              <label htmlFor="manualSupersede" className="flex items-center gap-2 text-small font-medium text-ink cursor-pointer">
                <span className="flex items-center gap-1 text-subtle">
                  <RefreshCw className="size-3.5" />
                  Đây là bản đính chính cho một dòng cũ? Chọn dòng:
                </span>
              </label>
              <select
                id="manualSupersede"
                value={supersedesId}
                onChange={(e) => setSupersedesId(e.target.value)}
                className="mt-2 w-full rounded-btn border border-line bg-surface px-3 py-2 text-small text-ink outline-none focus:border-primary"
              >
                <option value="">— Không (đây là nhật ký thông thường) —</option>
                {correctableL.map((log) => (
                  <option key={log.id} value={log.id}>
                    {formatDateVi(log.activityDate)} · {ACTIVITY_LABELS[log.activity]}
                    {log.description ? ` — ${log.description.slice(0, 45)}…` : ""}
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-small text-subtle">
                Dòng cũ vẫn hiện trên trang truy xuất, đánh dấu &quot;Đã được đính chính&quot;.
              </p>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 border-t border-line/60 pt-3">
            <button
              type="button"
              onClick={closeForm}
              className="min-h-[48px] rounded-btn border border-line px-5 py-3 text-small font-medium text-ink transition-colors hover:bg-surface-2"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex min-h-[48px] items-center gap-1.5 rounded-btn bg-cta px-6 py-3 text-small font-semibold text-white transition-colors hover:bg-cta-hover disabled:opacity-50"
            >
              {isPending && <Loader2 className="size-4 animate-spin" />}
              <span>{supersedesId ? "Lưu bản đính chính" : "Lưu nhật ký"}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
