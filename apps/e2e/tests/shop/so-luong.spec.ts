import { expect, test } from "@playwright/test";

test.describe("Shop — ô số lượng ở khung mua", () => {
  test("hàng bán theo kg nhập lẻ được, tạm tính theo số lẻ", async ({ page }) => {
    await page.goto("/san-pham/khoai-tay-17"); // 38.000₫/kg
    const buy = page.getByRole("complementary", { name: "Mua hàng" });
    const qty = buy.getByRole("textbox", { name: "số lượng" });
    await qty.fill("1.5");
    await qty.press("Enter");
    await expect(qty).toHaveValue("1,5");
    await expect(buy.getByText("57.000₫")).toBeVisible();
    await buy.getByRole("button", { name: "Tăng số lượng" }).click();
    await expect(qty).toHaveValue("2");
  });

  test("hàng đóng hộp chỉ nhận số nguyên, có câu giải thích", async ({ page }) => {
    await page.goto("/san-pham/dau-tay-1"); // hộp 500g
    const buy = page.getByRole("complementary", { name: "Mua hàng" });
    const qty = buy.getByRole("textbox", { name: "số lượng" });
    await qty.fill("2,4");
    await qty.press("Enter");
    await expect(qty).toHaveValue("2");
    await expect(buy.getByText("nhập số nguyên")).toBeVisible();
  });
});
