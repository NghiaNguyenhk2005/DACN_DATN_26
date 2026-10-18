"use client";

import { useActionState, useState } from "react";
import type { Schema } from "@farmery/contract";
import { AlertCircle, CheckCircle2, Loader2, Plus } from "lucide-react";
import { appendFarmingLogAction } from "@/lib/data/seller-actions";

interface FarmingLogFormProps {
  batchId: string;
  existingLogs: Schema<"FarmingLog">[];
}

const ACTIVITIES: { value: Schema<"FarmingActivity">; label: string }[] = [
  { value: "planting", label: "Xuống giống & Gieo trồng" },
  { value: "care", label: "Chăm sóc, tưới tiêu & bón phân" },
  { value: "treatment", label: "Xử lý sâu bệnh sinh học VietGAP" },
  { value: "harvest", label: "Thu hoạch & Phân loại chất lượng" },
  { value: "other", label: "Hoạt động canh tác khác" },
];

export function FarmingLogForm({ batchId, existingLogs }: FarmingLogFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(appendFarmingLogAction, null);
  const today = new Date().toISOString().slice(0, 10);

  const [isSupersede, setIsSupersede] = useState(false);

  return (
    <div className="rounded-xl border border-line bg-surface p-5 shadow-2xs">
      {!isOpen ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h4 className="font-heading text-title font-bold text-ink">
              Ghi nhật ký canh tác
            </h4>
            <p className="text-caption text-ink-2">
              Dữ liệu nhật ký được lưu trữ bất biến (chỉ nối thêm). Có thể gửi bản đính chính trỏ về bản ghi trước nếu cần sửa đổi.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="inline-flex items-center gap-1.5 self-start rounded-btn bg-primary px-3.5 py-2 text-caption font-semibold text-white transition-colors hover:bg-primary-hover sm:self-auto"
          >
            <Plus className="size-4" />
            <span>Thêm mục nhật ký</span>
          </button>
        </div>
      ) : (
        <form action={formAction} className="space-y-4">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <h4 className="font-heading text-title font-bold text-ink">
              Thêm ghi chép nhật ký canh tác
            </h4>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-caption text-subtle hover:text-ink"
            >
              Đóng lại
            </button>
          </div>

          <input type="hidden" name="batchId" value={batchId} />

          {state && (
            <div
              className={`flex items-start gap-2 rounded-lg p-3 text-caption ${
                state.ok
                  ? "bg-leaf-soft text-primary"
                  : "bg-danger-soft text-danger"
              }`}
            >
              {state.ok ? (
                <CheckCircle2 className="size-4 shrink-0" />
              ) : (
                <AlertCircle className="size-4 shrink-0" />
              )}
              <span>{state.message}</span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="activityDate" className="block text-caption font-semibold text-ink">
                Ngày thực hiện <span className="text-danger">*</span>
              </label>
              <input
                id="activityDate"
                name="activityDate"
                type="date"
                defaultValue={today}
                max={today}
                required
                className="w-full rounded-btn border border-line bg-surface px-3 py-2 text-caption text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="activity" className="block text-caption font-semibold text-ink">
                Loại hoạt động <span className="text-danger">*</span>
              </label>
              <select
                id="activity"
                name="activity"
                required
                className="w-full rounded-btn border border-line bg-surface px-3 py-2 text-caption text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                {ACTIVITIES.map((act) => (
                  <option key={act.value} value={act.value}>
                    {act.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="description" className="block text-caption font-semibold text-ink">
              Mô tả chi tiết công việc <span className="text-danger">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              required
              placeholder="Ví dụ: Bón phân hữu cơ vi sinh dạng viên nén định lượng 50g/gốc, kiểm tra độ ẩm đất 65%..."
              className="w-full rounded-btn border border-line bg-surface px-3 py-2 text-caption text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Tuỳ chọn đính chính bản ghi cũ */}
          {existingLogs.length > 0 && (
            <div className="rounded-lg border border-line/60 bg-surface-2/40 p-3">
              <label className="flex items-center gap-2 text-caption font-medium text-ink">
                <input
                  type="checkbox"
                  checked={isSupersede}
                  onChange={(e) => setIsSupersede(e.target.checked)}
                  className="rounded text-primary focus:ring-primary"
                />
                <span>Đây là bản ghi đính chính cho một mục nhật ký trước đó</span>
              </label>

              {isSupersede && (
                <div className="mt-2.5">
                  <select
                    name="supersedesId"
                    className="w-full rounded-btn border border-line bg-surface px-3 py-2 text-caption text-ink outline-none focus:border-primary"
                  >
                    <option value="">-- Chọn mục nhật ký cần đính chính --</option>
                    {existingLogs.map((log) => (
                      <option key={log.id} value={log.id}>
                        #{log.id} ({log.activityDate} - {log.description ? log.description.slice(0, 50) : "Không có mô tả"}...)
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-btn border border-line px-3.5 py-1.5 text-caption font-medium text-ink hover:bg-surface-2"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-btn bg-cta px-4 py-1.5 text-caption font-semibold text-white shadow-xs hover:bg-cta-hover disabled:opacity-50"
            >
              {isPending && <Loader2 className="size-3.5 animate-spin" />}
              <span>Lưu nhật ký</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
