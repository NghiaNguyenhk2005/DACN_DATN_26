"use client";

import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { CheckCircle2, ExternalLink, Printer } from "lucide-react";
import type { Schema } from "@farmery/contract";

interface BatchQrCardProps {
  batch: Schema<"Batch">;
  traceUrl: string;
}

export function BatchQrCard({ batch, traceUrl }: BatchQrCardProps) {
  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="rounded-panel border border-success-soft bg-success-soft/40 p-6">
      <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:items-start sm:text-left">
        <div className="flex shrink-0 flex-col items-center rounded-panel border border-line bg-white p-4">
          <QRCodeSVG
            value={traceUrl}
            size={180}
            level="H"
            marginSize={2}
            aria-label={`Mã QR truy xuất lô ${batch.batchCode}`}
          />
          <span className="mt-2 font-mono text-micro font-bold text-ink">
            {batch.traceCode}
          </span>
        </div>

        <div className="flex flex-1 flex-col justify-between space-y-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-3 py-1 text-caption font-semibold text-success">
              <CheckCircle2 className="size-4" />
              Lô đã duyệt — in tem QR để dán thùng
            </div>

            <h3 className="mt-2 text-h3 font-bold text-ink">
              Mã truy xuất {batch.traceCode}
            </h3>
            <p className="mt-1 text-small text-ink-2">
              Quét mã để xem nguồn gốc lô, nhật ký canh tác và chứng nhận của nhà cung cấp.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2.5 sm:justify-start">
            <Link
              href={traceUrl}
              target="_blank"
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-btn bg-primary px-4 text-small font-semibold text-white transition-colors hover:bg-primary-hover"
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
              <span>In tem QR</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
