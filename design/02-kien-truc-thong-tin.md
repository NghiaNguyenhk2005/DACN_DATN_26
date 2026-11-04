# 02 — Kiến trúc thông tin

## 1. Sitemap

### Shop (`apps/shop`, Next.js)

```
/                              Trang chủ theo mùa: hero + tra nguồn gốc, lưới danh mục, chip lọc nhanh, đang vào mùa
├─ /danh-muc/[ten-id]          Danh mục (cha gồm cả con) + bộ lọc
├─ /tim-kiem?q=…               Kết quả tìm kiếm + bộ lọc (gợi ý khi gõ ở ô đầu trang)
├─ /san-pham/[ten-id]          Chi tiết: ảnh | thông tin + bằng chứng | khung mua (Mua lẻ / Mua sỉ)
├─ /truy-xuat/[traceCode]      Trang truy xuất công khai (layout gọn, mở từ QR)
├─ /dang-nhap?next=…           OTP qua email
├─ /gio-hang                   ┐
├─ /thanh-toan                 │ cần đăng nhập (chặn ở proxy.ts)
├─ /don-hang, /don-hang/[ma]   ┘
└─ /nha-cung-cap               Khu nhà cung cấp (vai trò seller)
   ├─ /                        Tổng quan: việc cần xử lý, số liệu nhanh, yêu cầu báo giá mới
   ├─ /lo-hang                 Danh sách lô, lọc theo trạng thái/sản phẩm
   │  ├─ /tao-moi              Khai báo lô (nút hành động, không phải tab)
   │  └─ /[id]                 Chi tiết lô: trạng thái, QR, nhật ký canh tác
   ├─ /san-pham                Sản phẩm của tôi
   │  └─ /tao-moi              Đăng sản phẩm (nút hành động, không phải tab)
   ├─ /ho-so                   Hồ sơ & chứng nhận (thêm chứng nhận)
   └─ /bao-gia                 Yêu cầu báo giá sỉ nhận được (vào từ Tổng quan, không có tab riêng)
```

### Admin (`apps/admin`, Refine + Ant Design)

```
/login
/                    Tổng quan (khối theo vai trò)
/kiem-duyet          Hàng đợi duyệt → /kiem-duyet/:id (lô, sản phẩm, hồ sơ, chứng nhận)
/van-hanh            Đơn hàng → /van-hanh/:id
/kho                 Tồn theo lô + sổ nhập xuất
/cau-hinh            Cấu hình nền tảng (chỉ platform_owner sửa)
```

## 2. Điều hướng

| Tầng | Shop | Khu nhà cung cấp | Admin |
|---|---|---|---|
| Toàn cục | Đầu trang: logo, tìm kiếm, tài khoản, giỏ; thanh danh mục | Như shop + nút "Khu nhà cung cấp" ở đầu trang | Sidebar theo `meta.roles` |
| Khu vực | Breadcrumb ở danh mục, chi tiết, tìm kiếm | **Hàng tab = nơi đến**: Tổng quan · Lô hàng · Sản phẩm · Hồ sơ & chứng nhận | Tiêu đề trang + breadcrumb Refine |
| Hành động chính | Nút cam (cta) duy nhất mỗi màn | "Khai báo lô" (cam), "Đăng sản phẩm" (viền) ở phải hàng tab; mobile: nút chính dính đáy | Nút quyết định ở **thanh dính đáy** của trang chi tiết |

Quy tắc: **tab không bao giờ là hành động**. Mục nào bấm vào để *làm* (tạo, gửi) là nút; mục nào bấm vào để *xem* là
tab/liên kết. Mỗi màn có tối đa một nút cam.

## 3. Mô hình nội dung

```
Danh mục ─┬─ Sản phẩm (của một nhà cung cấp; tên, mô tả, đơn vị, mùa vụ, ảnh)
          │     ├─ Lô (ngày thu hoạch, hạn sử dụng, sản lượng, mã truy xuất, trạng thái duyệt, thu hồi)
          │     │     └─ Nhật ký canh tác (hoạt động, ngày, mô tả, ảnh; đính chính không xoá)
          │     ├─ Tin bán lẻ (1P, Farmery đặt giá; đơn vị bán, giá, còn bán được)
          │     └─ Bảng giá sỉ (3P, nhà cung cấp đặt; bậc giá, lượng tối thiểu, thời gian chuẩn bị)
Nhà cung cấp ─ Chứng nhận (loại, số, cơ quan cấp, ngày cấp, ngày hết hiệu lực, trạng thái duyệt)
```

Hệ quả hiển thị:
- Chứng nhận gắn với **nhà cung cấp**, hiện ở sản phẩm và lô của nhà cung cấp đó; chỉ chứng nhận đã duyệt và còn
  hiệu lực mới hiện cho người mua.
- Thông tin độ tươi (thu hoạch, hạn sử dụng) thuộc **lô**; trang sản phẩm lấy lô đang bán có hạn sớm nhất.
- Giá lẻ thuộc **tin bán lẻ**, giá sỉ thuộc **bảng giá sỉ** — hai chế độ của khung mua đọc hai nguồn khác nhau.

## 4. Đặt tên route

- Tiếng Việt không dấu, gạch nối: `/nha-cung-cap/lo-hang/tao-moi`.
- Tài nguyên công khai dạng `ten-<id>` (chỉ đọc id cuối). Trang truy xuất theo `traceCode`.
- Trạng thái lọc trên URL (`?status=`, `?q=`, `?cert=`) để chia sẻ và quay lại được.
