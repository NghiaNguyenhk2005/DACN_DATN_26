import { expect, test } from "@playwright/test";

test.describe("Shop — đăng nhập OTP", () => {
  test("nhận mã demo, đăng nhập rồi thấy tên tài khoản trên đầu trang", async ({ page }) => {
    await page.goto("/dang-nhap");
    await page.getByLabel("Email").fill("nongdan@example.com");
    await page.getByRole("button", { name: "Nhận mã đăng nhập" }).click();

    await expect(page.getByText("Đã gửi mã tới")).toBeVisible();
    const devCode = await page.locator("strong.tracking-widest").innerText();
    expect(devCode).toMatch(/^\d{6}$/);

    await page.getByLabel("Mã OTP").fill(devCode);
    await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();

    await expect(page).toHaveURL("/");
    await expect(page.getByRole("button", { name: /^Tài khoản: / })).toBeVisible();
  });

  test("sai mã OTP thì báo lỗi và ở lại trang", async ({ page }) => {
    await page.goto("/dang-nhap");
    await page.getByLabel("Email").fill("nongdan@example.com");
    await page.getByRole("button", { name: "Nhận mã đăng nhập" }).click();

    await page.getByLabel("Mã OTP").fill("000000");
    await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();

    await expect(page.locator("#code-error")).toHaveText("Mã OTP không đúng hoặc đã hết hạn.");
    await expect(page).toHaveURL(/\/dang-nhap/);
  });

  test("email sai định dạng thì không gửi mã", async ({ page }) => {
    await page.goto("/dang-nhap");
    await page.getByLabel("Email").fill("khong-phai-email");
    await page.getByRole("button", { name: "Nhận mã đăng nhập" }).click();

    await expect(page.locator("#email-error")).toHaveText("Email chưa đúng định dạng.");
  });
});
