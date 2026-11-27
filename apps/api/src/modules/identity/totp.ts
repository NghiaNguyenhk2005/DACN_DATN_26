import { createCipheriv, createDecipheriv, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const STEP_MS = 30_000;

export function newTotpSecret(): Buffer {
  return randomBytes(20);
}

export function provisioningUri(email: string, secret: Buffer): string {
  let encoded = "";
  let accumulator = 0;
  let bits = 0;
  for (const byte of secret) {
    accumulator = (accumulator << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      encoded += BASE32[(accumulator >> bits) & 31];
    }
  }
  const query = new URLSearchParams({ secret: encoded, issuer: "Farmery", algorithm: "SHA1", digits: "6", period: "30" });
  return `otpauth://totp/Farmery:${encodeURIComponent(email)}?${query}`;
}

export function verifyTotp(secret: Buffer, code: string, now: number): bigint | null {
  if (!/^[0-9]{6}$/.test(code)) return null;
  const current = BigInt(Math.floor(now / STEP_MS));
  const provided = Buffer.from(code);
  for (const step of [current, current - 1n, current + 1n]) {
    if (step < 0n) continue;
    const counter = Buffer.alloc(8);
    counter.writeBigUInt64BE(step);
    const digest = createHmac("sha1", secret).update(counter).digest();
    const offset = digest[digest.length - 1]! & 15;
    const value = (digest.readUInt32BE(offset) & 0x7fffffff) % 1_000_000;
    if (timingSafeEqual(provided, Buffer.from(String(value).padStart(6, "0")))) return step;
  }
  return null;
}

function encryptionKey(jwtSecret: string): Buffer {
  return createHmac("sha256", jwtSecret).update("farmery:identity:totp:v1").digest();
}

export function encryptTotp(secret: Buffer, userId: string, jwtSecret: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(jwtSecret), iv).setAAD(Buffer.from(userId));
  const ciphertext = Buffer.concat([cipher.update(secret), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString("base64url");
}

export function decryptTotp(encoded: string, userId: string, jwtSecret: string): Buffer {
  const value = Buffer.from(encoded, "base64url");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(jwtSecret), value.subarray(0, 12));
  decipher.setAAD(Buffer.from(userId));
  decipher.setAuthTag(value.subarray(12, 28));
  return Buffer.concat([decipher.update(value.subarray(28)), decipher.final()]);
}
