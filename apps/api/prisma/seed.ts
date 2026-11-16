import { PrismaPg } from "@prisma/adapter-pg";
import { categories } from "@farmery/mock-data";
import type { Schema } from "@farmery/contract";
import { PrismaClient } from "../src/generated/prisma/client";
import { SEED_ACCOUNTS } from "../src/modules/identity/seed-accounts";

// Nạp danh mục và tài khoản mẫu vào PostgreSQL; chạy lại nhiều lần không nhân đôi. Chạy qua: pnpm db:seed.
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL ?? "postgresql://farmery:farmery@localhost:5433/farmery" }),
});

async function seedCategories(nodes: Schema<"Category">[], parentId: bigint | null = null): Promise<void> {
  for (const node of nodes) {
    const id = BigInt(node.id);
    await prisma.category.upsert({
      where: { id },
      create: { id, parentId, name: node.name, isLeaf: node.isLeaf },
      update: { parentId, name: node.name, isLeaf: node.isLeaf },
    });
    await seedCategories(node.children, id);
  }
}

async function seedAccounts(): Promise<void> {
  const now = new Date();
  for (const a of SEED_ACCOUNTS) {
    const id = BigInt(a.id);
    const data = { fullName: a.displayName, email: a.emails[0] ?? null, phone: a.phone, status: "active" as const };
    await prisma.user.upsert({ where: { id }, create: { id, ...data, emailVerifiedAt: now }, update: data });
    for (const role of a.roles) {
      await prisma.userRole.upsert({
        where: { userId_role: { userId: id, role } },
        create: { userId: id, role },
        update: {},
      });
    }
  }
}

// Id nạp tường minh nên phải đẩy sequence lên trên id lớn nhất, nếu không INSERT sau đó đụng khóa chính.
async function syncSequence(table: string): Promise<void> {
  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('${table}', 'id'), COALESCE((SELECT MAX(id) FROM ${table}), 1))`,
  );
}

async function main(): Promise<void> {
  await seedCategories(categories);
  await seedAccounts();
  await syncSequence("catalog.categories");
  await syncSequence("identity.users");
  const [c, u] = await Promise.all([prisma.category.count(), prisma.user.count()]);
  console.log(`Seed xong: ${c} danh mục, ${u} tài khoản.`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
