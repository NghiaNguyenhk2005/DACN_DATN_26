# INDEX.md — Chỉ mục file/thư mục

Cập nhật lần cuối: 2026-10-08 (phiên siết phạm vi theo trục bán lẻ đầu–cuối: hai ứng dụng, sáu vai trò nội bộ,
13 mô-đun, Phụ lục U–V, vẽ lại C4, use case, sơ đồ hoạt động UML, sitemap; thân báo cáo 127 trang). Trước đó:
2026-10-01 (sơ đồ C4, sitemap, quy ước bảng, Phụ lục P–T, MVP.md; thân 108 trang).

## Gốc dự án

| File | Vai trò |
|---|---|
| `main.tex` | File LaTeX chính, `\input` toàn bộ front/back matter + 8 chương theo đúng thứ tự |
| `schema.dbml` | Lược đồ CSDL (dbdiagram); nguồn của ERD và Phụ lục K. **Đang lệch báo cáo** (commit `65936c6` đưa về mô hình cũ, chờ thành viên — xem NOTES "Sơ đồ còn thiếu") |
| `references.bib` | Toàn bộ tài liệu tham khảo, dùng `biblatex` style `ieee` |
| `main.pdf` | Bản build gần nhất, 236 trang (thân báo cáo Chương 1–8 chiếm 127 trang) |
| `DECISIONS.md` | Log quyết định kỹ thuật/nội dung đã chốt (append-only) |
| `MVP.md` | Phạm vi MVP chi tiết theo mã FR/NFR; báo cáo ghi phạm vi hiện thực ở mục 1.3.4 và đánh dấu *(chỉ thiết kế)* trong từng FR — ba chỗ phải khớp nhau |
| `NOTES.md` | Việc đang mở, chưa chốt |
| `INDEX.md` | File này |
| `package.json` | Tooling: `npm run shot` (Playwright chụp HTML → PNG), `npm run uml` (PlantUML render `tools/uml/` → `image/uml/`), `npm run uml:setup` (tải `plantuml.jar` bằng curl) |
| `.gitignore` | `node_modules/`, artifact build LaTeX, `PHASE*-PLAN.md`, `tools/plantuml/` (jar), `slide-pack/`, `review/` |
| `_archive-old-tex/` | File .tex gốc trước khi tái cấu trúc — chỉ lưu tham khảo |

**Quy trình build:** `pdflatex` → **`biber`** (không phải `bibtex` — dự án dùng `biblatex` với `backend=biber`) →
`pdflatex` ×2. Không build trong lúc LaTeX Workshop của VS Code đang tự build: hai tiến trình ghi chồng làm
`main.aux` hỏng (log cụt, mọi tham chiếu undefined); gặp thì xoá `main.aux`, `.toc`, `.lof`, `.lot`, `.out`,
`.bcf`, `.run.xml` rồi build lại đủ bốn bước.

## `chapters/` — Nội dung chính (8 chương)

| File | Nội dung | Trạng thái |
|---|---|---|
| `chuong1-gioithieu.tex` | 1.1 Động cơ (bối cảnh, đặc thù nông sản, 4 vấn đề V1–V4) · 1.2 Mục tiêu (MT1–MT7, mục tiêu đánh giá) · 1.3 Phạm vi (không gian, thời gian, nội dung, **1.3.4 phạm vi hiện thực**, giới hạn kỹ thuật) · 1.4 Ý nghĩa · 1.5 Cấu trúc báo cáo | Xong (9 trang) |
| `chuong2-kienthuc-nentang.tex` | 2.1 Đặc điểm hàng nông sản · 2.2 Bối cảnh chính sách (**bảng văn bản → nghĩa vụ → tác động thiết kế** `tab:phaply`) · 2.3 Lý thuyết nền (B2B/B2C/B2B2C, 1P/3P) · 2.4 Ứng dụng AI (tìm kiếm ngữ nghĩa, sản phẩm tương tự, dự báo giá) | Xong (20 trang); còn TODO trích dẫn mục 2.1 |
| `chuong3-congtrinh-lienquan.tex` | 3.1 Nghiên cứu liên quan · 3.2 Nền tảng trong nước/quốc tế · 3.3 Vì sao các nền tảng hiện có chưa đi theo hướng này · 3.4 Kết chương | Xong (7 trang); còn TODO 3.1 |
| `chuong4-hethong-dexuat.tex` | 4.1 Ngữ cảnh nghiệp vụ (hai luồng 3P/1P, dòng thu và **điều kiện hòa vốn 1P**, 10 quy trình, dòng tồn, **giao hàng ba chặng**, **đổi trả–khiếu nại kèm cam kết thời gian**, chính sách pháp lý) · 4.2 Mô tả hệ thống (5 khối, **hai ứng dụng**, sơ đồ ngữ cảnh C4, nhóm người dùng + **6 vai trò nội bộ**, persona, customer journey) · 4.3 Yêu cầu (user story → FR1–FR13 có quy ước *(chỉ thiết kế)*, 5 mã đã rút; NFR1–NFR9; MoSCoW 11 Must + 2 Should) | Xong (46 trang) |
| `chuong5-phantich-thietke.tex` | 5.1 Phân tích: **sơ đồ hoạt động UML** (4 ở thân, 6 ở Phụ lục R) · use case (tổng quan + 5 chi tiết ở Phụ lục S; đặc tả UC-B4, UC-C4, **UC-C6** ở thân) · 5.2 Giải pháp công nghệ (2 ứng dụng, monorepo, NestJS, Prisma, PostgreSQL, dịch vụ bên thứ ba, AI) · 5.3 Thiết kế: kiến trúc C4 (container + **bảng I/O 7 container**, mô-đun + **bảng I/O 13 mô-đun**, **luồng một đơn lẻ**) · sitemap hai ứng dụng · CSDL 13 schema · AI (`tab:tinhnangAI`) · chính sách bên thứ ba | Xong phần thiết kế (35 trang); ERD và Phụ lục K chờ `schema.dbml` (có `% TODO`); sequence/class tạm hoãn; API, UI/UX, test case còn TODO |
| `chuong6-hienthuc-kiemthu.tex` | Môi trường, triển khai, các module, kiểm thử | §6.1.1 danh sách công nghệ; còn lại TODO |
| `chuong7-danhgia.tex` | 7.1 Mục tiêu và phương pháp (6 trụ cột) · 7.2–7.5 · 7.6 Kết chương | Phương pháp, công cụ đã chốt; số liệu chờ đo thật |
| `chuong8-tongket.tex` | Kết quả · Hạn chế · Hướng phát triển (gồm các mã FR đã rút: TraceViet, ký số, khan hiếm, thuê kho, chào sỉ tồn dư, đội giao riêng) | Phần hạn chế và hướng phát triển xong |

## `backmatter/` — Phụ lục A–V

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
| `phuluc-csdl.tex` | **Phụ lục K** — từ điển dữ liệu 4 nhóm cốt lõi theo cách nhóm cũ (chờ cập nhật theo 13 schema) |
| `phuluc-nguong.tex` | **Phụ lục L** — ngưỡng NFR và ngưỡng AI kèm căn cứ |
| `phuluc-matran.tex` | **Phụ lục M** — ma trận Priority/Feasibility/Testability cho FR và NFR |
| `phuluc-xuatkhau.tex` | **Phụ lục N** khoảng cách với thị trường xuất khẩu · **O** nguồn dữ liệu nông sản cho AI |
| `phuluc-chitiet.tex` | **P** số liệu OCOP · **Q** hành trình khách hàng và 13 nguồn giao dịch kho · **R** 6 sơ đồ hoạt động · **S** 5 sơ đồ use case chi tiết, đặc tả UC-B2, UC-B5, UC-D4, UC-C7 · **T** sitemap cấp 3 theo hai ứng dụng kèm mã FR |
| `phuluc-chinhsach.tex` | **Phụ lục U** — bộ 10 chính sách (`tab:bochinhsach`) và toàn văn U.1 kiểm hàng, U.2 đổi trả–hoàn tiền, U.3 bảo mật |
| `phuluc-sukien.tex` | **Phụ lục V** — danh mục 16 sự kiện nghiệp vụ (phát bởi, nhận bởi, tác dụng) |
| `kehoach.tex` | Kế hoạch hai giai đoạn (giữa kỳ 15/10/2026, cuối kỳ 31/12/2026) kèm rủi ro tiến độ |
| `tailieuthamkhao.tex` | `\printbibliography` |

## `frontmatter/` — Phần mở đầu

| File | Trạng thái |
|---|---|
| `biaphu.tex` | Xong |
| `loicamon.tex` | TODO — trống |
| `tomtat.tex` | TODO — trống (VN + Abstract) |
| `danhmuc-tuvietat.tex` | Xong |
| `phieunhiemvu.tex` | Không còn được `\input` từ `main.tex`; giữ phòng khi dùng lại |

## `tools/` — Sinh hình

| File | Vai trò |
|---|---|
| `render-comparison-tables.js` | Script Playwright chụp HTML ở `design/` thành PNG ở `image/comparison/`; viewport khớp cả rộng lẫn cao nội dung |
| `diagrams/svgkit.py` | Bộ dựng SVG dùng chung: hộp (in `OVERFLOW` khi chữ tràn hộp), mũi tên một/hai chiều, nhãn đặt trên đường |
| `diagrams/gen_c4.py` | Sinh `c4-ngu-canh`, `c4-container`, `c4-module`, `luong-don-le` (luồng một đơn lẻ) |
| `diagrams/gen_usecase.py` | Sinh 6 sơ đồ use case: `usecase-overview`, `usecase-nha-ban`, `usecase-nguoi-mua-le`, `usecase-nguoi-mua-si`, `usecase-noibo-nguonhang`, `usecase-noibo-vanhanh` |
| `diagrams/gen_sitemap.py` | Sinh `sitemap-tong-quan` (hai cây theo hai ứng dụng) |
| `design/*.html` | HTML sinh từ `diagrams/` (**không sửa tay**) và các infographic viết tay: `thuc-trang-chuoi-cung-ung`, `ocop-2024-2025`, `bmc-cum1`–`3` |
| `uml/_style.iuml`, `uml/act-*.puml` | Nguồn 10 sơ đồ hoạt động UML; kiểu chung (dpi 200, cỡ chữ 19) |
| `plantuml/plantuml.jar` | PlantUML 1.2026.8, **không commit**; tải bằng `npm run uml:setup` (cần Java; sơ đồ activity không cần Graphviz) |

Quy trình sửa hình: sửa bộ sinh → `python tools/diagrams/gen_c4.py` (hoặc `gen_usecase.py`, `gen_sitemap.py`) →
`npm run shot`; sơ đồ hoạt động: sửa `.puml` → `npm run uml`. Rồi build lại PDF. Không sửa trực tiếp PNG.

**Cỡ chữ trong hình:** ảnh luôn bị ép về `\textwidth` = 16 cm và bị chặn chiều cao bởi `adjustbox`.
- HTML (bề rộng thân 1420px): cỡ chữ in ra (pt) = `font_px × 16 / 1420 × 28,45`; tối thiểu 22px ≈ 7pt.
- PlantUML: pt = min(cỡ × 16 × 28,45 / rộng, cỡ × 21,1 × 28,45 / cao), rộng/cao tính bằng px ảnh ÷ (200/96).
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
`fig:act-dat-hang`, `fig:act-giao-hang`, `fig:act-doi-tra`, `fig:usecase-overview`, `fig:c4-container`,
`fig:c4-module`, `fig:luong-don-le`, `fig:sitemap`, `fig:erd` (Ch.5; ERD lệch `schema.dbml`).
**Hình ở phụ lục:** `fig:ocop` (P); `fig:act-dang-ky-ncc`, `fig:act-dang-san-pham`, `fig:act-ban-si`,
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
