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
**Cập nhật 2026-10-08:** user xác nhận giữ NestJS (7/10); đã ghi vào mục 5.2, Phụ lục I, mục 6.1.1 và
`DECISIONS.md` (dòng SỬA ở mục "Chọn PostgreSQL...").
Status: resolved

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

**Cập nhật 2026-10-01:** user đảo quyết định "nhóm tự vẽ" (hạng mục 16 của
phiên 30/9). Claude đã vẽ sơ đồ ngữ cảnh (mục 4.2) và kiến trúc theo C4
(mục 5.3.1, hai hình) bằng bộ sinh `tools/diagrams/`; xem `DECISIONS.md`
("Kiến trúc theo mô hình C4..."). Còn thiếu: **ERD** (mục 5.3.5), và sơ đồ
tuần tự, sơ đồ lớp (mục 5.3.3, 5.3.4) — user tạm hoãn.
**Đính chính 2026-10-01:** ERD không "còn thiếu" — commit `fab9c92` (30/9, thành
viên khác) đã chèn `image/ERD.png` vào mục 5.3.5. Nhưng hình vẽ theo
`schema.dbml` cũ (chưa có `stock_holdings`, `stock_movements`), trong khi
`schema.dbml` và Phụ lục K đã cập nhật → cần xuất lại ERD từ dbdiagram.
**Cập nhật 2026-10-08:** commit `65936c6` (7/10, thành viên) đưa `schema.dbml` và `image/ERD.png` về mô
hình cũ (thêm lại `debts`, `business_members`; mất `stock_holdings`, `stock_movements`, `procurement_orders`,
`shipments`, `disputes`, bảng AI...). Đang chờ thành viên trả lời trước khi sửa. Khi có trả lời, việc còn
lại: cập nhật `schema.dbml` theo 13 schema của mục 5.3.5 (thêm `media_files`, kênh `push`, 6 vai trò nội
bộ), Phụ lục K, xuất lại ERD, bỏ dòng `% TODO` ở mục 5.3.5. Sơ đồ tuần tự, sơ đồ lớp vẫn tạm hoãn; hình
"Luồng một đơn bán lẻ" ở mục 5.3.1 chỉ bù một phần, không thay thế.
**Cập nhật 2026-10-13:** user chốt "thay luôn" bản ERD của thành viên (không chờ trả lời). Đã viết lại
`schema.dbml` theo 13 schema (65 bảng), sinh ERD hai hình và Phụ lục K bằng `tools/diagrams/gen_erd.py`, bỏ
`image/ERD.png` và dòng `% TODO` ở mục 5.3.5 — xem `DECISIONS.md` ("Lược đồ CSDL 13 schema..."). Phần sơ đồ
tuần tự, sơ đồ lớp tách sang mục riêng bên dưới.
Status: resolved

### Sơ đồ tuần tự và sơ đồ lớp (mục 5.3.3, 5.3.4) — Claude — 2026-10-13
Tách từ mục "Sơ đồ còn thiếu sau khi tái cấu trúc". Hai mục vẫn chỉ có dòng `% TODO`; user tạm hoãn từ
1/10. Sơ đồ lớp nên bám `schema.dbml` (đã chốt 13/10); sơ đồ tuần tự cho 4 luồng: đặt hàng lẻ, RFQ — hợp
đồng sỉ, đăng và duyệt sản phẩm, gửi và duyệt đánh giá (lưu ý `% TODO` hiện còn ghi "ký quỹ B2B", đã thành
chỉ thiết kế).
**Cập nhật 2026-10-13:** đã vẽ xong — xem `DECISIONS.md` ("Lược đồ tuần tự và lược đồ lớp...").
Status: resolved

### Lưu đồ trong flowcharts/ chưa khớp mô hình mới — Claude — 2026-09-23
Các lưu đồ TikZ hiện có vẫn vẽ theo mô hình cũ (nhà bán tự bán ở cả hai kênh,
có bước công nợ). Cần rà lại ít nhất 2 file:
- `04b-ban-si-giao-hang.tex` — có bước liên quan công nợ, nay đã đổi thành
  thanh toán theo từng đợt giao.
- `03-ban-le.tex` và `03b-ban-le-giao-nhan.tex` — luồng bán lẻ nay là Farmery
  bán hàng đã thu mua, không phải nhà bán bán trực tiếp cho người tiêu dùng.
Ngoài ra cần cân nhắc thêm một lưu đồ mới cho quy trình thu mua (1P), hiện mới
có mô tả bằng chữ.
**Cập nhật 2026-10-01:** đã xử lý ở mục ngay dưới ("Lưu đồ đã đồng bộ...").
Status: resolved

### Lưu đồ đã đồng bộ với mô hình hai luồng — Claude — 2026-09-23
Đã thêm `flowcharts/08-thu-mua.tex` và sửa 2 lưu đồ bán lẻ. Xem `DECISIONS.md`.
Status: resolved

### Liên hệ Cục Chuyển đổi số hỏi API tra cứu công khai của TraceViet — Claude — 2026-10-01
"Chuẩn kết nối TXNG v5.1" chỉ có chiều đẩy dữ liệu lên (đơn vị gửi dữ liệu),
không có API tra cứu công khai. Vì vậy báo cáo đang xác minh ba tầng và hiện
thực bằng bản giả lập. Nếu Cục Chuyển đổi số (Bộ NN&MT) cung cấp API tra cứu,
cần sửa FR4.8, đặc tả UC-B4 và mục TraceViet ở Chương 2. Việc của nhóm, không
phải của Claude.
Status: open

### Xin cấp quyền đơn vị gửi dữ liệu (ĐVGP) trên TraceViet — Claude — 2026-10-01
Muốn kết nối thật (thay bản giả lập) thì Farmery phải được cấp tư cách đơn vị
gửi dữ liệu và khóa ký RSA theo chuẩn kết nối. Chưa rõ thủ tục và thời gian
cấp; nếu không kịp trong học kỳ thì giữ bản giả lập như phạm vi đã ghi ở
Chương 1 và hướng phát triển ở Chương 8.
Status: open

### Kiểm chứng ba nguồn còn treo của phiên 30/9 — Claude — 2026-10-01
- `kalbach2020mapping`: bản 2, O'Reilly, phát hành 11/2020 — khớp mục hiện có.
- Nghị định 38/2026/NĐ-CP: đúng là văn bản về nhập khẩu cây mang bầu đất,
  quản lý mã số vùng trồng và mã số cơ sở đóng gói. Đã được Nghị quyết
  36/2026/NQ-CP (31/7/2026) sửa đổi một số điều để đơn giản hóa thủ tục; nếu
  cần độ chính xác cao thì bổ sung văn bản này ở Phụ lục H và N.
- SonarQube Cloud bản miễn phí: kho riêng tư tới 50 nghìn dòng mã, kho công
  khai không giới hạn — đã ghi vào mục 6.1.1.
Status: resolved


### Chọn thư viện giao diện cho hai ứng dụng — Claude — 2026-10-13
Cần chốt trước khi dựng khung. Đã tra cứu (npm ngày 13/10, tài liệu Refine):
- Gói tích hợp Refine: `@refinedev/antd` 6.0 cần antd v5 (antd mới nhất 6.x); `@refinedev/mui` 8.0 cần MUI v6;
  `@refinedev/mantine` vẫn cần Mantine v5 (mới nhất v9); `@refinedev/chakra-ui` cần Chakra v2 (mới nhất v3).
  → Loại Mantine và Chakra cho ứng dụng nội bộ.
- Refine có tích hợp shadcn/ui qua registry `ui.refine.dev` (layout, data table, view Create/Edit/List/Show, form
  đăng nhập); mới nhất trong các tích hợp, chưa có Inferencer, ít hook dựng sẵn hơn Ant Design.
- Ứng dụng mua hàng (Next.js App Router): shadcn/ui hợp nhất với Server Components; MUI, Chakra cần `use client`
  nhiều chỗ.
- Mẫu tham khảo: Refine Finefoods (admin đơn thực phẩm, bản antd và MUI); Your Next Store, Next Prisma Tailwind
  Ecommerce (storefront shadcn).

Hai phương án còn lại:
- A. shadcn/ui cho shop + Ant Design 5 cho admin: admin nhanh nhất (bảng, form, AuthPage dựng sẵn); hai hệ thiết kế.
- B. shadcn/ui cho cả hai (Tailwind dùng chung qua `packages/ui`): một bộ thành phần cho một người FE; admin phải ráp
  tay nhiều hơn.
**Cập nhật 2026-10-13:** user chọn A; đã ghi vào `DECISIONS.md` ("Thư viện giao diện: shadcn/ui cho shop, Ant
Design 5 cho admin").
Status: resolved

### Nâng NestJS 12 + TypeScript 6 sau demo 21/10 — Claude — 2026-10-13
Đang dùng Nest 11 + TS 5.9.3 vì openapi-typescript 7.13 chỉ nhận TS `^5`, còn toolchain Nest 12 đòi TS ≥ 6 và Node
≥ 22.22.3. Đã thử Nest 12.1.1 + TS 6.0.3 trên bản clone ngày 13/10: generate, lint, typecheck, build, Swagger đủ
thao tác đều qua, kiểu sinh ra giống hệt bản TS 5. Phải dùng 2 cách lách: thêm `ignoreDeprecations: "6.0"` vào
tsconfig của `contract`, `mock-data` (tsup báo TS5101 khi sinh `.d.ts`), và chấp nhận openapi-typescript vi phạm peer.
Làm sau 21/10: kiểm openapi-typescript đã nhận TS 6 chưa; cả nhóm nâng Node lên 22.23 trở lên; chạy
`nest upgrade --dry-run` rồi `nest upgrade`.
Status: open

### Dữ liệu cho việc duyệt sản phẩm, hồ sơ, chứng nhận trong hợp đồng — Claude — 2026-10-13
`ReviewTaskDetail` hiện chỉ có chi tiết cho `taskType = batch`. MVP có cả duyệt sản phẩm (FR4.1), hồ sơ nhà cung cấp
(FR2) và chứng nhận (FR3), nên hợp đồng phải mô tả dữ liệu cho từng loại. BE1 chốt khi rà phần nguồn cung của
`openapi.yaml` ở M1 (15/10).
Status: open

### Nối SonarQube Cloud vào CI — Claude — 2026-10-13
Chương 7 đo chất lượng mã bằng SonarQube; CI hiện chưa có bước này. Cần user tạo tổ chức, dự án trên SonarQube Cloud
và thêm secret `SONAR_TOKEN` vào repo GitHub; sau đó thêm job phân tích vào `.github/workflows/ci.yml`. Kế hoạch xếp
ở tuần 5.
Status: open

### Rà phạm vi MVP theo tốc độ thật ở mốc 21/10 — Claude — 2026-10-13
Sau prototype còn khoảng 10 tuần cho 13 mô-đun, 3 tính năng AI, bán sỉ, PWA ngoại tuyến với 3 người. Ở mốc 21/10:
rà bốn điều kiện giữ mã nguồn (`MVP.md` mục 6), so khối lượng đã làm trong tuần prototype với phần còn lại, và quyết
định cắt sớm nếu cần (thứ tự cắt theo rủi ro tiến độ trong `report/backmatter/kehoach.tex`).
Status: open

### BE1: lọc theo danh mục cha gồm cả danh mục con — Claude — 2026-10-16
`GET /products?categoryId=<danh mục cha>` trả rỗng vì API so khớp đúng `categoryId`
(`in-memory-product.repository.ts`, bước lọc categoryId). Thanh danh mục của shop dùng 5 danh mục gốc; shop đang
lách bằng cách hiện từng khối danh mục con. Đề xuất: lọc theo danh mục cha thì gồm mọi danh mục con, ghi rõ vào mô tả
tham số `categoryId` trong `openapi.yaml` (PR sửa hợp đồng riêng). Làm xong thì shop bỏ được khối lách ở
`danh-muc/[slug]/page.tsx`.
Status: open

### BE1: dữ liệu demo cho lô thu hồi và nhật ký đính chính — Claude — 2026-10-16
`mock-data` chưa có lô nào có `recalledAt`, chưa có nhật ký nào có `supersedesId`, nên hai trạng thái này của trang
truy xuất chưa demo được (FE mới kiểm qua proxy tạm). Đề xuất:
- Đính chính ở lô `TRC-DTDL-2610-01`: thêm một nhật ký mới có `supersedesId` trỏ tới dòng cũ, **và** đặt
  `superseded: true` cho chính dòng cũ — API đọc `superseded` từ dòng cũ, `isCorrection` từ `supersedesId` của dòng
  mới (`catalog.service.ts`), thiếu một trong hai thì trang hiện sai.
- Thu hồi ở **một lô khác** (vd `TRC-DTNZ-2610-02`), không dùng `TRC-DTDL-2610-01` — đó là lô của kịch bản demo chính,
  thu hồi sẽ ẩn "Xem sản phẩm" và đổi huy hiệu thành "Lô đã thu hồi".
- Lý do thu hồi hiện lấy từ `batch.rejectReason` (trường lý do từ chối duyệt), hợp đồng `Batch` không có trường lý do
  thu hồi. Đề xuất thêm `recallReason` vào `Batch` (PR sửa hợp đồng riêng); trước đó nếu điền dữ liệu demo thì ghi
  rõ là dùng tạm `rejectReason`.
Status: open

### BE1: tìm gần đúng quá rộng — Claude — 2026-10-16
`q=dau tay` trả 14 sản phẩm, gồm cả trà Ô Long, khoai tây (dâu tây vẫn đứng đầu). Nguyên nhân ở
`vietnamese-search.util.ts`: từ khoá ≤ 4 ký tự được sai 1 ký tự (Levenshtein), và khớp `includes` hai chiều
(`qToken.includes(tToken)`) nên mọi từ ngắn trong mô tả cũng khớp. Phần lớn âm tiết tiếng Việt chỉ 2–4 ký tự: "dau"
khớp "rau", "sau", "dat"; "tay" khớp "day", "tai". Đề xuất: không so gần đúng với từ dưới 4 ký tự, bỏ chiều
`qToken.includes(tToken)`; có kết quả điểm ≥ 80 thì không trả kết quả điểm 70.
Status: open

### BE1: địa chỉ vùng trồng theo địa giới mới — Claude — 2026-10-17
Từ 1/7/2025 không còn cấp huyện (Nghị quyết 1671/NQ-UBTVQH15 sắp xếp cấp xã tỉnh Lâm Đồng), nhưng `growingRegion`
trong `mock-data` còn ghi "Huyện …", "TP. Đà Lạt". User chốt đổi sang địa giới mới ngay. Đề xuất sửa
`suppliers.ts` (đã đối chiếu toàn văn nghị quyết, số khoản thuộc Điều 1):
- 101: "Phường 8, TP. Đà Lạt" → "Phường Lâm Viên - Đà Lạt, Lâm Đồng" (khoản 101)
- 102: "Thị trấn Thạnh Mỹ, Huyện Đơn Dương" → "Xã Đơn Dương, Lâm Đồng" (khoản 2)
- 103: "Thị trấn Lạc Dương, Huyện Lạc Dương" → "Phường Lang Biang - Đà Lạt, Lâm Đồng" (khoản 103)
- 104: "Xã Xuân Trường, TP. Đà Lạt" → "Phường Xuân Trường - Đà Lạt, Lâm Đồng" (khoản 102)
- 105: "Xã Hiệp An, Huyện Đức Trọng" → "Xã Hiệp Thạnh, Lâm Đồng" (khoản 6)
Bộ lọc vùng của shop đã đổi theo: Đà Lạt, Lang Biang, Đơn Dương, Hiệp Thạnh (khớp chứa chuỗi, bỏ dấu). Trước khi BE1
sửa xong, "Lang Biang" và "Hiệp Thạnh" trả rỗng. Về lâu dài: so chuỗi trên địa chỉ đầy đủ dễ vỡ khi địa giới đổi tiếp
— đề xuất hợp đồng có trường vùng trồng có cấu trúc (mã đơn vị hành chính hoặc danh mục vùng), sửa qua PR riêng.
Status: open

### BE1: `traceUrl` gõ cứng localhost — Claude — 2026-10-16
`batches.ts` ghi `traceUrl: "http://localhost:3000/truy-xuat/..."`, trong khi hợp đồng mô tả đây là đường dẫn in vào
QR. Màn duyệt lô của admin hiện QR theo trường này thì điện thoại quét không mở được. Đề xuất: API dựng `traceUrl`
từ biến môi trường địa chỉ công khai của shop (vd `SHOP_PUBLIC_URL`). Shop hiện dựng QR từ host của request (đánh
dấu tạm ở `DECISIONS.md`), nên hai nguồn QR phải thống nhất khi có biến này.
**Cập nhật 2026-10-21:** lô duyệt qua `/admin/review-tasks/{id}/approve` (PR #30) dựng `traceUrl` từ phần tử đầu của
`CORS_ORIGINS` — sửa được một phần, nhưng ghép nghĩa hai cấu hình khác nhau; lô sẵn trong `batches.ts` vẫn ghi
localhost. Vẫn đề xuất biến riêng `SHOP_PUBLIC_URL`.
Status: open

### BE1: ảnh dữ liệu demo lấy từ trang ngoài — Claude — 2026-10-16
Ảnh trong `mock-data` lấy từ 17 host ngoài (liệt kê ở `apps/shop/src/lib/image-hosts.ts`), trong đó:
- `images.unsplash.com`: ảnh nhật ký không liên quan (lô `TRC-DTDL-2610-01` có ảnh cà chua, hoa hướng dương);
- `encrypted-tbn0.gstatic.com`: ảnh thu nhỏ của Google;
- `scontent.fsgn2-8.fna.fbcdn.net`: link có chữ ký, sẽ hết hạn;
- `k-gardennongsandalat.com` (cà chua bi Cherry): không phản hồi, shop hiện ô thay thế sau khi tải lỗi.
Cần thay bằng ảnh nhóm tự có trước demo. Đổi host thì báo FE cập nhật `image-hosts.ts` cùng lúc: host lạ vẫn hiện
được ảnh nhưng bỏ qua tối ưu ảnh của Next (không nén, không đổi cỡ).
Status: open

### BE2: cả 13 thao tác của luồng khách lẻ còn trả 501 — Claude — 2026-10-17
Gọi thử ngày 17/10 trên `develop`: `POST /auth/otp`, `/auth/login`, `GET /me`, `GET`/`POST /me/addresses`,
`GET /cart`, `PUT`/`DELETE /cart/items/{id}`, `POST /checkout/quote`, `POST /orders`, `GET /orders/{id}`,
`POST /orders/{id}/pay`, `/cancel` đều trả 501 (mô-đun `identity`, `retail`, `payment` còn rỗng). Shop đã dựng
xong theo hợp đồng và hiện "Chức năng đang được hoàn thiện" khi gặp 501. M2 (tối 18/10) cần các thao tác này chạy
trên API thật; khi BE2 push, FE chạy lại kịch bản kiểm thử trên API thật.
**Cập nhật 2026-10-21:** `POST /auth/otp`, `/auth/login`, `GET /me` đã chạy (BE1 làm tạm ở mô-đun `identity`, xem mục
"identity bản tạm" bên dưới). 10 thao tác còn lại vẫn 501; `retail`, `payment`, `inventory`, `fulfillment` còn rỗng.
Status: open

### BE2: tài khoản khách lẻ mẫu để đăng nhập — Claude — 2026-10-17
`mock-data` chưa có người dùng nào, trong khi hợp đồng cho `POST /auth/otp` trả 404 với email lạ, nên chưa ai đăng
nhập được. Đề xuất có sẵn tài khoản `buyer_retail` email `khachle@example.com` (đúng ví dụ trong hợp đồng; kịch
bản kiểm thử của FE dùng email này) cùng một địa chỉ mặc định ở TP.HCM để demo chọn địa chỉ. Dùng tên giả, không
dùng thông tin người thật.
**Cập nhật 2026-10-21:** đăng nhập được với mọi email nhờ bản tạm của `identity`, nhưng chưa có tài khoản riêng cho
khách lẻ — xem mục "identity bản tạm" bên dưới.
Status: open

### Hợp đồng: thao tác cần đăng nhập không khai phản hồi 401/403 — Claude — 2026-10-17
Chỉ `/auth/login` và `/me` khai 401. Khi chạy server giả có bộ kiểm phản hồi theo `openapi.yaml`, `GET /cart`
không có token trả 401 thì bộ kiểm báo "no schema defined for status code '401'". API thật dùng cùng bộ kiểm
(`VALIDATE_RESPONSES`) nên nhiều khả năng 401 `UNAUTHENTICATED` và 403 `FORBIDDEN_ROLE` của `AuthGuard` sẽ thành
500 `RESPONSE_CONTRACT_MISMATCH`. BE2 kiểm bằng một test e2e gọi `GET /cart` không có token. Nếu đúng như vậy, đề
xuất thêm `401`/`403` (`Unauthorized`, `Forbidden`) cho mọi thao tác có `security`, qua PR sửa hợp đồng riêng.
Shop hiện coi 500 là lỗi máy chủ nên vẫn báo được, nhưng không chuyển được sang trang đăng nhập khi token hết hạn.
Status: open

### Hợp đồng: OTP sai chưa có mã lỗi riêng — Claude — 2026-10-17
`POST /auth/login` chỉ khai 401 chung. Đề xuất thêm `OTP_INVALID`, `OTP_EXPIRED` vào danh sách `Problem.code` (PR
sửa hợp đồng riêng) để báo "mã sai" khác "mã hết hạn". Hiện shop báo chung "Mã OTP không đúng hoặc đã hết hạn".
Status: open

### BE2: hành vi API mà shop đang dựa vào — Claude — 2026-10-17
- `PUT /cart/items/{id}` đặt số lượng tuyệt đối (shop tự cộng dồn khi bấm Thêm); vượt lượng còn bán trả 422
  `CART_QTY_EXCEEDS_STOCK`.
- `POST /checkout/quote` trả 422 khi giỏ trống hoặc địa chỉ không thuộc người dùng; `codReason` là câu tiếng Việt
  hiển thị thẳng cho khách (vd "Đơn trên 1.000.000₫ chỉ nhận thanh toán trước.").
- `POST /orders` nhận đúng cặp `deliveryDate` + `deliverySlot` lấy từ `deliverySlots` của báo giá.
- Đơn trả trước quá hạn bị tự huỷ thì **giữ nguyên** `reserveExpiresAt` và thêm sự kiện `cancelled` vào
  `timeline`: shop dựa vào việc huỷ xảy ra từ lúc `reserveExpiresAt` trở đi để báo "Đã hết thời gian giữ chỗ". Nếu
  trường này về null thì shop chỉ báo được "Đơn đã huỷ".
- Phản hồi có header `Date` (Express bật sẵn): đồng hồ giữ chỗ dùng nó để bù lệch giờ máy người xem.
Status: open

### identity bản tạm: tài khoản, vai trò theo quy tắc email — Claude — 2026-10-21
PR #30 (BE1) thêm `POST /auth/otp`, `/auth/login`, `GET /me` ở `identity.service.ts` để demo bước 1–2, nhưng lệch hợp
đồng và kịch bản:
- Email lạ không trả 404 (hợp đồng có); email chứa "admin"/"staff" thành cán bộ (`staff_moderation`,
  `platform_owner`), mọi email khác thành cùng một người dùng `seller` + `buyer_retail` (id 201, nhà cung cấp 101) —
  khách lẻ và nhà cung cấp là một tài khoản.
- `GET /me` trả bản cố định theo id, email không khớp email đã đăng nhập.
- Không tài khoản nào có `staff_operations`, `staff_warehouse` → bước 5–6 gọi `/admin/orders`, `/admin/inventory`
  sẽ bị 403.
Đề xuất: BE2 (chủ mô-đun `identity` theo phân công) chuyển tài khoản giả sang `mock-data`, mỗi vai trò một tài khoản
(gồm `khachle@example.com`), email lạ 404, `GET /me` đọc theo token; báo BE1 vì `/seller/*` cần `supplierId` qua
`IdentityService`.
Status: open

### BE1: `/seller/*` chưa theo nhà cung cấp đang đăng nhập — Claude — 2026-10-21
`catalog.service.ts`: `listSellerProducts` gõ cứng nhà cung cấp `"101"`, `categoryId: "1"`, `unit: "kg"`;
`listSellerBatches`, `getSellerBatch`, `createBatch`, nhật ký không kiểm lô có thuộc nhà cung cấp của người gọi. Ảnh
nhật ký dựng `http://localhost:4000/api/media/...` gõ cứng; id lô, nhật ký, `challengeId` dùng `Date.now()` nên có
thể trùng khi gọi liền nhau. Đề xuất: lấy `supplierId` qua `IdentityService`, lô của nhà cung cấp khác trả 404,
`SellerProduct` lấy danh mục, đơn vị thật; id sinh bằng bộ đếm hoặc `randomUUID`.
Status: open

### Khu nhà cung cấp trong shop lệch quyết định của shop — Claude — 2026-10-21
`/nha-cung-cap` (PR #31, #32, BE1 dựng) chạy được với API thật nhưng:
- Không bảo vệ trang: `proxy.ts` không chặn, trang không gọi `requireViewer()`; chưa đăng nhập vẫn mở được, lời gọi
  rơi về client không token.
- `src/lib/data/seller.ts` có `FALLBACK_PRODUCTS`, `FALLBACK_BATCHES` gõ cứng, nuốt mọi lỗi (kể cả 401) thành dữ liệu
  giả — trái quyết định "không dựng dữ liệu giả trong shop" (`DECISIONS.md`, 16/10 và 17/10).
- Đầu khu gõ cứng tên HTX, "Đã xác thực VietGAP", mã vùng trồng; nút "Khu nhà cung cấp" ở đầu trang hiện với mọi người
  dùng.
FE sửa ở nhánh riêng, giữ nguyên giao diện.
**Cập nhật 2026-10-21:** đã sửa ở nhánh `feat/fe-sua-khu-nha-cung-cap` — xem `DECISIONS.md` ("Khu nhà cung cấp
`apps/shop`...").
Status: resolved

### API: `POST /auth/otp`, `/auth/login` trả 201 nên đăng nhập hỏng — Claude — 2026-10-21
Hai thao tác thiếu `@HttpCode(200)`, Nest mặc định trả 201 cho POST, hợp đồng khai 200 → bộ kiểm phản hồi đổi
thành 500 `RESPONSE_CONTRACT_MISMATCH`; trên API thật không ai đăng nhập được (shop lẫn admin). Test không bắt được
vì test e2e tự ký token. Đã sửa ở nhánh `feat/fe-admin-kiem-duyet` kèm `apps/api/test/auth.e2e-spec.ts`.
Status: resolved

### BE1: mã lô sinh ra giữ chữ "Đ" — Claude — 2026-10-21
`createBatch` lấy chữ đầu tên sản phẩm sau khi bỏ dấu bằng NFD, nhưng "Đ" không tách dấu được: "Dâu tây Hana Đà Lạt"
→ `DTHĐ-2610-03`, mã truy xuất `TRC-DTHĐ-2610-03` nằm trong URL của QR. Đề xuất đổi "Đ/đ" → "D" trước khi lấy chữ
đầu (như `vietnamese-search.util.ts`).
Status: open
