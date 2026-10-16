import Link from "next/link";
import { CloudOff } from "lucide-react";

interface Props {
  title?: string;
  description?: string;
  /** Nút thử lại (chỉ truyền từ Client Component, vd error.tsx). */
  onRetry?: () => void;
}

/** Khối báo lỗi tải dữ liệu: không trắng trang khi API tắt hoặc lỗi. */
export function ErrorState({
  title = "Không tải được dữ liệu",
  description = "Máy chủ Farmery đang không phản hồi. Vui lòng thử lại sau ít phút.",
  onRetry,
}: Props) {
  return (
    <section
      role="alert"
      className="mx-auto my-10 flex max-w-[480px] flex-col items-center rounded-panel border border-border px-5 py-8 text-center md:my-16"
    >
      <span className="mb-3 grid size-12 place-items-center rounded-full bg-danger-soft text-danger">
        <CloudOff className="size-6" aria-hidden />
      </span>
      <h1 className="mb-1.5 text-h2-sm font-bold text-ink md:text-h2">{title}</h1>
      <p className="mb-5 text-small text-muted-foreground">{description}</p>
      <div className="flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="h-11 rounded-btn bg-primary px-5 text-title font-semibold text-white hover:bg-primary-hover"
          >
            Thử lại
          </button>
        )}
        <Link
          href="/"
          className="grid h-11 place-items-center rounded-btn border-[1.5px] border-primary px-5 text-title font-semibold text-primary"
        >
          Về trang chủ
        </Link>
      </div>
    </section>
  );
}
