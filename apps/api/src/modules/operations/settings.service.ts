import { HttpStatus, Injectable } from "@nestjs/common";
import { ProblemException } from "../../core/problem";
import {
  PlatformSettingsRepository,
  type PlatformSettingsUpdate,
  type ResolvedSettings,
} from "./platform-settings.repository";

function bad(detail: string): ProblemException {
  return new ProblemException(HttpStatus.BAD_REQUEST, "VALIDATION_FAILED", detail);
}

// Cấu hình nền tảng (FR10.6): COD, giờ chốt, khung giờ giao, cước, hạn giữ chỗ, thuế. Mô-đun khác đọc qua get().
@Injectable()
export class SettingsService {
  constructor(private readonly repo: PlatformSettingsRepository) {}

  get(): Promise<ResolvedSettings> {
    return this.repo.get();
  }

  // Hợp đồng đã kiểm kiểu, khóa lạ và định dạng; ở đây kiểm thêm minProperties (bộ kiểm không thực thi) và các ràng buộc giữa các giá trị.
  async update(changes: PlatformSettingsUpdate): Promise<ResolvedSettings> {
    if (Object.keys(changes).length === 0) throw bad("Cần gửi ít nhất một khóa cấu hình");
    if (changes.deliverySlots) {
      const slots = changes.deliverySlots;
      if (new Set(slots).size !== slots.length) throw bad("Khung giờ giao bị trùng nhau");
      for (const slot of slots) {
        const [from, to] = slot.split("-");
        if (!from || !to || from >= to) throw bad(`Khung giờ ${slot} phải có giờ bắt đầu trước giờ kết thúc`);
      }
    }
    return this.repo.merge(changes);
  }
}
