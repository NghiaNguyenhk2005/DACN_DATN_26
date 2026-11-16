# design/ — Tài liệu thiết kế giao diện (UI + UX)

Bộ tài liệu mô tả **giao diện đích** của hai ứng dụng Farmery (`apps/shop`, `apps/admin`) theo cách một nhóm web
designer + frontend dev làm việc thật. Đây là doc sống: code lệch tài liệu thì hoặc sửa code, hoặc sửa tài liệu kèm
một dòng ở `DECISIONS.md` — không để hai bên nói khác nhau.

## Quy trình 7 bước và file tương ứng

| Bước | Ai làm chính | Câu hỏi trả lời | File |
|---|---|---|---|
| 1. Hiểu người dùng | UX designer | Ai dùng, để làm gì, lo điều gì, dùng thiết bị gì? | [01-nguoi-dung-va-hanh-trinh.md](01-nguoi-dung-va-hanh-trinh.md) |
| 2. Sắp xếp thông tin | UX designer | Có những trang nào, đi giữa chúng thế nào, gọi tên ra sao? | [02-kien-truc-thong-tin.md](02-kien-truc-thong-tin.md) |
| 3. Vẽ luồng tác vụ | UX designer | Từng việc đi qua những bước nào, rẽ nhánh và lỗi ở đâu? | [03-luong-tac-vu.md](03-luong-tac-vu.md) |
| 4. Hệ thống thiết kế | UI designer + FE | Màu, chữ, khoảng cách, component và trạng thái của chúng | [04-he-thong-thiet-ke.md](04-he-thong-thiet-ke.md) |
| 5. Đặc tả màn hình | UI designer | Mỗi màn có khối gì, thứ tự ưu tiên, bố cục, trạng thái, vị trí nút | [05-dac-ta-man-hinh.md](05-dac-ta-man-hinh.md) |
| 6. Nội dung, thuật ngữ | UX writer | Viết nút, thông báo, trạng thái thế nào; một khái niệm một tên | [06-noi-dung-va-thuat-ngu.md](06-noi-dung-va-thuat-ngu.md) |
| 7. Bàn giao cho dev | FE dev | Tổ chức component, dữ liệu, form, a11y, hiệu năng, kiểm thử | [07-quy-uoc-fe.md](07-quy-uoc-fe.md) |
| Rà soát | Cả nhóm | Code và báo cáo hiện tại lệch tài liệu ở đâu? | [08-ra-soat-hien-trang.md](08-ra-soat-hien-trang.md) |

## Nguồn

- Báo cáo `report/`: persona và hành trình (§4.2, Phụ lục Q), quy trình nghiệp vụ (§4.1.2), FR/NFR (§4.3), sitemap
  (§5.3), thiết kế AI (§5.2). Tài liệu này không chép lại báo cáo, chỉ rút phần giao diện cần dùng.
- Token gốc: gói handoff Claude Design (ngoài repo), đã chép vào `apps/shop/src/app/globals.css` (DECISIONS 16/10).
- Phạm vi theo `MVP.md`: mục nào thuộc "chỉ thiết kế" ghi rõ ở cuối mỗi đặc tả.

## Bản HTML

`thiet-ke-fe.html` gộp 9 file .md thành một trang có mục lục, mở thẳng bằng trình duyệt (đọc tốt trên điện thoại) để gửi
cho người ngoài nhóm. Đây là bản chụp: sửa .md thì chạy `python scripts/design-html.py` ở gốc repo (cần `pip install markdown`),
không sửa tay file HTML.

## Cập nhật

- Thêm/đổi màn: sửa 02 (sitemap) và 05 (đặc tả) trong cùng PR với code.
- Thêm/đổi chữ hiển thị cho một khái niệm đã có trong bảng thuật ngữ (06 §3): dùng đúng từ trong bảng; muốn đổi từ
  thì đổi bảng trước.
- Thêm token/component dùng chung: ghi vào 04 trước khi dùng ở màn thứ hai.
