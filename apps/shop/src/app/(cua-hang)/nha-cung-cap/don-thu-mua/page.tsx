import type { Metadata } from "next";
import { getSellerBatches, getSellerProducts } from "@/lib/data/seller";
import { INITIAL_PURCHASE_ORDERS, type PurchaseOrder } from "@/lib/data/mock-purchase-orders";
import { PurchaseOrdersClient } from "./purchase-orders-client";

export const metadata: Metadata = {
  title: "Đơn thu mua từ Farmery",
  description: "Quản lý đơn thu mua nông sản theo lô của Farmery (1P), xác nhận đơn và theo dõi nghiệm thu.",
};

export default async function SellerPurchaseOrdersPage() {
  const [batches, products] = await Promise.all([
    getSellerBatches().catch(() => []),
    getSellerProducts().catch(() => []),
  ]);

  // Nối các đơn thu mua liên kết với sản phẩm/lô thực tế của nhà cung cấp
  const p1 = products[0];
  const p2 = products[1];
  const b1 = batches[0];
  const b2 = batches[1];

  const purchaseOrders: PurchaseOrder[] = INITIAL_PURCHASE_ORDERS.map((po, index) => {
    if (index === 0 && p1) {
      return {
        ...po,
        productId: p1.id,
        productName: p1.name,
        unit: p1.unit || "kg",
        batchCode: b1?.batchCode ?? po.batchCode,
      };
    }
    if (index === 1 && p2) {
      return {
        ...po,
        productId: p2.id,
        productName: p2.name,
        unit: p2.unit || "hộp 500g",
        batchCode: b2?.batchCode ?? po.batchCode,
      };
    }
    if (index === 2 && p1) {
      return {
        ...po,
        productId: p1.id,
        productName: p1.name,
        unit: p1.unit || "kg",
      };
    }
    return po;
  });

  return <PurchaseOrdersClient initialOrders={purchaseOrders} />;
}
