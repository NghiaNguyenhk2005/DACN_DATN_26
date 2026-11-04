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

## 9. Rà soát lệch hợp đồng và nhu cầu người dùng (lần 2, 05/11)

Rà trên `develop` `c22b73e` (sau PR #47, #48), chỉ đọc mã. `pnpm generate` + `typecheck` của shop và admin qua, nên
không lệch kiểu; các mục dưới là lệch về nghĩa (mã lỗi không có câu báo, trường bị bỏ qua, quy tắc gõ cứng) và chỗ
chưa đáp ứng người dùng thật. Mục mức Cao đã đối chiếu lại trên `c22b73e`.
Cột "Xử lý" ghi tuần và người nhận theo bảng phân công của nhóm: **T6** = hạn 06/11, **T7** = hạn 13/11; "HĐ" = cần
PR sửa `openapi.yaml` riêng.

### 9.1. Chung cho shop và admin

| # | Lệch | Vị trí | Mức | Xử lý |
|---|---|---|---|---|
| R1 | `problemMessage` bỏ `detail` và `errors[]` của Problem; thiếu câu cho `RATE_LIMITED`, `OTP_INVALID`, `OTP_EXPIRED`, `CART_LIMIT_REACHED`, `ADDRESS_LIMIT_REACHED`, `ORDER_NOT_PAYABLE`, `PAYMENT_FAILED`, `IDEMPOTENCY_KEY_REUSED`, `PAYLOAD_TOO_LARGE` → người dùng chỉ thấy "Thông tin chưa hợp lệ" dù API đã trả "Dâu: chỉ còn 2 kg" | `shop/lib/problem.ts`, `admin/lib/problem.ts` | Cao | T6 · Nghĩa |
| R2 | Giới hạn tần suất theo IP: shop gọi API từ máy chủ, không chuyển IP khách, `TRUST_PROXY=0` → mọi khách dùng chung một hạn mức (`/api/auth` 30 lần/phút cho cả shop) | `packages/contract/src/index.ts:17-26`, `api/core/security.ts` | Cao | T6 · Khải |
| R3 | Chính sách giao (giờ chốt 16:00, miễn phí từ 300.000₫, COD tới 1.000.000₫, khung giờ) gõ cứng ở shop; `PlatformSettings` chỉ có ở `/admin/settings` → admin đổi cấu hình thì shop nói sai | `decision.ts:63-67`, `buy-box.tsx:143,151`, `announcement-bar.tsx` | TB | T7 · Khải (HĐ: cấu hình công khai) |
| R4 | Quy tắc số lượng đoán từ chuỗi `saleUnit === "kg"`; giá quy đổi đọc "hộp 500g" bằng regex; `Listing` không có bước, lượng tối thiểu, khối lượng tịnh | `lib/decision.ts:42-55,93-100` | TB | T7 · Nghĩa (HĐ) |

### 9.2. Shop — trang chủ, tìm kiếm, danh mục, chi tiết sản phẩm, truy xuất

| # | Lệch | Vị trí | Mức | Xử lý |
|---|---|---|---|---|
| RK1 | Trên điện thoại khối mua (`hidden lg:block`) bị ẩn: mất thông tin giao, COD, hoàn tiền, "Chỉ còn N", gợi ý nhập lẻ; thanh dính đáy không có các dòng này | `buy-box.tsx:78,101,125,135-153` | Cao | T6 · Nghĩa |
| RK2 | Lô quá hạn sử dụng hoặc bị thu hồi vẫn mua được: API không loại khỏi lô đang bán, nút mua vẫn bật dù banner "Đã quá hạn sử dụng" | `in-memory-batch.repository.ts:39-48`, `inventory.service.ts:25-26` | Cao | T6 · Nghĩa |
| RK3 | Nhãn xanh "Lô hợp lệ" hiện cả khi không đọc được trạng thái (`trace === null`) và khi lô đã quá hạn sử dụng | `san-pham/[slug]/page.tsx:214-218`, `truy-xuat/[ma]/page.tsx:52-58` | Cao | T6 · Nghĩa |
| RK4 | Số lượng ban đầu cố định 1, không kẹp theo tồn (`available` 0,5 kg → tạm tính sai, thêm giỏ ra 422); nút "Thêm" ở thẻ luôn thêm 1 đơn vị | `buy-box.tsx:62`, `add-to-cart.tsx:53` | TB | Đã làm: #49 |
| RK5 | "Mua ngay" cộng dồn vào số đã có trong giỏ và đưa cả giỏ sang thanh toán; đọc rồi ghi không nguyên tử | `lib/data/account.ts:99-113` | Thấp | Mở |
| RK6 | `GET /products` không có sắp xếp; `PageBase` không có tổng số kết quả | hợp đồng `listProducts`, `PageBase` | Cao | T7 · Nghĩa (HĐ) |
| RK7 | "Xem thêm" mất khi bấm Back từ trang sản phẩm (danh sách giữ trong `useState`) | `product-results.tsx:22-24` | TB | T7 · Nghĩa |
| RK8 | `/tim-kiem` không lọc được theo danh mục dù hợp đồng cho `q` + `categoryId`; chứng nhận vẽ như checkbox nhưng chỉ chọn được một; khoảng giá không kiểm min > max | `filters.ts:104-112`, `filter-sidebar.tsx:55-106` | TB | T7 · Nghĩa |
| RK9 | Huy hiệu chứng nhận trên thẻ và dòng "Chứng nhận: VietGAP · OCOP" không xét hiệu lực (`ProductCard.certifications` là `CertType[]`), có thể đứng cạnh chứng nhận "Hết hiệu lực" | `san-pham/[slug]/page.tsx:68,128` | TB | T7 · Nghĩa (HĐ) |
| RK10 | Dữ liệu nhà cung cấp chỉ dùng ảnh đại diện; tên nhà cung cấp không có liên kết, chưa có trang hồ sơ công khai (hợp đồng đã đủ trường) | `san-pham/[slug]/page.tsx:54,86` | TB | T7 · Dũng |
| RK11 | Sản phẩm chưa mở bán hiện nút "Tạm hết hàng", ô "Hạn sử dụng" lấy giá trị `seasonality`; chưa có "báo khi có hàng / vào mùa" (FR5.7 thuộc MVP, nhưng `phuluc-chitiet.tex:370` ghi chỉ thiết kế) | `buy-box.tsx:70,115,187`, `san-pham/[slug]/page.tsx:129` | TB | T7 · Nghĩa (HĐ; cần thống nhất với báo cáo) |
| RK12 | Không chọn được lô, chỉ thấy lô hết hạn sử dụng sớm nhất; giỏ theo `listingId` không có lô | `san-pham/[slug]/page.tsx:53` | TB | Mở (HĐ) |
| RK13 | Trang chủ: lỗi tải sản phẩm làm mất cả trang, kể cả ô tra nguồn gốc | `(cua-hang)/page.tsx:25` | TB | Mở |
| RK14 | `q` dài hơn 100 ký tự (400) và 429 ở trang công khai đều ra "máy chủ không phản hồi" | `lib/data/index.ts:38-41,57` | Thấp | Mở |
| RK15 | Ô tra mã truy xuất không nhận cả đường dẫn quét từ QR; 404 không hướng dẫn định dạng mã | `trace-lookup.tsx` | Thấp | Mở |
| RK16 | Cảnh báo thu hồi ghi "liên hệ Farmery" nhưng shop không có kênh liên hệ nào; chân trang hiện trạng thái API cho người mua, thiếu chính sách giao, đổi trả | `recall-alert.tsx`, `site-footer.tsx` | TB | T6 · Nghĩa |
| RK17 | Trên điện thoại ở danh mục và chi tiết sản phẩm, ô tìm kiếm và tài khoản bị ẩn | `header-actions.tsx` | Thấp | Mở |

### 9.3. Shop — đăng nhập, giỏ hàng, thanh toán, đơn hàng

| # | Lệch | Vị trí | Mức | Xử lý |
|---|---|---|---|---|
| RG1 | Gửi lại mã gặp 429 thì form quay về ô email dù mã cũ còn hiệu lực; không đọc `Retry-After`, không đếm ngược | `login-form.tsx:24,73-78` | Cao | T6 · Khải |
| RG2 | `OTP_INVALID` và `OTP_EXPIRED` (gồm sai quá 5 lần) chung một câu, không chỉ đường xin mã mới | `auth-actions.ts:44` | TB | T6 · Khải |
| RG3 | Khách mới không có đường đăng ký; ngoài `DEMO_MODE` email lạ vẫn báo "Đã gửi mã" | `auth-actions.ts:25-26`, `identity.service.ts` | Cao | Mở (HĐ, cần quyết định phạm vi FR1.1) |
| RG4 | Cập nhật giỏ lỗi (vượt tồn, mất mạng) thì ô vẫn hiện số vừa gõ, giỏ giữ số cũ | `cart-line-controls.tsx:22-31`, `quantity-input.tsx:26-37` | TB | Đã làm: #49 |
| RG5 | Lỗi đặt hàng nằm trong cột tóm tắt cuối trang; trên điện thoại thanh "Đặt hàng" không có chỗ báo lỗi | `checkout-form.tsx:265-267,280-294` | Cao | T6 · Khải |
| RG6 | Báo giá lỗi `CART_QTY_EXCEEDS_STOCK` hiện trong ô Khung giờ, không nêu sản phẩm, không có link về giỏ | `checkout-form.tsx:138-141` | TB | T6 · Khải |
| RG7 | Sổ địa chỉ chỉ thêm, không sửa, xóa, đặt mặc định (FR1.5); không điền sẵn tên, SĐT từ `/me`; không có ghi chú giao hàng; không kiểm vùng giao | hợp đồng `/me/addresses`, `address-form.tsx:27-33` | Cao | T7 · Khải (HĐ) |
| RG8 | Chỉ hủy được đơn đang chờ thanh toán; đơn COD và đơn đã trả tiền (`cancellable: true`) không có nút hủy | `payment-panel.tsx:116-134` | Cao | T6 · Khải |
| RG9 | Hết giữ chỗ chỉ ghi "Vui lòng đặt lại", không có nút; `OrderItem` không có `listingId`, `productId` nên chưa làm được đặt lại, mua lại (FR5.6) | `payment-panel.tsx:58-66` | Cao | T7 · Khải (HĐ) |
| RG10 | Đơn chờ thanh toán hiện "Đã đặt"; trang chờ thanh toán không tự cập nhật (`LIVE_STATUSES` thiếu `placed`) | `labels.ts:40`, `don-hang/[ma]/page.tsx:19-27` | TB | T6 · Khải |
| RG11 | Không có lối liên hệ hay khiếu nại từ đơn (FR8.3) | `don-hang/[ma]/page.tsx` | TB | T7 · Khải (HĐ) |
| RG12 | Tài khoản nhà cung cấp, nhân viên mở giỏ, thanh toán, đơn hàng ra màn lỗi chung thay vì báo không đúng vai trò | `lib/data/account.ts:18-24` | Thấp | Mở |
| RG13 | Không có giỏ cho khách chưa đăng nhập (chỉ giữ một món qua `?them=`) | `session.ts:35-46` | TB | Mở |

### 9.4. Shop — khu nhà cung cấp

| # | Lệch | Vị trí | Mức | Xử lý |
|---|---|---|---|---|
| RN1 | API không kiểm lô thuộc nhà cung cấp đang đăng nhập ở xem lô, tạo lô, nhật ký; tạo lô không kiểm sản phẩm thuộc mình và đã duyệt (hợp đồng khai 403) | `seller-batch.controller.ts:35-45`, `catalog.service.ts` | Cao | T6 · Dũng |
| RN2 | Ô sản lượng lô `min={1}` chặn 0,5 kg trong khi hợp đồng chỉ yêu cầu > 0 | `create-batch-form.tsx:146` | Cao | T6 · Dũng |
| RN3 | Tạo lô và ghi nhật ký không gửi `Idempotency-Key`; form nhật ký giữ nội dung sau khi lưu → bấm lại là ghi trùng | `seller-actions.ts:31,65`, `farming-log-form.tsx:70-72` | Cao | T6 · Dũng |
| RN4 | Ngày nhật ký và ngày thu hoạch so theo UTC: 00:00–07:00 giờ Việt Nam không chọn được hôm nay | `farming-log-form.tsx:67`, `catalog.service.ts:469` | TB | T6 · Dũng |
| RN5 | Đính chính khó tìm (ô tích + dropdown cắt 45 ký tự), liệt kê cả dòng đã đính chính, chèn sẵn "Đính chính: <nội dung cũ>"; API cho đính chính một dòng hai lần | `farming-log-form.tsx:80,255-261`, `catalog.service.ts:474-486` | Cao | T6 · Dũng |
| RN6 | In tem QR bằng `window.print()` cả trang (không có CSS in); chưa tải được ảnh QR | `batch-qr-card.tsx:14-16,63` | TB | T6 · Dũng |
| RN7 | Chi tiết lô thu hồi chỉ hiện giờ thu hồi, không có lý do | `lo-hang/[id]/page.tsx:39` | TB | T6 · Dũng |
| RN8 | Nút trong form nhật ký nhỏ hơn 44px, khác các form khác trong khu | `farming-log-form.tsx:123,274-283` | TB | T6 · Dũng |
| RN9 | Lô bị từ chối chỉ khai được lô mới (mất nhật ký); không sửa, rút được lô đang chờ duyệt | `lo-hang/[id]/page.tsx:94-110` | Cao | T7 · Dũng (HĐ) |
| RN10 | `SellerProduct` không có `rejectReason` dù API lưu sẵn; không sửa, gửi duyệt lại được; tổng quan không nhắc sản phẩm bị từ chối | `openapi.yaml` `SellerProduct`, `san-pham/page.tsx:50` | Cao | T7 · Dũng (HĐ) |
| RN11 | `Batch` không có đã bán, đang giữ chỗ, còn lại; không có đơn vị sản lượng riêng của lô | hợp đồng `Batch`, `BatchInput` | Cao | T7 · Dũng (HĐ) |
| RN12 | Không có ảnh: `imageIds` của nhật ký, sản phẩm và `documentId` chứng nhận không được gửi; `POST /media` trả 501 | `seller-actions.ts:63-66,117-127`, `certification-form.tsx:113` | Cao | T7 · Dũng |
| RN13 | Mẫu nhật ký cố định nội dung dâu tây Hana cho mọi sản phẩm, ghi đè nội dung đang gõ; không lưu nháp khi rớt mạng | `farming-log-form.tsx:36-60` | TB | T7 · Dũng |
| RN14 | Báo giá sỉ chỉ có danh sách; `QuoteRequest` không có kênh liên hệ bên mua, `status` chỉ có `sent` (FR6.2–6.4) | `bao-gia/page.tsx:15` | Cao | T7 · Dũng (HĐ) |
| RN15 | Chứng nhận bị từ chối, sắp hết hiệu lực không có "Khai lại từ bản này"; tổng quan bỏ sót chứng nhận bị từ chối trong khi badge có đếm | `ho-so/page.tsx:75`, `nha-cung-cap/page.tsx:38-49`, `layout.tsx:38` | TB | Mở |
| RN16 | Chip gợi ý hạn sử dụng lọc `≤ 60` ngày nên trà, cà phê (365) mất chip; ngày thu hoạch chặn quá hôm nay + 2 | `create-batch-form.tsx:92,117` | Thấp | Mở |

### 9.5. Admin

| # | Lệch | Vị trí | Mức | Xử lý |
|---|---|---|---|---|
| RA1 | Hàng đợi duyệt xếp mới nhất trước, việc quá hạn bị đẩy xuống cuối; không lọc "quá hạn" | `in-memory-review-task.repository.ts:49`, `review-tasks/list.tsx:243` | Cao | T6 · Nghĩa |
| RA2 | Id việc duyệt sinh bằng `Date.now()` (13 chữ số) làm `nextCursor`, trái pattern `Cursor` `^[0-9]{1,9}$` → trang 2 trả 400 | `operations.service.ts:166`, `openapi.yaml:991-995` | Cao | T6 · Nghĩa |
| RA3 | Việc loại `supplier_profile`, `flagged_review`, `product_report` không có nội dung nhưng nút Duyệt vẫn bật; duyệt không tác động lên đối tượng | `operations.service.ts:44-119`, `review-tasks/show.tsx:107` | Cao | T6 · Nghĩa (khóa nút); T7 (điền nội dung) |
| RA4 | Duyệt xong ở lại trang, không có "việc kế tiếp" | `review-tasks/show.tsx:48-76` | Cao | T6 · Nghĩa |
| RA5 | Không ghi ai đã quyết định (`ReviewTaskDetail`, `OrderStatusEvent` không có người thực hiện); hai kiểm duyệt viên xử lý được cùng một việc | hợp đồng | TB | T7 · Nghĩa (HĐ) |
| RA6 | Nút "Chuyển sang…" không xét vai trò: `staff_warehouse` thấy cả bước của vận hành, bấm thì 403 câu chung | `orders/show.tsx:133-139`, `labels.ts` `nextOrderStep` | Cao | T6 · Khải |
| RA7 | `advance` không gửi trạng thái đang xem → hai người cùng bấm làm đơn nhảy 2 bước, không báo lỗi | `orders/show.tsx:106-110`, `retail.service.ts:350-363` | Cao | T6 · Khải (HĐ nhỏ: `expectedStatus`, 409) |
| RA8 | Danh sách đơn thiếu cột thanh toán, khung giao; không tìm theo mã đơn, SĐT; không chọn nhiều để chuyển bước | `orders/list.tsx:44-70`, hợp đồng `OrderSummary`, `listOrders` | Cao | T7 · Khải (HĐ) |
| RA9 | "15 phút giữ chỗ" gõ cứng dù cấu hình được; chi tiết đơn không hiện mã truy xuất, đơn giá, VAT | `orders/show.tsx:148,185-212` | Thấp | Mở |
| RA10 | `StockHolding` không có hạn sử dụng, tên nhà cung cấp; lọc tồn bằng `batchId` nội bộ; không tô dòng hết hàng | `inventory/list.tsx:30-83`, hợp đồng `StockHolding` | Cao | T6 · Khải (HĐ nhỏ: `bestBefore`) |
| RA11 | Sổ nhập xuất hiện chung dấu +/− cho giữ chỗ và tồn thực; `sourceType #sourceId` là chữ thô tiếng Anh | `inventory/list.tsx:122-135` | TB | T7 · Khải |
| RA12 | Form cấu hình thiếu giới hạn của hợp đồng (giờ chốt nhận 29:00, khung giờ không kiểm định dạng, trùng); lưu ngay không xác nhận, không lịch sử | `settings/index.tsx:189-243` | TB | T7 · Khải |
| RA13 | 401 chỉ tự đăng xuất khi đi qua `dataProvider`; các lời gọi trực tiếp (tổng quan, kho, cấu hình, duyệt, chuyển bước) chỉ hiện toast | `admin/lib/api.ts`, `auth-provider.ts:56` | TB | T6 · Khải |
| RA14 | Gửi OTP bị 429 hiện "Email chưa có tài khoản Farmery."; không có nút gửi lại mã; `CONFLICT` luôn báo "Việc duyệt này đã có quyết định" kể cả lỗi từ đơn hàng | `login/index.tsx:21-22`, `problem.ts:7` | TB | T6 · Khải (luồng), Nghĩa (câu báo, R1) |
| RA15 | Không tự làm mới hàng đợi; tổng quan chỉ có số liệu kiểm duyệt, vai trò khác vào thấy trang trống | `dashboard/index.tsx:100-147` | TB | Mở |
| RA16 | Quyền menu chép tay từ `x-roles`, chưa có test đối chiếu (hiện đang khớp) | `App.tsx:41-65` | Thấp | Mở |
