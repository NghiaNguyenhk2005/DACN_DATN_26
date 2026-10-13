# INDEX.md — Chỉ mục file/thư mục

Cập nhật lần cuối: 2026-10-13 (chuẩn bị prototype làm nền MVP: tiền tố `/api`, nền `apps/api` kiểm hợp đồng,
13 mô-đun, test e2e; `MVP.md` mục 6; kế hoạch có tuần prototype). Cùng ngày: dựng khung monorepo prototype
(`apps/shop`, `apps/admin`, `apps/api`, `packages/contract`, `packages/mock-data`, CI); tách báo cáo LaTeX vào `report/`; lược đồ CSDL 13 schema,
ERD và Phụ lục K sinh từ `schema.dbml`. Trước đó: 2026-10-08 (phiên siết phạm vi theo trục bán lẻ
đầu–cuối: hai ứng dụng, sáu vai trò nội bộ, 13 mô-đun, Phụ lục U–V, vẽ lại C4, use case, sơ đồ hoạt động UML,
sitemap; thân báo cáo 125 trang).

## Gốc dự án

Gốc repo chứa tài liệu dự án dùng chung cho cả báo cáo lẫn mã nguồn; báo cáo nằm trọn trong `report/`; mã nguồn
(monorepo pnpm + Turborepo: `apps/`, `packages/`) đặt thẳng ở gốc — xem mục "Mã nguồn" bên dưới.

| File | Vai trò |
|---|---|
| `README.md` | Giới thiệu ngắn và bố cục repo |
| `DECISIONS.md` | Log quyết định kỹ thuật/nội dung đã chốt (append-only) |
| `MVP.md` | Phạm vi MVP chi tiết theo mã FR/NFR; báo cáo ghi phạm vi hiện thực ở mục 1.3.4 và đánh dấu *(chỉ thiết kế)* trong từng FR — ba chỗ phải khớp nhau. Mục 6: phần giả lập ở prototype và bản thật ở MVP, bốn điều kiện rà ở mốc 21/10 |
| `NOTES.md` | Việc đang mở, chưa chốt |
| `INDEX.md` | File này |
| `.gitignore` | `node_modules/`, artifact build LaTeX, `PHASE*-PLAN.md`/`.html`, `slide-pack/`, `review/`; build của monorepo (`.turbo/`, `dist/`, `.next/`, kiểu sinh trong `packages/contract/src/generated/`) |
| `.gitattributes` | `* text=auto eol=lf` — mọi file văn bản lưu LF kể cả trên Windows |
| `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml` | Gốc workspace pnpm (`apps/*`, `packages/*`; `report/` đứng ngoài). Ghim `packageManager: pnpm@9.15.9`, Node `>=22.12 <23`; script gốc gọi turbo: `dev`, `build`, `lint`, `lint:spec`, `generate`, `typecheck`, `test` |
| `turbo.json` | Đồ thị tác vụ: `build`/`typecheck`/`lint`/`test` chờ `^build` và `generate`; `dev` chờ `^build` rồi chạy song song 3 app; `agentGuidance: false` để turbo không tự ghi `AGENTS.md` ở gốc |
| `tsconfig.base.json`, `.nvmrc`, `.npmrc` | Cấu hình TypeScript chung (strict); Node 22; `save-exact` để `pnpm add` ghim đúng bản |
| `.github/workflows/ci.yml` | CI trên push/PR vào `develop`, `main`: cài (cache pnpm, `--frozen-lockfile`) → `lint:spec` → `generate` → `lint` → `typecheck` → `test` → `build` |
| `report/` | Toàn bộ báo cáo LaTeX — xem mục dưới |

## Mã nguồn — `apps/`, `packages/`

Cài và chạy từ gốc repo: `corepack enable` → `pnpm i` → `pnpm dev` (chạy cả 3 app). Chạy riêng một gói:
`pnpm --filter @farmery/<tên> <script>`. Mỗi app có `.env.example` (sao thành `.env` ở api, `.env.local` ở shop,
admin để đổi mặc định). Phiên bản và lý do chọn: `DECISIONS.md`, mục "Khung monorepo prototype"; cách giữ prototype
làm nền MVP: mục "Chuẩn bị prototype làm nền MVP".

| Thư mục | Gói | Vai trò | Cổng / lệnh |
|---|---|---|---|
| `apps/shop/` | `@farmery/shop` | Ứng dụng mua hàng (gồm khu nhà cung cấp): Next.js 16 App Router + Tailwind 4 + shadcn/ui (`components.json`, style base-nova). `src/app/` trang, `src/components/layout/` đầu/chân trang, `src/components/ui/` thành phần shadcn (`pnpm dlx shadcn@4.21.0 add <tên>`), `src/lib/api.ts` client gọi API (`NEXT_PUBLIC_API_URL`) | 3000 · `typecheck` chạy `next typegen` trước `tsc` |
| `apps/admin/` | `@farmery/admin` | Ứng dụng nội bộ: Vite + React + Refine 5 + Ant Design 5 (`@refinedev/antd`), cấu trúc theo mẫu Finefoods. `src/App.tsx` khai resource và route; `src/providers/` `authProvider`, `dataProvider` (stub, chờ nối API); `src/theme.ts` token antd; `src/pages/<resource>/` màn hình; `src/lib/api.ts` client (`VITE_API_URL`) | 5173 |
| `apps/api/` | `@farmery/api` | NestJS 11, mọi đường dẫn dưới `/api`. `src/core/` nền chung: cấu hình (`app-config.ts`: `PORT`, `CORS_ORIGINS`, `DEMO_MODE`, `JWT_SECRET`, `VALIDATE_RESPONSES`), kiểm dữ liệu vào/ra theo `openapi.yaml` (`openapi-validator.ts`), `AuthGuard` đọc `security`/`x-roles` từ hợp đồng, JWT (`token.service.ts`), lỗi RFC 9457 (`problem.ts`, `problem.filter.ts`), `Idempotency-Key`, `DemoResetRegistry`. `src/modules/` 13 mô-đun theo báo cáo, `catalog` là mẫu controller → service → repository (bản trong bộ nhớ). `src/integrations/` interface dịch vụ ngoài (`OtpSender`, `PaymentGateway`) kèm bản giả. `src/system/` `GET /api/health`, `POST /api/dev/reset` (204, chỉ khi `DEMO_MODE`). `app.setup.ts` dùng chung cho `main.ts` và test. Swagger ở `/docs` (JSON `/docs-json`). `test/` e2e jest + supertest | 4000 · `dev` = `nest start --watch` · `test` |
| `packages/contract/` | `@farmery/contract` | `openapi.yaml` — hợp đồng API (OpenAPI 3.1, 33 đường dẫn, 40 thao tác, `servers` có tiền tố `/api`), tên trường bám `report/schema.dbml`, vai trò ở `x-roles`. `lint:spec` (Redocly, cấu hình `redocly.yaml`; thiếu `summary` là lỗi); `generate` sinh `src/generated/schema.ts` (openapi-typescript, không commit); `build` (tsup, ESM + CJS). Export `paths`, `components`, `Schema<K>`, `OrderStatus`, `createApiClient` (openapi-fetch, gắn Bearer token) | sửa spec xong chạy `pnpm generate` |
| `packages/mock-data/` | `@farmery/mock-data` | Dữ liệu giả gõ theo `Schema<K>` của contract, theo vùng thí điểm Lâm Đồng (dâu tây Đà Lạt), không dùng thông tin người thật; `createSeed()` trả bản sao để repository nạp lại khi `/api/dev/reset` | — |

## `report/` — Báo cáo

Mọi đường dẫn từ đây trở xuống (`chapters/`, `backmatter/`, `tools/`…) tính từ `report/`.

| File | Vai trò |
|---|---|
| `main.tex` | File LaTeX chính, `\input` toàn bộ front/back matter + 8 chương theo đúng thứ tự |
| `schema.dbml` | Lược đồ CSDL, 13 schema / 65 bảng (`schema.table`); khóa ngoại chỉ trong cùng schema, tham chiếu xuyên schema ghi `→ schema.bảng` trong note cột (RB3). Nguồn sinh ERD và Phụ lục K (`tools/diagrams/gen_erd.py`); vẫn dán được vào dbdiagram |
| `references.bib` | Toàn bộ tài liệu tham khảo, dùng `biblatex` style `ieee` |
| `main.pdf` | Bản build gần nhất, 267 trang |
| `package.json` | Tooling: `npm run shot` (Playwright chụp HTML ở `tools/design/` → PNG ở `image/comparison/`); chạy `npm install` trong `report/`, không thuộc pnpm workspace của mã nguồn |
| `_archive-old-tex/` | File .tex gốc trước khi tái cấu trúc — chỉ lưu tham khảo trên máy, **không theo dõi trong git** (gitignore từ 13/10) |
| `prism-uploads/` | Bản thảo gốc nhóm tải lên ban đầu (`.docx`, `.md`) — chỉ lưu tham khảo trên máy, **không theo dõi trong git** (gitignore từ 13/10); `chapters/_incoming/` cũng vậy |

**Quy trình build** (chạy trong `report/`): `pdflatex` → **`biber`** (không phải `bibtex` — dự án dùng `biblatex` với `backend=biber`) →
`pdflatex` ×2. Không build trong lúc LaTeX Workshop của VS Code đang tự build: hai tiến trình ghi chồng làm
`main.aux` hỏng (log cụt, mọi tham chiếu undefined); gặp thì xoá `main.aux`, `.toc`, `.lof`, `.lot`, `.out`,
`.bcf`, `.run.xml` rồi build lại đủ bốn bước.

## `report/chapters/` — Nội dung chính (8 chương)

| File | Nội dung | Trạng thái |
|---|---|---|
| `chuong1-gioithieu.tex` | 1.1 Động cơ (bối cảnh, đặc thù nông sản, 4 vấn đề V1–V4) · 1.2 Mục tiêu (MT1–MT7, mục tiêu đánh giá) · 1.3 Phạm vi (không gian, thời gian, nội dung, **1.3.4 phạm vi hiện thực**, giới hạn kỹ thuật) · 1.4 Ý nghĩa · 1.5 Cấu trúc báo cáo | Xong (9 trang) |
| `chuong2-kienthuc-nentang.tex` | 2.1 Đặc điểm hàng nông sản · 2.2 Bối cảnh chính sách (**bảng văn bản → nghĩa vụ → tác động thiết kế** `tab:phaply`) · 2.3 Lý thuyết nền (B2B/B2C/B2B2C, 1P/3P) · 2.4 Ứng dụng AI (tìm kiếm ngữ nghĩa, sản phẩm tương tự, dự báo giá) | Xong (20 trang); còn TODO trích dẫn mục 2.1 |
| `chuong3-congtrinh-lienquan.tex` | 3.1 Nghiên cứu liên quan · 3.2 Nền tảng trong nước/quốc tế · 3.3 Vì sao các nền tảng hiện có chưa đi theo hướng này · 3.4 Kết chương | Xong (7 trang); còn TODO 3.1 |
| `chuong4-hethong-dexuat.tex` | 4.1 Ngữ cảnh nghiệp vụ (hai luồng 3P/1P, dòng thu và **điều kiện hòa vốn 1P**, 10 quy trình, dòng tồn, **giao hàng ba chặng**, **đổi trả–khiếu nại kèm cam kết thời gian**, chính sách pháp lý) · 4.2 Mô tả hệ thống (5 khối, **hai ứng dụng**, sơ đồ ngữ cảnh C4, nhóm người dùng + **6 vai trò nội bộ**, persona, customer journey) · 4.3 Yêu cầu (user story → FR1–FR13 có quy ước *(chỉ thiết kế)*, 5 mã đã rút; NFR1–NFR9; MoSCoW 11 Must + 2 Should) | Xong (46 trang) |
| `chuong5-phantich-thietke.tex` | 5.1 Phân tích: **sơ đồ hoạt động UML** (2 ở thân, 8 ở Phụ lục R) · use case (tổng quan + 5 chi tiết ở Phụ lục S; đặc tả UC-B4, UC-C4, **UC-C6** ở thân) · 5.2 Giải pháp công nghệ (2 ứng dụng, monorepo, NestJS, Prisma, PostgreSQL, dịch vụ bên thứ ba, AI) · 5.3 Thiết kế: kiến trúc C4 (container + **bảng I/O 7 container**, mô-đun + **bảng I/O 13 mô-đun**, **luồng một đơn lẻ**) · sitemap hai ứng dụng · **lược đồ tuần tự** (2 ở thân: đặt hàng, hợp đồng sỉ; 2 ở Phụ lục W) · **lược đồ lớp miền** (17 lớp, `fig:class-mien`) · CSDL 13 schema + **ERD hai hình** (`fig:erd`, `fig:erd2`) · AI (`tab:tinhnangAI`) · chính sách bên thứ ba | Xong phần thiết kế; API, UI/UX, test case còn TODO |
| `chuong6-hienthuc-kiemthu.tex` | Môi trường, triển khai, các module, kiểm thử | §6.1.1 danh sách công nghệ; còn lại TODO |
| `chuong7-danhgia.tex` | 7.1 Mục tiêu và phương pháp (6 trụ cột) · 7.2–7.5 · 7.6 Kết chương | Phương pháp, công cụ đã chốt; số liệu chờ đo thật |
| `chuong8-tongket.tex` | Kết quả · Hạn chế · Hướng phát triển (gồm các mã FR đã rút: TraceViet, ký số, khan hiếm, thuê kho, chào sỉ tồn dư, đội giao riêng) | Phần hạn chế và hướng phát triển xong |

## `report/backmatter/` — Phụ lục A–V

Phụ lục dài được tách thành file riêng để thân báo cáo không bị bảng chiếm chỗ. Phụ lục mới nối đuôi (U, V)
thay vì đánh lại chữ cái.

| File | Nội dung |
|---|---|
| `phuluc.tex` | Khung phụ lục A, C (còn TODO) và E (Business Model Canvas dạng bảng); `\input` các file bên dưới |
| `phuluc-khaosat.tex` | **Phụ lục B** — bộ công cụ đánh giá khả dụng |
| `phuluc-tos.tex` | **Phụ lục D — Điều khoản dịch vụ**, 17 điều, viết để đọc độc lập |
| `phuluc-bang.tex` | **Phụ lục F** ánh xạ vấn đề–mục tiêu · **G** đối chiếu nông sản với hàng hóa khác · **H** chứng nhận nông sản |
| `phuluc-congnghe.tex` | **Phụ lục I** — đối sánh 16 hạng mục công nghệ và 5 nhóm AI; cột nhận xét là nhận định của nhóm |
| `phuluc-yeucau.tex` | **Phụ lục J** — truy vết user story → yêu cầu, bảng FR theo nhóm người dùng |
| `phuluc-csdl.tex` | **Phụ lục K** — từ điển dữ liệu đủ 13 schema, mỗi schema một bảng `tab:db-<schema>` (~30 trang). **Sinh tự động** từ `schema.dbml` bằng `gen_erd.py`, không sửa tay |
| `phuluc-nguong.tex` | **Phụ lục L** — ngưỡng NFR và ngưỡng AI kèm căn cứ |
| `phuluc-matran.tex` | **Phụ lục M** — ma trận Priority/Feasibility/Testability cho FR và NFR |
| `phuluc-xuatkhau.tex` | **Phụ lục N** khoảng cách với thị trường xuất khẩu · **O** nguồn dữ liệu nông sản cho AI |
| `phuluc-chitiet.tex` | **P** số liệu OCOP · **Q** hành trình khách hàng và 13 nguồn giao dịch kho · **R** 8 sơ đồ hoạt động · **S** 5 sơ đồ use case chi tiết, đặc tả UC-B2, UC-B5, UC-D4, UC-C7 · **T** sitemap cấp 3 theo hai ứng dụng kèm mã FR |
| `phuluc-chinhsach.tex` | **Phụ lục U** — bộ 10 chính sách (`tab:bochinhsach`) và toàn văn U.1 kiểm hàng, U.2 đổi trả–hoàn tiền, U.3 bảo mật |
| `phuluc-sukien.tex` | **Phụ lục V** — danh mục 17 sự kiện nghiệp vụ (phát bởi, nhận bởi, tác dụng) |
| `phuluc-tuantu.tex` | **Phụ lục W** — lược đồ tuần tự đăng lô–duyệt–QR (`fig:seq-duyet-lo`) và đánh giá (`fig:seq-danh-gia`) |
| `kehoach.tex` | Kế hoạch hai giai đoạn (giữa kỳ 15/10/2026, cuối kỳ 31/12/2026) kèm rủi ro tiến độ; tuần 4 (16–22/10) là prototype, tuần 5 thay lớp lưu trữ bằng Prisma |
| `tailieuthamkhao.tex` | `\printbibliography` |

## `report/frontmatter/` — Phần mở đầu

| File | Trạng thái |
|---|---|
| `biaphu.tex` | Xong |
| `loicamon.tex` | TODO — trống |
| `tomtat.tex` | TODO — trống (VN + Abstract) |
| `danhmuc-tuvietat.tex` | Xong |
| `phieunhiemvu.tex` | Không còn được `\input` từ `main.tex`; giữ phòng khi dùng lại |

## `report/tools/` — Sinh hình

| File | Vai trò |
|---|---|
| `render-comparison-tables.js` | Script Playwright chụp HTML ở `design/` thành PNG ở `image/comparison/`; viewport khớp cả rộng lẫn cao nội dung |
| `diagrams/svgkit.py` | Bộ dựng SVG dùng chung: hộp (in `OVERFLOW` khi chữ tràn hộp), mũi tên một/hai chiều, nhãn đặt trên đường |
| `diagrams/gen_c4.py` | Sinh `c4-ngu-canh`, `c4-container`, `c4-module`, `luong-don-le` (luồng một đơn lẻ) |
| `diagrams/gen_usecase.py` | Sinh 6 sơ đồ use case: `usecase-overview`, `usecase-nha-ban`, `usecase-nguoi-mua-le`, `usecase-nguoi-mua-si`, `usecase-noibo-nguonhang`, `usecase-noibo-vanhanh` |
| `diagrams/gen_sitemap.py` | Sinh `sitemap-tong-quan` (hai cây theo hai ứng dụng) |
| `diagrams/gen_sequence.py` | Sinh 4 lược đồ tuần tự `seq-*` (lớp `Seq`: lane theo mô-đun, gọi / trả về / sự kiện, khung `alt`/`loop` lồng được) |
| `diagrams/gen_class.py` | Sinh `class-mien` (17 lớp miền, vị trí đặt tay theo lưới, bội số hai đầu, hợp thành, tham chiếu xuyên mô-đun nét đứt) |
| `diagrams/gen_erd.py` | Đọc `schema.dbml`, sinh `erd-nen-tang`, `erd-giao-dich` (vị trí bảng đặt tay theo lưới; đường xuyên schema chỉ vẽ theo danh sách `X1`, `X2`) và ghi đè `backmatter/phuluc-csdl.tex` |
| `diagrams/gen_activity.py` | Sinh 10 sơ đồ hoạt động `act-*` (lớp `Act`: swimlane tô màu theo loại tác nhân, nút đặt theo (lane, hàng), cạnh vuông góc, nhãn điều kiện có nền) |
| `design/*.html` | HTML sinh từ `diagrams/` (**không sửa tay**) và các infographic viết tay: `thuc-trang-chuoi-cung-ung`, `ocop-2024-2025`, `bmc-cum1`–`3` |

Quy trình sửa hình (chạy trong `report/`): sửa bộ sinh → `python tools/diagrams/gen_c4.py` (hoặc `gen_usecase.py`, `gen_sitemap.py`,
`gen_activity.py`, `gen_sequence.py`, `gen_class.py`, `gen_erd.py`) → `npm run shot` → build lại PDF. Không sửa trực tiếp PNG.

**Cỡ chữ trong hình:** ảnh luôn bị ép về `\textwidth` = 16 cm và bị chặn chiều cao bởi `adjustbox`.
- HTML (bề rộng thân 1420px): cỡ chữ in ra (pt) = `font_px × 16 / 1420 × 28,45`; tối thiểu 22px ≈ 7pt.
- Hình cao gần trọn trang: đặt `[p]`, chặn `\textheight−1,6cm` (khoảng 21,1 cm); vượt mức này ảnh bị thu nhỏ và
  chữ xuống dưới 7pt.

## Nhãn (`\label`) quan trọng

**Chương:** `chap:gioithieu`, `chap:coso`, `chap:lienquan`, `chap:hethong`, `chap:phantich`, `chap:hienthuc`,
`chap:danhgia`, `chap:ketluan`, `chap:kehoach`, `chap:references`.

**Mục:** `sec:dongco`, `sec:vande`, `sec:muctieu`, `sec:muctieudanhgia`, `sec:phamvi`, `sec:ynghia`;
`sec:dacdiemnongsan`, `subsec:dinhnghianongsan`, `subsec:sosanhnongsan`, `subsec:chungnhan`, `sec:boicanhchinhsach`,
`subsec:reputation`, `subsec:gs1blockchain`, `subsec:businessmodel`, `subsec:khobai`; `sec:visaochualam`,
`subsec:researchgap`; `sec:ngucanh`, `sec:businessmodelcanvas`, `sec:quytrinhnghiepvu`, `subsec:danhgianghiepvu`,
`subsec:chinhsach`, `sec:motahethong`, `sec:luongvanhanh`, `sec:doituongnguoidung`, `sec:luongtiepcan`, `sec:yeucau`,
`sec:yeucauchucnang`, `sec:yeucauphichucnang`; `subsec:mohinhquytrinh`, `sec:sddchitiet`, `sec:giaiphapcongnghe`,
`sec:kientruc`, `sec:sitemap`, `subsec:tuantu`, `sec:csdl`, `subsec:dacta-csdl`, `subsec:erd`, `sec:thietkeAI`,
`subsec:nguongAI`, `subsec:chinhsachbenthuba`; `sec:muctieuphuongphap`, `sec:danhgiaux`, `sec:danhgiahieunang`,
`sec:danhgiaAI`. Phụ lục: `apdx:luudo` (R, nay là sơ đồ hoạt động), `apdx:usecase`, `apdx:sitemap`, `apdx:chinhsach`,
`apdx:sukien`.

**Hình ở thân báo cáo:** `fig:thuctrang` (Ch.1); `fig:bmc-cum1`–`3`, `fig:c4-ngucanh` (Ch.4); `fig:act-thu-mua`,
`fig:act-dat-hang`, `fig:usecase-overview`, `fig:c4-container`,
`fig:c4-module`, `fig:luong-don-le`, `fig:sitemap`, `fig:seq-dat-hang`, `fig:seq-hop-dong-si`, `fig:class-mien`, `fig:erd`, `fig:erd2` (Ch.5); `fig:seq-duyet-lo`, `fig:seq-danh-gia` (Phụ lục W).
**Hình ở phụ lục:** `fig:ocop` (P); `fig:act-giao-hang`, `fig:act-doi-tra`, `fig:act-dang-ky-ncc`, `fig:act-dang-san-pham`, `fig:act-ban-si`,
`fig:act-danh-gia`, `fig:act-thu-hoi`, `fig:act-vi-pham` (R); `fig:usecase-nhaban`, `fig:usecase-khachle`,
`fig:usecase-khachsi`, `fig:usecase-noibo-nguonhang`, `fig:usecase-noibo-vanhanh` (S).

**Bảng ở thân báo cáo:** `tab:phaply` (Ch.2); `tab:sosanhtrongnuoc`, `tab:sosanhquocte`, `tab:researchgap` (Ch.3);
`tab:hailuong`, `tab:nhomnguoidung`, `tab:vaitro-noibo` (Ch.4); `tab:actor-usecase`, `tab:uc-b4`, `tab:uc-c4`,
`tab:uc-c6`, `tab:container-io`, `tab:module-io`, `tab:tinhnangAI` (Ch.5).
**Bảng ở phụ lục:** `tab:kichban-khaosat`, `tab:phieu-quansat` (B); `tab:bmc-full` (E); `tab:vande-muctieu` (F);
`tab:dacdiem-hanghoa` (G); `tab:chungnhan` (H); `tab:sosanh-congnghe`, `tab:sosanh-ai` (I); `tab:truyvet-us`,
`tab:fr-nguoidung` (J); `tab:db-nhom1`–`4` (K); `tab:nguongNFR`, `tab:nguongAI` (L); `tab:fr-matrix`, `tab:nfr-matrix`
(M); `tab:khoangcachxuatkhau`, `tab:nguondulieu` (N, O); `tab:customer-journey`, `tab:nguon-giaodich` (Q);
`tab:uc-b2`, `tab:uc-b5`, `tab:uc-d4`, `tab:uc-c7` (S); `tab:sitemap-chitiet` (T); `tab:bochinhsach` (U);
`tab:sukien` (V); `tab:kehoach`.

**Quy ước bảng:** macro `\tblsetup` (cỡ `\small`, giãn dòng 1,25, khoảng cách cột 5pt) và `\tblzebra` (tô xen kẽ
tự động) định nghĩa trong `main.tex`. Tổng bề rộng cột ≤ 16 cm − số cột × 0,353 cm.

## Hai điểm dễ vấp khi sửa

1. **Phụ lục dùng `\section*` nên không đánh số tự động** — trong thân báo cáo phải viết thẳng "Phụ lục G",
   không dùng `\ref`.
2. **Hình và bảng ở phần sau Chương 8 có tiền tố riêng** — `KH.` cho Kế hoạch thực hiện, `PL.` cho Phụ lục, đặt
   trong `main.tex` ngay trước phần kết thúc. Nếu bỏ đoạn `\setcounter` và `\renewcommand` đó, bảng phụ lục sẽ bị
   đánh số nối tiếp Chương 8 — lỗi đã từng xảy ra.
