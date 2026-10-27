import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CertificateList } from "@/components/farmery/certificate-list";
import { LotInfo } from "@/components/farmery/lot-info";
import { RecallAlert } from "@/components/farmery/recall-alert";
import { SafeImage } from "@/components/farmery/safe-image";
import { TraceTimeline } from "@/components/farmery/trace-timeline";
import { getSupplier, getTrace } from "@/lib/data";
import { formatDateVi } from "@/lib/format";
import { productHref } from "@/lib/slug";
import { cn } from "@/lib/utils";

export async function generateMetadata({ params }: PageProps<"/truy-xuat/[ma]">): Promise<Metadata> {
  const { ma } = await params;
  return { title: `Truy xuất lô ${decodeURIComponent(ma)}` };
}

/**
 * Trang truy xuất theo traceCode in trên tem: /truy-xuat/TRC-DTDL-2610-01. Dựng mỗi request, không cache tĩnh.
 * Thứ tự khối: [Cảnh báo thu hồi] → Sản phẩm → Thông tin lô → Nhà cung cấp → Nhật ký → Chứng nhận → Chân.
 */
export default async function TracePage({ params }: PageProps<"/truy-xuat/[ma]">) {
  const code = decodeURIComponent((await params).ma).trim();
  const trace = await getTrace(code);
  if (!trace) notFound();
  const supplier = await getSupplier(trace.supplier.id).catch(() => null);
  const recalled = trace.recall.recalled;
  const region = trace.supplier.growingRegion;

  return (
    <>
      {recalled && (
        <div className="mx-auto w-full max-w-[880px] md:pt-8">
          <RecallAlert recall={trace.recall} />
        </div>
      )}

      <main className="mx-auto flex w-full max-w-[880px] flex-col gap-[22px] px-4 pb-14 pt-5 md:gap-7 md:px-0 md:pt-8">
        <section className="flex flex-col gap-3.5 md:flex-row md:items-center md:gap-6">
          <div className="relative h-[200px] w-full flex-none overflow-hidden rounded-panel md:size-40">
            <SafeImage
              src={trace.product.imageUrl}
              alt={trace.product.name}
              fill
              priority
              sizes="(min-width:768px) 160px, 100vw"
              className="object-cover"
            />
          </div>
          <div>
            <span
              className={cn(
                "mb-[9px] inline-block rounded-full px-3 py-[5px] text-caption font-semibold md:mb-2.5",
                recalled ? "bg-danger-soft text-danger" : "bg-success-soft text-success",
              )}
            >
              {recalled ? "Lô đã thu hồi" : "Lô hợp lệ"}
            </span>
            <h1 className="mb-1.5 font-serif text-[22px] font-bold leading-[1.3] text-ink md:mb-2 md:text-h1">
              {trace.product.name}
            </h1>
            <p className="text-[13.5px] text-muted-foreground md:text-title">
              {trace.supplier.displayName} · {region}
            </p>
          </div>
        </section>

        <LotInfo
          columns={4}
          facts={[
            { label: "Mã lô", value: trace.batch.batchCode },
            { label: "Ngày thu hoạch", value: formatDateVi(trace.batch.harvestDate) },
            { label: "Hạn dùng", value: formatDateVi(trace.batch.bestBefore), tone: recalled ? "danger" : "default" },
            { label: "Vùng trồng", value: region },
          ]}
        />

        <section
          aria-label="Nhà cung cấp"
          className="flex items-center gap-3 rounded-card border border-border p-3.5 md:gap-4 md:rounded-panel md:px-5 md:py-[18px]"
        >
          <span className="relative size-11 flex-none overflow-hidden rounded-[9px] md:size-[52px] md:rounded-tile">
            <SafeImage src={supplier?.avatarUrl} alt="" fill sizes="52px" className="object-cover" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-body font-bold text-ink md:text-h3">{trace.supplier.displayName}</h2>
            <p className="mt-0.5 line-clamp-2 text-caption text-muted-foreground md:mt-[3px] md:text-small">
              {supplier?.description ?? region}
            </p>
          </div>
        </section>

        <section aria-labelledby="log-h">
          <div className="mb-1.5 md:flex md:items-baseline md:justify-between">
            <h2 id="log-h" className="text-h2-sm font-bold text-ink md:text-h2">
              Nhật ký canh tác
            </h2>
            <p className="mb-2 text-caption text-muted-foreground md:mb-0">Theo thời gian, từ cũ đến mới</p>
          </div>
          {trace.logs.length > 0 ? (
            <TraceTimeline items={trace.logs} />
          ) : (
            <p className="text-small text-muted-foreground">Lô này chưa có nhật ký canh tác.</p>
          )}
        </section>

        <section aria-labelledby="cert-h">
          <h2 id="cert-h" className="mb-1 text-h2-sm font-bold text-ink md:text-h2">
            Chứng nhận
          </h2>
          <p className="mb-3 text-caption text-muted-foreground md:mb-3.5">
            Trạng thái tính đến ngày tra cứu {new Date().toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}
          </p>
          {trace.certifications.length > 0 ? (
            <CertificateList items={trace.certifications} />
          ) : (
            <p className="text-small text-muted-foreground">Nhà cung cấp chưa khai chứng nhận.</p>
          )}
        </section>

        <footer className="flex flex-col gap-2.5 border-t border-line pt-5 md:flex-row md:items-center md:justify-between md:gap-5">
          <p className="max-w-[520px] text-[12px] leading-[1.6] text-muted-foreground max-md:order-last max-md:text-center md:text-caption">
            Dữ liệu do nhà cung cấp ghi và được Farmery kiểm duyệt. Mọi chỉnh sửa đều được giữ lại và đánh dấu.
          </p>
          <div className="flex flex-col gap-2.5 md:flex-row">
            {!recalled && (
              <Link
                href={productHref(trace.product)}
                className="rounded-btn bg-primary px-[22px] py-[13px] text-center text-title font-semibold text-white hover:bg-primary-hover hover:text-white max-md:order-first md:py-[11px]"
              >
                Xem sản phẩm
              </Link>
            )}
            <Link
              href="/#tra-nguon-goc"
              className="rounded-btn border-[1.5px] border-primary px-5 py-3 text-center text-title font-semibold text-primary md:py-[11px]"
            >
              Tra lô khác
            </Link>
          </div>
        </footer>
      </main>
    </>
  );
}
