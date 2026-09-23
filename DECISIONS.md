# DECISIONS.md — Log quyết định đã chốt (append-only)

Quy ước: không sửa/xoá mục cũ. Khi một quyết định bị đảo ngược hoặc cập nhật,
nối thêm dòng `**SỬA <ngày>:** ...` ngay dưới mục gốc.

---

### Bố cục báo cáo theo 3 phần + 6 chương — 2026-09-15
**Bối cảnh:** Nội dung cũ (3 file .tex: Tổng quan đề tài, Cơ sở lý thuyết, Quy
trình nghiệp vụ) chưa khớp bố cục đồ án chuyên ngành do giảng viên (Võ Thị
Ngọc Châu) cung cấp.
**Quyết định:** Tái cấu trúc theo bố cục chuẩn: Phần mở đầu (bìa, phiếu nhiệm
vụ, lời cảm ơn, tóm tắt, mục lục, danh mục) → Chương 1 Giới thiệu → Chương 2
Cơ sở lý thuyết → Chương 3 Phân tích & thiết kế → Chương 4 Hiện thực →
Chương 5 Đánh giá & thử nghiệm → Chương 6 Kết luận → Phần kết thúc (tài liệu
tham khảo, phụ lục). Chi tiết tiểu mục từng chương xem `INDEX.md`.
**Đánh đổi:** Cân nhắc giữ nguyên 3 file cũ và chỉ thêm phần thiếu, nhưng bị
loại vì nội dung cũ trộn lẫn nhiều chủ đề (vd so sánh đối thủ nằm chung file
"Tổng quan đề tài" thay vì thuộc Ch.2 related-work) — tái cấu trúc triệt để
giúp khớp đúng vai trò từng chương hơn.

### Đổi documentclass từ `article` sang `report` — 2026-09-15
**Bối cảnh:** Bố cục 6 chương chuẩn dùng `\chapter`, nhưng `main.tex` gốc
dùng `\documentclass{article}` (không hỗ trợ `\chapter`, chỉ có `\section`
làm cấp cao nhất).
**Quyết định:** Đổi sang `\documentclass[a4paper, 16pt]{report}`, giữ nguyên
toàn bộ package/style khác (fancyhdr, vntex, tikz cho flowcharts...). Đã
build thử bằng MiKTeX (pdflatex + bibtex), ra `main.pdf` 47 trang không lỗi.
**Đánh đổi:** Không có phương án khác khả thi — `article` không thể giả lập
`\chapter` mà không phá vỡ numbering/mục lục.

### Cấu trúc thư mục & tên file chuẩn hóa không dấu — 2026-09-15
**Bối cảnh:** File .tex gốc đặt tên tiếng Việt có dấu/space ("Cơ sở lý
thuyết.tex") — dễ lỗi encoding/path giữa các máy trong nhóm 3 người.
**Quyết định:** Chuyển sang `chapters/`, `frontmatter/`, `backmatter/` với
tên file không dấu, không space (vd `chuong1-gioithieu.tex`). 3 file .tex
gốc di chuyển vào `_archive-old-tex/` (không xoá, chỉ lưu trữ tham khảo, nội
dung đã được gộp hết vào cấu trúc mới).
**Đánh đổi:** Giữ tên tiếng Việt cũ bị loại vì rủi ro path trên máy Windows
khác nhau trong nhóm cao hơn lợi ích dễ đọc.

### Bổ sung nội dung Ch.2 (related work mở rộng) và Ch.3 (luồng vận hành, thiết kế AI) — 2026-09-15
**Bối cảnh:** Giảng viên yêu cầu bố cục cơ bản nhưng user muốn bổ sung: bảng
so sánh ~5+ sàn TMĐT (trong nước + quốc tế) có ưu/nhược điểm rõ ràng, 1 mục
phân tích research gap (ý nghĩa khoa học + thực tiễn), 1 sơ đồ làm rõ luồng
tương tác giữa B2C/B2B/Business/Admin/IT, và tích hợp AI thật (không chỉ nói
suông) để phân tích dữ liệu/ra quyết định.
**Quyết định:**
- Sàn so sánh trong nước: Shopee, Lazada, FoodMap, Buudien.vn (Postmart cũ),
  VIPO Mall.
- Sàn/mô hình so sánh quốc tế: e-Choupal, Pinduoduo (đã có sẵn) + bổ sung
  Ninjacart (Ấn Độ, B2B rau củ + ML dự báo) và Farm2Market (nghiên cứu 2025,
  blockchain + AI dự báo giá — gần nhất về ý tưởng với Farmery).
- 4 tính năng AI chốt thiết kế + hiện thực thật: (1) gợi ý sản phẩm, (2) dự
  báo nhu cầu/giá nông sản, (3) phát hiện gian lận/bất thường, (4) trợ lý ảo
  (chatbot). Thêm mục 2.3 (lý thuyết AI), 3.9 (thiết kế AI, label
  `sec:thietkeAI`), 4.3.7 (hiện thực AI, label `sec:hienthucAI`), 5.4 (đánh
  giá độ chính xác AI) tương ứng.
- Thêm mục 1.3 "Ý nghĩa khoa học và ý nghĩa thực tiễn" ở Ch.1 và mục 2.1.4
  "Phân tích khoảng trống nghiên cứu" (bảng ma trận) ở Ch.2.
- Thêm mục 3.5 "Sơ đồ tổng quan luồng vận hành hệ thống" mô tả tương tác
  giữa 5 nhóm tác nhân: nhà bán, người mua lẻ (B2C), người mua sỉ (B2B),
  quản trị viên (Admin), hệ thống/IT.
**Đánh đổi:** Không đưa toàn bộ 8 sàn ứng viên (Tiki, Sendo, Grab...) vào để
tránh bảng quá dài loãng trọng tâm — chỉ giữ 5 sàn trong nước tiêu biểu nhất
theo thị phần/độ liên quan.

### Bảng so sánh: dùng HTML → ảnh (Playwright) thay vì bảng LaTeX thuần — 2026-09-15
**Bối cảnh:** User muốn 3 bảng so sánh ở Ch.2 (sàn trong nước, sàn quốc tế,
research gap) trông trực quan như slide Canva thay vì bảng LaTeX `tabularx`
thô.
**Quyết định:** Thiết kế các trang HTML dạng thẻ so sánh (card, có màu/icon
✓✗), dùng Playwright (cài cục bộ trong project qua npm, không dùng MCP
Playwright khác vì không khả dụng trong phiên CLI này) để tự động chụp
thành PNG, nhúng vào LaTeX bằng `\includegraphics` thay bảng
`tabularx` hiện tại trong `chapters/chuong2-coso-lythuyet.tex`
(`tab:sosanhtrongnuoc`, `tab:sosanhquocte`, `tab:researchgap`).
**Đánh đổi:** Cân nhắc yêu cầu user tự thiết kế trên Canva rồi gửi ảnh về —
bị thay bằng phương án Playwright vì tự động hoá được, không cần vòng lặp
thủ công mỗi khi đổi số liệu.
**Hoàn thành 2026-09-15:** đã cài Playwright cục bộ (`package.json`,
`node_modules/` — gitignore), thiết kế 3 trang HTML ở `tools/design/`
(`so-sanh-trong-nuoc.html`, `so-sanh-quoc-te.html`, `research-gap.html`),
script `tools/render-comparison-tables.js` chụp ra `image/comparison/*.png`
(deviceScaleFactor 2 để nét khi in). Đã thay 3 bảng `tabularx` trong
`chapters/chuong2-coso-lythuyet.tex` bằng `\includegraphics` (labels
`tab:sosanhtrongnuoc`, `tab:sosanhquocte`, `tab:researchgap` — giữ nguyên
tên label dù giờ là `figure` không phải `table`, đã sửa các chỗ gọi
"Bảng~\ref{...}" thành "Hình~\ref{...}" cho khớp). Build lại sạch, 45 trang.

### Trang bìa phụ giữ nguyên giống hệt bìa chính — 2026-09-15
**Bối cảnh:** User thắc mắc vì sao bìa lặp lại 2 lần trong PDF.
**Quyết định:** Giữ nguyên — đúng yêu cầu gốc của giảng viên ("Trang bìa phụ:
Giống trang bìa chính nhưng in trên giấy trắng"), không phải lỗi. Khi in/đóng
quyển thật sẽ không thấy trùng vì bìa chính là bìa cứng ngoài cùng.
**Đánh đổi:** Không đổi.

### Kết quả kiểm chứng số liệu Ch.1–2 và rà văn phong — 2026-09-15
**Bối cảnh:** Theo yêu cầu "vừa đủ, tránh dư thừa để bị hỏi", đã kiểm chứng
lại 6 nguồn có số liệu quan trọng nhất (IPSARD/VILAS/TheLeader/Tuổi Trẻ ở
Ch.1 §1.1; GlobalGAP/VietGAP và OCOP 2025 ở Ch.2 §2.1.1) bằng cách fetch
trực tiếp URL trong `references.bib` và đối chiếu từng con số.
**Kết luận:** Toàn bộ số liệu (khâu trung gian, % tăng giá, tỷ lệ hao hụt,
số kho lạnh, cơ cấu GlobalGAP 252/36/127/89, số liệu OCOP 18.243 sản
phẩm...) khớp chính xác 100% với nguồn — không phát hiện sai lệch nào.
Riêng câu văn có 2 từ "rất" liên tiếp ở Ch.2 §2.1.1 (nói về mức phù hợp
chính sách OCOP với Farmery) đã được tinh giản cho đỡ "quảng cáo".
**Đánh đổi:** Chỉ kiểm chứng 6/nhiều nguồn có rủi ro cao nhất (số liệu cụ
thể, dễ bị hỏi vặn) trong thời gian phiên này — các nguồn còn lại
(qd749_2020, nq57_tw, botnmt_2025, qd5943_2025, foodmap, postmart_voso_2021,
buudien_2024, vipo_nongsan_2024...) chưa được re-fetch để đối chiếu lại,
nhưng đều đã có `\cite` rõ ràng từ trước khi phiên này bắt đầu.

### Tách bullet + thêm ảnh infographic cho các đoạn văn dài, dày số liệu — 2026-09-15
**Bối cảnh:** User nhận xét nhiều đoạn văn ở Ch.1-3 quá dài, khó đọc,
đặc biệt các đoạn dồn nhiều số liệu liên tiếp (Ch.1 §1.1, Ch.2 §2.1.1
OCOP/chính sách) và các đoạn "Ngoại lệ" nhiều trường hợp trong Ch.3 §3.4.
**Quyết định:**
- Thêm 2 ảnh infographic mới (cùng pipeline Playwright đã có):
  `image/comparison/thuc-trang-chuoi-cung-ung.png` (8 stat-tile cho Ch.1
  Hình 1.1) và `image/comparison/ocop-2024-2025.png` (so sánh OCOP
  2024→2025 cho Ch.2 Hình 2.1). Nguồn HTML ở `tools/design/`.
- Ch.1 §1.1: rút gọn 4 đoạn văn xuống còn phần lập luận (vai trò thương
  lái, nguyên nhân, điểm đau Farmery can thiệp — chuyển (i)(ii)(iii) thành
  `itemize` thật), số liệu chi tiết chuyển hết vào Hình 1.1.
- Ch.2 §2.1.1: OCOP → 1 câu dẫn + Hình 2.1; 3 văn bản chính sách (749,
  NQ57, 5943) → `itemize`; VietGAP/GlobalGAP → `itemize` 2 mục.
- Ch.2 §2.1.2/2.1.3 (so sánh sàn trong/ngoài nước): cắt bớt số liệu chi
  tiết trong đoạn văn dẫn (đã trùng với thẻ so sánh dạng ảnh — xem quyết
  định "Bảng so sánh: dùng HTML → ảnh"), giữ lại phần diễn giải/bối cảnh
  không có trên ảnh (vd lịch sử đổi tên Postmart→Buudien.vn); mục 2.1.3
  chuyển hẳn sang `itemize` 4 mục thay vì 4 đoạn văn riêng.
- Ch.3 §3.1 (4 persona): tách "Nhu cầu"/"Khó khăn" thành `itemize` riêng
  thay vì 1 câu dài.
- Ch.3 §3.4 (5/6 quy trình nghiệp vụ): đoạn "Ngoại lệ" có từ 2 trường hợp
  trở lên → chuyển thành `itemize`, mỗi trường hợp 1 mục (trường hợp quản
  trị hệ thống chỉ có 1 ngoại lệ nên giữ nguyên dạng văn xuôi ngắn).
**Đánh đổi:** Không bullet hóa các đoạn lập luận/phân tích (vai trò hai mặt
của thương lái, research gap, lý thuyết SFSC/GS1/reputation...) — giữ văn
xuôi vì bullet hóa sẽ làm mất mạch lý luận, hội đồng thường đánh giá thấp
báo cáo bullet hóa quá đà. Build lại sạch, 45 trang.

### Đổi khung "mua lẻ/mua sỉ" sang "bán lẻ/bán sỉ" (góc nhìn nhà bán) + thêm luồng tiếp cận hệ thống + Phụ lục Điều khoản dịch vụ — 2026-09-15
**Bối cảnh:** User muốn quy trình nghiệp vụ trình bày theo góc nhìn nhà bán
(chủ thể chính đồ án phục vụ) thay vì góc nhìn người mua; muốn làm rõ luồng
nhà bán/người mua tiếp cận và tham gia hệ thống (liên hệ ai, thủ tục gì);
và muốn bổ sung nội dung kiểu Term of Service.
**Quyết định:**
- **Quy trình B2C/B2B đổi tên và thiết kế lại bắt đầu từ hành động nhà
  bán** (không chỉ đổi tên suông): "Quy trình mua lẻ (B2C)" →
  "Quy trình bán lẻ (B2C)" — bước 1 mới là nhà bán quản lý giá/tồn kho sản
  phẩm đã duyệt, bước cuối mới là nhà bán theo dõi doanh thu/lịch sử. "Quy
  trình mua sỉ (B2B)" → "Quy trình bán sỉ (B2B)" — bước 1 mới là nhà bán
  chủ động công bố bảng giá bán sỉ theo bậc/MOQ (thay vì bắt đầu bằng RFQ
  từ doanh nghiệp), doanh nghiệp tham chiếu bảng giá hoặc gửi RFQ tùy
  chỉnh, bước cuối mới là nhà bán theo dõi doanh thu bán sỉ.
- 2 flowchart TikZ tương ứng được vẽ lại: `flowcharts/03-mua-le.tex` →
  `flowcharts/03-ban-le.tex` (label `fig:flow-ban-le`), `flowcharts/04-mua-si.tex`
  → `flowcharts/04-ban-si.tex` (label `fig:flow-ban-si`) — file cũ chuyển
  vào `_archive-old-tex/`. Đã kiểm tra render bằng `pdftoppm` (trang 31 và
  33 của `main.pdf`), không có node/mũi tên chồng lấn.
- **Giữ nguyên** các tên actor "Người mua lẻ (B2C)"/"Người mua sỉ (B2B)"
  ở mục 3.1 (persona) và 3.5 (luồng vận hành) — đây là tên người mua (đúng
  bản chất), chỉ tên QUY TRÌNH đổi góc nhìn, không đổi tên actor.
- Thêm **mục 3.2 mới "Luồng tiếp cận và tham gia hệ thống"**
  (`sec:luongtiepcan`) mô tả kênh tiếp cận, đầu mối liên hệ, thủ tục và kết
  quả (vai trò RBAC được gán) cho cả 4 nhóm người dùng — đặt ngay sau mục
  phân tích người dùng (3.1), trước yêu cầu chức năng.
- Mỗi persona ở mục 3.1 được bổ sung dòng "Vai trò hệ thống (RBAC)" nêu
  tên role kỹ thuật (`seller`, `buyer_retail`, `buyer_wholesale`, `admin`)
  để nhất quán với mục 3.2 mới.
- Thêm **Phụ lục D — Điều khoản dịch vụ (Terms of Service)** vào
  `backmatter/phuluc.tex`: 11 điều khoản (phạm vi áp dụng, tài khoản/vai
  trò, quyền-nghĩa vụ nhà bán, quyền-nghĩa vụ người mua, phí dịch vụ,
  thanh toán/escrow, đổi trả-hoàn tiền, kiểm duyệt-xử lý vi phạm, sở hữu
  trí tuệ/dữ liệu, giới hạn trách nhiệm, thay đổi điều khoản) — soạn dựa
  trên các quy trình đã có ở Ch.3, đánh dấu TODO ở Điều 5 (mức phí cụ thể)
  vì chưa có số liệu thật.
**Đánh đổi:** Không đổi các cụm "mua lẻ/mua sỉ" khi chúng mô tả HÀNH VI
hoặc DANH TÍNH của người mua (vd "khách mua lẻ", "2 tệp khách hàng... mua
lẻ và... mua sỉ" ở Ch.2 lý thuyết B2B2C) — chỉ đổi khi cụm từ đó là TÊN
QUY TRÌNH/TÍNH NĂNG (Ch.1 mục tiêu/phạm vi, Ch.3 tiêu đề mục 3.4.3/3.4.4,
Ch.4 tên module). Build lại sạch, 47 trang.

### Fix tràn trang 2 flowchart bán lẻ/bán sỉ — 2026-09-15
**Bối cảnh:** Sau khi vẽ lại 2 flowchart theo góc nhìn nhà bán (thêm node),
chiều cao vượt `\textheight`, LaTeX cảnh báo "Float too large for page" và
hiển thị tràn ra ngoài trang.
**Quyết định:** Bọc mỗi `tikzpicture` trong `\resizebox{!}{\dimexpr\textheight-2cm\relax}{...}`
(graphicx đã có sẵn) để tự co theo chiều cao trang, giữ tỉ lệ. Áp dụng cho
cả `03-ban-le.tex` và `04-ban-si.tex`. Build lại không còn cảnh báo
"Float too large".
**Đánh đổi:** Không tách thành 2 trang/2 hình nhỏ hơn vì sẽ phá vỡ tính
liền mạch của luồng quy trình; co theo `\resizebox` đơn giản hơn và không
cần tính lại tọa độ node.

### Bổ sung 5 mảng nội dung lớn: ToS mở rộng, business model, đánh giá SP/nhà bán, đào sâu AI/chatbot, kho bãi & 3PL — 2026-09-15
**Bối cảnh:** User yêu cầu bổ sung 5 mảng nội dung còn thiếu, rải đúng chỗ
trong toàn báo cáo. Do khối lượng lớn, đã lập kế hoạch trước qua plan mode
(lưu tại `C:\Users\nghia\.claude\plans\delightful-floating-candle.md`) và
chốt 3 quyết định phạm vi với user trước khi thực hiện: (1) kho bãi theo
mô hình nhà bán tự quản lý + Farmery chỉ điều phối 3PL, không vận hành kho
vật lý; (2) quy trình đánh giá có flowchart TikZ riêng; (3) AI/chatbot đào
sâu cả lý thuyết Ch.2 lẫn thiết kế Ch.3.
**Quyết định:**
- **references.bib**: thêm 5 entry — `osterwalder2010bmc` (Business Model
  Canvas), `su2009collaborative` (collaborative filtering), `hyndman2021forecasting`
  (time-series forecasting), `chandola2009anomaly` (anomaly detection),
  `jurafsky2023dialogue` (dialogue systems/chatbot) — đều là nguồn kinh
  điển/sách giáo khoa quen thuộc, không cần xác minh online (giống cách đã
  làm với Akerlof/Sandhu trước đó).
- **Ch.2**: thêm 2 subsection mới trong §2.2 — "Mô hình doanh thu marketplace"
  (`subsec:businessmodel`) và "Quản lý tồn kho hàng dễ hư hỏng và phối hợp
  3PL" (`subsec:khobai`, giới thiệu nguyên tắc FEFO). §2.3 (AI) được gắn
  trích dẫn học thuật cho cả 4 mô-đun.
- **Ch.3**: thêm §3.3 "Phân tích mô hình kinh doanh" (`sec:businessmodelcanvas`,
  có ảnh Business Model Canvas riêng cho Farmery); thêm subsection "Đánh
  giá sản phẩm và nhà bán" (`subsec:danhgianghiepvu`) trong mục quy trình
  nghiệp vụ, kèm **flowchart TikZ mới thứ 7** (`flowcharts/07-danh-gia.tex`,
  label `fig:flow-danh-gia` — đã bọc `\resizebox` ngay từ đầu, không bị
  tràn trang); đổi tên + mở rộng mục vận chuyển thành "Quản lý tồn kho, vận
  chuyển hàng dễ hư hỏng và xử lý khiếu nại" (thêm đoạn FEFO/đồng bộ tồn
  kho đa kênh); viết lại §3.10 (Thiết kế mô-đun AI) thành 2 subsection:
  luồng dữ liệu tổng thể 5 bước (thu thập→tiền xử lý→huấn luyện/suy
  luận→phục vụ→phản hồi) và kiến trúc chatbot riêng (nhận diện ý định, cơ
  sở tri thức, sinh phản hồi/escalation).
- **Phụ lục D** mở rộng: thêm "Định nghĩa thuật ngữ" ở đầu; Điều 5 (phí)
  tham chiếu ngược Business Model Canvas thay vì để trống hoàn toàn; thêm
  2 Điều mới — Điều 11 (Chấm dứt/tạm ngừng dịch vụ) và Điều 12 (Giải quyết
  tranh chấp: thương lượng → hòa giải → pháp luật VN) — Điều "Thay đổi
  điều khoản" dịch thành Điều 13.
- **Ch.1**: thêm `\label{sec:phamvi}`; cập nhật "sáu quy trình chính" →
  "bảy quy trình chính" (thêm đánh giá); phạm vi giới hạn bổ sung rõ
  "không vận hành kho bãi vật lý, chỉ điều phối 3PL".
- **Ch.4**: thêm 2 subsection TODO mới — "Module đánh giá & uy tín" và đổi
  "Module vận chuyển & khiếu nại" thành "Module quản lý tồn kho & vận
  chuyển/khiếu nại".
- Ảnh mới qua pipeline Playwright: `image/comparison/business-model-canvas.png`
  (nguồn `tools/design/business-model-canvas.html`).
**Đánh đổi:** Không thêm actor "đơn vị vận hành kho" mới (theo quyết định
phạm vi 3PL). Không đưa SLA cụ thể (thời gian xử lý khiếu nại, thời gian
xác minh B2B) vào Phụ lục D vì chưa có số liệu vận hành thật — đánh dấu
TODO thay vì bịa số. Build lại sạch, 52 trang, không "Float too large"
(đã render riêng flowchart mới bằng `pdftoppm` để xác nhận không chồng
lấn), không undefined reference.

### Tự động tách bullet cho mọi nội dung mới, không chỉ khi được yêu cầu — 2026-09-15
**Bối cảnh:** Ngay sau khi xem 4 đoạn văn mới (mô hình doanh thu, kho
bãi/3PL, pipeline AI, định nghĩa thuật ngữ ToS) ở dạng văn xuôi dày, user
nhắc "luôn áp dụng cách trình bày tách bulleting và ảnh nếu cần thiết" —
lần thứ 2 trong phiên này (lần đầu là yêu cầu rà lại nội dung cũ).
**Quyết định:** Coi đây là preference đứng (standing), không phải yêu cầu
một lần — đã lưu thành memory `feedback_bullet_and_visuals.md` (ngoài
project, tại `~/.claude/projects/d--DACN261-ver2DACN-DATN/memory/`) để tự
áp dụng cho mọi nội dung viết thêm sau này mà không cần user nhắc lại. Đã
tách bullet ngay 3 đoạn (mô hình doanh thu ở Ch.2, pipeline AI 5 bước ở
Ch.3, định nghĩa thuật ngữ ở Phụ lục D); giữ nguyên văn xuôi đoạn 3PL vì là
lập luận ưu điểm→đánh đổi→quyết định, không phải liệt kê phẳng.
**Đánh đổi:** Không bullet hóa mù quáng mọi đoạn — vẫn giữ nguyên tắc từ
quyết định trước ("Rà soát nội dung Ch.1-3...") là chỉ bullet đoạn liệt kê
phẳng, giữ văn xuôi cho đoạn lập luận có mạch nhân-quả.

### Áp dụng quy trình quản lý tài liệu chung (DECISIONS/NOTES/INDEX) — 2026-09-15
**Bối cảnh:** User nhớ lại đã tổng quát hoá quy trình quản lý bộ tài liệu từ
dự án `ai4dental`/medbelai, lưu ở `~/.claude/templates/DOCUMENTATION-WORKFLOW.md`
và `~/.claude/CLAUDE.md`, muốn áp dụng cho dự án đồ án này.
**Quyết định:** Dùng 3 file `DECISIONS.md` (log quyết định, file này),
`NOTES.md` (việc đang mở), `INDEX.md` (chỉ mục file/thư mục) — bỏ qua
`RELEASE-NOTES.md` và `<OPS>-NOTES.md` vì dự án không có hạ tầng
vận hành/release thật, chỉ là tài liệu LaTeX.
**Đánh đổi:** Không dùng `README.md` riêng vì mục đích tương đương đã có ở
`INDEX.md` + phần "Cấu trúc báo cáo" trong Ch.1.

### Mô hình kinh doanh hai luồng: sàn bán sỉ (3P) + bán lẻ tự thu mua (1P) — 2026-09-23
**Bối cảnh:** Báo cáo cũ mô tả Farmery thuần marketplace nhiều người bán,
phục vụ song song B2C và B2B nhưng nhà bán tự bán ở cả hai kênh. User chỉ ra
mô hình đang thiên hẳn về B2B và yêu cầu khảo sát thêm hướng B2C kiểu "hệ
thống mua hàng từ người dùng rồi bán lại cho người khác".
**Quyết định:** Giữ song song hai luồng nhưng tách bạch ranh giới theo tiêu
chí *ai sở hữu hàng hóa trong lúc giao dịch*: luồng bán sỉ là marketplace 3P
(nhà cung cấp giữ hàng, Farmery ăn hoa hồng), luồng bán lẻ là 1P (Farmery mua
đứt theo lô, tự định giá, ăn chênh lệch). Lý do ghép được: nông dân/HTX thường
không đủ năng lực phân loại, đóng gói và xử lý từng đơn lẻ vài kg, nên 1P lấp
đúng khoảng trống đó; còn đơn sỉ khối lượng lớn thì giao thẳng hiệu quả hơn.
**Đánh đổi:** Farmery phải có vốn lưu động, chịu lỗ trực tiếp với mỗi lô không
bán hết, và vận hành hai mô hình kinh doanh trên cùng một hệ thống. Để đánh
đổi này chấp nhận được, phạm vi thí điểm bị thu hẹp về địa bàn.

### Nhóm người dùng: 5 nhóm, gộp vai trò quản trị 5 thành 3 — 2026-09-23
**Bối cảnh:** User yêu cầu tập trung trọng tâm vào sản phẩm và thay đổi lại
nhóm người dùng. Bản cũ có 4 nhóm với cách gọi "Nhóm B/Nhóm C" khó đọc, và
tách quản trị viên thành 5 vai trò con khá chi tiết so với trọng tâm đề tài.
**Quyết định:** Đổi thành 5 nhóm gọi theo tên nghiệp vụ: nhà cung cấp, khách
sỉ, khách lẻ, bộ phận thu mua (vai trò `ops_sourcing` mới, phát sinh từ luồng
1P), và quản trị viên. Vai trò quản trị gộp từ 5 xuống 3: `admin_moderator`
(kiểm duyệt và tuân thủ), `admin_ops` (vận hành, hỗ trợ, tồn kho), `admin`
(gộp quyền cho đội nhỏ).
**Đánh đổi:** Mất một phần chi tiết về phân công nội bộ, đổi lại phần mô tả
người dùng dồn trọng tâm vào các nhóm thực sự tạo ra giá trị của sản phẩm.

### Cắt phạm vi: bỏ phân quyền nội bộ DN, công nợ B2B, mô-đun AI phát hiện gian lận — 2026-09-23
**Bối cảnh:** Việc thêm luồng 1P làm tăng đáng kể khối lượng, trong khi đây là
đồ án chuyên ngành 15 tuần. User hỏi ý kiến nên giữ những gì.
**Quyết định:** Áp dụng nguyên tắc *cái gì không đánh giá được bằng số trong
điều kiện đồ án thì không đưa vào phạm vi* — nguyên tắc này được viết thẳng
vào mục Mục tiêu đánh giá ở Ch.1. Theo đó:
- Cắt xuống Ch.8: FR1.4 phân quyền nội bộ tài khoản doanh nghiệp (bài toán
  quản trị tổ chức, không đặc thù nông sản); công nợ B2B và hạn mức tín dụng
  (nghiệp vụ tài chính, không chứng minh luận điểm nào của đề tài).
- Giữ: thanh toán theo từng đợt giao; cơ chế tạm giữ tiền cho đơn sỉ (trả lời
  trực tiếp vấn đề V4 về niềm tin, hiện thực bằng máy trạng thái trên cổng
  thanh toán sandbox, viết trung thực là không phải ký quỹ pháp lý thật).
- AI từ 4 mô-đun xuống 3. Giữ gợi ý sản phẩm và trợ lý ảo (làm thật), dự báo
  giá (thử nghiệm ngoại tuyến trên dữ liệu công khai vì sàn chưa có dữ liệu).
  Hạ mô-đun phát hiện gian lận xuống luật ngưỡng cấu hình được, gọi đúng tên
  là luật ngưỡng chứ không gọi là AI, vì thiếu cả lưu lượng thật lẫn tập nhãn
  nên không đo được bằng số.
**Đánh đổi:** Báo cáo trông ít tính năng hơn, nhưng mọi thứ còn lại đều kiểm
chứng được — đổi bề rộng lấy khả năng bảo vệ.

### Phạm vi không gian và thời gian — 2026-09-23
**Bối cảnh:** Bản cũ hoàn toàn không nêu phạm vi không gian; user yêu cầu bổ
sung và chuyển cách viết phạm vi sang dạng giới thiệu.
**Quyết định:** Nguồn cung thí điểm tại Lâm Đồng, giao hàng lẻ trong TP.HCM
(cự ly khoảng 300 km, có xe lạnh chạy hằng ngày); đơn sỉ giao toàn quốc qua
đơn vị vận chuyển thứ ba. Thời gian: số liệu tham chiếu 2020-2026, dữ liệu
đánh giá là dữ liệu mô phỏng.
**Lý do:** Ràng buộc này xuất phát trực tiếp từ luồng 1P — vì nền tảng tự sở
hữu hàng nên mọi giờ hàng nằm trên đường đều là chi phí do chính nền tảng
gánh. Luồng bán sỉ không chịu ràng buộc này vì khối lượng lớn bù được chi phí
vận chuyển.

### Kiến trúc: khối đơn chia mô-đun, kèm 3 ràng buộc để sau này tách được — 2026-09-23
**Bối cảnh:** User hỏi liệu sau này có tách được sang microservice không.
**Quyết định:** Chọn khối đơn có chia mô-đun, tách riêng duy nhất dịch vụ AI.
Kèm ba ràng buộc thiết kế bắt buộc: RB1 ranh giới mô-đun theo miền nghiệp vụ
(không theo tầng kỹ thuật); RB2 mô-đun gọi nhau qua giao diện công khai; RB3
không kết nối bảng xuyên mô-đun. Biện pháp bảo đảm: mỗi mô-đun một lược đồ
riêng trong cùng một PostgreSQL.
**Lý do không chọn microservice:** nghiệp vụ khó nhất của hệ thống — chống bán
vượt tồn kho khi một lô được giao dịch đồng thời ở hai luồng — dựa vào giao
dịch có khóa dòng trong một cơ sở dữ liệu; tách ra phải thay bằng giao dịch bù
trừ, phức tạp hơn nhiều mà gần như không được gì. Thứ tự tách nếu về sau cần
(trang truy xuất QR, rồi thông báo, rồi tìm kiếm) được viết vào Ch.8.

### Chọn PostgreSQL làm mắt xích công nghệ trung tâm — 2026-09-23
**Quyết định:** PostgreSQL gom được bốn nhu cầu mà nếu chọn khác phải dựng bốn
hạ tầng riêng: giao dịch có khóa dòng (chống bán vượt tồn kho), dữ liệu không
gian (vùng trồng, bán kính giao hàng), tìm kiếm vector (cơ sở tri thức trợ lý
ảo), và JSON có chỉ mục (nhật ký canh tác khác trường giữa các loại cây).
Kéo theo: chưa dùng Elasticsearch (tìm kiếm toàn văn sẵn có đủ cho quy mô mục
tiêu), chưa dùng vector database riêng.
**Nguyên tắc nền:** giảm tối đa số thành phần hạ tầng phải vận hành — mỗi
thành phần thêm vào đều kéo theo chi phí cài đặt, giám sát và đồng bộ.
**Lưu ý:** phần back-end framework (NestJS) là đề xuất, cần nhóm xác nhận lại
theo ngôn ngữ nhóm thực sự quen; PostgreSQL thì nên giữ bất kể.

### Trình bày: bảng dài xuống phụ lục, BMC tách 3 cụm dọc, bỏ từ MVP — 2026-09-23
**Bối cảnh:** User phản ánh bảng chiếm chỗ trong báo cáo, một số bảng thừa
khoảng trống phía dưới và chữ nhỏ, BMC đặt ngang phải xoay màn hình mới đọc
được, chú giải ký hiệu ở bảng so sánh bị lặp 2 lần.
**Quyết định:**
- Tách 7 phụ lục mới (F đến L) chứa toàn bộ bảng dài; thân báo cáo giữ tóm tắt
  và trỏ tới phụ lục. Mỗi phụ lục là một file `.tex` riêng trong `backmatter/`.
- BMC bỏ `sidewaysfigure`, tách thành 3 cụm dọc (tạo giá trị cho ai, làm thế
  nào, tiền vào tiền ra); canvas 9 ô đầy đủ chuyển xuống Phụ lục E.
- Bỏ toàn bộ từ "MVP" (8 vị trí cộng dòng trong danh mục từ viết tắt), thay
  bằng cách diễn đạt theo phạm vi đồ án.
- Tách Shopee và Lazada thành 2 cột hoặc 2 thẻ riêng trong các hình so sánh.
**Nguyên nhân gốc của lỗi chú giải lặp ký hiệu:** class `.badge` trong
`research-gap.html` đã sinh ký tự bằng `::before`, mà legend lại gõ thêm ký tự
vào trong span nên render ra ký tự kép. Đã bỏ ký tự gõ tay trong legend.
**Nguyên nhân gốc của lỗi thừa khoảng trắng dưới bảng:** script render đặt
viewport cao cố định 800px rồi chụp `fullPage`; khi nội dung thấp hơn, ảnh vẫn
lấy trọn viewport và sinh nền trắng thừa. Đã sửa ở gốc — script nay đo cả
chiều cao nội dung thật, áp dụng cho mọi ảnh chứ không riêng ảnh mới.

### Điều khoản dịch vụ viết để đọc độc lập — 2026-09-23
**Bối cảnh:** User yêu cầu bỏ việc chèn thuật ngữ kỹ thuật như escrow, lẻ-sĩ
vào Điều khoản dịch vụ.
**Quyết định:** Viết lại toàn bộ Phụ lục D (11 điều thành 15 điều), bỏ khối
"Định nghĩa thuật ngữ" mang tính kỹ thuật, bỏ mọi mã vai trò RBAC, mã FR và
tham chiếu chéo vào thân báo cáo. "Escrow" đổi thành "tiền được đơn vị trung
gian thanh toán được cấp phép giữ lại"; cặp "bán lẻ/bán sỉ" đổi thành "giao
dịch với người tiêu dùng" và "giao dịch số lượng lớn". Bổ sung 2 điều mới: quy
định hàng hóa được phép đăng bán, và phân định trách nhiệm giữa hàng do nhà
cung cấp bán với hàng do Farmery mua lại rồi bán.
**Lý do:** ToS là văn bản pháp lý dành cho người dùng cuối, phải đọc được mà
không cần đọc báo cáo; tham chiếu chéo vào mục của báo cáo khiến nó vô nghĩa
khi tách ra dùng thật.

### Bỏ Phiếu nhiệm vụ đồ án chuyên ngành khỏi báo cáo — 2026-09-23
**Quyết định:** Gỡ `\input{frontmatter/phieunhiemvu}` khỏi `main.tex`, giữ lại
dòng `\pagenumbering{roman}` vốn nằm chung khối đó. File `phieunhiemvu.tex`
vẫn còn trong repo phòng khi cần dùng lại. Đồng thời bổ sung Chương 1 vào mục
Cấu trúc báo cáo, trước đây chỉ liệt kê Ch.2 đến Ch.8.

### Lưu ý kỹ thuật: build bằng biber, không phải bibtex — 2026-09-23
**Bối cảnh:** `INDEX.md` cũ ghi quy trình build là `pdflatex` rồi `bibtex`.
Chạy `bibtex` sinh ra 37 cảnh báo citation không phân giải được.
**Nguyên nhân:** dự án dùng `\usepackage[style=ieee,backend=biber]{biblatex}`
với `\parencite`, nên phải chạy `biber` chứ không phải `bibtex`.
**Đã sửa:** ghi đúng quy trình vào `INDEX.md`.

### Ưu tiên thuật ngữ tiếng Anh trong thân báo cáo, trừ Điều khoản dịch vụ — 2026-09-23
**Bối cảnh:** Ở đợt sửa trước, nhiều thuật ngữ kỹ thuật đã bị Việt hóa (row-level
locking thành "giao dịch có khóa dòng", SSR thành "kết xuất phía máy chủ", RAG
thành "truy hồi tri thức", modular monolith thành "khối đơn có chia mô-đun"...).
User yêu cầu đảo lại: ưu tiên để nguyên tiếng Anh.
**Quyết định:** Trong thân báo cáo và các phụ lục kỹ thuật, dùng thuật ngữ tiếng
Anh làm chính, kèm chú giải tiếng Việt ở lần xuất hiện đầu khi cần. Đã thay 131
vị trí. Bổ sung vào danh mục từ viết tắt: 1P, 3P, LLM, RAG, SSR.
**Ngoại lệ:** `backmatter/phuluc-tos.tex` (Điều khoản dịch vụ) giữ nguyên tiếng
Việt thuần, không có thuật ngữ kỹ thuật — nhất quán với quyết định trước đó là
ToS phải đọc độc lập được bởi người dùng cuối.

### Cỡ chữ trong hình: tính theo tỉ lệ px trên bề rộng thiết kế — 2026-09-23
**Bối cảnh:** User phản ánh một số ảnh có chữ quá nhỏ.
**Nguyên nhân gốc:** ảnh được ép về `\textwidth` (16cm) khi chèn, nên cỡ chữ thực
tế in ra phụ thuộc tỉ lệ `font_px / body_width_px`, không phụ thuộc độ phân giải
ảnh. Đo lại thì ma trận research gap chỉ còn 3,8pt và hai hình so sánh sàn còn
3,9pt — so với chữ báo cáo 12pt.
**Quyết định:** Chuẩn hóa mục tiêu tối thiểu khoảng 7pt cho chữ nhỏ nhất và 8--9pt
cho chữ chính. Đã phóng cỡ chữ theo từng file (research gap ×2,3; so sánh sàn
×1,8; BMC cụm ×1,45), đồng thời rút gọn nhãn trong ô của ma trận research gap để
ô không bị vỡ khi chữ to lên, và đổi badge từ bo tròn hoàn toàn sang bo góc 14px
để badge nhiều dòng không phình thành hình bầu dục.
**Cách kiểm tra lại về sau:** cỡ chữ in ra (pt) = font_px × 16 / body_width_px ×
28,45. Giữ con số này ở mức tối thiểu 7pt khi sửa bất kỳ file HTML nào trong
`tools/design/`.

### Lưu đồ: thêm quy trình thu mua, sửa luồng bán lẻ theo mô hình 1P — 2026-09-23
**Bối cảnh:** Sau khi đổi sang mô hình hai luồng, các lưu đồ TikZ vẫn vẽ theo mô
hình cũ (nhà bán trực tiếp bán cho người tiêu dùng).
**Quyết định:** Thêm `flowcharts/08-thu-mua.tex` cho quy trình thu mua 1P (nhãn
`fig:flow-thu-mua`), đặt ngay trước hai lưu đồ bán lẻ để đúng thứ tự nghiệp vụ.
Sửa `03-ban-le.tex` và `03b-ban-le-giao-nhan.tex`: bên bán là Farmery, hàng lấy từ
kho đã thu mua, bước trừ tồn kho nêu rõ dùng transaction có row-level lock, và
trách nhiệm đổi trả thuộc về Farmery. Tổng số quy trình nghiệp vụ từ 7 lên 8 —
đã sửa đồng bộ các chỗ đếm số ở Ch.4 và Ch.5.

### So sánh thể hiện bằng bảng LaTeX thay vì ảnh — 2026-09-23
**Bối cảnh:** User yêu cầu ưu tiên thể hiện so sánh dưới dạng bảng, và phản ánh
hình Business Model Canvas ở phụ lục hiển thị không tốt.
**Quyết định:** Chuyển toàn bộ 4 nội dung so sánh từ ảnh HTML sang bảng LaTeX:
so sánh sàn trong nước, so sánh nền tảng quốc tế, ma trận research gap (Ch.3), và
Business Model Canvas đầy đủ (Phụ lục E).
**Lý do:** bảng LaTeX dùng chính cỡ chữ của báo cáo nên không còn bài toán chữ
quá nhỏ vốn phát sinh khi ép ảnh về `\textwidth`; đồng thời gọn hơn nhiều --- ma
trận research gap từ chiếm trọn một trang xuống còn khoảng một phần ba trang.
Bảng cũng tra cứu và sửa được trực tiếp, không phải render lại.
**Đã dọn theo:** xoá 4 file HTML và 4 file PNG không còn dùng, gỡ khỏi script
render. `tools/design/` nay chỉ còn 5 file: thực trạng chuỗi cung ứng, OCOP và 3
cụm BMC --- đều là infographic thật sự cần đồ họa, không phải bảng so sánh.

### Sửa lỗi đánh số hình/bảng ở phần sau Chương 8 — 2026-09-23
**Vấn đề phát hiện:** toàn bộ 14 bảng trong phụ lục bị đánh số nối tiếp Chương 8
(``Bảng 8.1`` đến ``Bảng 8.14``), và hình trong phụ lục thành ``Hình 8.1`` ---
trong khi Chương 8 là Tổng kết và không có hình bảng nào. Nguyên nhân: phụ lục
dùng `\chapter*` nên không đặt lại bộ đếm.
**Quyết định:** Trong `main.tex`, đặt lại bộ đếm và đổi tiền tố ngay trước phần
kết thúc: `KH.` cho Kế hoạch thực hiện, `PL.` cho Phụ lục. Nay ra ``Bảng PL.1``,
``Bảng KH.1`` --- đọc là biết thuộc phần nào.

### Thu hẹp khoảng trắng quanh hình và bảng — 2026-09-23
**Quyết định:** Đặt lại các tham số float trong preamble: `\intextsep` 8pt,
`\textfloatsep` 10pt, `\floatsep` 8pt, `\abovecaptionskip` 5pt,
`\belowcaptionskip` 2pt. Mặc định của lớp `report` rộng gấp đôi, gây cảm giác
trang bị loãng ở những chỗ có nhiều hình liên tiếp như mục lưu đồ quy trình.

### Ghép commit của thành viên khác và xử lý số liệu đánh giá chưa đo — 2026-09-23
**Bối cảnh:** Commit `3e8a115` của dungpham2005 bổ sung customer persona, customer
journey, ma trận Priority/Feasibility/Testability cho FR và NFR, yêu cầu dữ liệu, và
một Chương 7 hoàn chỉnh với số liệu cụ thể. Commit này đụng đúng hai file đang sửa
nặng trong phiên.
**Kết quả rà soát trước khi ghép:**
- Mã FR/NFR: 35 mã được trích dẫn, chỉ 2 mã gãy (FR7.4, FR12.4). Nguy hiểm hơn là
  FR12.3 vẫn tồn tại nhưng đã đổi nghĩa, nên trích dẫn sai mà LaTeX không báo lỗi.
- 18 chỗ còn bám mô hình 3P cũ: split-order đa shop, công nợ Net 15/Net 30, thành
  viên nội bộ doanh nghiệp.
- Chương 7 có 10/10 chỉ số đều đạt ngưỡng, trong đó một phép tính không khớp (CTR
  8,4% so với 6,6% cho ra 27,3% chứ không phải 26,5% như ghi), và MAPE 16,8% tức
  vượt cả công trình đối chứng Farm2Market. Trong khi đó Chương 6 Hiện thực còn 15
  dòng TODO và 0 dòng nội dung thật.
**Quyết định (user xác nhận số liệu là dự kiến, chưa đo):**
- Giữ toàn bộ phương pháp và công cụ đánh giá họ chọn (k6, SUS, Lighthouse, kiểm thử
  tranh chấp, security audit) vì đều là lựa chọn hợp lý; chuyển Chương 7 về dạng mô
  tả phương pháp kèm ô trống chờ điền, bỏ hết số liệu chưa đo.
- Bổ sung vào phần kết chương lời nhắc phải nêu cả chỉ số chưa đạt ngưỡng --- đây là
  phần hội đồng quan tâm hơn danh sách chỉ số đã đạt.
- Ghép đủ 4 khối nội dung ở Chương 4, sửa cho khớp mô hình hai luồng, thêm persona
  thứ tư cho bộ phận thu mua (luồng 1P) vốn họ chưa có.
**Cách làm git:** commit toàn bộ việc của phiên trước (3 commit), rồi merge để giữ
quyền tác giả của họ trong lịch sử, thay vì chép tay.

### Bỏ mô-đun trợ lý ảo khỏi phạm vi — 2026-09-23
**Quyết định:** AI từ 3 mô-đun xuống 2, chỉ còn gợi ý sản phẩm và dự báo giá.
**Hệ quả đã xử lý đồng bộ:** bỏ mục lý thuyết chatbot ở Ch.2; bỏ FR12.3 và sửa
NFR6.2 (đổi từ trợ lý ảo sang kênh hỗ trợ trực tiếp từ đội vận hành); bỏ phần đối
sánh LLM/RAG và mục kiến trúc chatbot ở Ch.5; bỏ dòng ngưỡng chatbot ở Phụ lục L và
dòng đối sánh ở Phụ lục I; bỏ cơ sở tri thức chatbot khỏi yêu cầu dữ liệu; bỏ LLM,
RAG, NLP khỏi danh mục từ viết tắt.
**Ảnh hưởng tới lập luận chọn PostgreSQL:** trước đây PostgreSQL được chọn vì gom
được bốn nhu cầu, trong đó có vector search phục vụ RAG của chatbot. Bỏ chatbot thì
nhu cầu đó biến mất, nên lập luận rút còn ba nhu cầu: transaction có row-level
locking, dữ liệu không gian, và JSON có chỉ mục. Lập luận vẫn đứng vững vì
row-level locking mới là lý do cốt lõi.

### Kế hoạch thực hiện viết lại theo hai giai đoạn có mốc ngày thật — 2026-09-23
**Bối cảnh:** Bản cũ là nháp 15 tuần đánh số chung chung, không có ngày, không
phản ánh việc đồ án chia hai đợt nộp, và đã lệch thực tế --- tuần 3--4 theo kế
hoạch lẽ ra xong phần thiết kế nhưng tới 23/9 vẫn còn nguyên bảy hạng mục.
**Quyết định (user chốt):**
- Hai mốc là nộp giữa kỳ 15/10/2026 và nộp cuối kỳ 31/12/2026, cả hai đều thuộc
  môn Đồ án chuyên ngành CO4029 này. Đổi tiêu đề từ "Kế hoạch thực hiện Đồ án tốt
  nghiệp" thành "Kế hoạch thực hiện" cho đúng.
- Một bảng duy nhất bao trọn từ 23/9 tới 31/12, chia hai dải giai đoạn, mỗi tuần
  có khoảng ngày cụ thể.
- Bỏ hẳn cột "Phụ trách".
**Cách phân bổ:** giai đoạn 1 ba tuần dành cho phần thiết kế còn dang dở cộng
dựng nền hệ thống; giai đoạn 2 mười một tuần cho hiện thực, kiểm thử, đánh giá.
Cột "Kết quả" ghi rõ mục nào trong báo cáo được hoàn thiện, để tiến độ truy được
về nội dung cụ thể thay vì chỉ là mô tả công việc.
**Bổ sung phần rủi ro tiến độ:** nêu thẳng giai đoạn 2 phải làm tám module nghiệp
vụ và hai mô-đun AI trong mười một tuần, kèm hai biện pháp đã chuẩn bị --- thứ tự
hiện thực bám mức độ ưu tiên MoSCoW ở Phụ lục M (nếu thiếu thời gian thì cắt nhóm
Could), và xếp module khó nhất (chống bán vượt tồn kho) vào tuần 6--7 thay vì cuối
kỳ. Ghi rõ tuần 14 không có dự phòng nên chậm trễ phải xử lý ngay trong tuần phát
sinh.
**Sửa đồng bộ:** mục Phạm vi thời gian và mục Cấu trúc báo cáo ở Chương 1 trước
đây đều nhắc "kế hoạch mười lăm tuần", nay đổi theo hai mốc ngày thật.

### Lập luận blockchain: bỏ căn cứ chi phí, chuyển sang căn cứ rào cản người dùng — 2026-09-24
**Bối cảnh:** Nhánh của thành viên khác đưa vào `chapters/_incoming/` một bản mở
rộng cho `subsec:gs1blockchain` kèm năm nguồn mới. Rà soát từng nguồn thì bốn
trong năm khẳng định sai hoặc không kiểm chứng được: Walmart/IBM là truy xuất
**xoài** từ **bảy ngày** xuống 2,2 giây chứ không phải rau lá xanh từ hơn sáu
ngày; TE-FOOD xử lý 12.000 heo/ngày chứ không phải 18.000, và câu "garbage in,
garbage out" gán cho TE-FOOD không tìm được nguồn; nghiên cứu Thái Lan 2025 được
viện dẫn để nói blockchain đắt, trong khi chính nó kết luận blockchain rẻ hơn
khoảng 43%; khẳng định lấy từ Longo 2020 không xác nhận được.
**Quyết định:** Không merge file `_incoming/nghien-cuu-blockchain.tex`. Thay vào
đó tự viết ba đoạn nối sau đoạn thứ ba của `subsec:gs1blockchain`, chỉ dùng ba
nguồn đã kiểm chứng đầy đủ (case study Hyperledger về Walmart; Pongnumkul và cộng
sự 2025; Garg và cộng sự 2025).
**Thay đổi về lập luận:** trước đây đoạn kết nói blockchain "chỉ đáng cân nhắc
khi lợi ích phi tập trung vượt **chi phí vận hành**" --- căn cứ này đã bị chính
nguồn Thái Lan bác bỏ. Nay báo cáo **nêu thẳng rằng chi phí không phải lý do**,
và đặt căn cứ vào hai thứ khác: blockchain không xác minh được dữ liệu đầu vào,
và ba rào cản hàng đầu theo Garg 2025 --- trong đó "thiếu hạ tầng số" trùng khít
với đặc điểm nhóm nhà cung cấp tại `sec:doituongnguoidung`.
**Lý do:** thừa nhận một bằng chứng ngược lại rồi vẫn giữ được kết luận thì lập
luận vững hơn là né bằng chứng đó; đồng thời chặn trước câu phản biện "blockchain
bây giờ đâu còn đắt" khi bảo vệ.
**Đánh đổi:** dài thêm hai trang ở Chương 2 vừa mới rút gọn, đổi lấy một lập luận
không thể bị lật bằng một lần tra nguồn.

### Phóng cỡ chữ sơ đồ use case và đổi cách đặt hình gần trọn trang — 2026-09-24
**Bối cảnh:** Năm sơ đồ use case in ra chỉ 3,2--4,0pt so với thân bài 12pt, gần
như không đọc được. Nguyên nhân là tỉ lệ `font_px / body_width_px`: ảnh rộng
1360--1620px luôn bị ép về 16cm.
**Quyết định:** giữ nguyên trục ngang, chỉ nhân cỡ chữ và trục dọc --- hình hẹp
lại và cao lên, tận dụng chiều cao trang vốn đang bỏ trống. Cả năm hình nay đạt
~7pt. Riêng sơ đồ tổng quan được viết lại hẳn theo bố cục hai cột.
**Lý do không chọn cách khác:** phóng đều mọi kích thước không đổi được gì vì tỉ
lệ giữ nguyên; xoay ngang trang chỉ được 1,34 lần và người dùng đã bác cách trình
bày nằm ngang từ trước.
**Hệ quả về bố cục:** hình cao 18--20cm không vừa `[H]`, bị đẩy sang trang sau và
bỏ lại 2/3 trang trắng. Đổi sang `[p]` (trang float riêng) kèm `adjustbox` chặn
chiều cao theo `\textheight-2.5cm`. Phần chữ nay chạy liên tục, báo cáo bớt một
trang dù hình to hơn hẳn.
**Sửa kèm:** thống nhất tên tác nhân trong hình theo báo cáo (Nhà cung cấp, Khách
lẻ, Khách sỉ --- trước đó hình ghi Nhà bán, Người mua lẻ, Người mua sỉ trong khi
caption đã dùng tên mới); bỏ số hình giữ chỗ "Hình 5.y/5.z" ở chân các hình; thêm
`\captionsetup{justification=centering}` để caption dài hơn một dòng được căn giữa
thay vì canh đều.

### Nhận đặc tả use case và vẽ lại sơ đồ tổng quan cho khớp phạm vi — 2026-09-24
**Bối cảnh:** `_incoming/dac-ta-usecase.tex` có phần chữ đã đúng phạm vi mới
(có `ops_sourcing`, luồng 1P, actor AI chỉ còn FR12.1/FR12.2), nhưng năm ảnh
PNG đi kèm vẫn vẽ theo phạm vi cũ.
**Quyết định:** nhận file đặc tả, vẽ lại `usecase-overview.html` trước khi ghép.
Bốn sơ đồ chi tiết còn lại kiểm tra thì đã đúng --- riêng `usecase-quan-tri-vien`
đã vẽ đúng hai vai trò chuyên trách cộng generalization từ `admin`, nên cảnh báo
"cần vẽ lại" trong file `.tex` là cảnh báo cũ chưa dọn.
**Bốn sửa đổi trên sơ đồ tổng quan:**
- Bỏ use case trợ lý ảo (chatbot) --- chức năng đã cắt khỏi phạm vi.
- Chuyển "phát hiện bất thường" khỏi gói AI sang gói quản trị và đổi tên thành
  "giám sát bất thường theo luật ngưỡng", đúng với quyết định hạ cấp ngày 23/9:
  năng lực vẫn còn nhưng thuộc FR10/NFR9.1, không phải FR12.
- Thêm actor Bộ phận thu mua (`ops_sourcing`) và hai use case thu mua 1P vào gói
  giao dịch; gói này đổi tên thành "Giao dịch, thu mua & thanh toán".
- Sửa nhãn actor quản trị viên từ "2 vai trò" thành "3 vai trò".
**Dọn khi ghép:** bỏ toàn bộ khối comment bàn giao, cảnh báo RBAC lỗi thời, và
câu "khác với giả định ban đầu về 5 vai trò admin" --- lịch sử nội bộ không thuộc
về văn bản báo cáo.
**Còn lại:** mới đặc tả chi tiết 6 trong số hơn 45 use case đã liệt kê; nếu cần
đặc tả đầy đủ thì làm tiếp theo đúng mẫu bảng hiện có.

### Sửa số vai trò quản trị còn sót ở NFR2.1 — 2026-09-24
**Bối cảnh:** Quyết định ngày 23/9 gộp vai trò quản trị từ 5 xuống 3, nhưng NFR2.1
ở Chương 4 vẫn còn hai chỗ ghi "5 vai trò", khiến chương tự mâu thuẫn với Bảng 4.2
của chính nó.
**Quyết định:** sửa thành "ba vai trò đã thiết kế" và "hai vai trò chuyên trách
cộng một vai trò gộp quyền".
**Ghi chú:** một bản rà soát từ nhánh khác cũng báo `phuluc-matran.tex` FR1 ghi
"5 nhóm người dùng" là tàn dư --- kiểm lại thì **không phải lỗi**, hệ thống thật
sự có năm nhóm người dùng. Giữ nguyên.
