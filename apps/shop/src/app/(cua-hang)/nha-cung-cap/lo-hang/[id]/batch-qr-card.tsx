"use client";

import { useRef } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { CheckCircle2, Download, ExternalLink, Printer } from "lucide-react";
import type { Schema } from "@farmery/contract";
import { formatDateVi } from "@/lib/format";

interface BatchQrCardProps {
  batch: Schema<"Batch">;
  traceUrl: string;
}

export function BatchQrCard({ batch, traceUrl }: BatchQrCardProps) {
  const svgRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  /** Tạo và tải ảnh tem QR chất lượng cao (PNG) để gửi Zalo / đối tác */
  const handleDownloadQr = () => {
    if (!svgRef.current) return;
    const svgElement = svgRef.current.querySelector("svg");
    if (!svgElement) return;

    const svgXml = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgXml], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const scale = 2; // Độ nét cao
      const width = 400 * scale;
      const height = 520 * scale;
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Nền trắng và viền tem
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);

      // Khung viền ngoài
      ctx.lineWidth = 4 * scale;
      ctx.strokeStyle = "#1b4d3e";
      ctx.strokeRect(12 * scale, 12 * scale, width - 24 * scale, height - 24 * scale);

      // Header Farmery
      ctx.fillStyle = "#1b4d3e";
      ctx.font = `bold ${16 * scale}px sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("FARMERY · TRUY XUẤT NGUỒN GỐC", width / 2, 40 * scale);

      // Tên sản phẩm
      ctx.fillStyle = "#16241e";
      ctx.font = `bold ${18 * scale}px sans-serif`;
      ctx.fillText(batch.productName, width / 2, 70 * scale);

      // Vẽ mã QR ở giữa
      const qrSize = 220 * scale;
      const qrX = (width - qrSize) / 2;
      const qrY = 90 * scale;
      ctx.drawImage(img, qrX, qrY, qrSize, qrSize);

      // Mã truy xuất
      ctx.fillStyle = "#1b4d3e";
      ctx.font = `bold ${15 * scale}px monospace`;
      ctx.fillText(`MÃ TRUY XUẤT: ${batch.traceCode ?? ""}`, width / 2, 335 * scale);

      // Thông tin chi tiết lô
      ctx.fillStyle = "#4a5550";
      ctx.font = `${13 * scale}px sans-serif`;
      ctx.fillText(`Số lô: ${batch.batchCode}`, width / 2, 365 * scale);
      ctx.fillText(
        `Thu hoạch: ${formatDateVi(batch.harvestDate)}  |  HSD: ${formatDateVi(batch.bestBefore)}`,
        width / 2,
        395 * scale,
      );

      // Hướng dẫn
      ctx.fillStyle = "#738079";
      ctx.font = `italic ${12 * scale}px sans-serif`;
      ctx.fillText("Quét mã QR để xem nhật ký canh tác & chứng nhận", width / 2, 440 * scale);

      // Chuyển sang ảnh PNG và tải xuống
      canvas.toBlob((blob) => {
        if (!blob) return;
        const pngUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = pngUrl;
        a.download = `tem-qr-${batch.batchCode}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(pngUrl);
        URL.revokeObjectURL(url);
      }, "image/png");
    };

    img.src = url;
  };

  return (
    <>
      {/* Khối hiển thị trên màn hình */}
      <div className="rounded-panel border border-success-soft bg-success-soft/40 p-6 print:hidden">
        <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:items-start sm:text-left">
          <div
            ref={svgRef}
            className="flex shrink-0 flex-col items-center rounded-panel border border-line bg-white p-4"
          >
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
                className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-btn bg-primary px-4 text-small font-semibold text-white transition-colors hover:bg-primary-hover"
              >
                <ExternalLink className="size-4" />
                <span>Xem trang truy xuất</span>
              </Link>

              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-btn border border-line bg-surface px-4 text-small font-semibold text-ink transition-colors hover:bg-surface-2"
              >
                <Printer className="size-4" />
                <span>In tem QR</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadQr}
                className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-btn border border-primary/30 bg-primary/5 px-4 text-small font-semibold text-primary transition-colors hover:bg-primary/10"
              >
                <Download className="size-4" />
                <span>Tải ảnh QR (gửi Zalo)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bố cục in riêng chỉ có tem khi in bằng trình duyệt (ẩn trên màn hình, hiện khi in) */}
      <div id="tem-qr-print" className="hidden">
        <div className="text-center font-bold text-xs tracking-wider text-primary">
          FARMERY · TRUY XUẤT NGUỒN GỐC
        </div>
        <div className="mt-1 text-center font-bold text-base text-ink">
          {batch.productName}
        </div>
        <div className="my-3 flex justify-center bg-white p-2 border border-line rounded">
          <QRCodeSVG
            value={traceUrl}
            size={160}
            level="H"
            marginSize={1}
            aria-label={`Mã QR truy xuất lô ${batch.batchCode}`}
          />
        </div>
        <div className="text-center font-mono font-bold text-sm text-primary">
          {batch.traceCode}
        </div>
        <div className="mt-2 text-center text-xs text-ink-2 space-y-0.5">
          <div>Số lô: <strong className="font-mono text-ink">{batch.batchCode}</strong></div>
          <div>
            Thu hoạch: <strong>{formatDateVi(batch.harvestDate)}</strong> · HSD: <strong>{formatDateVi(batch.bestBefore)}</strong>
          </div>
        </div>
        <div className="mt-3 border-t border-dashed border-line pt-2 text-center text-[10px] text-subtle">
          Quét mã QR để xem nhật ký canh tác và chứng nhận
        </div>
      </div>
    </>
  );
}
