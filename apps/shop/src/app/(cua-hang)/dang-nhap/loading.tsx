import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-[420px] py-8 md:py-14" aria-busy="true" aria-label="Đang tải">
      <div className="space-y-3 rounded-panel border border-border p-5 md:p-7">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-full" />
      </div>
    </div>
  );
}
