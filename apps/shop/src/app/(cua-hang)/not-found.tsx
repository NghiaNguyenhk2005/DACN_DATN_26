import { EmptyState } from "@/components/farmery/empty-state";

export default function ShopNotFound() {
  return (
    <div className="mx-auto max-w-[560px] py-10 md:py-16">
      <EmptyState
        title="Không tìm thấy trang"
        description="Sản phẩm hoặc danh mục không tồn tại, hoặc đã ngừng bán."
        action={{ label: "Về trang chủ", href: "/" }}
      />
    </div>
  );
}
