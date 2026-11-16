// Test blackbox: khởi động server đã build (node dist/main.js) thành tiến trình riêng và chỉ nói chuyện qua HTTP thật.
// Chạy: pnpm test:blackbox (tự build trước). Bỏ phần chậm (chờ giữ chỗ hết hạn thật ~70 giây): BLACKBOX_SKIP_SLOW=1.
module.exports = {
  rootDir: ".",
  testRegex: "test/blackbox/.*\\.bb-spec\\.ts$",
  transform: { "^.+\\.ts$": ["ts-jest", { tsconfig: "tsconfig.json", diagnostics: { ignoreCodes: [151002] } }] },
  testEnvironment: "node",
  globalSetup: "<rootDir>/test/blackbox/global-setup.ts",
  globalTeardown: "<rootDir>/test/blackbox/global-teardown.ts",
  testTimeout: 150000,
  maxWorkers: 1,
};
