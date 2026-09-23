# INDEX.md — Chỉ mục file/thư mục

Cập nhật lần cuối: 2026-09-23 (sau phiên chỉnh sửa 18 hạng mục, đợt 3: so sánh
chuyển sang bảng LaTeX, sửa đánh số phụ lục, cô đọng nội dung).

## Gốc dự án

| File | Vai trò |
|---|---|
| `main.tex` | File LaTeX chính, `\input` toàn bộ front/back matter + 8 chương theo đúng thứ tự |
| `references.bib` | Toàn bộ tài liệu tham khảo, dùng `biblatex` style `ieee` |
| `main.pdf` | Bản build gần nhất, 134 trang |
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
| `chuong2-kienthuc-nentang.tex` | **2.1 Đặc điểm hàng nông sản (mới: định nghĩa phạm vi nông sản, so sánh với hàng hóa khác, chứng nhận farm-to-market)** · 2.2 Bối cảnh chính sách · 2.3 Lý thuyết nền · 2.4 Ứng dụng AI | Xong; còn TODO bổ sung trích dẫn cho mục 2.1 |
| `chuong3-congtrinh-lienquan.tex` | 3.1 Nghiên cứu liên quan · 3.2 Nền tảng trong nước/quốc tế · **3.3 Vì sao các nền tảng hiện có chưa đi theo hướng này (mới)** · 3.4 Kết chương (research gap) | Xong; còn TODO bổ sung nghiên cứu ở 3.1 |
| `chuong4-hethong-dexuat.tex` | 4.1 Ngữ cảnh nghiệp vụ (**mô hình 2 luồng 3P/1P**, 8 quy trình, **quy tắc chống đăng sai sản phẩm**) · 4.2 Mô tả hệ thống (**Farmery là gì, phân hệ, kênh truy cập**, 5 nhóm người dùng, NC1–NC5, thách thức) · 4.3 Yêu cầu (**câu chuyện người dùng** → FR1–FR12, NFR) | Xong |
| `chuong5-phantich-thietke.tex` | 5.1 Mô hình hóa quy trình (8 quy trình, 10 lưu đồ) · **5.2 Giải pháp công nghệ (mới: đối sánh 12 hạng mục + 3 mô-đun AI)** · 5.3 Thiết kế (**kiến trúc modular monolith + RB1–RB3**, CSDL, AI, API, UI/UX, test case) | 5.2, 5.3.1, 5.3.5, 5.3.6 xong; sitemap/sequence/class/API/UI còn TODO |
| `chuong6-hienthuc-kiemthu.tex` | Môi trường, triển khai, các module, kiểm thử | Toàn bộ TODO |
| `chuong7-danhgia.tex` | **7.1 Mục tiêu và phương pháp đánh giá (mới)** · 7.2 Chức năng · 7.3 Front-end · 7.4 Back-end · 7.5 AI · 7.6 Kết chương | Khung xong, chờ số liệu thực nghiệm |
| `chuong8-tongket.tex` | Kết quả đạt được · **Hạn chế của phiên bản hiện tại (mới)** · **Hướng phát triển: nghiệp vụ + kiến trúc (mới)** | Phần hạn chế và hướng phát triển xong |

## `backmatter/` — Phụ lục A–L

Phụ lục dài được tách thành file riêng để thân báo cáo không bị bảng chiếm chỗ.

| File | Nội dung |
|---|---|
| `phuluc.tex` | Khung phụ lục A, B, C, E; `\input` các file bên dưới |
| `phuluc-tos.tex` | **Phụ lục D — Điều khoản dịch vụ**, 15 điều, viết để đọc độc lập (không dùng mã vai trò, mã FR hay tham chiếu chéo vào thân báo cáo) |
| `phuluc-bang.tex` | **Phụ lục F** ánh xạ vấn đề–mục tiêu · **G** đối chiếu nông sản với hàng hóa khác · **H** chứng nhận nông sản thế giới |
| `phuluc-congnghe.tex` | **Phụ lục I** — đối sánh giải pháp công nghệ và mô hình AI |
| `phuluc-yeucau.tex` | **Phụ lục J** — truy vết câu chuyện người dùng → yêu cầu, và bảng FR theo nhóm người dùng |
| `phuluc-csdl.tex` | **Phụ lục K** — từ điển dữ liệu đầy đủ (8 nhóm thực thể) |
| `phuluc-nguong.tex` | **Phụ lục L** — bảng ngưỡng NFR và ngưỡng AI |
| `kehoach.tex` | Kế hoạch thực hiện 15 tuần |
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

**Cỡ chữ trong hình:** cỡ chữ in ra (pt) = `font_px × 16 / body_width_px × 28,45`, vì ảnh luôn bị ép về `	extwidth` = 16cm. Giữ tối thiểu ~7pt cho chữ nhỏ nhất khi sửa bất kỳ file HTML nào.

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

**Hình:** `fig:thuctrang`, `fig:ocop`, **`fig:bmc-cum1`**, **`fig:bmc-cum2`**,
**`fig:bmc-cum3`**, `fig:bmc-full`, **`fig:flow-thu-mua`**, `tab:sosanhtrongnuoc`,
`tab:sosanhquocte`, `tab:researchgap`, các `fig:flow-*`.

**Bảng:** **`tab:hailuong`** (trong thân báo cáo), `tab:vande-muctieu`,
`tab:dacdiem-hanghoa`, `tab:chungnhan`, `tab:sosanh-congnghe`,
`tab:sosanh-ai`, `tab:truyvet-us`, `tab:fr-nguoidung`, `tab:db-nhom1`–`4`,
`tab:nguongNFR`, `tab:nguongAI` (tất cả trừ `tab:hailuong` đều nằm ở phụ lục).

**Lưu ý:** các phụ lục dùng `\section*` nên **không đánh số tự động** — trong
thân báo cáo phải viết thẳng "Phụ lục G", không dùng `\ref`.
