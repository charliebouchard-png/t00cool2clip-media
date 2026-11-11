// Sets (environments), props and particle effects for the blocky story videos.
import * as THREE from './vendor/three.module.js';
import { mat, box, R, canvasTex, ease, back, cl } from './util.js';
import { labelTex, roundRect } from './avatar.js';

// ---------- textures ----------
const TEXC = new Map();
function cached(key, fn) { if (!TEXC.has(key)) TEXC.set(key, fn()); return TEXC.get(key); }
function rep(t) { t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; }
function winTex(color, night) {
  return cached('win' + color + night, () => rep(canvasTex(64, 64, (g) => {
    g.fillStyle = night ? shade(color, -0.45) : color; g.fillRect(0, 0, 64, 64);
    g.fillStyle = night ? '#ffffff' : '#ffffff'; g.fillRect(10, 8, 44, 46);
    const gr = g.createLinearGradient(0, 10, 0, 52);
    if (night) { gr.addColorStop(0, '#ffe39a'); gr.addColorStop(1, '#f2b84e'); } else { gr.addColorStop(0, '#d9f1ff'); gr.addColorStop(1, '#7cc4f2'); }
    g.fillStyle = gr; g.fillRect(13, 11, 38, 40);
    if (!night) { g.fillStyle = 'rgba(255,255,255,.65)'; g.beginPath(); g.moveTo(16, 46); g.lineTo(30, 13); g.lineTo(36, 13); g.lineTo(22, 46); g.fill(); }
  })));
}
function glassTex(night) {
  return cached('glass' + night, () => rep(canvasTex(64, 64, (g) => {
    const gr = g.createLinearGradient(0, 0, 64, 64); gr.addColorStop(0, night ? '#1c3a66' : '#8fd3ff'); gr.addColorStop(1, night ? '#0f2244' : '#3d9be0');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64); g.fillStyle = night ? 'rgba(255,220,120,.55)' : 'rgba(255,255,255,.35)'; g.fillRect(0, 0, 64, 3); g.fillRect(0, 0, 3, 64);
    if (night && Math.random() < 2) { g.fillStyle = 'rgba(255,214,110,.7)'; g.fillRect(8, 10, 20, 18); }
  })));
}
export function shade(hex, k) { const c = new THREE.Color(hex); if (k < 0) c.multiplyScalar(1 + k); else c.lerp(new THREE.Color('#fff'), k); return '#' + c.getHexString(); }
function scaleUV(geo, w, h, d, cw, ch) {
  const uv = geo.attributes.uv; const spans = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let v = 0; v < 4; v++) { const i = f * 4 + v; uv.setXY(i, uv.getX(i) * spans[f][0] / cw, uv.getY(i) * spans[f][1] / ch); }
  uv.needsUpdate = true; return geo;
}
function texBox(w, h, d, map, cw, ch, opts = {}) {
  const g = scaleUV(new THREE.BoxGeometry(w, h, d), w, h, d, cw, ch);
  const side = new THREE.MeshLambertMaterial({ map, ...(opts.emissive ? { emissive: '#ffffff', emissiveMap: map, emissiveIntensity: opts.emissive } : {}) });
  const top = mat(opts.top || '#d8dbe2');
  const m = new THREE.Mesh(g, [side, side, top, top, side, side]); m.castShadow = true; m.receiveShadow = true; return m;
}
function plane(w, h, m) { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); p.rotation.x = -Math.PI / 2; p.receiveShadow = true; return p; }
function checker(a, b, n = 8, s = 256) { return rep(canvasTex(s, s, (g) => { const c = s / n; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { g.fillStyle = (i + j) % 2 ? a : b; g.fillRect(i * c, j * c, c, c); } })); }
function planks(c1, c2) { return rep(canvasTex(256, 256, (g) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? c1 : c2; g.fillRect(0, i * 32, 256, 32); g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(0, i * 32, 256, 2); g.fillRect(((i * 97) % 200) + 20, i * 32, 2, 32); } })); }
function stripes(c1, c2, n = 8) { return rep(canvasTex(128, 128, (g) => { for (let i = 0; i < n; i++) { g.fillStyle = i % 2 ? c1 : c2; g.fillRect(i * 128 / n, 0, 128 / n, 128); } })); }

// ---------- reusable models ----------
const PASTEL = ['#b9a7f5', '#ffb3c7', '#9fe0c4', '#ffe1a8', '#a8d4ff', '#f7c59f', '#d7b8f3', '#ffd0e0', '#bfeee0', '#f2e6c9'];
function building(w, h, d, color, night, kind = 'win') {
  const g = new THREE.Group();
  const body = kind === 'glass' ? texBox(w, h, d, glassTex(night), 3, 3, { emissive: night ? 0.55 : 0, top: '#4b6b8f' }) : texBox(w, h, d, winTex(color, night), 3.2, 3.6, { emissive: night ? 0.5 : 0, top: shade(color, -0.25) });
  body.position.y = h / 2; g.add(body);
  const ledge = box(w + 0.6, 0.5, d + 0.6, mat(kind === 'glass' ? '#dfe7ef' : '#ffffff')); ledge.position.y = h + 0.25; g.add(ledge);
  if (kind !== 'glass') {
    const aw = box(w * 0.9, 0.5, 1.6, mat(PASTEL[Math.floor(R(w * h) * 10)] === color ? '#ff5c8a' : ['#ff5c8a', '#2ec4d6', '#ff8a3d', '#35b56b', '#5b8cff'][Math.floor(R(h * 7.1) * 5)])); aw.position.set(0, 4.2, d / 2 + 0.8); aw.rotation.x = 0.25; g.add(aw);
    const shop = box(w * 0.8, 3.6, 0.1, mat(night ? '#ffd27a' : '#2b4a78', night ? { p: { emissive: '#ffb84d', emissiveIntensity: .6 } } : {})); shop.position.set(0, 1.9, d / 2 + 0.06); g.add(shop);
    if (R(w + d) > 0.5) { const ac = box(2, 1.2, 2, mat('#c9ced8')); ac.position.set(w * 0.2, h + 1.1, 0); g.add(ac); }
  }
  return g;
}
export function tree(s = 1) {
  const g = new THREE.Group(); const tr = box(0.6 * s, 2.6 * s, 0.6 * s, mat('#8a5a34')); tr.position.y = 1.3 * s; g.add(tr);
  const lm = new THREE.MeshLambertMaterial({ color: '#4cc35a', flatShading: true });
  const ico = new THREE.IcosahedronGeometry(1.7 * s, 1);
  for (const [x, y, z, k] of [[0, 3.6, 0, 1], [0.9, 3.0, 0.4, .7], [-0.8, 3.1, -0.3, .75], [0.2, 4.4, -0.2, .7]]) { const c = new THREE.Mesh(ico, lm); c.position.set(x * s, y * s, z * s); c.scale.setScalar(k); c.castShadow = true; g.add(c); }
  return g;
}
function lamp(night) { const g = new THREE.Group(); const p = box(0.25, 6, 0.25, mat('#2f3747')); p.position.y = 3; g.add(p); const arm = box(1.6, 0.2, 0.2, mat('#2f3747')); arm.position.set(-0.7, 5.9, 0); g.add(arm);
  const l = box(0.7, 0.3, 0.5, mat(night ? '#fff1b8' : '#e9edf3', night ? { basic: true } : {})); l.position.set(-1.4, 5.75, 0); g.add(l); return g; }
function hydrant() { const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 1, 8), mat('#e8363c')); b.position.y = 0.5; b.castShadow = true; g.add(b); const t = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 6), mat('#e8363c')); t.position.y = 1.0; g.add(t); return g; }
export function car(color) {
  const g = new THREE.Group(); const b = box(2.4, 1.0, 4.6, mat(color)); b.position.y = 0.85; g.add(b); const c = box(2.1, 0.9, 2.4, mat(color)); c.position.set(0, 1.75, -0.2); g.add(c);
  const w = box(2.14, 0.7, 2.2, mat('#2a3b55')); w.position.set(0, 1.78, -0.2); g.add(w);
  const wg = new THREE.CylinderGeometry(0.45, 0.45, 0.4, 12); for (const [x, z] of [[-1.15, 1.5], [1.15, 1.5], [-1.15, -1.5], [1.15, -1.5]]) { const wh = new THREE.Mesh(wg, mat('#1b1b22')); wh.rotation.z = Math.PI / 2; wh.position.set(x, 0.45, z); g.add(wh); }
  const hl = box(0.5, 0.25, 0.1, mat('#fff7cc', { basic: true })); hl.position.set(-0.7, 0.95, 2.31); g.add(hl); const hr = hl.clone(); hr.position.x = 0.7; g.add(hr);
  return g;
}
function skyline(g, night, r0, r1, n, seed, yb = 0) {
  for (let i = 0; i < n; i++) { const a = R(seed + i) * Math.PI * 2, r = r0 + R(seed + i * 3) * (r1 - r0); const h = 25 + R(seed + i * 7) * 70, w = 8 + R(seed + i * 5) * 10;
    const b = building(w, h, w, PASTEL[i % 10], night, R(seed + i * 11) > 0.45 ? 'glass' : 'win'); b.position.set(Math.cos(a) * r, yb, Math.sin(a) * r); b.lookAt(0, yb, 0); g.add(b); }
}
function cityHall(label, night) {
  const g = new THREE.Group(); const white = mat('#f6f4ee'), cream = mat('#e9e2cf');
  for (let i = 0; i < 3; i++) { const s = box(30 - i * 2, 0.6, 6 - i * 1.5, cream); s.position.set(0, 0.3 + i * 0.6, 8.5 - i * 0.75); g.add(s); }
  const main = texBox(34, 13, 12, winTex('#f6f4ee', night), 3.4, 4.3, { emissive: night ? .4 : 0, top: '#e9e2cf' }); main.position.set(0, 6.5, 0); g.add(main);
  const colG = new THREE.CylinderGeometry(0.7, 0.8, 11, 12);
  for (let i = 0; i < 8; i++) { const c = new THREE.Mesh(colG, white); c.position.set(-10.5 + i * 3, 7.3, 7.6); c.castShadow = true; g.add(c); }
  const ent = box(27, 1.6, 3, white); ent.position.set(0, 13.6, 7.6); g.add(ent);
  const sh = new THREE.Shape(); sh.moveTo(-14, 0); sh.lineTo(14, 0); sh.lineTo(0, 5); sh.lineTo(-14, 0);
  const ped = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 3, bevelEnabled: false }), white); ped.position.set(0, 14.4, 6.1); ped.castShadow = true; g.add(ped);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(9, 1.4), new THREE.MeshBasicMaterial({ map: labelTex(label || 'CITY HALL', '#c9a227', '#f6f4ee', 640, 100) })); sign.position.set(0, 13.6, 9.15); g.add(sign);
  const emb = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 0.3, 20), mat('#f2c14e')); emb.rotation.x = Math.PI / 2; emb.position.set(0, 16.3, 9.2); g.add(emb);
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 4, 20), white); drum.position.set(0, 15, -1); g.add(drum);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(5, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat('#9fd0f0')); dome.position.set(0, 17, -1); dome.castShadow = true; g.add(dome);
  const top = new THREE.Mesh(new THREE.SphereGeometry(0.8, 10, 8), mat('#f2c14e')); top.position.set(0, 22.4, -1); g.add(top);
  const door = box(3.5, 5.5, 0.3, mat('#6b3e22')); door.position.set(0, 4.6, 6.1); g.add(door);
  for (const x of [-18, 18]) { const p = box(0.25, 12, 0.25, mat('#cfd5df')); p.position.set(x, 6, 11); g.add(p); const f = box(3, 1.8, 0.08, mat('#2b5cff')); f.position.set(x + 1.6, 11, 11); g.add(f); }
  return g;
}

// ---------- sets ----------
export const SETS = {};
SETS.street = (o) => {
  const night = o.time === 'night'; const g = new THREE.Group();
  { const gp = plane(600, 600, mat(night ? '#3b4256' : '#aab4c4')); gp.position.set(0, -0.02, -100); g.add(gp); }
  const road = plane(14, 420, mat(night ? '#1d2538' : '#2d3a5c')); road.position.set(0, 0, -140); g.add(road);
  const dashG = new THREE.InstancedMesh(new THREE.BoxGeometry(0.35, 0.03, 2.6), mat('#ffd23f'), 70);
  const M = new THREE.Matrix4(); for (let i = 0; i < 70; i++) { M.makeTranslation(0, 0.02, 60 - i * 6); dashG.setMatrixAt(i, M); } g.add(dashG);
  for (const x of [-6.6, 6.6]) { const l = plane(0.25, 420, mat('#e9edf3')); l.position.set(x, 0.02, -140); g.add(l); }
  for (const s of [-1, 1]) { const sw = box(6, 0.35, 420, mat(night ? '#8e96a8' : '#cfd5df')); sw.position.set(s * 10, 0.17, -140); sw.castShadow = false; g.add(sw);
    const curb = box(0.3, 0.4, 420, mat('#eef1f5')); curb.position.set(s * 7.1, 0.2, -140); g.add(curb); }
  for (let i = 0; i < 6; i++) { const cw = plane(1.2, 9, mat('#e9edf3')); cw.position.set(-5 + i * 2, 0.025, -22); cw.rotation.z = Math.PI / 2; g.add(cw); }
  for (const s of [-1, 1]) { let z = 50; let i = 0; while (z > -150) { const w = 9 + R(i * 3 + s) * 8, h = 12 + R(i * 5 + s * 2) * 26, d = 12; const col = PASTEL[Math.floor(R(i * 7 + s * 3) * 10)];
      const b = building(w, h, d, col, night, R(i * 13 + s) > 0.82 ? 'glass' : 'win'); b.position.set(s * (13 + d / 2), 0, z - w / 2); b.rotation.y = s > 0 ? -Math.PI / 2 : Math.PI / 2; g.add(b); z -= w + 0.4; i++; } }
  for (let i = 0; i < 12; i++) { for (const s of [-1, 1]) { const t = tree(0.9); t.position.set(s * 9.6, 0.35, 30 - i * 16 + (s > 0 ? 8 : 0)); g.add(t); } }
  for (let i = 0; i < 8; i++) for (const s of [-1, 1]) { const l = lamp(night); l.position.set(s * 7.8, 0.35, 20 - i * 24); l.rotation.y = s > 0 ? 0 : Math.PI; g.add(l); }
  for (let i = 0; i < 5; i++) { const h = hydrant(); h.position.set((i % 2 ? 1 : -1) * 8.2, 0.35, 12 - i * 28); g.add(h); }
  const parked = [['#e8363c', -5.2, -14], ['#5b8cff', 5.2, -38], ['#f2c14e', -5.2, -62], ['#ffffff', 5.2, 6]];
  for (const [c, x, z] of parked) { const k = car(c); k.position.set(x, 0, z); g.add(k); }
  const ch = cityHall(o.label, night); ch.position.set(0, 0, -175); g.add(ch);
  const pl = plane(60, 40, mat('#e9e2d0')); pl.position.set(0, 0.03, -165); g.add(pl);
  const sky = new THREE.Group(); skyline(sky, night, 200, 280, 26, 5); sky.position.z = -150; g.add(sky);
  return { g, hero: new THREE.Vector3(1.5, 0, 0), crowd: { x: [-9, 9], z: [-45, -2], y: 0 }, fog: [60, 330] };
};
SETS.cityhall = (o) => {
  const night = o.time === 'night'; const g = new THREE.Group();
  { const gp = plane(500, 500, mat(night ? '#3b4256' : '#aab4c4')); gp.position.y = -0.02; g.add(gp); }
  const tiles = new THREE.MeshLambertMaterial({ map: checker('#e9e2d0', '#ddd4bf', 4) }); const pl = new THREE.Mesh(new THREE.PlaneGeometry(70, 50), tiles); pl.geometry.attributes.uv.array.forEach((v, i, a) => a[i] = v * 12); pl.rotation.x = -Math.PI / 2; pl.position.set(0, 0.01, 6); pl.receiveShadow = true; g.add(pl);
  const ch = cityHall(o.label, night); ch.position.set(0, 0, -14); g.add(ch);
  const ft = new THREE.Mesh(new THREE.CylinderGeometry(4, 4.3, 1, 24), mat('#dcd6c6')); ft.position.set(0, 0.5, 14); ft.castShadow = true; g.add(ft);
  const wt = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.6, 0.1, 24), mat('#6fc8f2')); wt.position.set(0, 1.0, 14); g.add(wt);
  const sp = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.6, 3, 10), mat('#dcd6c6')); sp.position.set(0, 2.3, 14); g.add(sp);
  for (const x of [-26, -16, 16, 26]) { const t = tree(1); t.position.set(x, 0, 12); g.add(t); }
  for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { const b = building(12, 24 + i * 9, 12, PASTEL[(i * 3 + (s > 0 ? 1 : 0)) % 10], night); b.position.set(s * (42 + i * 2), 0, -20 + i * 16); b.rotation.y = s > 0 ? -Math.PI / 2 : Math.PI / 2; g.add(b); }
  const sky = new THREE.Group(); skyline(sky, night, 120, 200, 22, 17); sky.position.z = -60; g.add(sky);
  return { g, hero: new THREE.Vector3(0, 0, 22), crowd: { x: [-16, 16], z: [4, 19], y: 0 }, fog: [50, 300] };
};
function room(o, wallTex, floorTex, w = 16, d = 14, h = 9) {
  const g = new THREE.Group();
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(w, d + 10), new THREE.MeshLambertMaterial({ map: floorTex })); fl.geometry.attributes.uv.array.forEach((v, i, a) => a[i] = v * (i % 2 ? (d + 10) / 4 : w / 4)); fl.rotation.x = -Math.PI / 2; fl.position.z = 3; fl.receiveShadow = true; g.add(fl);
  const wm = new THREE.MeshLambertMaterial({ map: wallTex });
  const bw = new THREE.Mesh(new THREE.PlaneGeometry(w, h), wm); bw.position.set(0, h / 2, -d / 2); bw.receiveShadow = true; g.add(bw);
  for (const s of [-1, 1]) { const sw = new THREE.Mesh(new THREE.PlaneGeometry(d + 10, h), wm); sw.position.set(s * w / 2, h / 2, 3); sw.rotation.y = -s * Math.PI / 2; sw.receiveShadow = true; g.add(sw); }
  const base = box(w, 0.4, 0.2, mat('#ffffff')); base.position.set(0, 0.2, -d / 2 + 0.1); g.add(base);
  return g;
}
function windowPanel(night, w = 4, h = 3.4) { const g = new THREE.Group(); const fr = box(w + 0.4, h + 0.4, 0.2, mat('#ffffff')); g.add(fr);
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: canvasTex(128, 128, (c) => { const gr = c.createLinearGradient(0, 0, 0, 128); if (night) { gr.addColorStop(0, '#0d1838'); gr.addColorStop(1, '#2b3f7a'); } else { gr.addColorStop(0, '#5ab7ff'); gr.addColorStop(1, '#c9ecff'); } c.fillStyle = gr; c.fillRect(0, 0, 128, 128);
    c.fillStyle = night ? '#1a2850' : '#9bd0f2'; for (let i = 0; i < 8; i++) { const hh = 20 + R(i * 3) * 50; c.fillRect(i * 16, 128 - hh, 14, hh); } if (night) { c.fillStyle = '#fff'; c.beginPath(); c.arc(96, 26, 10, 0, 7); c.fill(); } }) }));
  sky.position.z = 0.11; g.add(sky); const bar = box(0.15, h, 0.1, mat('#ffffff')); bar.position.z = 0.15; g.add(bar); const bar2 = box(w, 0.15, 0.1, mat('#ffffff')); bar2.position.z = 0.15; g.add(bar2); return g; }
SETS.bedroom = (o) => {
  const night = o.time === 'night';
  const g = room(o, stripes('#a9dcf0', '#9bd3ea', 10), planks('#c98d55', '#b97d47'));
  const win = windowPanel(night); win.position.set(2.5, 4.8, -6.88); g.add(win);
  const bed = new THREE.Group(); const fr = box(4.4, 1.0, 7.2, mat('#9a6034')); fr.position.y = 0.5; bed.add(fr);
  const mt = box(4.2, 0.6, 7, mat('#ffffff')); mt.position.y = 1.3; bed.add(mt);
  const bl = new THREE.Mesh(new THREE.BoxGeometry(4.3, 0.35, 4.8), new THREE.MeshLambertMaterial({ map: stripes('#ffd23f', '#3a7bd5', 6) })); bl.position.set(0, 1.7, 1.0); bl.castShadow = bl.receiveShadow = true; bed.add(bl);
  const pw = box(3.0, 0.5, 1.2, mat('#f4f4f4')); pw.position.set(0, 1.85, -2.6); bed.add(pw);
  const hb = box(4.4, 2.6, 0.4, mat('#9a6034')); hb.position.set(0, 1.3, -3.6); bed.add(hb);
  bed.position.set(-4.4, 0, -2.6); g.add(bed);
  const ns = box(1.6, 1.6, 1.4, mat('#b97d47')); ns.position.set(-1.3, 0.8, -5.6); g.add(ns);
  const lp = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.6, 0.8, 10), mat(night ? '#fff1b8' : '#ffe08a', night ? { basic: true } : {})); lp.position.set(-1.3, 2.1, -5.6); g.add(lp);
  const sh = box(4, 0.25, 1.2, mat('#9a6034')); sh.position.set(4.6, 5.6, -6.3); g.add(sh);
  ['#e8363c', '#2ec4d6', '#35b56b', '#f2c14e', '#5b8cff', '#ff5c8a'].forEach((c, i) => { const b = box(0.4, 1.1 + R(i) * .4, 0.9, mat(c)); b.position.set(3.0 + i * 0.5, 6.3, -6.3); g.add(b); });
  const rug = plane(5, 3.5, mat('#ff8fb1')); rug.position.set(1.5, 0.02, 0.5); g.add(rug);
  const desk = box(3.6, 0.25, 1.8, mat('#e9e2cf')); desk.position.set(5.5, 2.4, -2); g.add(desk);
  const mon = box(1.8, 1.2, 0.15, mat('#1c1c22')); mon.position.set(5.5, 3.3, -2.6); g.add(mon);
  return { g, hero: new THREE.Vector3(0.5, 0, 0.5), bed: new THREE.Vector3(-4.4, 1.6, -2.6), crowd: { x: [-4, 4], z: [-4, -1], y: 0 }, fog: [40, 120], indoor: true };
};
SETS.kitchen = (o) => {
  const night = o.time === 'night';
  const g = room(o, rep(canvasTex(64, 64, (c) => { c.fillStyle = '#fff3d6'; c.fillRect(0, 0, 64, 64); c.strokeStyle = '#ead9b0'; c.lineWidth = 2; c.strokeRect(0, 0, 64, 64); })), checker('#e8363c', '#ffffff', 8));
  for (let i = 0; i < 4; i++) { const cab = box(2.4, 2.6, 1.8, mat('#ffffff')); cab.position.set(-6 + i * 2.5, 1.3, -6); g.add(cab); const top = box(2.5, 0.2, 1.9, mat('#c98d55')); top.position.set(-6 + i * 2.5, 2.7, -6); g.add(top); }
  const fr = box(2.6, 6, 2.2, mat('#eef1f5')); fr.position.set(5.6, 3, -5.8); g.add(fr); const hd = box(0.15, 1.6, 0.2, mat('#9aa3ad')); hd.position.set(4.6, 3.6, -4.65); g.add(hd);
  const up = box(10, 1.8, 1.0, mat('#ffffff')); up.position.set(-2.3, 6.2, -6.5); g.add(up);
  const win = windowPanel(night, 3.4, 2.2); win.position.set(-2.4, 4.3, -6.88); g.add(win);
  const tb = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 0.25, 20), mat('#c98d55')); tb.position.set(-2.5, 2.4, 1); tb.castShadow = true; g.add(tb);
  const leg = box(0.3, 2.3, 0.3, mat('#9a6034')); leg.position.set(-2.5, 1.15, 1); g.add(leg);
  const pl = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.5, 0.1, 14), mat('#ffffff')); pl.position.set(-2.2, 2.6, 1.3); g.add(pl);
  const lampc = new THREE.Mesh(new THREE.ConeGeometry(0.8, 0.8, 12, 1, true), mat('#2ec4d6')); lampc.position.set(-2.5, 6.5, 1); g.add(lampc);
  return { g, hero: new THREE.Vector3(1.5, 0, 0.5), fridge: new THREE.Vector3(5.6, 3, -5.8), crowd: { x: [-5, 5], z: [-4, -1], y: 0 }, fog: [40, 120], indoor: true };
};
SETS.lab = (o) => {
  const g = new THREE.Group();
  const grid = rep(canvasTex(128, 128, (c) => { c.fillStyle = '#0b1424'; c.fillRect(0, 0, 128, 128); c.strokeStyle = '#18ffb0'; c.lineWidth = 3; c.strokeRect(0, 0, 128, 128); }));
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshBasicMaterial({ map: grid })); fl.geometry.attributes.uv.array.forEach((v, i, a) => a[i] = v * 15); fl.rotation.x = -Math.PI / 2; g.add(fl);
  const wm = mat('#0f2233'); for (const [x, z, ry] of [[0, -14, 0], [-16, 0, Math.PI / 2], [16, 0, -Math.PI / 2]]) { const w = new THREE.Mesh(new THREE.PlaneGeometry(40, 14), wm); w.position.set(x, 7, z); w.rotation.y = ry; g.add(w); }
  for (let i = 0; i < 7; i++) { const s = box(0.3, 10, 0.2, mat(i % 2 ? '#18ffb0' : '#ff3d8b', { basic: true })); s.position.set(-15 + i * 5, 6, -13.8); g.add(s); }
  const base = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.8, 1, 24), mat('#1d2a3d')); base.position.set(0, 0.5, -6); g.add(base);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(3.6, 0.18, 8, 40), mat('#ff3d8b', { basic: true })); ring.rotation.x = Math.PI / 2; ring.position.set(0, 1.05, -6); g.add(ring);
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 7, 24, 1, true), new THREE.MeshLambertMaterial({ color: '#9fffe6', transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false })); glass.position.set(0, 4.5, -6); g.add(glass);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(3.3, 3.3, 0.8, 24), mat('#1d2a3d')); cap.position.set(0, 8.4, -6); g.add(cap);
  const coins = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.35, 0.35, 0.08, 12), new THREE.MeshLambertMaterial({ color: '#ffcf3a', emissive: '#7a5200', emissiveIntensity: .5 }), 160); coins.position.set(0, 0, -6); g.add(coins);
  const con = box(4, 2.6, 2, mat('#1d2a3d')); con.position.set(0, 1.3, 3); g.add(con);
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.8), new THREE.MeshBasicMaterial({ map: labelTex(o.label || 'DISABLE', '#111', '#ffd23f', 512, 128) })); plate.position.set(0, 2.2, 4.02); g.add(plate);
  const btnBase = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.1, 0.4, 20), mat('#2b2b33')); btnBase.position.set(0, 2.8, 3); g.add(btnBase);
  const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.85, 0.5, 20), new THREE.MeshLambertMaterial({ color: '#ff2d3d', emissive: '#ff0018', emissiveIntensity: .45 })); btn.position.set(0, 3.15, 3); btn.castShadow = true; g.add(btn);
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(10, 3), new THREE.MeshBasicMaterial({ map: labelTex(o.screen || '$9,847,310', '#18ffb0', '#06121c', 1024, 300, '#18ffb0') })); scr.position.set(0, 10.5, -13.9); g.add(scr);
  for (const x of [-9, 9]) { const t = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 5, 12), new THREE.MeshLambertMaterial({ color: '#18ffb0', emissive: '#0a8f62', emissiveIntensity: .6, transparent: true, opacity: .55 })); t.position.set(x, 2.5, -8); g.add(t); }
  const pl1 = new THREE.PointLight('#18ffb0', 60, 30); pl1.position.set(-6, 6, 0); g.add(pl1); const pl2 = new THREE.PointLight('#ff3d8b', 60, 30); pl2.position.set(6, 6, -4); g.add(pl2);
  g.userData.tick = (t) => { const M = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
    for (let i = 0; i < 160; i++) { const a = R(i) * 6.28 + t * (0.8 + R(i + 3)), r = 0.4 + R(i + 1) * 2.3, y = 1.4 + ((R(i + 2) * 6 + t * (0.6 + R(i + 4))) % 6.4);
      e.set(t * 3 + i, t * 2 + i * 2, 0); q.setFromEuler(e); M.compose(new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r), q, new THREE.Vector3(1, 1, 1)); coins.setMatrixAt(i, M); }
    coins.instanceMatrix.needsUpdate = true; btn.position.y = 3.15 - (g.userData.pressed ? 0.25 : 0); };
  return { g, hero: new THREE.Vector3(0, 0, 6.5), button: new THREE.Vector3(0, 3.2, 3), machine: new THREE.Vector3(0, 4, -6), crowd: { x: [-10, 10], z: [-2, 4], y: 0 }, fog: [30, 90], indoor: true, dark: true };
};
SETS.office = (o) => {
  const night = o.time === 'night';
  const g = room(o, rep(canvasTex(64, 64, (c) => { c.fillStyle = '#5a3b2b'; c.fillRect(0, 0, 64, 64); c.fillStyle = '#4e3325'; c.fillRect(0, 0, 4, 64); })), planks('#6b4226', '#5d3820'), 18, 14, 10);
  const win = windowPanel(night, 12, 6.5); win.position.set(0, 5.2, -6.88); g.add(win);
  const desk = box(8, 2.4, 3, mat('#3b2416')); desk.position.set(0, 1.2, -2.6); g.add(desk); const top = box(8.4, 0.2, 3.3, mat('#2a1a10')); top.position.set(0, 2.5, -2.6); g.add(top);
  for (let i = 0; i < 4; i++) { const m = box(1.2, 0.5 + i * 0.25, 0.6, mat('#5cbf6b')); m.position.set(-2.8 + i * 0.4, 2.85 + i * 0.12, -2.6 + (i % 2) * 0.5); g.add(m); }
  const np = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.6), new THREE.MeshBasicMaterial({ map: labelTex(o.label || 'THE MAYOR', '#2a1a10', '#f2c14e', 400, 100) })); np.position.set(1.8, 2.9, -1.0); np.rotation.x = -0.3; g.add(np);
  const ch = box(2.6, 4.6, 0.6, mat('#7a1f2b')); ch.position.set(0, 2.3, -4.8); g.add(ch);
  const fp = box(0.15, 7, 0.15, mat('#c9a227')); fp.position.set(7.5, 3.5, -5.5); g.add(fp); const fl = box(2.6, 1.6, 0.06, mat('#2b5cff')); fl.position.set(6.2, 6, -5.5); g.add(fl);
  return { g, hero: new THREE.Vector3(0, 0, 1.5), desk: new THREE.Vector3(0, 0, -4.2), crowd: { x: [-6, 6], z: [-1, 0.5], y: 0 }, fog: [40, 120], indoor: true };
};
SETS.rooftop = (o) => {
  const night = o.time === 'night'; const g = new THREE.Group();
  const rf = box(40, 1, 40, mat('#9aa3ad')); rf.position.y = -0.5; g.add(rf);
  for (const [x, z, w, d] of [[0, -20, 40, 0.8], [0, 20, 40, 0.8], [-20, 0, 0.8, 40], [20, 0, 0.8, 40]]) { const p = box(w, 1.2, d, mat('#c9ced8')); p.position.set(x, 0.6, z); g.add(p); }
  for (let i = 0; i < 3; i++) { const ac = box(3, 2, 3, mat('#dfe3ea')); ac.position.set(-12 + i * 5, 1, -14); g.add(ac); }
  const wt = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 5, 14), mat('#a0643a')); wt.position.set(12, 6, -12); g.add(wt); for (const [x, z] of [[10, -10], [14, -10], [10, -14], [14, -14]]) { const l = box(0.3, 4, 0.3, mat('#333')); l.position.set(x, 2, z); g.add(l); }
  const city = new THREE.Group(); skyline(city, night, 45, 160, 46, 31, -40); g.add(city);
  return { g, hero: new THREE.Vector3(0, 0, 4), crowd: { x: [-14, 14], z: [-10, 2], y: 0 }, fog: [90, 380] };
};
SETS.park = (o) => {
  const night = o.time === 'night'; const g = new THREE.Group();
  g.add(plane(400, 400, mat(night ? '#2f6b3a' : '#6fd36b')));
  const path = plane(6, 200, mat('#e7d3a8')); path.position.y = 0.02; g.add(path);
  const pond = new THREE.Mesh(new THREE.CircleGeometry(9, 28), mat('#5ec3f2')); pond.rotation.x = -Math.PI / 2; pond.position.set(-16, 0.04, -12); g.add(pond);
  for (let i = 0; i < 26; i++) { const t = tree(0.9 + R(i) * 0.5); const s = i % 2 ? 1 : -1; t.position.set(s * (7 + R(i * 3) * 30), 0, 30 - R(i * 5) * 110); g.add(t); }
  const bench = new THREE.Group(); const seat = box(4, 0.3, 1.2, mat('#a0643a')); seat.position.y = 1.2; bench.add(seat); const bk = box(4, 1.2, 0.2, mat('#a0643a')); bk.position.set(0, 2, -0.5); bench.add(bk); for (const x of [-1.7, 1.7]) { const l = box(0.2, 1.2, 1, mat('#333')); l.position.set(x, 0.6, 0); bench.add(l); } bench.position.set(5, 0, -3); bench.rotation.y = -Math.PI / 2; g.add(bench);
  const sky = new THREE.Group(); skyline(sky, night, 150, 230, 24, 41); g.add(sky);
  return { g, hero: new THREE.Vector3(0, 0, 2), crowd: { x: [-12, 12], z: [-25, 0], y: 0 }, fog: [70, 300] };
};
SETS.store = (o) => {
  const g = room(o, rep(canvasTex(64, 64, (c) => { c.fillStyle = '#f4f6fb'; c.fillRect(0, 0, 64, 64); })), checker('#e6e9f0', '#ffffff', 4), 26, 22, 10);
  const cols = ['#e8363c', '#2ec4d6', '#35b56b', '#f2c14e', '#5b8cff', '#ff5c8a', '#ff8a3d'];
  for (let r = 0; r < 3; r++) { const sx = -8 + r * 8; const sh = box(1.4, 5, 12, mat('#dfe3ea')); sh.position.set(sx, 2.5, -4); g.add(sh);
    const inst = new THREE.InstancedMesh(new THREE.BoxGeometry(0.7, 0.9, 0.7), mat('#ffffff'), 80); const M = new THREE.Matrix4();
    for (let i = 0; i < 80; i++) { const side = i % 2 ? 1 : -1, row = Math.floor(i / 2) % 4, col = Math.floor(i / 8); M.makeTranslation(sx + side * 0.95, 0.9 + row * 1.15, -9.4 + col * 1.1); inst.setMatrixAt(i, M); inst.setColorAt(i, new THREE.Color(cols[(i * 7 + r) % 7])); }
    g.add(inst); }
  const ctr = box(6, 2.4, 2, mat('#2b5cff')); ctr.position.set(6, 1.2, 4); g.add(ctr);
  const reg = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.2, 1.2), mat('#1c1c22')); reg.position.set(6, 3, 4); g.add(reg);
  const ban = new THREE.Mesh(new THREE.PlaneGeometry(12, 2.4), new THREE.MeshBasicMaterial({ map: labelTex(o.label || 'MEGA SALE', '#fff', '#e8363c', 1024, 200) })); ban.position.set(0, 8, -10.9); g.add(ban);
  for (let i = 0; i < 4; i++) { const l = box(4, 0.2, 1, mat('#ffffff', { basic: true })); l.position.set(-9 + i * 6, 9.9, 0); g.add(l); }
  return { g, hero: new THREE.Vector3(0, 0, 4), crowd: { x: [-10, 10], z: [-8, 2], y: 0 }, fog: [40, 140], indoor: true };
};

// ---------- sky ----------
const SKY = { day: ['#3fa9ff', '#cdeeff', '#ffffff'], sunset: ['#4b3fa8', '#ff9a6b', '#ffd2a1'], night: ['#060b22', '#1d2f66', '#2d3a6b'] };
export function makeSky() {
  const m = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, uniforms: { top: { value: new THREE.Color() }, mid: { value: new THREE.Color() } },
    vertexShader: 'varying vec3 vp; void main(){ vp = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);} ',
    fragmentShader: 'uniform vec3 top; uniform vec3 mid; varying vec3 vp;\nvoid main(){ float h = normalize(vp).y; vec3 c = mix(mid, top, smoothstep(0.0, 0.55, h)); gl_FragColor = vec4(c,1.0);\n#include <colorspace_fragment>\n}' });
  const s = new THREE.Mesh(new THREE.SphereGeometry(900, 24, 12), m); s.userData.set = (time) => { const k = SKY[time] || SKY.day; m.uniforms.top.value.set(k[0]); m.uniforms.mid.value.set(k[1]); }; return s;
}
export const SKYCOL = SKY;

// ---------- props ----------
export function makeProp(p) {
  const g = new THREE.Group(); g.userData.p = p;
  switch (p.type) {
    case 'tag': { const m = new THREE.Mesh(new THREE.PlaneGeometry(p.w || 3.2, (p.w || 3.2) * 0.45), new THREE.MeshBasicMaterial({ map: labelTex(p.text, '#fff', p.color || '#ff4f7b', 512, 230), transparent: true })); g.add(m); g.userData.face = true; break; }
    case 'sign': case 'screen': { const w = p.w || 8, h = p.h || 4.5; const pan = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: labelTex(p.text, p.fg || '#fff', p.color || '#1c2a4a', 1024, Math.round(1024 * h / w), p.border || '#ffd23f') })); pan.position.y = p.type === 'sign' ? h / 2 + 3 : 0; g.add(pan);
      const bk = box(w + 0.3, h + 0.3, 0.3, mat('#2b2b33')); bk.position.set(0, pan.position.y, -0.2); g.add(bk);
      if (p.type === 'sign') for (const x of [-w / 3, w / 3]) { const pl = box(0.3, 3, 0.3, mat('#2b2b33')); pl.position.set(x, 1.5, -0.2); g.add(pl); } break; }
    case 'drone': { const b = box(1.4, 0.4, 1.4, mat('#2b2b33')); g.add(b); for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const arm = box(0.15, 0.15, 0.15, mat('#2b2b33')); arm.position.set(x * .8, 0.2, z * .8); g.add(arm); const r = box(1.1, 0.05, 0.15, mat('#c9ced8')); r.position.set(x * .8, 0.3, z * .8); r.userData.spin = true; g.add(r); }
      if (p.text) { const s = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.2), new THREE.MeshBasicMaterial({ map: labelTex(p.text, '#fff', p.color || '#e8363c', 512, 236) })); s.position.set(0, -0.9, 0.2); g.add(s); } break; }
    case 'car': { g.add(car(p.color || '#e8363c')); break; }
    case 'sun': { const s = new THREE.Mesh(new THREE.SphereGeometry(6, 24, 16), new THREE.MeshBasicMaterial({ color: '#ffd23f' })); g.add(s);
      const face = new THREE.Mesh(new THREE.CircleGeometry(5.2, 24), new THREE.MeshBasicMaterial({ transparent: true, map: canvasTex(256, 256, (c) => { c.fillStyle = '#1b1b24'; c.fillRect(40, 80, 80, 40); c.fillRect(136, 80, 80, 40); c.fillRect(110, 86, 36, 10); c.lineWidth = 12; c.strokeStyle = '#1b1b24'; c.beginPath(); c.arc(128, 150, 50, 0.2 * Math.PI, 0.8 * Math.PI); c.stroke(); }) })); face.position.z = 6.01; g.add(face);
      for (let i = 0; i < 12; i++) { const r = box(0.8, 3, 0.4, mat('#ffb21f', { basic: true })); const a = i / 12 * Math.PI * 2; r.position.set(Math.cos(a) * 8, Math.sin(a) * 8, 0); r.rotation.z = a - Math.PI / 2; g.add(r); } g.userData.spinZ = 0.3; break; }
    case 'thermostat': { const b = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 0.4, 28), mat('#f4f4f4')); b.rotation.x = Math.PI / 2; g.add(b); const s = new THREE.Mesh(new THREE.CircleGeometry(1.1, 28), new THREE.MeshBasicMaterial({ map: labelTex(p.text || '72°', '#fff', '#ff6a3d', 256, 256) })); s.position.z = 0.21; g.add(s); break; }
    case 'speaker': { const pl = box(0.3, 8, 0.3, mat('#2f3747')); pl.position.y = 4; g.add(pl); const c = new THREE.Mesh(new THREE.ConeGeometry(1, 1.8, 12, 1, true), mat('#c9ced8')); c.rotation.x = Math.PI / 2; c.position.set(0, 8, 0.8); g.add(c); break; }
    case 'money': { for (let i = 0; i < (p.n || 6); i++) { const m = box(1.4, 0.6, 0.7, mat('#5cbf6b')); m.position.set((R(i) - .5) * 2, 0.3 + Math.floor(i / 3) * 0.62, (R(i + 9) - .5) * 1.4); g.add(m); } break; }
    case 'fridge': { const b = box(2.6, 6, 2.2, mat('#eef1f5')); b.position.y = 3; g.add(b); const h = box(0.15, 1.6, 0.2, mat('#9aa3ad')); h.position.set(-1, 3.6, 1.15); g.add(h);
      if (p.text) { const s = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 0.9), new THREE.MeshBasicMaterial({ map: labelTex(p.text, '#fff', p.color || '#e8363c', 512, 230) })); s.position.set(0, 4.8, 1.12); g.add(s); } break; }
    case 'vault': { const d = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 0.8, 32), mat('#9aa3ad')); d.rotation.x = Math.PI / 2; d.position.y = 3.4; g.add(d); const w = new THREE.Mesh(new THREE.TorusGeometry(1, 0.15, 6, 16), mat('#5a6270')); w.position.set(0, 3.4, 0.45); w.userData.spinZ = 1; g.add(w); break; }
    case 'ice': { const c = new THREE.Mesh(new THREE.BoxGeometry(3, 5.5, 2.4), new THREE.MeshLambertMaterial({ color: '#bfefff', transparent: true, opacity: 0.45, depthWrite: false })); c.position.y = 2.7; g.add(c); break; }
    case 'bed': { const b = box(4.2, 1.2, 7, mat('#ffffff')); b.position.y = 0.6; g.add(b); const bl = box(4.3, 0.4, 4.4, mat(p.color || '#5b8cff')); bl.position.set(0, 1.3, 1.1); g.add(bl); break; }
    case 'gold': { for (let i = 0; i < (p.n || 40); i++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.08, 10), mat('#ffcf3a')); c.position.set((R(i) - .5) * 4, R(i + 1) * 1.2, (R(i + 2) - .5) * 4); c.rotation.set(R(i + 3) * 3, 0, R(i + 4) * 3); g.add(c); } break; }
    default: { const b = box(1, 1, 1, mat('#ff00ff')); g.add(b); }
  }
  g.traverse(o => { if (o.isMesh && !o.material.transparent) o.castShadow = true; });
  return g;
}
export function animProp(g, lt, cam) {
  const p = g.userData.p; const k = back(lt / 0.35);
  if (p.type === 'tag') { g.scale.setScalar(Math.max(0.001, k)); g.position.y = g.userData.y0 + Math.sin(lt * 3) * 0.15; }
  if (p.type === 'drone') { g.position.y = g.userData.y0 + Math.sin(lt * 2 + g.userData.y0) * 0.3; g.children.forEach(c => { if (c.userData.spin) c.rotation.y = lt * 40; }); }
  if (p.type === 'car') { g.position.z = g.userData.z0 + lt * (p.speed || 14); }
  if (g.userData.face && cam) g.quaternion.copy(cam.quaternion);
  if (g.userData.spinZ) g.rotation.z = lt * g.userData.spinZ;
  g.children.forEach(c => { if (c.userData.spinZ) c.rotation.z = lt * c.userData.spinZ; });
  if (p.move) { g.position.x = g.userData.x0 + p.move[0] * lt; g.position.z = g.userData.z0 + p.move[1] * lt; }
}

// ---------- particles ----------
export class FX {
  constructor(scene) {
    this.coin = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.3, 0.3, 0.07, 10), new THREE.MeshLambertMaterial({ color: '#ffcf3a', emissive: '#6b4a00', emissiveIntensity: .4 }), 60);
    this.conf = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.3, 0.5), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }), 140);
    const cc = ['#ff5c8a', '#ffd23f', '#2ec4d6', '#35b56b', '#9b64b8', '#ff8a3d']; for (let i = 0; i < 140; i++) this.conf.setColorAt(i, new THREE.Color(cc[i % 6]));
    this.snow = new THREE.InstancedMesh(new THREE.BoxGeometry(0.16, 0.16, 0.16), new THREE.MeshBasicMaterial({ color: '#ffffff' }), 400);
    this.rain = new THREE.InstancedMesh(new THREE.BoxGeometry(0.04, 0.9, 0.04), new THREE.MeshBasicMaterial({ color: '#bfe3ff', transparent: true, opacity: 0.7 }), 400);
    this.bill = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.9, 0.42), new THREE.MeshLambertMaterial({ color: '#7ad67f', side: THREE.DoubleSide }), 80);
    this.zz = new THREE.Group(); for (let i = 0; i < 3; i++) { const z = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), new THREE.MeshBasicMaterial({ transparent: true, map: canvasTex(128, 128, (c) => { c.fillStyle = '#ffffff'; c.strokeStyle = '#1b1b24'; c.lineWidth = 10; c.font = '700 110px Fredoka'; c.textAlign = 'center'; c.strokeText('Z', 64, 104); c.fillText('Z', 64, 104); }) })); this.zz.add(z); }
    this.mark = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6), new THREE.MeshBasicMaterial({ transparent: true, map: canvasTex(128, 128, (c) => { c.fillStyle = '#ffd23f'; c.strokeStyle = '#1b1b24'; c.lineWidth = 10; c.font = '700 120px Fredoka'; c.textAlign = 'center'; c.strokeText('!', 64, 110); c.fillText('!', 64, 110); }) }));
    this.qm = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6), new THREE.MeshBasicMaterial({ transparent: true, map: canvasTex(128, 128, (c) => { c.fillStyle = '#ffffff'; c.strokeStyle = '#1b1b24'; c.lineWidth = 10; c.font = '700 120px Fredoka'; c.textAlign = 'center'; c.strokeText('?', 64, 110); c.fillText('?', 64, 110); }) }));
    this.all = [this.coin, this.conf, this.snow, this.rain, this.bill, this.zz, this.mark, this.qm]; this.all.forEach(o => { o.visible = false; o.frustumCulled = false; scene.add(o); });
  }
  update(list, lt, origin, cam, head) {
    const on = new Set(list || []); const M = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), s1 = new THREE.Vector3(1, 1, 1);
    this.coin.visible = on.has('coins'); this.conf.visible = on.has('confetti'); this.snow.visible = on.has('snow'); this.rain.visible = on.has('rain'); this.bill.visible = on.has('cash');
    this.zz.visible = on.has('zzz'); this.mark.visible = on.has('alert'); this.qm.visible = on.has('question');
    if (this.coin.visible) { for (let i = 0; i < 60; i++) { const tt = (lt + R(i) * 0.4) % 1.6; const vx = (R(i + 1) - .5) * 8, vy = 6 + R(i + 2) * 6, vz = (R(i + 3) - .5) * 8;
      v.set(origin.x + vx * tt, origin.y + vy * tt - 9.8 * tt * tt, origin.z + vz * tt); e.set(tt * 9 + i, tt * 7, 0); q.setFromEuler(e); M.compose(v, q, s1); this.coin.setMatrixAt(i, M); } this.coin.instanceMatrix.needsUpdate = true; }
    if (this.conf.visible) { for (let i = 0; i < 140; i++) { const y = origin.y + 12 - ((lt * (2 + R(i) * 2) + R(i + 5) * 14) % 14); v.set(origin.x + (R(i + 1) - .5) * 18 + Math.sin(lt * 2 + i) * .6, y, origin.z + (R(i + 2) - .5) * 12);
      e.set(lt * 5 + i, lt * 3 + i, 0); q.setFromEuler(e); M.compose(v, q, s1); this.conf.setMatrixAt(i, M); } this.conf.instanceMatrix.needsUpdate = true; }
    if (this.snow.visible) { for (let i = 0; i < 400; i++) { const y = origin.y + 14 - ((lt * (1.2 + R(i) * 1.2) + R(i + 5) * 16) % 16) - 2; v.set(cam.position.x + (R(i + 1) - .5) * 30 + Math.sin(lt + i) * .5, y, cam.position.z - 2 - R(i + 2) * 24); M.compose(v, q.identity(), s1); this.snow.setMatrixAt(i, M); } this.snow.instanceMatrix.needsUpdate = true; }
    if (this.rain.visible) { for (let i = 0; i < 400; i++) { const y = origin.y + 14 - ((lt * (16 + R(i) * 6) + R(i + 5) * 16) % 16) - 2; v.set(cam.position.x + (R(i + 1) - .5) * 30, y, cam.position.z - 2 - R(i + 2) * 24); M.compose(v, q.identity(), s1); this.rain.setMatrixAt(i, M); } this.rain.instanceMatrix.needsUpdate = true; }
    if (this.bill.visible) { for (let i = 0; i < 80; i++) { const y = origin.y + 10 - ((lt * (1.5 + R(i) * 1.5) + R(i + 5) * 12) % 12); v.set(origin.x + (R(i + 1) - .5) * 14 + Math.sin(lt * 2 + i) * 1.2, y, origin.z + (R(i + 2) - .5) * 10);
      e.set(Math.sin(lt * 3 + i) * 1.2, lt * 2 + i, Math.cos(lt * 2 + i)); q.setFromEuler(e); M.compose(v, q, s1); this.bill.setMatrixAt(i, M); } this.bill.instanceMatrix.needsUpdate = true; }
    if (this.zz.visible) this.zz.children.forEach((z, i) => { const tt = (lt * 0.6 + i / 3) % 1; z.position.set(head.x + 0.6 + tt * 1.2, head.y + 0.8 + tt * 2.2, head.z); z.scale.setScalar(0.5 + tt); z.material.opacity = 1 - tt; z.quaternion.copy(cam.quaternion); });
    for (const m of [this.mark, this.qm]) if (m.visible) { const k = back(lt / 0.3); m.position.set(head.x, head.y + 1.6 + Math.sin(lt * 5) * 0.08, head.z); m.scale.setScalar(Math.max(0.01, k)); m.quaternion.copy(cam.quaternion); }
  }
}
