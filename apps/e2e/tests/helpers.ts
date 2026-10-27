import { expect, type Page } from "@playwright/test";
import { ADMIN_URL, SHOP_URL } from "../playwright.config";

export async function loginShop(page: Page, email: string) {
  await page.goto(`${SHOP_URL}/dang-nhap`);
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Nhận mã đăng nhập" }).click();
  const code = await page.locator("strong.tracking-widest").innerText();
  await page.getByLabel("Mã OTP").fill(code);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page.getByRole("button", { name: /^Tài khoản: / })).toBeVisible();
}

export async function loginAdmin(page: Page, email: string) {
  await page.goto(`${ADMIN_URL}/login`);
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Gửi mã OTP" }).click();
  const notice = page.getByText(/Bản demo — mã OTP: \d{6}/);
  const code = (await notice.innerText()).match(/\d{6}/)![0];
  await page.locator(".ant-otp input").first().click();
  await page.keyboard.type(code);
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page).toHaveURL(`${ADMIN_URL}/`);
}
