// Story video engine: spec + timing -> frames (window.init / window.frame).
import * as THREE from './vendor/three.module.js';
import { R, cl, ease, eio, back } from './util.js';
import { makeAvatar, setFace, pose, hold, LOOKS, randomLook, roundRect } from './avatar.js';
import { SETS, makeSky, makeProp, animProp, FX, SKYCOL, shade } from './world.js';
import * as U from './util.js';

const W = 720, H = 1280;
const gl = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
gl.setSize(W, H); gl.setPixelRatio(1); gl.shadowMap.enabled = true; gl.shadowMap.type = THREE.PCFShadowMap;
gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.0; gl.outputColorSpace = THREE.SRGBColorSpace;
const out = document.createElement('canvas'); out.width = W; out.height = H; const X = out.getContext('2d');
document.body.appendChild(out);

const scene = new THREE.Scene();
const cam = new THREE.PerspectiveCamera(50, W / H, 0.1, 2000);
const sky = makeSky(); scene.add(sky);
const hemi = new THREE.HemisphereLight('#ffffff', '#8a7f6e', 2.2); scene.add(hemi);
const sun = new THREE.DirectionalLight('#fff4e0', 2.6); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
Object.assign(sun.shadow.camera, { left: -22, right: 22, top: 22, bottom: -22, near: 1, far: 120 }); sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.03;
scene.add(sun); scene.add(sun.target);
const fx = new FX(scene);

let SPEC = null, SHOTS = [], WORDS = [], DUR = 0, cur = -1, hero = null;
const setCache = {}; const cast = {}; const crowd = []; let props = []; let extras = [];

function getSet(name, o) { const key = name + '|' + (o.time || 'day') + '|' + (o.label || '') + '|' + (o.screen || ''); if (!setCache[key]) { const s = (SETS[name] || SETS.street)(o); s.g.visible = false; scene.add(s.g); setCache[key] = s; } return setCache[key]; }
function getCast(id, look) { if (!cast[id]) { const lk = typeof look === 'number' ? randomLook(look) : (LOOKS[look] || LOOKS[id] || randomLook(Object.keys(cast).length + 50)); cast[id] = makeAvatar(lk); scene.add(cast[id]); } return cast[id]; }

window.init = (spec, timing) => {
  SPEC = spec; hero = makeAvatar(Object.assign({}, LOOKS.hero, spec.heroLook || {})); scene.add(hero);
  for (let i = 0; i < 14; i++) { const a = makeAvatar(randomLook(i + (spec.seed || 1) * 31)); a.visible = false; scene.add(a); crowd.push(a); }
  let t = 0; SHOTS = spec.beats.map((b, i) => { const d = timing ? timing.beats[i].dur : Math.max(1.6, b.say.split(' ').length / 2.7 + 0.25); const s = { b, start: t, dur: d, i }; t += d; return s; });
  DUR = t;
  if (timing && timing.words) WORDS = timing.words;
  else { WORDS = []; SHOTS.forEach(s => { const ws = s.b.say.split(/\s+/).filter(Boolean); const per = (s.dur - 0.25) / ws.length; ws.forEach((w, k) => WORDS.push({ w, t0: s.start + k * per, t1: s.start + (k + 1) * per })); }); }
  return { dur: DUR, shots: SHOTS.map(s => [s.start, s.dur]) };
};

function hideAll() { Object.values(setCache).forEach(s => s.g.visible = false); Object.values(cast).forEach(a => a.visible = false); crowd.forEach(a => a.visible = false); props.forEach(p => scene.remove(p)); props = []; extras.forEach(e => e.parent && e.parent.remove(e)); extras = []; }

function placeAv(av, anchor, o, scl) { av.visible = true; av.position.set(anchor.x + (o.x || 0), anchor.y + (o.y || 0), anchor.z + (o.z || 0)); av.rotation.y = (o.ry || 0) * Math.PI / 180; av.userData.o = o; av.userData.p0 = av.position.clone();
  hold(av, o.hold || null, o.holdText); if (o.extra) addExtra(av, o.extra); }
function addExtra(av, kind) {
  const u = av.userData;
  if (kind === 'stilts') { for (const leg of [u.legL, u.legR]) { const s = U.box(0.22, 3.4, 0.22, U.mat('#a0643a')); s.position.y = -3.0; leg.add(s); extras.push(s); } }
  if (kind === 'jetpack') { const j = new THREE.Group(); const b = U.box(1.0, 1.3, 0.6, U.mat('#9aa3ad')); j.add(b); for (const x of [-0.3, 0.3]) { const f = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.9, 8), U.mat('#ff8a3d', { basic: true })); f.rotation.x = Math.PI; f.position.set(x, -1.0, 0); j.add(f); } j.position.set(0, 0.9, -0.7); u.torso.add(j); extras.push(j); }
  if (kind === 'ice') { const p = makeProp({ type: 'ice' }); av.add(p); extras.push(p); }
  if (kind === 'blanket') { const b = U.box(1.9, 2.6, 1.3, U.mat('#ff8fb1')); b.position.y = 1.0; u.torso.add(b); extras.push(b); }
  if (kind === 'scarf') { const s = U.box(1.4, 0.35, 0.85, U.mat('#e8363c')); s.position.y = 1.55; u.torso.add(s); extras.push(s); }
}

function setupShot(s) {
  hideAll(); const b = s.b; const time = b.time || SPEC.time || 'day';
  const st = getSet(b.set || 'street', { time, label: b.label || SPEC.label, screen: b.screen }); st.g.visible = true; s.st = st;
  sky.userData.set(time); sky.visible = !st.indoor;
  const sc = SKYCOL[time] || SKYCOL.day;
  scene.fog = st.indoor ? null : new THREE.Fog(sc[2], st.fog[0], st.fog[1]);
  scene.background = new THREE.Color(st.indoor ? '#000' : sc[1]);
  const night = time === 'night', dark = st.dark;
  hemi.intensity = dark ? 0.8 : night ? 1.7 : 2.1; hemi.color.set(night ? '#9fb4ff' : '#ffffff'); hemi.groundColor.set(night ? '#2a2f45' : '#8a7f6e');
  sun.intensity = dark ? 0.5 : night ? 0.6 : time === 'sunset' ? 2.2 : 2.6; sun.color.set(time === 'sunset' ? '#ffb27a' : night ? '#a9b8ff' : '#fff4e0');
  const A = st.hero; const ho = b.hero || {};
  if (ho.hide) hero.visible = false;
  else if (ho.in === 'bed' && st.bed) { const sl = (ho.pose || 'sleep') === 'sleep'; placeAv(hero, new THREE.Vector3(st.bed.x, 1.55, st.bed.z + (sl ? 1.4 : -1.9)), Object.assign({}, ho, { x: 0, z: 0 })); }
  else placeAv(hero, A, ho);
  (b.npcs || []).forEach((n, i) => { const av = getCast(n.id || ('npc' + i), n.look ?? n.id); placeAv(av, A, n); });
  const c = b.crowd; if (c) { const n = Math.min(c.n || 8, 14); const box = st.crowd;
    for (let i = 0; i < n; i++) { const av = crowd[i]; let x = box.x[0] + R(i * 3.3 + s.i) * (box.x[1] - box.x[0]), z = box.z[0] + R(i * 7.1 + s.i) * (box.z[1] - box.z[0]);
      if (Math.abs(x - A.x) < 2.5 && Math.abs(z - A.z) < 3) x += 4;
      const mv = ['walk', 'run', 'panic', 'sneak', 'carry'].includes(c.action) || c.extra === 'stilts' || c.extra === 'jetpack';
      const dir = R(i * 5 + s.i) > 0.5 ? 1 : -1; placeAv(av, new THREE.Vector3(0, 0, 0), { x, z, ry: mv ? (dir > 0 ? 0 : 180) : (R(i) - .5) * 80, hold: c.hold, holdText: c.holdText, extra: c.extra });
      av.userData.mv = mv ? dir * (c.action === 'run' || c.action === 'panic' ? 6 : c.extra === 'jetpack' ? 5 : 2.4) : 0; av.userData.ph = R(i * 9) * 6; av.userData.act = c.action || 'idle'; av.userData.face = c.face || (c.action === 'panic' ? 'shock' : 'normal'); } }
  (b.props || []).forEach(p => { const g = makeProp(p); const base = p.at === 'hero' ? hero.position : A; g.position.set(base.x + (p.x || 0), (p.at === 'hero' ? 0 : A.y) + (p.y ?? (p.type === 'tag' ? 5.6 : 0)), base.z + (p.z || 0)); g.rotation.y = (p.ry || 0) * Math.PI / 180; g.userData.y0 = g.position.y; g.userData.z0 = g.position.z; g.userData.x0 = g.position.x; if (p.s) g.scale.setScalar(p.s); scene.add(g); props.push(g); });
  if (st.g.userData) st.g.userData.pressed = false;
}

// ---------- camera ----------
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const CAMS = {
  push: { a: V(0.8, 0.6, 9.5), b: V(0.3, 0.2, 5.6) }, pull: { a: V(0.3, 0.2, 5.2), b: V(0.8, 0.9, 10.5) },
  close: { a: V(0.3, 0.55, 3.8), b: V(0.1, 0.45, 3.0), lk: V(0, 0.55, 0) }, face: { a: V(0.15, 0.75, 2.7), b: V(0.05, 0.7, 2.2), lk: V(0, 0.75, 0) },
  low: { a: V(2.2, -2.0, 6.8), b: V(1.2, -2.2, 5.0), lk: V(0, 1.0, 0) }, high: { a: V(-3, 10, 10), b: V(-1.5, 7, 8) },
  top: { a: V(0.01, 26, 3), b: V(0.01, 16, 2), lk: V(0, -2.6, 0) }, side: { a: V(9, 0.6, -3.5), b: V(9, 0.6, 3.5) },
  track: { a: V(1.6, 1.0, 7.5), b: V(1.4, 0.8, 6.2) }, drone: { a: V(0, 20, 48), b: V(0, 7, 15) },
  wide: { a: V(-10, 5, 15), b: V(-7.5, 4.2, 12.5) }, ots: { a: V(2.4, 1.8, -5.6), b: V(2.0, 1.5, -4.6), lk: V(0, -0.8, 12) },
  reveal: { a: V(0, -1.6, 2.5), b: V(0, 3.5, 13), lk: V(0, 0.3, 0) }, dolly: { a: V(-4, 1.2, 8), b: V(4, 1.2, 8) }, far: { a: V(0.5, 1.6, 17), b: V(0.3, 0.8, 12) },
};
function camAt(s, lt) {
  const b = s.b; const name = b.cam || 'push'; const p = eio(lt / s.dur); const F = focusOf(s);
  let pos, look;
  if (name === 'orbit' || name === 'spin') { const r = 7.5, a = (name === 'spin' ? -1.4 + 2.8 * p : -0.6 + 1.2 * p); pos = V(F.x + Math.sin(a) * r, F.y + 1.0, F.z + Math.cos(a) * r); look = F.clone(); }
  else { const c = CAMS[name] || CAMS.push; pos = F.clone().add(c.a.clone().lerp(c.b, p)); look = F.clone().add(c.lk || V(0, 0, 0)); }
  const sh = (b.fx || []).includes('shake') ? 0.12 * Math.max(0.25, 1 - lt / 0.8) : 0.02;
  pos.x += Math.sin(lt * 23.1) * sh + Math.sin(lt * 1.3) * 0.05; pos.y += Math.sin(lt * 19.7 + 1) * sh + Math.sin(lt * 1.1) * 0.04;
  cam.position.copy(pos); cam.up.set(0, 1, 0); cam.lookAt(look);
  if (name === 'top') cam.up.set(0, 0, -1), cam.lookAt(look);
  const punch = 1 - 0.14 * (1 - ease(lt / 0.32)); cam.fov = (b.fov || 50) * punch; cam.updateProjectionMatrix();
  return F;
}
function focusOf(s) {
  const b = s.b, st = s.st, f = b.focus || 'hero';
  if (f === 'hero' && hero.visible) { const bp = new THREE.Vector3(); hero.userData.head.getWorldPosition(bp); return hero.userData.o?.in === 'bed' ? bp : V(hero.position.x, bp.y - 0.9, hero.position.z); }
  if (f.startsWith('npc:')) { const a = cast[f.slice(4)]; if (a) { const bp = new THREE.Vector3(); a.userData.head.getWorldPosition(bp); return V(a.position.x, bp.y - 0.9, a.position.z); } }
  if (f.startsWith('prop:')) { const g = props[+f.slice(5)]; if (g) { const v = g.position.clone(); v.y += (g.userData.p.type === 'sign' ? 5 : 0.5); return v; } }
  if (st[f]) return st[f].clone();
  return st.hero.clone().add(V(0, 2.6, 0));
}

// ---------- overlay ----------
function wordAt(t) { let w = null; for (const x of WORDS) { if (x.t0 <= t + 0.02) w = x; else break; } if (w && t > w.t1 + 0.6) return null; return w; }
function stroke(text, x, y, size, fill, sc = 1, rot = 0) {
  X.save(); X.translate(x, y); X.rotate(rot); X.scale(sc, sc); X.font = `700 ${size}px Fredoka`; X.textAlign = 'center'; X.textBaseline = 'middle';
  X.lineJoin = 'round'; X.miterLimit = 2; X.shadowColor = 'rgba(0,0,0,.45)'; X.shadowBlur = 0; X.shadowOffsetY = size * 0.07;
  X.lineWidth = size * 0.2; X.strokeStyle = '#0b0b10'; X.strokeText(text, 0, 0); X.shadowColor = 'transparent'; X.fillStyle = fill; X.fillText(text, 0, 0); X.restore();
}
function overlay(t, s, lt) {
  const b = s.b;
  if (b.big) { const k = back(lt / 0.35); const y = H * (b.big.y || 0.3); X.save(); X.globalAlpha = cl(lt / 0.15);
    X.fillStyle = b.big.bg || '#ff4f7b'; X.fillRect(0, y - 120 * k, W, 240 * k);
    let size = 190; X.font = `700 ${size}px Fredoka`; while (X.measureText(b.big.text).width > W * 0.92 && size > 40) { size -= 6; X.font = `700 ${size}px Fredoka`; }
    stroke(b.big.text, W / 2 + (1 - k) * 200, y + 8, size, b.big.fg || '#ffffff', 1, 0); X.restore(); }
  if (b.notif) { const k = ease(lt / 0.4); const y = -180 + k * 230; X.save(); X.shadowColor = 'rgba(0,0,0,.35)'; X.shadowBlur = 24; X.fillStyle = 'rgba(250,250,252,.97)'; roundRect(X, 30, y, W - 60, 150, 34); X.fill(); X.restore();
    X.fillStyle = b.notif.color || '#e8363c'; roundRect(X, 54, y + 26, 64, 64, 16); X.fill(); X.fillStyle = '#fff'; X.font = '700 46px Fredoka'; X.textAlign = 'center'; X.textBaseline = 'middle'; X.fillText(b.notif.icon || '!', 86, y + 60);
    X.textAlign = 'left'; X.fillStyle = '#6b7280'; X.font = '600 24px Fredoka'; X.fillText((b.notif.title || 'ALERT').toUpperCase() + '  ·  now', 138, y + 42);
    X.fillStyle = '#111'; X.font = '700 30px Fredoka'; const lines = wrapLines(b.notif.text, W - 200, '700 30px Fredoka'); lines.slice(0, 2).forEach((l, i) => X.fillText(l, 138, y + 84 + i * 36)); }
  const fl = b.fx || [];
  if (fl.includes('red')) { X.save(); const a = 0.25 + 0.2 * Math.sin(lt * 8); const g = X.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.75); g.addColorStop(0, 'rgba(255,0,40,0)'); g.addColorStop(1, `rgba(255,0,40,${a})`); X.fillStyle = g; X.fillRect(0, 0, W, H); X.restore(); }
  if (fl.includes('cold')) { X.save(); const g = X.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.8); g.addColorStop(0, 'rgba(160,220,255,0)'); g.addColorStop(1, 'rgba(160,220,255,.45)'); X.fillStyle = g; X.fillRect(0, 0, W, H); X.restore(); }
  if (fl.includes('flash')) { const a = 1 - lt / 0.3; if (a > 0) { X.fillStyle = `rgba(255,255,255,${a})`; X.fillRect(0, 0, W, H); } }
  if (s.i === 0 && SPEC.title && lt < 2.2) { const k = back(lt / 0.4); X.save(); X.globalAlpha = cl((2.2 - lt) / 0.3); X.fillStyle = '#ffd23f'; roundRect(X, 40, 150 - 20, W - 80, 120 * k, 24); X.fill(); X.restore(); if (k > 0.6) stroke(SPEC.title, W / 2, 190, 52, '#ffffff', 1); }
  const w = wordAt(t);
  if (w) { const txt = w.w.replace(/^[^\w$£€]+|[^\w%$£€!?']+$/g, ''); if (txt) { const k = back((t - w.t0) / 0.16); const hot = /[\d$£€%]/.test(txt) || (SPEC.hot || []).includes(txt.toLowerCase()) || /!$/.test(w.w);
      let size = hot ? 104 : 86; X.font = `700 ${size}px Fredoka`; while (X.measureText(txt).width > W * 0.88 && size > 30) { size -= 4; X.font = `700 ${size}px Fredoka`; }
      stroke(txt, W / 2, H * 0.62, size, hot ? '#ffffff' : '#ffe14d', 0.7 + 0.3 * k, 0); } }
}
function wrapLines(text, maxW, font) { X.font = font; const ws = String(text).split(' '); const L = []; let c = ''; for (const w of ws) { const t = c ? c + ' ' + w : w; if (X.measureText(t).width > maxW && c) { L.push(c); c = w; } else c = t; } if (c) L.push(c); return L; }

// ---------- frame ----------
window.frame = (t) => {
  let si = SHOTS.findIndex(s => t >= s.start && t < s.start + s.dur); if (si < 0) si = SHOTS.length - 1;
  const s = SHOTS[si]; if (si !== cur) { setupShot(s); cur = si; }
  const lt = t - s.start, b = s.b, A = s.st.hero; const w = wordAt(t); const talking = !!w && t <= w.t1 + 0.05;
  if (hero.visible) { const o = b.hero || {}; const ps = o.pose || 'talk';
    if (o.move) { hero.position.x = hero.userData.p0.x + o.move[0] * lt; hero.position.z = hero.userData.p0.z + o.move[1] * lt; }
    pose(hero, ps, lt + 1.3, o); if (o.in === 'bed') { const u = hero.userData; if (ps === 'sleep') { u.body.rotation.set(-1.57, 0, 0); u.body.position.set(0, 0.35, 0); } else { u.legL.rotation.x = -1.57; u.legR.rotation.x = -1.57; u.body.position.y = -0.75; } }
    setFace(hero, o.face || (ps === 'sleep' ? 'sleep' : 'normal'), talking && o.talk !== false && ps !== 'sleep', t); }
  (b.npcs || []).forEach((n, i) => { const av = cast[n.id || ('npc' + i)]; if (!av) return; if (n.move) { av.position.x = av.userData.p0.x + n.move[0] * lt; av.position.z = av.userData.p0.z + n.move[1] * lt; }
    pose(av, n.pose || 'idle', lt + i, n); setFace(av, n.face || 'normal', !!n.talk && talking, t + i); });
  crowd.forEach((av, i) => { if (!av.visible) return; const u = av.userData; const box = s.st.crowd;
    if (u.mv) { const span = box.z[1] - box.z[0] + 20; const span2 = box.z[1] - box.z[0] + 6; let z = u.p0.z + u.mv * lt; z = box.z[0] - 6 + (((z - (box.z[0] - 6)) % span2) + span2) % span2; av.position.z = z; }
    if (av.position.distanceTo(cam.position) < 3.5) { av.visible = false; return; }
    const act = u.o.extra === 'jetpack' ? 'fly' : u.act; pose(av, act, lt + u.ph);
    if (u.o.extra === 'stilts') u.body.position.y += 3.3; setFace(av, u.face, false, t + i); });
  const F = camAt(s, lt);
  props.forEach(g => animProp(g, lt, cam));
  if (s.st.g.userData.tick) { s.st.g.userData.pressed = !!b.press && lt > 0.35; s.st.g.userData.tick(t); }
  const head = new THREE.Vector3(); (hero.visible ? hero.userData.head : (cast[Object.keys(cast)[0]] || hero).userData.head).getWorldPosition(head);
  const fo = (s.st.machine && (b.fx || []).includes('coins')) ? s.st.machine.clone().add(V(0, 3, 0)) : (b.fxAt === 'prop' && props[0]) ? props[0].position.clone().add(V(0, 1, 0)) : (hero.visible ? hero.position.clone().add(V(0, 3, 0)) : F);
  fx.update(b.fx, lt, fo, cam, head);
  sun.position.copy(F).add(V(14, 30, 16)); sun.target.position.copy(F);
  gl.render(scene, cam);
  X.drawImage(gl.domElement, 0, 0); overlay(t, s, lt);
  return out.toDataURL('image/jpeg', 0.9);
};
window.ready = true;
