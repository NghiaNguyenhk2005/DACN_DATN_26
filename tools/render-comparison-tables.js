// Chụp các trang HTML thiết kế trong tools/design/ thành PNG trong image/comparison/
// Dùng cho các bảng so sánh ở chapters/chuong2-coso-lythuyet.tex.
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const designDir = path.join(__dirname, 'design');
const outDir = path.join(__dirname, '..', 'image', 'comparison');

const pages = [
  'thuc-trang-chuoi-cung-ung.html',
  'ocop-2024-2025.html',
  'business-model-canvas.html',
  'so-sanh-trong-nuoc.html',
  'so-sanh-quoc-te.html',
  'research-gap.html',
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
    await page.screenshot({ path: outPath, fullPage: true });
    console.log('Rendered', outPath);
  }

  await browser.close();
})();
