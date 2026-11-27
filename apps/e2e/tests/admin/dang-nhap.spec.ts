import { expect, test, type Page } from "@playwright/test";
import resetDemo from "../global-setup";

test.beforeEach(() => resetDemo());

async function requestOtp(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Gửi mã OTP" }).click();
  const notice = page.getByText(/Bản demo — mã OTP: \d{6}/);
  await expect(notice).toBeVisible();
  return (await notice.innerText()).match(/\d{6}/)![0];
}

// Input.OTP của antd là 6 ô; điền từng ô để ghi đè mã cũ còn trong ô (gõ liền vào ô đã có chữ làm lệch các chữ số).
async function submitOtp(page: Page, code: string) {
  const boxes = page.locator(".ant-otp input");
  for (const [index, digit] of [...code].entries()) await boxes.nth(index).fill(digit);
  // Nút này dùng lại phần tử của nút "Gửi mã OTP" nên tên có thể còn dính "loading" — không so tên chính xác.
  await page.getByRole("button", { name: "Đăng nhập" }).click();
}

test.describe("Admin — đăng nhập OTP", () => {
  test("cán bộ kiểm duyệt đăng nhập, vào Tổng quan và thấy menu Kiểm duyệt", async ({ page }) => {
    const code = await requestOtp(page, "staff@example.com");
    await submitOtp(page, code);

    await expect(page).toHaveURL("/");
    await expect(page.getByText("Tổng quan").first()).toBeVisible();
    await expect(page.getByRole("menuitem", { name: /Kiểm duyệt/ })).toBeVisible();
    await expect(page.locator(".ant-statistic-title", { hasText: "Chờ duyệt" })).toBeVisible();
    await expect(page.getByText("Gần hạn nhất")).toBeVisible();
  });

  test("menu theo vai trò: chủ nền tảng thấy Cấu hình, không thấy Tồn kho", async ({ page }) => {
    const code = await requestOtp(page, "chu@farmery.vn");
    await submitOtp(page, code);

    await expect(page.getByRole("menuitem", { name: /Cấu hình/ })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: /Tồn kho/ })).toHaveCount(0);
    await page.getByRole("menuitem", { name: /Cấu hình/ }).click();
    await expect(page).toHaveURL("/cau-hinh");
    await expect(page.getByText("Cấu hình nền tảng")).toBeVisible();
  });

  test("tài khoản không phải nhân viên bị chặn", async ({ page }) => {
    const code = await requestOtp(page, "nongdan@example.com");
    await submitOtp(page, code);

    await expect(page.getByText("Tài khoản này không có quyền vào ứng dụng nội bộ.").first()).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("gửi lại bị giới hạn, đếm ngược và giữ mã cũ còn hiệu lực", async ({ page }) => {
    const firstCode = await requestOtp(page, "staff@example.com");
    await submitOtp(page, firstCode === "000000" ? "111111" : "000000");
    await expect(page.getByText("Mã OTP không đúng.").first()).toBeVisible();
    await expect(page).toHaveURL(/\/login/);

    const response = page.waitForResponse((r) => r.url().endsWith("/api/auth/otp") && r.status() === 429);
    const resend = page.locator("button").filter({ hasText: /^Gửi lại mã/ });
    await resend.click();
    expect(Number((await response).headers()["retry-after"])).toBeGreaterThan(0);
    await expect(resend).toHaveText(/Gửi lại mã \(\d+s\)/);
    await expect(resend).toBeDisabled();
    await expect(page.locator(".ant-otp input").first()).toBeEnabled();
    await expect(resend).toHaveText("Gửi lại mã");
    await submitOtp(page, firstCode);
    await expect(page).toHaveURL("/");
  });

  test("nhập sai năm lần làm hết hiệu lực mã và mở nút gửi mã mới", async ({ page }) => {
    const code = await requestOtp(page, "kho@farmery.vn");
    const wrong = code === "000000" ? "111111" : "000000";
    for (let i = 0; i < 5; i += 1) {
      const invalid = page.waitForResponse((r) => r.url().endsWith("/api/auth/login") && r.status() === 401);
      await submitOtp(page, wrong);
      await invalid;
      if (i < 4) await expect(page.getByRole("button", { name: "Đăng nhập" })).toBeEnabled();
    }
    await expect(page.locator(".ant-otp input").first()).toBeDisabled();
    const resend = page.locator("button").filter({ hasText: /^Gửi mã mới/ });
    const otpResponse = () => page.waitForResponse((r) => r.url().endsWith("/api/auth/otp") && r.request().method() === "POST");
    let response = otpResponse();
    await resend.click();
    if ((await response).status() === 429) {
      await expect(resend).toBeDisabled();
      await expect(resend).toBeEnabled();
      response = otpResponse();
      await resend.click();
    }
    expect((await response).ok()).toBe(true);
    await submitOtp(page, code);
    await expect(page).toHaveURL("/");
  });

  for (const route of ["/", "/van-hanh", "/kho", "/cau-hinh"]) {
    test(`phiên hết hạn trên ${route} thì tự về đăng nhập`, async ({ page }) => {
      await page.clock.install();
      await submitOtp(page, await requestOtp(page, "vanhanh@farmery.vn"));
      await expect(page).toHaveURL("/");
      await page.goto(route);
      await expect(page.getByRole("menuitem", { name: /Vận hành đơn/ })).toBeVisible();
      const expiry = await page.evaluate(() => {
        const payload = localStorage.getItem("farmery-admin-token")?.split(".")[1];
        if (!payload) throw new Error("Thiếu token admin");
        return (JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/"))) as { exp: number }).exp * 1000;
      });
      await page.clock.setSystemTime(expiry + 1);
      await page.evaluate(() => window.dispatchEvent(new Event("focus")));
      await expect(page).toHaveURL("/login");
      expect(await page.evaluate(() => localStorage.getItem("farmery-admin-token"))).toBeNull();
    });
  }

  test("chưa đăng nhập thì bị đưa về /login", async ({ page }) => {
    await page.goto("/kiem-duyet");
    await expect(page).toHaveURL(/\/login/);
  });
});
