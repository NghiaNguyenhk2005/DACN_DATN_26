"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { QrCode, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { traceHref } from "@/lib/slug";

interface Props {
  /** Mở trình quét QR (camera). Không truyền thì ẩn nút Quét — prototype chưa có màn quét. */
  onScan?: () => void;
  className?: string;
}

/** Ô "Tra nguồn gốc lô hàng": khung bo 14px viền #e6ebe2, p-[22px] (mobile p-4). Chuyển tới /truy-xuat/[mã]. */
export function TraceLookup({ onScan, className }: Props) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const c = code.trim().toUpperCase();
    if (c) router.push(traceHref(c));
  };
  return (
    <section className={`flex flex-col rounded-panel border border-border bg-background p-4 md:p-[22px] ${className ?? ""}`}>
      <h2 className="mb-1.5 flex items-center gap-[9px] text-h3 font-bold text-primary">
        <QrCode className="size-[18px]" aria-hidden /> Tra nguồn gốc lô hàng
      </h2>
      <p className="mb-3.5 text-caption text-muted-foreground">
        Nhập mã in trên tem để xem nhật ký canh tác, chứng nhận của lô hàng.
      </p>
      <form onSubmit={submit}>
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="VD: TRC-DTDL-2610-01"
          aria-label="Mã truy xuất trên tem"
          autoCapitalize="characters"
          className="mb-2.5 h-11 rounded-btn px-[13px] text-title"
        />
        <div className="flex gap-2">
          <Button
            type="submit"
            className="h-11 flex-1 rounded-btn bg-primary text-title font-semibold text-white hover:bg-primary-hover"
          >
            Tra cứu
          </Button>
          {onScan && (
            <Button
              type="button"
              variant="outline"
              onClick={onScan}
              className="h-11 gap-1.5 rounded-btn border-chip px-[18px] text-title font-semibold text-primary md:px-3.5"
            >
              <ScanLine className="size-[15px]" aria-hidden /> Quét
            </Button>
          )}
        </div>
      </form>
    </section>
  );
}
