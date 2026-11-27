export interface MediaVariant {
  width: number;
  height: number;
  objectKey: string;
  url: string;
  format: "webp";
}

export interface MediaFileRecord {
  id: string;
  url: string;
  ownerUserId: string;
  bucket: string;
  objectKey: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
  accessLevel: "public" | "private";
  status: "pending_upload" | "ready" | "rejected" | "deleted";
  variants?: Record<string, MediaVariant>;
  retainUntil?: string | null;
  createdAt: string;
}

export abstract class MediaRepository {
  abstract create(file: Omit<MediaFileRecord, "id" | "createdAt" | "url">): Promise<MediaFileRecord>;
  abstract findById(id: string): Promise<MediaFileRecord | null>;
  abstract findByObjectKey(objectKey: string): Promise<MediaFileRecord | null>;
  abstract updateStatus(
    id: string,
    status: MediaFileRecord["status"],
    patch?: Partial<MediaFileRecord>,
  ): Promise<MediaFileRecord | null>;
}

