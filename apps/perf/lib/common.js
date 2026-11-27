// Hàm dùng chung cho kịch bản k6: đăng nhập OTP, gọi API có token, sinh Idempotency-Key, chọn khung giao hàng.
import http from "k6/http";
import { check, fail } from "k6";

export const BASE = (__ENV.BASE_URL || "http://localhost:4000") + "/api";
const OTP_CODE = __ENV.OTP_CODE || "123456";

export const BUYERS = [
  "khachle@example.com",
  "khachtuchoi@example.com",
  "khachsi@example.com",
  "seller@farmery.vn",
];
export const STAFF = "kiemduyet@farmery.vn";

// Email người mua giả do API nạp khi chạy với LOADTEST_BUYERS=n (khớp loadtest-accounts.ts của API).
export function loadtestBuyers(n) {
  return Array.from({ length: n }, (_, i) => `loadtest-buyer-${String(i + 1).padStart(3, "0")}@loadtest.example`);
}

const JSON_HEADERS = { "Content-Type": "application/json" };

export function login(email) {
  const otp = http.post(`${BASE}/auth/otp`, JSON.stringify({ email }), { headers: JSON_HEADERS, tags: { name: "auth_otp" } });
  if (otp.status !== 200) fail(`otp ${email}: ${otp.status} ${otp.body}`);
  const res = http.post(
    `${BASE}/auth/login`,
    JSON.stringify({ challengeId: otp.json("challengeId"), code: OTP_CODE }),
    { headers: JSON_HEADERS, tags: { name: "auth_login" } },
  );
  if (res.status !== 200) fail(`login ${email}: ${res.status} ${res.body}`);
  return res.json("accessToken");
}

export function authHeaders(token, extra) {
  return Object.assign({ "Content-Type": "application/json", Authorization: `Bearer ${token}` }, extra || {});
}

export function uuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export function firstSlot(quote) {
  const s = quote.deliverySlots.find((x) => x.available);
  return s ? { deliveryDate: s.date, deliverySlot: s.slot } : null;
}

// Trả addressId dùng được cho người mua: lấy địa chỉ sẵn có, chưa có thì tạo mới.
export function ensureAddress(token, name) {
  const list = http.get(`${BASE}/me/addresses`, { headers: authHeaders(token), tags: { name: "address_list" } });
  const items = list.status === 200 ? list.json() : [];
  if (items.length > 0) return items[0].id;
  const created = http.post(
    `${BASE}/me/addresses`,
    JSON.stringify({
      label: "k6",
      recipientName: name,
      phone: "0900000000",
      addressLine: "1 Đường Thử Tải",
      ward: "Phường Bến Nghé",
      province: "TP. Hồ Chí Minh",
      isDefault: true,
    }),
    { headers: authHeaders(token), tags: { name: "address_create" } },
  );
  check(created, { "tạo địa chỉ 201": (r) => r.status === 201 });
  return created.json("id");
}
