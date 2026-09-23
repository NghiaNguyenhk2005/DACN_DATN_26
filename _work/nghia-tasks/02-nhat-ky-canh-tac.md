# 02 — Nhật ký canh tác: giấy tờ, quy chuẩn, quy cách (trong nước & xuất khẩu)

> File làm việc độc lập, CHƯA merge. Mục tiêu: làm rõ "nhật ký canh tác" là
> gì về mặt giấy tờ/quy chuẩn/quy cách — mở rộng những gì đã có rải rác ở
> `FR4.2`, `NFR9`, `subsec:gs1blockchain`, ERD (`FarmingLog`) trong nhánh
> `report` hiện tại. Theo quyết định đã chốt với anh Nghĩa: **giữ nguyên
> phạm vi MVP** (không đổi use case/thiết kế cho xuất khẩu) — phần xuất khẩu
> ở đây chỉ là mục thảo luận/so sánh, dự kiến đưa vào Ch.2 (lý thuyết) và
> Ch.8 (hướng phát triển), không đụng đến Ch.3/Ch.4 (thiết kế/FR).

## 1. Nhật ký canh tác trong phạm vi MVP hiện tại — đối chiếu với báo cáo

Trong nhánh `report`, "nhật ký canh tác" (`FarmingLog` trong ERD) hiện được
định nghĩa qua các mảnh sau — tổng hợp lại để thấy rõ đã có gì:

- **FR4.2**: ghi theo lô (batch), gồm ngày gieo trồng, xử lý, thu hoạch; sinh
  mã QR truy xuất gắn với từng lô.
- **Quy trình "Đăng và kiểm duyệt sản phẩm"** (Ch.4): mỗi lần ghi gồm ngày
  tháng, hoạt động, hình ảnh minh chứng nếu có; sản phẩm chỉ được duyệt công
  khai khi có tối thiểu 1 bản ghi gần nhất + ảnh thật.
- **NFR9.1**: dữ liệu nhật ký/chứng nhận đã công khai không được sửa trực
  tiếp — mọi đính chính phải là bản ghi mới (append-only/versioning).
- **ERD `FarmingLog`**: có trường `activity_date` (ngày thực hiện hoạt động
  canh tác) — cần xem lại đầy đủ các trường khác trong bảng đặc tả ERD ở
  `chuong5-phantich-thietke.tex` khi merge, để bổ sung nếu thiếu.
- **Định danh**: theo nguyên lý GS1 (GTIN cho sản phẩm, batch/lot cho lô
  hàng), không dùng blockchain (xem file `03-nghien-cuu-blockchain.md`).

**Nhận xét:** phần khung sườn kỹ thuật (dữ liệu gì, gắn với lô nào, bất biến
ra sao) đã có, nhưng **thiếu phần "giấy tờ/quy chuẩn" theo đúng nghĩa hồ sơ
thực tế** — tức là nhật ký canh tác trên Farmery hiện mới mô tả *cấu trúc dữ
liệu số* (data schema), chưa đối chiếu với *biểu mẫu/quy chuẩn giấy tờ thật*
mà nông dân/HTX Việt Nam đang phải tuân theo. Đây là phần bổ sung dưới đây.

## 2. Giấy tờ và quy chuẩn nhật ký canh tác trong nước (đã có, đối chiếu)

- **VietGAP** (đã có trong báo cáo — 70 tiêu chí): yêu cầu ghi chép nhật ký
  sản xuất theo mẫu (giống, phân bón, thuốc BVTV, thời điểm cách ly trước
  thu hoạch, nguồn nước tưới) — đây là biểu mẫu giấy tờ gốc mà FR4.2 số hóa.
- **GlobalGAP** (đã có — cơ cấu 252 tiêu chuẩn: 36/127/89): riêng phần liên
  quan trực tiếp nhật ký là General Regulations + Crops Base module, yêu cầu
  hồ sơ truy xuất từ vật tư đầu vào đến thu hoạch, có thể truy vết ngược.
- **Mã số vùng trồng** (Quyết định 3156/QĐ-BNN-TT, TCCS 774:2020/BVTV — nguồn
  mới tìm được, chưa có trong `references.bib`): là "giấy phép" gắn một mã
  định danh cho một vùng trồng cụ thể, đi kèm yêu cầu giám sát sinh vật gây
  hại theo quy trình IPM (quản lý dịch hại tổng hợp) — Farmery hiện dùng
  trường `growing_region` (text mô tả) chứ **chưa mô hình hóa mã số vùng
  trồng như một định danh chuẩn có thể xác thực chéo với dữ liệu nhà nước**.
- **Hệ thống truy xuất nguồn gốc quốc gia** (`traceviet.mae.gov.vn`/CheckVN,
  vận hành chính thức từ 1/7/2026): là hình mẫu Nhà nước hiện đang xây, có
  cấu trúc dữ liệu tương đồng với `FarmingLog` của Farmery (nông hộ → vùng
  trồng → lô hàng → cơ sở đóng gói). Đáng chú ý: hệ thống này **đã thí điểm
  thành công với sầu riêng xuất khẩu sang Trung Quốc** — chi tiết ở mục 3.

## 3. Nhật ký canh tác cho xuất khẩu — khoảng cách so với MVP (chỉ để thảo luận)

Đây là phần trả lời trực tiếp yêu cầu "đặc biệt đối với xuất khẩu" — nhưng
**trình bày dưới dạng đối chiếu/thảo luận**, không đổi phạm vi MVP.

### 3.1 Quy định mới nhất đáng chú ý (2026)

- **Lệnh 280 GACC (Tổng cục Hải quan Trung Quốc)**, hiệu lực từ 1/6/2026: yêu
  cầu doanh nghiệp nước ngoài (kể cả cơ sở sản xuất, đóng gói, kho bảo quản)
  đăng ký mã số với GACC; 17 nhóm thực phẩm phải đăng ký theo hình thức được
  cơ quan thẩm quyền nước xuất khẩu khuyến nghị chính thức — tức **không thể
  tự đăng ký trực tiếp**, phải qua đầu mối nhà nước (khác hẳn mô hình MVP
  hiện tại nơi nhà bán tự tải chứng nhận lên và Farmery xác minh thủ công).
- Việt Nam đã chia sẻ Hệ thống truy xuất nguồn gốc nông sản quốc gia với
  GACC, kèm mẫu tem nhận diện, nhằm hỗ trợ phê duyệt mã số vùng trồng/cơ sở
  đóng gói cho hàng xuất khẩu.
- Từ 1/1 đến giữa tháng 9/2026, EU + Trung Quốc + Trung Đông-châu Phi đã ban
  hành khoảng 249-254 thông báo SPS (an toàn thực phẩm/kiểm dịch), phần lớn
  liên quan trực tiếp dư lượng thuốc BVTV, đăng ký doanh nghiệp, truy xuất
  nguồn gốc và ghi nhãn — cho thấy đây là lĩnh vực đang siết nhanh, không
  phải yêu cầu tĩnh.
- Ví dụ cụ thể (chanh xuất khẩu sang Trung Quốc, 2026): vùng trồng phải áp
  dụng GAP/tương đương, quản lý dịch hại tổng hợp (IPM), giám sát sinh vật
  gây hại theo yêu cầu riêng của nước nhập khẩu, và "lưu giữ hồ sơ sản xuất"
  — tức nhật ký canh tác là điều kiện bắt buộc, không phải tính năng cộng
  thêm.
- **EU** (General Food Law, Regulation (EC) 178/2002, Điều 18): yêu cầu truy
  xuất "one-up-one-down" xuyên suốt farm-to-fork, lưu hồ sơ tối thiểu 5 năm
  (6 tháng với hàng dễ hư hỏng), áp dụng cho mọi tác nhân từ sản xuất đến
  bán lẻ — mức yêu cầu về **thời hạn lưu trữ** và **phạm vi bên tham gia**
  cao hơn đáng kể so với thiết kế nhật ký hiện tại của Farmery (không có quy
  định thời hạn lưu trữ tối thiểu trong FR4.2/NFR9).

### 3.2 Khoảng cách cụ thể giữa nhật ký canh tác MVP và yêu cầu xuất khẩu

| Tiêu chí | Farmery MVP hiện tại | Yêu cầu xuất khẩu (GACC/EU) |
|---|---|---|
| Xác minh chứng nhận | Thủ công bởi kiểm duyệt viên nội bộ (đã ghi rõ ngoài phạm vi tích hợp API xác minh) | Phải qua đăng ký/phê duyệt với cơ quan quản lý nước xuất khẩu, sau đó nước nhập khẩu (GACC) phê duyệt riêng |
| Định danh vùng trồng | Trường mô tả tự do (`growing_region`) | Mã số vùng trồng chính thức do Cục Trồng trọt-BVTV cấp, có thể bị thu hồi nếu vi phạm |
| Thời hạn lưu trữ hồ sơ | Chưa quy định cụ thể (chỉ có nguyên tắc bất biến/append-only) | Tối thiểu 5 năm (EU), hoặc theo thời hạn nước nhập khẩu quy định |
| Phạm vi bên tham gia | Nhà bán + Farmery (2 lớp) | Nhà bán, cơ sở đóng gói, đơn vị kiểm dịch, hải quan, nhà nhập khẩu (nhiều bên độc lập) |
| Giám sát sinh vật gây hại | Không có trong quy trình hiện tại | Bắt buộc theo IPM, có bẫy/giám sát định kỳ, hồ sơ riêng |

### 3.3 Đề xuất vị trí đưa vào báo cáo (không đổi use case)

- **Ch.2** (gần `subsec:gs1blockchain` hoặc mục mới sau đó): thêm 1 mục thảo
  luận ngắn "Nhật ký canh tác cho thị trường xuất khẩu" — nêu quy định GACC/EU
  ở trên như bối cảnh, không kèm yêu cầu chức năng mới.
- **Ch.8 (Kết luận, hướng phát triển)**: liên kết trực tiếp với mục đã có sẵn
  trong `chuong8-tongket.tex` (`% TODO` đã liệt kê sẵn "xuất khẩu" là một
  hạng mục ngoài phạm vi cần nêu hướng phát triển) — bổ sung nội dung cụ thể:
  nếu mở rộng sang xuất khẩu, Farmery cần (a) tích hợp/tham chiếu mã số vùng
  trồng chính thức thay vì trường tự do, (b) kéo dài thời hạn lưu trữ hồ sơ
  theo thị trường đích, (c) mở rộng actor tham gia truy xuất (cơ quan kiểm
  dịch, đơn vị đóng gói được cấp phép).

## 4. Việc cần nhóm xác nhận trước khi merge

1. Bổ sung `references.bib`: Quyết định 3156/QĐ-BNN-TT, TCCS 774:2020/BVTV,
   Lệnh 280 GACC (2026), Regulation (EC) 178/2002 (EU General Food Law) —
   đều là nguồn có ngày/số hiệu cụ thể, cần nhóm xác nhận cách trích dẫn văn
   bản pháp quy nước ngoài cho khớp style `ieeetr` đang dùng.
2. Xác nhận đặt mục thảo luận xuất khẩu ở Ch.2 hay gộp thẳng vào Ch.8 luôn
   (đỡ phải sửa 2 chỗ) — đề xuất cá nhân: Ch.2 để có phân tích, Ch.8 chỉ dẫn
   chiếu ngược lại Ch.2 bằng 1-2 câu.
3. Có cần vẽ thêm 1 sơ đồ so sánh (dạng bảng ảnh HTML, giống style
   `research-gap.html`) cho bảng ở mục 3.2 không, hay để dạng bảng LaTeX
   `tabularx` thuần vì đây là bảng kỹ thuật ít mục?
