# Dịch vụ AI nội bộ (`apps/ai`)

Python + FastAPI. Hiện có một việc: nhúng văn bản thành vector bằng BGE-M3 (`POST /embed`), để API nghiệp vụ làm tìm
kiếm ngữ nghĩa (FR12.3) và sản phẩm tương tự (FR12.1). Thư mục `forecast/` là pipeline dự báo giá chạy offline (FR12.2),
có README riêng.

Đây là giao tiếp nội bộ nên **không nằm trong `openapi.yaml`**; hợp đồng mô tả ở đây. Chỉ nghe `127.0.0.1`, mọi lời gọi
`/embed` phải kèm header `X-Internal-Token`.

## Chạy

```bash
cd apps/ai
cp .env.example .env           # đặt AI_SERVICE_TOKEN; AI_EMBEDDER=real nạp BGE-M3, fake chỉ để thử nhanh
uv run uvicorn app.main:app_factory --factory --host 127.0.0.1 --port 8000
```

Chưa có `uv`: `python -m venv .venv`, `pip install fastapi uvicorn numpy sentence-transformers`, rồi chạy `uvicorn` như
trên. Biến môi trường không tự đọc từ `.env` (uvicorn: thêm `--env-file .env`).

Lần chạy đầu tải BGE-M3 (khoảng 2,2 GB, cache ở thư mục mặc định của Hugging Face hoặc `AI_MODEL_CACHE`). Đã đo trên máy
CPU 16 GB: nạp khoảng 51 giây, đỉnh RAM vật lý khoảng 2,2 GB, đỉnh bộ nhớ cam kết khoảng 4,9 GB; cần ≥ ~3 GB RAM trống,
nếu không sẽ bị đẩy sang swap và chậm hẳn. Mô hình nạp ở luồng nền: `/health` báo `loading` và `/embed` trả 503 cho tới
khi xong.

## Hợp đồng

`GET /health` (không cần token) → `{ status: "ok" | "loading" | "error", modelLoaded, model, dim, error }`.

`POST /embed` (cần `X-Internal-Token`)

- Yêu cầu: `{ "texts": ["dâu tây Đà Lạt", ...] }`; 1–64 câu, mỗi câu không rỗng và tối đa 8000 ký tự; văn bản quá
  `AI_MAX_TOKENS` (mặc định 512) token bị cắt.
- Trả: `{ "model": "BAAI/bge-m3", "dim": 1024, "vectors": [[...], ...] }`, thứ tự theo `texts`, mỗi vector đã chuẩn hóa
  L2 nên cosine bằng tích vô hướng.
- Lỗi: 401 sai hoặc thiếu token; 422 đầu vào sai; 503 mô hình chưa nạp xong hoặc nạp lỗi (kèm `Retry-After`).

Phía API: `apps/api/src/integrations/embedding-provider.ts` (`HttpEmbeddingProvider` hết hạn sau 2 giây và ném
`EmbeddingUnavailableError` để phía gọi lùi về từ điển khái niệm). Bật bằng `AI_SERVICE_URL` và `AI_SERVICE_TOKEN` ở
`apps/api/.env`; thiếu thì không bật vector.

## Test

```bash
uv run pytest -q          # dùng bộ nhúng băm tất định, không cần tải mô hình
uv run ruff check .
```

`HashingEmbedder` (Python) và `HashingEmbeddingProvider` (API) dùng cùng thuật toán nên cho cùng vector; test API kiểm
điều đó bằng một vector tính từ bản Python.
