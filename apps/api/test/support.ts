import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { randomUUID } from "node:crypto";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { configureApp } from "../src/app.setup";
import { Clock } from "../src/core/clock";

// Đồng hồ chỉnh tay: 21/10/2026 10:00 giờ Việt Nam (trước giờ chốt 16:00).
export class TestClock extends Clock {
  private current = new Date("2026-10-21T03:00:00Z");
  now(): Date {
    return new Date(this.current);
  }
  set(iso: string): void {
    this.current = new Date(iso);
  }
  advanceMinutes(minutes: number): void {
    this.current = new Date(this.current.getTime() + minutes * 60_000);
  }
}

export interface TestApp {
  app: INestApplication;
  clock: TestClock;
  http: () => ReturnType<INestApplication["getHttpServer"]>;
}

export async function createTestApp(): Promise<TestApp> {
  const clock = new TestClock();
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).overrideProvider(Clock).useValue(clock).compile();
  const app = moduleRef.createNestApplication({ bodyParser: false, logger: false });
  configureApp(app);
  await app.listen(0); // lắng nghe sẵn để các yêu cầu song song dùng chung một cổng
  return { app, clock, http: () => app.getHttpServer() };
}

export async function login(t: TestApp, email: string): Promise<string> {
  const otp = await request(t.http()).post("/api/auth/otp").send({ email }).expect(200);
  const res = await request(t.http()).post("/api/auth/login").send({ challengeId: otp.body.challengeId, code: otp.body.devCode }).expect(200);
  return res.body.accessToken as string;
}

export const ADDRESS = {
  recipientName: "Trần Minh Anh",
  phone: "0987654321",
  addressLine: "12 Phan Đình Phùng",
  ward: "Phường 1",
  province: "Lâm Đồng",
};

export async function addAddress(t: TestApp, token: string): Promise<string> {
  const res = await request(t.http()).post("/api/me/addresses").auth(token, { type: "bearer" }).send(ADDRESS).expect(201);
  return res.body.id as string;
}

export function setCart(t: TestApp, token: string, listingId: string, quantity: number) {
  return request(t.http()).put(`/api/cart/items/${listingId}`).auth(token, { type: "bearer" }).send({ quantity });
}

export function place(t: TestApp, token: string, body: Record<string, unknown>, key: string = randomUUID()) {
  return request(t.http()).post("/api/orders").auth(token, { type: "bearer" }).set("Idempotency-Key", key).send(body);
}

export async function firstSlot(t: TestApp, token: string, addressId: string): Promise<{ deliveryDate: string; deliverySlot: string }> {
  const quote = await request(t.http()).post("/api/checkout/quote").auth(token, { type: "bearer" }).send({ addressId }).expect(200);
  const slot = quote.body.deliverySlots.find((s: { available: boolean }) => s.available);
  return { deliveryDate: slot.date, deliverySlot: slot.slot };
}

export async function holdingOf(t: TestApp, token: string, batchId: string) {
  const res = await request(t.http()).get(`/api/admin/inventory/holdings?batchId=${batchId}`).auth(token, { type: "bearer" }).expect(200);
  return res.body[0] as { id: string; qtyOnHand: number; qtyReserved: number };
}
