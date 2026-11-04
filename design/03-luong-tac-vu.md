# 03 — Luồng tác vụ

Ký hiệu: `[màn]` · `(hành động)` · `◇` rẽ nhánh · `⚠` điểm lỗi cần thông báo.

## F1. Tìm và mua lẻ

```
[Trang chủ] ──(gõ ô tìm kiếm)──► gợi ý tức thì: sản phẩm · danh mục · vùng trồng · "tìm tất cả 'x'"
     │                              ◇ chọn sản phẩm ─► [Chi tiết]
     │                              ◇ Enter ─► [Tìm kiếm] với chip lọc hiểu từ câu (vd "hữu cơ", "dưới 200k")
     ├─(chọn ô danh mục)─► [Danh mục]
     └─(chip lọc nhanh)─► [Tìm kiếm]
[Tìm kiếm] ◇ 0 kết quả ─► "Có phải bạn muốn tìm …", bỏ bớt lọc, gợi ý danh mục
[Chi tiết] (chế độ Mua lẻ) ─(Thêm vào giỏ)─► ở lại trang, báo "Đã thêm"
                           ─(Mua ngay)─► ◇ chưa đăng nhập ─► [Đăng nhập ?next] ─► quay lại
                                         ─► [Thanh toán] ─► [Đơn hàng: chờ trả tiền, đếm ngược 15 phút]
⚠ hết hàng giữa chừng (`STOCK_INSUFFICIENT`), ⚠ quá giờ chốt khung giao, ⚠ quá 15 phút giữ chỗ → đơn tự hủy
```

## F2. Hỏi giá sỉ

```
[Chi tiết] ─(công tắc "Mua sỉ")─► khung mua đổi sang: bậc giá · lượng tối thiểu · thời gian chuẩn bị
   ◇ sản phẩm chưa có bảng giá sỉ ─► "Nhà cung cấp chưa nhận bán sỉ sản phẩm này" (công tắc vẫn hiện, khung giải thích)
   ─(nhập sản lượng)─► hiện bậc áp dụng + ước tính tổng
   ◇ dưới lượng tối thiểu ─► cảnh báo, gợi ý chuyển sang Mua lẻ
   ─(Gửi yêu cầu báo giá)─► ◇ chưa đăng nhập ─► [Đăng nhập]
                           ◇ không phải tài khoản doanh nghiệp mua sỉ ─► giải thích + liên hệ đăng ký
                           ─► form: sản lượng, ngày cần hàng, ghi chú ─► "Đã gửi tới <nhà cung cấp>"
[Khu nhà cung cấp › Tổng quan] hiện "N yêu cầu báo giá mới" ─► [Yêu cầu báo giá]
Phần sau (phản hồi, thương lượng, hợp đồng — FR6.2–6.4) thuộc MVP, chưa làm ở prototype.
```

## F3. Nhà cung cấp: chứng nhận → sản phẩm → lô → nhật ký → QR

```
[Hồ sơ & chứng nhận] ─(Thêm chứng nhận)─► sheet: loại · số · cơ quan cấp · ngày cấp · ngày hết hiệu lực · ảnh
                     ─► chứng nhận "Chờ duyệt" (chưa hiện cho người mua)
[Đăng sản phẩm] ─(chọn "Sản phẩm đạt chứng nhận": VietGAP…)─►
     ◇ chưa có chứng nhận loại đó ─► nút "Thêm chứng nhận VietGAP" mở cùng sheet tại chỗ, không rời form
     ─(Gửi duyệt)─► sản phẩm "Chờ duyệt"
[Khai báo lô] chọn sản phẩm đã duyệt ─► gợi ý hạn sử dụng theo danh mục
     ─► khối "Chứng nhận đi kèm lô" (chỉ đọc) ◇ có chứng nhận hết hiệu lực trước hạn sử dụng ─► cảnh báo vàng
     ─(Gửi duyệt)─► [Chi tiết lô ?thanh-cong] "Chờ duyệt — thường trong 48 giờ"
[Chi tiết lô] (Thêm nhật ký) · (Đính chính dòng cũ) ─► khi duyệt xong: thẻ QR (tải/in)
     ◇ bị từ chối ─► khối đỏ: lý do + việc cần làm
```

## F4. Kiểm duyệt

```
[Hàng đợi] lọc mặc định "Chờ duyệt", sắp theo hạn ─► [Chi tiết việc duyệt]
   đọc từ trên xuống: thông tin chính → chứng nhận → nhật ký → checklist đối chiếu
   ─► thanh quyết định dính đáy: (Duyệt) xác nhận một bước · (Từ chối) modal lý do, có lý do mẫu
   ⚠ việc đã có quyết định (`REVIEW_TASK_DECIDED`) ─► báo và tải lại
```

## F5. Sửa thông tin

Nguyên tắc chọn cách sửa (áp dụng cho mọi màn):

| Loại thay đổi | Cách sửa | Ví dụ |
|---|---|---|
| Một trường ngắn, độc lập, không cần duyệt lại | **Sửa tại chỗ** (bấm → ô nhập → Lưu/Esc), lưu lạc quan | Số lượng trong giỏ, đặt địa chỉ mặc định |
| Bản ghi nhiều trường, cần ngữ cảnh danh sách | **Sheet/drawer** cạnh danh sách, không rời trang | Thêm chứng nhận, thêm nhật ký |
| Thay đổi thứ người mua đã thấy và đã được duyệt | **Tạo bản chờ duyệt**, bản cũ vẫn hiện tới khi duyệt | Giá tham khảo, mô tả, chứng nhận của sản phẩm đã duyệt |
| Bản ghi không được sửa theo nghiệp vụ | **Đính chính** (bản mới, giữ bản cũ) | Nhật ký canh tác (NFR9) |

Hợp đồng hiện chưa có thao tác sửa sản phẩm/lô (`PATCH`); hàng thứ ba thuộc MVP.
