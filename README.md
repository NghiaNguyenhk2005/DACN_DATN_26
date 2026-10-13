# Farmery — DACN/DATN 2026

Sàn thương mại điện tử nông sản có truy xuất nguồn gốc. Repo chứa cả báo cáo đồ án lẫn mã nguồn.

## Bố cục

| Đường dẫn | Nội dung |
|---|---|
| `report/` | Báo cáo LaTeX (`main.tex`), hình, bộ sinh sơ đồ. Build trong thư mục này: `pdflatex` → `biber` → `pdflatex` ×2 |
| `apps/`, `packages/` | Mã nguồn monorepo (pnpm + Turborepo) — đang dựng ở giai đoạn prototype |
| `MVP.md` | Phạm vi hiện thực theo mã yêu cầu FR/NFR |
| `DECISIONS.md` | Quyết định đã chốt (chỉ nối thêm) |
| `NOTES.md` | Việc đang mở |
| `INDEX.md` | Chỉ mục chi tiết từng file |
