import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SiteHeader() {
  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link href="/" className="text-lg font-semibold">
          Farmery
        </Link>
        <form action="/tim-kiem" className="flex-1">
          <Input name="q" type="search" placeholder="Tìm nông sản, vd: dau tay" aria-label="Tìm kiếm" />
        </form>
        <Button variant="ghost" size="icon" aria-label="Giỏ hàng">
          <ShoppingCart />
        </Button>
      </div>
    </header>
  );
}
