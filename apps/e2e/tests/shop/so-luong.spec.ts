import { expect, test } from "@playwright/test";
import { loginShop } from "../helpers";

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

  test("giỏ hàng: cập nhật số lượng lỗi thì ô quay về số đang có trong giỏ", async ({ page }) => {
    await loginShop(page, "khachle@example.com");
    await page.goto("/san-pham/khoai-tay-17");
    await page.getByRole("complementary", { name: "Mua hàng" }).getByRole("button", { name: "Thêm vào giỏ" }).click();
    await expect(page.getByText("Đã thêm vào giỏ").first()).toBeVisible();

    await page.goto("/gio-hang");
    const qty = page.getByRole("textbox", { name: /số lượng Khoai tây/ }).first();
    const before = await qty.inputValue();
    // Server Action gửi POST có header "next-action": cắt kết nối để mô phỏng mất mạng.
    await page.route("**/gio-hang", (route) => (route.request().headers()["next-action"] ? route.abort() : route.continue()));
    await qty.fill("3");
    await qty.press("Enter");
    await expect(page.getByText("Không kết nối được máy chủ")).toBeVisible();
    await expect(qty).toHaveValue(before);
  });
});
