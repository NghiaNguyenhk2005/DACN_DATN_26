import { createHash } from "node:crypto";
import { Injectable } from "@nestjs/common";

export const EMBEDDING_DIM = 1024;
const MAX_BATCH = 64;

// Nhúng văn bản thành vector đã chuẩn hóa L2 (cosine = tích vô hướng). Dịch vụ AI nội bộ ở apps/ai; chưa cấu hình thì
// provider là null và phía gọi dùng đường dự phòng, không bao giờ trả 5xx cho người dùng vì lỗi nhúng.
export abstract class EmbeddingProvider {
  abstract embed(texts: string[]): Promise<Float32Array[]>;
}

/** Lỗi gọi dịch vụ AI (mạng, hết hạn, phản hồi sai); phía gọi bắt lại để lùi về từ điển khái niệm. */
export class EmbeddingUnavailableError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "EmbeddingUnavailableError";
  }
}

/** Gọi POST /embed của apps/ai; chia lô 64 câu, mỗi lời gọi hết hạn sau timeoutMs (mặc định 2 giây). */
export class HttpEmbeddingProvider extends EmbeddingProvider {
  constructor(
    private readonly baseUrl: string,
    private readonly token: string,
    private readonly timeoutMs = 2000,
  ) {
    super();
  }

  async embed(texts: string[]): Promise<Float32Array[]> {
    const out: Float32Array[] = [];
    for (let i = 0; i < texts.length; i += MAX_BATCH) out.push(...(await this.embedBatch(texts.slice(i, i + MAX_BATCH))));
    return out;
  }

  private async embedBatch(texts: string[]): Promise<Float32Array[]> {
    let body: unknown;
    try {
      const res = await fetch(new URL("embed", this.baseUrl.endsWith("/") ? this.baseUrl : `${this.baseUrl}/`), {
        method: "POST",
        headers: { "content-type": "application/json", "x-internal-token": this.token },
        body: JSON.stringify({ texts }),
        signal: AbortSignal.timeout(this.timeoutMs),
      });
      if (!res.ok) throw new EmbeddingUnavailableError(`Dịch vụ AI trả ${res.status}`);
      body = await res.json();
    } catch (error) {
      if (error instanceof EmbeddingUnavailableError) throw error;
      throw new EmbeddingUnavailableError("Không gọi được dịch vụ AI", { cause: error });
    }
    return parseVectors(body, texts.length);
  }
}

function parseVectors(body: unknown, expected: number): Float32Array[] {
  const vectors = (body as { vectors?: unknown } | null)?.vectors;
  if (!Array.isArray(vectors) || vectors.length !== expected) throw new EmbeddingUnavailableError("Phản hồi của dịch vụ AI sai số vector");
  return vectors.map((v) => {
    if (!Array.isArray(v) || v.length !== EMBEDDING_DIM || !v.every((x) => typeof x === "number" && Number.isFinite(x))) {
      throw new EmbeddingUnavailableError(`Vector phải có ${EMBEDDING_DIM} số hữu hạn`);
    }
    return Float32Array.from(v as number[]);
  });
}

/**
 * Vector tất định từ băm các từ đã bỏ dấu, cho test và CI: hai văn bản chung từ thì gần nhau. Không phải mô hình ngôn
 * ngữ. Cùng thuật toán với HashingEmbedder của apps/ai nên hai bên cho cùng vector.
 */
@Injectable()
export class HashingEmbeddingProvider extends EmbeddingProvider {
  async embed(texts: string[]): Promise<Float32Array[]> {
    return texts.map(hashEmbed);
  }
}

function tokens(text: string): string[] {
  const folded = text.toLowerCase().replace(/đ/g, "d").normalize("NFD").replace(/\p{Mn}/gu, "");
  return folded.match(/[a-z0-9]+/g) ?? [];
}

function hashEmbed(text: string): Float32Array {
  const v = new Float32Array(EMBEDDING_DIM);
  for (const token of tokens(text)) {
    const digest = createHash("sha256").update(token, "utf8").digest();
    const slot = digest.readUInt32BE(0) % EMBEDDING_DIM;
    v[slot] = (v[slot] ?? 0) + ((digest.readUInt8(4) & 1) === 1 ? 1 : -1);
  }
  let sum = 0;
  for (const x of v) sum += x * x;
  const norm = Math.sqrt(sum);
  return norm > 0 ? v.map((x) => x / norm) : v;
}
