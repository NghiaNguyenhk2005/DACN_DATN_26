import { Inject, Injectable } from "@nestjs/common";
import { APP_CONFIG, type AppConfig } from "../../core/app-config";
import { PRISMA_CLIENT, type PrismaClient } from "../../core/prisma";
import { AccountRepository, type Account, type RoleCode } from "./account.repository";
import { SEED_ACCOUNTS } from "./seed-accounts";

const activeRoles = { where: { revokedAt: null } };

@Injectable()
export class PrismaAccountRepository extends AccountRepository {
  constructor(
    @Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {
    super();
  }

  async findByEmail(email: string): Promise<Account | null> {
    const row = await this.prisma.user.findFirst({
      where: { email, status: "active" },
      include: { userRoles: activeRoles },
    });
    if (row) return this.toAccount(row);
    if (!this.config.demoMode) return null;
    const demoAccount = SEED_ACCOUNTS.find((candidate) => candidate.emails.slice(1).includes(email));
    return demoAccount ? this.findById(demoAccount.id) : null;
  }

  async findById(id: string): Promise<Account | null> {
    if (!/^[0-9]{1,18}$/.test(id)) return null;
    const row = await this.prisma.user.findFirst({
      where: { id: BigInt(id), status: "active" },
      include: { userRoles: activeRoles },
    });
    return row ? this.toAccount(row) : null;
  }

  async register(email: string, displayName: string, verifiedAt: Date): Promise<Account | null> {
    return this.prisma.$transaction(async (tx) => {
      const inserted = await tx.user.createMany({
        data: { email, fullName: displayName, emailVerifiedAt: verifiedAt, status: "active" },
        skipDuplicates: true,
      });
      if (!inserted.count) return null;
      const row = await tx.user.findUniqueOrThrow({ where: { email } });
      const role = await tx.userRole.create({ data: { userId: row.id, role: "buyer_retail" } });
      return this.toAccount({ ...row, userRoles: [role] });
    });
  }

  async enableTotp(id: string, encryptedSecret: string, step: bigint): Promise<boolean> {
    const updated = await this.prisma.user.updateMany({
      where: { id: BigInt(id), status: "active", totpSecretEnc: null },
      data: { totpSecretEnc: encryptedSecret, totpLastStep: step },
    });
    return updated.count === 1;
  }

  async consumeTotp(id: string, step: bigint): Promise<boolean> {
    const updated = await this.prisma.user.updateMany({
      where: {
        id: BigInt(id), status: "active", totpSecretEnc: { not: null },
        OR: [{ totpLastStep: null }, { totpLastStep: { lt: step } }],
      },
      data: { totpLastStep: step },
    });
    return updated.count === 1;
  }

  private async toAccount(row: {
    id: bigint;
    fullName: string;
    email: string | null;
    phone: string | null;
    totpSecretEnc: string | null;
    userRoles: { role: RoleCode }[];
  }): Promise<Account> {
    const id = row.id.toString();
    const roles = row.userRoles.map(({ role }) => role);
    const demoAccount = this.config.demoMode ? SEED_ACCOUNTS.find((account) => account.id === id) : undefined;
    const supplier = roles.includes("seller")
      ? await this.prisma.supplier.findUnique({ where: { userId: row.id }, select: { id: true } })
      : null;
    return {
      id,
      emails: row.email ? [row.email] : [],
      displayName: row.fullName,
      phone: row.phone,
      roles,
      supplierId: supplier?.id.toString() ?? demoAccount?.supplierId ?? null,
      refusedCod: demoAccount?.refusedCod ?? false,
      totpSecretEnc: row.totpSecretEnc,
    };
  }
}
