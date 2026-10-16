import { PackageSearch } from "lucide-react";
import { TraceLookup } from "@/components/farmery/trace-lookup";

export default function TraceNotFound() {
  return (
    <main className="mx-auto flex w-full max-w-[480px] flex-col px-4 pb-14 pt-8 md:pt-14">
      <span className="mb-3 grid size-12 place-items-center rounded-full bg-surface text-primary">
        <PackageSearch className="size-6" aria-hidden />
      </span>
      <h1 className="mb-1.5 font-serif text-h1-sm font-bold text-ink md:text-h1">Không tìm thấy lô hàng</h1>
      <p className="mb-5 text-small text-muted-foreground">
        Mã này không tồn tại hoặc lô hàng chưa được kiểm duyệt công khai. Kiểm tra lại mã in trên tem rồi nhập lại.
      </p>
      <TraceLookup />
    </main>
  );
}
