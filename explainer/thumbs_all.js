// node thumbs_all.js ideas/index.json ideas/thumbs  -> 1920x1080 jpgs (downscaled afterwards)
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
(async () => { const [idx, out] = process.argv.slice(2); const ideas = JSON.parse(fs.readFileSync(idx)); fs.mkdirSync(out, { recursive: true });
  const br = await chromium.launch(); const p = await br.newPage({ viewport: { width: 1920, height: 1080 } }); p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto('file://' + path.join(__dirname, 'page.html')); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(600);
  for (const it of ideas) { const u = await p.evaluate(([v, s]) => window.thumb(v, s), [it.thumbnail, it.style]); fs.writeFileSync(path.join(out, it.code + '.full.jpg'), Buffer.from(u.split(',')[1], 'base64')); }
  await br.close(); console.log(ideas.length); })();
