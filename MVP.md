# Phạm vi MVP của Farmery

Chốt ngày 2026-10-01. Tài liệu này xác định phần nào của bộ yêu cầu trong báo cáo
(mục 4.3, FR1–FR13 và NFR1–NFR9) được hiện thực ở phiên bản nộp cuối kỳ, phần nào
để sau. Mã yêu cầu dùng đúng mã trong báo cáo.

## 1. Nguyên tắc chọn

MVP phải đi trọn **ba đường** dưới đây, và đủ để đo được mọi ngưỡng đã đặt ở
Phụ lục L (Chương 7 đánh giá trên chính bản MVP).

**Đường bán sỉ (3P)**

1. Nhà cung cấp đăng ký, xác minh danh tính, tải chứng nhận.
2. Đăng sản phẩm và lô hàng, ghi nhật ký canh tác.
3. Kiểm duyệt viên duyệt; hệ thống sinh mã QR.
4. Khách sỉ gửi RFQ; hai bên đàm phán, chốt báo giá.
5. Hệ thống sinh hợp đồng; hai bên xác nhận giao kết.
6. Giao hàng theo từng đợt, thanh toán qua ký quỹ trung gian.

**Đường bán lẻ (1P)**

1. Nhà cung cấp chào hàng; nhân viên thu mua lập đơn; nhà cung cấp xác nhận.
2. Nhân viên kho nghiệm thu, nhập thành dòng tồn của Farmery, sơ chế và đóng gói.
3. Nhân viên thu mua đặt giá bán lẻ.
4. Khách lẻ tìm (có AI search), đặt hàng; hệ thống giữ chỗ và trừ tồn có khóa.
5. Thanh toán, giao qua 3PL, nhận hàng, đánh giá hoặc khiếu nại.

**Đường truy xuất**

Người mua quét mã QR, xem nhật ký canh tác và chứng nhận mà không cần đăng nhập.
Khi phát hiện lô có vấn đề, thu hồi lô được.

Một yêu cầu **để sau MVP** khi rơi vào ít nhất một trường hợp:

- không nằm trên ba đường trên;
- phụ thuộc bên ngoài chưa chủ động được (quyền truy cập, dịch vụ ký số, hóa đơn điện tử);
- cần dữ liệu mà một nền tảng mới chưa có.

## 2. Yêu cầu chức năng

| Nhóm | Thuộc MVP | Để sau MVP | Lý do để sau |
|---|---|---|---|
| FR1 Tài khoản | 1.1 (email, số điện thoại), 1.2, 1.3, 1.4 (duyệt ảnh giấy tờ thủ công), 1.5 | Đăng nhập bằng mạng xã hội; eKYC đối chiếu khuôn mặt tự động | Không nằm trên đường chính; đối chiếu tự động cần dịch vụ ngoài |
| FR2 Gian hàng | 2.1, 2.3 | 2.2 thống kê cho người bán | Không nằm trên đường chính |
| FR3 Chứng nhận | 3.1, 3.2, 3.3 (chỉ tự đánh dấu hết hạn) | Nhắc gia hạn chứng nhận | Phụ thuộc FR11.2 |
| FR4 Sản phẩm, truy xuất | 4.1, 4.2, 4.3, 4.4, 4.5, 4.6 | 4.7 báo cáo sai danh mục; **4.8 đồng bộ TraceViet** | 4.7 không trên đường chính; 4.8 phụ thuộc quyền kết nối và tốn khoảng một tuần kể cả với bản giả lập |
| FR5 Bán lẻ | 5.1, 5.2, 5.4, 5.5 | 5.3 mã giảm giá | Không nằm trên đường chính |
| FR6 Bán sỉ | 6.1, 6.2, 6.3, 6.4, 6.5 | 6.6 ký số | Phụ thuộc dịch vụ chứng thực chữ ký số |
| FR7 Thanh toán | 7.1 (môi trường thử), 7.3 ký quỹ | 7.2 hóa đơn điện tử | Phụ thuộc nhà cung cấp hóa đơn điện tử |
| FR8 Vận chuyển | 8.1 (chỉ qua 3PL), 8.2, 8.3 | Đội giao hàng riêng của Farmery | Vốn chỉ được thiết kế, không hiện thực trong đồ án |
| FR9 Tương tác | — | 9.1 nhắn tin, 9.2 yêu thích | Đàm phán RFQ đã có kênh riêng trong FR6.2 |
| FR10 Vận hành | 10.1, 10.2, 10.3, 10.6, 10.7 | 10.4 báo cáo tổng quan, 10.5 bảng điều khiển toàn sàn | Không nằm trên đường chính |
| FR11 Thông báo | 11.1 (web, thông báo đẩy, email) | Kênh SMS; 11.2 cảnh báo hết hạn và tồn thấp; 11.3 cảnh báo khan hiếm cho khách sỉ | SMS tốn phí; 11.3 cần FR12.2 chạy ổn định trước |
| FR12 AI | 12.3 AI search; 12.1 chỉ phần sản phẩm tương tự; 12.2 dự báo giá chạy offline trên dữ liệu giá công khai | Phần gợi ý dựa trên hành vi người dùng | Cần dữ liệu tương tác mà nền tảng mới chưa có |
| FR13 Thu mua, kho | 13.1, 13.2, 13.3, 13.4, 13.6 thu hồi lô | 13.5 dịch vụ thuê kho; 13.7 chào sỉ tồn dư | Không nằm trên ba đường chính |

## 3. Yêu cầu phi chức năng

Toàn bộ NFR thuộc MVP, trừ ba mục:

| Mã | Để sau MVP | Lý do |
|---|---|---|
| NFR2.2 | Mở rộng theo chiều ngang | Chỉ thiết kế; quy mô đánh giá không cần |
| NFR7.3 (một phần) | Thao tác ngoại tuyến cho nhân viên giao hàng | Đội giao hàng riêng để sau MVP; phần ngoại tuyến cho ghi nhật ký canh tác vẫn thuộc MVP |
| NFR8.3 | Tuân thủ quy định hóa đơn điện tử | Đi theo FR7.2 |

## 4. Thứ tự ưu tiên sau MVP

1. FR4.8 đồng bộ TraceViet — điểm khác biệt của đồ án, làm đầu tiên nếu còn thời gian.
2. FR11.3 cảnh báo khan hiếm cho khách sỉ, cùng FR11.2.
3. FR13.5 dịch vụ thuê kho và FR13.7 chào sỉ tồn dư.
4. FR6.6 ký số, FR7.2 hóa đơn điện tử.
5. Các mục còn lại.

## 5. Việc cần làm theo tài liệu này

- Lịch trình (`backmatter/kehoach.tex`) xếp việc theo cột "Thuộc MVP"; các mục để sau MVP không có tuần riêng.
- Kiểm thử ở Chương 7 chỉ đo trên phần MVP.
- Khi chuyển một mục giữa hai cột, sửa file này và ghi một dòng vào `DECISIONS.md`.
