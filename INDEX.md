# INDEX.md — Chỉ mục file/thư mục

Cập nhật lần cuối: 2026-09-15 (sau khi bổ sung 5 mảng nội dung lớn: ToS mở
rộng, business model, đánh giá SP/nhà bán, AI/chatbot đào sâu, kho bãi & 3PL).

## Gốc dự án

| File | Vai trò |
|---|---|
| `main.tex` | File LaTeX chính (`\documentclass{report}`), `\input` toàn bộ front/back matter + 6 chương theo đúng thứ tự |
| `references.bib` | Toàn bộ tài liệu tham khảo (BibTeX), style `ieeetr` |
| `main.pdf` | Bản build gần nhất (build thủ công bằng MiKTeX: `pdflatex` → `bibtex` → `pdflatex` ×2), 52 trang |
| `DECISIONS.md` | Log quyết định kỹ thuật/nội dung đã chốt (append-only) |
| `NOTES.md` | Việc đang mở, chưa chốt |
| `INDEX.md` | File này |
| `package.json` | Tooling Node/Playwright để render infographic HTML → PNG (`npm run shot`) |
| `.gitignore` | `node_modules/`, artifact build LaTeX, `PHASE*-PLAN.md` |
| `_archive-old-tex/` | File .tex/flowchart gốc trước khi tái cấu trúc/vẽ lại — chỉ lưu tham khảo, nội dung đã gộp hết vào cấu trúc hiện tại |

## `tools/` — Render infographic thành ảnh

| File | Vai trò |
|---|---|
| `render-comparison-tables.js` | Script Playwright: chụp các HTML ở `design/` thành PNG ở `image/comparison/` |
| `design/thuc-trang-chuoi-cung-ung.html` | Nguồn Hình 1.1 (Ch.1, thực trạng chuỗi cung ứng) |
| `design/ocop-2024-2025.html` | Nguồn Hình 2.x (Ch.2, tăng trưởng OCOP) |
| `design/business-model-canvas.html` | Nguồn Hình 3.1 (Ch.3, Business Model Canvas Farmery) |
| `design/so-sanh-trong-nuoc.html` | Nguồn Hình so sánh sàn trong nước (Ch.2) |
| `design/so-sanh-quoc-te.html` | Nguồn Hình so sánh mô hình quốc tế (Ch.2) |
| `design/research-gap.html` | Nguồn Hình ma trận research gap (Ch.2) |

Sửa số liệu/nội dung infographic → sửa file HTML tương ứng trong
`tools/design/`, chạy lại `npm run shot`, rồi rebuild PDF. Không sửa trực
tiếp file PNG.

## `image/comparison/` — Ảnh PNG đã render (output của `tools/`, không sửa tay)

`thuc-trang-chuoi-cung-ung.png`, `ocop-2024-2025.png`,
`business-model-canvas.png`, `so-sanh-trong-nuoc.png`, `so-sanh-quoc-te.png`,
`research-gap.png` — nhúng bằng `\includegraphics` trong
`chapters/chuong1-gioithieu.tex`, `chapters/chuong2-coso-lythuyet.tex` và
`chapters/chuong3-phantich-thietke.tex`.

## `frontmatter/` — Phần mở đầu

| File | Trạng thái |
|---|---|
| `biaphu.tex` | Xong (giống bìa chính theo yêu cầu giảng viên) |
| `phieunhiemvu.tex` | Khung mẫu, cần chữ ký thật |
| `loicamon.tex` | TODO — trống |
| `tomtat.tex` | TODO — trống (VN + Abstract) |
| `danhmuc-tuvietat.tex` | Xong — bảng thuật ngữ (B2B, MOQ, GS1, RBAC...) |

## `chapters/` — Nội dung chính

| File | Mục lục | Trạng thái |
|---|---|---|
| `chuong1-gioithieu.tex` | 1.1 Đặt vấn đề (có Hình 1.1) · 1.2 Mục tiêu · 1.3 Ý nghĩa khoa học/thực tiễn · 1.4 Phạm vi (`sec:phamvi`) · 1.5 Cấu trúc báo cáo | 1.1 xong, 1.2–1.5 nháp cần rà (xem `NOTES.md`) |
| `chuong2-coso-lythuyet.tex` | 2.1 Related work (so sánh sàn có hình, research gap) · 2.2 Lý thuyết nền (B2B2C, SFSC, GS1/blockchain, reputation, RBAC/escrow, **business model**, **kho bãi/3PL**) · 2.3 Lý thuyết AI (có trích dẫn học thuật) | Nội dung đầy đủ |
| `chuong3-phantich-thietke.tex` | 3.1 Phân tích người dùng (+RBAC role) · 3.2 Luồng tiếp cận · **3.3 Phân tích mô hình kinh doanh (mới, có Hình 3.1 BMC)** · 3.4–3.5 Yêu cầu chức năng/phi chức năng · 3.6 Quy trình nghiệp vụ (3.6.1–3.6.6, gồm **3.6.4 Đánh giá SP/nhà bán mới** + flowchart 7, và 3.6.5 đổi tên gồm quản lý tồn kho) · 3.7 Luồng vận hành · 3.8 Kiến trúc · 3.9 ERD · 3.10 Sơ đồ thiết kế chi tiết · **3.11 Thiết kế AI (viết lại: pipeline 5 bước + kiến trúc chatbot riêng)** | 3.1–3.3, 3.6, 3.11 xong; 3.7–3.10 khung TODO |
| `chuong4-hienthuc.tex` | Môi trường, triển khai, 8 module (gồm AI, đánh giá, tồn kho) | Toàn bộ TODO |
| `chuong5-danhgia.tex` | Test case, kết quả, hiệu năng, AI, UX, thảo luận | Toàn bộ TODO |
| `chuong6-ketluan.tex` | Tóm tắt, hạn chế, hướng phát triển | Toàn bộ TODO |

## `backmatter/`

| File | Vai trò |
|---|---|
| `tailieuthamkhao.tex` | `\bibliography{references}`, label `chap:references` |
| `phuluc.tex` | Phụ lục A/B/C — TODO; **Phụ lục D (Điều khoản dịch vụ) — 13 điều + định nghĩa thuật ngữ**, TODO chỉ còn mức phí cụ thể (Điều 5) và SLA (Điều 7, 8) |

## `flowcharts/`

7 file: `01-dang-ky.tex`, `02-san-pham.tex`, `03-ban-le.tex`, `04-ban-si.tex`
(cả 2 vẽ theo góc nhìn nhà bán, có `\resizebox` chống tràn trang),
`05-van-chuyen.tex`, `06-quan-tri.tex`, **`07-danh-gia.tex` (mới — quy
trình đánh giá sản phẩm/nhà bán, label `fig:flow-danh-gia`)** + `styles.tex`,
được `\input` từ mục 3.6 trong `chapters/chuong3-phantich-thietke.tex`.
File `.tex` cũ (03/04 phiên bản mua lẻ/mua sỉ) đã chuyển vào `_archive-old-tex/`.

## Nhãn (`\label`) quan trọng dùng để tham chiếu chéo

`chap:gioithieu`, `chap:coso`, `chap:phantich`, `chap:hienthuc`,
`chap:danhgia`, `chap:ketluan`, `chap:references`; `subsec:reputation`,
`subsec:gs1blockchain`, `subsec:sosanhtrongnuoc`, `subsec:sosanhquocte`,
`subsec:researchgap`, `subsec:businessmodel`, `subsec:khobai`;
`sec:doituongnguoidung`, `sec:luongtiepcan`, `sec:businessmodelcanvas`,
`sec:quytrinhnghiepvu`, `subsec:danhgianghiepvu`, `sec:luongvanhanh`,
`sec:kientruc`, `sec:csdl`, `sec:sddchitiet`, `sec:thietkeAI`,
`sec:hienthucAI`, `sec:yeucauchucnang`, `sec:yeucauphichucnang`,
`sec:danhgiahieunang`, `sec:danhgiaux`, `sec:phamvi`; `fig:thuctrang`,
`fig:ocop`, `fig:bmc`, `fig:flow-ban-le`, `fig:flow-ban-si`,
`fig:flow-danh-gia`.
