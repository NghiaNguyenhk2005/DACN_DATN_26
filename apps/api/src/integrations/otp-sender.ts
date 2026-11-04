import { Injectable, Logger } from "@nestjs/common";
import { createTransport, type Transporter } from "nodemailer";
import type { SmtpConfig } from "../core/app-config";
import { ProblemException } from "../core/problem";

// Gửi OTP qua email (SMS chỉ thiết kế).
export abstract class OtpSender {
  abstract send(email: string, code: string): Promise<void>;
}

/** Placeholder cho DEMO_MODE: không gửi thật, chỉ ghi log. Không bao giờ được dùng khi chạy thật. */
@Injectable()
export class DemoOtpSender extends OtpSender {
  private readonly logger = new Logger(DemoOtpSender.name);

  async send(email: string, code: string): Promise<void> {
    this.logger.log(`OTP ${code} cho ${email} (DEMO_MODE, không gửi thật)`);
  }
}

/** Gửi OTP thật qua SMTP (SMTP_URL). Lỗi gửi trả 503, không lộ chi tiết máy chủ thư. */
export class SmtpOtpSender extends OtpSender {
  private readonly logger = new Logger(SmtpOtpSender.name);
  private readonly transport: Transporter;

  constructor(private readonly config: SmtpConfig) {
    super();
    // Đặt thời hạn kết nối qua tham số URL (nodemailer đọc các tham số này) để SMTP treo không giữ yêu cầu mãi.
    const url = new URL(config.url);
    for (const [name, value] of [["connectionTimeout", "5000"], ["greetingTimeout", "5000"], ["socketTimeout", "10000"]] as const) {
      if (!url.searchParams.has(name)) url.searchParams.set(name, value);
    }
    this.transport = createTransport(url.toString());
  }

  async send(email: string, code: string): Promise<void> {
    try {
      await this.transport.sendMail({
        from: this.config.from,
        to: email,
        subject: "Mã đăng nhập Farmery",
        text: `Mã đăng nhập Farmery của bạn là ${code}. Mã có hiệu lực 10 phút. Nếu không phải bạn yêu cầu, hãy bỏ qua email này.`,
      });
    } catch (error) {
      this.logger.error("Gửi OTP qua SMTP thất bại", error instanceof Error ? error.message : String(error));
      throw new ProblemException(503, "OTP_DELIVERY_FAILED", "Chưa gửi được mã OTP, hãy thử lại sau", { "Retry-After": "30" });
    }
  }
}
