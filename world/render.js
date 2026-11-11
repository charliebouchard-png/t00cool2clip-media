// node world/render.js spec.json timing.json|- amp.json|- out.mp4|stills:1,5,9 [fps]
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const http = require('http'); const { spawn } = require('child_process');
const ROOT = path.join(__dirname, '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.ttf': 'font/ttf', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.json': 'application/json' };
(async () => {
  const [specF, timF, ampF, out, fpsA] = process.argv.slice(2); const fps = +(fpsA || 30);
  const spec = JSON.parse(fs.readFileSync(specF, 'utf8'));
  if (spec.cast) { const c = JSON.parse(fs.readFileSync(path.join(__dirname, 'cast.json'), 'utf8'))[spec.cast]; if (c) spec.look = { ...c.look, ...(spec.look || {}) }; }
  if (timF && timF !== '-') { const tm = JSON.parse(fs.readFileSync(timF, 'utf8')); spec.scenes.forEach((b, i) => { b.dur = tm[i].dur; b.speech = tm[i].speech; }); }
  else spec.scenes.forEach(b => { b.speech = b.say.split(' ').length / 2.7; b.dur = b.speech + .3; });
  const amp = ampF && ampF !== '-' ? JSON.parse(fs.readFileSync(ampF, 'utf8')) : null;
  const srv = http.createServer((q, r) => {
    const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
    if (!f.startsWith(ROOT) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); }
    r.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
  }).listen(0); const port = srv.address().port;
  const br = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await br.newPage({ viewport: { width: 1080, height: 1920 } });
  p.on('console', m => console.log('page:', m.text())); p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto(`http://127.0.0.1:${port}/world/page.html`);
  await p.waitForFunction(() => window.ready === true, null, { timeout: 30000 });
  const info = await p.evaluate(([s, a, f]) => window.init(s, a, f), [spec, amp, fps]);
  console.log('dur', info.dur);
  if (out.startsWith('stills:')) {
    const ts = out.slice(7).split(',').map(Number); fs.mkdirSync('stills', { recursive: true });
    for (const t of ts) { const u = await p.evaluate(t => window.frame(t), t); fs.writeFileSync(`stills/s_${String(t).padStart(5, '0')}.jpg`, Buffer.from(u.split(',')[1], 'base64')); }
    await br.close(); srv.close(); return;
  }
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '21', '-pix_fmt', 'yuv420p', out]);
  const done = new Promise(r => ff.on('close', r)); const t0 = Date.now(); const N = Math.round(info.dur * fps);
  for (let f = 0; f < N; f++) {
    const u = await p.evaluate(t => window.frame(t), f / fps);
    if (!ff.stdin.write(Buffer.from(u.split(',')[1], 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
    if (f % 300 === 0) console.log(`frame ${f}/${N} ${((Date.now() - t0) / 1000) | 0}s`);
  }
  ff.stdin.end(); console.log('ffmpeg exit', await done, 'secs', ((Date.now() - t0) / 1000) | 0); await br.close(); srv.close();
})();
