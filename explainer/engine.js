// Explainer motion-graphics engine. window.frame(t) -> jpeg dataURL. Spec is in window.SPEC.
const W = 1920, H = 1080;
const C0 = { bg0: '#070b14', bg1: '#111a2e', gold: '#f2c14e', red: '#ff4d5e', teal: '#2ee6c5', white: '#f4f1ea', mute: '#8b93a7', ink: '#0b0f1a', paper: '#efe8d8', blue: '#5b8cff', panel: 'rgba(255,255,255,.05)', line: 'rgba(255,255,255,.12)', dim: '#39425a', dots: 'rgba(160,180,230,.18)' };
const C = Object.assign({}, C0);
let T = null; // active theme (styles.js)
const cv = document.createElement('canvas'); cv.width = W; cv.height = H; document.body.appendChild(cv);
const X = cv.getContext('2d');
const F = (w, s, fam) => { if (fam === 'Lora') fam = T ? T.serif : 'Lora'; if (!fam) fam = T ? (w >= 700 ? T.head : T.body) : 'Poppins'; if (T && T.scale && T.scale[fam]) s = Math.round(s * T.scale[fam]); return `${w} ${s}px "${fam}", "Noto Color Emoji"`; };
const EMO = s => `${s}px "Noto Color Emoji"`;
const cl = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const eo = p => 1 - Math.pow(1 - cl(p), 3);
const eio = p => { p = cl(p); return p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; };
const back = p => { p = cl(p); const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2); };
const col = c => C[c] || c || C.gold;
function rr(x, y, w, h, r) { X.beginPath(); X.moveTo(x + r, y); X.arcTo(x + w, y, x + w, y + h, r); X.arcTo(x + w, y + h, x, y + h, r); X.arcTo(x, y + h, x, y, r); X.arcTo(x, y, x + w, y, r); X.closePath(); }
function wrap(text, maxW, font) { X.font = font; const words = String(text).split(' '); const lines = []; let cur = ''; for (const w of words) { const t = cur ? cur + ' ' + w : w; if (X.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; } if (cur) lines.push(cur); return lines; }
function txt(s, x, y, font, color, align = 'center', alpha = 1) { if (T && T.upper && T.head && font.includes(T.head)) s = String(s).toUpperCase(); X.save(); X.globalAlpha *= alpha; X.font = font; X.fillStyle = color; X.textAlign = align; X.textBaseline = 'middle'; X.fillText(s, x, y); X.restore(); }
function emo(e, x, y, size, alpha = 1, rot = 0) { X.save(); X.globalAlpha *= alpha; X.translate(x, y); X.rotate(rot); X.fillStyle = "#fff"; X.font = EMO(size); X.textAlign = 'center'; X.textBaseline = 'middle'; X.fillText(e, 0, size * .05); X.restore(); }
function glow(color, blur) { const g = T ? T.glow : 1; if (!g) return; X.shadowColor = color; X.shadowBlur = blur * g; }
function noglow() { X.shadowBlur = 0; X.shadowColor = 'transparent'; }
function rnd(i) { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
function fmt(n, dec) { return n.toLocaleString('en-GB', { minimumFractionDigits: dec, maximumFractionDigits: dec }); }

// ---------- background ----------
function background(t, accent) {
  const g = X.createRadialGradient(W * .5, H * .45, 100, W * .5, H * .5, W * .75);
  g.addColorStop(0, C.bg1); g.addColorStop(1, C.bg0); X.fillStyle = g; X.fillRect(0, 0, W, H);
  // drifting grid
  X.save(); X.globalAlpha = .07; X.strokeStyle = '#9fb4ff'; X.lineWidth = 1; const off = (t * 12) % 80;
  for (let x = -80 + off; x < W + 80; x += 80) { X.beginPath(); X.moveTo(x, 0); X.lineTo(x, H); X.stroke(); }
  for (let y = -80 + off * .5; y < H + 80; y += 80) { X.beginPath(); X.moveTo(0, y); X.lineTo(W, y); X.stroke(); }
  X.restore();
  // floating symbols
  for (let i = 0; i < 26; i++) {
    const sp = 18 + rnd(i) * 30, y = H + 60 - ((t * sp + rnd(i + 9) * H * 1.3) % (H + 140)), x = rnd(i + 3) * W + Math.sin(t * .3 + i) * 30;
    X.save(); X.globalAlpha = .05 + rnd(i + 5) * .07; X.font = F(600, 22 + rnd(i + 7) * 40); X.fillStyle = i % 3 ? C.gold : accent; X.textAlign = 'center'; X.fillText(['£', '$', '€', '%', '•'][i % 5], x, y); X.restore();
  }
  // accent bloom
  const b = X.createRadialGradient(W * .5, H * .5, 0, W * .5, H * .5, 700); b.addColorStop(0, accent + '22'); b.addColorStop(1, accent + '00'); X.fillStyle = b; X.fillRect(0, 0, W, H);
}
function vignette() { const v = X.createRadialGradient(W / 2, H / 2, H * .45, W / 2, H / 2, W * .72); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.55)'); X.fillStyle = v; X.fillRect(0, 0, W, H); }

// ---------- scenes ----------
const S = {};
S.hook = (v, lt, d) => { // big words pop one by one
  const words = v.text.split(' '); const per = Math.min(.35, (d * .6) / words.length);
  const font = F(700, v.size || 112); const lines = wrap(v.text, 1500, font); let wi = 0; const lh = (v.size || 112) * 1.18; const y0 = H * .46 - (lines.length - 1) * lh / 2 + (v.emoji ? 60 : 0);
  if (v.emoji) emo(v.emoji, W / 2, y0 - lh * .5 - 110 - (lines.length - 1) * 0, 150, eo(lt / .5), Math.sin(lt * 2) * .06);
  lines.forEach((ln, li) => {
    X.font = font; const ws = ln.split(' '); const total = X.measureText(ln).width; let x = W / 2 - total / 2;
    ws.forEach(w => { const p = back((lt - wi * per) / .35); const hot = (v.hot || []).some(h => w.toLowerCase().includes(h.toLowerCase()));
      const wW = X.measureText(w + ' ').width; X.save(); X.translate(x + X.measureText(w).width / 2, y0 + li * lh); X.scale(.6 + .4 * p, .6 + .4 * p); X.globalAlpha = cl(p);
      if (hot) glow(col(v.color || 'gold'), 30); txt(w, 0, 0, font, hot ? col(v.color || 'gold') : C.white); noglow(); X.restore(); x += wW; wi++; });
  });
};
S.chapter = (v, lt) => { const p = eo(lt / .7); X.save(); X.globalAlpha = p;
  txt(`PART ${v.n}`, W / 2, H * .38, F(600, 40), col(v.color || 'gold')); X.fillStyle = col(v.color || 'gold'); X.fillRect(W / 2 - 160 * p, H * .43, 320 * p, 4);
  wrap(v.text, 1500, F(700, 96)).forEach((l, i) => txt(l, W / 2, H * .55 + i * 110 + (1 - p) * 40, F(700, 96), C.white)); X.restore(); };
S.num = (v, lt, d) => { const p = eio(lt / Math.min(1.6, d * .5)); const val = (v.from || 0) + (v.value - (v.from || 0)) * p; const c = col(v.color);
  if (v.emoji) emo(v.emoji, W / 2, H * .25, 130, eo(lt / .5));
  X.save(); glow(c, 40); txt(`${v.prefix || ''}${fmt(val, v.dec || 0)}${v.suffix || ''}`, W / 2, v.emoji ? H * .5 : H * .44, F(700, v.size || 210, T && T.num), c, 'center', eo(lt / .3)); X.restore();
  wrap(v.label, 1500, F(500, 54)).forEach((l, i) => txt(l, W / 2, (v.emoji ? H * .68 : H * .64) + i * 66, F(500, 54), C.white, 'center', eo((lt - .4) / .5)));
  if (v.source) txt(v.source, W / 2, H * .86, F(400, 26), C.mute, 'center', eo((lt - .8) / .5)); };
S.icon = (v, lt) => { const p = back(lt / .6); const c = col(v.color);
  X.save(); X.globalAlpha = .9; for (let i = 0; i < 3; i++) { X.beginPath(); X.strokeStyle = c; X.globalAlpha = .25 * (1 - ((lt * .5 + i / 3) % 1)); X.lineWidth = 3; X.arc(W / 2, H * .4, 160 + ((lt * .5 + i / 3) % 1) * 260, 0, 7); X.stroke(); } X.restore();
  X.save(); X.translate(W / 2, H * .4); X.scale(p, p); emo(v.emoji, 0, 0, 230, 1, Math.sin(lt * 1.6) * .05); X.restore();
  txt(v.text, W / 2, H * .72, F(700, 80), C.white, 'center', eo((lt - .3) / .5));
  if (v.sub) txt(v.sub, W / 2, H * .81, F(400, 42), C.mute, 'center', eo((lt - .6) / .5)); };
S.bars = (v, lt, d) => { const items = v.items; const max = v.max || Math.max(...items.map(i => i[1])); const x0 = 480, x1 = 1640, y0 = H * .27, gap = Math.min(150, (H * .58) / items.length);
  if (v.title) txt(v.title, W / 2, H * .14, F(700, 64), C.white, 'center', eo(lt / .4));
  items.forEach((it, i) => { const p = eio((lt - .3 - i * .25) / 1.0); const y = y0 + i * gap; const c = col(it[2] || v.color);
    txt(it[0], x0 - 30, y + gap * .3, F(600, 42), C.white, 'right', eo((lt - i * .2) / .4));
    X.fillStyle = C.panel; rr(x0, y, x1 - x0, gap * .6, 14); X.fill();
    X.save(); glow(c, 20); X.fillStyle = c; rr(x0, y, Math.max(20, (x1 - x0) * (it[1] / max) * p), gap * .6, 14); X.fill(); X.restore();
    txt(`${v.prefix || ''}${fmt(it[1] * p, v.dec || 0)}${v.suffix || ''}`, x0 + Math.max(20, (x1 - x0) * (it[1] / max) * p) + 20, y + gap * .3, F(700, 40), c, 'left', cl(p * 2)); });
  if (v.source) txt(v.source, W / 2, H * .92, F(400, 26), C.mute, 'center', eo((lt - 1) / .5)); };
S.line = (v, lt, d) => { const pts = v.points; const x0 = 260, x1 = 1680, y0 = 250, y1 = 840; const mn = v.min ?? Math.min(...pts), mx = v.max ?? Math.max(...pts); const c = col(v.color);
  if (v.title) txt(v.title, W / 2, 140, F(700, 60), C.white, 'center', eo(lt / .4));
  X.strokeStyle = C.line; X.lineWidth = 2; for (let i = 0; i <= 4; i++) { const y = y0 + (y1 - y0) * i / 4; X.beginPath(); X.moveTo(x0, y); X.lineTo(x1, y); X.stroke(); }
  const p = eio((lt - .3) / Math.min(3, d * .7)); const n = pts.length - 1; const P = i => [x0 + (x1 - x0) * i / n, y1 - (y1 - y0) * (pts[i] - mn) / (mx - mn || 1)];
  X.save(); glow(c, 25); X.strokeStyle = c; X.lineWidth = 8; X.lineJoin = 'round'; X.beginPath(); const lim = p * n;
  for (let i = 0; i <= Math.floor(lim); i++) { const [x, y] = P(i); i ? X.lineTo(x, y) : X.moveTo(x, y); }
  let hx, hy; if (lim < n) { const i = Math.floor(lim), f = lim - i; const [ax, ay] = P(i), [bx, by] = P(i + 1); hx = ax + (bx - ax) * f; hy = ay + (by - ay) * f; X.lineTo(hx, hy); } else[hx, hy] = P(n);
  X.stroke(); X.fillStyle = c; X.beginPath(); X.arc(hx, hy, 14, 0, 7); X.fill(); X.restore();
  (v.labels || []).forEach((l, i) => { if (l) txt(l, x0 + (x1 - x0) * i / n, y1 + 50, F(500, 32), C.mute, 'center', eo((lt - .2) / .5)); });
  if (v.end) txt(v.end, Math.min(hx + 20, x1 - 40), hy - 60, F(700, 52), c, 'center', cl((p - .9) * 10)); };
S.list = (v, lt, d) => { const items = v.items; const step = Math.max(.5, Math.min(1.6, (d - 1) / items.length));
  if (v.title) txt(v.title, W / 2, 150, F(700, 66), col(v.color || 'gold'), 'center', eo(lt / .4));
  const gap = Math.min(150, 700 / items.length); const y0 = 300 + (5 - Math.min(5, items.length)) * gap * .35;
  items.forEach((it, i) => { const p = eo((lt - .3 - i * step) / .5); const y = y0 + i * gap; X.save(); X.globalAlpha = p; X.translate((1 - p) * -60, 0);
    X.fillStyle = C.panel; rr(330, y - gap * .4, 1260, gap * .8, 22); X.fill(); emo(it[0], 420, y, gap * .5);
    txt(it[1], 500, y, F(600, Math.min(50, gap * .36)), C.white, 'left'); X.restore(); }); };
S.vs = (v, lt) => { const sides = [v.left, v.right]; sides.forEach((s, k) => { const p = eo((lt - k * .5) / .6); const cx = k ? 1440 : 480; const c = col(s.color || (k ? 'red' : 'teal'));
  X.save(); X.globalAlpha = p; X.translate(0, (1 - p) * 50); X.fillStyle = C.panel; rr(cx - 400, 150, 800, 720, 30); X.fill(); X.strokeStyle = c; X.lineWidth = 4; rr(cx - 400, 150, 800, 720, 30); X.stroke();
  txt(s.title, cx, 230, F(700, 58), c); emo(s.emoji, cx, 400, 150);
  (s.lines || []).forEach((l, i) => txt(l, cx, 570 + i * 80, F(500, 44), C.white, 'center', eo((lt - .6 - k * .5 - i * .25) / .4))); X.restore(); });
  txt('VS', W / 2, 550, F(700, 70), C.white, 'center', eo((lt - .4) / .4)); };
S.flow = (v, lt, d) => { const n = v.nodes.length; const xs = v.nodes.map((_, i) => 260 + (W - 520) * (n === 1 ? .5 : i / (n - 1))); const y = H * .5;
  if (v.title) txt(v.title, W / 2, 170, F(700, 62), C.white, 'center', eo(lt / .4));
  const step = Math.min(1.2, (d - 1) / n);
  for (let i = 0; i < n - 1; i++) { const p = eio((lt - .6 - i * step) / .6); X.save(); X.strokeStyle = col(v.color || 'gold'); X.globalAlpha = .7; X.lineWidth = 6; X.setLineDash([18, 14]); X.lineDashOffset = -lt * 60;
    X.beginPath(); X.moveTo(xs[i] + 110, y); X.lineTo(xs[i] + 110 + (xs[i + 1] - xs[i] - 220) * p, y); X.stroke(); X.restore();
    if (p >= 1) for (let k = 0; k < 3; k++) { const f = ((lt * .6 + k / 3) % 1); emo(v.coin || '💷', xs[i] + 110 + (xs[i + 1] - xs[i] - 220) * f, y - 6, 44, Math.sin(f * Math.PI)); } }
  v.nodes.forEach((nd, i) => { const p = back((lt - i * step) / .5); X.save(); X.translate(xs[i], y); X.scale(p, p); X.fillStyle = C.panel; X.beginPath(); X.arc(0, 0, 105, 0, 7); X.fill();
    X.strokeStyle = col(nd[2] || v.color || 'gold'); X.lineWidth = 5; X.stroke(); emo(nd[0], 0, 0, 100); X.restore();
    wrap(nd[1], 330, F(600, 38)).forEach((l, j) => txt(l, xs[i], y + 170 + j * 46, F(600, 38), C.white, 'center', cl(p))); }); };
S.timeline = (v, lt, d) => { const ev = v.events; const n = ev.length; const step = Math.max(.6, (d - .8) / n); const cur = cl(Math.floor((lt - .2) / step), 0, n - 1); const gap = 560;
  const target = cur * gap; const prev = Math.max(0, cur - 1) * gap; const pan = prev + (target - prev) * eio(((lt - .2) - cur * step) / .6); const ox = W / 2 - pan;
  X.strokeStyle = C.line; X.lineWidth = 4; X.beginPath(); X.moveTo(0, H * .5); X.lineTo(W, H * .5); X.stroke();
  ev.forEach((e, i) => { const x = ox + i * gap; const on = i <= cur; const p = on ? eo(((lt - .2) - i * step) / .5) : 0; const c = col(e[2] || v.color || 'gold');
    X.save(); X.fillStyle = on ? c : C.dim; if (on) glow(c, 25); X.beginPath(); X.arc(x, H * .5, on ? 18 : 12, 0, 7); X.fill(); X.restore();
    txt(e[0], x, H * .5 - 90, F(700, 64), on ? c : C.dim, 'center', on ? p : .6);
    if (on) wrap(e[1], 480, F(500, 38)).forEach((l, j) => txt(l, x, H * .5 + 80 + j * 48, F(500, 38), C.white, 'center', p)); }); };
S.doc = (v, lt, d) => { const p = eo(lt / .6); X.save(); X.translate(W / 2, H / 2 + (1 - p) * 120); X.rotate(-.03); X.globalAlpha = p;
  X.shadowColor = 'rgba(0,0,0,.5)'; X.shadowBlur = 50; X.fillStyle = C.paper; X.fillRect(-460, -420, 920, 840); noglow();
  txt(v.title, 0, -340, F(700, 44, 'Lora'), C.ink); X.fillStyle = C.ink; X.fillRect(-380, -300, 760, 3);
  (v.lines || []).forEach((l, i) => { txt(l[0], -380, -230 + i * 76, F(500, 34), '#333', 'left'); txt(l[1], 380, -230 + i * 76, F(700, 34), C.ink, 'right'); });
  if (v.stamp) { const sp = cl((lt - (v.stampAt ?? 1.4)) / .25); if (sp > 0) { const s = 1 + 1.5 * (1 - sp); X.save(); X.rotate(-.25); X.scale(s, s); X.globalAlpha = sp * .9; X.strokeStyle = C.red; X.lineWidth = 12; rr(-300, 120, 600, 150, 16); X.stroke(); txt(v.stamp, 0, 197, F(700, 104), C.red); X.restore(); } }
  X.restore(); };
S.headline = (v, lt) => { const p = eo(lt / .6); X.save(); X.translate(W / 2, H / 2); X.rotate(.02 * (1 - p)); X.scale(.9 + .1 * p, .9 + .1 * p); X.globalAlpha = p;
  X.shadowColor = 'rgba(0,0,0,.5)'; X.shadowBlur = 50; X.fillStyle = '#f6f1e6'; X.fillRect(-720, -330, 1440, 660); noglow();
  txt(v.paper || 'THE DAILY LEDGER', 0, -260, F(700, 46, 'Lora'), C.ink); X.fillStyle = C.ink; X.fillRect(-640, -215, 1280, 4); X.fillRect(-640, -205, 1280, 1.5);
  if (v.kicker) txt(v.kicker.toUpperCase(), -640, -160, F(700, 28), C.red, 'left');
  wrap(v.text, 1280, F(700, 74, 'Lora')).forEach((l, i) => txt(l, -640, -80 + i * 92, F(700, 74, 'Lora'), C.ink, 'left'));
  if (v.date) txt(v.date, -640, 270, F(500, 28), '#555', 'left'); X.restore(); };
S.quote = (v, lt) => { const p = eo(lt / .6); txt('“', W / 2, H * .22, F(700, 220, 'Lora'), col(v.color || 'gold'), 'center', p);
  wrap(v.text, 1400, F(600, 64, 'Lora')).forEach((l, i, a) => txt(l, W / 2, H * .45 + (i - (a.length - 1) / 2) * 84, F(600, 64, 'Lora'), C.white, 'center', eo((lt - .2 - i * .15) / .5)));
  if (v.who) txt('— ' + v.who, W / 2, H * .78, F(500, 38), C.mute, 'center', eo((lt - .8) / .5)); };
S.stack = (v, lt, d) => { const n = v.count || 30; const shown = Math.floor(n * eio((lt - .2) / Math.min(2.4, d * .6))); const cols = Math.ceil(n / 12);
  for (let i = 0; i < shown; i++) { const c = Math.floor(i / 12), r = i % 12; const x = W / 2 - (cols * 230) / 2 + c * 230 + 115, y = 860 - r * 46; const drop = cl((lt - .2 - i * (Math.min(2.4, d * .6) / n)) / .2);
    X.save(); X.translate(x, y - (1 - drop) * 80); X.fillStyle = v.color === 'red' ? '#a33' : '#2f8f5b'; rr(-100, -20, 200, 40, 6); X.fill(); X.fillStyle = v.color === 'red' ? '#d55' : '#4cc27f'; rr(-100, -20, 200, 14, 6); X.fill(); X.fillStyle = '#e9e2c8'; X.fillRect(-18, -20, 36, 40); X.restore(); }
  txt(v.label, W / 2, 170, F(700, 72), col(v.labelColor || 'gold'), 'center', eo(lt / .4)); if (v.sub) txt(v.sub, W / 2, 250, F(500, 40), C.white, 'center', eo((lt - .3) / .4)); };
S.grid = (v, lt, d) => { // N icons, some highlighted: "1 in 5"
  const n = v.total || 10, hl = v.highlight || 1; const per = Math.min(10, n); const rows = Math.ceil(n / per); const sz = Math.min(130, 1500 / per / 1.2, 560 / rows / 1.2);
  if (v.title) txt(v.title, W / 2, 170, F(700, 66), C.white, 'center', eo(lt / .4));
  for (let i = 0; i < n; i++) { const r = Math.floor(i / per), c = i % per; const x = W / 2 - (per - 1) * sz * .6 + c * sz * 1.2, y = H * .5 - (rows - 1) * sz * .6 + r * sz * 1.2;
    const p = back((lt - .2 - i * .05) / .4); const on = i < hl && lt > .2 + n * .05 + .4; X.save(); X.translate(x, y); X.scale(p * (on ? 1.15 : 1), p * (on ? 1.15 : 1)); X.globalAlpha = on ? 1 : .35; emo(on ? (v.on || v.emoji) : v.emoji, 0, 0, sz * .8); X.restore(); }
  if (v.label) txt(v.label, W / 2, H * .84, F(700, 58), col(v.color || 'gold'), 'center', eo((lt - .2 - n * .05 - .4) / .4)); };
S.map = (v, lt) => { // pins with labels on abstract dotted world
  for (let y = 0; y < 26; y++) for (let x = 0; x < 60; x++) { const lon = x / 60, lat = y / 26; const land = rnd(Math.floor(lon * 9) * 13 + Math.floor(lat * 6) * 7) > .45 && lat > .12 && lat < .86; if (!land) continue;
    X.fillStyle = C.dots; X.beginPath(); X.arc(160 + x * 27, 160 + y * 30, 5, 0, 7); X.fill(); }
  (v.pins || []).forEach((pn, i) => { const p = back((lt - .3 - i * .5) / .5); const x = 160 + pn[1] * 1600, y = 160 + pn[2] * 780; const c = col(pn[3] || v.color || 'red');
    X.save(); X.translate(x, y); X.scale(p, p); glow(c, 30); X.fillStyle = c; X.beginPath(); X.arc(0, 0, 18, 0, 7); X.fill(); noglow(); X.restore();
    txt(pn[0], x, y - 50, F(700, 40), C.white, 'center', cl(p)); });
  for (let i = 0; i < (v.pins || []).length - 1; i++) { const a = v.pins[i], b = v.pins[i + 1]; const p = eio((lt - .8 - i * .5) / .6); if (p <= 0) continue; const ax = 160 + a[1] * 1600, ay = 160 + a[2] * 780, bx = 160 + b[1] * 1600, by = 160 + b[2] * 780;
    X.save(); X.strokeStyle = col(v.color || 'gold'); X.lineWidth = 4; X.setLineDash([12, 10]); X.lineDashOffset = -lt * 40; X.beginPath(); X.moveTo(ax, ay); const mx = (ax + bx) / 2, my = Math.min(ay, by) - 140;
    for (let k = 0; k <= 30 * p; k++) { const f = k / 30; X.lineTo((1 - f) * (1 - f) * ax + 2 * (1 - f) * f * mx + f * f * bx, (1 - f) * (1 - f) * ay + 2 * (1 - f) * f * my + f * f * by); } X.stroke(); X.restore(); }
  if (v.title) txt(v.title, W / 2, 100, F(700, 60), C.white, 'center', eo(lt / .4)); };
S.outro = (v, lt) => { const p = eo(lt / .6); txt(v.text, W / 2, H * .42, F(700, 84), C.white, 'center', p); if (v.sub) txt(v.sub, W / 2, H * .55, F(500, 46), col('gold'), 'center', eo((lt - .4) / .5));
  const bp = back((lt - .8) / .5); X.save(); X.translate(W / 2, H * .72); X.scale(bp, bp); X.fillStyle = C.red; rr(-230, -55, 460, 110, 24); X.fill(); txt('SUBSCRIBE', 0, 2, F(700, 52), '#fff'); X.restore(); };

// ---------- captions ----------
function captions(b, lt) {
  if (!b.say || window.SPEC.nocap) return; const words = b.say.split(/\s+/); const chunks = []; let cur = [];
  words.forEach(w => { cur.push(w); if (cur.length >= 7 || /[.,!?;:]$/.test(w) && cur.length >= 3) { chunks.push(cur); cur = []; } }); if (cur.length) chunks.push(cur);
  const total = b.say.length; const sp = b.speech || b.dur; let acc = 0; let ci = 0, wi = 0;
  const tAt = chars => chars / total * sp;
  for (let i = 0; i < chunks.length; i++) { const len = chunks[i].join(' ').length + 1; if (lt < tAt(acc + len) || i === chunks.length - 1) { ci = i; let a2 = acc; for (let k = 0; k < chunks[i].length; k++) { a2 += chunks[i][k].length + 1; if (lt < tAt(a2)) { wi = k; break; } wi = k; } break; } acc += len; }
  if (lt > sp + .2) return; const cp = (T && T.cap) || {}; const ch = chunks[ci].map(w => cp.upper ? w.toUpperCase() : w); const font = F(700, cp.size || 44, cp.font); X.font = font; const line = ch.join(' '); const w = X.measureText(line).width;
  X.fillStyle = cp.bg || 'rgba(5,8,15,.72)'; rr(W / 2 - w / 2 - 30, H - 132, w + 60, 76, cp.r ?? 18); X.fill(); let x = W / 2 - w / 2;
  ch.forEach((wd, k) => { X.save(); X.font = font; X.fillStyle = k === wi ? (cp.hl || C.gold) : (cp.fg || C.white); X.textAlign = 'left'; X.textBaseline = 'middle'; X.fillText(wd, x, H - 94); X.restore(); X.font = font; x += X.measureText(wd + ' ').width; });
}

// ---------- timeline ----------
function prep(spec) { let t = 0, last = null, gstart = 0; spec.beats.forEach(b => { b.t0 = t; if (b.vis === 'same' || !b.vis) { b.vis = last; b.cont = true; b.g0 = gstart; } else { gstart = t; b.g0 = t; } last = b.vis; t += b.dur; }); spec.dur = t; }
function beatAt(t) { const bs = window.SPEC.beats; let i = 0; while (i < bs.length - 1 && t >= bs[i + 1].t0) i++; return i; }
function drawVis(b, gt) { const v = b.vis; const lt = gt - b.g0; let gd = 0; const bs = window.SPEC.beats; for (const x of bs) if (x.g0 === b.g0) gd += x.dur; (S[v.type] || S.hook)(v, lt, gd); }
window.frame = (t, q = .86) => {
  const spec = window.SPEC; const i = beatAt(t); const b = spec.beats[i]; const accent = col(b.vis.color || spec.accent || 'gold');
  T.bg(t, accent.startsWith('#') ? accent : C.gold, i);
  const gt = t; const lt = t - b.t0; const camS = 1 + .035 * cl((t - b.g0) / 12);
  X.save(); if (T.stage) T.stage(t, i); X.translate(W / 2, H / 2); X.scale(camS, camS); X.translate(-W / 2, -H / 2);
  const first = b.cont || i === 0; T.trans(first ? null : spec.beats[i - 1], b, lt, gt);
  X.restore(); if (T.post) T.post(t, i, lt, first); captions(b, lt);
  if (T.bar !== false) { X.fillStyle = C.line; X.fillRect(0, 0, W, 6); X.fillStyle = T.bar || C.gold; X.fillRect(0, 0, W * t / spec.dur, 6); }
  return cv.toDataURL('image/jpeg', q);
};
window.thumb = (v, style) => { // 1920x1080 thumbnail, downscaled later
  setTheme(style || 'ledger'); const c = col(v.color || 'red'); T.bg(3, c, 0, true); if (T.thumbBg) T.thumbBg(c);
  X.save(); X.translate(1450, 480); X.rotate(-.08); glow(c, 80); emo(v.emoji, 0, 0, 520); noglow(); X.restore();
  const lines = v.text.split('|'); let y = 300 - (lines.length - 1) * 30;
  lines.forEach((l, i) => { X.save(); X.font = F(700, v.size || 170); X.textAlign = 'left'; X.textBaseline = 'middle'; X.font = F(700, v.size || 170, T.thumbFont || T.head); X.lineWidth = 22; X.strokeStyle = T.thumbStroke || '#000'; X.lineJoin = 'round'; X.strokeText(l, 90, y); X.fillStyle = i === (v.hl ?? lines.length - 1) ? (v.hlColor ? col(v.hlColor) : C.gold) : (T.thumbFg || '#fff'); X.fillText(l, 90, y); X.restore(); y += (v.size || 170) * 1.08; });
  if (v.tag) { X.save(); X.fillStyle = c; X.font = F(700, 64); const w = X.measureText(v.tag).width; rr(90, 850, w + 60, 110, 18); X.fill(); X.fillStyle = '#fff'; X.textBaseline = 'middle'; X.fillText(v.tag, 120, 908); X.restore(); }
  if (T.thumbPost) T.thumbPost(); else vignette(); return cv.toDataURL('image/jpeg', .92); };
window.init = spec => { setTheme(spec.style || 'ledger'); window.SPEC = spec; prep(spec); return { dur: spec.dur }; };
