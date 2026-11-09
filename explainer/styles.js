// Editing styles. Each theme sets colours, fonts, background, transition, captions and overlays.
// Loaded after engine.js. Pick one per video with spec.style.
function noiseCanvas(seed, size, alpha, mono) {
  const c = document.createElement('canvas'); c.width = c.height = size; const g = c.getContext('2d'); const im = g.createImageData(size, size);
  let s = seed * 9973 + 1; const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  for (let i = 0; i < size * size; i++) { const v = r() * 255; im.data[i * 4] = mono ? v : r() * 255; im.data[i * 4 + 1] = mono ? v : r() * 255; im.data[i * 4 + 2] = mono ? v : r() * 255; im.data[i * 4 + 3] = r() * alpha; }
  g.putImageData(im, 0, 0); return c;
}
const GRAIN = [1, 2, 3, 4].map(k => noiseCanvas(k, 256, 60, true));
function grain(t, a) { X.save(); X.globalAlpha = a; const g = GRAIN[Math.floor(t * 24) % 4]; for (let y = 0; y < H; y += 256) for (let x = 0; x < W; x += 256) X.drawImage(g, x, y); X.restore(); }
const SMUDGE = (() => { const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
  for (let i = 0; i < 70; i++) { const x = rnd(i) * W, y = rnd(i + 50) * H, r = 60 + rnd(i + 99) * 260; const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(255,255,255,.05)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
  for (let i = 0; i < 40; i++) { g.strokeStyle = 'rgba(255,255,255,.035)'; g.lineWidth = 30 + rnd(i + 7) * 40; g.beginPath(); const x = rnd(i + 3) * W, y = rnd(i + 8) * H; g.moveTo(x, y); g.bezierCurveTo(x + 200, y - 40, x + 400, y + 40, x + 600, y); g.stroke(); }
  return c; })();
const FIBRE = noiseCanvas(7, 256, 40, true);

// ---- transitions ----
function tFade(pb, b, lt, gt) { const d = .35; if (!pb || lt >= d) return drawVis(b, gt); X.save(); X.globalAlpha = 1 - lt / d; drawVis(pb, b.t0 - .001); X.restore(); X.save(); X.globalAlpha = lt / d; drawVis(b, gt); X.restore(); }
function tPan(pb, b, lt, gt) { const d = .7; if (!pb || lt >= d) return drawVis(b, gt); const e = eio(lt / d);
  X.save(); X.translate(-W * e, 0); drawVis(pb, b.t0 - .001); X.restore(); X.save(); X.translate(W * (1 - e), 0); drawVis(b, gt); X.restore(); }
function tSlap(pb, b, lt, gt) { const d = .32; if (!pb || lt >= d) return drawVis(b, gt); const e = eo(lt / d);
  X.save(); X.globalAlpha = 1 - e; drawVis(pb, b.t0 - .001); X.restore();
  X.save(); X.translate(W / 2, H / 2); X.rotate(.07 * (1 - e)); const s = 1.25 - .25 * e; X.scale(s, s); X.translate(-W / 2, -H / 2); X.globalAlpha = e; drawVis(b, gt); X.restore(); }
function tCut(pb, b, lt, gt) { const s = 1 + .05 * (1 - eo(lt / .22)); X.save(); X.translate(W / 2, H / 2); X.scale(s, s); X.translate(-W / 2, -H / 2); drawVis(b, gt); X.restore(); }
function tWipe(pb, b, lt, gt) { const d = .6; if (!pb || lt >= d) return drawVis(b, gt); const e = eio(lt / d); const ex = -200 + (W + 400) * e;
  X.save(); X.beginPath(); X.rect(ex, 0, W, H); X.clip(); drawVis(pb, b.t0 - .001); X.restore();
  X.save(); X.beginPath(); X.rect(0, 0, ex, H); X.clip(); drawVis(b, gt); X.restore();
  X.save(); const g = X.createLinearGradient(ex - 160, 0, ex + 40, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(255,255,255,.22)'); X.fillStyle = g; X.fillRect(ex - 160, 0, 200, H); X.restore(); }
const TMP = document.createElement('canvas'); TMP.width = W; TMP.height = H; const TX = TMP.getContext('2d');
function tGlitch(pb, b, lt, gt) { drawVis(b, gt); }
function glitchPost(lt, first) { if (first || lt > .28) return; const k = 1 - lt / .28; TX.clearRect(0, 0, W, H); TX.drawImage(cv, 0, 0);
  for (let i = 0; i < 14; i++) { const y = Math.floor(rnd(i + Math.floor(lt * 60) * 31) * H), h = 10 + rnd(i * 7 + 3) * 70, dx = (rnd(i * 13 + Math.floor(lt * 60)) - .5) * 160 * k; X.drawImage(TMP, 0, y, W, h, dx, y, W, h); }
  X.save(); X.globalCompositeOperation = 'lighter'; X.globalAlpha = .35 * k; X.drawImage(TMP, 14 * k, 0); X.globalAlpha = .25 * k; X.drawImage(TMP, -14 * k, 0); X.restore(); }

// ---- storybook world ----
function nightAt(t) { const bs = window.SPEC ? window.SPEC.beats : []; let v = 0; for (const b of bs) { if (t < b.t0) break; const target = b.night ? 1 : 0; v = v + (target - v) * eio((t - b.t0) / 1.5); } return v; }
function mix(a, b, f) { const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); const A = p(a), B = p(b); return `rgb(${A.map((x, i) => Math.round(x + (B[i] - x) * f)).join(',')})`; }
function inkPath(fill, w = 5) { X.fillStyle = fill; X.fill(); X.lineWidth = w; X.strokeStyle = '#1b1712'; X.lineJoin = 'round'; X.stroke(); }
function townBg(t, nf) {
  const sky = X.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, mix('#53b8ff', '#141c4d', nf)); sky.addColorStop(.7, mix('#bfe8ff', '#3b4fa0', nf)); X.fillStyle = sky; X.fillRect(0, 0, W, H);
  // sun / moon
  X.save(); X.translate(1560, 170); X.beginPath(); X.arc(0, 0, 80, 0, 7); inkPath(mix('#ffd84a', '#f3f0d8', nf), 5); X.restore();
  if (nf > .3) for (let i = 0; i < 40; i++) { X.fillStyle = `rgba(255,255,255,${(nf - .3) * (.5 + .5 * Math.sin(t * 2 + i))})`; X.fillRect(rnd(i) * W, rnd(i + 9) * 420, 3, 3); }
  // clouds
  for (let i = 0; i < 5; i++) { const x = ((rnd(i) * W + t * (8 + i * 3)) % (W + 400)) - 200, y = 90 + rnd(i + 4) * 200; X.save(); X.translate(x, y); X.beginPath(); X.arc(0, 0, 40, Math.PI, 0); X.arc(50, -20, 55, Math.PI, 0); X.arc(110, 0, 40, Math.PI, 0); X.closePath(); inkPath(mix('#ffffff', '#5b6aa8', nf), 4); X.restore(); }
  const pan = t * 14;
  // far hills
  X.beginPath(); X.moveTo(0, H); for (let x = 0; x <= W; x += 20) X.lineTo(x, 640 - 70 * Math.sin((x + pan * .3) / 260) - 40 * Math.sin((x + pan * .3) / 97)); X.lineTo(W, H); X.closePath(); inkPath(mix('#79c95a', '#2c5560', nf), 5);
  // houses
  for (let i = -1; i < 12; i++) { const x = ((i * 190 - pan * .6) % (W + 380) + W + 380) % (W + 380) - 190, hgt = 150 + rnd(i * 3 + 11) * 120, w = 140, base = 860;
    const wall = ['#ff7a59', '#ffd166', '#06d6a0', '#ef476f', '#8ecae6', '#f4a261'][(i + 60) % 6];
    X.beginPath(); X.rect(x, base - hgt, w, hgt); inkPath(mix(wall, '#2a3570', nf * .7), 5);
    X.beginPath(); X.moveTo(x - 14, base - hgt); X.lineTo(x + w / 2, base - hgt - 80); X.lineTo(x + w + 14, base - hgt); X.closePath(); inkPath(mix('#b5523b', '#3a2e5a', nf * .7), 5);
    for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) { X.beginPath(); X.rect(x + 22 + c * 58, base - hgt + 28 + r * 62, 36, 40); inkPath(nf > .4 ? '#ffd76a' : mix('#d6f1ff', '#ffd76a', nf), 3); } }
  // ground
  X.beginPath(); X.rect(-10, 850, W + 20, 260); inkPath(mix('#57b347', '#234a3c', nf), 5);
  X.beginPath(); X.moveTo(0, 930); X.bezierCurveTo(600, 900, 1200, 980, W, 930); X.lineTo(W, 1000); X.bezierCurveTo(1200, 1050, 600, 970, 0, 1000); X.closePath(); inkPath(mix('#e9c98f', '#5d5a7a', nf), 4);
}
function bean(x, y, o, t) { // simple 2D cartoon person, feet at (x,y)
  const s = o.size || 1.3, bob = Math.sin(t * 6 + x) * 3; X.save(); X.translate(x, y); X.scale(s, s);
  X.fillStyle = 'rgba(0,0,0,.25)'; X.beginPath(); X.ellipse(0, 0, 60, 14, 0, 0, 7); X.fill();
  X.lineCap = 'round'; X.strokeStyle = '#1b1712'; X.lineWidth = 9; X.beginPath(); X.moveTo(-18, -70); X.lineTo(-22, 0); X.moveTo(18, -70); X.lineTo(22, 0); X.stroke();
  X.translate(0, bob); X.beginPath(); rr(-50, -200, 100, 140, 40); inkPath(o.shirt || '#4361ee', 5);
  const wave = o.mood === 'shock' ? -1.2 : Math.sin(t * 3) * .3; X.lineWidth = 9; X.beginPath(); X.moveTo(-45, -170); X.lineTo(-85, -120 + wave * 40); X.moveTo(45, -170); X.lineTo(85, -120 - wave * 40); X.stroke();
  X.beginPath(); X.ellipse(0, -262, 58, 64, 0, 0, 7); inkPath(o.skin || '#f1c27d', 5);
  X.fillStyle = '#1b1712'; const ey = -270; if (o.mood === 'shock') { X.beginPath(); X.arc(-20, ey, 9, 0, 7); X.arc(20, ey, 9, 0, 7); X.fill(); X.beginPath(); X.ellipse(0, -232, 12, 16, 0, 0, 7); X.fill(); }
  else { X.beginPath(); X.arc(-20, ey, 6, 0, 7); X.arc(20, ey, 6, 0, 7); X.fill(); X.lineWidth = 5; X.beginPath(); if (o.mood === 'sad') X.arc(0, -222, 18, Math.PI * 1.15, Math.PI * 1.85); else X.arc(0, -245, 20, .2, Math.PI - .2); X.stroke(); }
  if (o.hat) emo(o.hat, 0, -335, 90);
  if (o.prop) emo(o.prop, 92, -120, 80, 1, Math.sin(t * 2) * .1);
  X.restore();
}
S.story = (v, lt, d) => { // cartoon characters with speech bubbles (storybook style)
  const cs = v.cast || [{}]; const n = cs.length;
  if (v.title) { X.save(); X.globalAlpha = eo(lt / .4); X.beginPath(); X.font = F(700, 64); const w = X.measureText(v.title).width; rr(W / 2 - w / 2 - 40, 70, w + 80, 110, 30); inkPath('#fff8e6', 5); txt(v.title, W / 2, 125, F(700, 64), '#1b1712'); X.restore(); }
  cs.forEach((c, i) => { const x = n === 1 ? W / 2 : 420 + (W - 840) * i / (n - 1); const p = back((lt - i * .25) / .5); X.save(); X.globalAlpha = cl(p); bean(x, 900 + (1 - cl(p)) * 60, c, lt); X.restore();
    if (c.say) { const bp = back((lt - .4 - i * .35) / .4); if (bp <= 0) return; const lines = wrap(c.say, 460, F(700, 40)); const bw = 520, bh = 60 + lines.length * 50, bx = x - bw / 2, by = 900 - 380 * (c.size || 1.3) - bh - 30;
      X.save(); X.translate(x, by + bh); X.scale(bp, bp); X.translate(-x, -(by + bh)); X.beginPath(); rr(bx, by, bw, bh, 34); X.moveTo(x - 20, by + bh); X.lineTo(x, by + bh + 34); X.lineTo(x + 20, by + bh); inkPath('#ffffff', 5);
      lines.forEach((l, j) => txt(l, x, by + 52 + j * 50, F(700, 40), '#1b1712')); X.restore(); } });
};


// ---- estate agency world (stick figures) ----
function stickman(x, y, o, t, walking) { // feet at (x,y)
  const s = o.size || 1.5; X.save(); X.translate(x, y); X.scale(o.flip ? -s : s, s);
  X.fillStyle = 'rgba(0,0,0,.18)'; X.beginPath(); X.ellipse(0, 0, 46, 10, 0, 0, 7); X.fill();
  const ph = walking ? Math.sin(t * 9) : 0, ink = '#1b1712'; X.lineCap = 'round'; X.lineJoin = 'round'; X.strokeStyle = ink; X.lineWidth = 8;
  const hip = -105, sh = -215;
  // legs
  const legC = o.role === 'agent' ? (o.suit || '#2b2f3a') : (o.trousers || '#34495e');
  X.strokeStyle = legC; X.lineWidth = o.role === 'agent' ? 16 : 10;
  X.beginPath(); X.moveTo(0, hip); X.lineTo(-14 + ph * 26, 0); X.moveTo(0, hip); X.lineTo(14 - ph * 26, 0); X.stroke();
  X.strokeStyle = ink; X.lineWidth = 8; X.beginPath(); X.moveTo(-14 + ph * 26, 0); X.lineTo(-30 + ph * 26, 0); X.moveTo(14 - ph * 26, 0); X.lineTo(-2 - ph * 26, 0); X.stroke();
  // body
  if (o.role === 'agent') { const sc = o.suit || '#2b2f3a';
    X.beginPath(); X.moveTo(-34, sh); X.lineTo(34, sh); X.lineTo(30, hip + 6); X.lineTo(-30, hip + 6); X.closePath(); X.fillStyle = sc; X.fill(); X.lineWidth = 5; X.strokeStyle = ink; X.stroke();
    X.beginPath(); X.moveTo(-12, sh); X.lineTo(0, sh + 44); X.lineTo(12, sh); X.closePath(); X.fillStyle = '#ffffff'; X.fill(); X.stroke();
    X.beginPath(); X.moveTo(-6, sh + 6); X.lineTo(6, sh + 6); X.lineTo(4, sh + 58); X.lineTo(0, sh + 66); X.lineTo(-4, sh + 58); X.closePath(); X.fillStyle = o.tie || '#00a19a'; X.fill(); X.lineWidth = 3; X.stroke();
    X.lineWidth = 5; X.beginPath(); X.moveTo(-12, sh); X.lineTo(-20, sh + 60); X.moveTo(12, sh); X.lineTo(20, sh + 60); X.stroke();
    X.fillStyle = '#e8e2d0'; X.beginPath(); X.arc(0, sh + 78, 3.5, 0, 7); X.arc(0, sh + 96, 3.5, 0, 7); X.fill();
  } else { X.strokeStyle = ink; X.lineWidth = 8; X.beginPath(); X.moveTo(0, sh); X.lineTo(0, hip); X.stroke();
    X.beginPath(); X.moveTo(-26, sh + 4); X.lineTo(26, sh + 4); X.lineTo(20, hip + 30); X.lineTo(-20, hip + 30); X.closePath(); X.fillStyle = o.top || '#ef476f'; X.fill(); X.lineWidth = 5; X.stroke(); }
  // arms
  X.strokeStyle = o.role === 'agent' ? (o.suit || '#2b2f3a') : ink; X.lineWidth = o.role === 'agent' ? 12 : 8;
  const wave = o.wave ? Math.sin(t * 7) * .5 : 0, sw = walking ? ph * .5 : Math.sin(t * 1.6) * .06;
  X.beginPath(); X.moveTo(-28, sh + 8); X.lineTo(-48 - sw * 40, sh + 95); X.stroke();
  if (o.wave) { X.beginPath(); X.moveTo(28, sh + 8); X.lineTo(70 + wave * 20, sh - 40); X.stroke(); }
  else if (o.shake) { X.beginPath(); X.moveTo(28, sh + 8); X.lineTo(80, sh + 70 + Math.sin(t * 10) * 6); X.stroke(); }
  else { X.beginPath(); X.moveTo(28, sh + 8); X.lineTo(48 + sw * 40, sh + 95); X.stroke(); }
  // head
  X.beginPath(); X.arc(0, sh - 48, 44, 0, 7); X.fillStyle = '#ffffff'; X.fill(); X.lineWidth = 7; X.strokeStyle = ink; X.stroke();
  if (o.hair) { X.beginPath(); X.arc(0, sh - 56, 46, Math.PI * 1.05, Math.PI * 1.95); X.lineWidth = 10; X.strokeStyle = o.hair; X.stroke(); }
  X.fillStyle = ink; X.beginPath(); X.arc(12, sh - 54, 5, 0, 7); X.arc(-12, sh - 54, 5, 0, 7); X.fill();
  X.lineWidth = 4; X.beginPath(); X.arc(0, sh - 40, 15, .25, Math.PI - .25); X.stroke();
  X.restore();
  if (o.prop) emo(o.prop, x + (o.flip ? -1 : 1) * 80 * s, y - 110 * s, 64 * s / 1.5);
}
function agencySign(x, y, w, h, nf) { X.beginPath(); rr(x, y, w, h, 14); inkPath('#ffffff', 5); txt('YOUR MOVE', x + w / 2, y + h * .42, F(700, h * .42, 'Poppins'), '#1b1712'); txt('Kettering', x + w / 2, y + h * .8, F(500, h * .2, 'Poppins'), '#00a19a'); }
function streetBg(t, doorOpen) {
  const sky = X.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#7cc8ff'); sky.addColorStop(.7, '#d9f0ff'); X.fillStyle = sky; X.fillRect(0, 0, W, H);
  for (let i = 0; i < 4; i++) { const cx = ((rnd(i) * W + t * (10 + i * 4)) % (W + 400)) - 200, cy = 80 + rnd(i + 4) * 120; X.save(); X.translate(cx, cy); X.beginPath(); X.arc(0, 0, 36, Math.PI, 0); X.arc(46, -18, 50, Math.PI, 0); X.arc(100, 0, 36, Math.PI, 0); X.closePath(); inkPath('#ffffff', 4); X.restore(); }
  // neighbouring shops
  [[0, 300, '#f4d6a0'], [1520, 400, '#cfe3d4']].forEach(([x, w, c]) => { X.beginPath(); X.rect(x - 10, 240, w + 20, 640); inkPath(c, 5); for (let r = 0; r < 2; r++) for (let k = 0; k < 2; k++) { X.beginPath(); X.rect(x + 50 + k * (w / 2 - 20), 300 + r * 150, w / 2 - 90, 100); inkPath('#d6f1ff', 4); } });
  // Your Move shop
  X.beginPath(); X.rect(300, 180, 1220, 700); inkPath('#f7f3ea', 6);
  X.beginPath(); X.rect(300, 180, 1220, 150); inkPath('#00a19a', 6); agencySign(660, 200, 500, 110);
  X.beginPath(); X.rect(360, 400, 640, 420); inkPath('#d6f1ff', 6);
  // window cards
  for (let r = 0; r < 2; r++) for (let k = 0; k < 4; k++) { const cx = 390 + k * 150, cy = 430 + r * 190; X.beginPath(); X.rect(cx, cy, 120, 160); inkPath('#ffffff', 3); X.beginPath(); X.rect(cx + 12, cy + 12, 96, 70); inkPath(['#ffd166', '#8ecae6', '#06d6a0', '#f4a261'][(k + r) % 4], 2); emo('🏠', cx + 60, cy + 48, 44); X.fillStyle = '#1b1712'; X.fillRect(cx + 16, cy + 100, 88, 8); X.fillRect(cx + 16, cy + 120, 60, 8); }
  // door
  const dx = 1100, dw = 300; X.beginPath(); X.rect(dx, 400, dw, 480); inkPath('#2b2f3a', 6);
  const op = cl(doorOpen); X.save(); X.beginPath(); X.rect(dx + 10, 410, (dw - 20) * (1 - op * .75), 460); inkPath('#bfe3f5', 5); X.restore();
  if (op > .02) { X.fillStyle = 'rgba(255,236,170,.9)'; X.fillRect(dx + 10 + (dw - 20) * (1 - op * .75) + 4, 412, (dw - 20) * op * .75 - 6, 456); }
  txt('OPEN', dx + dw / 2, 470, F(700, 36, 'Poppins'), '#00a19a');
  // pavement
  X.beginPath(); X.rect(-10, 880, W + 20, 220); inkPath('#d9d4c7', 5); X.strokeStyle = 'rgba(27,23,18,.25)'; X.lineWidth = 3; for (let x = -((t * 0) % 160); x < W; x += 160) { X.beginPath(); X.moveTo(x, 880); X.lineTo(x - 60, H); X.stroke(); }
}
function officeBg(t) {
  X.fillStyle = '#f4efe4'; X.fillRect(0, 0, W, H); X.fillStyle = '#e7dfcf'; X.fillRect(0, 0, W, 90);
  X.fillStyle = '#00a19a'; X.fillRect(0, 600, W, 14);
  agencySign(700, 130, 520, 120);
  // window
  X.beginPath(); X.rect(120, 140, 420, 330); inkPath('#cfeeff', 6); X.strokeStyle = '#1b1712'; X.lineWidth = 5; X.beginPath(); X.moveTo(330, 140); X.lineTo(330, 470); X.moveTo(120, 305); X.lineTo(540, 305); X.stroke();
  // property boards on wall
  for (let k = 0; k < 3; k++) { const bx = 1340 + k * 170, by = 160; X.beginPath(); X.rect(bx, by, 140, 180); inkPath('#ffffff', 4); X.beginPath(); X.rect(bx + 12, by + 12, 116, 80); inkPath(['#ffd166', '#8ecae6', '#06d6a0'][k], 3); emo('🏡', bx + 70, by + 54, 50); X.fillStyle = '#1b1712'; X.fillRect(bx + 18, by + 110, 100, 9); X.fillRect(bx + 18, by + 134, 70, 9); }
  // plant
  X.beginPath(); X.rect(1780, 760, 80, 110); inkPath('#c97b4a', 5); emo('🪴', 1820, 700, 150);
  // floor
  X.beginPath(); X.rect(-10, 870, W + 20, 230); inkPath('#cdb79a', 5);
  // desk
  X.beginPath(); X.rect(1080, 700, 560, 40); inkPath('#a47148', 5); X.beginPath(); X.rect(1100, 740, 30, 135); inkPath('#7a5233', 4); X.beginPath(); X.rect(1590, 740, 30, 135); inkPath('#7a5233', 4);
  emo('💻', 1360, 660, 90); emo('☕', 1540, 672, 56);
}
S.stick = (v, lt, d) => { // stick-figure scene: setting street/office/town, cast walk in & talk
  const setting = v.setting || 'office';
  const cs = v.cast || [];
  if (setting === 'street') { const door = cs.some(c => c.enter) ? cl((lt - (d * .55)) / .8) : 0; streetBg(lt, door); }
  else if (setting === 'town') townBg(lt, 0); else officeBg(lt);
  if (v.title) { X.save(); X.globalAlpha = eo(lt / .4); X.font = F(700, 60); const w = X.measureText(v.title).width; X.beginPath(); rr(W / 2 - w / 2 - 40, setting === 'office' ? 290 : 30, w + 80, 100, 30); inkPath('#fff8e6', 5); txt(v.title, W / 2, (setting === 'office' ? 290 : 30) + 52, F(700, 60), '#1b1712'); X.restore(); }
  cs.forEach((c, i) => {
    let x = c.x != null ? c.x : 400 + i * 500, walking = false;
    if (c.from != null) { const wd = c.walkTime || Math.min(2.6, d * .5); const p = cl((lt - (c.delay || 0)) / wd); x = c.from + (x - c.from) * eio(p); walking = p > 0 && p < 1; }
    let alpha = 1; if (c.enter) alpha = 1 - cl((lt - d * .55 - .6) / .6);
    X.save(); X.globalAlpha = alpha; stickman(x, c.y || 880, c, lt + i, walking); X.restore();
    if (c.say && alpha > .5) { const st = (c.sayAt != null ? c.sayAt : (c.from != null ? (c.walkTime || Math.min(2.6, d * .5)) + (c.delay || 0) : .4 + i * .5)); const bp = back((lt - st) / .4); if (bp <= 0) return;
      const lines = wrap(c.say, 440, F(700, 38)); const bw = 500, bh = 56 + lines.length * 48; const s = c.size || 1.5; let bx = x - bw / 2; bx = cl(bx, 30, W - bw - 30); const by = (c.y || 880) - 330 * s - bh;
      X.save(); X.translate(x, by + bh); X.scale(bp, bp); X.translate(-x, -(by + bh)); X.beginPath(); rr(bx, by, bw, bh, 30); X.moveTo(x - 18, by + bh); X.lineTo(x, by + bh + 30); X.lineTo(x + 18, by + bh); inkPath('#ffffff', 5);
      lines.forEach((l, j) => txt(l, bx + bw / 2, by + 50 + j * 48, F(700, 38), '#1b1712')); X.restore(); } });
};
S.warning = (v, lt) => { const p = eo(lt / .5); X.save(); X.globalAlpha = p; X.beginPath(); rr(200, 300, W - 400, 480, 30); inkPath('#ffffff', 6);
  txt(v.title || 'Important', W / 2, 380, F(700, 52), '#e4572e'); wrap(v.text, W - 560, F(700, 50)).forEach((l, i) => txt(l, W / 2, 480 + i * 66, F(700, 50), '#1b1712'));
  if (v.small) wrap(v.small, W - 560, F(500, 30)).forEach((l, i) => txt(l, W / 2, 690 + i * 40, F(500, 30), '#5b5347')); X.restore(); };
S.endcard = (v, lt) => { const p = eo(lt / .6); X.save(); X.globalAlpha = p; agencySign(W / 2 - 360, 170, 720, 170);
  txt(v.text || 'Search "Your Move" and contact your closest branch', W / 2, 480, F(700, 64), '#1b1712');
  if (v.sub) txt(v.sub, W / 2, 570, F(600, 46), '#00a19a');
  if (v.small) wrap(v.small, 1500, F(500, 30)).forEach((l, i) => txt(l, W / 2, 680 + i * 42, F(500, 30), '#5b5347'));
  X.restore(); stickman(330, 960, { role: 'agent', wave: 1, tie: '#00a19a', size: 1.2 }, lt); stickman(1590, 960, { role: 'agent', suit: '#3d3a4b', tie: '#e4572e', wave: 1, hair: '#6b3e26', flip: 1, size: 1.2 }, lt + 1); };

// ---- themes ----
const THEMES = {
  ledger: { label: 'Ledger (dark motion graphics)', C: {}, head: 'Poppins', body: 'Poppins', serif: 'Lora', num: 'Poppins', glow: 1,
    bg: (t, a) => background(t, a), trans: tFade, post: () => vignette(), cap: {} },
  documentary: { label: 'Archive documentary (film grain, serif, camera pans)',
    C: { bg0: '#0d0a07', bg1: '#2a2219', gold: '#e8b86a', red: '#d9534f', teal: '#9cc5b0', white: '#f3e9d6', mute: '#a8977c', panel: 'rgba(243,233,214,.07)', line: 'rgba(243,233,214,.22)', dim: '#5c5040', dots: 'rgba(232,184,106,.22)' },
    head: 'Playfair Display', body: 'Inter', serif: 'Playfair Display', num: 'Playfair Display', glow: .4, bar: false,
    bg: (t, a) => { const g = X.createRadialGradient(W * .45 + Math.sin(t * .1) * 200, H * .4, 50, W * .5, H * .5, W * .8); g.addColorStop(0, C.bg1); g.addColorStop(1, C.bg0); X.fillStyle = g; X.fillRect(0, 0, W, H);
      const lk = X.createRadialGradient(W * (.2 + .6 * (.5 + .5 * Math.sin(t * .07))), 0, 0, W * .5, 0, 900); lk.addColorStop(0, 'rgba(255,170,90,.10)'); lk.addColorStop(1, 'rgba(255,170,90,0)'); X.fillStyle = lk; X.fillRect(0, 0, W, H);
      for (let i = 0; i < 30; i++) { const x = (rnd(i) * W + t * 6 * (rnd(i + 2) - .5) * 10) % W, y = (rnd(i + 5) * H + t * 4) % H; X.fillStyle = `rgba(243,233,214,${.08 + .1 * rnd(i + Math.floor(t * 8))})`; X.fillRect(x, y, 2, 2); } },
    trans: tPan, post: (t) => { vignette(); grain(t, .55); X.fillStyle = '#000'; X.fillRect(0, 0, W, 64); X.fillRect(0, H - 64, W, 64); },
    cap: { bg: 'rgba(0,0,0,0)', fg: '#f3e9d6', hl: '#f3e9d6', font: 'Inter', size: 40 }, thumbFont: 'Playfair Display', thumbPost: () => { vignette(); grain(1, .5); } },
  collage: { label: 'Paper collage (cut-outs, red marker, slap transitions)',
    C: { bg0: '#efe6d2', bg1: '#efe6d2', gold: '#e63946', red: '#e63946', teal: '#1d6f8a', white: '#1d1a16', mute: '#6b6152', ink: '#1d1a16', panel: 'rgba(29,26,22,.07)', line: 'rgba(29,26,22,.25)', dim: '#b9ad97', dots: 'rgba(29,26,22,.18)' },
    head: 'Archivo Black', body: 'Inter', serif: 'Playfair Display', num: 'Archivo Black', glow: 0, scale: { 'Archivo Black': .9 },
    bg: (t) => { X.fillStyle = '#efe6d2'; X.fillRect(0, 0, W, H); X.save(); X.globalAlpha = .5; for (let y = 0; y < H; y += 256) for (let x = 0; x < W; x += 256) X.drawImage(FIBRE, x, y); X.restore();
      const torn = (x0, y0, w, h, c, sd) => { X.beginPath(); X.moveTo(x0, y0); for (let i = 0; i <= 20; i++) X.lineTo(x0 + w * i / 20, y0 + (rnd(sd + i) - .5) * 18); for (let i = 0; i <= 12; i++) X.lineTo(x0 + w + (rnd(sd + 40 + i) - .5) * 18, y0 + h * i / 12); X.lineTo(x0, y0 + h); X.closePath(); X.fillStyle = c; X.fill(); };
      torn(-40, -30, 520, 210, '#e3d4b4', 3); torn(1500, 860, 520, 260, '#dccaa6', 9); X.fillStyle = 'rgba(29,26,22,.08)'; for (let y = 40; y < 300; y += 22) for (let x = 1640; x < W; x += 22) { X.beginPath(); X.arc(x, y, 5 * (1 - (y - 40) / 300), 0, 7); X.fill(); } },
    trans: tSlap, post: () => { const v = X.createRadialGradient(W / 2, H / 2, H * .5, W / 2, H / 2, W * .75); v.addColorStop(0, 'rgba(60,40,10,0)'); v.addColorStop(1, 'rgba(60,40,10,.25)'); X.fillStyle = v; X.fillRect(0, 0, W, H); },
    cap: { bg: '#1d1a16', fg: '#efe6d2', hl: '#ffcf33', font: 'Inter', r: 4 }, bar: '#e63946', thumbStroke: '#efe6d2', thumbFg: '#1d1a16', thumbPost: () => {} },
  chalk: { label: 'Blackboard (chalk handwriting, eraser wipes)',
    C: { bg0: '#16291f', bg1: '#20392c', gold: '#ffe066', red: '#ff8fa3', teal: '#8ee3ef', white: '#f1f5ef', mute: '#b8c7bd', panel: 'rgba(241,245,239,.06)', line: 'rgba(241,245,239,.3)', dim: '#4d6b5a', dots: 'rgba(241,245,239,.18)' },
    head: 'Caveat', body: 'Caveat', serif: 'Caveat', num: 'Caveat', glow: 0, scale: { Caveat: 1.25 },
    bg: (t) => { const g = X.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, W * .7); g.addColorStop(0, C.bg1); g.addColorStop(1, C.bg0); X.fillStyle = g; X.fillRect(0, 0, W, H); X.drawImage(SMUDGE, 0, 0); },
    trans: tWipe, post: () => { X.save(); X.lineWidth = 34; X.strokeStyle = '#6e4a2a'; X.strokeRect(17, 17, W - 34, H - 34); X.lineWidth = 6; X.strokeStyle = '#4a3019'; X.strokeRect(34, 34, W - 68, H - 68); X.restore(); },
    cap: { bg: 'rgba(0,0,0,0)', fg: '#f1f5ef', hl: '#ffe066', font: 'Caveat', size: 56 }, bar: false, thumbStroke: '#16291f' },
  neon: { label: 'Synthwave neon (glow, grid floor, glitch cuts)',
    C: { bg0: '#07021a', bg1: '#1a0638', gold: '#ffd23f', red: '#ff2e88', teal: '#22e4ff', white: '#f5f0ff', mute: '#a99bd1', panel: 'rgba(10,4,30,.55)', line: 'rgba(34,228,255,.25)', dim: '#3c2a63', dots: 'rgba(255,46,136,.25)' },
    head: 'Orbitron', body: 'Inter', serif: 'Orbitron', num: 'Orbitron', glow: 1.4, scale: { Orbitron: .85 },
    bg: (t) => { const g = X.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#07021a'); g.addColorStop(.58, '#2a0a4f'); g.addColorStop(.6, '#07021a'); g.addColorStop(1, '#07021a'); X.fillStyle = g; X.fillRect(0, 0, W, H);
      for (let i = 0; i < 60; i++) { X.fillStyle = `rgba(255,255,255,${.2 + .3 * rnd(i + Math.floor(t * 3))})`; X.fillRect(rnd(i) * W, rnd(i + 3) * 560, 2, 2); }
      X.save(); X.globalAlpha = .45; const sg = X.createLinearGradient(0, 300, 0, 650); sg.addColorStop(0, '#ffd23f'); sg.addColorStop(1, '#ff2e88'); X.fillStyle = sg; X.beginPath(); X.arc(W / 2, 640, 300, Math.PI, 0); X.fill();
      X.fillStyle = '#07021a'; for (let k = 0; k < 6; k++) X.fillRect(W / 2 - 320, 470 + k * 30, 640, 4 + k * 3); X.restore();
      X.save(); X.strokeStyle = '#ff2e88'; X.globalAlpha = .55; X.lineWidth = 2; X.shadowColor = '#ff2e88'; X.shadowBlur = 12; const hz = 648;
      for (let k = 0; k < 14; k++) { const f = ((k + (t * .8) % 1) / 14); const y = hz + Math.pow(f, 2.2) * (H - hz); X.beginPath(); X.moveTo(0, y); X.lineTo(W, y); X.stroke(); }
      for (let k = -14; k <= 14; k++) { X.beginPath(); X.moveTo(W / 2 + k * 30, hz); X.lineTo(W / 2 + k * 260, H); X.stroke(); } X.restore();
      const sc = X.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, 900); sc.addColorStop(0, 'rgba(7,2,26,.55)'); sc.addColorStop(1, 'rgba(7,2,26,0)'); X.fillStyle = sc; X.fillRect(0, 0, W, H); },
    trans: tGlitch, post: (t, i, lt, first) => { glitchPost(lt, first); vignette(); X.save(); X.globalAlpha = .06; X.fillStyle = '#000'; for (let y = 0; y < H; y += 4) X.fillRect(0, y, W, 2); X.restore(); },
    cap: { bg: 'rgba(7,2,26,.75)', fg: '#f5f0ff', hl: '#22e4ff', font: 'Inter' }, bar: '#ff2e88' },
  bold: { label: 'Bold minimal (giant type, hard cuts, red accents)',
    C: { bg0: '#f2efe8', bg1: '#f2efe8', gold: '#e10600', red: '#e10600', teal: '#111111', white: '#111111', mute: '#666058', ink: '#111111', panel: 'rgba(17,17,17,.06)', line: 'rgba(17,17,17,.2)', dim: '#c9c3b8', dots: 'rgba(17,17,17,.16)' },
    head: 'Bebas Neue', body: 'Inter', serif: 'Bebas Neue', num: 'Bebas Neue', glow: 0, upper: true, scale: { 'Bebas Neue': 1.3 },
    bg: (t, a, i) => { X.fillStyle = '#f2efe8'; X.fillRect(0, 0, W, H); X.strokeStyle = 'rgba(17,17,17,.06)'; X.lineWidth = 1; for (let x = 0; x < W; x += 120) { X.beginPath(); X.moveTo(x, 0); X.lineTo(x, H); X.stroke(); } for (let y = 0; y < H; y += 120) { X.beginPath(); X.moveTo(0, y); X.lineTo(W, y); X.stroke(); }
      X.save(); X.globalAlpha = .05; X.font = '640px "Bebas Neue"'; X.fillStyle = '#111'; X.textAlign = 'right'; X.fillText(String((i || 0) + 1).padStart(2, '0'), W - 40, H + 60); X.restore(); X.fillStyle = '#e10600'; X.fillRect(0, 0, 22, H); },
    trans: tCut, post: () => {}, cap: { bg: '#111111', fg: '#f2efe8', hl: '#ff3b30', font: 'Inter', r: 0, upper: true }, bar: '#e10600', thumbStroke: '#f2efe8', thumbFg: '#111111', thumbPost: () => {} },
  storybook: { label: 'Cartoon town (2D characters in a painted world, day-to-night lighting)',
    C: { bg0: '#53b8ff', bg1: '#bfe8ff', gold: '#ff8c00', red: '#e63946', teal: '#118ab2', white: '#1b1712', mute: '#5b5347', ink: '#1b1712', panel: 'rgba(27,23,18,.06)', line: 'rgba(27,23,18,.25)', dim: '#c7bba3', dots: 'rgba(27,23,18,.18)' },
    head: 'Fredoka', body: 'Fredoka', serif: 'Fredoka', num: 'Fredoka', glow: 0,
    bg: (t, a, i, thumb) => townBg(thumb ? 0 : t, thumb ? 0 : nightAt(t)),
    stage: () => {}, trans: (pb, b, lt, gt) => { const panel = b.vis.type !== 'story';
      const draw = (bb, tt) => { if (bb.vis.type === 'story') return drawVis(bb, tt); X.save(); X.beginPath(); rr(90, 36, 1740, 800, 40); inkPath('rgba(255,248,230,.96)', 6); X.translate(W / 2, 436); X.scale(.8, .8); X.translate(-W / 2, -H / 2); drawVis(bb, tt); X.restore(); };
      const d = .7; if (!pb || lt >= d) return draw(b, gt); const e = eio(lt / d); X.save(); X.translate(0, -H * e); draw(pb, b.t0 - .001); X.restore(); X.save(); X.translate(0, H * (1 - e)); draw(b, gt); X.restore(); },
    post: () => {}, cap: { bg: 'rgba(27,23,18,.82)', fg: '#fff8e6', hl: '#ffd166', font: 'Fredoka' }, bar: '#ff8c00', thumbStroke: '#1b1712', thumbFg: '#fff8e6', thumbPost: () => {} },
  agency: { label: 'Estate agency ad (stick figures, shopfront and office, warm and friendly)',
    C: { bg0: '#f4efe4', bg1: '#f4efe4', gold: '#00a19a', red: '#e4572e', teal: '#1f6f8b', white: '#1b1712', mute: '#5b5347', ink: '#1b1712', panel: 'rgba(27,23,18,.06)', line: 'rgba(27,23,18,.25)', dim: '#c7bba3', dots: 'rgba(27,23,18,.18)' },
    head: 'Poppins', body: 'Poppins', serif: 'Poppins', num: 'Poppins', glow: 0,
    bg: (t) => { X.fillStyle = '#e9f5f3'; X.fillRect(0, 0, W, H); X.fillStyle = 'rgba(0,161,154,.08)'; for (let i = 0; i < 18; i++) emo('🏠', rnd(i) * W, (rnd(i + 3) * H + t * 10) % H, 60, .25); },
    stage: () => {}, trans: (pb, b, lt, gt) => { const full = v => ['stick', 'endcard'].includes(v.vis.type);
      const draw = (bb, tt) => { if (full(bb)) { if (bb.vis.type === 'endcard') { X.fillStyle = '#e9f5f3'; X.fillRect(0, 0, W, H); } return drawVis(bb, tt); } X.save(); X.beginPath(); rr(90, 36, 1740, 800, 40); inkPath('rgba(255,255,255,.97)', 6); X.translate(W / 2, 436); X.scale(.8, .8); X.translate(-W / 2, -H / 2); drawVis(bb, tt); X.restore(); };
      const dd = .6; if (!pb || lt >= dd) return draw(b, gt); const e = eio(lt / dd); X.save(); X.translate(-W * e, 0); draw(pb, b.t0 - .001); X.restore(); X.save(); X.translate(W * (1 - e), 0); draw(b, gt); X.restore(); },
    post: () => {}, cap: { bg: 'rgba(27,23,18,.82)', fg: '#ffffff', hl: '#7ee0d8', font: 'Poppins' }, bar: '#00a19a', thumbStroke: '#1b1712', thumbFg: '#ffffff', thumbPost: () => {} },
};
const VARIANTS = {
  ledger: [{}, { gold: '#ffb86b', teal: '#7aa2ff', red: '#ff6b9a' }, { gold: '#c3f73a', teal: '#3ad1f7', red: '#ff7849' }],
  neon: [{}, { teal: '#39ff88', red: '#ff9f1c' }, { teal: '#b388ff', red: '#ff2e2e', gold: '#00f5d4' }],
  chalk: [{}, { gold: '#ffb3c6', teal: '#ffe066' }, { gold: '#a0e7a0', teal: '#ffd6a5' }],
  collage: [{}, { gold: '#1d4ed8', red: '#1d4ed8' }, { gold: '#2d6a4f', red: '#d00000' }],
  bold: [{}, { gold: '#0047ff', red: '#0047ff' }, { gold: '#ff6a00', red: '#ff6a00' }],
};
const TRANS = { fade: tFade, pan: tPan, slap: tSlap, cut: tCut, wipe: tWipe, glitch: tGlitch };
function setTheme(name, variant, trans) { T = Object.assign({}, THEMES[name] || THEMES.ledger); Object.assign(C, C0, T.C || {});
  const vs = VARIANTS[name]; if (vs && variant) Object.assign(C, vs[variant % vs.length]); if (trans && TRANS[trans] && name !== 'storybook') T.trans = TRANS[trans];
  if (vs && variant && T.bar) T.bar = C.red; }
window.STYLES = Object.fromEntries(Object.entries(THEMES).map(([k, v]) => [k, v.label]));
