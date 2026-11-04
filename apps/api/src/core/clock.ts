import { Injectable } from "@nestjs/common";

// Nguồn thời gian duy nhất của nghiệp vụ (giữ chỗ 15 phút, giờ chốt, hạn OTP). Test thay bằng đồng hồ chỉnh tay
// để kiểm luật theo thời gian mà không phải chờ.
export abstract class Clock {
  abstract now(): Date;
}

@Injectable()
export class SystemClock extends Clock {
  now(): Date {
    return new Date();
  }
}
