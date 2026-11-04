import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { Badge, ReviewStatusBadge } from "@/components/farmery/status-badge";
import { getSupplier } from "@/lib/data";
import { requireViewer } from "@/lib/data/account";
import { getSellerCertifications } from "@/lib/data/seller";
import { certValidity, todayVn } from "@/lib/decision";
import { formatDateVi } from "@/lib/format";
import { CERT_LABELS, CERT_VALIDITY_LABELS } from "@/lib/labels";
import { CertificationForm } from "../certification-form";

export const metadata: Metadata = { title: "Hồ sơ & chứng nhận" };

const VALIDITY_TONE = { valid: "success", expiring: "warning", expired: "danger" } as const;

/** Hồ sơ (chỉ đọc ở prototype) + chứng nhận: trạng thái duyệt, hiệu lực, khai báo chứng nhận mới (design/05 N7). */
export default async function SellerProfilePage() {
  const viewer = await requireViewer("/nha-cung-cap/ho-so");
  const [supplier, certs] = await Promise.all([getSupplier(viewer.supplierId!), getSellerCertifications()]);
  const today = todayVn();

  return (
    <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-10">
      <div className="flex flex-col gap-7">
        {supplier && (
          <section aria-labelledby="ho-so">
            <h2 id="ho-so" className="mb-3 text-h2-sm font-bold text-ink md:text-h2">
              Hồ sơ
            </h2>
            <dl className="grid gap-x-6 gap-y-3 rounded-card border border-line p-4 text-small sm:grid-cols-2">
              <div>
                <dt className="text-caption text-subtle">Tên hiển thị</dt>
                <dd className="font-medium text-ink">{supplier.displayName}</dd>
              </div>
              <div>
                <dt className="text-caption text-subtle">Vùng trồng</dt>
                <dd className="font-medium text-ink">{supplier.growingRegion}</dd>
              </div>
              <div>
                <dt className="text-caption text-subtle">Mã vùng trồng</dt>
                <dd className="font-medium text-ink">{supplier.growingAreaCode ?? "Chưa có"}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-caption text-subtle">Giới thiệu</dt>
                <dd className="text-ink-2">{supplier.description}</dd>
              </div>
            </dl>
            <p className="mt-2 text-caption text-ink-2">Muốn sửa hồ sơ, liên hệ nhân viên hỗ trợ vùng.</p>
          </section>
        )}

        <section aria-labelledby="chung-nhan">
          <h2 id="chung-nhan" className="mb-3 text-h2-sm font-bold text-ink md:text-h2">
            Chứng nhận
          </h2>
          {certs.length === 0 ? (
            <p className="rounded-card border border-dashed border-line-strong px-5 py-6 text-small text-ink-2">
              Chưa khai báo chứng nhận nào. Sản phẩm có chứng nhận được người mua tin tưởng hơn.
            </p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {certs.map((c) => {
                const validity = certValidity(c, today);
                return (
                  <li key={c.id} className="flex flex-wrap items-start gap-3 rounded-card border border-line px-4 py-3.5">
                    <ShieldCheck className="mt-0.5 size-5 flex-none text-primary" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="text-title font-semibold text-ink">{CERT_LABELS[c.type]}</p>
                      <p className="mt-0.5 text-small text-ink-2">
                        Số {c.certificateNumber} · {c.issuingAuthority}
                      </p>
                      <p className="mt-0.5 text-small text-ink-2">
                        Hiệu lực {formatDateVi(c.issuedDate)} – {formatDateVi(c.expiryDate)}
                      </p>
                      {c.status === "rejected" && c.rejectReason && <p className="mt-1.5 text-small text-danger">Lý do: {c.rejectReason}</p>}
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <ReviewStatusBadge status={c.status} />
                      {c.status === "approved" && <Badge tone={VALIDITY_TONE[validity]}>{CERT_VALIDITY_LABELS[validity]}</Badge>}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <section aria-labelledby="them-chung-nhan" className="h-fit rounded-panel border border-line p-5">
        <h2 id="them-chung-nhan" className="mb-1 text-h3 font-bold text-ink">
          Khai báo chứng nhận
        </h2>
        <p className="mb-4 text-small text-ink-2">Chứng nhận hiện cho người mua sau khi kiểm duyệt viên đối chiếu, thường trong 48 giờ.</p>
        <CertificationForm returnTo="/nha-cung-cap/ho-so" />
      </section>
    </div>
  );
}
