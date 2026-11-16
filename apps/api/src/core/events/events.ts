// Danh mục 17 sự kiện nghiệp vụ giữa các mô-đun (Phụ lục V). Định danh là chuỗi, số tiền là đồng.
// Payload của sự kiện chưa có bên phát trong mã là dự kiến; bên phát đầu tiên được phép chỉnh.
export interface EventPayloads {
  UserVerified: { userId: string };
  CertExpired: { supplierId: string; certificationId: string; type: string };
  BatchApproved: {
    batchId: string;
    batchCode: string;
    productId: string;
    productName: string;
    quantity: number;
    harvestDate: string;
    bestBefore: string;
    /** Tin bán lẻ của sản phẩm; null thì chưa có hàng để bán nên bên nhận bỏ qua. */
    listing: { id: string; saleUnit: string } | null;
  };
  ProductChanged: { productId: string; change: "created" | "approved" | "rejected" };
  ProductEmbedded: { productId: string; modelVersion: string };
  StockLow: { holdingId: string; batchId: string; qtyAvailable: number };
  BatchRecalled: { batchId: string; batchCode: string; reason: string };
  ProcurementReceived: { purchaseOrderId: string; supplierId: string; result: "accepted" | "partial" | "rejected" };
  OrderPlaced: { orderId: string; orderCode: string; userId: string; paymentOption: "cod" | "prepaid"; totalAmount: number };
  OrderCancelled: { orderId: string; orderCode: string; userId: string; reason: string | null; refundDue: boolean };
  RfqUpdated: { rfqId: string; change: "quoted" | "accepted" | "rejected" };
  ContractConcluded: { contractId: string; rfqId: string };
  PaymentSucceeded: { orderId: string; amount: number; reference: string | null };
  Refunded: { orderId: string; amount: number };
  ShipmentStatusChanged: { shipmentId: string; orderId: string; status: string };
  CaseResolved: { caseId: string; orderId: string; decision: string };
  ReviewPosted: { reviewId: string; productId: string; flagged: boolean };
}

export type EventName = keyof EventPayloads;

/** Phong bì: `id` định danh một lần phát, bên nhận dùng nó để bỏ qua bản gửi lại. */
export interface DomainEvent<K extends EventName = EventName> {
  id: string;
  name: K;
  occurredAt: string;
  payload: EventPayloads[K];
}

// Tên đúng thứ tự Phụ lục V; test/events.e2e-spec.ts đối chiếu với phụ lục để mã và báo cáo không lệch.
export const EVENT_NAMES = [
  "UserVerified",
  "CertExpired",
  "BatchApproved",
  "ProductChanged",
  "ProductEmbedded",
  "StockLow",
  "BatchRecalled",
  "ProcurementReceived",
  "OrderPlaced",
  "OrderCancelled",
  "RfqUpdated",
  "ContractConcluded",
  "PaymentSucceeded",
  "Refunded",
  "ShipmentStatusChanged",
  "CaseResolved",
  "ReviewPosted",
] as const satisfies readonly EventName[];

/** Sự kiện đã có điểm phát trong mã; phần còn lại mới khai kiểu, chờ mô-đun phát được hiện thực. */
export const PUBLISHED_EVENTS: readonly EventName[] = [
  "BatchApproved",
  "ProductChanged",
  "OrderPlaced",
  "OrderCancelled",
  "PaymentSucceeded",
  "Refunded",
];
