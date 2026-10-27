import { defineConfig, devices } from "@playwright/test";

const CI = !!process.env.CI;

export const API_URL = "http://localhost:4000/api";
export const SHOP_URL = "http://localhost:3000";
export const ADMIN_URL = "http://localhost:5173";

// Tự bật api + shop + admin (dùng lại server đang chạy nếu đã `pnpm dev` ở máy); API giữ dữ liệu trong bộ nhớ nên chạy tuần tự.
export default defineConfig({
  testDir: "tests",
  globalSetup: "./tests/global-setup.ts",
  fullyParallel: false,
  workers: 1,
  // Server dev biên dịch trang lần đầu khi được gọi nên lần chạy nguội có thể quá 5 giây mặc định.
  expect: { timeout: 10_000 },
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  reporter: CI ? [["list"], ["html", { open: "never" }]] : [["list"], ["html", { open: "on-failure" }]],
  use: {
    locale: "vi-VN",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "shop",
      testDir: "tests/shop",
      use: { ...devices["Desktop Chrome"], baseURL: SHOP_URL },
    },
    {
      name: "admin",
      testDir: "tests/admin",
      use: { ...devices["Desktop Chrome"], baseURL: ADMIN_URL },
    },
    {
      // Kịch bản xuyên shop + admin: không có baseURL, spec dùng SHOP_URL/ADMIN_URL.
      name: "kich-ban",
      testDir: "tests/kich-ban",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      command: "pnpm --filter @farmery/api dev",
      url: `${API_URL}/health`,
      reuseExistingServer: !CI,
      timeout: 120_000,
    },
    {
      command: "pnpm --filter @farmery/shop dev",
      url: SHOP_URL,
      reuseExistingServer: !CI,
      timeout: 180_000,
    },
    {
      command: "pnpm --filter @farmery/admin dev",
      url: ADMIN_URL,
      reuseExistingServer: !CI,
      timeout: 120_000,
    },
  ],
});
