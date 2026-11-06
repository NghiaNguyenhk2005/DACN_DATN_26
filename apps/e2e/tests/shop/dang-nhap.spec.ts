import { expect, test } from "@playwright/test";

test.describe("Shop — đăng nhập OTP", () => {
  test("nhận mã demo, đăng nhập rồi thấy tên tài khoản trên đầu trang", async ({ page }) => {
    await page.goto("/dang-nhap");
    await page.getByLabel("Email").fill("nongdan@example.com");
    await page.getByRole("button", { name: "Nhận mã đăng nhập" }).click();

    await expect(page.getByText("Đã gửi mã tới")).toBeVisible();
    const devCode = await page.locator("strong.tracking-widest").innerText();
    expect(devCode).toMatch(/^\d{6}$/);

    await page.getByLabel("Mã OTP").fill(devCode);
    await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();

    await expect(page).toHaveURL("/");
    await expect(page.getByRole("button", { name: /^Tài khoản: / })).toBeVisible();
  });

  test("sai mã OTP thì báo lỗi và ở lại trang", async ({ page }) => {
    await page.goto("/dang-nhap");
    await page.getByLabel("Email").fill("nongdan@example.com");
    await page.getByRole("button", { name: "Nhận mã đăng nhập" }).click();

    await page.getByLabel("Mã OTP").fill("000000");
    await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();

    await expect(page.locator("#code-error")).toHaveText("Mã OTP không đúng.");
    await expect(page).toHaveURL(/\/dang-nhap/);
  });

  test("sai mã quá 5 lần thì mã hết hiệu lực, gửi lại mã mới vẫn đăng nhập được", async ({ page }) => {
    await page.goto("/dang-nhap");
    await page.getByLabel("Email").fill("nongdan@example.com");
    await page.getByRole("button", { name: "Nhận mã đăng nhập" }).click();
    const code = await page.locator("strong.tracking-widest").innerText();
    const wrong = code === "000000" ? "111111" : "000000";

    // React xoá trắng form sau mỗi lần gửi: chờ ô trống rồi mới điền lần kế, kẻo bị xoá mất mã vừa điền.
    for (let i = 1; i <= 5; i++) {
      await page.getByLabel("Mã OTP").fill(wrong);
      await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
      await expect(page.getByLabel("Mã OTP")).toHaveValue("");
      const expected = i < 5 ? "Mã OTP không đúng." : "Mã OTP đã hết hạn, vui lòng gửi lại mã.";
      await expect(page.locator("#code-error")).toHaveText(expected);
    }

    // Bản demo luôn trả cùng một mã; ô mã dựng lại theo challenge mới nên lỗi cũ biến mất.
    await page.getByRole("button", { name: "Gửi lại mã" }).click();
    await expect(page.locator("#code-error")).toBeEmpty();
    const newCode = await page.locator("strong.tracking-widest").innerText();
    await page.getByLabel("Mã OTP").fill(newCode);
    await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
    await expect(page.getByRole("button", { name: /^Tài khoản: / })).toBeVisible();
  });

  test("email sai định dạng thì không gửi mã", async ({ page }) => {
    await page.goto("/dang-nhap");
    await page.getByLabel("Email").fill("khong-phai-email");
    await page.getByRole("button", { name: "Nhận mã đăng nhập" }).click();

    await expect(page.locator("#email-error")).toHaveText("Email chưa đúng định dạng.");
  });
});
