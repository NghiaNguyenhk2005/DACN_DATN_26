import { spawn, type ChildProcess } from "node:child_process";
import { randomBytes } from "node:crypto";
import { createServer as createHttpServer, type Server as HttpServer } from "node:http";
import { createServer } from "node:net";
import path from "node:path";
import { SMTPServer } from "smtp-server";

export interface Mail {
  to: string;
  raw: string;
}

export interface Servers {
  /** Giống chạy demo: DEMO_MODE, giới hạn tần suất cao để các kịch bản chạy liền mạch. */
  main: string;
  /** Giống production: NODE_ENV=production, DEMO_MODE tắt, OTP gửi thật qua SMTP, docs tắt, CORS hạn chế. */
  prod: string;
  /** Giới hạn tần suất theo IP rất thấp để kiểm 429. */
  tight: string;
  smtpPort: number;
  /** Cửa HTTP đọc thư SMTP đã nhận (GET ?to=email) cho tiến trình test. */
  mailbox: string;
  prodOrigin: string;
  prodSecret: string;
}

interface Running {
  children: ChildProcess[];
  smtp: SMTPServer;
  mailbox: HttpServer;
  mails: Mail[];
}

declare global {
  var __bb: Running | undefined;
}

function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = createServer();
    srv.once("error", reject);
    srv.listen(0, "127.0.0.1", () => {
      const { port } = srv.address() as { port: number };
      srv.close(() => resolve(port));
    });
  });
}

async function waitHealthy(url: string, child: ChildProcess, log: () => string): Promise<void> {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`Server thoát sớm (mã ${child.exitCode}):\n${log()}`);
    try {
      if ((await fetch(`${url}/api/health`)).ok) return;
    } catch {
      /* chưa lên */
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`Server không lên trong 30 giây:\n${log()}`);
}

async function start(env: Record<string, string>, children: ChildProcess[]): Promise<string> {
  const port = await freePort();
  const url = `http://127.0.0.1:${port}`;
  let output = "";
  const child = spawn(process.execPath, [path.resolve(__dirname, "../../dist/main.js")], {
    env: { PATH: process.env.PATH ?? "", HOME: process.env.HOME ?? "", PORT: String(port), ...env },
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.stdout?.on("data", (d: Buffer) => (output += d.toString()));
  child.stderr?.on("data", (d: Buffer) => (output += d.toString()));
  children.push(child);
  await waitHealthy(url, child, () => output.slice(-2000));
  return url;
}

export async function startAll(): Promise<Servers> {
  const children: ChildProcess[] = [];
  const mails: Mail[] = [];
  const smtp = new SMTPServer({
    authOptional: true,
    disabledCommands: ["STARTTLS", "AUTH"],
    onData(stream, session, done) {
      const chunks: Buffer[] = [];
      stream.on("data", (c: Buffer) => chunks.push(c));
      stream.on("end", () => {
        mails.push({ to: session.envelope.rcptTo.map((r) => r.address).join(","), raw: Buffer.concat(chunks).toString("utf8") });
        done();
      });
    },
  });
  const smtpPort = await freePort();
  await new Promise<void>((resolve) => smtp.listen(smtpPort, "127.0.0.1", resolve));
  const mailboxPort = await freePort();
  const mailbox = createHttpServer((req, res) => {
    const to = new URL(req.url ?? "/", "http://x").searchParams.get("to")?.toLowerCase() ?? "";
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(mails.filter((m) => m.to.toLowerCase().includes(to))));
  });
  await new Promise<void>((resolve) => mailbox.listen(mailboxPort, "127.0.0.1", resolve));
  globalThis.__bb = { children, smtp, mailbox, mails };

  const prodSecret = randomBytes(32).toString("hex");
  const prodOrigin = "https://app.farmery.example";
  const [main, prod, tight] = await Promise.all([
    start({ NODE_ENV: "development", RATE_LIMIT_MAX: "100000", RATE_LIMIT_AUTH_MAX: "100000" }, children),
    start(
      {
        NODE_ENV: "production",
        DEMO_MODE: "false",
        JWT_SECRET: prodSecret,
        SMTP_URL: `smtp://127.0.0.1:${smtpPort}`,
        CORS_ORIGINS: prodOrigin,
        RATE_LIMIT_MAX: "100000",
        RATE_LIMIT_AUTH_MAX: "100000",
        OTP_MAX_PER_HOUR: "3",
        OTP_MAX_FAILURES_PER_15_MIN: "4",
        OTP_RESEND_COOLDOWN_SECONDS: "30",
      },
      children,
    ),
    start({ NODE_ENV: "development", RATE_LIMIT_MAX: "40", RATE_LIMIT_AUTH_MAX: "5" }, children),
  ]);
  return { main, prod, tight, smtpPort, mailbox: `http://127.0.0.1:${mailboxPort}`, prodOrigin, prodSecret };
}

export async function stopAll(): Promise<void> {
  const running = globalThis.__bb;
  if (!running) return;
  for (const child of running.children) child.kill("SIGTERM");
  await Promise.all(
    running.children.map(
      (child) =>
        new Promise<void>((resolve) => {
          if (child.exitCode !== null) return resolve();
          const timer = setTimeout(() => (child.kill("SIGKILL"), resolve()), 5000);
          child.once("exit", () => (clearTimeout(timer), resolve()));
        }),
    ),
  );
  await new Promise<void>((resolve) => running.smtp.close(() => resolve()));
  await new Promise<void>((resolve) => running.mailbox.close(() => resolve()));
  globalThis.__bb = undefined;
}
