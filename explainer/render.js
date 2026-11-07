// node render.js spec.json timing.json(or -) out.mp4 [fps] [startSec] [endSec]
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path'); const { spawn } = require('child_process');
(async () => {
  const [specF, timF, out, fpsA, st, en] = process.argv.slice(2); const fps = +(fpsA || 30);
  const spec = JSON.parse(fs.readFileSync(specF, 'utf8'));
  if (timF && timF !== '-') { const tm = JSON.parse(fs.readFileSync(timF, 'utf8')); spec.beats.forEach((b, i) => { b.dur = tm[i].dur; b.speech = tm[i].speech; }); }
  else spec.beats.forEach(b => { b.speech = b.say.split(' ').length / 2.6; b.dur = b.speech + .5; });
  const br = await chromium.launch(); const p = await br.newPage({ viewport: { width: 1920, height: 1080 } });
  await p.goto('file://' + path.join(__dirname, 'page.html')); await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(500);
  const info = await p.evaluate(s => window.init(s), spec);
  const f0 = Math.round((+st || 0) * fps), f1 = Math.round((en ? +en : info.dur) * fps);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23', '-pix_fmt', 'yuv420p', out]);
  const done = new Promise(r => ff.on('close', r)); const t0 = Date.now();
  for (let f = f0; f < f1; f++) { const u = await p.evaluate(t => window.frame(t), f / fps); if (!ff.stdin.write(Buffer.from(u.split(',')[1], 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
    if (f % 900 === 0) console.log(`frame ${f}/${f1} ${((Date.now() - t0) / 1000) | 0}s`); }
  ff.stdin.end(); console.log('ffmpeg exit', await done, 'dur', info.dur, 'secs', ((Date.now() - t0) / 1000) | 0); await br.close();
})();
