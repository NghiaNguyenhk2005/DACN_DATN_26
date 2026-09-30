# NOTES.md — Việc đang mở / chưa chốt

Mỗi mục có `Status: open` hoặc `resolved`. Khi chín thành quyết định chính
thức, chuyển nội dung sang `DECISIONS.md` và đánh dấu resolved ở đây.

---

### Cài Playwright cục bộ để tự động chụp bảng so sánh — Claude — 2026-09-15
Đã hoàn thành — xem chi tiết ở `DECISIONS.md` ("Bảng so sánh: dùng HTML →
ảnh", phần "Hoàn thành 2026-09-15").
Status: resolved

### Rà soát nội dung Ch.1–3 theo tiêu chí "vừa đủ, tránh dư thừa" — Claude — 2026-09-15
Đã rà một lượt, tìm và sửa được:
1. Đoạn "kiến trúc phân lớp" ở Ch.2 (mục "Nền tảng công nghệ") và Ch.3 (mục
   3.6 "Thiết kế kiến trúc hệ thống") liệt kê lại gần y hệt 4 lớp
   (giao diện/API/dữ liệu/tích hợp bên thứ ba) — đã sửa Ch.3 chỉ tham chiếu
   ngược lại lý thuyết Ch.2 thay vì liệt kê lại.
2. Hai lý thuyết nêu tên tác giả/năm nhưng thiếu `\cite` — Akerlof (1970,
   "Market for Lemons") và Sandhu và cộng sự (1996, RBAC) — dễ bị hỏi vặn
   trong bảo vệ. Đã thêm `akerlof1970lemons`, `sandhu1996rbac` vào
   `references.bib` (trích dẫn kinh điển, không cần nguồn thứ cấp) và gắn
   `\cite` vào `chuong2-coso-lythuyet.tex`.
3. Đoạn trùng lặp "hệ thống đánh giá và uy tín" (2 đoạn gần giống nhau
   trong bản gốc) — xác nhận đã được gộp gọn thành 1 đoạn từ lần tái cấu
   trúc trước (2026-09-15, xem `DECISIONS.md`), không còn sót.

**Đã hoàn thành thêm (2026-09-15, tiếp theo):**
- Kiểm chứng lại 6 nguồn có số liệu "rủi ro cao" nhất bằng WebFetch trực
  tiếp vào URL trong `references.bib`: `tapchicongthuong_ipsard_2023_2024`
  (4-5 khâu trung gian, tăng giá 30-40%, chợ truyền thống 80%, bán lẻ hiện
  đại 15-20%, liên kết chuỗi 21,6%), `vilas_logistics` (85-90% qua trung
  gian nước ngoài, nông dân chỉ nhận 25% giá trị), `theleader_2024` (hao
  hụt trái cây 35-40%, phát biểu của ông Nguyễn Thanh Bình — Chủ tịch
  Vinafruit), `tuoitre_2026` (tổn thất rau quả 20-40%, thiệt hại 3,5-4,1 tỷ
  USD/năm, 117 kho lạnh chuyên nghiệp, 90% phục vụ đông lạnh thủy sản/thịt),
  `vietgap_globalgap` (VietGAP 70 tiêu chí, GlobalGAP 252 tiêu chuẩn với cơ
  cấu 36/127/89, mã GGN 13 chữ số), `vietnamnet_2025_ocop` (18.243 sản
  phẩm OCOP, cơ cấu sao, 9.820 chủ thể, cơ cấu chủ thể, % phụ nữ/dân tộc
  thiểu số). **Kết quả: toàn bộ số liệu khớp chính xác 100% với nguồn gốc
  — không có sai lệch nào cần sửa.**
- Rà văn phong toàn bộ 3 chương bằng cách grep các cụm từ mang tính
  "quảng cáo"/cường điệu (rất thuận lợi, rất phù hợp, lý tưởng, hoàn hảo,
  vượt trội, ưu việt, hàng đầu...). Chỉ tìm thấy 1 chỗ thực sự có vấn đề
  (2 chữ "rất" liên tiếp trong 1 đoạn ở Ch.2 §2.1.1 khi nói về mức độ phù
  hợp của chính sách OCOP với Farmery) — đã sửa. Các kết quả khác đều là
  dùng từ hợp lý trong ngữ cảnh (tên chính sách "đột phá", mô tả vị thế
  đàm phán "vượt trội" của thương lái — không phải tự khen Farmery).
Status: resolved

### Nội dung Ch.1 (mục tiêu/phạm vi/ý nghĩa) mới soạn nháp, cần nhóm rà lại — Claude — 2026-09-15
Các mục 1.2 (Mục tiêu), 1.3 (Ý nghĩa khoa học/thực tiễn), 1.4 (Phạm vi và
giới hạn) trong `chapters/chuong1-gioithieu.tex` do Claude soạn dựa trên bối
cảnh hội thoại, đã đánh dấu `% TODO` — cần nhóm đối chiếu lại cho khớp phạm
vi thật sự sẽ/đã hiện thực ở Ch.4, tránh cam kết vượt quá khả năng.
Status: open

### Chương 4–6 và front matter cần nội dung thật từ nhóm — Claude — 2026-09-15
Hệ thống Farmery có vẻ chưa code/test xong tại thời điểm tái cấu trúc (2026-09-15).
Các phần sau chỉ là khung `% TODO`, cần nhóm điền:
- Ch.4 Hiện thực: môi trường/công cụ, kiến trúc triển khai, từng module
  (bao gồm module AI ở `sec:hienthucAI`), giải thuật/code mẫu.
- Ch.5 Đánh giá: test case, kết quả chức năng/hiệu năng, đánh giá AI
  (accuracy/precision.../MAE...), khảo sát UX (đặc biệt nhóm nông dân/HTX).
- Ch.6 Kết luận: chỉ viết được sau khi có Ch.4–5.
- Front matter: `frontmatter/loicamon.tex` (lời cảm ơn), `frontmatter/tomtat.tex`
  (tóm tắt VN+EN), `frontmatter/phieunhiemvu.tex` (chữ ký GVHD/CNBM thật —
  hiện là khung gõ tay, có thể cần thay bằng bản scan PDF chính thức của Bộ
  môn nếu có).
- `chapters/chuong3-phantich-thietke.tex`: mục 3.8 (ERD), 3.9 (use
  case/sequence/activity diagram), 3.6 (sơ đồ ngữ cảnh luồng vận hành) đang
  chỉ có mô tả chữ, cần nhóm vẽ sơ đồ thật và `\includegraphics`. (Số mục đã
  dịch xuống 1 bậc sau khi thêm mục 3.2 "Luồng tiếp cận" — xem entry bên dưới.)
Status: open

### Đổi "mua lẻ/mua sỉ" → "bán lẻ/bán sỉ" + luồng tiếp cận + Phụ lục ToS — Claude — 2026-09-15
Đã hoàn thành — xem chi tiết ở `DECISIONS.md` ("Đổi khung ... góc nhìn nhà
bán ... Phụ lục Điều khoản dịch vụ"). Gồm: 2 quy trình B2C/B2B viết lại bắt
đầu từ hành động nhà bán, 2 flowchart TikZ vẽ lại (đã kiểm tra render, không
lỗi), mục 3.2 mới về luồng tiếp cận/tham gia hệ thống, RBAC role thêm vào
từng persona, Phụ lục D (Điều khoản dịch vụ, 11 điều). Build lại sạch, 47
trang.
Status: resolved

### Fix tràn trang 2 flowchart bán lẻ/bán sỉ — Claude — 2026-09-15
Đã hoàn thành — xem `DECISIONS.md` ("Fix tràn trang 2 flowchart..."). Bọc
`\resizebox` theo `\textheight`, hết cảnh báo "Float too large".
Status: resolved

### Bổ sung 5 mảng nội dung lớn (ToS, business model, đánh giá SP/nhà bán, AI/chatbot đào sâu, kho bãi & 3PL) — Claude — 2026-09-15
Đã lập kế hoạch qua plan mode trước khi làm (lưu ở
`C:\Users\nghia\.claude\plans\delightful-floating-candle.md`), chốt 3 quyết
định phạm vi với user, rồi thực hiện đầy đủ 9 bước trong kế hoạch. Chi tiết
đầy đủ ở `DECISIONS.md` ("Bổ sung 5 mảng nội dung lớn..."). Build lại sạch,
52 trang, đã render riêng flowchart đánh giá mới (Hình 3.5) bằng `pdftoppm`
để xác nhận không chồng lấn.

Việc còn mở phát sinh từ đây (do user yêu cầu ngay sau khi xem kết quả):
đã tách bullet 4 đoạn văn dày mới viết (mô hình doanh thu, kho bãi/3PL,
pipeline AI 5 bước, định nghĩa thuật ngữ ToS) — xem quyết định liên quan
trong `DECISIONS.md`. Đã lưu thành feedback memory
(`feedback_bullet_and_visuals.md`, ngoài project) để tự áp dụng cho các
lần viết nội dung mới tiếp theo, không cần user nhắc lại.
Status: resolved

### Phiên 2026-09-23: 18 hạng mục chỉnh sửa — Claude — 2026-09-23
Đã thực hiện xong theo kế hoạch (plan tạm ở `PHASE1-PLAN.md`, gitignore).
Chi tiết quyết định ở `DECISIONS.md`. Build sạch: 134 trang, không lỗi, không
tham chiếu treo, không cảnh báo citation.
Status: resolved

### Nhóm cần xác nhận stack back-end thực tế — Claude — 2026-09-23
Mục 5.2 "Giải pháp công nghệ" hiện đề xuất Next.js + NestJS + PostgreSQL +
Redis + MinIO + Python/FastAPI cho dịch vụ AI. Phần PostgreSQL có lập luận
riêng và nên giữ bất kể. Riêng **framework back-end** cần nhóm xác nhận: nếu
nhóm đã quen Java/Spring hoặc PHP/Laravel thì nên đổi, vì học framework mới
trong 15 tuần trong khi phải làm cả luồng 1P lẫn AI là đánh đổi tệ. Khi đổi,
phải sửa đồng bộ: mục 5.2, bảng đối sánh ở Phụ lục I, và mục 6.1.1 (môi
trường và công cụ phát triển).
Status: open

### Các TODO trích dẫn còn thiếu ở nội dung mới — Claude — 2026-09-23
Hai mục mới ở Chương 2 đang thiếu nguồn trích dẫn, đã đánh dấu `% TODO` tại
chỗ:
1. Mục 2.1.1 (phạm vi khái niệm nông sản) — cần thêm 3 văn bản pháp lý vào
   `references.bib`: Luật An toàn thực phẩm 55/2010/QH12, Nghị định
   15/2018/NĐ-CP, Luật Trồng trọt 31/2018/QH14.
2. Mục 2.1.3 (chứng nhận farm-to-market) — cần nguồn cho danh sách chứng nhận
   quốc tế: trang chính thức GlobalG.A.P., GFSI, quy định hữu cơ EU
   2018/848 và USDA, chuẩn kiểm dịch thực vật quốc tế, hướng dẫn mã số vùng
   trồng của cơ quan quản lý trong nước.
Mục 3.3 (vì sao các sàn khác chưa làm) hiện dựa vào số liệu đã trích dẫn ở
Ch.1 và Ch.3, không phát sinh nguồn mới, nhưng nếu hội đồng hỏi sâu thì nên
bổ sung nguồn cho lập luận N1 và N2.
Status: open

### Sơ đồ còn thiếu sau khi tái cấu trúc — Claude — 2026-09-23
Ba sơ đồ được viện dẫn trong văn bản nhưng chưa có hình, đã đánh dấu `% TODO`:
1. **Sơ đồ ngữ cảnh** (mục 4.2.1) — Farmery ở trung tâm, 5 nhóm tác nhân mới
   và các hệ thống ngoài (cổng thanh toán, đơn vị vận chuyển). Nên vẽ bằng
   TikZ để nhất quán với các lưu đồ sẵn có trong `flowcharts/`.
2. **Sơ đồ kiến trúc tổng thể** (mục 5.3.1) — các lớp và công nghệ từng lớp,
   theo đúng mô tả đã viết.
3. **Sơ đồ ERD** (mục 5.3.5) — vẽ theo Phụ lục K (từ điển dữ liệu), lưu ý bản
   hiện hành đã bỏ 2 thực thể BusinessMember và DebtLedger, và Phụ lục K chỉ
   còn đặc tả chi tiết 4 nhóm cốt lõi.

**Cập nhật 2026-09-23:** user chốt **nhóm tự vẽ**, Claude không vẽ. Hai file
HTML nháp (`so-do-ngu-canh.html`, `kien-truc.html`) đã tạo rồi xoá hẳn theo yêu
cầu; script render không còn tham chiếu tới chúng. Các dòng `% TODO` tại mục
4.2.1, 5.3.1 và 5.3.5 vẫn giữ nguyên làm chỗ đánh dấu.
Status: open

### Lưu đồ trong flowcharts/ chưa khớp mô hình mới — Claude — 2026-09-23
Các lưu đồ TikZ hiện có vẫn vẽ theo mô hình cũ (nhà bán tự bán ở cả hai kênh,
có bước công nợ). Cần rà lại ít nhất 2 file:
- `04b-ban-si-giao-hang.tex` — có bước liên quan công nợ, nay đã đổi thành
  thanh toán theo từng đợt giao.
- `03-ban-le.tex` và `03b-ban-le-giao-nhan.tex` — luồng bán lẻ nay là Farmery
  bán hàng đã thu mua, không phải nhà bán bán trực tiếp cho người tiêu dùng.
Ngoài ra cần cân nhắc thêm một lưu đồ mới cho quy trình thu mua (1P), hiện mới
có mô tả bằng chữ.
Status: open

### Lưu đồ đã đồng bộ với mô hình hai luồng — Claude — 2026-09-23
Đã thêm `flowcharts/08-thu-mua.tex` và sửa 2 lưu đồ bán lẻ. Xem `DECISIONS.md`.
Status: resolved
