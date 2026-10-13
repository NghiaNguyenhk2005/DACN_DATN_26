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
