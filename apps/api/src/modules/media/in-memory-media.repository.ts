import { Injectable } from "@nestjs/common";
import { DemoResetRegistry, type Resettable } from "../../core/demo-reset.registry";
import { MediaRepository, type MediaFileRecord } from "./media.repository";

const FIRST_MEDIA_ID = 8000;

@Injectable()
export class InMemoryMediaRepository extends MediaRepository implements Resettable {
  private files = new Map<string, MediaFileRecord>();
  private nextId = FIRST_MEDIA_ID;

  constructor(registry: DemoResetRegistry) {
    super();
    registry.register(this);
    this.seedDefaultFiles();
  }

  private seedDefaultFiles(): void {
    const demoIds = ["1", "2", "3", "4", "5", "100", "200"];
    for (const id of demoIds) {
      this.files.set(id, {
        id,
        url: `http://localhost:4000/api/media/${id}`,
        ownerUserId: "1",
        bucket: "farmery-media",
        objectKey: `media/demo/seed-${id}.webp`,
        mimeType: "image/webp",
        sizeBytes: 154200,
        sha256: `sha256-demo-seed-${id}`,
        accessLevel: "public",
        status: "ready",
        variants: {
          thumbnail: { width: 150, height: 150, objectKey: `media/demo/seed-${id}-150.webp`, url: `http://localhost:4000/api/media/${id}?variant=thumbnail`, format: "webp" },
          medium: { width: 600, height: 600, objectKey: `media/demo/seed-${id}-600.webp`, url: `http://localhost:4000/api/media/${id}?variant=medium`, format: "webp" },
          large: { width: 1200, height: 1200, objectKey: `media/demo/seed-${id}-1200.webp`, url: `http://localhost:4000/api/media/${id}?variant=large`, format: "webp" },
        },
        createdAt: new Date().toISOString(),
      });
    }
  }

  reset(): void {
    this.files.clear();
    this.nextId = FIRST_MEDIA_ID;
    this.seedDefaultFiles();
  }

  async create(file: Omit<MediaFileRecord, "id" | "createdAt" | "url">): Promise<MediaFileRecord> {
    const id = String(this.nextId++);
    const record: MediaFileRecord = {
      ...file,
      id,
      url: `http://localhost:4000/api/media/${id}`,
      createdAt: new Date().toISOString(),
    };
    this.files.set(id, record);
    return structuredClone(record);
  }

  async findById(id: string): Promise<MediaFileRecord | null> {
    const found = this.files.get(id);
    return found ? structuredClone(found) : null;
  }

  async findByObjectKey(objectKey: string): Promise<MediaFileRecord | null> {
    for (const file of this.files.values()) {
      if (file.objectKey === objectKey) return structuredClone(file);
    }
    return null;
  }

  async updateStatus(
    id: string,
    status: MediaFileRecord["status"],
    patch?: Partial<MediaFileRecord>,
  ): Promise<MediaFileRecord | null> {
    const file = this.files.get(id);
    if (!file) return null;
    file.status = status;
    if (patch) {
      Object.assign(file, patch);
    }
    return structuredClone(file);
  }
}

