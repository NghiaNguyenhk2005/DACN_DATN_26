import type { Abstract, Provider, Type } from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";
import { APP_CONFIG, type AppConfig } from "./app-config";

// Nối repository theo STORAGE: mỗi module đổi một dòng `useClass` thành storageProvider(Token, InMemoryX, PrismaX).
export function storageProvider<T>(token: Abstract<T>, memory: Type<T>, prisma: Type<T>): Provider {
  return {
    provide: token,
    inject: [APP_CONFIG, ModuleRef],
    useFactory: (config: AppConfig, ref: ModuleRef): Promise<T> => ref.create(config.storage === "prisma" ? prisma : memory),
  };
}
