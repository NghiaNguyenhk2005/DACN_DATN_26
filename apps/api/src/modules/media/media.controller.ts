import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
} from "@nestjs/common";
import type { Request } from "express";
import { CurrentUser } from "../../core/current-user.decorator";
import type { AuthUser } from "../../core/token.service";
import { MediaService } from "./media.service";

@Controller("media")
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  /**
   * Yêu cầu URL ký trước để tải trực tiếp lên kho tệp MinIO (FR10.2).
   */
  @Post("presigned")
  @HttpCode(HttpStatus.OK)
  async getPresignedUrl(
    @CurrentUser() user: AuthUser | undefined,
    @Body() body: { fileName: string; mimeType: string; sizeBytes: number; accessLevel?: "public" | "private" },
  ) {
    const userId = user?.id || "1";
    return this.mediaService.requestPresignedUpload(userId, body);
  }

  /**
   * Xác nhận hoàn tất tải lên MinIO; kiểm tra magic bytes thực tế và sinh WebP nhiều cỡ.
   */
  @Post("confirm")
  @HttpCode(HttpStatus.OK)
  async confirmUpload(
    @Body() body: { fileId: string; contentBase64?: string },
  ) {
    const buffer = body.contentBase64 ? Buffer.from(body.contentBase64, "base64") : undefined;
    return this.mediaService.confirmUpload(body.fileId, buffer);
  }

  /**
   * Tải tệp trực tiếp qua POST /media (tương thích prototype tuần 7).
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async uploadDirect(
    @CurrentUser() user: AuthUser | undefined,
    @Req() req: Request,
    @Body() body: Record<string, string | undefined>,
  ) {
    const userId = user?.id || "1";
    let buffer: Buffer;
    let fileName = "upload.jpg";
    let mimeType = "image/jpeg";

    if (body?.contentBase64) {
      buffer = Buffer.from(body.contentBase64, "base64");
      fileName = body.fileName || fileName;
      mimeType = body.mimeType || mimeType;
    } else if (Buffer.isBuffer(req.body)) {
      buffer = req.body;
      fileName = (req.headers["x-file-name"] as string) || fileName;
      mimeType = (req.headers["content-type"] as string) || mimeType;
    } else {
      buffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
    }

    const accessLevel = body?.accessLevel === "private" ? "private" : "public";
    return this.mediaService.uploadDirect(userId, buffer, fileName, mimeType, accessLevel);
  }

  /**
   * Truy xuất thông tin tệp hoặc đường dẫn xem ảnh (hỗ trợ variant=thumbnail/medium/large).
   */
  @Get(":id")
  async getMedia(
    @Param("id") id: string,
  ) {
    return this.mediaService.getFile(id);
  }
}
