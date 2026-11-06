import { expect, test, type Browser, type Page } from "@playwright/test";
import { ADMIN_URL, SHOP_URL } from "../../playwright.config";
import { loginAdmin, loginShop } from "../helpers";

const HANA = "Dâu tây Hana Đà Lạt (Hộp 500g)"; // 125.000₫/hộp, slug dau-tay-1

// Mỗi vai một context riêng để cookie shop và token admin không lẫn nhau.
async function newPage(browser: Browser): Promise<Page> {
  const context = await browser.newContext({ locale: "vi-VN" });
  return context.newPage();
}

async function setQuantity(page: Page, quantity: number) {
  const buy = page.getByRole("complementary", { name: "Mua hàng" });
  const qty = buy.getByRole("textbox", { name: "số lượng" });
  await qty.fill(String(quantity));
  await qty.press("Enter");
  await expect(qty).toHaveValue(String(quantity));
  return buy;
}

test.describe("Kịch bản mua hàng — khách lẻ, vận hành", () => {
  test("tìm 'dau tay', đăng nhập khi thêm giỏ, đặt đơn trả trước; vận hành chuyển bước, khách thấy dòng thời gian", async ({
    browser,
  }) => {
    const buyer = await newPage(browser);

    // 1. Khách vãng lai gõ không dấu → chỉ ra dâu tây → mở chi tiết → thêm vào giỏ.
    await buyer.goto(SHOP_URL);
    const box = buyer.getByRole("combobox", { name: "Tìm kiếm sản phẩm" });
    await box.fill("dau tay");
    await box.press("Enter");
    await expect(buyer).toHaveURL(/\/tim-kiem\?q=dau(\+|%20)tay/);
    await expect(buyer.getByRole("link", { name: HANA }).first()).toBeVisible();
    await expect(buyer.getByRole("link", { name: /Trà Ô Long|Khoai tây/ })).toHaveCount(0);
    await buyer.getByRole("link", { name: HANA }).first().click();
    await expect(buyer).toHaveURL(/\/san-pham\/dau-tay-hana-[a-z0-9-]*-1$/);

    const buy = await setQuantity(buyer, 2);
    await buy.getByRole("button", { name: "Thêm vào giỏ" }).click();

    // 2. Chưa đăng nhập → sang trang đăng nhập, giữ món chờ thêm; đăng nhập xong món vào giỏ.
    await expect(buyer).toHaveURL(/\/dang-nhap\?.*them=/);
    await buyer.getByLabel("Email").fill("khachle@example.com");
    await buyer.getByRole("button", { name: "Nhận mã đăng nhập" }).click();
    await buyer.getByLabel("Mã OTP").fill(await buyer.locator("strong.tracking-widest").innerText());
    await buyer.getByRole("button", { name: "Đăng nhập", exact: true }).click();
    await expect(buyer.getByRole("button", { name: /^Tài khoản: / })).toBeVisible();

    await buyer.goto(`${SHOP_URL}/gio-hang`);
    await expect(buyer.getByRole("textbox", { name: new RegExp(`số lượng ${HANA.slice(0, 12)}`) })).toHaveValue("2");
    await buyer.getByRole("link", { name: "Thanh toán", exact: true }).click();
    await expect(buyer).toHaveURL(/\/thanh-toan/);

    // Địa chỉ mẫu đã chọn sẵn; chọn khung giờ còn nhận đơn cuối cùng; đơn nhỏ thì COD chọn được.
    await expect(buyer.getByRole("radiogroup", { name: "Địa chỉ giao hàng" }).getByRole("radio").first()).toBeChecked();
    const slot = buyer.locator("label:has(input[name=slot]:not([disabled]))").last();
    await slot.click();
    await expect(slot.locator("input")).toBeChecked();
    await expect(buyer.getByRole("radio", { name: /Tiền mặt khi nhận hàng/ })).toBeEnabled();
    await buyer.getByRole("radio", { name: /Thanh toán trước/ }).check();
    await buyer.getByRole("complementary", { name: "Tóm tắt đơn hàng" }).getByRole("button", { name: "Đặt hàng" }).click();

    // Đơn trả trước giữ chỗ 15 phút: thấy đếm ngược rồi thanh toán giả lập.
    await expect(buyer).toHaveURL(/\/don-hang\/[^/?]+$/, { timeout: 15_000 });
    const orderId = buyer.url().split("/").pop()!;
    await expect(buyer.getByRole("timer")).toHaveAccessibleName(/^Còn 1[45] phút/);
    await buyer.getByRole("button", { name: /^Thanh toán [\d.]+₫$/ }).click();
    await expect(buyer.getByRole("heading", { name: "Đặt hàng thành công" })).toBeVisible();

    // 3. Vận hành chuyển đơn qua hai bước → khách tải lại thấy dòng thời gian ở bước mới.
    const ops = await newPage(browser);
    await loginAdmin(ops, "vanhanh@farmery.vn");
    await ops.goto(`${ADMIN_URL}/van-hanh/${orderId}`);
    for (const step of ["Đang đóng gói", "Lên chuyến trung chuyển"]) {
      await ops.getByRole("button", { name: new RegExp(`Chuyển sang: ${step}`) }).click();
      await ops.getByRole("dialog").getByRole("button", { name: "Chuyển bước" }).click();
      await expect(ops.getByText(`Đơn đã chuyển sang: ${step}.`)).toBeVisible();
    }

    await buyer.reload();
    await expect(buyer.locator("[aria-current=step]")).toContainText("Lên chuyến trung chuyển");
  });

  test("đơn trên 1.000.000₫ thì không chọn được COD và hiện lý do", async ({ page }) => {
    await loginShop(page, "khachle@example.com");
    await page.goto(`${SHOP_URL}/san-pham/dau-tay-1`);
    const buy = await setQuantity(page, 9); // 9 × 125.000₫ = 1.125.000₫
    await buy.getByRole("button", { name: "Thêm vào giỏ" }).click();
    await expect(page.getByText("Đã thêm vào giỏ").first()).toBeVisible();

    await page.goto(`${SHOP_URL}/thanh-toan`);
    await expect(page.getByRole("radio", { name: /Tiền mặt khi nhận hàng/ })).toBeDisabled();
    await expect(page.locator("#cod-note")).toContainText(/COD không áp dụng cho đơn này: \S/);

    // Dọn giỏ để các ca sau không dính món này.
    await page.goto(`${SHOP_URL}/gio-hang`);
    await page.getByRole("listitem").filter({ hasText: HANA }).getByRole("button", { name: /Xóa/ }).click();
    await expect(page.getByRole("textbox", { name: new RegExp(`số lượng ${HANA.slice(0, 12)}`) })).toHaveCount(0);
  });
});
