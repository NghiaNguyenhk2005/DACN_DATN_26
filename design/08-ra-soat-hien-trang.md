# 08 — Rà soát hiện trạng so với tài liệu thiết kế

Rà ngày 05/11/2026 trên nhánh `feat/fe-thiet-ke-ux` (tách từ `feat/gop-be2-giao-dich`, commit `0b3df68`).
Mức độ: **Cao** = sai nghĩa / cản trở việc chính · **TB** = không nhất quán, gây nhầm · **Thấp** = thẩm mỹ, chi tiết.
Cột "Xử lý" trỏ tới hạng mục của phiên 05/11 (B2–B11) hoặc "Mở" nếu chưa xử lý.

## 1. Thuật ngữ, nội dung (so với 06)

| # | Lệch | Vị trí | Mức | Xử lý |
|---|---|---|---|---|
| T1 | Chứng nhận: shop "Còn hạn/Hết hạn", "Đến dd/mm" — admin "Còn hiệu lực/Hết hiệu lực" | `shop/components/farmery/certificate-list.tsx:13,41`; `admin/pages/review-tasks/show.tsx:247` | Cao | B8 |
| T2 | Trạng thái lô có 4 cách gọi "chờ": Chờ duyệt / Chờ kiểm duyệt / Chờ kiểm định / Đang chờ duyệt | `nha-cung-cap/lo-hang/page.tsx:36`, `lo-hang/[id]/page.tsx:114`, `nha-cung-cap/page.tsx:53` | TB | B8 |
| T3 | "Đã duyệt" / "Đã duyệt mở bán" / "Đã phê duyệt mở bán"; "Từ chối" dùng cho cả trạng thái | `lo-hang/page.tsx:37`, `lo-hang/[id]/page.tsx:109`, `labels.ts` (shop, admin) | TB | B8 |
| T4 | "Hạn dùng", "Hạn dùng tốt nhất (Best Before)" thay "Hạn sử dụng" (báo cáo dùng "hạn sử dụng") | `san-pham/[slug]/page.tsx:107`, `truy-xuat/[ma]/page.tsx:74`, `create-batch-form.tsx:96`, `lo-hang/[id]/page.tsx:151`, `admin review-tasks/show.tsx:180`, `seller-actions.ts:27` | TB | B8 |
| T5 | Chính tả lẫn "huỷ/hủy", "khoá" — báo cáo và antd `vi_VN` dùng "hủy, khóa" | 20+ chỗ: `labels.ts` (2 app), `problem.ts`, `payment-panel.tsx`, `address-form.tsx`, `i18n-provider.ts:16`, `inventory/list.tsx:80-82` | Thấp | B8 |
| T6 | "Hủy bỏ" (khu nhà cung cấp) vs "Hủy" | `create-batch-form.tsx:153`, `create-product-form.tsx:105`, `farming-log-form.tsx:273` | Thấp | B8 |
| T7 | Từ sai vai trò: "Kiểm định viên", "kiểm định", "Cán bộ hỗ trợ vùng", "Hàng đợi kiểm duyệt" cho nhà cung cấp | `lo-hang/[id]/page.tsx:94,211,345`, `lo-hang/tao-moi/page.tsx:40`, `create-batch-form.tsx:142` | TB | B8 |
| T8 | Nhãn hoạt động nhật ký đặt tên riêng dài ("Chăm sóc & Bón phân & Tưới tiêu") khác `labels.ts` | `lo-hang/[id]/page.tsx` `ACTIVITY_CONFIG` | TB | B8 |
| T9 | Hiện id kỹ thuật cho nhà cung cấp: "ID #…", "#log.id", "Mã định danh lô: #…" | `nha-cung-cap/page.tsx:132`, `lo-hang/[id]/page.tsx:128,281`, `farming-log-form.tsx:255` | TB | B5 |
| T10 | Sản lượng ghi "đơn vị" chung chung thay đơn vị của sản phẩm | `lo-hang/page.tsx:182`, `lo-hang/[id]/page.tsx:161` | TB | B5 |
| T11 | Ví dụ "Dâu tây Mộc Châu" ngoài vùng thí điểm Lâm Đồng | `create-product-form.tsx:36` | Thấp | B8 |
| T12 | Nói quá: "cấp mã QR tự động", "mã QR … độc nhất", "hệ thống xác nhận đạt chuẩn" — thật ra kiểm duyệt viên duyệt tay | `create-batch-form.tsx:140-142` | TB | B8 |
| T13 | Báo cáo gọi chứng nhận "sắp hết hạn", "ngày hết hạn" (9 chỗ) — lệch quy ước "hiệu lực" | `chuong4:112,119,299,648,698,867`, `phuluc-chitiet:377`, `phuluc-matran:44`, `phuluc-sukien:32` | Thấp | Mở — cần nhóm đồng ý sửa báo cáo |

## 2. Hệ thống thiết kế (so với 04)

| # | Lệch | Vị trí | Mức | Xử lý |
|---|---|---|---|---|
| D1 | Màu ngoài token: `emerald/blue/amber/purple/zinc` cho 5 loại hoạt động | `lo-hang/[id]/page.tsx` `ACTIVITY_CONFIG` | TB | B5 |
| D2 | Đổ bóng thẻ/nút (`shadow-xs/2xs/sm/md`, 37 chỗ) trái quy tắc "thẻ dùng viền" | khu `nha-cung-cap/**` | Thấp | B5 |
| D3 | Bo góc theo cỡ (`rounded-lg/xl/2xl`, 56 chỗ) thay token vai trò | khu `nha-cung-cap/**`, vài component | Thấp | B5 (khu nhà cung cấp) / Mở (phần còn lại) |
| D4 | Admin dùng `RefineThemes.Green`, chưa đặt `colorPrimary` #1f5132 dù comment ghi "chỉnh theo bảng màu shop" | `admin/src/theme.ts` | TB | B8 |
| D5 | Ô nhập form nhà cung cấp tự viết class, không qua component `Field`/`input` chung; lỗi chỉ hiện ở đầu form | `create-*-form.tsx`, `farming-log-form.tsx` | TB | Mở |
| D6 | `text-micro` cho thông tin cần đọc ở khu nhà cung cấp (trạng thái, người ghi, thời điểm) | `lo-hang/**` | Thấp | B5 |

## 3. Kiến trúc thông tin, điều hướng (so với 02)

| # | Lệch | Vị trí | Mức | Xử lý |
|---|---|---|---|---|
| I1 | Tab trộn nơi đến và hành động ("Đăng sản phẩm mới", "Khai báo lô mới" là tab) | `nha-cung-cap/seller-nav-tabs.tsx` | Cao | B5 |
| I2 | CTA "Khai báo lô" lặp 3 lần trên cùng màn (header khu, tab, link trong khối) + nút cam ở trang danh sách lô | `nha-cung-cap/layout.tsx:70`, `seller-nav-tabs.tsx`, `nha-cung-cap/page.tsx:242`, `lo-hang/page.tsx:54` | TB | B5 |
| I3 | Không có nơi nhập/xem chứng nhận cho nhà cung cấp; hợp đồng không có thao tác | — | Cao | B3 |
| I4 | Không có trang tổng quan "việc cần làm"; trang đầu khu là danh sách sản phẩm | `nha-cung-cap/page.tsx` | TB | B5 |
| I5 | Không có lối vào danh mục bằng hình ở trang chủ (chỉ thanh chữ) | `(cua-hang)/page.tsx` | TB | B10 |

## 4. Luồng, tương tác (so với 03, 05)

| # | Lệch | Vị trí | Mức | Xử lý |
|---|---|---|---|---|
| U1 | Nút Duyệt/Từ chối ở header; người duyệt đọc hết nhật ký rồi phải cuộn lên; có thể duyệt khi chưa xem | `admin/pages/review-tasks/show.tsx:84-108` | Cao | B4 |
| U2 | Ô tìm kiếm không gợi ý, không đồng nghĩa ("rau sạch", "salad"), không hiểu cụm lọc, 0 kết quả không gợi ý sửa | `search-box.tsx`, `tim-kiem/page.tsx` | Cao | B2 |
| U3 | Khung mua chỉ có chế độ lẻ; không có lối hỏi giá sỉ dù vai trò `buyer_wholesale` đã có | `buy-box.tsx` | TB | B7 |
| U4 | Thiếu thông tin ra quyết định: độ tươi theo ngày, giá quy đổi, tồn thấp, hiệu lực chứng nhận đến bao giờ ở trang chi tiết, ước tính giao | `san-pham/[slug]/page.tsx`, `product-card.tsx` | TB | B9 |
| U5 | Khai lô: không gợi ý hạn sử dụng, không cho thấy chứng nhận đi kèm, mặc định sản lượng 100 | `create-batch-form.tsx` | TB | B3, B9 |
| U6 | Lý do từ chối không có mẫu; nhà cung cấp không được chỉ việc cần làm tiếp | `review-tasks/show.tsx`, `lo-hang/[id]/page.tsx` | Thấp | B4 |
| U7 | Không có thao tác sửa sản phẩm/lô trong hợp đồng; sửa tại chỗ chưa có nguyên tắc | — | Thấp | B6 (chỉ thảo luận) |

## 5. Dữ liệu demo

| # | Lệch | Vị trí | Mức | Xử lý |
|---|---|---|---|---|
| M1 | Danh mục thưa: nấm, atisô/thảo mộc, trà, cà phê, quả mọng ít hoặc không có sản phẩm → trang danh mục trống | `packages/mock-data/src/products.ts` | TB | B11 |
| M2 | Danh mục không có ảnh → không dựng được lưới danh mục | hợp đồng `Category` | TB | B10 |
| M3 | Không có tài khoản doanh nghiệp mua sỉ mẫu | `api/modules/identity/seed-accounts.ts` | TB | B7 |

## 6. Phát hiện thêm trong lúc sửa

| # | Lệch | Vị trí | Mức | Xử lý |
|---|---|---|---|---|
| X1 | `POST /seller/products` chưa có ở API (trả 501) — form "Đăng sản phẩm" không chạy được | `apps/api/.../seller-batch.controller.ts` | Cao | Đã làm 05/11 |
| X2 | `/seller/products` gõ cứng nhà cung cấp "101", đơn vị "kg"; `/seller/batches` trả lô của mọi nhà cung cấp | `catalog.service.ts` | Cao | Đã làm 05/11 (theo tài khoản đăng nhập) |
| X3 | Bộ lọc vùng của shop theo địa giới mới (Lang Biang, Hiệp Thạnh) nhưng dữ liệu mẫu còn tên cũ → 2 chip trả rỗng | `mock-data/suppliers.ts` | TB | Đã làm 05/11 |
| X4 | 14/30 sản phẩm mẫu không có lô đã duyệt → không có tồn → hiện "Hết hàng" | `mock-data` | TB | Đã làm 05/11 (B11) |
| X5 | Ngày lô mẫu cố định quanh 16/10 → sau mốc đó mọi lô quá hạn sử dụng | `mock-data` | TB | Đã làm 05/11 (`createSeed` dời ngày) |
| X6 | Nút đầu trang chi tiết admin hiện khóa dịch thô `review-tasks.titles.list` | `admin/providers/i18n-provider.ts` | Thấp | Đã làm 05/11 |
| X7 | Việc duyệt mẫu có hạn xử lý cố định 19/10 → luôn "Quá hạn" khi demo | `operations/in-memory-review-task.repository.ts` | Thấp | Mở |
| X8 | So khớp gần đúng của API quá rộng ("bongcaii" ra cà chua) nên gợi ý sửa từ ít khi xuất hiện | `catalog/utils/vietnamese-search.util.ts` | TB | Mở (NOTES 16/10) |

## 7. Trạng thái sau phiên 05/11

Đã xử lý: T1–T12, D1, D2 và D3, D6 trong khu nhà cung cấp, D4, I1–I5, U1–U6, M1–M3, X1–X6.
Còn mở: T13 (sửa báo cáo), D3 ngoài khu nhà cung cấp, D5 (component `Field` chung), U7 (sửa tại chỗ cần `PATCH`), X7, X8.

## 8. Ngoài phạm vi phiên này (ghi lại)

- D3 phần ngoài khu nhà cung cấp, D5 component `Field` chung: làm khi chạm tới form tiếp theo.
- T13 sửa báo cáo: cần nhóm đồng ý.
- Sửa tại chỗ thật (cần `PATCH` sản phẩm/lô): MVP.
