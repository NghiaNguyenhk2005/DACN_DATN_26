import "reflect-metadata";
import { existsSync } from "node:fs";
import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { configureApp } from "./app.setup";
import { loadConfig } from "./core/app-config";

// Nạp .env (nếu có) trước khi đọc cấu hình. Biến đã đặt ở môi trường được ưu tiên hơn .env.
if (existsSync(".env")) process.loadEnvFile(".env");

async function bootstrap(): Promise<void> {
  const config = loadConfig(); // dừng ngay nếu cấu hình nguy hiểm (secret yếu, thiếu SMTP...)
  const logger = new Logger("bootstrap");
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  configureApp(app);
  app.enableShutdownHooks(); // SIGTERM/SIGINT: ngừng nhận yêu cầu mới, đợi yêu cầu đang chạy
  await app.listen(config.port);

  if (config.demoMode) logger.warn("DEMO_MODE bật: OTP trả kèm devCode và /dev/reset mở. Không dùng cho dữ liệu thật.");
  if (!config.docsEnabled) logger.log("Swagger UI tắt (DOCS_ENABLED=false).");
  logger.log(`API chạy ở cổng ${config.port} (${config.production ? "production" : "development"})`);
}

// Lỗi không bắt được: ghi log. Lỗi nghiêm trọng thì thoát để trình giám sát (Docker, systemd) khởi động lại.
process.on("unhandledRejection", (reason) => {
  new Logger("process").error("unhandledRejection", reason instanceof Error ? reason.stack : String(reason));
});
process.on("uncaughtException", (error) => {
  new Logger("process").error("uncaughtException", error.stack);
  process.exit(1);
});

bootstrap().catch((error: unknown) => {
  new Logger("bootstrap").error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
