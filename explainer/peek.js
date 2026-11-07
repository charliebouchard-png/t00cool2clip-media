const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
(async () => { const [specF, dir, ...ts] = process.argv.slice(2); const spec = JSON.parse(fs.readFileSync(specF, 'utf8'));
  spec.beats.forEach(b => { b.speech = b.say.split(' ').length / 2.6; b.dur = b.speech + .5; });
  const br = await chromium.launch(); const p = await br.newPage({ viewport: { width: 1920, height: 1080 } });
  await p.goto('file://' + path.join(__dirname, 'page.html')); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(500);
  await p.evaluate(s => window.init(s), spec); fs.mkdirSync(dir, { recursive: true });
  let times = ts; if (ts[0] === 'beats') { times = []; let t = 0; for (const b of spec.beats) { times.push(+(t + Math.min(b.dur - .3, 3.2)).toFixed(2)); t += b.dur; } }
  for (const t of times) { const u = await p.evaluate(t => window.frame(+t, .8), t); fs.writeFileSync(path.join(dir, `f_${String(t).padStart(7, '0')}.jpg`), Buffer.from(u.split(',')[1], 'base64')); }
  await br.close(); console.log(times.length, 'frames'); })();
