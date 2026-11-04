"use client";

import { useActionState, useState } from "react";
import type { Schema } from "@farmery/contract";
import {
  AlertCircle,
  CheckCircle2,
  Droplets,
  FileText,
  Loader2,
  Plus,
  RefreshCw,
  Scissors,
  ShieldAlert,
  Sprout,
} from "lucide-react";
import { appendFarmingLogAction } from "@/lib/data/seller-actions";
import { formatDateVi } from "@/lib/format";
import { ACTIVITY_LABELS } from "@/lib/labels";

interface FarmingLogFormProps {
  batchId: string;
  existingLogs: Schema<"FarmingLog">[];
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

export function FarmingLogForm({ batchId, existingLogs }: FarmingLogFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(appendFarmingLogAction, null);
  const today = new Date().toISOString().slice(0, 10);

  const [selectedActivity, setSelectedActivity] = useState<Schema<"FarmingActivity">>("care");
  const [description, setDescription] = useState("");
  const [isSupersede, setIsSupersede] = useState(false);
  const [selectedLogId, setSelectedLogId] = useState("");

  const handleSelectSupersede = (logId: string) => {
    setSelectedLogId(logId);
    if (!logId) return;
    const target = existingLogs.find((l) => l.id === logId);
    if (target) {
      setSelectedActivity(target.activity);
      setDescription(`Đính chính: ${target.description ?? ""}`);
    }
  };

  const handleApplyTemplate = (hint: string) => {
    setDescription(hint);
  };

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
            onClick={() => setIsOpen(true)}
            className="inline-flex items-center gap-1.5 self-start rounded-btn bg-primary px-4 py-2 text-small font-semibold text-white transition-colors hover:bg-primary-hover sm:self-auto"
          >
            <Plus className="size-4" />
            <span>Thêm nhật ký</span>
          </button>
        </div>
      ) : (
        <form action={formAction} className="space-y-4">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-btn bg-primary/10 text-primary">
                <Plus className="size-4" />
              </div>
              <h4 className="text-title font-bold text-ink">
                Thêm nhật ký canh tác
              </h4>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-btn px-2.5 py-1 text-small text-subtle transition-colors hover:bg-surface-2 hover:text-ink"
            >
              Đóng
            </button>
          </div>

          <input type="hidden" name="batchId" value={batchId} />

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
              id="description"
              name="description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              placeholder="Nhập thông tin chi tiết: định lượng phân bón, độ ẩm đất, chế phẩm sinh học sử dụng, chỉ số kiểm tra..."
              className="w-full rounded-btn border border-line bg-surface p-3.5 text-small text-ink outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {existingLogs.length > 0 && (
            <div className="rounded-card border border-warning-line/60 bg-warning-soft/30 p-3.5">
              <label className="flex items-center gap-2 text-small font-medium text-ink cursor-pointer">
                <input
                  type="checkbox"
                  checked={isSupersede}
                  onChange={(e) => {
                    setIsSupersede(e.target.checked);
                    if (!e.target.checked) setSelectedLogId("");
                  }}
                  className="rounded text-primary focus:ring-primary"
                />
                <span className="flex items-center gap-1 font-semibold text-warning-dot">
                  <RefreshCw className="size-3.5" />
                  Đây là bản ghi đính chính cho một mục nhật ký trước đó
                </span>
              </label>

              {isSupersede && (
                <div className="mt-3 space-y-1.5 border-t border-warning-line/40 pt-2.5">
                  <label htmlFor="supersedesId" className="block text-small text-ink-2">
                    Chọn mục nhật ký cần đính chính:
                  </label>
                  <select
                    id="supersedesId"
                    name="supersedesId"
                    value={selectedLogId}
                    onChange={(e) => handleSelectSupersede(e.target.value)}
                    required={isSupersede}
                    className="w-full rounded-btn border border-line bg-surface px-3 py-2 text-small text-ink outline-none focus:border-primary"
                  >
                    <option value="">Chọn dòng nhật ký cần đính chính</option>
                    {existingLogs.map((log) => (
                      <option key={log.id} value={log.id}>
                        {formatDateVi(log.activityDate)} · {ACTIVITY_LABELS[log.activity]}
                        {log.description ? ` — ${log.description.slice(0, 45)}…` : ""}
                      </option>
                    ))}
                  </select>
                  <p className="text-small text-subtle">
                    Dòng cũ vẫn hiện trên trang truy xuất, đánh dấu “Đã được đính chính”.
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 border-t border-line/60 pt-3">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-btn border border-line px-4 py-2 text-small font-medium text-ink transition-colors hover:bg-surface-2"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-btn bg-cta px-5 py-2 text-small font-semibold text-white transition-colors hover:bg-cta-hover disabled:opacity-50"
            >
              {isPending && <Loader2 className="size-4 animate-spin" />}
              <span>{isSupersede ? "Lưu bản đính chính" : "Lưu nhật ký"}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
