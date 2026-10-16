import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/farmery/login-form";
import { getViewer } from "@/lib/data/account";
import { parsePendingAdd, safeNext } from "@/lib/session";

export const metadata: Metadata = { title: "Đăng nhập" };

export default async function LoginPage({ searchParams }: PageProps<"/dang-nhap">) {
  const sp = await searchParams;
  const next = safeNext(sp.next);
  const them = typeof sp.them === "string" && parsePendingAdd(sp.them) ? sp.them : undefined;

  // Đã đăng nhập thì quay lại luôn; API lỗi thì vẫn cho hiện form (form tự báo lỗi khi gửi).
  const viewer = await getViewer().catch(() => null);
  if (viewer) redirect(next);

  return (
    <div className="mx-auto max-w-[420px] py-8 md:py-14">
      <div className="rounded-panel border border-border p-5 md:p-7">
        <h1 className="mb-1.5 font-serif text-h1-sm font-bold text-ink">Đăng nhập</h1>
        <p className="mb-5 text-small text-muted-foreground">
          {them
            ? "Đăng nhập để thêm sản phẩm vào giỏ. Xong bạn sẽ quay lại đúng trang đang xem."
            : next.startsWith("/gio-hang") || next.startsWith("/thanh-toan") || next.startsWith("/don-hang")
              ? "Đăng nhập để xem giỏ hàng và đặt đơn."
              : "Dùng email để nhận mã đăng nhập một lần, không cần mật khẩu."}
        </p>
        <LoginForm next={next} them={them} />
      </div>
    </div>
  );
}
