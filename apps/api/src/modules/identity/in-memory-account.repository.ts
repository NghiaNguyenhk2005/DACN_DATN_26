import { Injectable } from "@nestjs/common";
import { DemoResetRegistry, type Resettable } from "../../core/demo-reset.registry";
import { AccountRepository, type Account } from "./account.repository";
import { SEED_ACCOUNTS } from "./seed-accounts";

@Injectable()
export class InMemoryAccountRepository extends AccountRepository implements Resettable {
  private accounts: Account[] = structuredClone(SEED_ACCOUNTS);
  private nextId = 1000;
  private totpSteps = new Map<string, bigint>();

  constructor(registry: DemoResetRegistry) {
    super();
    registry.register(this);
  }

  reset(): void {
    this.accounts = structuredClone(SEED_ACCOUNTS);
    this.nextId = 1000;
    this.totpSteps.clear();
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

  async register(email: string, displayName: string): Promise<Account | null> {
    if (this.accounts.some((account) => account.emails.includes(email))) return null;
    const account: Account = {
      id: String(this.nextId++), emails: [email], displayName, phone: null,
      roles: ["buyer_retail"], supplierId: null, refusedCod: false,
    };
    this.accounts.push(account);
    return structuredClone(account);
  }

  async enableTotp(id: string, encryptedSecret: string, step: bigint): Promise<boolean> {
    const account = this.accounts.find((candidate) => candidate.id === id);
    if (!account || account.totpSecretEnc) return false;
    account.totpSecretEnc = encryptedSecret;
    this.totpSteps.set(id, step);
    return true;
  }

  async consumeTotp(id: string, step: bigint): Promise<boolean> {
    const last = this.totpSteps.get(id);
    if (last === undefined || step <= last) return false;
    this.totpSteps.set(id, step);
    return true;
  }
}
