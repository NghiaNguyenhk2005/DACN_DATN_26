import { ApiStatus } from "@/components/api-status";

export function SiteFooter() {
  return (
    <footer className="border-t text-sm">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-4">
        <span>© Farmery — nông sản có truy xuất nguồn gốc</span>
        <ApiStatus />
      </div>
    </footer>
  );
}
