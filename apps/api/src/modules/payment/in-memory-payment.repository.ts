import { Injectable } from "@nestjs/common";
import { DemoResetRegistry, type Resettable } from "../../core/demo-reset.registry";
import { PaymentRepository, type PaymentRecord } from "./payment.repository";

@Injectable()
export class InMemoryPaymentRepository extends PaymentRepository implements Resettable {
  private records = new Map<string, PaymentRecord>();

  constructor(registry: DemoResetRegistry) {
    super();
    registry.register(this);
  }

  reset(): void {
    this.records.clear();
  }

  async findByOrderId(orderId: string): Promise<PaymentRecord | null> {
    const found = this.records.get(orderId);
    return found ? structuredClone(found) : null;
  }

  async save(record: PaymentRecord): Promise<void> {
    this.records.set(record.orderId, structuredClone(record));
  }
}
