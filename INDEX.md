# INDEX.md — Chỉ mục file/thư mục

Cập nhật lần cuối: 2026-09-23 (đợt 5: bổ sung trích dẫn đã kiểm chứng, nghiên cứu
liên quan, bộ khảo sát SUS; rút gọn trùng lặp và chuyển ma trận FR/NFR xuống phụ lục).

## Gốc dự án

| File | Vai trò |
|---|---|
| `main.tex` | File LaTeX chính, `\input` toàn bộ front/back matter + 8 chương theo đúng thứ tự |
| `references.bib` | Toàn bộ tài liệu tham khảo, dùng `biblatex` style `ieee` |
| `main.pdf` | Bản build gần nhất, 151 trang |
| `DECISIONS.md` | Log quyết định kỹ thuật/nội dung đã chốt (append-only) |
| `NOTES.md` | Việc đang mở, chưa chốt |
| `INDEX.md` | File này |
| `package.json` | Tooling Node/Playwright để render infographic HTML → PNG (`npm run shot`) |
| `.gitignore` | `node_modules/`, artifact build LaTeX, `PHASE*-PLAN.md` |
| `_archive-old-tex/` | File .tex gốc trước khi tái cấu trúc — chỉ lưu tham khảo |

**Quy trình build:** `pdflatex` → **`biber`** (không phải `bibtex` — dự án
dùng `biblatex` với `backend=biber`) → `pdflatex` ×2.

## `chapters/` — Nội dung chính (8 chương)

| File | Nội dung | Trạng thái |
|---|---|---|
| `chuong1-gioithieu.tex` | 1.1 Động cơ (bối cảnh, đặc thù nông sản, 4 vấn đề V1–V4) · 1.2 Mục tiêu (tổng quát, MT1–MT7, **mục tiêu đánh giá**) · 1.3 Phạm vi (**không gian, thời gian, nội dung, giới hạn kỹ thuật**) · 1.4 Ý nghĩa · 1.5 Cấu trúc báo cáo | Xong |
| `chuong2-kienthuc-nentang.tex` | **2.1 Đặc điểm hàng nông sản** (định nghĩa phạm vi nông sản, so sánh với hàng hóa khác, chứng nhận farm-to-market) · 2.2 Bối cảnh chính sách · 2.3 Lý thuyết nền (**2.3.1 hai trục phân loại: B2B/B2C/B2B2C và 1P/3P**) · 2.4 Ứng dụng AI (**2 bài toán**: gợi ý, dự báo giá) | Xong; còn TODO bổ sung trích dẫn cho mục 2.1 |
| `chuong3-congtrinh-lienquan.tex` | 3.1 Nghiên cứu liên quan · 3.2 Nền tảng trong nước/quốc tế · **3.3 Vì sao các nền tảng hiện có chưa đi theo hướng này (mới)** · 3.4 Kết chương (research gap) | Xong; còn TODO bổ sung nghiên cứu ở 3.1 |
| `chuong4-hethong-dexuat.tex` | 4.1 Ngữ cảnh nghiệp vụ (**mô hình 2 luồng 3P/1P**, 8 quy trình, quy tắc chống đăng sai sản phẩm) · 4.2 Mô tả hệ thống (Farmery là gì, phân hệ, kênh truy cập, 5 nhóm người dùng, **4 persona**, **customer journey**, NC1–NC5, thách thức) · 4.3 Yêu cầu (user story → FR1–FR12, NFR, yêu cầu dữ liệu 9 miền; 2 ma trận Priority/Feasibility/Testability ở Phụ lục M) | Xong |
| `chuong5-phantich-thietke.tex` | 5.1 Mô hình hóa quy trình (8 quy trình, 10 lưu đồ) · 5.2 Giải pháp công nghệ (đối sánh 12 hạng mục + **2 mô-đun AI**) · 5.3 Thiết kế (kiến trúc modular monolith + RB1–RB3, CSDL, AI, API, UI/UX, test case) | 5.2, 5.3.1, 5.3.5, 5.3.6 xong; use case/sitemap/sequence/class/API/UI/test case còn TODO |
| `chuong6-hienthuc-kiemthu.tex` | Môi trường, triển khai, các module, kiểm thử | Toàn bộ TODO |
| `chuong7-danhgia.tex` | 7.1 Mục tiêu và phương pháp (5 trụ cột: chức năng, hiệu năng, bảo mật, khả dụng, AI) · 7.2 Chức năng · 7.3 Back-end · 7.4 Front-end · 7.5 AI · 7.6 Kết chương | **Phương pháp và công cụ đã chốt (k6, SUS, Lighthouse); toàn bộ số liệu chờ đo thật sau khi có Ch.6** |
| `chuong8-tongket.tex` | Kết quả đạt được · **Hạn chế của phiên bản hiện tại (mới)** · **Hướng phát triển: nghiệp vụ + kiến trúc (mới)** | Phần hạn chế và hướng phát triển xong |

## `backmatter/` — Phụ lục A–M

Phụ lục dài được tách thành file riêng để thân báo cáo không bị bảng chiếm chỗ.

| File | Nội dung |
|---|---|
| `phuluc.tex` | Khung phụ lục A, C (còn TODO) và E (Business Model Canvas dạng bảng); `\input` các file bên dưới |
| `phuluc-khaosat.tex` | **Phụ lục B** — bộ công cụ khảo sát SUS: thiết kế khảo sát, 3 kịch bản tác vụ, phiếu quan sát, 10 câu hỏi, công thức tính điểm |
| `phuluc-tos.tex` | **Phụ lục D — Điều khoản dịch vụ**, 15 điều, viết để đọc độc lập (không dùng mã vai trò, mã FR hay tham chiếu chéo vào thân báo cáo) |
| `phuluc-bang.tex` | **Phụ lục F** ánh xạ vấn đề–mục tiêu · **G** đối chiếu nông sản với hàng hóa khác · **H** chứng nhận nông sản thế giới |
| `phuluc-congnghe.tex` | **Phụ lục I** — đối sánh giải pháp công nghệ và mô hình AI |
| `phuluc-yeucau.tex` | **Phụ lục J** — truy vết user story → yêu cầu, và bảng FR theo nhóm người dùng |
| `phuluc-csdl.tex` | **Phụ lục K** — từ điển dữ liệu, đặc tả chi tiết 4 nhóm thực thể cốt lõi (4 nhóm còn lại chỉ liệt kê ở mục 5.3.5, chi tiết chờ Chương 6) |
| `phuluc-nguong.tex` | **Phụ lục L** — bảng ngưỡng NFR và ngưỡng AI, mỗi căn cứ dẫn từ một nhu cầu người dùng cụ thể |
| `phuluc-matran.tex` | **Phụ lục M** — ma trận Priority/Feasibility/Testability cho FR và NFR |
| `kehoach.tex` | Kế hoạch thực hiện theo hai giai đoạn, có mốc ngày thật: giai đoạn 1 tới 15/10/2026 (nộp giữa kỳ), giai đoạn 2 tới 31/12/2026 (nộp cuối kỳ); kèm phân tích rủi ro tiến độ |
| `tailieuthamkhao.tex` | `\printbibliography` |

## `frontmatter/` — Phần mở đầu

| File | Trạng thái |
|---|---|
| `biaphu.tex` | Xong |
| `loicamon.tex` | TODO — trống |
| `tomtat.tex` | TODO — trống (VN + Abstract) |
| `danhmuc-tuvietat.tex` | Xong |
| `phieunhiemvu.tex` | **Không còn được `\input` từ `main.tex`** (đã bỏ theo yêu cầu 2026-09-23); giữ file phòng khi cần dùng lại |

## `tools/` — Render infographic thành ảnh

| File | Vai trò |
|---|---|
| `render-comparison-tables.js` | Script Playwright chụp HTML ở `design/` thành PNG ở `image/comparison/`. Viewport khớp cả **chiều rộng lẫn chiều cao** nội dung để ảnh không thừa nền trắng phía dưới |
| `design/thuc-trang-chuoi-cung-ung.html` | Hình thực trạng chuỗi cung ứng (Ch.1) |
| `design/ocop-2024-2025.html` | Hình tăng trưởng OCOP (Ch.2) |
| `design/bmc-cum1.html`, `bmc-cum2.html`, `bmc-cum3.html` | **3 cụm BMC dùng trong thân báo cáo** (thay ảnh ngang cũ khó đọc) |

**Các nội dung so sánh nay dùng bảng LaTeX, không dùng ảnh** — `tools/design/` chỉ còn các infographic thật sự cần đồ họa.

**Cỡ chữ trong hình:** cỡ chữ in ra (pt) = `font_px × 16 / body_width_px × 28,45`, vì ảnh luôn bị ép về `\textwidth` = 16cm. Giữ tối thiểu ~7pt cho chữ nhỏ nhất khi sửa bất kỳ file HTML nào.

Sửa số liệu/nội dung infographic → sửa file HTML tương ứng, chạy `npm run shot`,
rồi rebuild PDF. Không sửa trực tiếp file PNG.

## `flowcharts/`

10 file lưu đồ TikZ + `styles.tex` + `00-chu-thich.tex`, được `\input` từ mục
5.1 trong `chapters/chuong5-phantich-thietke.tex`.

## Nhãn (`\label`) quan trọng

**Chương:** `chap:gioithieu`, `chap:coso`, `chap:lienquan`, `chap:hethong`,
`chap:phantich`, `chap:hienthuc`, `chap:danhgia`, `chap:ketluan`,
`chap:references`.

**Mục:** `sec:dongco`, `sec:vande`, `sec:muctieu`, **`sec:muctieudanhgia`**,
`sec:phamvi`, `sec:ynghia`; **`sec:dacdiemnongsan`**,
**`subsec:dinhnghianongsan`**, **`subsec:sosanhnongsan`**,
**`subsec:chungnhan`**, `subsec:reputation`, `subsec:gs1blockchain`,
`subsec:businessmodel`, `subsec:khobai`; `subsec:sosanhtrongnuoc`,
`subsec:sosanhquocte`, **`sec:visaochualam`**, `subsec:researchgap`;
`sec:ngucanh`, `sec:businessmodelcanvas`, `sec:quytrinhnghiepvu`,
`subsec:danhgianghiepvu`, `sec:motahethong`, `sec:luongvanhanh`,
`sec:doituongnguoidung`, `sec:luongtiepcan`, `sec:yeucau`,
`sec:yeucauchucnang`, `sec:yeucauphichucnang`; `sec:giaiphapcongnghe`,
`sec:kientruc`, `sec:csdl`, `subsec:dacta-csdl`, `subsec:erd`,
`sec:thietkeAI`; **`sec:muctieuphuongphap`**, `sec:danhgiaux`,
`sec:danhgiahieunang`, `sec:danhgiaAI`.

**Hình (17):** `fig:thuctrang`, `fig:ocop`, `fig:bmc-cum1`–`3`,
`fig:chu-thich-flowchart`, `fig:erd` (chưa có ảnh), và 10 lưu đồ `fig:flow-*`
gồm `fig:flow-dang-ky`, `fig:flow-san-pham`, **`fig:flow-thu-mua`**,
`fig:flow-ban-le-a`/`-b`, `fig:flow-danh-gia`, `fig:flow-ban-si-a`/`-b`,
`fig:flow-van-chuyen`, `fig:flow-quan-tri`.

**Bảng trong thân báo cáo (6):** `tab:hailuong` (đối chiếu hai luồng),
`tab:sosanhtrongnuoc`, `tab:sosanhquocte`, `tab:researchgap`,
`tab:nhomnguoidung`, `tab:customer-journey`.

**Bảng ở phụ lục:** `tab:kichban-khaosat`, `tab:phieu-quansat` và
`tab:cauhoi-sus` (B), `tab:bmc-full` (E), `tab:vande-muctieu` (F),
`tab:dacdiem-hanghoa` (G), `tab:chungnhan` (H), `tab:sosanh-congnghe` và
`tab:sosanh-ai` (I), `tab:truyvet-us` và `tab:fr-nguoidung` (J),
`tab:db-nhom1`–`4` (K), `tab:nguongNFR` và `tab:nguongAI` (L),
`tab:fr-matrix` và `tab:nfr-matrix` (M), `tab:kehoach`.

## Hai điểm dễ vấp khi sửa

1. **Phụ lục dùng `\section*` nên không đánh số tự động** — trong thân báo cáo
   phải viết thẳng "Phụ lục G", không dùng `\ref`.
2. **Hình và bảng ở phần sau Chương 8 có tiền tố riêng** — `KH.` cho Kế hoạch
   thực hiện, `PL.` cho Phụ lục, đặt trong `main.tex` ngay trước phần kết thúc.
   Nếu bỏ đoạn `\setcounter` và `\renewcommand` đó, toàn bộ bảng phụ lục sẽ bị
   đánh số nối tiếp Chương 8 thành "Bảng 8.1" đến "Bảng 8.14" — lỗi đã từng xảy ra.
