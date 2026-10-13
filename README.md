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
| API (`apps/api`) | http://localhost:4000 — Swagger ở `/docs`, `GET /health`, `POST /dev/reset` |

Các lệnh khác (chạy từ gốc, giống CI): `pnpm lint:spec` (kiểm `openapi.yaml`), `pnpm generate` (sinh kiểu từ hợp đồng),
`pnpm lint`, `pnpm typecheck`, `pnpm build`. Chạy riêng một gói: `pnpm --filter @farmery/api dev`.
