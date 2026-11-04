# 05 — Đặc tả màn hình

Mỗi màn: **mục đích** · khối nội dung theo thứ tự ưu tiên · bố cục · trạng thái · hành động. "Hỗ trợ quyết định"
đánh dấu ◆ là thông tin trả lời câu hỏi ở 01 §2.

## Shop — công khai

### S1. Trang chủ `/`
Mục đích: cho thấy hàng đang vào mùa, đưa nhanh vào danh mục hoặc tra nguồn gốc.
1. Hero theo mùa + ô tra nguồn gốc (≥lg: `[1fr | 336px]`; <lg xếp dọc).
2. **Mua theo danh mục**: ≥md lưới 5 cột ô ảnh (ảnh danh mục, tên, "N sản phẩm"); <md slider cuộn ngang có snap,
   ô rộng 40% để thấy 2,5 ô (gợi ý vuốt), không mũi tên.
3. Chip lọc nhanh (chứng nhận, còn hàng, vùng trồng).
4. Đang vào mùa: lưới thẻ sản phẩm + "Xem tất cả".
Trạng thái: danh mục lỗi → ẩn khối 2 (không làm hỏng trang); không có sản phẩm vào mùa → EmptyState.

### S2. Danh mục, S3. Tìm kiếm
- Đầu trang: breadcrumb, H1 (serif), số kết quả nếu có.
- Tìm kiếm: hàng **chip "đã hiểu"** dưới H1 khi câu tìm chứa cụm lọc ("Hữu cơ ×", "Dưới 200.000₫ ×"); dòng "Có phải
  bạn muốn tìm *dâu tây*?" khi có gợi ý sửa.
- Bộ lọc: sidebar ≥lg, sheet <lg. Kết quả: lưới thẻ, "Xem thêm" theo con trỏ.
- 0 kết quả: gợi ý sửa từ, danh mục liên quan, nút "Bỏ bộ lọc".

### Ô tìm kiếm đầu trang (mọi trang)
- Gõ ≥1 ký tự → sau 200 ms hiện bảng gợi ý: Sản phẩm (≤5, ảnh nhỏ + giá), Danh mục (≤3), Vùng trồng (≤2), dòng cuối
  "Tìm tất cả “x”". Ô trống + focus → "Tìm gần đây" (≤5, lưu trên máy, có nút xoá).
- Bàn phím: ↑↓ chọn, Enter mở, Esc đóng; `role="combobox"`, `aria-expanded`, `aria-activedescendant`.
- Mobile: bảng gợi ý phủ toàn chiều rộng dưới ô.

### S4. Chi tiết sản phẩm `/san-pham/[ten-id]`
Bố cục ≥lg `[520 | 1fr | 300]`; <lg một cột, khung mua dính đáy.
1. Ảnh.
2. Tên (serif) · nhà cung cấp · vùng trồng.
3. Giá + đơn vị; ◆ **giá quy đổi** "≈ 240.000₫/kg" khi đơn vị bán có khối lượng (hộp 500 g…).
4. ◆ **Dải độ tươi**: "Thu hoạch 2 ngày trước · Còn 5 ngày hạn sử dụng" (cảnh báo khi ≤2 ngày).
5. FactGrid: Ngày thu hoạch · Vùng trồng · Chứng nhận · Hạn sử dụng.
6. ◆ **Chứng nhận**: từng chứng nhận "VietGAP · Còn hiệu lực đến 12/2027" (link trang truy xuất).
7. Tab: Mô tả · Nhật ký canh tác (QR, dòng thời gian).
8. Sản phẩm tương tự.

**Khung mua** — nút gạt **Mua lẻ | Mua sỉ** ở đầu khung, chỉ hiện khi nhà cung cấp có bảng giá sỉ cho sản phẩm (không
hiện công tắc dẫn tới khung trống).
- Mua lẻ: nhà cung cấp, **ô số lượng gõ tự do** (xem 04 §5, QuantityInput), tạm tính, Mua ngay (cam), Thêm vào giỏ (viền); ◆ "Chỉ còn N" khi tồn ≤10;
  ◆ "Đặt trước 16:00, giao sáng mai"; cam kết giao, hoàn tiền, thanh toán.
- Mua sỉ: bảng bậc giá (từ X → giá/đơn vị, bậc đang áp dụng tô `primary`), lượng tối thiểu, thời gian chuẩn bị, ô nhập
  sản lượng → ◆ ước tính tổng; nút "Gửi yêu cầu báo giá" (cam). Dưới lượng tối thiểu → cảnh báo vàng, gợi ý Mua lẻ.
  Mobile: thanh dính đáy giữ cho mua lẻ; khối "Mua sỉ từ <nhà cung cấp>" nằm ngay trong cột nội dung, trên tab Mô tả.
- Form yêu cầu báo giá (trong khung): sản lượng, ngày cần hàng, ghi chú; gửi xong hiện "Đã gửi tới <nhà cung cấp>".

### S5. Truy xuất `/truy-xuat/[traceCode]`
Thu hồi (nếu có) lên đầu, đỏ; FactGrid 4 cột; chứng nhận; nhật ký đầy đủ kể cả đính chính.

### S6–S9. Đăng nhập, giỏ, thanh toán, đơn hàng
- Giỏ: sửa số lượng **tại chỗ** bằng cùng ô số lượng của khung mua, xóa dòng, tạm tính sống.
- Thanh toán: 3 bước (Giao đến · Khung giờ · Thanh toán), một nút cam cuối.
- Đơn: đếm ngược giữ chỗ, dòng thời gian 8 bước, cảnh báo thu hồi.

## Shop — khu nhà cung cấp

Đầu khu: tên nhà cung cấp, vùng trồng, mã vùng trồng, nhãn chứng nhận còn hiệu lực. Hàng điều hướng:

```
[Tổng quan] [Lô hàng ②] [Sản phẩm] [Hồ sơ & chứng nhận ①]        (Đăng sản phẩm)  (Khai báo lô)
 gạch chân 2px primary, badge = số việc cần xử lý                  nút viền          nút cam
```
Mobile: hàng tab cuộn ngang; "Khai báo lô" thành nút cam dính đáy, "Đăng sản phẩm" vào trang Sản phẩm.

### N1. Tổng quan `/nha-cung-cap`
1. **Việc cần làm** (chỉ hiện khi có): lô bị từ chối (link tới lô), chứng nhận hết/sắp hết hiệu lực (≤30 ngày),
   yêu cầu báo giá mới.
2. Số liệu nhanh: sản phẩm · lô đang bán · chờ duyệt · bị từ chối (bấm được → danh sách đã lọc).
3. Lô gần đây (5 dòng).
4. Quy trình 3 bước (chỉ hiện khi chưa có lô nào).

### N2. Lô hàng `/nha-cung-cap/lo-hang`
Lọc trạng thái dạng segmented: Tất cả · Chờ duyệt · Đã duyệt · Bị từ chối; chip "Sản phẩm: X ×". Thẻ lô: mã lô,
sản phẩm, trạng thái, thu hoạch, hạn sử dụng, sản lượng **kèm đơn vị của sản phẩm**; bị từ chối hiện lý do.

### N3. Khai báo lô `/nha-cung-cap/lo-hang/tao-moi`
Sản phẩm → ngày thu hoạch → hạn sử dụng (◆ gợi ý "+N ngày" theo danh mục, chip chọn nhanh 3/5/7/14 ngày) → sản lượng
(đơn vị hiện bên phải ô) → **Chứng nhận đi kèm lô** (chỉ đọc; ◆ cảnh báo chứng nhận hết hiệu lực trước hạn sử dụng)
→ Hủy / Gửi duyệt (cam).

### N4. Chi tiết lô `/nha-cung-cap/lo-hang/[id]`
Trạng thái + bước tiếp theo ở đầu (chờ duyệt: "thường trong 48 giờ"; bị từ chối: lý do + việc cần làm; đã duyệt: QR).
Nhật ký: form thêm ở đầu danh sách; mỗi dòng: icon + nhãn hoạt động (theo bảng thuật ngữ), ngày, mô tả, ảnh, người ghi.
Không hiện id kỹ thuật.

### N5. Sản phẩm `/nha-cung-cap/san-pham`, N6. Đăng sản phẩm
- Danh sách thẻ: ảnh, tên, trạng thái, đơn vị, số lô / đang bán; hành động "Khai báo lô" · "Xem lô".
- Form đăng: tên (ví dụ vùng Lâm Đồng), danh mục, đơn vị (gợi ý theo danh mục), giá tham khảo, mùa vụ, mô tả,
  **Sản phẩm đạt chứng nhận** (chọn từ chứng nhận đã có; thiếu → "Thêm chứng nhận" mở sheet tại chỗ).

### N7. Hồ sơ & chứng nhận `/nha-cung-cap/ho-so`
Thông tin hồ sơ (chỉ đọc ở prototype). Danh sách chứng nhận: loại, số, cơ quan cấp, hiệu lực (từ – đến), trạng thái
duyệt + trạng thái hiệu lực. Nút "Thêm chứng nhận" → sheet form.

### N8. Yêu cầu báo giá `/nha-cung-cap/bao-gia`
Bảng: ngày gửi, doanh nghiệp, sản phẩm, sản lượng, ngày cần hàng, ghi chú, trạng thái. Phản hồi báo giá thuộc MVP.

## Admin

### A1. Hàng đợi duyệt `/kiem-duyet`
Lọc mặc định "Chờ duyệt"; cột hạn xử lý đỏ khi quá hạn.

### A2. Chi tiết việc duyệt `/kiem-duyet/:id`
Đọc từ trên xuống: tóm tắt việc → nội dung theo loại (lô / sản phẩm / hồ sơ / chứng nhận) → chứng nhận → nhật ký →
◆ **checklist đối chiếu** (tự tính, chỉ để tham khảo: chứng nhận còn hiệu lực tới sau hạn sử dụng lô; có nhật ký
thu hoạch; ngày thu hoạch không ở tương lai; có ảnh).
**Thanh quyết định dính đáy** vùng nội dung (không ở header): bên trái tóm tắt checklist "3/4 mục đạt", bên phải
"Từ chối" (viền đỏ) · "Duyệt" (chính). Duyệt: xác nhận một bước (Popconfirm). Từ chối: modal lý do + chip lý do mẫu.
Việc đã có quyết định → thanh đổi thành dòng trạng thái, không còn nút.

### A3–A5. Vận hành đơn, Tồn kho, Cấu hình
Giữ như hiện tại; dùng nhãn trạng thái theo 06.
