import { expect, test, type Page } from "@playwright/test";

async function requestOtp(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Gửi mã OTP" }).click();
  const notice = page.getByText(/Bản demo — mã OTP: \d{6}/);
  await expect(notice).toBeVisible();
  return (await notice.innerText()).match(/\d{6}/)![0];
}

// Input.OTP của antd là 6 ô; gõ vào ô đầu thì con trỏ tự sang ô sau.
async function submitOtp(page: Page, code: string) {
  await page.locator(".ant-otp input").first().click();
  await page.keyboard.type(code);
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

  test("tài khoản không phải nhân viên bị chặn", async ({ page }) => {
    const code = await requestOtp(page, "nongdan@example.com");
    await submitOtp(page, code);

    await expect(page.getByText("Tài khoản này không có quyền vào ứng dụng nội bộ.")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("chưa đăng nhập thì bị đưa về /login", async ({ page }) => {
    await page.goto("/kiem-duyet");
    await expect(page).toHaveURL(/\/login/);
  });
});
