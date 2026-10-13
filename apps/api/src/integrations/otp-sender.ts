import { Injectable, Logger } from "@nestjs/common";

// Gửi OTP qua email (SMS chỉ thiết kế). MVP thay bản giả bằng bản gửi SMTP thật.
export abstract class OtpSender {
  abstract send(email: string, code: string): Promise<void>;
}

@Injectable()
export class DemoOtpSender extends OtpSender {
  private readonly logger = new Logger(DemoOtpSender.name);

  async send(email: string, code: string): Promise<void> {
    this.logger.log(`OTP ${code} cho ${email} (DEMO_MODE, không gửi thật)`);
  }
}
