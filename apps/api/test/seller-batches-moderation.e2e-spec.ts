import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { configureApp } from "../src/app.setup";
import { TokenService } from "../src/core/token.service";

async function createApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication({ bodyParser: false, logger: false });
  configureApp(app);
  await app.init();
  return app;
}

describe("E2E - Nhiệm vụ 17/10 (Nhà cung cấp tạo lô, Nhật ký canh tác nối thêm/đính chính, Hàng đợi duyệt, Duyệt/Từ chối sinh QR)", () => {
  let app: INestApplication;
  let sellerToken: string;
  let staffToken: string;
  let buyerToken: string;

  beforeAll(async () => {
    app = await createApp();
    const tokenService = app.get(TokenService);
    sellerToken = await tokenService.sign({ id: "201", roles: ["seller"] });
    staffToken = await tokenService.sign({ id: "301", roles: ["staff_moderation"] });
    buyerToken = await tokenService.sign({ id: "401", roles: ["buyer_retail"] });
  });

  afterAll(() => app.close());

  beforeEach(async () => {
    // Đưa mock data về trạng thái gốc trước mỗi test
    await request(app.getHttpServer()).post("/api/dev/reset").expect(204);
  });

  describe("1. Phân quyền và bảo vệ Endpoint", () => {
    it("chặn truy cập nếu không có token (401)", async () => {
      await request(app.getHttpServer()).get("/api/seller/batches").expect(401);
      await request(app.getHttpServer()).get("/api/admin/review-tasks").expect(401);
    });

    it("chặn truy cập nếu sai vai trò (403)", async () => {
      // Buyer không thể gọi API của Seller
      await request(app.getHttpServer())
        .get("/api/seller/batches")
        .auth(buyerToken, { type: "bearer" })
        .expect(403);

      // Seller không thể gọi API của Kiểm duyệt viên
      await request(app.getHttpServer())
        .get("/api/admin/review-tasks")
        .auth(sellerToken, { type: "bearer" })
        .expect(403);
    });

    it("lấy danh sách sản phẩm của nhà cung cấp (GET /api/seller/products)", async () => {
      const res = await request(app.getHttpServer())
        .get("/api/seller/products")
        .auth(sellerToken, { type: "bearer" })
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0].id).toBeDefined();
      expect(res.body[0].name).toBeDefined();
    });
  });

  describe("2. Nhà cung cấp tạo lô hàng (POST /api/seller/batches)", () => {
    it("tạo lô mới thành công ở trạng thái pending_review và tự động sinh ReviewTask", async () => {
      const newBatchInput = {
        productId: "1",
        harvestDate: "2026-10-25",
        bestBefore: "2026-11-05",
        declaredQuantity: 250,
      };

      const res = await request(app.getHttpServer())
        .post("/api/seller/batches")
        .auth(sellerToken, { type: "bearer" })
        .send(newBatchInput)
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.productId).toBe("1");
      expect(res.body.status).toBe("pending_review");
      expect(res.body.traceCode).toBeNull();
      expect(res.body.traceUrl).toBeNull();
      expect(res.body.batchCode).toContain("-26");

      // Kiểm tra trong hàng đợi duyệt của Moderation có task mới tương ứng
      const tasksRes = await request(app.getHttpServer())
        .get("/api/admin/review-tasks")
        .auth(staffToken, { type: "bearer" })
        .query({ type: "batch", status: "open" })
        .expect(200);

      const createdTask = tasksRes.body.items.find(
        (t: { targetId: string }) => t.targetId === res.body.id,
      );
      expect(createdTask).toBeDefined();
      expect(createdTask.taskType).toBe("batch");
      expect(createdTask.status).toBe("open");
    });

    it("từ chối tạo lô khi bestBefore <= harvestDate (422)", async () => {
      const invalidInput = {
        productId: "1",
        harvestDate: "2026-10-25",
        bestBefore: "2026-10-20", // Hạn sử dụng trước ngày thu hoạch
        declaredQuantity: 100,
      };

      const res = await request(app.getHttpServer())
        .post("/api/seller/batches")
        .auth(sellerToken, { type: "bearer" })
        .send(invalidInput)
        .expect(422);

      expect(res.body.code).toBe("VALIDATION_FAILED");
    });

    it("từ chối tạo lô khi productId không tồn tại (422)", async () => {
      const nonExistent = {
        productId: "99999",
        harvestDate: "2026-10-25",
        bestBefore: "2026-11-05",
        declaredQuantity: 100,
      };

      await request(app.getHttpServer())
        .post("/api/seller/batches")
        .auth(sellerToken, { type: "bearer" })
        .send(nonExistent)
        .expect(422);
    });
  });

  describe("3. Xem danh sách và chi tiết lô", () => {
    it("lấy danh sách lô và lọc theo status", async () => {
      const res = await request(app.getHttpServer())
        .get("/api/seller/batches")
        .auth(sellerToken, { type: "bearer" })
        .query({ status: "pending_review" })
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body.every((b: { status: string }) => b.status === "pending_review")).toBe(true);
    });

    it("lấy chi tiết một lô theo ID", async () => {
      const res = await request(app.getHttpServer())
        .get("/api/seller/batches/1016")
        .auth(sellerToken, { type: "bearer" })
        .expect(200);

      expect(res.body.id).toBe("1016");
      expect(res.body.batchCode).toBe("DTDL-2610-16");
    });

    it("trả về 404 khi lô không tồn tại", async () => {
      await request(app.getHttpServer())
        .get("/api/seller/batches/99999")
        .auth(sellerToken, { type: "bearer" })
        .expect(404);
    });
  });

  describe("4. Nhật ký canh tác (Chỉ nối thêm & Đính chính NFR9.1)", () => {
    it("ghi một nhật ký mới và kiểm tra enteredBy", async () => {
      const logInput = {
        activityDate: "2026-10-10",
        activity: "treatment",
        description: "Bón bổ sung kali hữu cơ và tỉa chồi nách lần 2",
      };

      const res = await request(app.getHttpServer())
        .post("/api/seller/batches/1016/logs")
        .auth(sellerToken, { type: "bearer" })
        .send(logInput)
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.batchId).toBe("1016");
      expect(res.body.activity).toBe("treatment");
      expect(res.body.superseded).toBe(false);
      expect(res.body.supersedesId).toBeNull();
      expect(res.body.enteredBy?.userId).toBe("201");
      expect(res.body.enteredBy?.onBehalf).toBe(false);
    });

    it("ghi bản đính chính trỏ về bản cũ -> bản cũ chuyển superseded: true", async () => {
      // 1. Tạo bản ghi ban đầu
      const initialLog = (
        await request(app.getHttpServer())
          .post("/api/seller/batches/1016/logs")
          .auth(sellerToken, { type: "bearer" })
          .send({
            activityDate: "2026-10-05",
            activity: "care",
            description: "Tưới nước đợt 1",
          })
          .expect(201)
      ).body;

      expect(initialLog.superseded).toBe(false);

      // 2. Gửi bản đính chính trỏ về bản ban đầu
      const correctionLog = (
        await request(app.getHttpServer())
          .post("/api/seller/batches/1016/logs")
          .auth(sellerToken, { type: "bearer" })
          .send({
            activityDate: "2026-10-05",
            activity: "care",
            description: "Đính chính: Tưới nước phối hợp chế phẩm sinh học nấm rễ mycorrhiza",
            supersedesId: initialLog.id,
          })
          .expect(201)
      ).body;

      expect(correctionLog.supersedesId).toBe(initialLog.id);
      expect(correctionLog.superseded).toBe(false);

      // 3. Lấy lại danh sách nhật ký của lô: bản cũ phải chuyển sang superseded: true
      const logsRes = await request(app.getHttpServer())
        .get("/api/seller/batches/1016/logs")
        .auth(sellerToken, { type: "bearer" })
        .expect(200);

      const oldLogUpdated = logsRes.body.find((l: { id: string }) => l.id === initialLog.id);
      const newLogSaved = logsRes.body.find((l: { id: string }) => l.id === correctionLog.id);

      expect(oldLogUpdated.superseded).toBe(true);
      expect(newLogSaved.superseded).toBe(false);
      expect(newLogSaved.supersedesId).toBe(initialLog.id);
    });

    it("từ chối khi ngày hoạt động ở tương lai (422)", async () => {
      await request(app.getHttpServer())
        .post("/api/seller/batches/1016/logs")
        .auth(sellerToken, { type: "bearer" })
        .send({
          activityDate: "2029-01-01",
          activity: "harvest",
        })
        .expect(422);
    });
  });

  describe("5. Quy trình duyệt lô hàng và sinh mã QR truy xuất", () => {
    it("lấy chi tiết việc duyệt kèm đầy đủ batch, supplier, logs, certifications", async () => {
      const res = await request(app.getHttpServer())
        .get("/api/admin/review-tasks/7001")
        .auth(staffToken, { type: "bearer" })
        .expect(200);

      expect(res.body.id).toBe("7001");
      expect(res.body.batch).toBeDefined();
      expect(res.body.batch.batch.id).toBe("1016");
      expect(res.body.batch.supplier.displayName).toBe("HTX Dâu tây Đà Lạt");
      expect(Array.isArray(res.body.batch.certifications)).toBe(true);
      expect(Array.isArray(res.body.batch.logs)).toBe(true);
    });

    it("duyệt lô (approve) -> lô chuyển approved, sinh traceCode & traceUrl; mở trang truy xuất công khai", async () => {
      // 1. Trước khi duyệt, trang truy xuất công khai không tìm thấy
      await request(app.getHttpServer())
        .get("/api/public/trace/TRC-DTDL-2610-16")
        .expect(404);

      // 2. Staff duyệt task
      const approvedRes = await request(app.getHttpServer())
        .post("/api/admin/review-tasks/7001/approve")
        .auth(staffToken, { type: "bearer" })
        .expect(200);

      expect(approvedRes.body.status).toBe("approved");
      expect(approvedRes.body.decidedAt).toBeDefined();
      expect(approvedRes.body.batch.batch.status).toBe("approved");
      expect(approvedRes.body.batch.batch.traceCode).toBe("TRC-DTDL-2610-16");
      expect(approvedRes.body.batch.batch.traceUrl).toContain("/truy-xuat/TRC-DTDL-2610-16");

      // 3. Sau khi duyệt, trang truy xuất công khai hoạt động thành công
      const traceRes = await request(app.getHttpServer())
        .get("/api/public/trace/TRC-DTDL-2610-16")
        .expect(200);

      expect(traceRes.body.traceCode).toBe("TRC-DTDL-2610-16");
      expect(traceRes.body.product.name).toContain("Dâu tây");
      expect(traceRes.body.batch.batchCode).toBe("DTDL-2610-16");

      // 4. Thử duyệt lại cùng task đã duyệt -> trả 409 Conflict
      await request(app.getHttpServer())
        .post("/api/admin/review-tasks/7001/approve")
        .auth(staffToken, { type: "bearer" })
        .expect(409);
    });

    it("từ chối lô (reject) kèm lý do -> lô chuyển rejected, không thể truy xuất công khai", async () => {
      // 1. Tạo một lô mới
      const newBatch = (
        await request(app.getHttpServer())
          .post("/api/seller/batches")
          .auth(sellerToken, { type: "bearer" })
          .send({
            productId: "2",
            harvestDate: "2026-10-25",
            bestBefore: "2026-11-05",
            declaredQuantity: 180,
          })
          .expect(201)
      ).body;

      // Tìm task tương ứng trong hàng đợi
      const tasksRes = await request(app.getHttpServer())
        .get("/api/admin/review-tasks")
        .auth(staffToken, { type: "bearer" })
        .expect(200);

      const task = tasksRes.body.items.find(
        (t: { targetId: string }) => t.targetId === newBatch.id,
      );
      expect(task).toBeDefined();

      // 2. Staff từ chối kèm lý do
      const rejectReason = "Hồ sơ canh tác thiếu chứng từ kiểm nghiệm dư lượng thuốc BVTV";
      const rejectedRes = await request(app.getHttpServer())
        .post(`/api/admin/review-tasks/${task.id}/reject`)
        .auth(staffToken, { type: "bearer" })
        .send({ reason: rejectReason })
        .expect(200);

      expect(rejectedRes.body.status).toBe("rejected");
      expect(rejectedRes.body.decisionReason).toBe(rejectReason);
      expect(rejectedRes.body.batch.batch.status).toBe("rejected");
      expect(rejectedRes.body.batch.batch.rejectReason).toBe(rejectReason);
      expect(rejectedRes.body.batch.batch.traceCode).toBeNull();
      expect(rejectedRes.body.batch.batch.traceUrl).toBeNull();

      // 3. Thử từ chối lại task đã xử lý -> trả 409 Conflict
      await request(app.getHttpServer())
        .post(`/api/admin/review-tasks/${task.id}/reject`)
        .auth(staffToken, { type: "bearer" })
        .send({ reason: "Lý do khác" })
        .expect(409);
    });
  });
});
