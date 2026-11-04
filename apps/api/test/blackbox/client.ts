// Máy khách HTTP tối thiểu cho test blackbox: chỉ dùng fetch tới server thật, không import mã của server.
export interface Reply<T = any> { // eslint-disable-line @typescript-eslint/no-explicit-any
  status: number;
  headers: Headers;
  body: T;
  text: string;
}

export const MAIN = (): string => process.env.BB_MAIN as string;
export const PROD = (): string => process.env.BB_PROD as string;
export const TIGHT = (): string => process.env.BB_TIGHT as string;
export const PROD_ORIGIN = (): string => process.env.BB_PROD_ORIGIN as string;

export interface Options {
  token?: string;
  body?: unknown;
  raw?: string | Uint8Array;
  headers?: Record<string, string>;
}

export async function call(base: string, method: string, path: string, opts: Options = {}): Promise<Reply> {
  const headers: Record<string, string> = { ...opts.headers };
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;
  let body: string | Uint8Array | undefined = opts.raw;
  if (body === undefined && opts.body !== undefined) {
    body = JSON.stringify(opts.body);
    headers["Content-Type"] ??= "application/json";
  }
  const res = await fetch(`${base}${path}`, { method, headers, body: body as BodyInit | undefined });
  const text = await res.text();
  let parsed: unknown = text;
  try {
    parsed = text ? JSON.parse(text) : undefined;
  } catch {
    /* không phải JSON */
  }
  return { status: res.status, headers: res.headers, body: parsed, text };
}

/** Đăng nhập bằng OTP ở server DEMO_MODE (đọc devCode trong phản hồi). */
export async function login(base: string, email: string): Promise<string> {
  const otp = await call(base, "POST", "/api/auth/otp", { body: { email } });
  if (otp.status !== 200) throw new Error(`/auth/otp ${otp.status}: ${otp.text}`);
  const res = await call(base, "POST", "/api/auth/login", { body: { challengeId: otp.body.challengeId, code: otp.body.devCode } });
  if (res.status !== 200) throw new Error(`/auth/login ${res.status}: ${res.text}`);
  return res.body.accessToken as string;
}

/** Lấy mã OTP từ email thật mà server đã gửi qua SMTP (đọc ở hộp thư giả của test). */
export async function otpFromMail(email: string, timeoutMs = 8000): Promise<string> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const res = await fetch(`${process.env.BB_MAILBOX}/?to=${encodeURIComponent(email)}`);
    const mails = (await res.json()) as { raw: string }[];
    const last = mails.at(-1);
    const code = last && /\b(\d{6})\b/.exec(last.raw.replace(/^[\s\S]*?\r?\n\r?\n/, ""))?.[1];
    if (code) return code;
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`Không thấy email OTP cho ${email}`);
}

export async function mailCount(email: string): Promise<number> {
  const res = await fetch(`${process.env.BB_MAILBOX}/?to=${encodeURIComponent(email)}`);
  return ((await res.json()) as unknown[]).length;
}

export const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));
