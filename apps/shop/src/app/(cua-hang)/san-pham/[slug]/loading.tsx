import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="pb-28 lg:pb-6" aria-busy="true" aria-label="Đang tải">
      <Skeleton className="my-3 h-4 w-56 md:mt-[18px]" />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,520px)_minmax(0,1fr)_300px] lg:gap-8 lg:pt-[18px]">
        <Skeleton className="-mx-4 h-[300px] rounded-none md:mx-0 md:rounded-panel lg:h-[400px]" />
        <div className="space-y-3">
          <Skeleton className="h-8 w-4/5" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-9 w-40" />
          <div className="grid grid-cols-2 gap-2.5 pt-2">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-16 rounded-tile" />
            ))}
          </div>
          <Skeleton className="h-40 w-full" />
        </div>
        <Skeleton className="hidden h-72 rounded-panel lg:block" />
      </div>
    </div>
  );
}
