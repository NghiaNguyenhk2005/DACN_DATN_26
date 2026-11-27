import { Inject, Injectable, type OnApplicationShutdown, type Provider } from "@nestjs/common";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { APP_CONFIG, type AppConfig } from "./app-config";

export const PRISMA_CLIENT = Symbol("PRISMA_CLIENT");
export { PrismaClient };

// Client Prisma dùng chung; chỉ tạo khi có kho nào dùng Prisma (null ở chế độ bộ nhớ), kết nối mở ở truy vấn đầu tiên.
@Injectable()
class PrismaShutdown implements OnApplicationShutdown {
  constructor(@Inject(PRISMA_CLIENT) private readonly client: PrismaClient | null) {}

  async onApplicationShutdown(): Promise<void> {
    await this.client?.$disconnect();
  }
}

export const prismaProviders: Provider[] = [
  {
    provide: PRISMA_CLIENT,
    inject: [APP_CONFIG],
    useFactory: (config: AppConfig): PrismaClient | null =>
      (config.storage === "prisma" || config.inventoryStorage === "prisma") && config.databaseUrl
        ? new PrismaClient({ adapter: new PrismaPg({ connectionString: config.databaseUrl }) })
        : null,
  },
  PrismaShutdown,
];
