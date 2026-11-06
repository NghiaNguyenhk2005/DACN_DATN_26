# Farmery — DACN/DATN 2026

Sàn thương mại điện tử nông sản có truy xuất nguồn gốc, chạy hai luồng: **bán sỉ** (nông dân, hợp tác xã bán thẳng
cho doanh nghiệp) và **bán lẻ** (Farmery thu mua rồi bán lại cho người tiêu dùng). Vùng thí điểm: nguồn hàng ở Lâm
Đồng, giao lẻ trong TP.HCM. Repo chứa cả báo cáo đồ án lẫn mã nguồn.

## Bố cục

| Đường dẫn | Nội dung |
|---|---|
| `report/` | Báo cáo LaTeX (`main.tex`), hình, bộ sinh sơ đồ. Build trong thư mục này: `pdflatex` → `biber` → `pdflatex` ×2 |
| `apps/`, `packages/` | Mã nguồn monorepo (pnpm + Turborepo): `apps/shop`, `apps/admin`, `apps/api`, `apps/e2e`, `packages/contract`, `packages/mock-data` |
| `design/` | Tài liệu thiết kế giao diện (người dùng, kiến trúc thông tin, luồng, hệ thống thiết kế, đặc tả màn hình, rà soát hiện trạng) |
| `MVP.md` | Phạm vi hiện thực theo mã yêu cầu FR/NFR |
| `DECISIONS.md` | Quyết định đã chốt (chỉ nối thêm) |
| `NOTES.md` | Việc đang mở |
| `INDEX.md` | Chỉ mục chi tiết từng file |

## Phạm vi

Báo cáo thiết kế đủ cả hai luồng. Bản nộp cuối kỳ (31/12/2026) hiện thực theo ba mức:

- **Trục bán lẻ đầu–cuối, làm sâu:** tìm kiếm (có tìm theo ngữ nghĩa), sản phẩm tương tự, giỏ hàng, đặt hàng có giữ
  chỗ tồn, thanh toán, theo dõi đơn, giao ba chặng, đổi trả – hoàn tiền, đánh giá, thông báo, truy xuất QR.
- **Nguồn hàng, rút gọn:** xác thực nhà cung cấp, chứng nhận, sản phẩm và lô kèm QR, thu mua, nghiệm thu, tồn kho,
  đóng gói một bước, thu hồi lô.
- **Bán sỉ, tối giản:** yêu cầu báo giá → báo giá → hợp đồng có xác nhận giao kết → giao một đợt.

Ba nơi ghi phạm vi phải khớp nhau: báo cáo mục 1.3.4, nhãn trong danh sách yêu cầu ở Chương 4 (bảng
`tab:chi-thiet-ke`), và bảng chi tiết theo mã ở [`MVP.md`](MVP.md). Đổi phạm vi thì sửa cả ba và ghi vào
`DECISIONS.md`.

**Nhãn trạng thái** (dùng thống nhất trong báo cáo):

- **Hiện thực:** có trong bản nộp.
- ***(chỉ thiết kế)*:** đặc tả đầy đủ trong báo cáo nhưng cố ý không làm.
- ***(để sau prototype)*:** sẽ làm trước khi nộp nhưng chưa có ở bản prototype. Đến ngày nộp, mọi mục mang nhãn này
  phải thành "hiện thực" hoặc *(chỉ thiết kế)*.

### Yêu cầu chức năng

| Nhóm | Hiện thực | Chỉ thiết kế |
|---|---|---|
| FR1 Tài khoản | Đăng nhập email + OTP qua email; tài khoản theo vai trò; hồ sơ doanh nghiệp sỉ (giấy phép kinh doanh, mã số thuế); xác minh nhà cung cấp bằng duyệt ảnh giấy tờ thủ công; sổ địa chỉ; đồng ý điều khoản và quyền dữ liệu cá nhân | Đăng nhập Google, Facebook; OTP qua SMS, xác minh số điện thoại; eKYC đối chiếu khuôn mặt tự động |
| FR2 Nhà cung cấp | Hồ sơ công khai; theo dõi tồn theo lô; khai loại người bán cho thuế | Thống kê cho nhà cung cấp (FR2.2) |
| FR3 Chứng nhận | Tải lên VietGAP, GlobalGAP, hữu cơ, OCOP, HACCP; kiểm duyệt; tự đánh dấu hết hạn | Nhắc gia hạn: đi theo FR11.2, xem ghi chú dưới bảng |
| FR4 Sản phẩm, truy xuất | Đăng sản phẩm; nhật ký canh tác theo lô; mã QR theo lô; trang truy xuất công khai; giữ chỗ và trừ tồn đúng dòng; danh mục đa cấp; tìm kiếm và lọc (gõ không dấu, gõ sai); ràng buộc hợp lệ khi đăng | Báo cáo sai danh mục từ người mua (FR4.7) |
| FR5 Bán lẻ | Giỏ hàng; đặt hàng theo khung giờ, giữ chỗ 15 phút; dòng thời gian 8 trạng thái, hủy trước khi đóng gói; đánh giá sau đơn; mua lại; báo khi có hàng hoặc vào mùa | Mã giảm giá (FR5.3) |
| FR6 Bán sỉ | Yêu cầu báo giá (RFQ); phản hồi, đàm phán; hợp đồng kèm mã băm, xác nhận giao kết bằng OTP; giá bậc theo lượng tối thiểu (MOQ); giao một đợt | Giao nhiều đợt (FR6.5) |
| FR7 Thanh toán, hóa đơn | Cổng VNPay môi trường thử nghiệm; COD có điều kiện; hoàn tiền; hóa đơn giả lập; tính hoa hồng đơn sỉ | Ký quỹ trung gian (FR7.3); khấu trừ, nộp thuế thay (FR7.4); kết nối nhà cung cấp hóa đơn điện tử thật |
| FR8 Giao hàng, khiếu nại | Ba chặng: nhà cung cấp tự đưa hàng về kho, chuyến trung chuyển xe lạnh do nhân viên kho cập nhật, GHN thử nghiệm qua webhook; phí giao; đổi trả, khiếu nại | Xe gom chặng đầu |
| FR9 Tương tác | Trao đổi gắn với đơn hoặc khiếu nại | Danh sách yêu thích (FR9.2) |
| FR10 Vận hành | Duyệt hồ sơ, sản phẩm, chứng nhận; khóa tài khoản; giám sát vi phạm; xử lý khiếu nại; bảng giám sát tồn kho và giao hàng; cấu hình nền tảng; nhật ký thao tác nội bộ | Báo cáo thống kê tổng quan (FR10.4) |
| FR11 Thông báo | Trên web, thông báo đẩy (Web Push), email | SMS |
| FR12 AI | Tìm sản phẩm theo ngữ nghĩa; sản phẩm tương tự; dự báo giá chạy offline | Gợi ý cá nhân hóa theo hành vi; tìm nhà cung cấp theo ngữ nghĩa |
| FR13 Thu mua, kho | Đơn thu mua có nhà cung cấp xác nhận; nghiệm thu; dòng tồn và sổ nhập xuất; đóng gói một bước kèm tem QR; thu hồi lô | Sơ chế, phân loại nhiều bước; kiểm kê định kỳ |

**Ghi chú:** FR11.2 (cảnh báo chứng nhận sắp hết hạn, tồn thấp, kèm phần nhắc gia hạn của FR3.3) đang mang nhãn
*(để sau prototype)*. Đây là việc làm nếu kịp ở tuần 10; không kịp thì đổi sang *(chỉ thiết kế)* trước khi nộp.

### Tính năng AI

| Tính năng | Cách làm | Chỉ số đánh giá |
|---|---|---|
| Tìm theo ngữ nghĩa (FR12.3) | Tìm lai: từ khóa (`unaccent` + `pg_trgm`) và vector BGE-M3 (pgvector), hợp nhất bằng RRF | nDCG@10, Recall@10 so với chỉ tìm từ khóa; p95 dưới 1 giây |
| Sản phẩm tương tự (FR12.1) | Láng giềng gần nhất theo cosine trên vector sản phẩm, lọc còn hàng | Precision@5 trên tập gán nhãn tay |
| Dự báo giá (FR12.2) | SARIMA, Prophet, đối chứng gradient boosting; chạy offline hằng tuần; hiển thị cho nhân viên thu mua | MAPE trên tập kiểm tra tách theo thời gian |

Ngưỡng đạt ở Phụ lục L của báo cáo. Dịch vụ AI viết bằng Python (FastAPI), tách khỏi API nghiệp vụ.

### Yêu cầu phi chức năng

Mọi NFR đều hiện thực, trừ:
- NFR2.2 mở rộng theo chiều ngang *(chỉ thiết kế)*.
- NFR8.3 một phần: hóa đơn là bản giả lập.
- NFR8.4 khấu trừ, nộp thuế thay *(chỉ thiết kế)*.

Hai điểm cần biết:
- **NFR7.3:** ứng dụng mua hàng là PWA (cài được, thông báo đẩy, ghi nhật ký canh tác khi mất mạng).
- **NFR3.6:** nhân sự nội bộ đăng nhập hai lớp bằng TOTP.

### Giới hạn kỹ thuật

- Thanh toán (VNPay) và giao hàng (GHN) chạy trên môi trường thử nghiệm. Hóa đơn điện tử là bản giả lập.
- Xác minh chứng nhận, mã số vùng trồng làm thủ công.
- Không dùng blockchain, không có ứng dụng di động gốc, không xử lý giấy tờ xuất khẩu.
- Dữ liệu kiểm thử và đánh giá là dữ liệu mô phỏng.

### Hướng phát triển (ngoài đồ án)

- **Đã rút khỏi bộ yêu cầu**, giữ nguyên mã: FR4.8 đồng bộ TraceViet, FR6.6 ký số hợp đồng sỉ, FR11.3 cảnh báo khan hiếm
  cho khách sỉ, FR13.5 cho thuê kho, FR13.7 chào sỉ tồn dư.
- **Ở Chương 8 của báo cáo:** phát hiện bất thường bằng học máy, đội giao hàng riêng, phân quyền nội bộ trong tài khoản
  doanh nghiệp, mua trả sau cho khách sỉ, ứng dụng di động riêng, gói hiển thị nổi bật cho nhà cung cấp.

## Hiện trạng mã nguồn

Theo `develop` ngày 06/11/2026. Bản hiện tại là prototype: 13 mô-đun đúng kiến trúc của bản hoàn chỉnh, dữ liệu giữ
trong bộ nhớ, dịch vụ ngoài là bản giả. Danh sách phần giả lập và bản thay thế ở [`MVP.md`](MVP.md) mục 6.

| Mô-đun API | Đã có |
|---|---|
| `identity` | Tài khoản, địa chỉ, đăng nhập OTP (mã cố định khi `DEMO_MODE`, email khi có SMTP), JWT |
| `supplier` | Hồ sơ nhà cung cấp, chứng nhận kèm trạng thái duyệt |
| `catalog` | Sản phẩm, danh mục, lô, nhật ký canh tác, mã QR, trang truy xuất; tìm kiếm gộp bộ tìm từ khóa và từ điển khái niệm bằng RRF; sản phẩm tương tự theo cùng danh mục |
| `inventory` | Dòng tồn, giữ chỗ |
| `retail` | Giỏ hàng, đơn lẻ, máy trạng thái đơn, vận hành đơn phía admin |
| `wholesale` | Yêu cầu báo giá |
| `payment` | Thanh toán qua cổng giả |
| `operations` | Hàng đợi duyệt, cấu hình nền tảng |
| `procurement`, `fulfillment`, `engagement`, `notification`, `media` | Mới có khung mô-đun |

Còn phải làm để lên bản nộp:
- Chuyển lưu trữ sang Prisma + PostgreSQL.
- Cổng VNPay và GHN thử nghiệm.
- Dịch vụ AI.
- 5 mô-đun đang là khung.
- PWA, Web Push.

Lịch theo `report/backmatter/kehoach.tex`; phân công theo tuần ở sheet của nhóm.

## Cài và chạy mã nguồn

Cần Node 22 (`.nvmrc`). pnpm 9.15.9 được ghim trong `package.json`, cài qua corepack:

```bash
corepack enable   # Windows báo EPERM: mở terminal quyền Administrator, hoặc
                  # corepack enable pnpm --install-directory <thư mục đã có trong PATH>
pnpm i
pnpm dev          # chạy đồng thời 3 app
```

| App | Địa chỉ |
|---|---|
| Ứng dụng mua hàng (`apps/shop`) | http://localhost:3000 |
| Ứng dụng nội bộ (`apps/admin`) | http://localhost:5173 |
| API (`apps/api`) | http://localhost:4000/api — Swagger ở http://localhost:4000/docs; `GET /api/health`, `POST /api/dev/reset` |

Các lệnh khác (chạy từ gốc, giống CI): `pnpm lint:spec` (kiểm `openapi.yaml`), `pnpm generate` (sinh kiểu từ hợp đồng),
`pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`. Chạy riêng một gói: `pnpm --filter @farmery/api dev`.

Test e2e trên trình duyệt (Playwright, `apps/e2e`): lần đầu cài trình duyệt bằng
`pnpm --filter @farmery/e2e exec playwright install chromium`, sau đó `pnpm e2e`. Lệnh tự bật cả 3 app; nếu đang
`pnpm dev` thì dùng lại server đó, nên các app phải trỏ đúng API ở cổng 4000. Giao diện từng bước:
`pnpm --filter @farmery/e2e e2e:ui`.
Đổi cấu hình mặc định: sao `.env.example` của từng app (thành `.env` ở `apps/api`, `.env.local` ở shop và admin).

Viết endpoint cho API: xem [`apps/api/README.md`](apps/api/README.md) (khuôn theo mô-đun mẫu `catalog`, quy tắc, mã lỗi).
Prototype là nền của MVP, không phải bản làm thử: xem `MVP.md` mục 6.

## Quy trình git

- `main` chỉ nhận gộp từ `develop` ở các mốc; `develop` là nhánh tích hợp.
- Mỗi việc một nhánh `feat/<fe|be1|be2>-<việc>`, mỗi PR không quá một ngày công; mỗi sáng đồng bộ với `develop` bằng `git pull --rebase`, không merge `develop` ngược vào nhánh.
- PR vào `develop` cần CI xanh; người viết PR tự merge, không cần người khác duyệt (kể cả PR chạm `openapi.yaml`, nhưng vẫn báo cả nhóm).
- Gộp PR vào `develop` bằng squash (một PR một commit; nhánh nhiều người cùng làm thì dùng merge commit); `develop` vào `main` bằng merge commit. Xoá nhánh sau khi gộp, không dùng lại cho việc mới.
- Một commit một mục đích, thông điệp tiếng Việt, không tiền tố ngày. Tiêu đề PR viết theo cùng quy tắc vì thành thông điệp commit squash.
- Sau khi chốt hợp đồng (M1, 15/10), mọi thay đổi `packages/contract/openapi.yaml` đi qua PR riêng và báo cả nhóm.

Mốc prototype: M1 tối 15/10 chốt hợp đồng API · M2 tối 18/10 luồng khách lẻ chạy trên API thật · M3 tối 19/10 kịch
bản demo xuyên hai ứng dụng · đóng băng mã 18:00 ngày 20/10 · demo 21/10.
