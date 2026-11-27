// NFR1.1: tải tăng dần chuỗi duyệt web (tìm kiếm -> chi tiết -> truy xuất) lên 100 VU, kèm luồng đặt đơn nhẹ của 4 người mua.
// Ngưỡng: p95 < 2 s ở tải thường, trung vị < 3 s ở 100 VU, lỗi < 1%. Chạy: k6 run apps/perf/scenarios/browse.js
import http from "k6/http";
import { check, sleep } from "k6";
import { BASE, BUYERS, login, authHeaders, uuid, ensureAddress, firstSlot } from "../lib/common.js";

const QUERIES = ["dâu", "cà chua", "rau", "nấm", "chè", "cà phê", "khoai tây", "bơ"];
const TRACE_CODES = ["TRC-DTDL-2610-01", "TRC-DTMD-2610-18", "TRC-CCCR-2610-03"];
const ORDER_LISTING = __ENV.ORDER_LISTING || "217"; // dòng tồn lớn để luồng đặt đơn không cạn hàng giữa lượt đo

export const options = {
  scenarios: {
    browse: {
      executor: "ramping-vus",
      exec: "browse",
      startVUs: 0,
      stages: [
        { duration: "20s", target: 10 },
        { duration: "30s", target: 10 },
        { duration: "20s", target: 50 },
        { duration: "30s", target: 50 },
        { duration: "20s", target: 100 },
        { duration: "60s", target: 100 },
        { duration: "10s", target: 0 },
      ],
      gracefulRampDown: "10s",
    },
    // Mỗi người mua một kịch bản 1 VU riêng để không hai VU dùng chung một giỏ.
    ...Object.fromEntries(
      BUYERS.map((_, i) => [
        `checkout_${i}`,
        { executor: "constant-vus", exec: "checkout", vus: 1, duration: "3m", env: { BUYER_IDX: String(i) } },
      ]),
    ),
  },
  thresholds: {
    "http_req_duration{scenario:browse}": ["p(95)<2000", "med<3000"],
    "http_req_failed{scenario:browse}": ["rate<0.01"],
    "http_req_failed{name:orders_create}": ["rate<0.01"],
    "http_req_failed{name:checkout_quote}": ["rate<0.01"],
    "http_req_duration{name:orders_create}": ["p(95)<2000"],
  },
  summaryTrendStats: ["avg", "med", "p(90)", "p(95)", "max"],
};

export function setup() {
  http.post(`${BASE}/dev/reset`, null, { tags: { name: "dev_reset" } }); // giỏ và tồn về dữ liệu gốc (cần DEMO_MODE)
  return BUYERS.map((email) => {
    const token = login(email);
    return { token, addressId: ensureAddress(token, email) };
  });
}

export function browse() {
  const q = QUERIES[Math.floor(Math.random() * QUERIES.length)];
  const search = http.get(`${BASE}/products?q=${encodeURIComponent(q)}&limit=20`, { tags: { name: "products_search" } });
  check(search, { "tìm kiếm 200": (r) => r.status === 200 });
  sleep(1);

  const all = http.get(`${BASE}/products?limit=20`, { tags: { name: "products_list" } });
  const items = all.status === 200 ? all.json("items") : [];
  if (items.length > 0) {
    const p = items[Math.floor(Math.random() * items.length)];
    const detail = http.get(`${BASE}/products/${p.id}`, { tags: { name: "products_detail" } });
    check(detail, { "chi tiết 200": (r) => r.status === 200 });
  }
  sleep(1);

  const trace = http.get(`${BASE}/public/trace/${TRACE_CODES[Math.floor(Math.random() * TRACE_CODES.length)]}`, { tags: { name: "trace" } });
  check(trace, { "truy xuất 200": (r) => r.status === 200 });
  sleep(1);
}

export function checkout(buyers) {
  const b = buyers[Number(__ENV.BUYER_IDX)];
  const h = authHeaders(b.token);
  const put = http.put(`${BASE}/cart/items/${ORDER_LISTING}`, JSON.stringify({ quantity: 1 }), { headers: h, tags: { name: "cart_put" } });
  check(put, { "thêm giỏ 200": (r) => r.status === 200 });

  const quote = http.post(`${BASE}/checkout/quote`, JSON.stringify({ addressId: b.addressId }), { headers: h, tags: { name: "checkout_quote" } });
  const slot = quote.status === 200 ? firstSlot(quote.json()) : null;
  if (slot) {
    const order = http.post(
      `${BASE}/orders`,
      JSON.stringify({ addressId: b.addressId, paymentOption: "prepaid", ...slot }),
      { headers: authHeaders(b.token, { "Idempotency-Key": uuid() }), tags: { name: "orders_create" } },
    );
    check(order, { "tạo đơn 201": (r) => r.status === 201 });
    if (__ENV.DEBUG && order.status !== 201) console.error(`order ${order.status} ${slot.deliveryDate} ${slot.deliverySlot} ${String(order.body).slice(0, 200)}`);
  }
  sleep(2);
}
