// Chụp các trang HTML thiết kế trong tools/design/ thành PNG trong image/comparison/
// Dùng cho các hình so sánh và infographic ở chapters/ và backmatter/phuluc.tex.
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const designDir = path.join(__dirname, 'design');
const outDir = path.join(__dirname, '..', 'image', 'comparison');

const pages = [
  'thuc-trang-chuoi-cung-ung.html',
  'ocop-2024-2025.html',
  // 3 cụm BMC dùng trong thân báo cáo (thay cho ảnh ngang khó đọc)
  'bmc-cum1.html',
  'bmc-cum2.html',
  'bmc-cum3.html',
];

(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ deviceScaleFactor: 2 });

  for (const file of pages) {
    const srcPath = path.join(designDir, file);
    const outPath = path.join(outDir, file.replace('.html', '.png'));
    await page.goto('file://' + srcPath.replace(/\\/g, '/'));
    await page.waitForTimeout(150);
    // Khớp viewport với bề rộng thật của body để ảnh không dư nền hai bên,
    // nhờ đó chữ không bị thu nhỏ thêm khi ảnh được ép về \textwidth trong LaTeX.
    // Khớp luôn chiều cao viewport với chiều cao thật của nội dung: nếu để chiều cao
    // cố định lớn hơn nội dung, ảnh chụp fullPage vẫn lấy trọn viewport và sinh ra một
    // khoảng nền trắng thừa phía dưới bảng khi chèn vào LaTeX.
    const { contentWidth, contentHeight } = await page.evaluate(() => {
      const rect = document.body.getBoundingClientRect();
      const style = getComputedStyle(document.body);
      return {
        contentWidth: Math.ceil(rect.width),
        contentHeight: Math.ceil(rect.height + parseFloat(style.marginTop) + parseFloat(style.marginBottom)),
      };
    });
    await page.setViewportSize({ width: contentWidth, height: contentHeight });
    await page.waitForTimeout(100);
    await page.screenshot({ path: outPath, fullPage: true });
    console.log('Rendered', outPath);
  }

  await browser.close();
})();
