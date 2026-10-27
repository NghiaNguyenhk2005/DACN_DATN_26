import { Layers } from "lucide-react";
import { EmptyState } from "@/components/farmery/empty-state";

export default function BatchNotFound() {
  return (
    <EmptyState
      icon={Layers}
      title="Không tìm thấy lô hàng"
      description="Lô này không tồn tại hoặc không thuộc nhà cung cấp của bạn."
      action={{ label: "Về danh sách lô", href: "/nha-cung-cap/lo-hang" }}
    />
  );
}
