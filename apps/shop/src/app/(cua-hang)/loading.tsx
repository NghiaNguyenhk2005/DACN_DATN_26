import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="pb-6 pt-3.5 md:pt-5" aria-busy="true" aria-label="Đang tải">
      <Skeleton className="mb-3 h-4 w-40" />
      <Skeleton className="mb-5 h-8 w-64" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 10 }, (_, i) => (
          <div key={i} className="overflow-hidden rounded-card border-[1.5px] border-line">
            <Skeleton className="h-[120px] rounded-none md:h-[150px]" />
            <div className="space-y-2 p-[11px] md:p-[13px]">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-2/3" />
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-10 w-full md:h-7" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
