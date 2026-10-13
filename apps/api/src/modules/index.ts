import { CatalogModule } from "./catalog/catalog.module";
import { EngagementModule } from "./engagement/engagement.module";
import { FulfillmentModule } from "./fulfillment/fulfillment.module";
import { IdentityModule } from "./identity/identity.module";
import { InventoryModule } from "./inventory/inventory.module";
import { MediaModule } from "./media/media.module";
import { NotificationModule } from "./notification/notification.module";
import { OperationsModule } from "./operations/operations.module";
import { PaymentModule } from "./payment/payment.module";
import { ProcurementModule } from "./procurement/procurement.module";
import { RetailModule } from "./retail/retail.module";
import { SupplierModule } from "./supplier/supplier.module";
import { WholesaleModule } from "./wholesale/wholesale.module";

// 13 mô-đun nghiệp vụ theo bảng tab:module-io của báo cáo (mục 5.3); mỗi mô-đun một schema CSDL.
export const BUSINESS_MODULES = [
  IdentityModule,
  SupplierModule,
  CatalogModule,
  ProcurementModule,
  InventoryModule,
  RetailModule,
  WholesaleModule,
  PaymentModule,
  FulfillmentModule,
  EngagementModule,
  NotificationModule,
  OperationsModule,
  MediaModule,
];
