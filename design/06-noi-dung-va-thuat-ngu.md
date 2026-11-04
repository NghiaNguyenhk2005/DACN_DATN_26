# 06 — Nội dung và thuật ngữ

## 1. Giọng văn

- Xưng "bạn" với người dùng; câu ngắn, chủ động, nói điều xảy ra và việc cần làm tiếp.
- Khu nhà cung cấp: từ đời thường của nhà vườn ("thu hoạch", "lô", "tem QR"), không từ kỹ thuật ("ID", "hàng đợi",
  "đơn vị" chung chung, "Best Before", "kiểm định").
- Không phóng đại ("độc nhất", "tự động" khi thật ra là người duyệt).

## 2. Mẫu câu

| Loại | Quy tắc | Ví dụ đúng | Tránh |
|---|---|---|---|
| Nút | Động từ + tân ngữ, ≤4 từ | "Khai báo lô", "Gửi duyệt", "Thêm vào giỏ" | "OK", "Xác nhận" chung chung |
| Nút đang chạy | "Đang …" + spinner | "Đang gửi…" | "Loading" |
| Lỗi | Điều gì sai + cách sửa | "Hạn sử dụng phải sau ngày thu hoạch." | "Dữ liệu không hợp lệ" |
| Thành công | Việc đã xong + bước tiếp | "Đã gửi duyệt. Thường có kết quả trong 48 giờ." | "Thành công!" |
| Rỗng | Vì sao rỗng + hành động | "Chưa có lô nào. Khai báo lô đầu tiên để bắt đầu bán." | "Không có dữ liệu" |
| Ví dụ trong ô nhập | Dữ liệu đúng vùng thí điểm Lâm Đồng | "Dâu tây Hana Đà Lạt" | "Dâu tây Mộc Châu" |

## 3. Bảng thuật ngữ chuẩn

Một khái niệm — một từ, dùng giống nhau ở shop, admin, API message và báo cáo. Cột "Không dùng" là các biến thể đã
gặp trong code (xem 08).

### Trạng thái duyệt (`ReviewStatus`, `TaskStatus`)

| Mã | Từ chuẩn | Màu | Không dùng |
|---|---|---|---|
| `draft` | Nháp | trung tính | |
| `pending_review`, `open` | **Chờ duyệt** | cảnh báo | Chờ kiểm duyệt, Chờ kiểm định, Đang chờ duyệt, hàng đợi |
| `in_review` | Đang duyệt | thông tin | |
| `approved` | **Đã duyệt** | thành công | Đã duyệt mở bán, Đã phê duyệt mở bán |
| `rejected` | **Bị từ chối** | nguy hiểm | Từ chối (dùng cho nút hành động, không cho trạng thái) |
| `hidden` | Đã ẩn | trung tính | |

"Từ chối" là **nút** (hành động); "Bị từ chối" là **trạng thái**. Tương tự "Duyệt" (nút) / "Đã duyệt" (trạng thái).

### Hai loại "hạn"

| Khái niệm | Từ chuẩn | Không dùng |
|---|---|---|
| Ngày nông sản còn dùng được (`bestBefore`) | **Hạn sử dụng** | Hạn dùng, Hạn dùng tốt nhất (Best Before), HSD |
| Chứng nhận còn giá trị | **Còn hiệu lực** · **Sắp hết hiệu lực** (≤30 ngày) · **Hết hiệu lực** | Còn hạn, Hết hạn (cho chứng nhận) |
| Ngày ghi trên chứng nhận | "Hiệu lực đến dd/mm/yyyy" | "Đến …", "Hết hạn …" |
| Hạn xử lý việc duyệt | Hạn xử lý · **Quá hạn** | |
| Thời gian giữ hàng của đơn chưa trả | Giữ chỗ · "Quá thời gian giữ chỗ" | |

Lý do: "hạn sử dụng" là thuật ngữ ghi nhãn hàng hóa (Nghị định 43/2017), báo cáo dùng 15 lần; "hiệu lực" là thuật ngữ
của giấy chứng nhận. Tách hai từ để người mua không nhầm "còn hạn" của chứng nhận với hạn của rau.

### Người và vai trò

| Khái niệm | Từ chuẩn | Không dùng |
|---|---|---|
| Bên cung cấp hàng | **Nhà cung cấp** | người bán, nhà vườn (trong nhãn hệ thống; được dùng trong văn mô tả) |
| Khách mua sỉ | **Doanh nghiệp mua sỉ** (đầy đủ), **khách sỉ** (ngắn) | khách hàng B2B |
| Nhân viên duyệt | **Kiểm duyệt viên** | kiểm định viên, cán bộ kiểm duyệt |
| Nhân viên nhập hộ | Nhân viên hỗ trợ vùng — "nhập hộ" | Cán bộ hỗ trợ vùng |

### Đối tượng

| Khái niệm | Từ chuẩn | Ghi chú |
|---|---|---|
| Lô thu hoạch | **Lô** (nhãn), "lô hàng" trong câu | |
| Mã người dùng thấy của lô | **Mã lô** (`batchCode`) | |
| Mã trên QR | **Mã truy xuất** (`traceCode`) | Không gọi "mã QR truy xuất" cho chuỗi mã |
| Tem có QR | **Tem QR** | |
| Nhật ký | **Nhật ký canh tác**; dòng sửa: **Bản đính chính**; dòng cũ: **Đã được đính chính** | |
| Hoạt động nhật ký | Gieo trồng · Chăm sóc · Phòng trừ sâu bệnh · Thu hoạch · Công việc khác | Theo `labels.ts`, không đặt tên dài riêng |
| Yêu cầu báo giá sỉ | **Yêu cầu báo giá** | RFQ (chỉ trong tài liệu kỹ thuật) |
| Lượng tối thiểu | **Lượng tối thiểu** (MOQ trong ngoặc ở tooltip) | |

### Chính tả

Đặt dấu thanh **kiểu cũ**, thống nhất với báo cáo và locale `vi_VN` của Ant Design: **hủy, khóa, xóa, hóa đơn, thủy canh**.
Không dùng "huỷ, khoá, hoá, xoá".
Số: `1.250.000₫`, ngày `dd/mm/yyyy`, giờ `14:05`, khối lượng `500 g`, `1,5 kg`.
