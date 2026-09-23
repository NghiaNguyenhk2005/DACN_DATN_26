# README — Bàn giao merge 4 file trong `_incoming/`

File này dành cho người/agent tiếp theo thực hiện việc merge 4 file `.tex`
trong thư mục này vào báo cáo chính. Đọc file này trước khi động vào bất kỳ
file `.tex` nào ở đây.

## Trạng thái hiện tại (tính đến khi viết note này)

| File | Trạng thái | Việc còn lại |
|---|---|---|
| `nguon-du-lieu-nong-san.tex` | Đã rà soát nội dung, **chưa merge** | Xác nhận vị trí chèn + số liệu CheckVN, rồi merge |
| `nhat-ky-canh-tac.tex` | Chưa rà soát lại sau khi đổi RBAC | Rà soát + xác nhận vị trí, rồi merge |
| `nghien-cuu-blockchain.tex` | **Quyết định: KHÔNG merge theo cách đề xuất ban đầu** | Xem mục "Quyết định đã chốt" bên dưới |
| `dac-ta-usecase.tex` | Đã sửa đúng RBAC 2 vai trò, **chưa merge**, để sau | Xem mục "Vênh dữ liệu cần xử lý trước" bên dưới — quan trọng |

## Quyết định đã chốt với người dùng (không tự ý đổi lại)

1. **File `nghien-cuu-blockchain.tex` KHÔNG được dùng để thay thế đoạn trong
   `chuong2-kienthuc-nentang.tex`.** Người dùng yêu cầu rõ: *"Không đụng chạm
   tới bất kỳ file cũ/đã có nào không thuộc nhiệm vụ của chúng ta"*. Đoạn thứ
   3 hiện tại của `subsec:gs1blockchain` (bắt đầu "Tuy nhiên, blockchain vấp
   phải một giới hạn căn bản...") **giữ nguyên như cũ**. Không tự ý áp dụng
   đề xuất "THAY THẾ" còn ghi trong comment đầu file `nghien-cuu-blockchain.tex`
   — comment đó đã lỗi thời, chỉ còn giá trị tham khảo nội dung nghiên cứu
   (case study Walmart, TE-FOOD, nghiên cứu Thái Lan 2025...) nếu sau này
   người dùng đổi ý.
2. **File `dac-ta-usecase.tex` cố tình để sau**, chưa merge. Xem lý do ở mục
   dưới — có một vênh dữ liệu cần xử lý trước khi merge được.
3. **File `nguon-du-lieu-nong-san.tex`**: người dùng chỉ yêu cầu "kiểm tra
   lại nội dung", chưa xác nhận merge. Kết quả rà soát (xem báo cáo đầy đủ
   trong lịch sử chat) là: nội dung không có lỗi kỹ thuật LaTeX, các tham
   chiếu `subsec:reputation`, `subsec:gs1blockchain`, `subsec:vandenghiencuu`,
   `chap:danhgia` đều là label thật đã tồn tại và đúng chỗ; riêng
   `sec:thietkeAI` là forward-reference (label sẽ được tạo khi viết Ch.5,
   hiện chưa tồn tại) — điều này **không phải lỗi**, vì Ch.2 và Ch.4 hiện tại
   đã dùng chung kiểu forward-reference này nhiều chỗ khác.

## Vênh dữ liệu cần xử lý trước khi merge `dac-ta-usecase.tex`

**Phát hiện quan trọng:** `chuong4-hethong-dexuat.tex` hiện tại **tự mâu
thuẫn với chính nó** về số vai trò quản trị viên:

- Persona và mô tả actor thật (mục `sec:doituongnguoidung`) chỉ liệt kê
  **2 vai trò quản trị chuyên trách**: `admin_moderator` (kiểm duyệt và tuân
  thủ) và `admin_ops` (vận hành và hỗ trợ), cộng `admin` gộp quyền cho đội
  nhỏ — đúng như quyết định đã chốt trong `DECISIONS.md`, mục "Nhóm người
  dùng: 5 nhóm, gộp vai trò quản trị 5 thành 3" (ngày 2026-09-23).
- Nhưng **bảng ma trận FR** (`subsec:fr-matrix`, dòng FR1) vẫn ghi "phân
  quyền **5 nhóm người dùng**", và **NFR2.1** vẫn ghi "ví dụ thêm vai trò
  quản trị chuyên biệt ngoài **5 vai trò** đã thiết kế..." / "việc tách nhóm
  quản trị viên thành **5 vai trò con**..." — đây là tàn dư của phiên bản cũ
  (5 vai trò quản trị) chưa được dọn khi đổi sang 3 vai trò.

File `dac-ta-usecase.tex` mà tôi soạn đã **viết đúng theo thực tế 2 vai trò**
(khớp persona), nhưng nếu merge ngay bây giờ, use case sẽ **khớp với persona
mà lệch với 2 chỗ trong FR-matrix/NFR2.1 vẫn còn nói "5"**. Cần một trong hai
hướng xử lý sau trước khi merge:

- **Hướng A (khuyến nghị):** sửa 2 chỗ "5 nhóm/5 vai trò" trong
  `chuong4-hethong-dexuat.tex` (FR1 ở `subsec:fr-matrix`, và NFR2.1) thành
  "2 vai trò" hoặc diễn đạt lại cho khớp thực tế, rồi mới merge
  `dac-ta-usecase.tex`. Đây là việc sửa nhỏ, không đụng đến cấu trúc, nhưng
  **là sửa file cũ đã có** — cần hỏi người dùng trước khi làm, vì lần trước
  họ đã yêu cầu không đụng file cũ ngoài nhiệm vụ.
- **Hướng B:** giữ nguyên use case theo đúng 2 vai trò thật (đã làm), báo cho
  người dùng biết về vênh dữ liệu này khi merge, để họ tự quyết định sửa hay
  không, không tự ý đổi.

**Việc bắt buộc trước khi merge `dac-ta-usecase.tex`: hỏi lại người dùng theo
đúng 2 hướng trên** — đừng tự chọn.

## Diagram đã sẵn sàng, không cần merge riêng

5 file HTML trong `tools/design/usecase-*.html` đã hoàn thành, đã sửa lỗi
layout (đường kẻ orthogonal, không cắt qua chữ) và đã có ảnh PNG tương ứng
trong `image/comparison/` (người dùng tự chạy `npm run shot` và xác nhận đã
ổn). File `dac-ta-usecase.tex` đã có sẵn `\includegraphics` trỏ đúng 5 ảnh
này — khi merge file `.tex`, **không cần làm gì thêm với ảnh**, chỉ cần đảm
bảo `image/comparison/usecase-*.png` đã tồn tại (đã tồn tại).

## Vị trí merge đề xuất (đã ghi trong từng file, tóm tắt lại)

- `nguon-du-lieu-nong-san.tex` → `chuong2-kienthuc-nentang.tex`, thành
  `\subsection` mới ngay sau `subsec:gs1blockchain`, trước `subsec:reputation`.
- `nhat-ky-canh-tac.tex` → 3 vị trí khác nhau (xem comment đầu file): bổ
  sung cuối `subsec:chungnhan` (Ch.2), mục thảo luận riêng sau
  `subsec:gs1blockchain` (Ch.2), và nối vào "Mở rộng về nghiệp vụ" ở
  `chuong8-tongket.tex`.
- `dac-ta-usecase.tex` → thay thế dòng `% TODO` trong
  `chuong5-phantich-thietke.tex`, mục `sec:sddchitiet` — **nhưng chỉ sau khi
  xử lý xong vênh dữ liệu 2 vs 5 vai trò ở trên**.
- `nghien-cuu-blockchain.tex` → **để nguyên, không merge**, giữ làm tài liệu
  tham khảo nếu người dùng đổi ý sau này.

## Việc khác cần làm khi merge (đã ghi trong từng file, nhắc lại cho chắc)

- Thêm các entry `references.bib` được liệt kê ở comment cuối mỗi file
  (`gso_solieu`, `checkvn_traceviet`, `qd3156_2022`, `opendata_govvn` cho file
  nguồn dữ liệu; tương tự cho `nhat-ky-canh-tac.tex`) — kiểm tra không trùng
  khóa với `references.bib` hiện tại trước khi thêm.
- Sau khi merge xong mỗi file, **xóa file `.tex` tương ứng khỏi `_incoming/`**
  và ghi một mục mới vào `DECISIONS.md` theo đúng quy ước append-only của
  repo (xem các mục đã có làm mẫu).
- Build lại `main.pdf` sau mỗi lần merge để bắt lỗi tham chiếu/label sớm.
