import { API_URL } from "../playwright.config";

// Đưa dữ liệu API về bản seed trước mỗi lần chạy (cần DEMO_MODE bật).
export default async function globalSetup() {
  const res = await fetch(`${API_URL}/dev/reset`, { method: "POST" });
  if (res.status !== 204) throw new Error(`POST /api/dev/reset trả ${res.status} — kiểm tra DEMO_MODE của apps/api`);
}
