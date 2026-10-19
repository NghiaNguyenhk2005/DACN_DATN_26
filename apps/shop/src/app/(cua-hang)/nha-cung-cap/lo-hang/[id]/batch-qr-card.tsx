"use client";

import { useRef } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { CheckCircle2, ExternalLink, Printer } from "lucide-react";
import type { Schema } from "@farmery/contract";

interface BatchQrCardProps {
  batch: Schema<"Batch">;
}

export function BatchQrCard({ batch }: BatchQrCardProps) {
  const qrRef = useRef<SVGSVGElement>(null);

  // Đường dẫn truy xuất đầy đủ
  const fullTraceUrl = typeof window !== "undefined"
    ? `${window.location.origin}/truy-xuat/${batch.traceCode ?? batch.id}`
    : `/truy-xuat/${batch.traceCode ?? batch.id}`;

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-leaf-soft/20 via-surface to-surface p-6 shadow-xs">
      <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:items-start sm:text-left">
        {/* Khung Mã QR */}
        <div className="flex shrink-0 flex-col items-center rounded-2xl border border-line bg-white p-4 shadow-sm">
          <QRCodeSVG
            ref={qrRef}
            value={fullTraceUrl}
            size={180}
            level="H"
            includeMargin
            aria-label={`Mã QR truy xuất lô ${batch.batchCode}`}
          />
          <span className="mt-2 font-mono text-micro font-bold text-ink">
            {batch.traceCode}
          </span>
        </div>

        {/* Thông tin tem nhãn & Nút hành động */}
        <div className="flex flex-1 flex-col justify-between space-y-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-leaf-soft px-3 py-1 text-caption font-semibold text-primary">
              <CheckCircle2 className="size-4" />
              Mã QR truy xuất nguồn gốc hợp lệ
            </div>

            <h3 className="mt-2 font-heading text-h2 font-bold text-ink">
              Mã tem: {batch.traceCode}
            </h3>
            <p className="mt-1 text-small text-ink-2">
              Quét mã để xem nguồn gốc nông trại Đà Lạt, nhật ký canh tác chuẩn VietGAP và kết quả xét nghiệm an toàn thực phẩm.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2.5 sm:justify-start">
            <Link
              href={`/truy-xuat/${batch.traceCode}`}
              target="_blank"
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-btn bg-primary px-4 text-small font-semibold text-white shadow-xs transition-colors hover:bg-primary-hover"
            >
              <ExternalLink className="size-4" />
              <span>Xem trang truy xuất</span>
            </Link>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-btn border border-line bg-surface px-4 text-small font-semibold text-ink transition-colors hover:bg-surface-2"
            >
              <Printer className="size-4" />
              <span>In tem nhãn QR</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
