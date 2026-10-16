import { ApiUnavailableError } from "@/lib/data";
import { ErrorState } from "./error-state";

/** API có thao tác trong hợp đồng nhưng trả 501: báo rõ chức năng chưa sẵn sàng thay vì trang lỗi chung. */
export function NotReadyState() {
  return (
    <ErrorState
      title="Chức năng đang được hoàn thiện"
      description="Máy chủ Farmery chưa mở phần tài khoản, giỏ hàng và đặt đơn. Vui lòng thử lại sau."
    />
  );
}

export const isNotImplemented = (e: unknown) => e instanceof ApiUnavailableError && e.notImplemented;
