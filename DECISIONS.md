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
