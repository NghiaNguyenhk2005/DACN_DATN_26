# Farmery — DACN/DATN 2026

Sàn thương mại điện tử nông sản có truy xuất nguồn gốc. Repo chứa cả báo cáo đồ án lẫn mã nguồn.

## Bố cục

| Đường dẫn | Nội dung |
|---|---|
| `report/` | Báo cáo LaTeX (`main.tex`), hình, bộ sinh sơ đồ. Build trong thư mục này: `pdflatex` → `biber` → `pdflatex` ×2 |
| `apps/`, `packages/` | Mã nguồn monorepo (pnpm + Turborepo): `apps/shop`, `apps/admin`, `apps/api`, `packages/contract`, `packages/mock-data` |
| `MVP.md` | Phạm vi hiện thực theo mã yêu cầu FR/NFR |
| `DECISIONS.md` | Quyết định đã chốt (chỉ nối thêm) |
| `NOTES.md` | Việc đang mở |
| `INDEX.md` | Chỉ mục chi tiết từng file |

## Cài và chạy mã nguồn

Cần Node 22 (`.nvmrc`). pnpm 9.15.9 được ghim trong `package.json`, cài qua corepack:

```bash
corepack enable   # Windows báo EPERM: mở terminal quyền Administrator, hoặc
                  # corepack enable pnpm --install-directory <thư mục đã có trong PATH>
pnpm i
pnpm dev          # chạy đồng thời 3 app
```

| App | Địa chỉ |
|---|---|
| Ứng dụng mua hàng (`apps/shop`) | http://localhost:3000 |
| Ứng dụng nội bộ (`apps/admin`) | http://localhost:5173 |
| API (`apps/api`) | http://localhost:4000/api — Swagger ở http://localhost:4000/docs; `GET /api/health`, `POST /api/dev/reset` |

Các lệnh khác (chạy từ gốc, giống CI): `pnpm lint:spec` (kiểm `openapi.yaml`), `pnpm generate` (sinh kiểu từ hợp đồng),
`pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`. Chạy riêng một gói: `pnpm --filter @farmery/api dev`.
Đổi cấu hình mặc định: sao `.env.example` của từng app (thành `.env` ở `apps/api`, `.env.local` ở shop và admin).

Viết endpoint cho API: xem [`apps/api/README.md`](apps/api/README.md) (khuôn theo mô-đun mẫu `catalog`, quy tắc, mã lỗi).
Prototype là nền của MVP, không phải bản làm thử: xem `MVP.md` mục 6.

## Quy trình git

- `main` chỉ nhận gộp từ `develop` ở các mốc; `develop` là nhánh tích hợp.
- Mỗi việc một nhánh `feat/<fe|be1|be2>-<việc>`, mỗi PR không quá một ngày công; rebase theo `develop` mỗi sáng.
- PR vào `develop` cần CI xanh và một người duyệt (PR chạm `openapi.yaml` cần cả FE lẫn BE duyệt).
- Một commit một mục đích, thông điệp tiếng Việt.
- Sau khi chốt hợp đồng (M1, 15/10), mọi thay đổi `packages/contract/openapi.yaml` đi qua PR riêng và báo cả nhóm.

Mốc prototype: M1 tối 15/10 chốt hợp đồng API · M2 tối 18/10 luồng khách lẻ chạy trên API thật · M3 tối 19/10 kịch
bản demo xuyên hai ứng dụng · đóng băng mã 18:00 ngày 20/10 · demo 21/10.
