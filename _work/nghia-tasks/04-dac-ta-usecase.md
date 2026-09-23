# 04 — Đặc tả Use Case (toàn hệ thống)

> File làm việc độc lập, CHƯA merge. Điền vào đúng vị trí `% TODO` ở
> `chapters/chuong5-phantich-thietke.tex` dòng 57 (mục "vẽ use case diagram
> tổng quát và theo từng tác nhân... kèm bảng mô tả cho từng use case chính").
> Toàn bộ use case dưới đây được suy ra trực tiếp từ FR1-FR12 và các quy
> trình nghiệp vụ đã chốt ở `chuong4-hethong-dexuat.tex` — không bịa thêm
> tính năng mới ngoài phạm vi đã có.
>
> Diagram (hình vẽ) làm riêng bằng HTML theo style sẵn có của repo
> (`tools/design/*.html`, cùng pipeline Playwright→PNG với các bảng so sánh
> đã có ở Ch.2). Đã hoàn thành 5 file:
> - `tools/design/usecase-overview.html` — sơ đồ tổng quan, chia 5 package
>   (A. Đăng ký & xác thực, B. Sản phẩm & truy xuất, C. Giao dịch & thanh
>   toán, D. Vận chuyển/khiếu nại/quản trị, E. Hỗ trợ AI)
> - `tools/design/usecase-nha-ban.html` — chi tiết actor Nhà bán (minh họa
>   include/extend đầy đủ quanh nhóm B)
> - `tools/design/usecase-nguoi-mua-le.html` — chi tiết actor Người mua lẻ
>   (hành trình mua hàng B2C đầy đủ)
> - `tools/design/usecase-nguoi-mua-si.html` — chi tiết actor Người mua sỉ
>   (luồng RFQ → hợp đồng → escrow → giao hàng theo đợt)
> - `tools/design/usecase-quan-tri-vien.html` — chi tiết actor Quản trị
>   viên, thể hiện quan hệ generalization của 5 vai trò con lên super-admin
>
> Đã thêm cả 5 file vào danh sách `pages` trong
> `tools/render-comparison-tables.js` để `npm run shot` render ra
> `image/comparison/usecase-*.png` cùng lúc với các ảnh khác. Môi trường làm
> việc hiện tại không tải được Chromium cho Playwright (mạng bị chặn), nên
> mới preview bằng `wkhtmltoimage` (renderer khác, có sai khác nhỏ về cách
> vẽ marker mũi tên/tam giác so với Chromium) — **cần chạy `npm run shot`
> thật ở máy có Playwright để ra bản chính thức** trước khi nhúng vào LaTeX.

## 1. Danh sách Actor

| Actor | Vai trò RBAC | Actor cha (nếu có, theo quan hệ generalization) |
|---|---|---|
| Nhà bán | `seller` | — |
| Người mua lẻ (B2C) | `buyer_retail` | Người mua |
| Người mua sỉ / Doanh nghiệp (B2B) | `buyer_wholesale` | Người mua |
| QTV Kiểm duyệt (Moderator) | `admin_moderator` | Quản trị viên |
| QTV Giám sát & xử lý vi phạm (Compliance) | `admin_compliance` | Quản trị viên |
| QTV Xử lý khiếu nại (Dispute Resolution) | `admin_support` | Quản trị viên |
| QTV Vận hành & báo cáo (Operations) | `admin_ops` | Quản trị viên |
| QTV Giám sát tồn kho & vận chuyển (Inventory & Logistics) | `admin_inventory` | Quản trị viên |
| Hệ thống AI *(actor phụ, secondary/supporting actor)* | — | — |
| Cổng thanh toán trung gian *(actor phụ, bên ngoài hệ thống)* | — | — |
| Đơn vị vận chuyển 3PL *(actor phụ, bên ngoài hệ thống)* | — | — |

Ghi chú: "Người mua" không phải actor thao tác trực tiếp mà là actor trừu
tượng (abstract actor) dùng cho quan hệ generalization giữa buyer_retail và
buyer_wholesale ở các use case dùng chung (ví dụ "Xem chi tiết sản phẩm & tra
cứu truy xuất nguồn gốc", "Nhắn tin với nhà bán"). "Quản trị viên" tương tự là
actor trừu tượng cho 5 vai trò con — vai trò `admin` gốc (super-admin) kế
thừa toàn bộ use case của cả 5 vai trò con này theo đúng thiết kế RBAC đã
chốt ở Ch.3.

## 2. Danh sách Use Case theo nhóm (bám theo FR)

### Nhóm UC-A: Đăng ký, xác thực & hồ sơ (FR1, FR2, FR3)
- UC-A1. Đăng ký tài khoản nhà bán
- UC-A2. Xác thực OTP
- UC-A3. Xác minh danh tính điện tử (eKYC)
- UC-A4. Tải lên chứng nhận chất lượng (VietGAP/GlobalGAP/Organic/OCOP/HACCP)
- UC-A5. Kiểm duyệt hồ sơ & chứng nhận nhà bán *(actor: QTV Kiểm duyệt)*
- UC-A6. Thiết lập/cập nhật hồ sơ gian hàng
- UC-A7. Theo dõi hạn hiệu lực chứng nhận & nhận nhắc gia hạn

### Nhóm UC-B: Sản phẩm & truy xuất nguồn gốc (FR4)
- UC-B1. Đăng bán sản phẩm
- UC-B2. Ghi nhật ký canh tác theo lô
- UC-B3. Hệ thống sinh mã QR truy xuất nguồn gốc *(include của UC-B1/UC-B2)*
- UC-B4. Kiểm duyệt sản phẩm mới *(actor: QTV Kiểm duyệt)*
- UC-B5. Quản lý tồn kho theo lô (nhập/xuất/tồn)
- UC-B6. Tìm kiếm & lọc sản phẩm nâng cao
- UC-B7. Xem chi tiết sản phẩm & tra cứu trang truy xuất nguồn gốc *(actor:
  Người mua — dùng chung cho cả B2C/B2B)*

### Nhóm UC-C: Giao dịch bán lẻ — B2C (FR5)
- UC-C1. Thêm sản phẩm vào giỏ hàng
- UC-C2. Đặt hàng & tách đơn theo gian hàng
- UC-C3. Áp mã giảm giá
- UC-C4. Thanh toán đơn hàng bán lẻ *(actor: Người mua lẻ; include Cổng
  thanh toán trung gian)*
- UC-C5. Theo dõi trạng thái đơn hàng, hủy/đổi trả/hoàn tiền
- UC-C6. Đánh giá sản phẩm & nhà bán sau khi nhận hàng
- UC-C7. Kiểm duyệt đánh giá nghi vấn *(actor: QTV Giám sát & xử lý vi phạm;
  include Hệ thống AI — phát hiện bất thường)*
- UC-C8. Phản hồi đánh giá công khai *(actor: Nhà bán)*

### Nhóm UC-D: Giao dịch bán sỉ — B2B (FR6)
- UC-D1. Công bố bảng giá bán sỉ theo bậc/MOQ *(actor: Nhà bán)*
- UC-D2. Gửi yêu cầu báo giá (RFQ) *(actor: Người mua sỉ)*
- UC-D3. Phản hồi/đàm phán RFQ *(actor: Nhà bán và Người mua sỉ — 2 chiều)*
- UC-D4. Sinh hợp đồng điện tử từ RFQ đã thống nhất
- UC-D5. Ký xác nhận hợp đồng điện tử
- UC-D6. Quản lý công nợ & lịch giao hàng theo đợt
- UC-D7. Xác nhận nhận hàng & thanh toán theo đợt *(actor: Người mua sỉ)*

### Nhóm UC-E: Thanh toán (FR7)
- UC-E1. Thanh toán COD/chuyển khoản/ví điện tử
- UC-E2. Xuất hóa đơn điện tử cho khách B2B
- UC-E3. Ký quỹ trung gian (escrow) cho giao dịch B2B vượt ngưỡng *(include
  Cổng thanh toán trung gian)*
- UC-E4. Ra lệnh giải ngân escrow khi xác nhận nhận hàng đạt

### Nhóm UC-F: Vận chuyển, tồn kho & khiếu nại (FR8, một phần FR2.3)
- UC-F1. Tích hợp/theo dõi vận đơn với 3PL *(include Đơn vị vận chuyển 3PL)*
- UC-F2. Tính cước vận chuyển
- UC-F3. Gửi khiếu nại đơn hàng *(actor: Người mua)*
- UC-F4. Phân loại khiếu nại theo nguyên nhân *(actor: Hệ thống, tự động)*
- UC-F5. Xử lý & phân xử khiếu nại *(actor: QTV Xử lý khiếu nại)*
- UC-F6. Giám sát tồn kho & vận chuyển toàn sàn (FEFO, cảnh báo lô sắp hết
  hạn) *(actor: QTV Giám sát tồn kho & vận chuyển)*

### Nhóm UC-G: Tương tác người dùng (FR9)
- UC-G1. Nhắn tin trực tiếp giữa người mua và nhà bán
- UC-G2. Quản lý Wishlist / theo dõi gian hàng (Follow Store)

### Nhóm UC-H: Quản trị hệ thống (FR10)
- UC-H1. Xét duyệt hồ sơ mở gian hàng *(actor: QTV Kiểm duyệt — include
  UC-A5)*
- UC-H2. Giám sát vi phạm (hàng giả nhãn, đánh giá giả, gian lận đơn hàng)
  *(actor: QTV Giám sát & xử lý vi phạm; include Hệ thống AI)*
- UC-H3. Xử lý vi phạm theo phân cấp (nhắc nhở → khóa vĩnh viễn)
- UC-H4. Tiếp nhận & phân xử tranh chấp *(actor: QTV Xử lý khiếu nại —
  include UC-F5)*
- UC-H5. Xem báo cáo thống kê tổng quan hệ thống *(actor: QTV Vận hành &
  báo cáo)*
- UC-H6. Giám sát bảng điều khiển tồn kho/vận chuyển toàn sàn *(actor: QTV
  Giám sát tồn kho & vận chuyển — trùng UC-F6, gộp 1 use case duy nhất khi
  vẽ diagram)*

### Nhóm UC-I: Thông báo (FR11)
- UC-I1. Nhận thông báo đa kênh về đơn hàng/RFQ/hợp đồng
- UC-I2. Nhận cảnh báo chứng nhận sắp hết hạn / tồn kho chạm ngưỡng

### Nhóm UC-J: Hỗ trợ AI (FR12)
- UC-J1. Nhận gợi ý sản phẩm cá nhân hóa *(actor: Người mua lẻ; actor phụ:
  Hệ thống AI)*
- UC-J2. Xem dự báo nhu cầu/giá theo mùa vụ *(actor: Nhà bán, Người mua sỉ;
  actor phụ: Hệ thống AI)*
- UC-J3. Nhận cảnh báo bất thường *(actor: QTV Giám sát & xử lý vi phạm;
  actor phụ: Hệ thống AI — đã include ở UC-C7/UC-H2, không vẽ lại nếu diagram
  quá rối, ghi chú bằng extend)*
- UC-J4. Tương tác với trợ lý ảo (chatbot) *(actor: tất cả actor người dùng
  cuối — Nhà bán, Người mua lẻ, Người mua sỉ)*

## 3. Đặc tả chi tiết các Use Case chính (mẫu chuẩn)

> Chọn 8 use case đại diện, đủ đa dạng actor và độ phức tạp, để đặc tả đầy
> đủ theo mẫu (Tên, Actor, Tiền điều kiện, Luồng chính, Luồng thay
> thế/ngoại lệ, Hậu điều kiện). Các use case còn lại có thể đặc tả tương tự
> khi merge nếu giảng viên yêu cầu đầy đủ 100%; 8 use case này đủ để minh
> họa mọi loại actor và loại luồng (CRUD đơn giản, luồng nhiều bước có điều
> kiện rẽ nhánh, luồng có actor phụ bên ngoài, luồng có AI hỗ trợ).

---

### UC-B2. Ghi nhật ký canh tác theo lô

- **Actor chính:** Nhà bán (`seller`)
- **Tiền điều kiện:** Nhà bán đã xác thực (tài khoản trạng thái "Đã xác
  thực"); đã tạo sản phẩm/lô hàng (batch) tương ứng (UC-B1).
- **Luồng chính:**
  1. Nhà bán chọn lô hàng cần ghi nhật ký.
  2. Nhà bán nhập giai đoạn canh tác (gieo trồng/chăm sóc/thu hoạch), ngày
     tháng, mô tả hoạt động.
  3. Nhà bán tải ảnh minh chứng (nếu có).
  4. Hệ thống lưu bản ghi, gắn với `batch_id` tương ứng, đánh dấu thời điểm
     tạo (immutable, không cho sửa trực tiếp — NFR9.1).
  5. Nếu đây là bản ghi đầu tiên đủ điều kiện tối thiểu của lô (có ít nhất 1
     bản ghi + ảnh sản phẩm thật), hệ thống chuyển sản phẩm sang trạng thái
     đủ điều kiện xét duyệt công khai (liên hệ UC-B4).
- **Luồng thay thế/ngoại lệ:**
  - 4a. Nhà bán cần đính chính bản ghi cũ do sai sót: hệ thống không cho sửa
    trực tiếp, chỉ cho tạo bản ghi mới kèm ghi chú đính chính (NFR9.1).
  - 3a. Không có ảnh minh chứng: hệ thống vẫn cho lưu (ảnh là tùy chọn ở mức
    bản ghi, nhưng bắt buộc ở mức tối thiểu 1 ảnh sản phẩm thật cho toàn lô
    trước khi duyệt công khai).
- **Hậu điều kiện:** Bản ghi nhật ký canh tác được lưu vĩnh viễn (append-
  only), sẵn sàng hiển thị trên trang truy xuất công khai sau khi sản phẩm
  được duyệt.

---

### UC-B3. Hệ thống sinh mã QR truy xuất nguồn gốc

- **Actor chính:** Hệ thống (tự động, kích hoạt bởi UC-B4 khi kiểm duyệt
  viên duyệt sản phẩm)
- **Tiền điều kiện:** Sản phẩm/lô hàng đã qua kiểm duyệt (UC-B4) và đạt điều
  kiện tối thiểu (≥1 bản ghi nhật ký canh tác + ảnh thật).
- **Luồng chính:**
  1. Hệ thống sinh mã định danh duy nhất cho lô hàng theo nguyên lý GS1
     (GTIN + batch/lot).
  2. Hệ thống sinh mã QR liên kết tới trang truy xuất công khai.
  3. Trang truy xuất tổng hợp: hồ sơ nhà bán, chứng nhận đã duyệt, toàn bộ
     nhật ký canh tác của lô, các mốc vận chuyển liên quan (khi có).
  4. Mã QR được gắn vào trang sản phẩm và có thể in lên bao bì.
- **Luồng thay thế/ngoại lệ:**
  - 1a. Lô hàng đã có mã QR từ trước (ví dụ do đính chính): hệ thống không
    sinh mã mới, chỉ cập nhật nội dung trang truy xuất tương ứng.
- **Hậu điều kiện:** Mã QR khả dụng, quét được, dẫn tới trang truy xuất
  công khai đầy đủ và cập nhật.

---

### UC-C4. Thanh toán đơn hàng bán lẻ

- **Actor chính:** Người mua lẻ (`buyer_retail`)
- **Actor phụ:** Cổng thanh toán trung gian (bên ngoài hệ thống)
- **Tiền điều kiện:** Đơn hàng đã được tạo (UC-C2), đang ở trạng thái chờ
  thanh toán.
- **Luồng chính:**
  1. Người mua chọn phương thức thanh toán (COD/chuyển khoản-VietQR/ví điện
     tử).
  2. Nếu thanh toán trực tuyến: hệ thống chuyển yêu cầu tới cổng thanh toán
     trung gian.
  3. Cổng thanh toán xử lý và trả kết quả về hệ thống.
  4. Hệ thống xác nhận đơn hàng, tạm trừ sản lượng tồn kho của nhà bán.
  5. Hệ thống thông báo nhà bán chuẩn bị hàng (liên hệ UC-I1).
- **Luồng thay thế/ngoại lệ:**
  - 3a. Thanh toán trực tuyến thất bại: đơn giữ trạng thái chờ thanh toán
    tối đa 15 phút rồi tự hủy, giải phóng lại sản lượng.
  - 1a. Chọn COD: bỏ qua bước 2-3, đơn xác nhận ngay, thanh toán khi nhận
    hàng; nếu người nhận từ chối nhận hàng, đơn chuyển trạng thái hoàn hàng.
  - 4a. Nhiều đơn đặt cùng lúc vượt sản lượng còn lại: hệ thống ưu tiên đơn
    xác nhận thanh toán trước, các đơn còn lại tự hủy kèm thông báo hết
    hàng.
- **Hậu điều kiện:** Đơn hàng chuyển sang trạng thái đã xác nhận (hoặc bị
  hủy nếu thất bại), tồn kho được cập nhật đúng theo kết quả giao dịch.

---

### UC-D4. Sinh hợp đồng điện tử từ RFQ đã thống nhất

- **Actor chính:** Hệ thống (tự động, kích hoạt sau khi Nhà bán và Người mua
  sỉ hoàn tất đàm phán — UC-D3)
- **Tiền điều kiện:** RFQ đã được nhà bán xác nhận/điều chỉnh, hai bên đã
  thống nhất số lượng, đơn giá, lịch giao qua kênh nhắn tin nội bộ.
- **Luồng chính:**
  1. Hệ thống lấy thông tin đã thống nhất (sản phẩm, số lượng, đơn giá theo
     bậc, lịch giao, điều kiện thanh toán/công nợ).
  2. Hệ thống điền vào mẫu hợp đồng chuẩn, gồm điều khoản phạt vi phạm và
     điều khoản thanh toán/công nợ.
  3. Hệ thống gửi hợp đồng nháp cho cả hai bên xem trước khi ký (liên hệ
     UC-D5).
- **Luồng thay thế/ngoại lệ:**
  - 1a. Giá trị hợp đồng vượt ngưỡng quy định: hệ thống đánh dấu hợp đồng
    thuộc diện áp dụng ký quỹ trung gian (liên hệ UC-E3).
- **Hậu điều kiện:** Hợp đồng điện tử ở trạng thái "chờ ký", lưu lịch sử
  phiên bản.

---

### UC-D7. Xác nhận nhận hàng & thanh toán theo đợt

- **Actor chính:** Người mua sỉ (`buyer_wholesale`)
- **Actor phụ:** Cổng thanh toán trung gian
- **Tiền điều kiện:** Nhà bán đã giao hàng đợt tương ứng theo hợp đồng đã
  ký (UC-D5, UC-D6); hệ thống đã sinh hóa đơn cho đợt giao đó.
- **Luồng chính:**
  1. Người mua sỉ kiểm tra và xác nhận đã nhận đủ hàng đúng cam kết của đợt
     giao.
  2. Người mua sỉ thanh toán theo kỳ hạn công nợ đã thỏa thuận (ví dụ Net 15,
     Net 30).
  3. Nếu hợp đồng có ký quỹ (UC-E3): hệ thống ra lệnh cho cổng thanh toán
     trung gian giải ngân khoản đã giữ cho nhà bán ngay tại bước xác nhận
     này (liên hệ UC-E4).
  4. Nhà bán theo dõi doanh thu/lịch sử bán sỉ cập nhật trên trang quản lý.
- **Luồng thay thế/ngoại lệ:**
  - 1a. Người mua không giao đủ số lượng/đúng lịch: áp dụng điều khoản phạt
    trong hợp đồng, ghi vào lịch sử uy tín nhà bán.
  - 2a. Người mua sỉ chậm thanh toán quá hạn công nợ: hệ thống nhắc tự
    động, có thể tạm khóa quyền đặt RFQ mới.
  - 3a. Phát sinh tranh chấp về đợt giao đã ký quỹ: khoản ký quỹ giữ nguyên
    tại cổng thanh toán, không giải ngân/hoàn trả cho đến khi khiếu nại xử
    lý xong (liên hệ UC-F5/UC-H4).
- **Hậu điều kiện:** Đợt giao chuyển trạng thái hoàn tất, công nợ cập nhật,
  tiền giải ngân cho nhà bán (nếu có ký quỹ).

---

### UC-C7. Kiểm duyệt đánh giá nghi vấn

- **Actor chính:** QTV Giám sát & xử lý vi phạm (`admin_compliance`)
- **Actor phụ:** Hệ thống AI (mô-đun phát hiện bất thường)
- **Tiền điều kiện:** Người mua đã gửi đánh giá sau khi xác nhận nhận hàng
  (UC-C6).
- **Luồng chính:**
  1. Hệ thống kiểm duyệt tự động sơ bộ (từ khóa cấm, liên kết đáng ngờ).
  2. Mô-đun AI phát hiện bất thường phân tích đánh giá để tìm dấu hiệu giả
     mạo/spam/thao túng uy tín.
  3. Nếu không bị nghi ngờ: đánh giá công khai ngay.
  4. Nếu bị nghi ngờ: chuyển cho QTV Giám sát & xử lý vi phạm xem xét thủ
     công.
  5. QTV quyết định công khai hoặc ẩn đánh giá.
  6. Hệ thống cập nhật điểm uy tín tổng hợp của nhà bán (không tính đánh
     giá bị ẩn).
- **Luồng thay thế/ngoại lệ:**
  - 5a. QTV xác nhận đánh giá là giả/vi phạm: ẩn khỏi trang sản phẩm, thông
    báo lý do cho người mua, không tính vào điểm uy tín.
  - 5b. Phát hiện nhà bán thao túng đánh giá (mua đánh giá ảo, trả đũa
    khách hàng ngoài hệ thống): chuyển sang quy trình xử lý vi phạm
    (UC-H3).
- **Hậu điều kiện:** Đánh giá ở trạng thái công khai hoặc ẩn dứt điểm; điểm
  uy tín nhà bán được cập nhật chính xác.

---

### UC-H3. Xử lý vi phạm theo phân cấp

- **Actor chính:** QTV Giám sát & xử lý vi phạm (`admin_compliance`)
- **Tiền điều kiện:** Vi phạm đã được phát hiện (qua giám sát thủ công,
  cảnh báo AI — UC-J3, hoặc khiếu nại từ người dùng).
- **Luồng chính:**
  1. QTV xem chi tiết vi phạm và bằng chứng liên quan.
  2. QTV phân loại mức độ vi phạm.
  3. Hệ thống áp dụng chế tài theo đúng cấp độ đã phân loại: nhắc nhở →
     cảnh cáo công khai → tạm khóa → khóa vĩnh viễn, tùy mức độ và số lần
     vi phạm.
  4. Hệ thống lưu vết đầy đủ lý do và quyết định.
- **Luồng thay thế/ngoại lệ:**
  - 2a. Vi phạm nghiêm trọng (giả mạo chứng nhận, gian lận rõ ràng): tài
    khoản bị khóa ngay lập tức, bỏ qua các bước nhắc nhở trung gian; toàn bộ
    đơn hàng đang xử lý của tài khoản được rà soát để bảo vệ quyền lợi
    khách hàng đã đặt trước.
- **Hậu điều kiện:** Tài khoản vi phạm ở trạng thái chế tài tương ứng, có
  lưu vết đầy đủ cho tra soát sau này.

---

### UC-H5. Xem báo cáo thống kê tổng quan hệ thống

- **Actor chính:** QTV Vận hành & báo cáo (`admin_ops`)
- **Tiền điều kiện:** QTV đã đăng nhập với vai trò `admin_ops` (hoặc
  `admin` super-admin).
- **Luồng chính:**
  1. QTV mở bảng điều khiển báo cáo.
  2. Hệ thống tổng hợp dữ liệu từ nhiều mô-đun (bán lẻ, bán sỉ, tồn kho, vận
     chuyển) theo thời gian thực.
  3. Hệ thống hiển thị: tổng giá trị giao dịch, số người dùng hoạt động, tỷ
     lệ hoàn tất đơn hàng.
  4. QTV có thể lọc theo khoảng thời gian/danh mục để phục vụ báo cáo cho
     các bên liên quan.
- **Luồng thay thế/ngoại lệ:**
  - 2a. Dữ liệu từ một mô-đun chưa sẵn sàng/lỗi đồng bộ: hệ thống hiển thị
    cảnh báo dữ liệu chưa đầy đủ thay vì hiển thị số liệu sai lệch.
- **Hậu điều kiện:** QTV có báo cáo chính xác theo thời gian thực để hỗ trợ
  ra quyết định vận hành.

---

## 4. Việc cần nhóm xác nhận trước khi merge

1. File này đặc tả chi tiết 8/hơn 45 use case liệt kê ở mục 2 — đủ đại diện
   mọi actor/loại luồng, nhưng nếu giảng viên yêu cầu đặc tả 100% use case,
   cần làm thêm theo đúng mẫu này.
2. Vị trí chèn: đúng dòng `% TODO` ở `chuong5-phantich-thietke.tex:57` —
   cần xác nhận format bảng đặc tả dùng LaTeX `longtable` hay giữ dạng mô tả
   văn xuôi có cấu trúc như file này (đề xuất: `longtable` cho nhất quán với
   style bảng đã dùng ở Ch.3/Ch.4 hiện tại).
3. Actor "Hệ thống AI" là actor phụ (supporting actor) — cần xác nhận cách
   vẽ trên diagram: theo UML chuẩn có thể vẽ như 1 actor hình que thông
   thường hoặc dùng stereotype `<<system>>` để phân biệt với actor con
   người — đã chọn phương án trong file diagram HTML, xem file 05.
