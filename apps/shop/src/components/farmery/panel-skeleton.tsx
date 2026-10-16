import { Skeleton } from "@/components/ui/skeleton";

/** Khung chờ tải cho trang giỏ hàng, thanh toán, đơn hàng: cột nội dung + cột tóm tắt. */
export function PanelSkeleton() {
  return (
    <div className="pb-10" aria-busy="true" aria-label="Đang tải">
      <Skeleton className="my-4 h-4 w-56 md:my-6" />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8">
        <div className="space-y-4">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="flex gap-3 rounded-panel border border-line p-4">
              <Skeleton className="size-16 flex-none rounded-tile" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="h-9 w-32" />
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-3 rounded-panel border border-line p-5">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-11 w-full" />
        </div>
      </div>
    </div>
  );
}
