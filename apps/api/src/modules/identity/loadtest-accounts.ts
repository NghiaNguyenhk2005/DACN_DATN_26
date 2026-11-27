import type { Account } from "./account.repository";

// Người mua giả cho k6 (apps/perf): id 4001.., email loadtest-buyer-001@loadtest.example. Chỉ nạp khi LOADTEST_BUYERS > 0.
export function loadtestBuyerEmail(index: number): string {
  return `loadtest-buyer-${String(index).padStart(3, "0")}@loadtest.example`;
}

export function loadtestBuyerAccounts(count: number): Account[] {
  return Array.from({ length: count }, (_, i) => ({
    id: String(4001 + i),
    emails: [loadtestBuyerEmail(i + 1)],
    displayName: `Người mua thử tải ${i + 1}`,
    phone: null,
    roles: ["buyer_retail" as const],
    supplierId: null,
    refusedCod: false,
  }));
}
