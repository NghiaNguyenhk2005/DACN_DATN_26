import "reflect-metadata";
import { existsSync } from "node:fs";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { configureApp } from "./app.setup";
import { APP_CONFIG, type AppConfig } from "./core/app-config";

if (existsSync(".env")) process.loadEnvFile(".env");

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  configureApp(app);
  await app.listen(app.get<AppConfig>(APP_CONFIG).port);
}

void bootstrap();
