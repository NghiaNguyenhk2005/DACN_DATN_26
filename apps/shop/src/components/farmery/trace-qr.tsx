"use client";

import { QRCodeSVG } from "qrcode.react";

/** Mã QR dẫn tới trang truy xuất của lô (cùng nội dung in trên tem). */
export function TraceQr({ value, size = 92 }: { value: string; size?: number }) {
  return <QRCodeSVG value={value} size={size} fgColor="#1c211b" level="M" title={`Mã QR truy xuất: ${value}`} />;
}
