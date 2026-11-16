import { AlertCircle, CheckCircle2, Clock, EyeOff, FileEdit, type LucideIcon } from "lucide-react";
import type { Schema } from "@farmery/contract";
import { REVIEW_STATUS_LABELS } from "@/lib/labels";
import { cn } from "@/lib/utils";

export type Tone = "success" | "warning" | "danger" | "neutral";

export const TONE_CLASS: Record<Tone, string> = {
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  neutral: "bg-surface-2 text-ink-2",
};

const REVIEW: Record<Schema<"ReviewStatus">, { tone: Tone; icon: LucideIcon }> = {
  draft: { tone: "neutral", icon: FileEdit },
  pending_review: { tone: "warning", icon: Clock },
  approved: { tone: "success", icon: CheckCircle2 },
  rejected: { tone: "danger", icon: AlertCircle },
  hidden: { tone: "neutral", icon: EyeOff },
};

/** Huy hiệu trạng thái: icon + chữ (không chỉ dựa vào màu), màu theo token ngữ nghĩa. */
export function Badge({ tone, icon: Icon, children, className }: { tone: Tone; icon?: LucideIcon; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-caption font-semibold", TONE_CLASS[tone], className)}>
      {Icon && <Icon className="size-3.5" aria-hidden />}
      {children}
    </span>
  );
}

/** Trạng thái duyệt theo bảng thuật ngữ (design/06): Chờ duyệt, Đã duyệt, Bị từ chối… */
export function ReviewStatusBadge({ status, className }: { status: Schema<"ReviewStatus">; className?: string }) {
  const { tone, icon } = REVIEW[status];
  return (
    <Badge tone={tone} icon={icon} className={className}>
      {REVIEW_STATUS_LABELS[status]}
    </Badge>
  );
}
