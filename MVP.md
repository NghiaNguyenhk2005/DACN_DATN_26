# Phạm vi MVP của Farmery

Chốt ngày 2026-10-01, viết lại 2026-10-08 theo phiên siết phạm vi 7/10 (trục thương mại điện tử).
Tài liệu này xác định phần nào của bộ yêu cầu trong báo cáo (mục 4.3, FR1–FR13 và NFR1–NFR9)
được hiện thực ở phiên bản nộp cuối kỳ, phần nào để sau. Mã yêu cầu dùng đúng mã trong báo cáo.

Báo cáo đã ghi phạm vi hiện thực ở mục 1.3.4 và đánh dấu *(chỉ thiết kế)* ngay trong từng FR;
file này là bảng chi tiết theo mã, phải khớp với hai chỗ đó.

## 1. Nguyên tắc chọn

MVP làm sâu **trục bán lẻ đầu–cuối** và giữ tối giản hai phần còn lại.

**Trục bán lẻ (1P) — làm sâu**

1. Khách tìm kiếm (từ khóa không dấu, gõ sai, tìm theo ngữ nghĩa), xem sản phẩm và sản phẩm tương tự.
2. Giỏ hàng, thanh toán: khung giờ giao, COD có điều kiện, giữ chỗ tồn 15 phút có khóa dòng.
3. Theo dõi đơn trên dòng thời gian tám trạng thái, thông báo đẩy hoặc email ở mỗi bước.
4. Giao ba chặng: nhà cung cấp tự đưa hàng về kho, chuyến trung chuyển xe lạnh, 3PL nội thành (GHN thử nghiệm).
5. Đổi trả, hoàn tiền kèm trao đổi theo đơn; đánh giá; mua lại; báo khi có hàng hoặc vào mùa.
6. Hóa đơn điện tử giả lập khi đơn hoàn tất; trang truy xuất QR công khai.

**Nguồn hàng — rút gọn**

Đăng ký và xác minh nhà cung cấp, đăng sản phẩm, lô, nhật ký canh tác, duyệt, sinh QR; đơn thu mua có
xác nhận của nhà cung cấp, nghiệm thu, nhập dòng tồn, đóng gói **một bước**, đặt giá; thu hồi lô.

**Bán sỉ (3P) — tối giản**

RFQ → phản hồi, thương lượng → chốt → sinh hợp đồng, xác nhận giao kết bằng OTP → giao **một đợt**,
thanh toán thường qua cổng khi bên mua xác nhận nhận hàng.

Một yêu cầu **để sau MVP** khi rơi vào ít nhất một trường hợp:

- không nằm trên ba phần trên;
- phụ thuộc bên ngoài chưa chủ động được (ký số, TraceViet, hóa đơn điện tử thật, SMS);
- cần dữ liệu mà một nền tảng mới chưa có.

## 2. Yêu cầu chức năng

| Nhóm | Thuộc MVP | Để sau MVP hoặc chỉ thiết kế | Lý do |
|---|---|---|---|
| FR1 Tài khoản | 1.1 (email, số điện thoại), 1.2, 1.3, 1.4 (duyệt ảnh giấy tờ thủ công), 1.5, 1.6 đồng ý và quyền dữ liệu | Đăng nhập mạng xã hội *(chỉ thiết kế)*; eKYC đối chiếu khuôn mặt tự động | Không trên trục chính; cần dịch vụ ngoài |
| FR2 Nhà cung cấp | 2.1, 2.3, 2.4 khai báo loại người bán | 2.2 thống kê cho nhà cung cấp | Không trên trục chính |
| FR3 Chứng nhận | 3.1, 3.2, 3.3 (tự đánh dấu hết hạn) | Nhắc gia hạn (đi theo FR11.2) | Phụ thuộc FR11.2 |
| FR4 Sản phẩm, truy xuất | 4.1–4.6 | 4.7 báo cáo sai danh mục | Không trên trục chính |
| FR5 Bán lẻ | 5.1, 5.2, 5.4, 5.5, 5.6 mua lại, 5.7 báo vào mùa | 5.3 mã giảm giá | Không trên trục chính |
| FR6 Bán sỉ | 6.1–6.4 (giao một đợt) | 6.5 giao nhiều đợt *(chỉ thiết kế)* | Sỉ giữ tối giản |
| FR7 Thanh toán, hóa đơn | 7.1 (thử nghiệm, COD điều kiện, hoàn tiền), 7.2 hóa đơn giả lập, 7.4 phần tính hoa hồng | 7.3 ký quỹ *(chỉ thiết kế)*; 7.4 phần khấu trừ thuế *(chỉ thiết kế)*; kết nối nhà cung cấp hóa đơn thật | Cần hợp đồng, chứng thư số của doanh nghiệp |
| FR8 Giao hàng, khiếu nại | 8.1 ba chặng, 8.2, 8.3 | Xe gom chặng đầu *(chỉ thiết kế)* | Nhà cung cấp tự đưa hàng ở bản hiện thực |
| FR9 Tương tác | 9.1 trao đổi theo đơn | 9.2 yêu thích | Không trên trục chính |
| FR10 Vận hành | 10.1, 10.2, 10.3, 10.5, 10.6, 10.7 | 10.4 báo cáo tổng quan | Không trên trục chính |
| FR11 Thông báo | 11.1 (web, thông báo đẩy, email) | Kênh SMS *(chỉ thiết kế)*; 11.2 cảnh báo hết hạn, tồn thấp | SMS tính phí theo tin |
| FR12 AI | 12.1 sản phẩm tương tự; 12.2 dự báo giá chạy offline; 12.3 tìm sản phẩm theo ngữ nghĩa | Gợi ý cá nhân hóa theo hành vi; tìm nhà cung cấp theo ngữ nghĩa *(chỉ thiết kế)* | Cần dữ liệu tương tác chưa có |
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

## 4. Thứ tự ưu tiên sau MVP

1. FR11.2 cảnh báo hết hạn chứng nhận và tồn thấp (sự kiện `CertExpired`, `StockLow` đã có sẵn).
2. FR10.4 báo cáo tổng quan và FR2.2 thống kê cho nhà cung cấp.
3. FR5.3 mã giảm giá, FR9.2 yêu thích, FR4.7 báo cáo sai danh mục.
4. Các mục chỉ thiết kế và hướng phát triển ở Chương 8.

## 5. Việc cần làm theo tài liệu này

- Lịch trình (`backmatter/kehoach.tex`) xếp việc theo cột "Thuộc MVP"; các mục để sau MVP không có tuần riêng.
- Kiểm thử ở Chương 7 chỉ đo trên phần MVP.
- Khi chuyển một mục giữa hai cột, sửa file này, sửa đánh dấu *(chỉ thiết kế)* ở mục 4.3 nếu cần, và ghi một dòng vào `DECISIONS.md`.
