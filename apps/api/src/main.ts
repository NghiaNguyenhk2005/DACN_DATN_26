import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { loadContractDocument } from "./contract-document";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: (process.env.CORS_ORIGINS ?? "http://localhost:3000,http://localhost:5173").split(","),
  });
  SwaggerModule.setup("docs", app, loadContractDocument());
  await app.listen(Number(process.env.PORT ?? 4000));
}

void bootstrap();
