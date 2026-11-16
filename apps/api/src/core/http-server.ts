import { STATUS_CODES, type Server } from "node:http";
import type { Duplex } from "node:stream";
import { problem } from "./problem";

// Lỗi ở tầng HTTP (header quá lớn, yêu cầu hỏng) xảy ra trước khi Express nhận yêu cầu, nên Node tự trả
// một phản hồi trống. Thay bằng problem+json và đặt thời hạn để kết nối treo không giữ tài nguyên mãi.
export function hardenServer(server: Server): void {
  server.headersTimeout = 15_000;
  server.requestTimeout = 30_000;
  server.keepAliveTimeout = 5_000;
  server.maxHeadersCount = 100;

  server.on("clientError", (error: NodeJS.ErrnoException, socket: Duplex) => {
    if (error.code === "ECONNRESET" || !socket.writable) {
      socket.destroy();
      return;
    }
    const overflow = error.code === "HPE_HEADER_OVERFLOW";
    const status = overflow ? 431 : 400;
    const body = JSON.stringify(
      problem(status, overflow ? "Header yêu cầu quá lớn" : "Yêu cầu HTTP không hợp lệ", {
        code: overflow ? "HEADERS_TOO_LARGE" : "BAD_REQUEST",
      }),
    );
    socket.end(
      `HTTP/1.1 ${status} ${STATUS_CODES[status]}\r\nContent-Type: application/problem+json\r\n` +
        `Content-Length: ${Buffer.byteLength(body)}\r\nConnection: close\r\n\r\n${body}`,
    );
  });
}
