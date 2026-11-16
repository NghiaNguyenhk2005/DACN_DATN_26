import { expect, test } from "@playwright/test";
import { loginShop } from "../helpers";

test.describe("Shop — tìm kiếm có gợi ý, hiểu câu tìm; mua sỉ", () => {
  test("câu tìm có cụm lọc được chuyển thành bộ lọc, còn link tìm nguyên văn", async ({ page }) => {
    await page.goto(`/tim-kiem?q=${encodeURIComponent("dâu tây hữu cơ dưới 200k")}`);
    await expect(page).toHaveURL(/cert=organic/);
    await expect(page).toHaveURL(/maxPrice=200000/);
    await expect(page.getByText("Đã chuyển phần mô tả trong câu tìm thành bộ lọc")).toBeVisible();
    await expect(page.getByRole("link", { name: /Tìm đúng nguyên văn/ })).toBeVisible();
  });

  test("gõ ở ô tìm kiếm hiện gợi ý, chọn bằng bàn phím mở trang sản phẩm", async ({ page }) => {
    await page.goto("/");
    const box = page.getByRole("combobox", { name: "Tìm kiếm sản phẩm" });
    await box.fill("xa lach");
    const list = page.getByRole("listbox", { name: "Gợi ý tìm kiếm" });
    await expect(list.getByRole("option", { name: /Xà lách/ }).first()).toBeVisible();
    await box.press("ArrowDown");
    await box.press("Enter");
    await expect(page).toHaveURL(/\/san-pham\/.*xa-lach/);
  });

  test("doanh nghiệp mua sỉ gửi yêu cầu báo giá từ khung mua", async ({ page }) => {
    await loginShop(page, "khachsi@example.com");
    await page.goto("/san-pham/khoai-tay-17");
    await page.getByRole("radio", { name: "Mua sỉ" }).click();
    const buy = page.getByRole("complementary", { name: "Mua hàng" });
    await buy.getByLabel(/Sản lượng/).fill("300");
    await buy.getByRole("button", { name: "Gửi yêu cầu báo giá" }).click();
    await expect(buy.getByText(/Đã gửi tới/)).toBeVisible();
  });
});
