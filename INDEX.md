# INDEX.md — Chỉ mục file/thư mục

Cập nhật lần cuối: 2026-11-23 (tinh giản báo cáo: thân Ch.1–8 từ 149 xuống khoảng 78 trang, tổng 290 xuống 160 trang,
phụ lục từ A–W xuống A–G). Trước đó: 2026-11-05 (thư mục `design/`; khu nhà cung cấp chia tab Tổng quan · Lô hàng · Sản phẩm · Hồ sơ;
tìm kiếm có gợi ý, mua sỉ, chứng nhận của nhà cung cấp; mô-đun `wholesale` của API).
Trước đó: 2026-10-21 (khu nhà cung cấp trong shop; endpoint `/seller/*`, `identity`, `operations` của API).
Trước đó: 2026-10-13 (chuẩn bị prototype làm nền MVP: tiền tố `/api`, nền `apps/api` kiểm hợp đồng,
13 mô-đun, test e2e; `MVP.md` mục 6; kế hoạch có tuần prototype). Cùng ngày: dựng khung monorepo prototype
(`apps/shop`, `apps/admin`, `apps/api`, `packages/contract`, `packages/mock-data`, CI); tách báo cáo LaTeX vào `report/`; lược đồ CSDL 13 schema,
ERD và từ điển dữ liệu (nay là Phụ lục D) sinh từ `schema.dbml`. Trước đó: 2026-10-08 (phiên siết phạm vi theo trục bán lẻ
đầu–cuối: hai ứng dụng, sáu vai trò nội bộ, 13 mô-đun, Phụ lục U–V, vẽ lại C4, use case, sơ đồ hoạt động UML,
sitemap; thân báo cáo 125 trang).

## Gốc dự án

Gốc repo chứa tài liệu dự án dùng chung cho cả báo cáo lẫn mã nguồn; báo cáo nằm trọn trong `report/`; mã nguồn
(monorepo pnpm + Turborepo: `apps/`, `packages/`) đặt thẳng ở gốc — xem mục "Mã nguồn" bên dưới.

| File | Vai trò |
|---|---|
| `README.md` | Giới thiệu, bố cục repo, phạm vi (hiện thực / chỉ thiết kế theo nhóm FR, AI, NFR, hướng phát triển), hiện trạng mã nguồn theo mô-đun, cách chạy, quy trình git |
| `DECISIONS.md` | Log quyết định kỹ thuật/nội dung đã chốt (append-only) |
| `MVP.md` | Phạm vi MVP chi tiết theo mã FR/NFR; báo cáo ghi phạm vi hiện thực ở mục 1.3.4 và đánh dấu *(chỉ thiết kế)* trong từng FR — ba chỗ phải khớp nhau. Mục 6: phần giả lập ở prototype và bản thật ở MVP, bốn điều kiện rà ở mốc 21/10 |
| `NOTES.md` | Việc đang mở, chưa chốt |
| `design/` | Tài liệu thiết kế giao diện (doc sống): `README.md` quy trình 7 bước; `01` người dùng và hành trình, `02` kiến trúc thông tin và sitemap, `03` luồng tác vụ, `04` hệ thống thiết kế (token, component), `05` đặc tả màn hình, `06` nội dung và **bảng thuật ngữ chuẩn**, `07` quy ước FE, `08` rà soát hiện trạng (điểm lệch, trạng thái xử lý); `thiet-ke-fe.html` bản gộp để chia sẻ (sinh bằng `python scripts/design-html.py`) |
| `INDEX.md` | File này |
| `.gitignore` | `node_modules/`, artifact build LaTeX, `*-PLAN.md`/`.html` (file kế hoạch tạm), `slide-pack/`, `review/`; build của monorepo (`.turbo/`, `dist/`, `.next/`, kiểu sinh trong `packages/contract/src/generated/`, client Prisma `apps/api/src/generated/`, `coverage/`) |
| `docker-compose.yml` | PostgreSQL 17 + pgvector cho `STORAGE=prisma` (`pnpm db:up`; cổng `PG_PORT`, mặc định 5433, tránh PostgreSQL cài sẵn trên máy ở 5432; nạp sẵn `pg_stat_statements`) |
| `.gitattributes` | `* text=auto eol=lf` — mọi file văn bản lưu LF kể cả trên Windows |
| `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml` | Gốc workspace pnpm (`apps/*`, `packages/*`; `report/` đứng ngoài). Ghim `packageManager: pnpm@9.15.9`, Node `>=22.12 <23`; script gốc gọi turbo: `dev`, `build`, `lint`, `lint:spec`, `generate`, `typecheck`, `test`; `db:up`, `db:down`, `db:migrate`, `db:seed` (PostgreSQL cục bộ); `e2e` build contract + mock-data rồi chạy Playwright của `apps/e2e` |
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
| `apps/shop/` | `@farmery/shop` | Ứng dụng mua hàng (gồm khu nhà cung cấp): Next.js 16 App Router + Tailwind 4 + shadcn/ui (`components.json`, style base-nova). `src/app/` trang: `(cua-hang)/` các trang dùng chung đầu/chân trang: công khai (trang chủ, `danh-muc/[slug]`, `san-pham/[slug]`, `tim-kiem`; đường dẫn dạng `ten-<id>`) và luồng khách lẻ (`dang-nhap` OTP qua email, `gio-hang`, `thanh-toan`, `don-hang/[ma]` trả tiền giả lập có đếm ngược giữ chỗ), `nha-cung-cap/` khu nhà cung cấp (tab Tổng quan có việc cần làm, `lo-hang/` danh sách, `tao-moi`, chi tiết lô kèm nhật ký; `san-pham/` sản phẩm của tôi, `tao-moi` đăng sản phẩm có nhập chứng nhận tại chỗ; `ho-so/` hồ sơ và chứng nhận; `bao-gia/` yêu cầu báo giá sỉ; `seller-nav-tabs.tsx` tab + nút hành động; `certification-form.tsx` form chứng nhận dùng chung), `truy-xuat/[ma]/` trang truy xuất theo `traceCode` có layout gọn; `src/components/farmery/` component theo gói thiết kế (token trong `src/app/globals.css`), `src/components/ui/` thành phần shadcn (`pnpm dlx shadcn@4.21.0 add <tên>`); `src/lib/data/` lớp dữ liệu phía máy chủ cho Server Components (gọi API, 404 → null, lỗi → `error.tsx`), `src/lib/data/actions.ts` Server Action "Xem thêm"; `src/lib/data/account.ts` lớp dữ liệu cần đăng nhập (`requireViewer`, giỏ, địa chỉ, báo giá, đơn) và `auth-`, `cart-`, `order-actions.ts` Server Action ghi; `src/lib/session.ts` cookie phiên httpOnly; `src/proxy.ts` chặn nhanh `/gio-hang`, `/thanh-toan`, `/don-hang/*` khi chưa có cookie; `src/lib/problem.ts` mã lỗi `Problem.code` → câu báo tiếng Việt; `src/lib/filters.ts` bộ lọc trên URL, `src/lib/decision.ts` thông tin hỗ trợ quyết định (độ tươi, giá quy đổi theo kg, hiệu lực chứng nhận, bậc giá sỉ), `src/lib/data/wholesale-actions.ts` gửi yêu cầu báo giá, `src/lib/api.ts` client gọi API từ trình duyệt (`NEXT_PUBLIC_API_URL`), `src/lib/image-hosts.ts` host ảnh ngoài được phép (dùng chung với `next.config.ts`) | 3000 · `typecheck` chạy `next typegen` trước `tsc` |
| `apps/admin/` | `@farmery/admin` | Ứng dụng nội bộ: Vite + React + Refine 5 + Ant Design 5 (`@refinedev/antd`), cấu trúc theo mẫu Finefoods. `src/App.tsx` khai resource và route; `src/providers/` `authProvider` (OTP), `dataProvider` (ánh xạ resource → thao tác hợp đồng, phân trang cursor), `accessControlProvider` (menu theo `meta.roles` chép từ `x-roles`); `src/theme.ts` token antd; `src/pages/<resource>/` màn hình: `dashboard` (Tổng quan, khối Kiểm duyệt cho `staff_moderation`), `review-tasks` (`/kiem-duyet`, chi tiết theo bốn loại việc duyệt), `orders` (`/van-hanh`), `inventory` (`/kho`, tồn theo lô + sổ nhập xuất), `settings` (`/cau-hinh`, chỉ `platform_owner` sửa); `src/lib/labels.ts` nhãn tiếng Việt cho enum hợp đồng; `src/lib/api.ts` client (`VITE_API_URL`) | 5173 |
| `apps/api/` | `@farmery/api` | NestJS 11, mọi đường dẫn dưới `/api`. `prisma/` (`schema/` 13 file `.prisma` + `base.prisma`, `migrations/`, `seed.ts`), `prisma.config.ts`; `src/core/prisma.ts` + `storage.ts` chọn kho theo `STORAGE=memory|prisma`; `src/core/events/` bus sự kiện trong tiến trình (`events.ts` kiểu 17 sự kiện Phụ lục V, `event-bus.ts` cổng `EventBus`, `on-domain-event.ts` decorator bên nhận chống lặp), bên nhận mẫu `modules/inventory/inventory-events.ts`. `src/core/` nền chung: cấu hình (`app-config.ts`: `PORT`, `CORS_ORIGINS`, `DEMO_MODE`, `JWT_SECRET`, `VALIDATE_RESPONSES`, `STORAGE`, `DATABASE_URL`), kiểm dữ liệu vào/ra theo `openapi.yaml` (`openapi-validator.ts`), `AuthGuard` đọc `security`/`x-roles` từ hợp đồng, JWT (`token.service.ts`), lỗi RFC 9457 (`problem.ts`, `problem.filter.ts`), `Idempotency-Key`, `DemoResetRegistry`. `src/modules/` 13 mô-đun theo báo cáo, `catalog` là mẫu controller → service → repository (bản trong bộ nhớ). `catalog/search/`: hai bộ tìm `KeywordSearch` (khớp theo từ, theo dấu) và `SemanticSearch` (`VectorSemanticSearch` khi có dịch vụ AI: chỉ mục vector `product-embedding-index.ts`, ngưỡng ở `vector-config.ts`; không thì `ConceptSemanticSearch` từ điển khái niệm), gộp bằng RRF (`fusion.ts`), dùng chung `text-match.ts` và `search-corpus.ts`; sản phẩm tương tự lấy láng giềng vector ở `CatalogService`; hiểu câu tìm cho `GET /search/suggest`; bộ đánh giá ở `test/search-eval/` (nDCG@10, bộ chính, độc lập, mở rộng), `test/similar-eval/` (Precision@5), đo với BGE-M3 thật ở `test/ai-eval.e2e-spec.ts` (chỉ chạy khi có `AI_SERVICE_URL`); `supplier` giữ chứng nhận kèm trạng thái duyệt; `wholesale` yêu cầu báo giá sỉ. `src/integrations/` interface dịch vụ ngoài (`OtpSender`, `PaymentGateway`, `EmbeddingProvider` gọi `apps/ai`) kèm bản giả. `src/system/` `GET /api/health`, `POST /api/dev/reset` (204, chỉ khi `DEMO_MODE`). `app.setup.ts` dùng chung cho `main.ts` và test. Swagger ở `/docs` (JSON `/docs-json`). `test/` e2e jest + supertest. `README.md`: khuôn viết endpoint, quy tắc, mã lỗi khung tự trả | 4000 · `dev` = `nest start --watch` · `test` |
| `apps/e2e/` | `@farmery/e2e` | Test e2e trên trình duyệt (Playwright, Chromium). `playwright.config.ts` ba project: `shop`, `admin` (mỗi project một `baseURL`) và `kich-ban` (kịch bản xuyên hai app, dùng `SHOP_URL`/`ADMIN_URL` export từ config), `webServer` tự bật api + shop + admin ở cổng mặc định hoặc dùng lại server đang chạy (trừ khi `CI`), chạy tuần tự một worker; `tests/global-setup.ts` gọi `POST /api/dev/reset`; `tests/shop/`, `tests/admin/` spec đăng nhập OTP; `tests/kich-ban/` kịch bản nhiều vai (mỗi vai một browser context): đăng lô + nhật ký → duyệt → truy xuất, và từ chối lô; `tests/helpers.ts` hàm đăng nhập shop/admin. Kết quả ở `test-results/`, `playwright-report/` (gitignore) | `pnpm e2e` ở gốc · `e2e:ui`, `e2e:report` · không thuộc `pnpm test` |
| `packages/contract/` | `@farmery/contract` | `openapi.yaml` — hợp đồng API (OpenAPI 3.1, 37 đường dẫn, 45 thao tác, `servers` có tiền tố `/api`), tên trường bám `report/schema.dbml`, vai trò ở `x-roles`. `lint:spec` (Redocly, cấu hình `redocly.yaml`; thiếu `summary` là lỗi); `generate` sinh `src/generated/schema.ts` (openapi-typescript, không commit); `build` (tsup, ESM + CJS). Export `paths`, `components`, `Schema<K>`, `OrderStatus`, `createApiClient` (openapi-fetch, gắn Bearer token) | sửa spec xong chạy `pnpm generate` |
| `packages/mock-data/` | `@farmery/mock-data` | Dữ liệu giả gõ theo `Schema<K>` của contract, theo vùng thí điểm Lâm Đồng (dâu tây Đà Lạt), không dùng thông tin người thật; `createSeed()` trả bản sao để repository nạp lại khi `/api/dev/reset`; `createSeed()` dời ngày lô, nhật ký theo ngày chạy (mốc `SEED_ANCHOR_DATE`); `extra.ts` sản phẩm, lô, bảng giá sỉ, ảnh danh mục bổ sung 05/11 | — |

## `report/` — Báo cáo

Mọi đường dẫn từ đây trở xuống (`chapters/`, `backmatter/`, `tools/`…) tính từ `report/`.

| File | Vai trò |
|---|---|
| `main.tex` | File LaTeX chính, `\input` toàn bộ front/back matter + 8 chương theo đúng thứ tự |
| `schema.dbml` | Lược đồ CSDL, 13 schema / 65 bảng (`schema.table`); khóa ngoại chỉ trong cùng schema, tham chiếu xuyên schema ghi `→ schema.bảng` trong note cột (RB3). Nguồn sinh ERD và Phụ lục D (`tools/diagrams/gen_erd.py`); vẫn dán được vào dbdiagram |
| `references.bib` | Toàn bộ tài liệu tham khảo, dùng `biblatex` style `ieee` |
| `main.pdf` | Bản build gần nhất, 160 trang (thân Ch.1–8 khoảng 78 trang) |
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
| `chuong1-gioithieu.tex` | 1.1 Động cơ (bối cảnh, 4 vấn đề V1–V4) · 1.2 Mục tiêu (MT1–MT7, mục tiêu đánh giá) · 1.3 Phạm vi (không gian, thời gian, nội dung, mức hiện thực, giới hạn kỹ thuật) · 1.4 Ý nghĩa · 1.5 Cấu trúc báo cáo | Xong (5 trang) |
| `chuong2-kienthuc-nentang.tex` | 2.1 Đặc điểm hàng nông sản (phạm vi, khác biệt, chứng nhận, vì sao xuất khẩu ngoài phạm vi) · 2.2 Bối cảnh chính sách (**bảng pháp lý** `tab:phaply`) · 2.3 Lý thuyết nền (hai trục TMĐT và SFSC, GS1/blockchain/TraceViet, uy tín, công nghệ–doanh thu–kho 3PL) · 2.4 Ứng dụng AI (gồm nguồn dữ liệu giá) | Xong (8 trang) |
| `chuong3-congtrinh-lienquan.tex` | 3.1 Nghiên cứu liên quan · 3.2 Nền tảng trong nước/quốc tế (một bảng so sánh, bảng quốc tế gộp thành đoạn) · 3.3 Vì sao các nền tảng hiện có chưa đi theo hướng này · 3.4 Khoảng trống nghiên cứu (`tab:researchgap`) | Xong (5 trang); còn TODO 3.1 |
| `chuong4-hethong-dexuat.tex` | 4.1 Ngữ cảnh nghiệp vụ (hai luồng, **BMC dạng bảng `tab:bmc`**, điều kiện hòa vốn 1P, 10 quy trình dạng gạch đầu dòng, bảng `tab:chi-thiet-ke`, chính sách) · 4.2 Mô tả hệ thống (5 khối, hai ứng dụng, sơ đồ ngữ cảnh C4, nhóm người dùng + 6 vai trò, 4 persona dạng bảng) · 4.3 Yêu cầu (FR1–FR13 và NFR1–NFR9 dạng bảng `tab:fr`, `tab:nfr`; yêu cầu dữ liệu) | Xong (24 trang) |
| `chuong5-phantich-thietke.tex` | 5.1 Phân tích: 2 sơ đồ hoạt động UML (thu mua, đặt hàng) · use case tổng quan · đặc tả UC-B4, UC-C4, UC-C6 · 5.2 Giải pháp công nghệ (một bảng `tab:congnghe` + đoạn AI) · 5.3 Thiết kế: kiến trúc C4 (container, 13 mô-đun, bảng I/O) · sitemap · lược đồ tuần tự (đặt hàng, hợp đồng sỉ) · lược đồ lớp miền · CSDL (chỉ ERD tổng quan; 10 ERD theo miền ở Phụ lục D) · mô-đun AI · chính sách bên thứ ba | Xong (23 trang) |
| `chuong6-hienthuc-kiemthu.tex` | 6.1 Hiện thực (môi trường, triển khai, các mô-đun, giải thuật) · 6.2 Giao diện, API và kiểm thử (TODO: thiết kế API, UI/UX, test case, kết quả — chuyển từ 5.3.7–5.3.9 cũ) | §6.1 đã có nội dung các mô-đun; §6.2 còn TODO |
| `chuong7-danhgia.tex` | 7.1 Mục tiêu và phương pháp (6 trụ cột) · 7.2 Chức năng · 7.3 Back-end · 7.4 Front-end · 7.5 Mô-đun AI (không còn Kết chương) | Phương pháp, công cụ đã chốt; số liệu chờ đo thật |
| `chuong8-tongket.tex` | Kết quả · Hạn chế · Hướng phát triển (gồm các mã FR đã rút: TraceViet, ký số, khan hiếm, thuê kho, chào sỉ tồn dư, đội giao riêng) | Phần hạn chế và hướng phát triển xong |

## `report/backmatter/` — Phụ lục A–G

Phụ lục đã được tinh giản từ 21 mục (A–W) xuống 7 mục để thân báo cáo ngắn lại; chữ cái đánh lại liên tục. Mỗi
phụ lục dùng `\section*` nên trong thân phải viết thẳng "Phụ lục B", không dùng `\ref`.

| File | Nội dung |
|---|---|
| `phuluc.tex` | Khung phụ lục; `\input` các file bên dưới theo thứ tự A–F |
| `phuluc-khaosat.tex` | **Phụ lục A** — bộ công cụ đánh giá khả dụng (A.1–A.6) |
| `phuluc-tos.tex`, `phuluc-chinhsach.tex` | **Phụ lục B** — B.1 Điều khoản dịch vụ (17 điều, viết để đọc độc lập) · B.2 bộ chính sách (`tab:bochinhsach`) |
| `phuluc-yeucau.tex` | **Phụ lục C** — truy vết user story → yêu cầu, bảng FR theo nhóm người dùng |
| `phuluc-csdl.tex`, `phuluc-erd.tex` | **Phụ lục D** — bảng mô tả 65 bảng theo 13 schema `tab:db-<schema>` (mục đích, số cột, khóa; **sinh tự động** từ `schema.dbml` bằng `gen_erd.py`, không sửa tay; đủ từng cột nằm trong `schema.dbml`) và 10 ERD theo miền (viết tay, `fig:erd-*`) |
| `phuluc-nguong.tex`, `phuluc-matran.tex` | **Phụ lục E** — E.1 ngưỡng NFR và AI kèm căn cứ (`tab:nguongNFR`, `tab:nguongAI`) · E.2 ma trận Priority/Feasibility/Testability |
| `phuluc-sukien.tex` | **Phụ lục G** — danh mục 17 sự kiện nghiệp vụ (bên phát, bên nhận, tác dụng). `apps/api/test/events.e2e-spec.ts` đọc file này để kiểm tên sự kiện trong mã khớp báo cáo: đổi tên hay thứ tự sự kiện phải sửa cả hai |
| `phuluc-congnghe.tex` | **Phụ lục F** — đối sánh các hướng tiếp cận cho 5 nhóm AI (`tab:sosanh-ai`); bảng công nghệ nền đã gộp vào `tab:congnghe` ở Ch.5 |
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
| `diagrams/gen_erd.py` | Đọc `schema.dbml`, sinh 11 hình ERD `erd-tong-quan` … `erd-danh-gia-van-hanh` (một hình tổng quan 13 schema và 10 hình theo nhóm schema; vị trí bảng đặt tay theo lưới; đường xuyên schema chỉ vẽ theo danh sách `X1`, `X2`) và ghi đè `backmatter/phuluc-csdl.tex` |
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
`sec:danhgiaAI`. Phụ lục: `apdx:tos`, `apdx:chinhsach`, `apdx:nguong`, `apdx:matran`, `apdx:congnghe`, `apdx:khaosat`, `apdx:yeucau`.

**Hình ở thân báo cáo:** `fig:thuctrang` (Ch.1); `fig:c4-ngucanh` (Ch.4); `fig:act-thu-mua`, `fig:act-dat-hang`,
`fig:usecase-overview`, `fig:c4-container`, `fig:c4-module`, `fig:sitemap`, `fig:seq-dat-hang`, `fig:seq-hop-dong-si`,
`fig:class-mien`, `fig:erd-tong-quan`, `fig:ai-luong` (Ch.5; sinh bởi `gen_aiflow.py`). **Hình ở Phụ lục D:** 10 hình ERD theo miền `fig:erd-dinh-danh`,
`fig:erd-thong-bao-tep`, `fig:erd-nha-cung-cap-ton-kho`, `fig:erd-danh-muc`, `fig:erd-ban-le`, `fig:erd-thu-mua`,
`fig:erd-thanh-toan`, `fig:erd-ban-si`, `fig:erd-giao-hang-doi-tra`, `fig:erd-danh-gia-van-hanh`.
Ảnh và HTML của các hình đã loại cùng phụ lục cũ (`bmc-cum1`–`3`, 8 sơ đồ `act-*`, 5 `usecase-*` chi tiết, `luong-don-le`, `ocop-2024-2025`,
`seq-duyet-lo`, `seq-danh-gia`) đã xóa ngày 2026-11-23; `gen_activity.py`, `gen_usecase.py`, `gen_sequence.py` vẫn sinh lại HTML của chúng nếu chạy.

**Bảng ở thân báo cáo:** `tab:phaply` (Ch.2); `tab:sosanhtrongnuoc`, `tab:researchgap` (Ch.3); `tab:hailuong`, `tab:bmc`,
`tab:chi-thiet-ke`, `tab:nhomnguoidung`, `tab:vaitro-noibo`, `tab:personas`, `tab:fr`, `tab:nfr` (Ch.4; hai nhãn trạng thái
*đã hiện thực* và *chỉ thiết kế* định nghĩa cuối mục 4.1.2); `tab:uc-b4`, `tab:uc-c4`, `tab:uc-c6`, `tab:congnghe`,
`tab:container-io`, `tab:module-io`, `tab:tinhnangAI` (Ch.5).
**Bảng ở phụ lục:** `tab:kichban-khaosat`, `tab:phieu-quansat` (A); `tab:bochinhsach` (B); `tab:truyvet-us`, `tab:fr-nguoidung` (C);
`tab:db-<schema>` ×13 (D); `tab:nguongNFR`, `tab:nguongAI`, `tab:fr-matrix`, `tab:nfr-matrix` (E); `tab:sosanh-ai` (F); `tab:kehoach`.

**Quy ước bảng:** macro `\tblsetup` (cỡ `\small`, giãn dòng 1,25, khoảng cách cột 5pt) và `\tblzebra` (tô xen kẽ
tự động) định nghĩa trong `main.tex`. Tổng bề rộng cột ≤ 16 cm − số cột × 0,353 cm.

## Hai điểm dễ vấp khi sửa

1. **Phụ lục dùng `\section*` nên không đánh số tự động** — trong thân báo cáo phải viết thẳng "Phụ lục B",
   không dùng `\ref`.
2. **Hình và bảng ở phần sau Chương 8 có tiền tố riêng** — `KH.` cho Kế hoạch thực hiện, `PL.` cho Phụ lục, đặt
   trong `main.tex` ngay trước phần kết thúc. Nếu bỏ đoạn `\setcounter` và `\renewcommand` đó, bảng phụ lục sẽ bị
   đánh số nối tiếp Chương 8 — lỗi đã từng xảy ra.
