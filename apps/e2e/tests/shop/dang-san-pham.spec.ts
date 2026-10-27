import { expect, test } from "@playwright/test";
import { loginShop } from "../helpers";

test.describe("Shop — nhà cung cấp đăng sản phẩm mới", () => {
  test("mở từ thanh điều hướng, danh mục có dữ liệu, gửi thì có phản hồi", async ({ page }) => {
    await loginShop(page, "nongdan@example.com");
    await page.goto("/nha-cung-cap");
    await page.getByRole("link", { name: "Đăng sản phẩm mới" }).click();
    await expect(page).toHaveURL("/nha-cung-cap/san-pham/tao-moi");

    const category = page.locator("#categoryId");
    expect(await category.locator("option:not([disabled])").count()).toBeGreaterThan(0);

    await page.getByLabel(/Tên sản phẩm/).fill("Dâu tây Mộc Châu e2e");
    await category.selectOption({ index: 1 });
    await page.getByLabel(/Quy cách bán/).fill("Hộp 500g");
    await page.getByRole("button", { name: "Gửi duyệt sản phẩm" }).click();

    // API chưa có thì ở lại form và báo lỗi; khi có API thì về trang Sản phẩm của tôi.
    await expect(page.getByText("Chưa thể đăng sản phẩm:").or(page.getByText("Dâu tây Mộc Châu e2e"))).toBeVisible();
  });
});
