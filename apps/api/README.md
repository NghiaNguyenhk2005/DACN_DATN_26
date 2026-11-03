# apps/api — ứng dụng lõi (NestJS)

NestJS 11, mọi đường dẫn nằm dưới `/api`. Prototype giữ dữ liệu trong bộ nhớ; giai đoạn 2 chỉ thay lớp lưu trữ
bằng Prisma, phần còn lại giữ nguyên (`MVP.md` mục 6).

```bash
pnpm --filter @farmery/api dev    # http://localhost:4000/api, Swagger ở http://localhost:4000/docs
pnpm --filter @farmery/api test   # test e2e trong test/
```

Đổi cấu hình: sao `.env.example` thành `.env` trong thư mục này (`PORT`, `CORS_ORIGINS`, `DEMO_MODE`,
`VALIDATE_RESPONSES`, `JWT_SECRET`).

## Cấu trúc

| Thư mục | Nội dung |
|---|---|
| `src/core/` | Nền chung: cấu hình, đọc `openapi.yaml`, bộ kiểm dữ liệu theo hợp đồng, `AuthGuard`, JWT (`TokenService`), lỗi RFC 9457, `Idempotency-Key`, `DemoResetRegistry` |
| `src/modules/` | 13 mô-đun nghiệp vụ theo báo cáo (bảng `tab:module-io`); `catalog` là mô-đun mẫu |
| `src/integrations/` | Interface dịch vụ bên ngoài (`OtpSender`, `PaymentGateway`) kèm bản giả cho prototype |
| `src/system/` | `GET /api/health`, `POST /api/dev/reset` |
| `src/app.setup.ts` | Cấu hình app dùng chung cho `main.ts` và test |
| `test/` | Test e2e (jest + supertest) |

## Viết một endpoint mới

Làm theo mô-đun mẫu `src/modules/catalog/` (`GET /api/categories`):

1. Tìm thao tác trong `packages/contract/openapi.yaml`: đường dẫn, `operationId`, `x-roles`, schema vào và ra.
2. Trong `src/modules/<mô-đun>/`:
   - `<thực-thể>.repository.ts`: abstract class khai các hàm đọc ghi cần dùng.
   - `in-memory-<thực-thể>.repository.ts`: bản trong bộ nhớ, nạp dữ liệu từ `@farmery/mock-data` (`createSeed()`),
     đăng ký vào `DemoResetRegistry` trong constructor để `/api/dev/reset` đưa về dữ liệu gốc.
   - `<mô-đun>.service.ts`: luật nghiệp vụ, chỉ gọi repository của chính mô-đun.
   - `<mô-đun>.controller.ts`: đường dẫn viết **không** có `/api`; kiểu trả về lấy từ hợp đồng, vd
     `Promise<Schema<"Batch">>`, để lệch schema là lỗi kiểm kiểu.
3. Khai controller, service và `{ provide: <Repository>, useClass: <InMemory...> }` trong `<mô-đun>.module.ts`;
   `exports` service nếu mô-đun khác cần gọi.
4. Viết test trong `test/` cho mỗi luật nghiệp vụ (FEFO, giữ chỗ 15 phút, nhật ký chỉ nối thêm, máy trạng thái đơn).
5. Chạy `pnpm lint && pnpm typecheck && pnpm test` ở gốc repo trước khi push.

## Quy tắc

- **Không tự kiểm dữ liệu vào, không viết guard vai trò.** Bộ kiểm chặn yêu cầu sai `openapi.yaml` trước khi tới
  controller; `AuthGuard` đọc `security` và `x-roles` của chính thao tác đó. Lấy người đang gọi bằng
  `@CurrentUser()` (trả `{ id, roles }`).
- **Lỗi nghiệp vụ**: `throw new ProblemException(status, "MA_LOI", "mô tả")`, mã lấy trong `Problem.code` của hợp đồng
  (vd `STOCK_CONFLICT`, `COD_NOT_ALLOWED`). Mã mới phải thêm vào hợp đồng.
- **Mô-đun không đọc dữ liệu của nhau**: cần dữ liệu mô-đun khác thì gọi service mà mô-đun đó `exports` (RB3).
- **Dịch vụ bên ngoài** gọi qua interface trong `src/integrations/`, không gọi thẳng thư viện hay HTTP.
- **Lối tắt chỉ phục vụ demo** (mã OTP cố định, trả `devCode`, bỏ qua bước thật) phải kiểm `config.demoMode`
  (`@Inject(APP_CONFIG)`).
- **Thông tin đăng nhập ở prototype**: OTP chỉ gửi qua email; token ký bằng `TokenService.sign({ id, roles })`.
- **Sửa hợp đồng**: sau M1 (15/10), mọi thay đổi `openapi.yaml` đi qua PR riêng và báo cả nhóm; sửa xong chạy
  `pnpm generate` để sinh lại kiểu.

## Mã lỗi khung tự trả

| HTTP | `code` | Khi nào |
|---|---|---|
| 400 | `VALIDATION_FAILED` | Dữ liệu vào sai hợp đồng; `errors` liệt kê từng trường |
| 401 | `UNAUTHENTICATED` | Thao tác cần đăng nhập mà thiếu hoặc sai token |
| 403 | `FORBIDDEN_ROLE` | Token không có vai trò nào trong `x-roles` |
| 404 | `NOT_IN_CONTRACT` | Đường dẫn hoặc phương thức không có trong hợp đồng |
| 501 | `NOT_IMPLEMENTED` | Có trong hợp đồng nhưng chưa có endpoint |
| 500 | `RESPONSE_CONTRACT_MISMATCH` | Endpoint trả dữ liệu lệch schema (chỉ khi `VALIDATE_RESPONSES` bật) — sửa code cho khớp, đừng tắt bộ kiểm |
| 404 | `DEMO_MODE_OFF` | Gọi `/api/dev/reset` khi tắt `DEMO_MODE` |

## Giao dịch và vận hành (BE2)

Mô-đun: `identity` (OTP, tài khoản, địa chỉ), `retail` (giỏ, báo giá, đơn, máy trạng thái, API vận hành đơn),
`inventory` (dòng tồn theo lô, FEFO, sổ nhập xuất), `payment` (cổng giả lập, COD), `operations` (thêm cấu hình nền tảng).
Mọi trạng thái đều nằm trong bộ nhớ và được `POST /dev/reset` đưa về ban đầu.

**Tài khoản đăng nhập** (OTP luôn là `123456`; email lạ trả 404): `khachle@example.com` (khách lẻ, có sẵn một địa chỉ ở
TP.HCM), `khachtuchoi@example.com` (từng từ chối COD), `seller@farmery.vn` hoặc `nongdan@example.com` (nhà cung cấp 101),
`vanhanh@farmery.vn`, `kho@farmery.vn`, `thumua@farmery.vn`, `hotro@farmery.vn`, `chu@farmery.vn` (mỗi vai trò một người),
`staff@example.com` / `kiemduyet@farmery.vn` (tài khoản tổng hợp cho dev: kiểm duyệt, vận hành, kho, chủ nền tảng).

**Quy tắc đã chốt**
- Tồn ban đầu dựng từ lô đã duyệt (tồn của tin bán chia theo số lượng khai báo). Sản phẩm chưa có lô đã duyệt thì
  chưa có hàng để bán; duyệt lô mới (`approveBatch`) sẽ mở thêm dòng tồn bằng số lượng khai báo.
- Giữ chỗ theo FEFO (hết hạn trước xuất trước), một tin bán có thể tách thành nhiều dòng đơn khi lấy từ nhiều lô.
  Đơn trả trước giữ chỗ `reservationMinutes` (mặc định 15). Quá hạn thì tự hủy, nhả tồn, **giữ nguyên `reserveExpiresAt`**
  và ghi sự kiện `cancelled` đúng mốc hạn. Quét mỗi 10 giây và quét lại mỗi lần đọc/ghi đơn.
- Thanh toán (hoặc COD hợp lệ) đổi giữ chỗ thành trừ tồn (`retail_out`). Hủy khi `placed` thì nhả (`release`), hủy khi `paid`
  thì hoàn tồn (`return_in`). Sau đóng gói không hủy được.
- Sổ nhập xuất: `reserve`/`release` tính theo lượng còn bán được, các loại còn lại theo tồn thực; mới nhất trước.
- Khung giờ giao: ba ngày liền từ hôm nay (giờ Việt Nam) × `deliverySlots`; hôm nay hết nhận từ `cutoffTime`.
- Chuyển bước đơn: `staff_operations` đi mọi bước, `staff_warehouse` chỉ `paid → packing → on_trip → handed_to_3pl`
  (bước khác 403 `FORBIDDEN_ROLE`). Máy trạng thái ở `retail/order-state-machine.ts`; `disputed`/`returned` đã khai nhưng
  chưa có thao tác nào đi tới.
- Thời gian lấy từ `Clock` (`core/clock.ts`); test thay bằng đồng hồ chỉnh tay (`test/support.ts`).

**Còn thiếu có chủ ý:** hoàn tiền thật khi hủy đơn đã trả (chỉ đánh dấu `refunded`), hạn dùng của lô không chặn bán,
khiếu nại/đổi trả (FR8.3), thông báo cho khách.

## Bảo mật, xử lý lỗi và kiểm thử blackbox

**Bảo mật đã có**
- Header: `helmet` (CSP `default-src 'none'`, nosniff, no-referrer, HSTS ở production), `Cache-Control: no-store`, không lộ `X-Powered-By`.
  Swagger UI (`/docs`) chỉ nới CSP riêng cho nó và tắt mặc định ở production.
- Giới hạn tần suất theo IP (`/api/auth/*` chặt hơn), thêm giới hạn theo từng email cho OTP: giãn cách gửi lại, trần mỗi giờ,
  khóa tạm khi nhập sai nhiều lần (tính cả nhiều challenge). Trả 429 kèm `Retry-After`.
- OTP: mã lưu dạng HMAC (không đọc được từ bộ nhớ), so sánh hằng thời gian, dùng một lần, hết hạn 10 phút, sai 5 lần thì hủy.
  Ngoài DEMO_MODE, email lạ trả y như thành công (không lộ tài khoản nào có thật); chỉ DEMO_MODE trả 404 và `devCode`.
- JWT: ghim HS256, issuer, audience; kiểm hình dạng claims; header `Authorization` đọc chặt, giới hạn độ dài.
- Khởi động từ chối cấu hình nguy hiểm: production thiếu hoặc `JWT_SECRET` dưới 32 ký tự, `CORS_ORIGINS=*`, tắt DEMO_MODE mà thiếu `SMTP_URL`, số sai định dạng.
- Đầu vào: body tối đa 100 KB, hợp đồng giới hạn độ dài/mẫu/khoảng giá trị và cấm trường thừa; tối đa 20 địa chỉ, 50 dòng giỏ mỗi người.
  Mọi dữ liệu theo chủ sở hữu (đơn, giỏ, địa chỉ) kiểm đúng người dùng, người khác nhận 404.
- Idempotency-Key: so nội dung (cùng key khác nội dung 422), xử lý đúng khi gửi song song, có hạn dùng và trần số lượng.
- Chống bán vượt: giữ chỗ chạy tuần tự dưới khóa; kiểm bằng test hai khách tranh nhau.

**Xử lý lỗi:** mọi lỗi là `application/problem+json` có `code` và `instance` (`urn:request:<X-Request-Id>`); 5xx không lộ chi tiết và được ghi log theo mã yêu cầu.
400 sai dữ liệu / JSON hỏng, 401 thiếu hoặc sai token (kèm `WWW-Authenticate`), 403 sai vai trò, 404 không có, 405 sai phương thức,
413 quá lớn, 415 sai kiểu nội dung, 422 vi phạm luật nghiệp vụ, 429 quá tần suất, 431 header quá lớn, 501 chưa có endpoint, 503 gửi OTP thất bại.

**Test**
- `pnpm test`: test e2e trong tiến trình (đồng hồ chỉnh tay).
- `pnpm test:blackbox`: build rồi khởi động `dist/main.js` thành 3 server thật (demo, kiểu production có SMTP giả, giới hạn tần suất thấp)
  và chỉ nói chuyện qua HTTP. Gồm: bảo mật (token giả, truy cập chéo, CORS, giới hạn tần suất, OTP qua email), fuzz sinh từ `openapi.yaml`
  (mọi thao tác × đầu vào xấu, không được có 5xx), hành trình đầu–cuối (nhà cung cấp → kiểm duyệt → mua → thanh toán → vận hành,
  tranh chấp tồn, giữ chỗ hết hạn theo giờ thật ~70 giây). `BLACKBOX_SKIP_SLOW=1` bỏ phần chờ.

**Placeholder còn lại:** cổng thanh toán giả lập (luôn thành công), trạng thái nằm trong bộ nhớ (mất khi khởi động lại, đúng quyết định prototype),
Idempotency/giới hạn tần suất theo tiến trình (nhiều bản server cần Redis), token chưa có đăng xuất/thu hồi, `POST /seller/products` và `POST /media` trả 501.
