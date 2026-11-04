# 04 — Hệ thống thiết kế

Nguồn sự thật của token là `apps/shop/src/app/globals.css` (Tailwind 4 `@theme`). Admin dùng Ant Design, ánh xạ token
qua `apps/admin/src/theme.ts`. Chỉ có bản sáng.

## 1. Màu

| Vai trò | Token (class) | Giá trị | Dùng cho | Không dùng cho |
|---|---|---|---|---|
| Thương hiệu | `primary` | #1f5132 | Liên kết, tab đang chọn, nút viền, nhãn chứng nhận | Nút hành động chính |
| Hành động chính | `cta` / `cta-hover` | #c2410c / #9a3412 | **Một** nút chính mỗi màn (Mua ngay, Khai báo lô, Gửi duyệt) | Trang trí, nhãn |
| Lá | `leaf`, `leaf-soft` | #4f9c56, #a8cf9c | Điểm nhấn "vào mùa", nền nhẹ khu nhà cung cấp | Chữ trên nền trắng (tương phản thấp) |
| Chữ | `ink`, `ink-2`, `muted-foreground`, `subtle`, `faint` | #1c211b → #a8b0a5 | Tiêu đề → phụ chú | `faint` cho chữ cần đọc |
| Nền, viền | `background`, `surface`, `surface-2`, `line`, `line-strong`, `chip` | | Thẻ dùng **viền**, không bóng | |
| Thành công | `success`, `success-soft` | #2f7a48 | Còn hiệu lực, lô hợp lệ, đã duyệt | |
| Cảnh báo | `warning`, `warning-dot`, `warning-soft`, `warning-line` | | Chờ duyệt, sắp hết hiệu lực, sắp hết hạn sử dụng, bản đính chính | |
| Nguy hiểm | `danger`, `danger-soft`, `danger-line`, `danger-ink` | #b42318 | Bị từ chối, hết hiệu lực, thu hồi, hết hàng, lỗi | |

Quy tắc:
- **Không dùng bảng màu mặc định của Tailwind** (`emerald-50`, `blue-700`…). Cần phân biệt nhiều loại (vd 5 loại hoạt
  động nhật ký) thì phân biệt bằng **icon + nhãn**, màu chỉ dùng token trung tính hoặc ngữ nghĩa.
- Màu trạng thái luôn đi cùng chữ hoặc icon (không chỉ dựa vào màu — WCAG 1.4.1).
- Admin: `colorPrimary = #1f5132`, `colorError = #b42318`, `colorWarning = #d97706`, `colorSuccess = #2f7a48`,
  `borderRadius = 8`, font Be Vietnam Pro. Tag trạng thái dùng cùng ngữ nghĩa màu với shop (xem 06 §3).

## 2. Chữ

Be Vietnam Pro cho giao diện; Lora (serif) **chỉ** cho tiêu đề trang công khai (H1 chi tiết, hero, tìm kiếm, truy xuất).
Khu nhà cung cấp và admin không dùng serif.

| Token | Desktop / mobile | Dùng |
|---|---|---|
| `text-display` / `-sm` | 36 / 24 | Hero |
| `text-h1` / `-sm` | 27 / 24 | Tiêu đề trang |
| `text-h2` / `-sm` | 20 / 18 | Tiêu đề khối |
| `text-h3` | 15 | Tiêu đề thẻ |
| `text-title` | 14 | Nút, nhãn trường, tab |
| `text-body` | 13,5 | Đoạn văn |
| `text-small`, `text-caption`, `text-micro` | 13 / 12,5 / 11,5 | Phụ chú, nhãn trạng thái |
| `text-price`, `text-price-xl` | 16 / 30 | Giá |

Khu nhà cung cấp: chữ thân tối thiểu `text-small` (13 px), nhãn trường `text-title`, không dùng `text-micro` cho
thông tin cần đọc (persona 52 tuổi, điện thoại tầm trung).

## 3. Bo góc, khoảng cách, bóng

- Bo góc theo **vai trò**, không theo cỡ: `rounded-tag` 5 (nhãn), `rounded-btn` 8 (nút, ô nhập), `rounded-search` 9,
  `rounded-tile` 10 (ô thông tin), `rounded-card` 12 (thẻ), `rounded-panel` 14 (khối lớn), `rounded-banner` 16 (hero);
  `rounded-full` cho huy hiệu trạng thái dạng viên thuốc. Không dùng `rounded-lg/xl/2xl` trực tiếp.
- Khoảng cách theo bội 4 px; lề trang 16 px mobile, 48 px desktop; khung rộng tối đa 1440 px.
- **Bóng**: chỉ `shadow-segment` cho nút gạt đang chọn và bóng nổi của popover/sheet (do thư viện). Thẻ, khối, nút
  không đổ bóng — phân tầng bằng viền và nền `surface`.

## 4. Breakpoint, vùng chạm

- `md` 768, `lg` 1024. Thiết kế 390 px trước.
- Vùng chạm ≥44×44 px trên mobile (`min-h-11`); nút chính khu nhà cung cấp cao 44–48 px.
- Thanh hành động dính đáy mobile chừa `env(safe-area-inset-bottom)`; trang chừa `pb-28`.

## 5. Component

Thư mục `apps/shop/src/components/farmery/` (component sản phẩm) và `components/ui/` (shadcn base-nova).

| Component | Biến thể | Trạng thái bắt buộc |
|---|---|---|
| Button | `cta` (chính), `outline` viền primary (phụ), `ghost` (thứ ba), `danger` | default · hover · focus-visible (vòng `ring`) · disabled · loading ("Đang …" + spinner) |
| StatusBadge | success · warning · danger · neutral; icon + chữ | — |
| Tabs điều hướng | gạch chân 2 px `primary` (như `ProductTabs`) | đang chọn · hover · có badge số |
| QuantityInput (ô số lượng) | gõ tự do + nút −/+; đơn vị "kg" nhập lẻ tới 0,1 kg, bước 0,5; hộp, túi, gói, bó, khay chỉ số nguyên; "1,5" và "1.5" đều đọc là 1,5 | gõ dở · đã chuẩn hóa (làm tròn, kẹp trong tồn, kèm câu giải thích) · disabled |
| Segmented (nút gạt) | 2–3 lựa chọn, nền `surface`, ô chọn trắng + `shadow-segment` | đang chọn · disabled |
| ProductCard | có/không tin bán, hết hàng, có giá quy đổi | ảnh lỗi → ô thay thế |
| FactGrid (`LotInfo`) | 2 / 4 cột | giá trị cảnh báo/nguy hiểm |
| CategoryTile | ảnh + tên + số sản phẩm | lưới desktop / slider mobile |
| SearchSuggest | nhóm: sản phẩm · danh mục · vùng · tìm gần đây | đang tải · rỗng · mục đang chọn (bàn phím) |
| Field (nhãn + ô + gợi ý + lỗi) | text, number có đơn vị, date, select, textarea | lỗi (viền `danger` + câu lỗi dưới ô, `aria-describedby`) |
| Sheet | phải (desktop) / đáy (mobile) | — |
| EmptyState, ErrorState, Skeleton | | |
| StickyActionBar | dính đáy vùng nội dung | — |

Quy tắc mới thêm component: dùng ở ≥2 màn thì đưa vào `components/farmery/` và ghi vào bảng này.
