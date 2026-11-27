# apps/perf — kịch bản k6

Đo hiệu năng (NFR1.1) và chống bán vượt tồn kho (NFR1.2, NFR4.1) bằng Grafana k6. Thư mục chỉ chứa script, không phải package pnpm.

## Chuẩn bị

- Cài k6: `winget install GrafanaLabs.k6` (đã thử với 2.4.0).
- Dựng gói dùng chung rồi API: `pnpm --filter @farmery/contract generate`, `pnpm --filter @farmery/contract build`, `pnpm --filter @farmery/mock-data build`, `pnpm --filter @farmery/api build`.
- Chạy API ở chế độ đo (từ `apps/api`):

  ```
  RATE_LIMIT_ENABLED=false VALIDATE_RESPONSES=false DEMO_MODE=true STORAGE=memory node dist/main.js
  ```

  - `RATE_LIMIT_ENABLED=false`: k6 chạy từ một IP nên sẽ vướng giới hạn 600 yêu cầu/phút.
  - `VALIDATE_RESPONSES=false`: bỏ bước kiểm phản hồi theo openapi, vốn chỉ dành cho dev.
  - `DEMO_MODE=true`: cần cho OTP cố định `123456` và `POST /api/dev/reset`.

## Chạy với tồn kho trên PostgreSQL (chế độ hỗn hợp)

Chỉ mô-đun tồn kho dùng PostgreSQL, catalog, giỏ và đơn vẫn ở bộ nhớ (chống bán vượt bằng `SELECT ... FOR UPDATE`):

1. `pnpm db:up`, rồi từ `apps/api`: `pnpm db:migrate`.
2. Bật thống kê truy vấn một lần: `docker exec farmery-db psql -U farmery -d farmery -c "CREATE EXTENSION IF NOT EXISTS pg_stat_statements;"` (thư viện đã nạp sẵn ở `docker-compose.yml`); xóa số cũ bằng `select pg_stat_statements_reset();` trước mỗi lượt đo.
3. Chạy API thêm `INVENTORY_STORAGE=prisma DATABASE_URL=postgresql://farmery:farmery@localhost:5433/farmery` (giữ `STORAGE=memory`). Lần khởi động đầu và mỗi lần `POST /api/dev/reset` sẽ xóa và nạp lại dữ liệu tồn mẫu trong PostgreSQL (chỉ khi `DEMO_MODE=true`).
4. Chạy k6 như bình thường. Sau đó xem truy vấn tốn thời gian nhất: `select calls, mean_exec_time, total_exec_time, query from pg_stat_statements order by total_exec_time desc limit 5;`.

## Kịch bản

| File | Việc đo | Ngưỡng (k6 thoát mã khác 0 nếu vi phạm) |
|---|---|---|
| `scenarios/browse.js` | Tải tăng dần 10 → 50 → 100 VU chuỗi tìm kiếm, chi tiết, truy xuất; song song 4 người mua đặt đơn nhẹ | p95 < 2 s, trung vị < 3 s, lỗi < 1% |
| `scenarios/oversell.js` | 4 người mua đặt đồng thời trên dòng tồn 8 (listing 204), lặp `ROUNDS` vòng, reset dữ liệu mỗi vòng | 0 bán vượt, tồn giữ chỗ khớp số đơn được nhận |

Chạy từ gốc repo: `k6 run apps/perf/scenarios/browse.js` và `k6 run -e ROUNDS=50 apps/perf/scenarios/oversell.js`.

Biến tùy chọn: `BASE_URL` (mặc định `http://localhost:4000`), `ORDER_LISTING` (browse, mặc định 217), `LISTING`, `PRODUCT`, `STOCK`, `ROUNDS`, `BUYERS` (oversell), `DEBUG=1` (in lỗi đặt đơn).

Bản 50 người mua: `LOADTEST_BUYERS=50` khi chạy API, rồi `k6 run -e BUYERS=50 -e ROUNDS=50 apps/perf/scenarios/oversell.js`.

## Giới hạn hiện tại

- Với `STORAGE=memory` thuần, chống bán vượt dựa vào khóa trong tiến trình, không phải khóa dòng của PostgreSQL; chỉ chế độ hỗn hợp ở trên mới đo được khóa PostgreSQL. Ngay cả khi đó catalog, giỏ và đơn vẫn ở bộ nhớ.
- Mặc định chỉ có 4 tài khoản người mua nên mỗi vòng `oversell` chỉ có 4 yêu cầu tranh nhau. Để đạt 50 yêu cầu đồng thời của NFR1.2: chạy API với `LOADTEST_BUYERS=50` (chỉ khi `DEMO_MODE=true`) và k6 với `-e BUYERS=50`.
- Chưa có kịch bản hợp đồng sỉ hoặc đơn thu mua cùng giành tồn vì các mô-đun này chưa trừ tồn qua `InventoryService`.
- `browse.js` và `oversell.js` đều gọi `POST /dev/reset`; không chạy chung lúc có người dùng thật trên cùng API.
