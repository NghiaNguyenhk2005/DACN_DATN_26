import { expect, test } from "@playwright/test";
import { loginShop } from "../helpers";

test.describe("Shop — nhà cung cấp đăng sản phẩm mới", () => {
  test("mở từ nút Đăng sản phẩm, thêm chứng nhận tại chỗ, gửi duyệt rồi thấy ở Sản phẩm", async ({ page }) => {
    await loginShop(page, "nongdan@example.com");
    await page.goto("/nha-cung-cap");
    await page.getByRole("link", { name: "Đăng sản phẩm" }).first().click();
    await expect(page).toHaveURL("/nha-cung-cap/san-pham/tao-moi");

    const name = `Mâm xôi Đà Lạt e2e ${Date.now()}`;
    await page.getByLabel(/Tên sản phẩm/).fill(name);
    await page.getByRole("combobox", { name: /Danh mục/ }).selectOption({ index: 1 });
    await page.getByLabel(/Đơn vị bán/).fill("hộp 125g");

    // HACCP chưa khai báo: mở sheet nhập tại chỗ, lưu xong ô HACCP tự được tích.
    await page.locator("li", { hasText: "HACCP — chưa khai báo" }).getByRole("button", { name: "Thêm chứng nhận" }).click();
    const sheet = page.getByRole("dialog");
    await sheet.getByLabel(/Số chứng nhận/).fill("HACCP-E2E-01");
    await sheet.getByLabel(/Cơ quan cấp/).fill("Bureau Veritas Việt Nam");
    await sheet.getByLabel(/Ngày cấp/).fill("2026-01-10");
    await sheet.getByLabel(/Ngày hết hiệu lực/).fill("2029-01-10");
    await sheet.getByRole("button", { name: "Gửi duyệt chứng nhận" }).click();
    await expect(sheet).toBeHidden();
    await expect(page.getByRole("checkbox", { name: /HACCP/ })).toBeChecked();

    await page.getByRole("button", { name: "Gửi duyệt", exact: true }).click();
    await expect(page).toHaveURL(/\/nha-cung-cap\/san-pham\?thanh-cong=1/, { timeout: 15_000 });
    await expect(page.getByText(name)).toBeVisible();
  });
});
