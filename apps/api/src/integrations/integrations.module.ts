import { Global, Module } from "@nestjs/common";
import { APP_CONFIG, type AppConfig } from "../core/app-config";
import { DemoOtpSender, OtpSender, SmtpOtpSender } from "./otp-sender";
import { DemoPaymentGateway, PaymentGateway } from "./payment-gateway";

// Dịch vụ bên ngoài sau interface; đổi bản thật ở đây theo cấu hình, mô-đun nghiệp vụ không đổi.
// OTP: có SMTP_URL thì gửi email thật, không thì bản giả (loadConfig chỉ cho phép khi DEMO_MODE).
@Global()
@Module({
  providers: [
    { provide: OtpSender, inject: [APP_CONFIG], useFactory: (config: AppConfig) => (config.smtp ? new SmtpOtpSender(config.smtp) : new DemoOtpSender()) },
    { provide: PaymentGateway, useClass: DemoPaymentGateway },
  ],
  exports: [OtpSender, PaymentGateway],
})
export class IntegrationsModule {}
