# Phạm vi MVP của Farmery

Chốt ngày 2026-10-01, viết lại 2026-10-08 theo phiên siết phạm vi 7/10 (trục thương mại điện tử).
Cập nhật 2026-10-13: OTP chỉ gửi qua email; thêm mục 6 về prototype và đường đi tiếp lên MVP.
Cập nhật 2026-11-06: FR2.2, FR4.7, FR5.3, FR9.2, FR10.4 chốt *(chỉ thiết kế)*; FR11.2 làm nếu kịp.
Cập nhật 2026-11-06 (lần 2): báo cáo bỏ nhãn *(để sau prototype)*, chỉ còn hiện thực (mặc định) và *(chỉ thiết kế)*.
Chuyển sang *(chỉ thiết kế)*: kết nối VNPay, GHN, Web Push, FR11.2, FR9.1, FR5.7; dự báo giá chỉ chạy offline;
bán sỉ một vòng phản hồi giá.
Tài liệu này xác định phần nào của bộ yêu cầu trong báo cáo (mục 4.3, FR1–FR13 và NFR1–NFR9)
được hiện thực ở phiên bản nộp cuối kỳ, phần nào để sau. Mã yêu cầu dùng đúng mã trong báo cáo.

Báo cáo đã ghi phạm vi hiện thực ở mục 1.3.4 và đánh dấu *(chỉ thiết kế)* ngay trong từng FR;
file này là bảng chi tiết theo mã, phải khớp với hai chỗ đó.

## 1. Nguyên tắc chọn

MVP làm sâu **trục bán lẻ đầu–cuối** và giữ tối giản hai phần còn lại.

**Trục bán lẻ (1P) — làm sâu**

1. Khách tìm kiếm (từ khóa không dấu, gõ sai, tìm theo ngữ nghĩa), xem sản phẩm và sản phẩm tương tự.
2. Giỏ hàng, thanh toán qua bản giả lập của cổng thanh toán: khung giờ giao, COD có điều kiện, giữ chỗ tồn 15 phút
   có khóa dòng.
3. Theo dõi đơn trên dòng thời gian tám trạng thái, thông báo trong web và email ở mỗi bước.
4. Giao ba chặng: nhà cung cấp tự đưa hàng về kho, chuyến trung chuyển xe lạnh, chặng cuối nội thành do nhân viên
   vận hành cập nhật trạng thái (kết nối 3PL chỉ thiết kế).
5. Đổi trả, hoàn tiền; đánh giá; mua lại.
6. Hóa đơn điện tử giả lập khi đơn hoàn tất; trang truy xuất QR công khai.

**Nguồn hàng — rút gọn**

Đăng ký và xác minh nhà cung cấp, đăng sản phẩm, lô, nhật ký canh tác, duyệt, sinh QR; đơn thu mua có
xác nhận của nhà cung cấp, nghiệm thu, nhập dòng tồn, đóng gói **một bước**, đặt giá; thu hồi lô.

**Bán sỉ (3P) — tối giản**

RFQ → phản hồi giá **một vòng** (chấp nhận hoặc từ chối) → sinh hợp đồng, xác nhận giao kết bằng OTP → giao
**một đợt**, thanh toán thường qua bản giả lập của cổng khi bên mua xác nhận nhận hàng.

Một yêu cầu **để sau MVP** khi rơi vào ít nhất một trường hợp:

- không nằm trên ba phần trên;
- phụ thuộc bên ngoài chưa chủ động được (ký số, TraceViet, hóa đơn điện tử thật, SMS);
- cần dữ liệu mà một nền tảng mới chưa có.

## 2. Yêu cầu chức năng

| Nhóm | Thuộc MVP | Để sau MVP hoặc chỉ thiết kế | Lý do |
|---|---|---|---|
| FR1 Tài khoản | 1.1 (email; số điện thoại khai để liên hệ, giao hàng), 1.2 (OTP qua email), 1.3, 1.4 (duyệt ảnh giấy tờ thủ công), 1.5, 1.6 đồng ý và quyền dữ liệu | Đăng nhập mạng xã hội *(chỉ thiết kế)*; xác minh số điện thoại, OTP qua SMS *(chỉ thiết kế)*; eKYC đối chiếu khuôn mặt tự động | Không trên trục chính; cần dịch vụ ngoài; SMS tính phí theo tin |
| FR2 Nhà cung cấp | 2.1, 2.3, 2.4 khai báo loại người bán | 2.2 thống kê cho nhà cung cấp *(chỉ thiết kế)* | Không trên trục chính; dữ liệu mô phỏng chưa đủ để thống kê có ý nghĩa |
| FR3 Chứng nhận | 3.1, 3.2, 3.3 (tự đánh dấu hết hạn) | Nhắc gia hạn *(chỉ thiết kế)* | Đi theo FR11.2 |
| FR4 Sản phẩm, truy xuất | 4.1–4.6 | 4.7 báo cáo sai danh mục *(chỉ thiết kế)* | Không trên trục chính |
| FR5 Bán lẻ | 5.1, 5.2, 5.4, 5.5, 5.6 mua lại; khối "Sắp vào mùa" chỉ hiển thị | 5.3 mã giảm giá, 5.7 đăng ký báo khi có hàng hoặc vào mùa, phản hồi công khai dưới đánh giá (5.5) *(chỉ thiết kế)* | Không trên trục chính; 5.7 cần kênh thông báo chủ động |
| FR6 Bán sỉ | 6.1–6.4 (một vòng phản hồi giá, hợp đồng sinh một lần, giao một đợt) | Thương lượng nhiều vòng, sửa hợp đồng nhiều phiên bản; 6.5 giao nhiều đợt *(chỉ thiết kế)* | Sỉ giữ tối giản |
| FR7 Thanh toán, hóa đơn | 7.1 (bản giả lập của cổng sau interface, COD điều kiện, hoàn tiền), 7.2 hóa đơn giả lập, 7.4 phần tính hoa hồng | Kết nối cổng VNPay thử nghiệm *(chỉ thiết kế)*; 7.3 ký quỹ *(chỉ thiết kế)*; 7.4 phần khấu trừ thuế *(chỉ thiết kế)*; kết nối nhà cung cấp hóa đơn thật | Phụ thuộc bên ngoài, Chương 7 không đo; cần hợp đồng, chứng thư số của doanh nghiệp |
| FR8 Giao hàng, khiếu nại | 8.1 ba chặng (chặng cuối nhân viên cập nhật), 8.2, 8.3 | Kết nối GHN thử nghiệm và webhook *(chỉ thiết kế)*; xe gom chặng đầu *(chỉ thiết kế)* | Phụ thuộc bên ngoài, Chương 7 không đo; nhà cung cấp tự đưa hàng |
| FR9 Tương tác | — | 9.1 trao đổi theo đơn, 9.2 yêu thích *(chỉ thiết kế)* | Không trên trục chính, không đo |
| FR10 Vận hành | 10.1, 10.2, 10.3, 10.5, 10.6, 10.7 | 10.4 báo cáo tổng quan *(chỉ thiết kế)* | Không trên trục chính; dữ liệu mô phỏng chưa đủ để thống kê có ý nghĩa |
| FR11 Thông báo | 11.1 (thông báo trong web, email) | Thông báo đẩy Web Push, kênh SMS *(chỉ thiết kế)*; 11.2 cảnh báo hết hạn, tồn thấp *(chỉ thiết kế)* | Web Push cần service worker, khóa VAPID; SMS tính phí theo tin; 11.2 không đo |
| FR12 AI | 12.1 sản phẩm tương tự; 12.2 dự báo giá chạy offline, đo MAPE (không có endpoint, không có trang admin); 12.3 tìm sản phẩm theo ngữ nghĩa | Hiển thị dự báo cho nhân viên thu mua; gợi ý cá nhân hóa theo hành vi; tìm nhà cung cấp theo ngữ nghĩa *(chỉ thiết kế)* | Cần dữ liệu tương tác chưa có; dự báo chỉ cần số đo cho Chương 7 |
| FR13 Thu mua, kho | 13.1, 13.2, 13.3, 13.4 (đóng gói một bước), 13.6 thu hồi lô | Sơ chế, phân loại nhiều bước; kiểm kê định kỳ *(chỉ thiết kế)* | Kho rút gọn |

**Đã rút khỏi bộ FR, chuyển hướng phát triển (Chương 8):** FR4.8 đồng bộ TraceViet, FR6.6 ký số,
FR11.3 cảnh báo khan hiếm, FR13.5 thuê kho, FR13.7 chào sỉ tồn dư. Mã giữ nguyên, không đánh lại.

## 3. Yêu cầu phi chức năng

Toàn bộ NFR thuộc MVP, trừ:

| Mã | Để sau MVP hoặc chỉ thiết kế | Lý do |
|---|---|---|
| NFR2.2 | Mở rộng theo chiều ngang | Chỉ thiết kế; quy mô đánh giá không cần |
| NFR8.3 (một phần) | Tuân thủ đầy đủ quy định hóa đơn điện tử | Bản hiện thực dùng hóa đơn giả lập; kiểm tra thật khi kết nối nhà cung cấp dịch vụ |
| NFR8.4 | Khấu trừ, nộp thuế thay | Đi theo FR7.4 phần chỉ thiết kế |

NFR7.3: ứng dụng mua hàng là PWA (cài được, thông báo đẩy, ghi nhật ký canh tác khi mất mạng);
ứng dụng nội bộ có giao diện đáp ứng, không có thao tác ngoại tuyến.

NFR3.6: xác thực hai lớp của nhân sự nội bộ dùng ứng dụng xác thực (TOTP, cột `totp_secret_enc` của
`identity.users`), không phụ thuộc SMS; đường dẫn nội bộ nằm dưới `/api/admin`.

## 4. Thứ tự ưu tiên sau MVP

Mọi mục dưới đây đã chốt *(chỉ thiết kế)* ngày 2026-11-06, không nằm trong bản nộp.

1. Kết nối VNPay, GHN thử nghiệm (đã có interface và bản giả lập, chỉ thay phần kết nối).
2. Thông báo đẩy Web Push, FR11.2 cảnh báo hết hạn chứng nhận và tồn thấp (sự kiện `CertExpired`, `StockLow` đã có
   sẵn), FR5.7 báo khi có hàng hoặc vào mùa.
3. FR9.1 trao đổi theo đơn; hiển thị dự báo giá cho nhân viên thu mua.
4. FR10.4 báo cáo tổng quan và FR2.2 thống kê cho nhà cung cấp.
5. FR5.3 mã giảm giá, FR9.2 yêu thích, FR4.7 báo cáo sai danh mục.
6. Các mục chỉ thiết kế còn lại và hướng phát triển ở Chương 8.

## 5. Việc cần làm theo tài liệu này

- Lịch trình (`report/backmatter/kehoach.tex`) xếp việc theo cột "Thuộc MVP"; các mục để sau MVP không có tuần riêng.
- Kiểm thử ở Chương 7 chỉ đo trên phần MVP.
- Khi chuyển một mục giữa hai cột, sửa file này, sửa đánh dấu *(chỉ thiết kế)* ở mục 4.3 nếu cần, và ghi một dòng vào `DECISIONS.md`.

## 6. Prototype và đường lên MVP

Prototype (demo 21/10, tuần 4 trong `report/backmatter/kehoach.tex`) là **nền của MVP**, không phải bản làm thử
để bỏ đi. Prototype chạy trên đúng stack, đúng hợp đồng `packages/contract/openapi.yaml` và đúng 13 mô-đun của
bản hoàn chỉnh. Khác biệt chỉ nằm ở các phần giả lập dưới đây, từ tuần 5 lần lượt thay bằng bản thật.

| Hạng mục | Prototype | MVP |
|---|---|---|
| Lưu trữ | Trong bộ nhớ, mỗi mô-đun một repository, nạp từ `packages/mock-data`; `POST /api/dev/reset` | Prisma + PostgreSQL, 13 schema; repository bản Prisma, cùng interface |
| Đăng nhập | OTP cố định `123456` trả trong `devCode`; JWT ký thật | OTP qua email (SMTP); xác thực hai lớp TOTP cho nội bộ (NFR3.6) |
| Thanh toán | Bản giả `DemoPaymentGateway`, trả tiền giả lập | Giữ bản giả sau interface, đủ ca thất bại, hết hạn, hoàn tiền; kết nối cổng thật chỉ thiết kế |
| Giao hàng | Nhân viên bấm chuyển bước thay webhook 3PL | Chuyến trung chuyển do nhân viên kho cập nhật; chặng cuối vẫn do nhân viên cập nhật; GHN chỉ thiết kế |
| Theo dõi đơn | Hỏi lại mỗi 5 giây | Thông báo trong web, email ở mỗi bước (FR11.1) |
| Tìm kiếm, tương tự | Bỏ dấu + so khớp gần đúng; cùng danh mục | `unaccent` + trigram + vector BGE-M3 (FR12.1, FR12.3) |
| Tệp | Nhận trực tiếp (Could) | URL ký trước lên MinIO |
| Ứng dụng mua hàng | Web | PWA, ghi nhật ký canh tác khi mất sóng (NFR7.3) |
| Bán sỉ, đổi trả, đánh giá | Không có | FR6.1–6.4, FR8.3, FR5.5 |

**Cách giữ để không phải viết lại**

- Code nghiệp vụ chỉ đọc ghi qua repository của mô-đun mình; mô-đun khác gọi qua service (RB3). Mẫu: mô-đun
  `catalog` trong `apps/api`.
- Dịch vụ bên ngoài nằm sau interface (`apps/api/src/integrations/`); lối tắt demo nằm sau cờ `DEMO_MODE`.
- API kiểm dữ liệu vào và phản hồi theo `openapi.yaml`; quyền đọc từ `x-roles` của chính hợp đồng.
- Luật nghiệp vụ (FEFO, giữ chỗ 15 phút, nhật ký chỉ nối thêm, máy trạng thái đơn) có test đi kèm.

**Rà ở mốc 21/10.** Giữ mã nguồn làm nền MVP khi đạt cả bốn điều kiện; chưa đạt thì sửa đúng chỗ đó:

1. Code nghiệp vụ đi hết qua repository, không mô-đun nào đọc dữ liệu của mô-đun khác.
2. Luật nghiệp vụ ở trên có test.
3. Không còn lối tắt demo nào nằm ngoài `DEMO_MODE`.
4. API và hai ứng dụng khớp `openapi.yaml` (CI xanh, kiểm phản hồi bật).

Cùng mốc này, so tốc độ thật của nhóm trong tuần prototype với khối lượng còn lại của phần MVP. Nếu không kịp,
cắt theo thứ tự ở rủi ro tiến độ của `kehoach.tex` (mục để sau trước, rồi dự báo giá và trao đổi theo đơn), không
cắt vào trục bán lẻ đầu–cuối; mọi lần cắt sửa mục 2 của file này và ghi vào `DECISIONS.md`.
