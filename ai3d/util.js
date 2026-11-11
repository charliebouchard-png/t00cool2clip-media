import * as THREE from './vendor/three.module.js';
const MATS = new Map();
export function mat(color, o = {}) {
  const key = color + JSON.stringify(o); if (MATS.has(key)) return MATS.get(key);
  const m = o.basic ? new THREE.MeshBasicMaterial(Object.assign({ color }, o.p || {})) : new THREE.MeshLambertMaterial(Object.assign({ color }, o.p || {}));
  MATS.set(key, m); return m;
}
const BOXG = new Map();
export function box(w, h, d, m) {
  const k = w + ',' + h + ',' + d; let g = BOXG.get(k); if (!g) { g = new THREE.BoxGeometry(w, h, d); BOXG.set(k, g); }
  const b = new THREE.Mesh(g, m); b.castShadow = true; b.receiveShadow = true; return b;
}
export function R(i) { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
export const cl = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const ease = (p) => 1 - Math.pow(1 - cl(p), 3);
export const eio = (p) => { p = cl(p); return p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; };
export const back = (p) => { p = cl(p); const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2); };
export function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); draw(g, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
