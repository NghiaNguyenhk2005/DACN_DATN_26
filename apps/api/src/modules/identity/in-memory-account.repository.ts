import { Inject, Injectable } from "@nestjs/common";
import { APP_CONFIG, type AppConfig } from "../../core/app-config";
import { DemoResetRegistry, type Resettable } from "../../core/demo-reset.registry";
import { AccountRepository, type Account } from "./account.repository";
import { loadtestBuyerAccounts } from "./loadtest-accounts";
import { SEED_ACCOUNTS } from "./seed-accounts";

@Injectable()
export class InMemoryAccountRepository extends AccountRepository implements Resettable {
  private readonly initial: Account[];
  private accounts: Account[];

  constructor(registry: DemoResetRegistry, @Inject(APP_CONFIG) config: AppConfig) {
    super();
    this.initial = [...SEED_ACCOUNTS, ...loadtestBuyerAccounts(config.loadtestBuyers)];
    this.accounts = structuredClone(this.initial);
    registry.register(this);
  }

  reset(): void {
    this.accounts = structuredClone(this.initial);
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
