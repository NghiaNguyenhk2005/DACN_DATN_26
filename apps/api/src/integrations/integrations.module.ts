import { Global, Module } from "@nestjs/common";
import { APP_CONFIG, type AppConfig } from "../core/app-config";
import { DemoOtpSender, OtpSender, SmtpOtpSender } from "./otp-sender";
import { EmbeddingProvider, HttpEmbeddingProvider } from "./embedding-provider";
import { DemoPaymentGateway, PaymentGateway } from "./payment-gateway";

// Dịch vụ bên ngoài sau interface; đổi bản thật ở đây theo cấu hình, mô-đun nghiệp vụ không đổi.
// OTP: có SMTP_URL thì gửi email thật, không thì bản giả (loadConfig chỉ cho phép khi DEMO_MODE).
// Nhúng vector: có AI_SERVICE_URL thì gọi dịch vụ AI, không thì null (AI thuộc nhóm Should nên không chặn khởi động);
// nơi dùng khai @Optional() và lùi về từ điển khái niệm. Test thay bằng HashingEmbeddingProvider.
@Global()
@Module({
  providers: [
    { provide: OtpSender, inject: [APP_CONFIG], useFactory: (config: AppConfig) => (config.smtp ? new SmtpOtpSender(config.smtp) : new DemoOtpSender()) },
    { provide: PaymentGateway, useClass: DemoPaymentGateway },
    {
      provide: EmbeddingProvider,
      inject: [APP_CONFIG],
      useFactory: (config: AppConfig) => (config.ai ? new HttpEmbeddingProvider(config.ai.url, config.ai.token) : null),
    },
  ],
  exports: [OtpSender, PaymentGateway, EmbeddingProvider],
})
export class IntegrationsModule {}
