import { expect, test, type Browser, type Page } from "@playwright/test";
import { ADMIN_URL, SHOP_URL } from "../../playwright.config";
import { loginAdmin, loginShop } from "../helpers";

// Mỗi vai một context riêng để cookie shop và token admin không lẫn nhau.
async function newPage(browser: Browser): Promise<Page> {
  const context = await browser.newContext({ locale: "vi-VN" });
  return context.newPage();
}

async function createBatch(seller: Page): Promise<string> {
  await seller.goto(`${SHOP_URL}/nha-cung-cap/lo-hang/tao-moi`);
  await seller.getByRole("button", { name: "Gửi duyệt lô hàng" }).click();
  await expect(seller).toHaveURL(/\/nha-cung-cap\/lo-hang\/[^/?]+\?thanh-cong=1/);
  await expect(seller.getByText("Khai báo lô hàng thành công!")).toBeVisible();
  return seller.getByText("Khai báo lô hàng thành công!").locator("xpath=..").locator("strong.font-mono").innerText();
}

async function openReviewTask(staff: Page, batchCode: string) {
  await staff.goto(`${ADMIN_URL}/kiem-duyet`);
  await staff.getByRole("link", { name: new RegExp(`Lô ${batchCode}`) }).click();
  await expect(staff.getByText(batchCode).first()).toBeVisible();
}

test.describe("Kịch bản lô hàng — nhà cung cấp, kiểm duyệt, truy xuất", () => {
  test("đăng lô, ghi nhật ký, cán bộ duyệt, khách mở trang truy xuất", async ({ browser }) => {
    const seller = await newPage(browser);
    await loginShop(seller, "nongdan@example.com");
    const batchCode = await createBatch(seller);
    await expect(seller.getByText("Chờ kiểm định")).toBeVisible();

    const logText = `Tưới nhỏ giọt e2e ${Date.now()}`;
    await seller.getByRole("button", { name: "Thêm mục nhật ký" }).click();
    await seller.getByLabel(/Mô tả chi tiết công việc canh tác/).fill(logText);
    await seller.getByRole("button", { name: "Lưu nhật ký canh tác" }).click();
    await expect(seller.getByText(logText).first()).toBeVisible();

    const staff = await newPage(browser);
    await loginAdmin(staff, "staff@example.com");
    await openReviewTask(staff, batchCode);
    await expect(staff.getByText(logText)).toBeVisible();
    await staff.getByRole("button", { name: "Duyệt", exact: true }).click();
    await staff.locator(".ant-popconfirm").getByRole("button", { name: "Duyệt" }).click();
    await expect(staff.getByText("Mã QR truy xuất")).toBeVisible();
    const traceCode = await staff.getByText(/^TRC-/).first().innerText();

    const buyer = await newPage(browser);
    await buyer.goto(`${SHOP_URL}/truy-xuat/${traceCode}`);
    await expect(buyer.getByText(batchCode).first()).toBeVisible();
    await expect(buyer.getByText(logText)).toBeVisible();

    await seller.reload();
    await expect(seller.getByText("Đã phê duyệt mở bán")).toBeVisible();
  });

  test("cán bộ từ chối lô kèm lý do, nhà cung cấp thấy lô bị từ chối", async ({ browser }) => {
    const seller = await newPage(browser);
    await loginShop(seller, "nongdan@example.com");
    const batchCode = await createBatch(seller);

    const staff = await newPage(browser);
    await loginAdmin(staff, "staff@example.com");
    await openReviewTask(staff, batchCode);
    await staff.getByRole("button", { name: "Từ chối", exact: true }).click();
    const dialog = staff.getByRole("dialog", { name: "Từ chối việc duyệt" });
    await expect(dialog.getByRole("button", { name: "Từ chối" })).toBeDisabled();
    await dialog.getByRole("textbox").fill("Thiếu nhật ký bón phân tuần trước.");
    await dialog.getByRole("button", { name: "Từ chối" }).click();
    await expect(dialog).toBeHidden();
    await expect(staff.locator(".ant-descriptions").getByText("Thiếu nhật ký bón phân tuần trước.")).toBeVisible();

    await seller.reload();
    await expect(seller.getByText("Bị từ chối")).toBeVisible();
  });
});
