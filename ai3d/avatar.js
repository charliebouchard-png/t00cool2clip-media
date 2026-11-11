// Blocky characters: build, dress, face textures, poses. Original designs.
import * as THREE from './vendor/three.module.js';
import { mat, box, R, ease, canvasTex } from './util.js';

const FACE = new Map();
function faceTex(skin, expr, mouth, blink) {
  const key = [skin, expr, mouth, blink].join('|');
  if (FACE.has(key)) return FACE.get(key);
  const t = canvasTex(256, 256, (g) => {
    g.fillStyle = skin; g.fillRect(0, 0, 256, 256);
    const ink = '#1b1b24';
    const eye = (x, y) => {
      if (blink || expr === 'sleep') { g.strokeStyle = ink; g.lineWidth = 10; g.lineCap = 'round'; g.beginPath(); g.arc(x, y - 4, 20, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke(); return; }
      if (expr === 'happy') { g.strokeStyle = ink; g.lineWidth = 11; g.lineCap = 'round'; g.beginPath(); g.arc(x, y + 12, 22, 1.15 * Math.PI, 1.85 * Math.PI); g.stroke(); return; }
      const big = expr === 'shock';
      const rx = big ? 30 : 21, ry = big ? 36 : 30;
      if (big) { g.fillStyle = '#fff'; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, 7); g.fill(); g.strokeStyle = ink; g.lineWidth = 6; g.stroke();
        g.fillStyle = ink; g.beginPath(); g.ellipse(x, y + 4, 11, 13, 0, 0, 7); g.fill(); }
      else { g.fillStyle = ink; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, 7); g.fill();
        if (expr === 'smug') { g.fillStyle = skin; g.fillRect(x - rx - 2, y - ry - 2, rx * 2 + 4, ry * 0.9); } }
      g.fillStyle = '#fff'; g.beginPath(); g.ellipse(x - rx * 0.32, y - ry * 0.38, rx * 0.32, ry * 0.26, 0, 0, 7); g.fill();
    };
    eye(84, 112); eye(172, 112);
    g.strokeStyle = ink; g.lineWidth = 10; g.lineCap = 'round';
    const brow = (x, d) => { g.beginPath();
      if (expr === 'angry') { g.moveTo(x - 26, 66 - 10 * d); g.lineTo(x + 26, 66 + 10 * d); }
      else if (expr === 'sad') { g.moveTo(x - 26, 70 + 9 * d); g.lineTo(x + 26, 70 - 9 * d); }
      else if (expr === 'shock') { g.moveTo(x - 24, 52); g.quadraticCurveTo(x, 40, x + 24, 52); }
      else { g.moveTo(x - 22, 70); g.quadraticCurveTo(x, 62, x + 22, 70); }
      g.stroke(); };
    brow(84, 1); brow(172, -1);
    g.fillStyle = ink;
    const my = 190;
    if (expr === 'shock') { g.beginPath(); g.ellipse(128, my, 22, mouth ? 30 : 24, 0, 0, 7); g.fill(); g.fillStyle = '#e25563'; g.beginPath(); g.ellipse(128, my + 12, 13, 9, 0, 0, 7); g.fill(); }
    else if (mouth) {
      g.beginPath(); g.moveTo(92, my - 12); g.quadraticCurveTo(128, my - 6, 164, my - 12); g.quadraticCurveTo(160, my + 30, 128, my + 32); g.quadraticCurveTo(96, my + 30, 92, my - 12); g.fill();
      g.fillStyle = '#e25563'; g.beginPath(); g.ellipse(128, my + 18, 18, 10, 0, 0, 7); g.fill();
    } else if (expr === 'angry' || expr === 'sad') { g.lineWidth = 9; g.beginPath(); g.arc(128, my + 26, 30, 1.2 * Math.PI, 1.8 * Math.PI); g.stroke(); }
    else if (expr === 'smug') { g.lineWidth = 9; g.beginPath(); g.moveTo(100, my); g.quadraticCurveTo(140, my + 14, 166, my - 12); g.stroke(); }
    else if (expr === 'sleep') { g.beginPath(); g.ellipse(128, my, 10, 12, 0, 0, 7); g.fill(); }
    else { g.lineWidth = 9; g.beginPath(); g.arc(128, my - 18, 34, 0.22 * Math.PI, 0.78 * Math.PI); g.stroke(); }
  });
  FACE.set(key, t); return t;
}

export const LOOKS = {
  hero: { skin: '#f2c9a0', shirt: '#ffffff', jacket: '#ffcf2e', pants: '#3d5fa8', shoes: '#f4f4f4', hair: 'spiky', hairColor: '#4a2c1a', cap: '#e8363c', logo: '#e8363c' },
  mayor: { skin: '#f0c49c', shirt: '#ffffff', jacket: '#4b4f5c', pants: '#3b3e48', shoes: '#1e1e22', hair: 'bald', hairColor: '#bbbbbb', tie: '#d62f3a', mustache: true, tophat: true },
  guard: { skin: '#c98b5e', shirt: '#24345e', jacket: '#24345e', pants: '#1c2747', shoes: '#111', hair: 'none', hairColor: '#222', police: true },
  grandma: { skin: '#f3cfae', shirt: '#c58fd6', jacket: '#9b64b8', pants: '#6d5a7a', shoes: '#5a3b2b', hair: 'bun', hairColor: '#e9e9ef', glasses: true },
  kid: { skin: '#8d5a3b', shirt: '#4fd1c5', jacket: '#4fd1c5', pants: '#2b2b38', shoes: '#ff5c8a', hair: 'flat', hairColor: '#1a1210', scale: 0.8 },
  scammer: { skin: '#e9b98f', shirt: '#111', jacket: '#1c1c1c', pants: '#111', shoes: '#000', hair: 'flat', hairColor: '#111', shades: true, hood: true },
  neighbor: { skin: '#b07a52', shirt: '#ffffff', jacket: '#35b56b', pants: '#4b3b2a', shoes: '#222', hair: 'flat', hairColor: '#1b1b1b' },
  boss: { skin: '#e6b48c', shirt: '#ffffff', jacket: '#7a1f2b', pants: '#2a2a2a', shoes: '#111', hair: 'flat', hairColor: '#3a2a1a', tie: '#f2c14e', shades: true },
};
const PAL = { skin: ['#f2c9a0', '#e0ac7e', '#c98b5e', '#8d5a3b', '#f3d2b5', '#a8714a'], top: ['#ff5c8a', '#5b8cff', '#35b56b', '#ff8a3d', '#9b64b8', '#2ec4d6', '#e8363c', '#f2c14e', '#ffffff', '#3d3d4a'], pants: ['#3d5fa8', '#2b2b38', '#5a4632', '#6b7280', '#1f3b57', '#7a3b3b'], hair: ['#1a1210', '#4a2c1a', '#c9a227', '#8a3b1d', '#2b2b2b', '#e9e9ef'] };
export function randomLook(i) {
  const p = (a, k) => a[Math.floor(R(i * 13 + k) * a.length)];
  const top = p(PAL.top, 1);
  return { skin: p(PAL.skin, 2), shirt: R(i + 5) > .5 ? '#ffffff' : top, jacket: top, pants: p(PAL.pants, 3), shoes: R(i + 8) > .5 ? '#f4f4f4' : '#222', hair: ['spiky', 'flat', 'bun', 'flat', 'cap'][Math.floor(R(i * 3 + 4) * 5)], hairColor: p(PAL.hair, 6), cap: p(PAL.top, 7), logo: p(PAL.top, 9) };
}

export function makeAvatar(look) {
  const L = Object.assign({}, LOOKS.hero, look);
  const root = new THREE.Group(); const body = new THREE.Group(); root.add(body);
  const m = (c) => mat(c);
  const legGeo = [0.58, 1.55, 0.62];
  const mkLeg = (sx) => { const p = new THREE.Group(); p.position.set(sx * 0.33, 1.6, 0);
    const leg = box(...legGeo, m(L.pants)); leg.position.y = -0.78; p.add(leg);
    const shoe = box(0.62, 0.3, 0.72, m(L.shoes)); shoe.position.set(0, -1.45, 0.05); p.add(shoe); body.add(p); return p; };
  const legL = mkLeg(-1), legR = mkLeg(1);
  const torso = new THREE.Group(); torso.position.y = 1.6; body.add(torso);
  const chest = box(1.32, 1.6, 0.72, m(L.jacket)); chest.position.y = 0.8; torso.add(chest);
  if (L.shirt !== L.jacket) { const s = box(0.46, 1.5, 0.04, m(L.shirt)); s.position.set(0, 0.78, 0.37); torso.add(s);
    if (L.logo) { const lg = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.035, 6, 16), m(L.logo)); lg.position.set(0, 1.05, 0.4); torso.add(lg); } }
  if (L.tie) { const t = box(0.16, 0.9, 0.04, m(L.tie)); t.position.set(0, 0.95, 0.4); torso.add(t); }
  if (L.police) { const b = box(0.22, 0.26, 0.04, mat('#f2c14e')); b.position.set(-0.32, 1.15, 0.38); torso.add(b); }
  const mkArm = (sx) => { const p = new THREE.Group(); p.position.set(sx * 0.93, 1.48, 0); torso.add(p);
    const a = box(0.52, 1.35, 0.62, m(L.jacket)); a.position.y = -0.6; p.add(a);
    const h = box(0.46, 0.36, 0.52, m(L.skin)); h.position.y = -1.42; p.add(h);
    const hand = new THREE.Group(); hand.position.set(0, -1.45, 0.1); p.add(hand); p.userData.hand = hand; return p; };
  const armL = mkArm(-1), armR = mkArm(1);
  const neck = new THREE.Group(); neck.position.y = 1.62; neck.scale.setScalar(1.18); torso.add(neck);
  const faceMat = new THREE.MeshLambertMaterial({ map: faceTex(L.skin, 'normal', 0, 0) });
  const skinM = m(L.skin);
  const head = new THREE.Mesh(new THREE.BoxGeometry(1.18, 1.12, 1.12), [skinM, skinM, skinM, skinM, faceMat, skinM]);
  head.position.y = 0.6; head.castShadow = true; neck.add(head);
  const hm = m(L.hairColor);
  if (L.hair === 'spiky') {
    const top = box(1.26, 0.28, 1.2, hm); top.position.set(0, 1.2, -0.02); neck.add(top);
    const back = box(1.24, 0.75, 0.2, hm); back.position.set(0, 0.85, -0.55); neck.add(back);
    for (let i = 0; i < 6; i++) { const s = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.55, 4), hm); s.position.set(-0.45 + (i % 3) * 0.45, 1.5, -0.3 + Math.floor(i / 3) * 0.45); s.rotation.set(-0.3 + Math.floor(i / 3) * 0.5, 0, (i % 3 - 1) * 0.35); s.castShadow = true; neck.add(s); }
    const fr = box(1.22, 0.24, 0.2, hm); fr.position.set(0, 1.08, 0.52); fr.rotation.x = 0.2; neck.add(fr);
  } else if (L.hair === 'flat') { const top = box(1.26, 0.32, 1.22, hm); top.position.set(0, 1.25, -0.02); neck.add(top); const back = box(1.26, 0.8, 0.22, hm); back.position.set(0, 0.85, -0.55); neck.add(back); }
  else if (L.hair === 'bun') { const top = box(1.26, 0.3, 1.22, hm); top.position.set(0, 1.24, -0.02); neck.add(top); const bn = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 8), hm); bn.position.set(0, 1.55, -0.2); neck.add(bn); }
  if (L.hair === 'cap' || L.cap && L.hair === 'spiky') {
    const cm = m(L.cap || '#e8363c'); const c = box(1.28, 0.36, 1.24, cm); c.position.set(0, 1.3, 0); neck.add(c);
    const brim = box(1.0, 0.08, 0.62, cm); brim.position.set(0, 1.14, L.hair === 'spiky' ? -0.85 : 0.85); neck.add(brim);
    if (L.hair === 'spiky') neck.children.filter(o => o.geometry && o.geometry.type === 'ConeGeometry').forEach(o => o.visible = false);
  }
  if (L.tophat) { const hm2 = mat('#1d1d22'); const b = box(1.5, 0.1, 1.5, hm2); b.position.y = 1.2; neck.add(b); const c = box(1.0, 0.95, 1.0, hm2); c.position.y = 1.7; neck.add(c); const band = box(1.02, 0.16, 1.02, mat('#d62f3a')); band.position.y = 1.32; neck.add(band); }
  if (L.police) { const c = box(1.28, 0.32, 1.26, mat('#1c2747')); c.position.y = 1.28; neck.add(c); const br = box(1.1, 0.07, 0.4, mat('#111')); br.position.set(0, 1.12, 0.7); neck.add(br); }
  if (L.mustache) { const mu = box(0.6, 0.12, 0.06, mat('#d9d9d9')); mu.position.set(0, 0.38, 0.58); neck.add(mu); }
  if (L.shades || L.glasses) { const gm = mat(L.shades ? '#0d0d12' : '#e9e9ef');
    for (const sx of [-1, 1]) { const g = box(0.36, L.shades ? 0.24 : 0.3, 0.05, L.shades ? gm : new THREE.MeshLambertMaterial({ color: '#cfe8ff', transparent: true, opacity: .35 })); g.position.set(sx * 0.27, 0.68, 0.59); neck.add(g);
      if (!L.shades) { const fr = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.025, 4, 12), gm); fr.position.set(sx * 0.27, 0.68, 0.6); neck.add(fr); } }
    const br = box(0.2, 0.04, 0.05, gm); br.position.set(0, 0.7, 0.6); neck.add(br); }
  if (L.hood) { const hd = box(1.34, 0.5, 1.3, mat(L.jacket)); hd.position.set(0, 1.25, -0.04); neck.add(hd); const hb = box(1.34, 1.0, 0.25, mat(L.jacket)); hb.position.set(0, 0.7, -0.6); neck.add(hb); }
  body.traverse(o => { if (o.isMesh) { o.castShadow = true; } });
  const s = L.scale || 1; root.scale.setScalar(s);
  root.userData = { L, body, legL, legR, armL, armR, torso, neck, head, faceMat, held: null, expr: 'normal' };
  return root;
}

export function setFace(av, expr, talking, t) {
  const u = av.userData; const blink = (t % 3.3) < 0.12 && expr !== 'sleep';
  const mouth = talking ? (Math.sin(t * 22) + Math.sin(t * 13.7) > 0.2 ? 1 : 0) : (expr === 'happy' ? 1 : 0);
  const tx = faceTex(u.L.skin, expr, mouth, blink ? 1 : 0);
  if (u.faceMat.map !== tx) { u.faceMat.map = tx; u.faceMat.needsUpdate = true; }
}

// held items in right hand
export function hold(av, item, text) {
  const u = av.userData; if (u.held) { u.held.parent.remove(u.held); u.held = null; }
  if (!item) return;
  const g = new THREE.Group();
  if (item === 'phone') {
    const b = box(0.62, 1.1, 0.1, mat('#1c1c22')); g.add(b);
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.54, 1.0), new THREE.MeshBasicMaterial({ map: phoneTex(text || '') }));
    scr.position.z = 0.056; g.add(scr); g.position.set(-0.2, 0.25, 0.35); g.rotation.set(-0.3, 0.5, 0);
  } else if (item === 'money') {
    for (let i = 0; i < 3; i++) { const c = box(0.7, 0.06, 0.35, mat('#5cbf6b')); c.position.y = i * 0.07; g.add(c); }
    g.position.set(0, 0, 0.25);
  } else if (item === 'sign') {
    const st = box(0.08, 2.2, 0.08, mat('#8a5a34')); st.position.y = 1.0; g.add(st);
    const p = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.1, 0.06), [mat('#fff'), mat('#fff'), mat('#fff'), mat('#fff'), new THREE.MeshLambertMaterial({ map: labelTex(text || 'NO!', '#ffffff', '#e8363c', 512, 300) }), mat('#fff')]);
    p.position.y = 2.3; g.add(p);
  } else if (item === 'umbrella') {
    const st = box(0.06, 2.0, 0.06, mat('#333')); st.position.y = 0.9; g.add(st);
    const c = new THREE.Mesh(new THREE.ConeGeometry(1.6, 0.7, 8, 1, true), new THREE.MeshLambertMaterial({ color: text || '#e8363c', side: THREE.DoubleSide })); c.position.y = 2.0; g.add(c);
  } else if (item === 'mug') { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.18, 0.4, 10), mat('#ffffff')); c.position.z = 0.2; g.add(c); }
  else if (item === 'shovel' || item === 'tool') { const st = box(0.08, 1.8, 0.08, mat('#8a5a34')); st.position.y = 0.4; g.add(st); const hd = box(0.5, 0.5, 0.08, mat('#9aa3ad')); hd.position.y = -0.6; g.add(hd); }
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  u.armR.userData.hand.add(g); u.held = g;
}

export function phoneTex(text) {
  return canvasTex(270, 500, (g) => {
    const gr = g.createLinearGradient(0, 0, 0, 500); gr.addColorStop(0, '#2b5cff'); gr.addColorStop(1, '#8a3bff'); g.fillStyle = gr; g.fillRect(0, 0, 270, 500);
    g.fillStyle = '#fff'; g.font = '700 40px Fredoka'; g.textAlign = 'center'; g.fillText('9:41', 135, 70);
    g.fillStyle = 'rgba(255,255,255,.92)'; roundRect(g, 14, 150, 242, 200, 26); g.fill();
    g.fillStyle = '#e8363c'; g.font = '700 22px Fredoka'; g.fillText('⚠ NEW ALERT', 135, 190);
    g.fillStyle = '#16161c'; wrapText(g, text.toUpperCase(), 135, 232, 220, 34, '700 28px Fredoka');
  });
}
export function labelTex(text, fg = '#fff', bg = '#ff4f7b', w = 512, h = 256, border) {
  return canvasTex(w, h, (g) => {
    g.fillStyle = bg; roundRect(g, 0, 0, w, h, Math.min(w, h) * 0.12); g.fill();
    if (border) { g.strokeStyle = border; g.lineWidth = 14; roundRect(g, 10, 10, w - 20, h - 20, Math.min(w, h) * 0.1); g.stroke(); }
    g.fillStyle = fg; const lines = String(text).split('\n'); let fs = Math.min(h * 0.62 / lines.length, 200);
    g.font = `700 ${fs}px Fredoka`; while (Math.max(...lines.map(l => g.measureText(l).width)) > w * 0.88 && fs > 10) { fs -= 4; g.font = `700 ${fs}px Fredoka`; }
    g.textAlign = 'center'; g.textBaseline = 'middle';
    lines.forEach((l, i) => g.fillText(l, w / 2, h / 2 + (i - (lines.length - 1) / 2) * fs * 1.08));
  });
}
export function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
export function wrapText(g, text, x, y, maxW, lh, font) {
  g.font = font; g.textAlign = 'center'; const words = text.split(' '); let line = ''; let yy = y;
  for (const w of words) { const t = line ? line + ' ' + w : w; if (g.measureText(t).width > maxW && line) { g.fillText(line, x, yy); line = w; yy += lh; } else line = t; }
  if (line) g.fillText(line, x, yy);
}

// ---------- poses ----------
const sin = Math.sin, cos = Math.cos;
export function pose(av, name, t, o = {}) {
  const u = av.userData; const { legL, legR, armL, armR, torso, neck, body } = u;
  // reset
  for (const p of [legL, legR, armL, armR, torso, neck]) p.rotation.set(0, 0, 0);
  body.position.set(0, 0, 0); body.rotation.set(0, 0, 0);
  const bob = sin(t * 2.2) * 0.03;
  switch (name) {
    case 'talk': {
      body.position.y = bob; armR.rotation.x = -0.5 - 0.35 * (sin(t * 3.1) * .5 + .5); armR.rotation.z = 0.25; armL.rotation.x = -0.2 - 0.25 * (sin(t * 2.3 + 1) * .5 + .5); armL.rotation.z = -0.15;
      neck.rotation.x = sin(t * 4.1) * 0.06; neck.rotation.y = sin(t * 1.3) * 0.12; torso.rotation.y = sin(t * 1.1) * 0.06; break; }
    case 'walk': case 'run': case 'sneak': case 'panic': {
      const f = name === 'run' || name === 'panic' ? 9 : name === 'sneak' ? 4 : 6, a = name === 'run' || name === 'panic' ? 0.95 : 0.55;
      legL.rotation.x = sin(t * f) * a; legR.rotation.x = -sin(t * f) * a;
      if (name === 'panic') { armL.rotation.x = -2.8 + sin(t * 14) * 0.4; armR.rotation.x = -2.8 - sin(t * 14) * 0.4; }
      else { armL.rotation.x = -sin(t * f) * a * 0.9; armR.rotation.x = sin(t * f) * a * 0.9; }
      body.position.y = Math.abs(sin(t * f)) * (name === 'run' ? 0.25 : 0.1);
      if (name === 'run') torso.rotation.x = 0.18;
      if (name === 'sneak') { torso.rotation.x = 0.35; body.position.y = -0.25; legL.rotation.x -= .3; legR.rotation.x -= .3; }
      break; }
    case 'shock': { const k = ease(Math.min(1, t / 0.25)); body.position.y = sin(Math.min(1, t / 0.35) * Math.PI) * 0.6; armL.rotation.x = -2.6 * k; armR.rotation.x = -2.6 * k; armL.rotation.z = -0.4 * k; armR.rotation.z = 0.4 * k; neck.rotation.x = -0.15 * k; break; }
    case 'cheer': { body.position.y = Math.abs(sin(t * 7)) * 0.7; armL.rotation.x = -2.9 + sin(t * 14) * .2; armR.rotation.x = -2.9 - sin(t * 14) * .2; armL.rotation.z = -.35; armR.rotation.z = .35; break; }
    case 'dance': { body.position.y = Math.abs(sin(t * 6)) * 0.35; body.rotation.y = sin(t * 3) * 0.5; armL.rotation.x = -1.5 + sin(t * 6) * 1.2; armR.rotation.x = -1.5 - sin(t * 6) * 1.2; legL.rotation.x = sin(t * 6) * .4; legR.rotation.x = -sin(t * 6) * .4; break; }
    case 'sit': { legL.rotation.x = -1.57; legR.rotation.x = -1.57; body.position.y = -0.75; armL.rotation.x = -0.6; armR.rotation.x = -0.6; neck.rotation.y = sin(t) * 0.1; break; }
    case 'sleep': { body.rotation.x = -1.57; body.position.set(0, 0.6, -1.4); neck.rotation.y = 0.15; armL.rotation.z = -0.1; break; }
    case 'press': { const k = ease(Math.min(1, t / 0.4)); armR.rotation.x = -1.4 * k + (t > 0.4 ? sin((t - 0.4) * 30) * 0.05 * Math.max(0, 1 - (t - 0.4)) : 0); torso.rotation.x = 0.25 * k; armL.rotation.x = -0.3; break; }
    case 'phone': { armR.rotation.x = -1.25; armR.rotation.z = 0.45; armL.rotation.x = -1.1; armL.rotation.z = -0.45; neck.rotation.x = 0.35; body.position.y = bob; break; }
    case 'shiver': { body.position.x = sin(t * 60) * 0.04; armL.rotation.x = -1.2; armR.rotation.x = -1.2; armL.rotation.z = 0.9; armR.rotation.z = -0.9; torso.rotation.x = 0.15; legL.rotation.z = 0.08; legR.rotation.z = -0.08; break; }
    case 'point': { armR.rotation.x = -1.55; armR.rotation.z = 0.1; armL.rotation.x = -0.1; neck.rotation.y = 0.15; body.position.y = bob; break; }
    case 'think': { armR.rotation.x = -2.2; armR.rotation.z = 0.55; armL.rotation.x = -0.9; armL.rotation.z = -0.7; neck.rotation.z = 0.12; neck.rotation.x = -0.1 + sin(t * 1.5) * 0.05; break; }
    case 'facepalm': { armR.rotation.x = -2.5; armR.rotation.z = 0.7; neck.rotation.x = 0.35; torso.rotation.x = 0.1; break; }
    case 'fly': { body.position.y = 1.2 + sin(t * 2.5) * 0.35; armL.rotation.z = -1.2; armR.rotation.z = 1.2; legL.rotation.x = 0.3 + sin(t * 3) * .2; legR.rotation.x = 0.1 - sin(t * 3) * .2; torso.rotation.x = 0.1; break; }
    case 'float': { body.position.y = 2.5 + sin(t * 1.4) * 0.6; body.rotation.z = sin(t * 0.8) * 0.5; body.rotation.x = cos(t * 0.6) * 0.3; armL.rotation.z = -1.0 + sin(t * 3) * .4; armR.rotation.z = 1.0 - sin(t * 3) * .4; legL.rotation.x = sin(t * 2.5) * .5; legR.rotation.x = -sin(t * 2.5) * .5; break; }
    case 'wave': { armR.rotation.x = -2.6; armR.rotation.z = 0.3 + sin(t * 9) * 0.35; body.position.y = bob; break; }
    case 'angry': { body.position.y = Math.abs(sin(t * 8)) * 0.12; armL.rotation.x = -0.5; armR.rotation.x = -0.5 + sin(t * 8) * 0.3; armL.rotation.z = -0.5; armR.rotation.z = 0.5; neck.rotation.x = 0.15; torso.rotation.x = 0.12; break; }
    case 'sad': { neck.rotation.x = 0.45; torso.rotation.x = 0.2; armL.rotation.x = 0.1; armR.rotation.x = 0.1; body.position.y = -0.05; break; }
    case 'count': { armR.rotation.x = -1.0; armL.rotation.x = -1.0; armL.rotation.z = -0.3; neck.rotation.x = 0.3; armR.rotation.y = sin(t * 10) * 0.3; break; }
    case 'carry': { armL.rotation.x = -1.6; armR.rotation.x = -1.6; legL.rotation.x = sin(t * 6) * .4; legR.rotation.x = -sin(t * 6) * .4; break; }
    case 'hug': { armL.rotation.x = -1.3; armR.rotation.x = -1.3; armL.rotation.z = 0.9; armR.rotation.z = -0.9; body.position.y = bob; break; }
    case 'lie': { body.rotation.x = -1.57; body.position.set(0, 0.35, -1.6); armL.rotation.z = -2.6; armR.rotation.z = 2.6; break; }
    case 'jump': { body.position.y = Math.abs(sin(t * 5)) * 1.4; armL.rotation.x = -2.2; armR.rotation.x = -2.2; legL.rotation.x = -.4; legR.rotation.x = .4; break; }
    default: { body.position.y = bob; armL.rotation.z = -0.06 + sin(t * 1.7) * 0.03; armR.rotation.z = 0.06 - sin(t * 1.7) * 0.03; neck.rotation.y = sin(t * 0.7) * 0.08; }
  }
}
