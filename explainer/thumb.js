// node thumb.js spec.json out.jpg
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
(async () => { const [specF, out] = process.argv.slice(2); const spec = JSON.parse(fs.readFileSync(specF, 'utf8'));
  const br = await chromium.launch(); const p = await br.newPage({ viewport: { width: 1920, height: 1080 } });
  await p.goto('file://' + path.join(__dirname, 'page.html')); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(500);
  const u = await p.evaluate(v => window.thumb(v[0], v[1]), [spec.thumb, spec.style]); fs.writeFileSync(out, Buffer.from(u.split(',')[1], 'base64')); await br.close(); })();
