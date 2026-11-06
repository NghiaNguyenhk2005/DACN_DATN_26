import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  Factory,
  MapPin,
  QrCode,
  ShieldCheck,
  Star,
} from "lucide-react";
import { ProductCard } from "@/components/farmery/product-card";
import { SafeImage } from "@/components/farmery/safe-image";
import { getSupplier } from "@/lib/data";
import { formatDateVi } from "@/lib/format";
import { CERT_LABELS } from "@/lib/labels";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const supplier = await getSupplier(id);
  if (!supplier) return { title: "Không tìm thấy nhà cung cấp" };
  return {
    title: `${supplier.displayName} · Hồ sơ nguồn gốc nhà cung cấp`,
    description: supplier.description,
  };
}

export default async function PublicSupplierProfilePage({ params }: PageProps) {
  const { id } = await params;
  const supplier = await getSupplier(id);

  if (!supplier) notFound();

  const validCerts = supplier.certifications.filter((c) => c.valid);

  return (
    <div className="mx-auto max-w-5xl py-6 md:py-8 space-y-8">
      {/* Nút quay lại */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-small font-medium text-ink-2 hover:text-ink transition-colors"
        >
          <ArrowLeft className="size-4" aria-hidden /> Trang chủ
        </Link>
      </div>

      {/* Header Hồ sơ nhà cung cấp */}
      <section className="rounded-panel border border-line bg-surface p-6 md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          {/* Avatar / Logo đại diện */}
          <div className="relative size-24 shrink-0 overflow-hidden rounded-panel border border-line bg-surface-2 md:size-28">
            {supplier.avatarUrl ? (
              <SafeImage
                src={supplier.avatarUrl}
                alt={supplier.displayName}
                fill
                sizes="112px"
                className="object-cover"
              />
            ) : (
              <div className="grid h-full place-items-center text-primary">
                <Factory className="size-10" />
              </div>
            )}
          </div>

          {/* Thông tin nhà vườn */}
          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-0.5 text-caption font-semibold text-primary">
                <ShieldCheck className="size-3.5" />
                Đối tác liên kết Farmery
              </span>
              {supplier.reputationScore && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-caption font-semibold text-amber-600">
                  <Star className="size-3.5 fill-amber-500 text-amber-500" />
                  {supplier.reputationScore.toFixed(1)} / 5.0
                </span>
              )}
            </div>

            <h1 className="text-h2-sm font-bold text-ink md:text-h1">
              {supplier.displayName}
            </h1>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-small text-ink-2">
              <div className="flex items-center gap-1.5 font-medium text-ink">
                <MapPin className="size-4 text-primary shrink-0" />
                <span>Vùng trồng: {supplier.growingRegion}</span>
              </div>
              {supplier.growingAreaCode && (
                <div className="flex items-center gap-1.5 font-mono text-small text-subtle">
                  <QrCode className="size-3.5" />
                  <span>Mã vùng trồng: <strong className="text-ink">{supplier.growingAreaCode}</strong></span>
                </div>
              )}
            </div>

            <p className="pt-1 text-body leading-relaxed text-ink-2 whitespace-pre-line">
              {supplier.description}
            </p>
          </div>
        </div>
      </section>

      {/* Chứng nhận chất lượng nông sản */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-h3 font-bold text-ink flex items-center gap-2">
            <Award className="size-5 text-primary" />
            Chứng nhận & Tiêu chuẩn canh tác ({validCerts.length})
          </h2>
        </div>

        {validCerts.length === 0 ? (
          <p className="rounded-card border border-dashed border-line p-5 text-center text-small text-subtle">
            Nhà vườn đang trong quá trình gia hạn hoặc kiểm định chứng nhận mùa vụ mới.
          </p>
        ) : (
          <div className="grid gap-3.5 sm:grid-cols-2 md:grid-cols-3">
            {validCerts.map((cert) => (
              <div
                key={cert.certificateNumber}
                className="rounded-card border border-line bg-surface p-4 flex flex-col justify-between space-y-2.5"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-title text-primary">
                      {CERT_LABELS[cert.type] ?? cert.type}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded bg-leaf-soft px-2 py-0.5 text-micro font-semibold text-primary">
                      <CheckCircle2 className="size-3" /> Còn hiệu lực
                    </span>
                  </div>
                  <div className="mt-1 font-mono text-micro text-ink font-semibold">
                    Số: {cert.certificateNumber}
                  </div>
                </div>

                <div className="text-caption text-ink-2 border-t border-line/60 pt-2 space-y-0.5">
                  <div>Cơ quan cấp: <strong className="text-ink">{cert.issuingAuthority}</strong></div>
                  <div>Hạn hiệu lực: <strong className="text-ink">{formatDateVi(cert.expiryDate)}</strong></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Danh mục sản phẩm cung ứng */}
      <section className="space-y-4">
        <div className="flex items-baseline justify-between">
          <div>
            <h2 className="text-h3 font-bold text-ink">
              Nông sản đang phân phối ({supplier.products.length})
            </h2>
            <p className="text-small text-ink-2 mt-0.5">
              Nông sản thu hoạch trực tiếp tại vườn, đóng gói kèm tem QR truy xuất từng lô.
            </p>
          </div>
        </div>

        {supplier.products.length === 0 ? (
          <p className="rounded-card border border-dashed border-line p-6 text-center text-small text-subtle">
            Hiện tại các sản phẩm của nhà vườn đang chờ đợt thu hoạch mới.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4">
            {supplier.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

