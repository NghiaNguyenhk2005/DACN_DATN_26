import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main
      className="mx-auto flex w-full max-w-[880px] flex-col gap-[22px] px-4 pb-14 pt-5 md:gap-7 md:px-0 md:pt-8"
      aria-busy="true"
      aria-label="Đang tải"
    >
      <div className="flex flex-col gap-3.5 md:flex-row md:items-center md:gap-6">
        <Skeleton className="h-[200px] w-full rounded-panel md:size-40" />
        <div className="flex-1 space-y-2.5">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4 md:gap-3">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-16 rounded-tile" />
        ))}
      </div>
      <Skeleton className="h-20 rounded-panel" />
      <Skeleton className="h-64 rounded-panel" />
    </main>
  );
}
