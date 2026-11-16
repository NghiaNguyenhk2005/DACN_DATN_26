# 01 — Người dùng và hành trình

Rút từ persona (báo cáo §4.2.6) và bản đồ hành trình (Phụ lục Q), viết lại theo góc nhìn giao diện: mỗi nhóm cần
**trả lời được câu hỏi gì** ở mỗi bước. Danh sách câu hỏi là đầu vào cho "thông tin hỗ trợ ra quyết định" ở 05.

## 1. Bốn nhóm người dùng

| Nhóm | Persona | App, thiết bị chính | Năng lực số | Nguyên tắc thiết kế rút ra |
|---|---|---|---|---|
| Khách lẻ | Anh Minh Trí, 29, TP.HCM | Shop, điện thoại (≥70% thời gian) | Thành thạo TMĐT | Nhanh, ít bước, bằng chứng nguồn gốc nhìn thấy ngay chứ không giấu trong tab |
| Doanh nghiệp mua sỉ | Chị Mai Phương, 35, thu mua chuỗi | Shop, máy tính | Thành thạo ERP | Số liệu đầy đủ, bảng rõ, giá theo bậc, giấy tờ tải được |
| Nhà cung cấp | Bác Ba Hưng, 52, HTX Đơn Dương | Shop (khu nhà cung cấp), Android tầm trung, 4G chập chờn | Thấp, quen Zalo | Mỗi màn một việc, chữ to, nút lớn, ít trường, gợi ý sẵn, không thuật ngữ kỹ thuật |
| Nhân viên nội bộ | Kiểm duyệt viên, vận hành, kho, thu mua (Chị Thu Hà) | Admin, laptop; thu mua dùng cả điện thoại | Thành thạo | Mật độ thông tin cao, đối chiếu nhanh, quyết định có kiểm soát (không bấm nhầm) |

## 2. Câu hỏi cần trả lời theo bước

### Khách lẻ — Khám phá → Thẩm định → Đặt → Nhận → Quay lại

| Bước | Câu hỏi của người dùng | Giao diện trả lời bằng |
|---|---|---|
| Khám phá | Hôm nay có gì ngon, đang vào mùa? Tìm "dâu" có ra "dâu tây" không? | Trang chủ theo mùa, lưới danh mục, ô tìm kiếm có gợi ý, đồng nghĩa |
| Thẩm định | Có tươi không — hái hôm nào, còn dùng được mấy ngày? | "Thu hoạch N ngày trước", "Còn N ngày hạn sử dụng" |
| | Chứng nhận có thật, còn hiệu lực không? | Nhãn chứng nhận + "Còn hiệu lực đến dd/mm/yyyy", link trang truy xuất |
| | Ai trồng, ở đâu? | Tên nhà cung cấp + vùng trồng ngay dưới tên sản phẩm |
| | Đắt hay rẻ? Hộp 500 g và 1 kg so sao? | Giá quy đổi theo kg/100 g |
| | Còn hàng không, có kịp giao không? | "Chỉ còn N", "Đặt trước 16:00 — giao sáng mai" |
| | Hỏng thì sao? | Cam kết hoàn tiền 24 giờ ngay cạnh nút mua |
| Đặt | Tổng bao nhiêu, phí giao, khi nào tới? | Tạm tính sống, phí giao/miễn phí từ 300.000₫, khung giờ |
| Nhận | Đơn đang ở đâu? | Dòng thời gian 8 bước, tự làm mới |
| Quay lại | Lô mình mua có bị thu hồi không? | Cảnh báo thu hồi trên trang đơn và trang truy xuất |

### Doanh nghiệp mua sỉ

| Bước | Câu hỏi | Giao diện trả lời bằng |
|---|---|---|
| Tìm nguồn | Ai có đủ sản lượng, đạt VietGAP/GlobalGAP? | Lọc chứng nhận, vùng trồng; trang sản phẩm có chế độ "Mua sỉ" |
| Hỏi giá | Mua 500 kg giá bao nhiêu? Tối thiểu bao nhiêu? Bao lâu chuẩn bị? | Bảng bậc giá, lượng tối thiểu (MOQ), thời gian chuẩn bị, ước tính tổng theo bậc |
| Gửi yêu cầu | Gửi cho ai, khi nào có trả lời? | Form yêu cầu báo giá gửi thẳng nhà cung cấp, trạng thái "Đã gửi — chờ nhà cung cấp phản hồi" |

### Nhà cung cấp

| Bước | Câu hỏi | Giao diện trả lời bằng |
|---|---|---|
| Vào khu | Hôm nay tôi cần làm gì? | Tổng quan: việc cần xử lý (lô bị từ chối, chứng nhận sắp hết hiệu lực, yêu cầu báo giá mới) |
| Đăng sản phẩm | Điền gì, chọn đơn vị nào? | Gợi ý đơn vị theo danh mục, ví dụ đúng vùng Lâm Đồng |
| Chứng nhận | Nhập chứng nhận ở đâu, lúc nào? | Tab Hồ sơ & chứng nhận; nhập tại chỗ khi đăng sản phẩm thiếu chứng nhận |
| Khai lô | Hạn sử dụng đặt bao nhiêu ngày? Chứng nhận nào đi kèm lô? | Gợi ý hạn theo loại sản phẩm; danh sách chứng nhận sẽ gắn + cảnh báo hết hiệu lực |
| Chờ duyệt | Bao lâu được duyệt, bị từ chối vì sao, sửa gì? | Hạn duyệt 48 giờ, lý do từ chối nổi bật kèm việc cần làm |
| Sau duyệt | Lấy QR in tem thế nào? | Thẻ QR có nút tải/in |
| Bán sỉ | Có ai hỏi mua sỉ không? | Danh sách yêu cầu báo giá trong khu nhà cung cấp |

### Kiểm duyệt viên

| Bước | Câu hỏi | Giao diện trả lời bằng |
|---|---|---|
| Hàng đợi | Việc nào gấp, quá hạn? | Cột hạn xử lý tô đỏ khi quá hạn, mặc định lọc "Chờ duyệt" |
| Xem việc | Hồ sơ có đủ, khớp nhau không? | Checklist đối chiếu: chứng nhận còn hiệu lực sau hạn sử dụng lô, có nhật ký thu hoạch, ảnh… |
| Quyết định | Đã xem hết chưa? Lý do từ chối viết sao cho nhà cung cấp hiểu? | Thanh quyết định ở cuối nội dung (dính đáy), lý do mẫu chọn nhanh |

## 3. Ràng buộc chung rút ra

- **Mobile-first cho shop**, bố cục 390 px là chuẩn; admin desktop-first, chỉ cần dùng được trên tablet.
- **Nhà cung cấp ít rành công nghệ** (NFR6): một màn một việc chính, nhãn đời thường, không hiện id kỹ thuật, vùng
  chạm ≥44 px, form dài chia nhóm, giữ dữ liệu khi mất mạng giữa chừng (bản nháp).
- **Niềm tin là sản phẩm chính**: bằng chứng (chứng nhận, nhật ký, thu hồi) phải nằm trên đường mua, không chỉ ở
  trang truy xuất.
- **Hai loại "hạn" khác nhau**: hạn sử dụng của nông sản và hiệu lực của chứng nhận — không dùng chung một chữ
  (xem 06).
