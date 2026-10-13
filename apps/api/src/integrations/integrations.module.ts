import { Global, Module } from "@nestjs/common";
import { DemoOtpSender, OtpSender } from "./otp-sender";
import { DemoPaymentGateway, PaymentGateway } from "./payment-gateway";

// Dịch vụ bên ngoài sau interface; đổi bản thật ở đây theo cấu hình, mô-đun nghiệp vụ không đổi.
@Global()
@Module({
  providers: [
    { provide: OtpSender, useClass: DemoOtpSender },
    { provide: PaymentGateway, useClass: DemoPaymentGateway },
  ],
  exports: [OtpSender, PaymentGateway],
})
export class IntegrationsModule {}
