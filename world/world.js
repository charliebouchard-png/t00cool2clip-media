// 3D presenter ("Bob") explaining money stories in front of real places.
import * as THREE from 'three';

const W = 1080, H = 1920;
const out = document.getElementById('out');
const ctx = out.getContext('2d');

// ---------- renderer ----------
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(W, H, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.setClearColor(0x000000, 0);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, W / H, 0.05, 100);

scene.add(new THREE.HemisphereLight(0xdfeeff, 0x6b5a48, 1.1));
const key = new THREE.DirectionalLight(0xfff1e0, 2.3); key.position.set(-2, 3.5, 4); scene.add(key);
const fill = new THREE.DirectionalLight(0xcfe0ff, 0.6); fill.position.set(3, 1.5, 2); scene.add(fill);
const rim = new THREE.DirectionalLight(0xffffff, 1.6); rim.position.set(1.5, 2.5, -3); scene.add(rim);

// ---------- materials ----------
const M = (c, r = .7, extra = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: r, ...extra });
const skin = new THREE.MeshPhysicalMaterial({ color: 0xe9b08c, roughness: .5, sheen: .4, sheenColor: 0xff9a80, clearcoat: .05 });
const hoodie = M(0xf3b52f, .85), hoodieDark = M(0xd99a1c, .9);
const jeans = M(0x2e4366, .8), shoeM = M(0xf4f4f4, .5), soleM = M(0x333333, .6);
const hairM = M(0x4a2a18, .6), browM = M(0x3a2010, .7);
const whiteM = M(0xffffff, .2), irisM = M(0x5b3a1e, .3), pupilM = M(0x0a0a0a, .2);
const mouthM = M(0x5a1418, .6), teethM = M(0xfafafa, .3), tongueM = M(0xd0585c, .6), lipM = M(0xc77b6a, .5);

const geo = {
  sph: (r, ws = 32, hs = 24) => new THREE.SphereGeometry(r, ws, hs),
  cap: (r, l) => new THREE.CapsuleGeometry(r, l, 8, 20),
};
function mesh(g, m, p = [0, 0, 0], s = [1, 1, 1], r = [0, 0, 0]) {
  const o = new THREE.Mesh(g, m); o.position.set(...p); o.scale.set(...s); o.rotation.set(...r); return o;
}
const G = (p = [0, 0, 0]) => { const g = new THREE.Group(); g.position.set(...p); return g; };

// ---------- character ----------
const man = G(); scene.add(man);
const hips = G([0, .8, 0]); man.add(hips);
const torso = G([0, 0, 0]); hips.add(torso);
{ const pts = [[0, -.04], [.19, -.03], [.205, .04], [.2, .2], [.215, .36], [.2, .45], [.15, .52], [.08, .56], [0, .57]].map(([r, y]) => new THREE.Vector2(r, y));
  torso.add(mesh(new THREE.LatheGeometry(pts, 40), hoodie, [0, 0, 0], [1, 1, .7])); }
torso.add(mesh(new THREE.TorusGeometry(.19, .03, 12, 40), hoodieDark, [0, -.025, 0], [1, .7, 1], [Math.PI / 2, 0, 0])); // hem band
torso.add(mesh(new THREE.TorusGeometry(.13, .045, 12, 32), hoodieDark, [0, .5, -.05], [1, 1, 1], [1.35, 0, 0])); // hood
torso.add(mesh(geo.sph(.1), hoodieDark, [0, .1, .1], [1.3, .55, .45]));   // pocket
for (const x of [-.045, .045]) torso.add(mesh(new THREE.CylinderGeometry(.008, .008, .16), M(0xffffff, .6), [x, .4, .135], [1, 1, 1], [.12, 0, 0]));
// chest badge: coin
{
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
  x.fillStyle = '#1d7a46'; x.beginPath(); x.arc(64, 64, 60, 0, 7); x.fill();
  x.fillStyle = '#fff'; x.font = 'bold 84px Fredoka, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('£', 64, 70);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  torso.add(mesh(new THREE.CircleGeometry(.05, 32), new THREE.MeshStandardMaterial({ map: t, roughness: .6 }), [.1, .34, .142], [1, 1, 1], [0, .25, 0]));
  window.__badge = t;
}
const neck = G([0, .5, 0]); torso.add(neck);
neck.add(mesh(new THREE.CylinderGeometry(.075, .085, .14), skin, [0, .04, 0]));
torso.add(mesh(new THREE.TorusGeometry(.1, .042, 14, 36), hoodie, [0, .53, -.005], [1, 1, .85], [Math.PI / 2, 0, 0])); // collar
const head = G([0, .06, 0]); neck.add(head);
const HC = [0, .2, .01];
head.add(mesh(geo.sph(.215, 48, 36), skin, HC, [1, 1.06, .97]));
head.add(mesh(geo.sph(.15), skin, [0, .09, .05], [1.05, .75, .95]));            // jaw/cheeks
for (const s of [-1, 1]) {
  head.add(mesh(geo.sph(.05), skin, [s * .212, .19, 0], [.45, 1, .75]));        // ears
  head.add(mesh(geo.sph(.04), M(0xf09a8a, .6, { transparent: true, opacity: .35 }), [s * .11, .12, .17], [1.2, .7, .4])); // blush
}
head.add(mesh(geo.sph(.034), skin, [0, .155, .215], [1, .9, 1.05]));             // nose
// hair
head.add(mesh(new THREE.SphereGeometry(.226, 48, 24, 0, Math.PI * 2, 0, Math.PI * .45), hairM, [0, .21, -.005], [1.01, 1.05, 1.0], [-.32, 0, 0]));
for (const [x, y, z, r] of [[0, .4, .1, .085], [-.075, .385, .085, .07], [.07, .39, .09, .07], [.02, .42, .02, .09], [-.14, .34, .03, .07], [.14, .34, .03, .07]])
  head.add(mesh(geo.sph(r), hairM, [x, y, z], [1.15, .8, 1]));
// eyes
const eyes = [], lids = [], brows = [];
for (const s of [-1, 1]) {
  const e = G([s * .078, .225, .165]); head.add(e);
  e.add(mesh(geo.sph(.058), whiteM, [0, 0, 0], [1, 1.1, .8]));
  const look = G(); e.add(look);
  look.add(mesh(geo.sph(.034), irisM, [0, 0, .035], [1, 1, .45]));
  look.add(mesh(geo.sph(.019), pupilM, [0, 0, .046], [1, 1, .4]));
  look.add(mesh(geo.sph(.008), whiteM, [-.012, .014, .056]));
  eyes.push(look);
  const lid = mesh(new THREE.SphereGeometry(.062, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), skin, [0, 0, 0], [1, 1.1, .86], [.25, 0, 0]);
  e.add(lid); lids.push(lid);
  const b = G([s * .082, .315, .19]); head.add(b);
  b.add(mesh(geo.cap(.016, .075), browM, [0, 0, 0], [1, 1, .7], [0, 0, Math.PI / 2]));
  b.userData.s = s; brows.push(b);
}
// mouth
const mouth = G([0, .085, .19]); head.add(mouth);
const mouthIn = mesh(geo.sph(.05), mouthM, [0, 0, 0], [1, .2, .35]); mouth.add(mouthIn);
const teeth = mesh(new THREE.BoxGeometry(.06, .016, .02), teethM, [0, .006, .008]); mouth.add(teeth);
const tongue = mesh(geo.sph(.028), tongueM, [0, -.012, .0], [1.1, .4, .6]); mouth.add(tongue);
const lipTop = mesh(geo.cap(.009, .07), lipM, [0, .01, .012], [1, 1, .7], [0, 0, Math.PI / 2]); mouth.add(lipTop);
const lipBot = mesh(geo.cap(.01, .06), lipM, [0, -.01, .012], [1, 1, .7], [0, 0, Math.PI / 2]); mouth.add(lipBot);

// arms
function arm(s) {
  const sh = G([s * .2, .45, 0]); torso.add(sh);
  sh.add(mesh(geo.sph(.068), hoodie, [0, -.02, 0]));
  sh.add(mesh(geo.cap(.064, .2), hoodie, [0, -.15, 0]));
  const el = G([0, -.3, 0]); sh.add(el);
  el.add(mesh(geo.cap(.057, .18), hoodie, [0, -.12, 0]));
  el.add(mesh(new THREE.CylinderGeometry(.06, .062, .04, 20), hoodieDark, [0, -.25, 0]));   // cuff
  const hand = G([0, -.3, 0]); el.add(hand);
  hand.add(mesh(geo.sph(.068), skin, [0, -.025, 0], [.85, 1.05, .55]));
  for (let i = 0; i < 4; i++) hand.add(mesh(geo.cap(.015, .05), skin, [(i - 1.5) * .022, -.085, 0], [1, 1, 1], [0, 0, (i - 1.5) * .06]));
  hand.add(mesh(geo.cap(.016, .045), skin, [s * -.05, -.03, .02], [1, 1, 1], [0, 0, s * .9]));
  return { sh, el, hand, s };
}
const L = arm(-1), R = arm(1);
// legs
function leg(s) {
  const hp = G([s * .11, 0, 0]); hips.add(hp);
  hp.add(mesh(geo.cap(.088, .28), jeans, [0, -.2, 0]));
  const kn = G([0, -.4, 0]); hp.add(kn);
  kn.add(mesh(geo.cap(.085, .26), jeans, [0, -.17, 0]));
  const ft = G([0, -.36, 0]); kn.add(ft);
  ft.add(mesh(geo.sph(.08), shoeM, [0, -.02, .05], [1.05, .62, 1.75]));
  ft.add(mesh(new THREE.BoxGeometry(.15, .025, .27), soleM, [0, -.055, .05]));
  return { hp, kn, ft };
}
const LL = leg(-1), RL = leg(1);
// contact shadow
{
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
  const g = x.createRadialGradient(64, 64, 4, 64, 64, 62); g.addColorStop(0, 'rgba(0,0,0,.55)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  const sh = mesh(new THREE.PlaneGeometry(1.1, .6), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }), [0, .002, .02], [1, 1, 1], [-Math.PI / 2, 0, 0]);
  man.add(sh);
}

// ---------- poses ----------
const lerp = (a, b, k) => a + (b - a) * k;
const ease = k => k <= 0 ? 0 : k >= 1 ? 1 : k * k * (3 - 2 * k);
const POSES = {
  rest:    { L: [.05, .12, 0, -.15], R: [.05, -.12, 0, -.15] },
  open:    { L: [-.55, .45, .2, -1.25], R: [-.55, -.45, -.2, -1.25] },
  point:   { L: [.05, .15, 0, -.25], R: [-.55, -1.0, -.2, -.35] },
  pointL:  { L: [-.55, 1.0, .2, -.35], R: [.05, -.15, 0, -.25] },
  explain: { L: [.05, .15, 0, -.3], R: [-.5, -.25, -.3, -1.55] },
  shrug:   { L: [-.15, .75, .3, -1.5], R: [-.15, -.75, -.3, -1.5] },
  wave:    { L: [.05, .15, 0, -.2], R: [-.1, -2.3, 0, -.6] },
  count:   { L: [-.45, .2, .4, -1.6], R: [-.5, -.2, -.4, -1.6] },
  wow:     { L: [-.3, .9, 0, -1.9], R: [-.3, -.9, 0, -1.9] },
  think:   { L: [-.3, .1, .5, -1.4], R: [-.9, -.2, -.5, -2.3] },
};
function applyPose(a, b, k, t, amp) {
  for (const side of ['L', 'R']) {
    const A = a[side], B = b[side], arm = side === 'L' ? L : R;
    const v = A.map((x, i) => lerp(x, B[i], k));
    const wob = Math.sin(t * 5.2 + (side === 'L' ? 0 : 1.7)) * .06 * amp + Math.sin(t * 1.3 + (side === 'L' ? 2 : 0)) * .03;
    arm.sh.rotation.set(v[0] + wob, 0, -v[1]);
    arm.sh.rotation.y = v[2];
    arm.el.rotation.set(v[3] + wob * 1.5, 0, 0);
    arm.hand.rotation.set(-.2 + wob, 0, arm.s * .1);
  }
}

// ---------- 2D helpers ----------
const IMG = {};
function loadImg(src) {
  return IMG[src] || (IMG[src] = new Promise(r => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = src; }));
}
function rr(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }

let SPEC, SC = [], AMP = [], FPS = 30, DUR = 0;
const SHOTS = {
  wide:   { pos: [0, 1.3, 5.3], look: [0, 1.38, 0], push: .3 },
  medium: { pos: [0, 1.56, 3.15], look: [0, 1.5, 0], push: .2 },
  close:  { pos: [0, 1.6, 2.25], look: [0, 1.57, 0], push: .12 },
};

window.init = async (spec, amp, fps) => {
  SPEC = spec; AMP = amp || []; FPS = fps || 30;
  let t = 0;
  SC = [];
  for (const s of spec.scenes) {
    const img = s.bg ? await loadImg(s.bg) : null;
    const words = s.say.split(/\s+/).filter(Boolean);
    const total = words.reduce((a, w) => a + w.length + 3, 0);
    let acc = 0; const wt = words.map(w => { const st = acc / total; acc += w.length + 3; return { w, st, en: acc / total }; });
    const sc = { ...s, t0: t, t1: t + s.dur, img, wt };
    if (img) buildBackdrop(sc);
    SC.push(sc);
    t += s.dur;
  }
  DUR = t;
  await document.fonts.load('700 100px Fredoka'); await document.fonts.load('40px Emoji');
  return { dur: DUR };
};

function texFrom(img, blur) {
  const c = document.createElement('canvas'); const sc = Math.min(1, 1600 / img.width);
  c.width = Math.round(img.width * sc); c.height = Math.round(img.height * sc);
  const x = c.getContext('2d'); if (blur) x.filter = `blur(${blur}px) saturate(1.1)`; else x.filter = 'saturate(1.08)';
  x.drawImage(img, 0, 0, c.width, c.height);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.repeat.x = -1; t.offset.x = 1; t.anisotropy = 4; return t;
}
const BG_R = 10, BG_H = 16;
function buildBackdrop(sc) {
  const asp = sc.img.width / sc.img.height; const span = Math.min(Math.PI * 1.2, BG_H * asp / BG_R);
  const g = new THREE.CylinderGeometry(BG_R, BG_R, BG_H, 96, 1, true, Math.PI - span / 2, span);
  const sharp = texFrom(sc.img, 0), soft = texFrom(sc.img, 5);
  const m = new THREE.MeshBasicMaterial({ map: sharp, side: THREE.BackSide, toneMapped: false });
  const mesh = new THREE.Mesh(g, m); mesh.position.y = 2.0 - ((sc.fy ?? .45) - .45) * 6; mesh.rotation.y = -((sc.fx ?? .5) - .5) * span;
  mesh.visible = false; scene.add(mesh);
  sc.bg3 = { mesh, sharp, soft, span, yawMax: Math.max(.1, span / 2 - .5) };
}
const ANG = {
  front: { yaw: 0, dy: 0, roll: 0 }, l34: { yaw: -.55, dy: .05, roll: 0 }, r34: { yaw: .55, dy: .05, roll: 0 },
  low: { yaw: .2, dy: -.5, roll: 0 }, high: { yaw: -.25, dy: .6, roll: 0 }, dutchL: { yaw: -.3, dy: 0, roll: .09 }, dutchR: { yaw: .35, dy: -.1, roll: -.08 },
};
const ANG_CYCLE = ['front', 'r34', 'low', 'l34', 'high', 'dutchR', 'front', 'l34', 'dutchL', 'r34'];
const SHOT_NEXT = { wide: ['medium', 'close'], medium: ['close', 'wide'], close: ['medium', 'wide'] };
function shotPlan(sc, idx) {
  if (sc._plan) return sc._plan;
  const n = (sc.gestures || ['explain', 'open']).length; const plan = [];
  let shot = sc.shot || 'medium';
  for (let j = 0; j < n; j++) {
    const c = sc.cams && sc.cams[j];
    if (c) { plan.push({ shot: c[0], ang: c[1] }); shot = c[0]; continue; }
    if (j > 0) shot = SHOT_NEXT[shot][(idx + j) % 2];
    plan.push({ shot, ang: ANG_CYCLE[(idx * 3 + j * 2) % ANG_CYCLE.length] });
  }
  return (sc._plan = plan);
}
function ampAt(t) { if (!AMP.length) return (Math.sin(t * 17) * .5 + .5) * (Math.sin(t * 3.1) > -.3 ? .8 : 0); const i = Math.floor(t * FPS); return AMP[Math.min(AMP.length - 1, Math.max(0, i))] || 0; }

function drawBg(s, lt, shot) {
  const img = s.img; const k = lt / s.dur;
  const zoomIn = lt < .28 ? 1 + (1 - ease(lt / .28)) * .35 : 1;
  const sc = (1.06 + k * .07) * zoomIn;
  if (s.bg3) {
    // backdrop is rendered in 3D; just clear
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  } else if (img) {
    const r = Math.max(W / img.width, H / img.height) * sc;
    const w = img.width * r, h = img.height * r;
    const fx = s.fx ?? .5, fy = s.fy ?? .45;
    const x = -(w - W) * fx + (s.pan || 0) * k * 60, y = -(h - H) * fy;
    ctx.filter = shot === 'close' ? 'blur(6px) saturate(1.1)' : shot === 'medium' ? 'blur(2.5px) saturate(1.1)' : 'saturate(1.08)';
    ctx.drawImage(img, x, y, w, h); ctx.filter = 'none';
  } else {
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#7fb8ff'); g.addColorStop(.6, '#cfe6ff'); g.addColorStop(.61, '#9a9a8c'); g.addColorStop(1, '#6d6d62');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
}
function drawOverlay(lt) {
  const v = ctx.createRadialGradient(W / 2, H * .5, H * .25, W / 2, H * .5, H * .75);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.45)'); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  if (lt < .18) { ctx.fillStyle = `rgba(255,255,255,${(1 - lt / .18) * .7})`; ctx.fillRect(0, 0, W, H); }
}

function drawPlace(s, lt) {
  if (!s.place) return;
  const a = ease(Math.min(1, lt / .35)); ctx.save(); ctx.globalAlpha = a;
  ctx.font = '700 46px Fredoka, Emoji'; const txt = s.place.toUpperCase(); const fl = s.flag || '📍';
  const tw = ctx.measureText(txt).width; ctx.font = '46px Emoji'; const fw = ctx.measureText(fl).width;
  const w = tw + fw + 70, x = (W - w) / 2, y = 150 - (1 - a) * 40;
  ctx.fillStyle = 'rgba(15,20,30,.72)'; rr(x, y, w, 84, 42); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.textBaseline = 'middle'; ctx.fillText(fl, x + 28, y + 44);
  ctx.font = '700 46px Fredoka'; ctx.fillText(txt, x + 42 + fw, y + 45);
  ctx.restore();
}

function drawCard(s, lt) {
  for (const c of (s.cards || [])) {
    const st = (c.at || 0) * s.dur, en = st + (c.hold || 3.2);
    if (lt < st || lt > en) continue;
    const k = lt - st, a = Math.min(1, k / .25, (en - lt) / .25);
    const pop = k < .3 ? 1 + Math.sin(k / .3 * Math.PI) * .12 : 1;
    ctx.save(); ctx.globalAlpha = a; ctx.translate(W / 2, 380); ctx.scale(pop * (.7 + .3 * a), pop * (.7 + .3 * a)); ctx.rotate(-.03);
    ctx.font = '700 128px Fredoka'; const bw = Math.max(ctx.measureText(c.big).width, 300);
    ctx.font = '600 48px Fredoka'; const sw = c.small ? ctx.measureText(c.small).width : 0;
    const w = Math.max(bw, sw) + 100, h = c.small ? 250 : 180;
    ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 12;
    ctx.fillStyle = c.bg || '#ffffff'; rr(-w / 2, -h / 2, w, h, 36); ctx.fill(); ctx.shadowColor = 'transparent';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = c.color || '#16a34a'; ctx.font = '700 128px Fredoka'; ctx.fillText(c.big, 0, c.small ? -30 : 4);
    if (c.small) { ctx.fillStyle = '#334155'; ctx.font = '600 48px Fredoka'; ctx.fillText(c.small, 0, 72); }
    ctx.restore();
  }
}

function drawCaption(s, lt) {
  const sp = s.speech || s.dur; const k = lt / sp; if (k > 1.02) return;
  const cur = s.wt.find(w => k >= w.st && k < w.en) || (k >= 1 ? s.wt[s.wt.length - 1] : null); if (!cur) return;
  const word = cur.w.toUpperCase(); const into = (k - cur.st) * sp;
  const hot = /[0-9£€$%]/.test(word) || (s.hot || []).some(h => word.replace(/[^A-Z0-9£€$%.]/g, '').startsWith(h.toUpperCase()));
  const sc = into < .08 ? .85 + into / .08 * .15 : 1;
  ctx.save(); ctx.translate(W / 2, 1270); ctx.scale(sc, sc);
  let fs = 128; ctx.font = `700 ${fs}px Fredoka`; while (ctx.measureText(word).width > W - 120) { fs -= 6; ctx.font = `700 ${fs}px Fredoka`; }
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  ctx.lineWidth = 22; ctx.strokeStyle = '#000'; ctx.strokeText(word, 0, 0);
  ctx.fillStyle = hot ? '#ffd23f' : '#fff'; ctx.fillText(word, 0, 0);
  ctx.restore();
}

function blinkAt(t) { const p = (t % 3.7); return p < .12 ? Math.sin(p / .12 * Math.PI) : 0; }

window.frame = async (t) => {
  const s = SC.find(x => t >= x.t0 && t < x.t1) || SC[SC.length - 1];
  const lt = t - s.t0, k = lt / s.dur, speaking = lt < (s.speech || s.dur);
  const amp = speaking ? Math.min(1, ampAt(t) * 1.6) : 0;
  const idx = SC.indexOf(s);
  const gsN = (s.gestures || ['explain', 'open']).length, segL = s.dur / gsN, si = Math.min(gsN - 1, Math.floor(lt / segL));
  const plan = shotPlan(s, idx)[si]; const shot = plan.shot, sh = SHOTS[shot], an = ANG[plan.ang] || ANG.front;
  const lts = lt - si * segL, ks = lts / segL;
  // camera: orbit around the presenter with drift + punch-in at each cut
  const ymax = s.bg3 ? s.bg3.yawMax : .3;
  const yaw = Math.max(-ymax, Math.min(ymax, an.yaw + (ks - .5) * .14 * (idx % 2 ? 1 : -1)));
  const dist = (sh.pos[2] - ease(ks) * sh.push) * (1 + .1 * (1 - ease(Math.min(1, lts / .35))));
  const ly = sh.look[1] + (an.dy < 0 ? .08 : an.dy > 0 ? -.05 : 0);
  const shake = .006 * Math.sin(t * 7.1) + .004 * Math.sin(t * 11.3);
  camera.position.set(Math.sin(yaw) * dist + shake, sh.pos[1] + an.dy, Math.cos(yaw) * dist);
  camera.up.set(Math.sin(an.roll), Math.cos(an.roll), 0);
  camera.lookAt(0, ly + shake * .5, 0);
  for (const o of SC) if (o.bg3) o.bg3.mesh.visible = o === s;
  if (s.bg3) { const want = shot === 'wide' ? s.bg3.sharp : s.bg3.soft; if (s.bg3.mesh.material.map !== want) { s.bg3.mesh.material.map = want; s.bg3.mesh.material.needsUpdate = true; } }
  // body
  man.position.set(s.manX || 0, 0, 0);
  man.rotation.y = (s.turn || 0) + yaw * .6 + Math.sin(t * .7) * .05;
  const breath = Math.sin(t * 2.2) * .008;
  hips.position.y = .8 + breath; torso.rotation.z = Math.sin(t * .9) * .015; torso.rotation.x = -.03 + amp * .03;
  // walk in for wide shots
  const walking = shot === 'wide' && si === 0 && lt < 1.1;
  const wk = walking ? (1 - ease(lt / 1.1)) : 0;
  if (walking) { man.position.x += (s.from || -1) * wk * 1.6; man.rotation.y += (s.from || -1) * -wk * 1.2; }
  const ph = t * 9;
  LL.hp.rotation.x = walking ? Math.sin(ph) * .45 * wk : 0; RL.hp.rotation.x = walking ? -Math.sin(ph) * .45 * wk : 0;
  LL.kn.rotation.x = walking ? Math.max(0, -Math.sin(ph)) * .6 * wk : 0; RL.kn.rotation.x = walking ? Math.max(0, Math.sin(ph)) * .6 * wk : 0;
  hips.position.y += walking ? Math.abs(Math.sin(ph)) * .03 * wk : 0;
  // gestures
  const gs = s.gestures || ['explain', 'open'];
  const segLen = s.dur / gs.length; const gi = Math.min(gs.length - 1, Math.floor(lt / segLen));
  const gIn = ease((lt - gi * segLen) / .45);
  const prev = POSES[gi === 0 ? (walking ? 'rest' : 'rest') : gs[gi - 1]] || POSES.rest, cur = POSES[gs[gi]] || POSES.rest;
  applyPose(gi === 0 ? POSES.rest : prev, cur, gi === 0 ? ease(lt / .5) : gIn, t, amp);
  if (gs[gi] === 'wave') R.el.rotation.z = Math.sin(t * 9) * .35;
  else R.el.rotation.z = 0;
  // head
  const nod = Math.sin(t * 6.3) * .05 * amp + Math.sin(t * 1.1) * .03;
  head.rotation.set(nod - .02, Math.sin(t * .8) * .12 + (gs[gi] === 'point' ? -.25 * gIn : gs[gi] === 'pointL' ? .25 * gIn : 0), (gs[gi] === 'shrug' ? .15 * gIn : Math.sin(t * .6) * .04));
  // face
  const open = amp;
  mouthIn.scale.set(1 - open * .15, .14 + open * .62, .35);
  mouthIn.position.y = -open * .012;
  teeth.visible = open > .15; teeth.position.y = .008 + open * .004;
  tongue.position.y = -.012 - open * .016; tongue.visible = open > .3;
  lipTop.position.y = .008 + open * .006; lipBot.position.y = -.01 - open * .034;
  const surprised = ['wow', 'shrug'].includes(gs[gi]) ? gIn : 0;
  for (const b of brows) { b.position.y = .315 + amp * .012 + surprised * .025; b.rotation.z = b.userData.s * (-.12 + surprised * .2 - (gs[gi] === 'think' ? .25 * gIn * b.userData.s : 0)); }
  const bl = blinkAt(t + (s.t0 % 1.3));
  for (const l of lids) { l.rotation.x = lerp(-1.15, .25, Math.max(bl, .0)); }
  const gx = Math.sin(t * .5) * .12, gy = Math.sin(t * .37) * .06;
  for (const e of eyes) e.rotation.set(-gy, gx + (gs[gi] === 'point' ? .35 * gIn : gs[gi] === 'pointL' ? -.35 * gIn : 0), 0);

  // compose
  drawBg(s, lt, shot);
  renderer.render(scene, camera);
  ctx.drawImage(renderer.domElement, 0, 0, W, H);
  drawOverlay(lt);
  drawPlace(s, lt);
  drawCard(s, lt);
  drawCaption(s, lt);
  if (s.end && lt > s.dur - 2.6) {
    const a = ease((lt - (s.dur - 2.6)) / .3); ctx.save(); ctx.globalAlpha = a;
    ctx.fillStyle = '#ff2d55'; rr(W / 2 - 300, 1560, 600, 130, 65); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = '700 64px Fredoka'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(s.end, W / 2, 1627); ctx.restore();
  }
  return out.toDataURL('image/jpeg', .88);
};
window.ready = true;
