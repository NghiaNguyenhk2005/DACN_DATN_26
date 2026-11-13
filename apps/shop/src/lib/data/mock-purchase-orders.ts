export interface PurchaseOrder {
  id: string;
  code: string;
  productId: string;
  productName: string;
  batchCode?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalAmount: number;
  expectedDeliveryDate: string;
  warehouseName: string;
  status: "pending_confirmation" | "confirmed" | "delivering" | "received" | "completed";
  createdAt: string;
  note?: string;
}

export const INITIAL_PURCHASE_ORDERS: PurchaseOrder[] = [
  {
    id: "po-101",
    code: "PO-2610-001",
    productId: "1",
    productName: "Dâu tây Hana Đà Lạt (Hộp 500g)",
    batchCode: "DTDL-2610-01",
    quantity: 150,
    unit: "kg",
    unitPrice: 75000,
    totalAmount: 150 * 75000,
    expectedDeliveryDate: "2026-10-22",
    warehouseName: "Kho trung tâm Farmery (TP. Hồ Chí Minh)",
    status: "received",
    createdAt: "2026-10-18T08:30:00Z",
    note: "Hàng đạt tiêu chuẩn Brix >= 10. Đã nghiệm thu nhập kho bán lẻ.",
  },
  {
    id: "po-102",
    code: "PO-2610-002",
    productId: "2",
    productName: "Dâu tây New Zealand Đà Lạt (Hộp 500g)",
    batchCode: "DTNZ-2610-02",
    quantity: 200,
    unit: "hộp 500g",
    unitPrice: 85000,
    totalAmount: 200 * 85000,
    expectedDeliveryDate: "2026-10-25",
    warehouseName: "Kho trung tâm Farmery (TP. Hồ Chí Minh)",
    status: "confirmed",
    createdAt: "2026-10-20T10:15:00Z",
    note: "Đã xác nhận giữ chỗ sản lượng. Vận chuyển xe lạnh chuyên dụng.",
  },
  {
    id: "po-103",
    code: "PO-2611-003",
    productId: "1",
    productName: "Dâu tây Hana Đà Lạt (Hộp 500g)",
    quantity: 300,
    unit: "kg",
    unitPrice: 72000,
    totalAmount: 300 * 72000,
    expectedDeliveryDate: "2026-11-08",
    warehouseName: "Kho trung chuyển Đà Lạt - Farmery",
    status: "pending_confirmation",
    createdAt: "2026-11-03T14:00:00Z",
    note: "Đơn đặt hàng thu mua sản lượng tuần 45. Vui lòng xác nhận giữ chỗ.",
  },
];

