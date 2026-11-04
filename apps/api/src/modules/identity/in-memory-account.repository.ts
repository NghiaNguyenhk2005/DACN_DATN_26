import { Injectable } from "@nestjs/common";
import { DemoResetRegistry, type Resettable } from "../../core/demo-reset.registry";
import { AccountRepository, type Account } from "./account.repository";
import { SEED_ACCOUNTS } from "./seed-accounts";

@Injectable()
export class InMemoryAccountRepository extends AccountRepository implements Resettable {
  private accounts: Account[] = structuredClone(SEED_ACCOUNTS);

  constructor(registry: DemoResetRegistry) {
    super();
    registry.register(this);
  }

  reset(): void {
    this.accounts = structuredClone(SEED_ACCOUNTS);
  }

  async findByEmail(email: string): Promise<Account | null> {
    const key = email.trim().toLowerCase();
    const found = this.accounts.find((a) => a.emails.some((e) => e.toLowerCase() === key));
    return found ? structuredClone(found) : null;
  }

  async findById(id: string): Promise<Account | null> {
    const found = this.accounts.find((a) => a.id === id);
    return found ? structuredClone(found) : null;
  }
}
