# 07 — Quy ước FE (bàn giao cho dev)

## 1. Tổ chức mã

| Chỗ | Chứa | Quy tắc |
|---|---|---|
| `apps/shop/src/app/**/page.tsx` | Server Component lấy dữ liệu, ghép khối | Không chứa logic tính toán dùng lại được |
| `app/**/<tên>-form.tsx`, `*-client.tsx` | Client Component riêng của trang | Chỉ khi cần state/sự kiện |
| `components/farmery/` | Component dùng ≥2 nơi, theo 04 §5 | Không gọi API trực tiếp; nhận dữ liệu qua props |
| `components/ui/` | shadcn (base-nova) | Không sửa tay trừ khi bắt buộc; thêm bằng `pnpm dlx shadcn@4.21.0 add` |
| `lib/data/*.ts` | Đọc dữ liệu phía máy chủ | 404 → `null`; lỗi khác ném cho `error.tsx` |
| `lib/data/*-actions.ts` | Server Action ghi | Trả `{ ok, message }`, không ném lỗi ra form |
| `lib/labels.ts` | Nhãn enum theo 06 §3 | **Nguồn duy nhất** của nhãn trạng thái; trang không tự đặt nhãn |
| `lib/format.ts` | Định dạng số, ngày, giá quy đổi, độ tươi | Hàm thuần, có test |

Admin: `pages/<resource>/`, nhãn ở `src/lib/labels.ts` (cùng từ với shop).

## 2. Dữ liệu

- Kiểu lấy từ `Schema<K>` của `@farmery/contract`; không tự khai kiểu trùng.
- Thay đổi hợp đồng: sửa `packages/contract/openapi.yaml` → `pnpm generate` → API → FE, cùng một PR; báo cả nhóm.
- Trạng thái lọc, trang, tab nằm trên URL. Trạng thái tạm (ô đang mở, gợi ý) ở client.
- Lưu trên trình duyệt chỉ cho tiện ích cá nhân (tìm gần đây), bọc `try/catch`.

## 3. Form

- `useActionState` + Server Action; Idempotency-Key cho thao tác tạo.
- Nhãn luôn hiện (không chỉ placeholder); dấu `*` cho trường bắt buộc; gợi ý dưới ô bằng `text-caption`.
- Lỗi: ở đầu form (tổng) + dưới ô (từng trường), `aria-invalid`, `aria-describedby`.
- Nút gửi: disabled + "Đang gửi…" khi chờ; không reset dữ liệu khi lỗi.
- Giá trị mặc định thông minh (ngày thu hoạch = hôm nay, hạn sử dụng theo danh mục).

## 4. Tiếp cận (WCAG 2.2 AA)

- Tương phản chữ ≥4,5:1 (`faint` chỉ cho trang trí); vòng focus thấy rõ (`focus-visible:ring-2 ring-ring`).
- Mọi icon trang trí `aria-hidden`; nút chỉ có icon có `aria-label`.
- Trạng thái không chỉ bằng màu; thông báo động dùng `role="status"`/`aria-live`.
- Combobox tìm kiếm theo mẫu ARIA APG; tab theo `role="tablist"` (hoặc `nav` + `aria-current` cho tab điều hướng).
- Vùng chạm ≥44 px mobile, không dựa vào hover.

## 5. Hiệu năng

- Server Component mặc định; client chỉ ở lá. Ảnh qua `SafeImage` với `sizes` đúng.
- Gợi ý tìm kiếm: debounce 200 ms, hủy yêu cầu cũ (`AbortController`), ≤10 mục.
- Không thêm thư viện UI mới khi shadcn/antd đã có; thêm gói npm phải ghim bản và ghi `DECISIONS.md`.

## 6. Kiểm thử

- Hàm thuần (`format.ts`, phân tích câu tìm, giá quy đổi): unit test.
- Luồng chính: Playwright `apps/e2e` (shop, admin, kịch bản nhiều vai). Đổi chữ trên nút/nhãn → sửa locator e2e cùng PR.
- Trước khi báo xong: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm e2e`, mở trang trên 390 px và 1440 px.
