// node render.js story.json timing.json(or -) out.mp4 [fps] [startSec] [endSec] [stillsDir]
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path'); const http = require('http'); const { spawn } = require('child_process');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.ttf': 'font/ttf', '.json': 'application/json' };
(async () => {
  const [specF, timF, out, fpsA, st, en, stills] = process.argv.slice(2); const fps = +(fpsA || 30);
  const spec = JSON.parse(fs.readFileSync(specF, 'utf8')); const timing = timF && timF !== '-' ? JSON.parse(fs.readFileSync(timF, 'utf8')) : null;
  const root = __dirname; const srv = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split('?')[0])); if (!f.startsWith(root) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); });
  await new Promise(r => srv.listen(0, r)); const port = srv.address().port;
  const br = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await br.newPage({ viewport: { width: 720, height: 1280 } }); p.on('console', m => { if ((m.type() === 'error' || m.type() === 'warning') && !/GL Driver|GPU stall/.test(m.text())) console.log('page:', m.text()); }); p.on('pageerror', e => console.log('pageerror:', e.message));
  await p.goto(`http://127.0.0.1:${port}/page.html`); await p.waitForFunction(() => window.ready === true, null, { timeout: 60000 });
  const info = await p.evaluate(([s, t]) => window.init(s, t), [spec, timing]);
  const f0 = Math.round((+st || 0) * fps), f1 = Math.round((en ? Math.min(+en, info.dur) : info.dur) * fps);
  if (stills) { fs.mkdirSync(stills, { recursive: true }); const times = info.shots.map(([a, d]) => a + d * 0.6);
    for (let i = 0; i < times.length; i++) { const u = await p.evaluate(t => window.frame(t), times[i]); fs.writeFileSync(path.join(stills, `s${String(i).padStart(2, '0')}.jpg`), Buffer.from(u.split(',')[1], 'base64')); }
    console.log('stills', times.length, 'dur', info.dur); await br.close(); srv.close(); return; }
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', out]);
  const done = new Promise(r => ff.on('close', r)); const t0 = Date.now();
  for (let f = f0; f < f1; f++) { const u = await p.evaluate(t => window.frame(t), f / fps); if (!ff.stdin.write(Buffer.from(u.split(',')[1], 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
    if (f % 300 === 0) console.log(`frame ${f}/${f1} ${((Date.now() - t0) / 1000) | 0}s`); }
  ff.stdin.end(); console.log('ffmpeg exit', await done, 'dur', info.dur, 'secs', ((Date.now() - t0) / 1000) | 0);
  fs.writeFileSync(out + '.shots.json', JSON.stringify(info)); await br.close(); srv.close();
})();
