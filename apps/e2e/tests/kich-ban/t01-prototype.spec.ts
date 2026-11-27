import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import { ADMIN_URL, API_URL, SHOP_URL } from "../../playwright.config";
import resetDemo from "../global-setup";
import { loginAdmin, loginShop } from "../helpers";

test.beforeEach(() => resetDemo());

async function shopToken(page: Page) {
  const token = (await page.context().cookies(SHOP_URL)).find((cookie) => cookie.name === "farmery_token");
  if (!token) throw new Error("Thiếu cookie đăng nhập Shop");
  return token.value;
}

async function buyerToken(request: APIRequestContext, email: string) {
  const otp = await request.post(`${API_URL}/auth/otp`, { data: { email } });
  expect(otp.ok()).toBe(true);
  const { challengeId, devCode } = await otp.json();
  const login = await request.post(`${API_URL}/auth/login`, { data: { challengeId, code: devCode } });
  expect(login.ok()).toBe(true);
  return (await login.json()).accessToken as string;
}

test("điện thoại: báo tên món hết hàng cạnh nút đặt, kho hiển thị hạn sử dụng và lọc dòng hết tồn", async ({ page, request }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await loginShop(page, "khachle@example.com");
  const shopperToken = await shopToken(page);
  await page.goto(`${SHOP_URL}/san-pham/dau-tay-1`);
  await page.getByRole("button", { name: "Thêm vào giỏ" }).click();
  await expect(page.getByText("Đã thêm vào giỏ").first()).toBeVisible();
  await page.goto(`${SHOP_URL}/thanh-toan`);
  const place = page.getByRole("button", { name: "Đặt hàng", exact: true });
  await expect(place).toBeEnabled();

  const token = await buyerToken(request, "khachtuchoi@example.com");
  const headers = { Authorization: `Bearer ${token}` };
  const address = await request.post(`${API_URL}/me/addresses`, {
    headers,
    data: {
      recipientName: "Khách kiểm thử",
      phone: "0987654321",
      addressLine: "12 Phan Đình Phùng",
      ward: "Phường 1",
      province: "Lâm Đồng",
    },
  });
  expect(address.ok()).toBe(true);
  const addressId = (await address.json()).id;
  const { listing } = await (await request.get(`${API_URL}/products/1`)).json();
  const cart = await request.put(`${API_URL}/cart/items/${listing.id}`, { headers, data: { quantity: listing.available } });
  expect(cart.ok()).toBe(true);
  const productName = (await cart.json()).items[0].productName as string;
  const quote = await request.post(`${API_URL}/checkout/quote`, { headers, data: { addressId } });
  expect(quote.ok()).toBe(true);
  const slot = (await quote.json()).deliverySlots.find((s: { available: boolean }) => s.available);
  const placed = await request.post(`${API_URL}/orders`, {
    headers: { ...headers, "Idempotency-Key": crypto.randomUUID() },
    data: { addressId, deliveryDate: slot.date, deliverySlot: slot.slot, paymentOption: "prepaid" },
  });
  expect(placed.ok()).toBe(true);
  const order = await placed.json();

  try {
    const paid = await request.post(`${API_URL}/orders/${order.id}/pay`, { headers });
    expect(paid.ok()).toBe(true);
    await place.click();
    const error = page.getByRole("alert").filter({ hasText: productName });
    await expect(error).toBeInViewport();
    const cartLink = error.getByRole("link", { name: /Quay lại giỏ hàng/ });
    await expect(cartLink).toHaveAttribute("href", "/gio-hang");
    const errorBox = await error.boundingBox();
    const placeBox = await place.boundingBox();
    expect(placeBox!.y - (errorBox!.y + errorBox!.height)).toBeLessThan(24);
    await cartLink.click();
    await expect(page).toHaveURL(/\/gio-hang$/);

    await page.setViewportSize({ width: 1440, height: 900 });
    await loginAdmin(page, "kho@farmery.vn");
    await page.goto(`${ADMIN_URL}/kho`);
    const search = page.getByLabel("Lọc theo tên sản phẩm hoặc mã lô");
    const batchCode = order.items[0].batchCode as string;
    await search.fill(batchCode);
    const row = page.getByRole("row").filter({ hasText: batchCode });
    await expect(row.getByText("Hết hàng")).toBeVisible();
    await expect(row).toHaveClass(/inventory-out-of-stock/);
    await expect(row.getByText(/^\d{2}\/\d{2}\/\d{4}$/)).toBeVisible();
    await search.fill("không khớp lô nào");
    await expect(row).toHaveCount(0);
    await search.fill(productName);
    await expect(row).toBeVisible();
  } finally {
    const cancelled = await request.post(`${API_URL}/orders/${order.id}/cancel`, { headers });
    expect(cancelled.ok()).toBe(true);
    const cleanup = await request.delete(`${API_URL}/cart/items/${listing.id}`, {
      headers: { Authorization: `Bearer ${shopperToken}` },
    });
    expect(cleanup.ok()).toBe(true);
  }
});

test("trang chờ tự đổi trạng thái khi thanh toán ở nơi khác và cho hủy đơn đã trả", async ({ page, request }) => {
  await loginShop(page, "khachle@example.com");
  await page.goto(`${SHOP_URL}/san-pham/dau-tay-1`);
  await page.getByRole("button", { name: "Thêm vào giỏ" }).click();
  await expect(page.getByText("Đã thêm vào giỏ").first()).toBeVisible();
  await page.goto(`${SHOP_URL}/thanh-toan`);
  await page.getByRole("button", { name: "Đặt hàng", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Chờ thanh toán" })).toBeVisible();
  const orderId = page.url().split("/").pop();
  const token = await shopToken(page);
  const paid = await request.post(`${API_URL}/orders/${orderId}/pay`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(paid.ok()).toBe(true);
  await expect(page.getByRole("heading", { name: "Đặt hàng thành công" })).toBeVisible();
  const cancel = page.getByRole("button", { name: "Hủy đơn", exact: true });
  await cancel.click();
  await expect(page.getByText("Hủy đơn này?")).toBeVisible();
  await cancel.click();
  await expect(page.getByRole("heading", { name: "Đơn đã hủy" })).toBeVisible();
});
