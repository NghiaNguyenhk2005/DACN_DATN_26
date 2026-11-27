import { createHash, randomUUID } from "node:crypto";
import { HttpStatus, Injectable } from "@nestjs/common";
import { ProblemException } from "../../core/problem";
import { MediaRepository, type MediaFileRecord, type MediaVariant } from "./media.repository";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export function detectRealMimeType(buf: Buffer): string | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    buf.length >= 8 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  ) {
    return "image/png";
  }
  if (
    buf.length >= 12 &&
    buf.toString("utf8", 0, 4) === "RIFF" &&
    buf.toString("utf8", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }
  if (buf.length >= 4 && buf.toString("utf8", 0, 4) === "%PDF") {
    return "application/pdf";
  }
  return null;
}

function generateWebPVariants(fileId: string, baseKey: string): Record<string, MediaVariant> {
  const prefix = baseKey.replace(/\.[^/.]+$/, "");
  return {
    thumbnail: {
      width: 150,
      height: 150,
      objectKey: `${prefix}-150.webp`,
      url: `http://localhost:4000/api/media/${fileId}?variant=thumbnail`,
      format: "webp",
    },
    medium: {
      width: 600,
      height: 600,
      objectKey: `${prefix}-600.webp`,
      url: `http://localhost:4000/api/media/${fileId}?variant=medium`,
      format: "webp",
    },
    large: {
      width: 1200,
      height: 1200,
      objectKey: `${prefix}-1200.webp`,
      url: `http://localhost:4000/api/media/${fileId}?variant=large`,
      format: "webp",
    },
  };
}

@Injectable()
export class MediaService {
  constructor(private readonly repo: MediaRepository) {}

  /**
   * Tạo đường dẫn ký trước (Presigned URL) tải tệp lên MinIO (S3-compatible).
   * Trình duyệt hoặc ứng dụng đẩy tệp trực tiếp lên MinIO, không qua trung chuyển máy chủ.
   */
  async requestPresignedUpload(
    ownerUserId: string,
    input: {
      fileName: string;
      mimeType: string;
      sizeBytes: number;
      accessLevel?: "public" | "private";
    },
  ): Promise<{ fileId: string; uploadUrl: string; objectKey: string; expiresInSeconds: number }> {
    if (input.sizeBytes > MAX_FILE_SIZE) {
      throw new ProblemException(HttpStatus.PAYLOAD_TOO_LARGE, "FILE_TOO_LARGE", "Kích thước tệp vượt quá giới hạn 5 MB.");
    }

    const allowedMimes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowedMimes.includes(input.mimeType)) {
      throw new ProblemException(
        HttpStatus.UNSUPPORTED_MEDIA_TYPE,
        "INVALID_FILE_TYPE",
        "Chỉ chấp nhận tệp ảnh JPEG, PNG, WebP hoặc tài liệu PDF.",
      );
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const sanitizedName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const objectKey = `media/${year}/${month}/${randomUUID()}-${sanitizedName}`;
    const accessLevel = input.accessLevel ?? "public";

    const media = await this.repo.create({
      ownerUserId,
      bucket: "farmery-media",
      objectKey,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      sha256: "",
      accessLevel,
      status: "pending_upload",
    });

    const expiresInSeconds = 900;
    const uploadUrl = `http://localhost:9000/farmery-media/${objectKey}?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=minioadmin&X-Amz-Expires=${expiresInSeconds}&X-Amz-Signature=mock-sig-${media.id}`;

    return {
      fileId: media.id,
      uploadUrl,
      objectKey,
      expiresInSeconds,
    };
  }

  /**
   * Xác nhận tệp đã tải xong lên MinIO: kiểm tra magic bytes thực tế và sinh các kích cỡ WebP.
   */
  async confirmUpload(fileId: string, buffer?: Buffer): Promise<MediaFileRecord> {
    const file = await this.repo.findById(fileId);
    if (!file) {
      throw new ProblemException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy bản ghi tệp đa phương tiện.");
    }

    let realMime = file.mimeType;
    let sha256 = file.sha256;
    let sizeBytes = file.sizeBytes;

    if (buffer && buffer.length > 0) {
      const detected = detectRealMimeType(buffer);
      if (!detected) {
        await this.repo.updateStatus(fileId, "rejected");
        throw new ProblemException(
          HttpStatus.UNSUPPORTED_MEDIA_TYPE,
          "INVALID_MAGIC_BYTES",
          "Nội dung tệp thực tế không phải ảnh hoặc tài liệu hợp lệ (phát hiện giả mạo phần mở rộng).",
        );
      }
      realMime = detected;
      sha256 = createHash("sha256").update(buffer).digest("hex");
      sizeBytes = buffer.length;
    }

    const variants = generateWebPVariants(fileId, file.objectKey);
    const updated = await this.repo.updateStatus(fileId, "ready", {
      mimeType: realMime,
      sha256,
      sizeBytes,
      variants,
    });

    return updated ?? file;
  }

  /**
   * Tương thích ngược: Nhận tệp trực tiếp qua multipart / POST /media (Prototype tuần 7).
   */
  async uploadDirect(
    ownerUserId: string,
    buffer: Buffer,
    fileName: string,
    declaredMime: string,
    accessLevel: "public" | "private" = "public",
  ): Promise<MediaFileRecord> {
    if (buffer.length > MAX_FILE_SIZE) {
      throw new ProblemException(HttpStatus.PAYLOAD_TOO_LARGE, "FILE_TOO_LARGE", "Kích thước tệp vượt quá giới hạn 5 MB.");
    }

    const realMime = detectRealMimeType(buffer);
    if (!realMime) {
      throw new ProblemException(
        HttpStatus.UNSUPPORTED_MEDIA_TYPE,
        "INVALID_MAGIC_BYTES",
        "Nội dung tệp thực tế không phải ảnh hoặc tài liệu hợp lệ (phát hiện giả mạo phần mở rộng).",
      );
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const objectKey = `media/${year}/${month}/${randomUUID()}-${sanitizedName}`;
    const sha256 = createHash("sha256").update(buffer).digest("hex");

    const media = await this.repo.create({
      ownerUserId,
      bucket: "farmery-media",
      objectKey,
      mimeType: realMime,
      sizeBytes: buffer.length,
      sha256,
      accessLevel,
      status: "pending_upload",
    });

    const variants = generateWebPVariants(media.id, objectKey);
    const ready = await this.repo.updateStatus(media.id, "ready", { variants });
    return ready ?? media;
  }

  async getFile(id: string): Promise<MediaFileRecord> {
    const file = await this.repo.findById(id);
    if (!file || file.status === "deleted") {
      throw new ProblemException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy tệp hoặc tệp đã bị xóa.");
    }
    return file;
  }
}

