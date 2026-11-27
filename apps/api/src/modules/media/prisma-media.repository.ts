/* eslint-disable @typescript-eslint/no-explicit-any */
import { Inject, Injectable } from "@nestjs/common";
import { PRISMA_CLIENT, type PrismaClient } from "../../core/prisma";
import { MediaRepository, type MediaFileRecord } from "./media.repository";

function toRecord(row: any): MediaFileRecord {
  const id = row.id.toString();
  return {
    id,
    url: `http://localhost:4000/api/media/${id}`,
    ownerUserId: row.ownerUserId.toString(),
    bucket: row.bucket,
    objectKey: row.objectKey,
    mimeType: row.mimeType,
    sizeBytes: Number(row.sizeBytes),
    sha256: row.sha256,
    accessLevel: row.accessLevel,
    status: row.status,
    variants: row.variants as any,
    retainUntil: row.retainUntil ? row.retainUntil.toISOString() : null,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : new Date().toISOString(),
  };
}

@Injectable()
export class PrismaMediaRepository extends MediaRepository {
  constructor(@Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient) {
    super();
  }

  async create(file: Omit<MediaFileRecord, "id" | "createdAt">): Promise<MediaFileRecord> {
    const created = await this.prisma.mediaFile.create({
      data: {
        ownerUserId: BigInt(file.ownerUserId),
        bucket: file.bucket,
        objectKey: file.objectKey,
        mimeType: file.mimeType,
        sizeBytes: BigInt(file.sizeBytes),
        sha256: file.sha256,
        accessLevel: file.accessLevel as any,
        status: file.status as any,
        variants: (file.variants as any) || undefined,
        retainUntil: file.retainUntil ? new Date(file.retainUntil) : null,
      },
    });
    return toRecord(created);
  }

  async findById(id: string): Promise<MediaFileRecord | null> {
    try {
      const row = await this.prisma.mediaFile.findUnique({
        where: { id: BigInt(id) },
      });
      return row ? toRecord(row) : null;
    } catch {
      return null;
    }
  }

  async findByObjectKey(objectKey: string): Promise<MediaFileRecord | null> {
    try {
      const row = await this.prisma.mediaFile.findUnique({
        where: { objectKey },
      });
      return row ? toRecord(row) : null;
    } catch {
      return null;
    }
  }

  async updateStatus(
    id: string,
    status: MediaFileRecord["status"],
    patch?: Partial<MediaFileRecord>,
  ): Promise<MediaFileRecord | null> {
    try {
      const data: any = { status };
      if (patch?.variants !== undefined) data.variants = patch.variants;
      if (patch?.sha256 !== undefined) data.sha256 = patch.sha256;
      if (patch?.sizeBytes !== undefined) data.sizeBytes = BigInt(patch.sizeBytes);

      const updated = await this.prisma.mediaFile.update({
        where: { id: BigInt(id) },
        data,
      });
      return toRecord(updated);
    } catch {
      return null;
    }
  }
}

