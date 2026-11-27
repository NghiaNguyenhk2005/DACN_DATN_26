// NFR1.2 / NFR4.1: nhiều người mua cùng đặt đơn trên một dòng tồn có hạn, kiểm không bán vượt.
// Mỗi vòng: reset dữ liệu -> mọi người mua bỏ cùng một mặt hàng vào giỏ -> bắn đồng thời POST /orders -> đối chiếu tồn.
// Mặc định 4 người mua có sẵn; chạy API với LOADTEST_BUYERS=50 và k6 với -e BUYERS=50 để 50 yêu cầu tranh nhau mỗi vòng.
// Cần DEMO_MODE=true (POST /dev/reset). Chạy: k6 run apps/perf/scenarios/oversell.js
import http from "k6/http";
import { check } from "k6";
import { Counter, Rate } from "k6/metrics";
import { BASE, BUYERS as SEED_BUYERS, STAFF, loadtestBuyers, login, authHeaders, uuid, ensureAddress, firstSlot } from "../lib/common.js";

const LISTING = __ENV.LISTING || "204";
const PRODUCT = __ENV.PRODUCT || "4";
const STOCK = Number(__ENV.STOCK || 8);
const ROUNDS = Number(__ENV.ROUNDS || 50);
const BUYER_COUNT = Number(__ENV.BUYERS || 0);
const BUYERS = BUYER_COUNT > 0 ? loadtestBuyers(BUYER_COUNT) : SEED_BUYERS;

const oversell = new Counter("oversell_violations");
const accepted = new Counter("orders_accepted");
const rejected = new Counter("orders_rejected_stock_conflict");
const unexpected = new Counter("orders_unexpected_status");
const reservedMatches = new Rate("reserved_matches_accepted");

http.setResponseCallback(http.expectedStatuses({ min: 200, max: 299 }, 409));

export const options = {
  batch: Math.max(BUYERS.length, 20),
  batchPerHost: Math.max(BUYERS.length, 6),
  scenarios: {
    race: { executor: "shared-iterations", vus: 1, iterations: ROUNDS, maxDuration: "10m" },
  },
  thresholds: {
    oversell_violations: ["count==0"],
    orders_unexpected_status: ["count==0"],
    reserved_matches_accepted: ["rate==1"],
  },
  summaryTrendStats: ["avg", "med", "p(95)", "max"],
};

export function setup() {
  return { staff: login(STAFF), tokens: BUYERS.map((e) => login(e)) };
}

function holdings(staffToken) {
  const r = http.get(`${BASE}/admin/inventory/holdings?productId=${PRODUCT}`, { headers: authHeaders(staffToken), tags: { name: "holdings" } });
  const list = r.status === 200 ? r.json() : [];
  return list.reduce((a, h) => ({ onHand: a.onHand + h.qtyOnHand, reserved: a.reserved + h.qtyReserved }), { onHand: 0, reserved: 0 });
}

export default function (data) {
  http.post(`${BASE}/dev/reset`, null, { tags: { name: "dev_reset" } });

  // Mỗi người mua đặt 1-4 đơn vị; tổng nhu cầu thường vượt STOCK.
  const wants = data.tokens.map(() => 1 + Math.floor(Math.random() * 4));
  const prepared = data.tokens.map((token, i) => {
    const addressId = ensureAddress(token, BUYERS[i]);
    http.put(`${BASE}/cart/items/${LISTING}`, JSON.stringify({ quantity: wants[i] }), { headers: authHeaders(token), tags: { name: "cart_put" } });
    const quote = http.post(`${BASE}/checkout/quote`, JSON.stringify({ addressId }), { headers: authHeaders(token), tags: { name: "checkout_quote" } });
    return { token, addressId, slot: firstSlot(quote.json()) };
  });

  const before = holdings(data.staff);
  const responses = http.batch(
    prepared.map((p) => ({
      method: "POST",
      url: `${BASE}/orders`,
      body: JSON.stringify({ addressId: p.addressId, paymentOption: "prepaid", ...p.slot }),
      params: { headers: authHeaders(p.token, { "Idempotency-Key": uuid() }), tags: { name: "orders_create" } },
    })),
  );

  let acceptedQty = 0;
  responses.forEach((res, i) => {
    if (res.status === 201) {
      accepted.add(1);
      acceptedQty += wants[i];
    } else if (res.status === 409) {
      rejected.add(1);
    } else {
      unexpected.add(1);
    }
  });

  const after = holdings(data.staff);
  const reservedDelta = after.reserved - before.reserved;
  const over = acceptedQty > STOCK || after.reserved > after.onHand;
  if (over) oversell.add(1);
  reservedMatches.add(reservedDelta === acceptedQty);
  check(null, { "không bán vượt": () => !over });
}
