import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import { loadConfig } from "../src/core/app-config";
import {
  EMBEDDING_DIM,
  EmbeddingUnavailableError,
  HashingEmbeddingProvider,
  HttpEmbeddingProvider,
} from "../src/integrations/embedding-provider";

const dot = (a: Float32Array, b: Float32Array) => a.reduce((s, x, i) => s + x * (b[i] ?? 0), 0);

// Sinh bằng: python -c "from app.embedder import HashingEmbedder as H; v=H().embed(['dâu tây'])[0]; print([[i,round(float(x),6)] for i,x in enumerate(v) if x])"
const PYTHON_DAU_TAY = [
  [341, 0.707107],
  [882, 0.707107],
];

describe("Cấu hình dịch vụ AI", () => {
  it("không đặt thì tắt vector và không chặn khởi động", () => {
    expect(loadConfig({ NODE_ENV: "development" }).ai).toBeNull();
    expect(loadConfig({ NODE_ENV: "production", JWT_SECRET: "x".repeat(32), SMTP_URL: "smtp://u:p@h:587" }).ai).toBeNull();
  });

  it("đặt URL kèm token thì bật", () => {
    expect(loadConfig({ AI_SERVICE_URL: "http://127.0.0.1:8000", AI_SERVICE_TOKEN: "t" }).ai).toEqual({ url: "http://127.0.0.1:8000", token: "t" });
  });

  it("đặt URL thiếu token hoặc URL sai dạng thì từ chối khởi động", () => {
    expect(() => loadConfig({ AI_SERVICE_URL: "http://127.0.0.1:8000" })).toThrow("Thiếu AI_SERVICE_TOKEN");
    expect(() => loadConfig({ AI_SERVICE_URL: "127.0.0.1:8000", AI_SERVICE_TOKEN: "t" })).toThrow("AI_SERVICE_URL");
  });
});

describe("HashingEmbeddingProvider", () => {
  const provider = new HashingEmbeddingProvider();

  it("trả vector 1024 chiều đã chuẩn hóa L2, tất định", async () => {
    const [a, b] = (await provider.embed(["dâu tây Đà Lạt", "dâu tây Đà Lạt"])) as [Float32Array, Float32Array];
    expect(a).toHaveLength(EMBEDDING_DIM);
    expect(dot(a, a)).toBeCloseTo(1, 5);
    expect(Array.from(a)).toEqual(Array.from(b));
  });

  it("không phân biệt dấu và hoa thường; chung từ thì gần hơn khác từ", async () => {
    const [withDiacritics, plain, other] = (await provider.embed(["Dâu tây Đà Lạt", "dau tay da lat", "xe máy điện"])) as [
      Float32Array,
      Float32Array,
      Float32Array,
    ];
    expect(dot(withDiacritics, plain)).toBeCloseTo(1, 5);
    expect(dot(withDiacritics, plain)).toBeGreaterThan(dot(withDiacritics, other));
  });

  it("văn bản không có chữ thì trả vector 0, không NaN", async () => {
    const [v] = (await provider.embed(["!!!"])) as [Float32Array];
    expect(v.every((x) => x === 0)).toBe(true);
  });

  it("khớp từng số với HashingEmbedder của apps/ai", async () => {
    // Giá trị tính bằng apps/ai (app.embedder.HashingEmbedder) cho "dau tay"; hai bên phải cho cùng vector.
    const [v] = (await provider.embed(["dâu tây"])) as [Float32Array];
    const nonZero = Array.from(v).flatMap((x, i) => (x !== 0 ? [[i, Math.round(x * 1e6) / 1e6]] : []));
    expect(nonZero).toEqual(PYTHON_DAU_TAY);
  });
});

describe("HttpEmbeddingProvider", () => {
  let server: Server;
  let url: string;
  let handler: (req: IncomingMessage, body: string, res: ServerResponse) => void;
  const calls: { token: string | undefined; size: number }[] = [];

  beforeAll(async () => {
    server = createServer((req, res) => {
      let data = "";
      req.on("data", (c) => (data += c));
      req.on("end", () => handler(req, data, res));
    });
    await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
    url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });
  afterAll(() => new Promise<void>((r) => server.close(() => r())));
  beforeEach(() => {
    calls.length = 0;
    handler = (req, body, res) => {
      const { texts } = JSON.parse(body) as { texts: string[] };
      calls.push({ token: req.headers["x-internal-token"] as string | undefined, size: texts.length });
      const vec = Array.from({ length: EMBEDDING_DIM }, (_, i) => (i === 0 ? 1 : 0));
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ model: "m", dim: EMBEDDING_DIM, vectors: texts.map(() => vec) }));
    };
  });

  it("gửi token nội bộ và trả Float32Array đủ chiều", async () => {
    const out = await new HttpEmbeddingProvider(url, "secret").embed(["a", "b"]);
    expect(calls).toEqual([{ token: "secret", size: 2 }]);
    expect(out).toHaveLength(2);
    expect(out[0]).toBeInstanceOf(Float32Array);
    expect(out[0]?.length).toBe(EMBEDDING_DIM);
  });

  it("chia lô 64 câu và giữ thứ tự", async () => {
    const out = await new HttpEmbeddingProvider(url, "t").embed(Array.from({ length: 130 }, (_, i) => `câu ${i}`));
    expect(calls.map((c) => c.size)).toEqual([64, 64, 2]);
    expect(out).toHaveLength(130);
  });

  it("danh sách rỗng thì không gọi mạng", async () => {
    expect(await new HttpEmbeddingProvider(url, "t").embed([])).toEqual([]);
    expect(calls).toHaveLength(0);
  });

  it("HTTP lỗi thì ném EmbeddingUnavailableError", async () => {
    handler = (_req, _body, res) => {
      res.statusCode = 401;
      res.end("{}");
    };
    await expect(new HttpEmbeddingProvider(url, "sai").embed(["a"])).rejects.toBeInstanceOf(EmbeddingUnavailableError);
  });

  it("hết hạn thì ném EmbeddingUnavailableError, không treo", async () => {
    handler = () => {
      /* không trả lời */
    };
    const started = Date.now();
    await expect(new HttpEmbeddingProvider(url, "t", 150).embed(["a"])).rejects.toBeInstanceOf(EmbeddingUnavailableError);
    expect(Date.now() - started).toBeLessThan(2000);
  });

  it("không kết nối được thì ném EmbeddingUnavailableError", async () => {
    await expect(new HttpEmbeddingProvider("http://127.0.0.1:1", "t", 500).embed(["a"])).rejects.toBeInstanceOf(EmbeddingUnavailableError);
  });

  it.each([
    ["sai số vector", { vectors: [] }],
    ["sai số chiều", { vectors: [[1, 2, 3]] }],
    ["giá trị không phải số", { vectors: [Array.from({ length: EMBEDDING_DIM }, () => "x")] }],
    ["không có vectors", {}],
  ])("phản hồi %s thì ném EmbeddingUnavailableError", async (_name, payload) => {
    handler = (_req, _body, res) => {
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify(payload));
    };
    await expect(new HttpEmbeddingProvider(url, "t").embed(["a"])).rejects.toBeInstanceOf(EmbeddingUnavailableError);
  });
});

// Chỉ chạy khi có dịch vụ AI thật đang chạy: AI_SERVICE_URL=http://127.0.0.1:8000 AI_SERVICE_TOKEN=... pnpm test -- embedding-provider
const describeReal = process.env.AI_SERVICE_URL ? describe : describe.skip;

describeReal("HttpEmbeddingProvider với dịch vụ AI thật (BGE-M3)", () => {
  const provider = new HttpEmbeddingProvider(process.env.AI_SERVICE_URL ?? "", process.env.AI_SERVICE_TOKEN ?? "", 10_000);

  it("trả vector 1024 chiều đã chuẩn hóa; câu cùng nghĩa gần hơn câu lạc đề", async () => {
    const [a, b, c] = (await provider.embed(["dâu tây", "quả dâu tây ngọt trồng ở Lâm Đồng", "xe máy điện"])) as [Float32Array, Float32Array, Float32Array];
    expect(a).toHaveLength(EMBEDDING_DIM);
    expect(dot(a, a)).toBeCloseTo(1, 3);
    expect(dot(a, b)).toBeGreaterThan(dot(a, c));
  });
});
