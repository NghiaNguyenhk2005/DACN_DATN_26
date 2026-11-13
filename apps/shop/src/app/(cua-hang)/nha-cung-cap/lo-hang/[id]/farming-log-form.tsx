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
  productName?: string;
  existingLogs: Schema<"FarmingLog">[];
  /** Khi được set, form tự mở ở chế độ đính chính cho dòng này */
  initialEditLogId?: string;
}

function getActivitiesForProduct(productName?: string): {
  value: Schema<"FarmingActivity">;
  label: string;
  icon: typeof Sprout;
  hint: string;
}[] {
  const p = (productName ?? "").toLowerCase();

  // Nấm
  if (p.includes("nấm")) {
    return [
      {
        value: "planting",
        label: ACTIVITY_LABELS.planting,
        icon: Sprout,
        hint: "Vào phôi meo nấm giống F1 vào túi cơ chất mùn cưa và cám gạo đã tiệt trùng autoclave 121°C.",
      },
      {
        value: "care",
        label: ACTIVITY_LABELS.care,
        icon: Droplets,
        hint: "Rạch bịch phôi, duy trì độ ẩm phòng nuôi 85-90%, thông gió đối lưu 4 lần/ngày, nhiệt độ 22-25°C.",
      },
      {
        value: "treatment",
        label: ACTIVITY_LABELS.treatment,
        icon: ShieldAlert,
        hint: "Khử khuẩn phòng cấy bằng vôi bột và đèn UV 30 phút trước khi thao tác; cách ly các bịch nhiễm mốc xanh.",
      },
      {
        value: "harvest",
        label: ACTIVITY_LABELS.harvest,
        icon: Scissors,
        hint: "Thu hái nấm non mũ vừa hé, cắt sạch gốc chân nấm, phân loại và đóng khay màng bọc thông khí chuyển kho mát.",
      },
      {
        value: "other",
        label: ACTIVITY_LABELS.other,
        icon: FileText,
        hint: "Vệ sinh giàn kệ và khử trùng nhà nấm sau đợt thu hái lứa 1.",
      },
    ];
  }

  // Rau ăn lá (xà lách, cải xoăn, rau thơm, bắp cải)
  if (p.includes("xà lách") || p.includes("cải") || p.includes("rau")) {
    return [
      {
        value: "planting",
        label: ACTIVITY_LABELS.planting,
        icon: Sprout,
        hint: "Gieo hạt giống hữu cơ vào khay ươm xơ dừa vi sinh; chuyển rọ lên máng thủy canh hồi lưu sau 12 ngày.",
      },
      {
        value: "care",
        label: ACTIVITY_LABELS.care,
        icon: Droplets,
        hint: "Đo nồng độ dinh dưỡng thủy canh ppm = 750, pH = 6.2; bổ sung dung dịch hữu cơ sinh học theo chuẩn VietGAP.",
      },
      {
        value: "treatment",
        label: ACTIVITY_LABELS.treatment,
        icon: ShieldAlert,
        hint: "Bắt sâu tơ thủ công sáng sớm và phun chế phẩm vi sinh Bacillus thuringiensis (BT) phòng bọ nhảy.",
      },
      {
        value: "harvest",
        label: ACTIVITY_LABELS.harvest,
        icon: Scissors,
        hint: "Thu hoạch rau vào sáng sớm lúc trời mát, tỉa bỏ lá chân già dập, giữ rễ ẩm chuyển ngay về phòng sơ chế làm mát.",
      },
      {
        value: "other",
        label: ACTIVITY_LABELS.other,
        icon: FileText,
        hint: "Kiểm tra hệ thống bơm hồi lưu và vệ sinh bể chứa dung dịch dinh dưỡng.",
      },
    ];
  }

  // Cà chua, ớt chuông, củ quả
  if (p.includes("cà chua") || p.includes("ớt") || p.includes("khoai") || p.includes("bơ")) {
    return [
      {
        value: "planting",
        label: ACTIVITY_LABELS.planting,
        icon: Sprout,
        hint: "Trồng cây giống ghép kháng bệnh vào bầu xơ dừa trong nhà màng, cố định thân vào dây leo chuyên dụng.",
      },
      {
        value: "care",
        label: ACTIVITY_LABELS.care,
        icon: Droplets,
        hint: "Tỉa chồi nách, quấn ngọn quanh dây đỡ; điều tiết chế độ châm phân nhỏ giọt NPK hữu cơ theo giai đoạn đậu trái.",
      },
      {
        value: "treatment",
        label: ACTIVITY_LABELS.treatment,
        icon: ShieldAlert,
        hint: "Thả bọ trĩ ăn mồi sinh học (Amblyseius swirskii) và treo bẫy dính vàng phòng ngừa ruồi trắng.",
      },
      {
        value: "harvest",
        label: ACTIVITY_LABELS.harvest,
        icon: Scissors,
        hint: "Thu hoạch quả đạt độ chín màu chuẩn, cuống tươi xanh, xếp khay đệm bọt xốp bảo vệ chống cọ xát.",
      },
      {
        value: "other",
        label: ACTIVITY_LABELS.other,
        icon: FileText,
        hint: "Hạ giàn cây sau đợt thu hoạch thứ 3 và làm vệ sinh luống trồng.",
      },
    ];
  }

  // Trà & Cà phê
  if (p.includes("trà") || p.includes("cà phê") || p.includes("chè")) {
    return [
      {
        value: "planting",
        label: ACTIVITY_LABELS.planting,
        icon: Sprout,
        hint: "Bón lót phân chuồng ủ hoai mục và trồng dặm cây con giống thuần chủng cao nguyên.",
      },
      {
        value: "care",
        label: ACTIVITY_LABELS.care,
        icon: Droplets,
        hint: "Cắt tỉa cành tạo tán thông thoáng, làm cỏ gốc và bón phân hữu cơ khoáng vi lượng.",
      },
      {
        value: "treatment",
        label: ACTIVITY_LABELS.treatment,
        icon: ShieldAlert,
        hint: "Quét vôi gốc phòng rệp sáp và phun chế phẩm thảo mộc phòng bọ xít muỗi.",
      },
      {
        value: "harvest",
        label: ACTIVITY_LABELS.harvest,
        icon: Scissors,
        hint: "Hái chọn lọc 1 tôm 2 lá non (với trà) hoặc quả chín đỏ mọng đồng đều (với cà phê), chuyển ngay về xưởng chế biến trong ngày.",
      },
      {
        value: "other",
        label: ACTIVITY_LABELS.other,
        icon: FileText,
        hint: "Đảo sấy và kiểm soát độ ẩm hạt lưu kho theo tiêu chuẩn xuất khẩu.",
      },
    ];
  }

  // Mặc định (Dâu tây & cây ăn quả)
  return [
    {
      value: "planting",
      label: ACTIVITY_LABELS.planting,
      icon: Sprout,
      hint: "Xuống giống cây mô giống chuẩn trên giàn treo cao 1.2m, sử dụng giá thể xơ dừa phối trộn phân trùn quế vi sinh.",
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
      hint: "Thu hoạch quả chín sáng sớm độ đường Brix đạt tiêu chuẩn, phân loại VIP và loại 1, xếp khay đệm giấy chống dập.",
    },
    {
      value: "other",
      label: ACTIVITY_LABELS.other,
      icon: FileText,
      hint: "Vệ sinh nhà màng, kiểm tra nhiệt độ giàn treo và kiểm tra độ ẩm định kỳ.",
    },
  ];
}

/** Sinh UUID chống trùng mỗi lần mở form */
function newKey() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;
}

export function FarmingLogForm({ batchId, productName, existingLogs, initialEditLogId }: FarmingLogFormProps) {
  const [isOpen, setIsOpen] = useState(!!initialEditLogId);
  const [state, formAction, isPending] = useActionState(appendFarmingLogAction, null);
  const today = todayVn();
  const activities = getActivitiesForProduct(productName);

  const [selectedActivity, setSelectedActivity] = useState<Schema<"FarmingActivity">>("care");
  const formRef = useRef<HTMLFormElement>(null);
  const descRef = useRef<HTMLTextAreaElement>(null);
  const lastStateRef = useRef<typeof state>(null);
  const draftKey = `farming_log_draft_${batchId}`;

  // Chế độ đính chính: id của dòng cần sửa (không chèn sẵn nội dung cũ)
  const [supersedesId, setSupersedesId] = useState(initialEditLogId ?? "");
  // Idempotency key mới mỗi lần mở form
  const [idempotencyKey, setIdempotencyKey] = useState(newKey);

  // Khi mở form: khôi phục bản nháp nếu có trong localStorage
  const openForm = useCallback((editLogId?: string) => {
    setSelectedActivity("care");
    setSupersedesId(editLogId ?? "");
    setIdempotencyKey(newKey());
    setIsOpen(true);

    setTimeout(() => {
      if (descRef.current) {
        if (!editLogId) {
          const savedDraft = typeof window !== "undefined" ? localStorage.getItem(draftKey) : null;
          descRef.current.value = savedDraft ?? "";
        } else {
          descRef.current.value = "";
        }
      }
    }, 0);
  }, [draftKey]);

  // Khi click nút "Sửa dòng này", query param ?edit=... cập nhật -> mở form đính chính
  useEffect(() => {
    if (initialEditLogId) {
      // Dùng setTimeout / queueMicrotask để tránh cascading render đồng bộ theo react-hooks/set-state-in-effect
      const timer = setTimeout(() => {
        setSupersedesId(initialEditLogId);
        setIdempotencyKey(newKey());
        setIsOpen(true);
        if (descRef.current) descRef.current.value = "";
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [initialEditLogId]);

  const closeForm = useCallback(() => {
    setIsOpen(false);
    setSupersedesId("");
  }, []);

  // Sau khi submit thành công: đóng form, xóa nội dung và xóa nháp localStorage
  useEffect(() => {
    if (state?.ok && state !== lastStateRef.current) {
      lastStateRef.current = state;
      if (typeof window !== "undefined") {
        localStorage.removeItem(draftKey);
      }
      const timer = setTimeout(() => {
        setIsOpen(false);
        setSupersedesId("");
        formRef.current?.reset();
        if (descRef.current) descRef.current.value = "";
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [state, draftKey]);

  const handleApplyTemplate = (hint: string) => {
    if (descRef.current) {
      descRef.current.value = hint;
      if (typeof window !== "undefined" && !supersedesId) {
        localStorage.setItem(draftKey, hint);
      }
    }
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (typeof window !== "undefined" && !supersedesId) {
      localStorage.setItem(draftKey, e.target.value);
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
                {activities.map((act) => (
                  <option key={act.value} value={act.value}>
                    {act.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-card border border-line/60 bg-surface-2/40 p-3">
            <div className="flex items-center justify-between text-small text-subtle">
              <span>Gợi ý mẫu ({productName ? `cho ${productName}` : "hoạt động canh tác"}):</span>
              <button
                type="button"
                onClick={() => {
                  const current = activities.find((a) => a.value === selectedActivity);
                  if (current) handleApplyTemplate(current.hint);
                }}
                className="font-medium text-primary hover:underline"
              >
                Điền mẫu này
              </button>
            </div>
            <p className="mt-1 text-small text-ink-2 italic">
              &quot;{activities.find((a) => a.value === selectedActivity)?.hint}&quot;
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="description" className="block text-small font-semibold text-ink">
                Mô tả chi tiết công việc canh tác <span className="text-danger">*</span>
              </label>
              <span className="text-micro text-subtle">
                (Tự động lưu nháp trên trình duyệt khi mất mạng)
              </span>
            </div>
            <textarea
              ref={descRef}
              id="description"
              name="description"
              rows={3}
              defaultValue=""
              onChange={handleDescriptionChange}
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
                    #{log.id} ({formatDateVi(log.activityDate)} · {ACTIVITY_LABELS[log.activity]})
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
