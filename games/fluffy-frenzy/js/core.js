// Cong cu dung chung: toan hoc, vat lieu, nhieu (noise), cat ban kinh (clip)
import * as THREE from 'three';
export { THREE };
export const V3 = THREE.Vector3;
export const rand = (a, b) => a + Math.random() * (b - a);
export const randInt = (a, b) => Math.floor(rand(a, b + 1));
export const pick = arr => arr[Math.floor(Math.random() * arr.length)];
export const hyp = (x, z) => Math.hypot(x, z);
export const clampN = (v, a, b) => Math.max(a, Math.min(b, v));
export const smoothstep = (a, b, x) => { const t = clampN((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
export const lerpAngle = (a, b, t) => { const d = (((b - a + Math.PI) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI) - Math.PI; return a + d * t; };

// ---- vat lieu toon (dung cho do vat, san khau menu) ----
export const GRAD = new THREE.DataTexture(new Uint8Array([105, 185, 255]), 3, 1, THREE.RedFormat);
GRAD.minFilter = GRAD.magFilter = THREE.NearestFilter; GRAD.needsUpdate = true;
const matCache = new Map();
export const toon = c => { if (!matCache.has(c)) matCache.set(c, new THREE.MeshToonMaterial({ color:c, gradientMap:GRAD })); return matCache.get(c); };
export const OUTLINE = new THREE.MeshBasicMaterial({ color:0x2b1a12, side:THREE.BackSide });
export function part(geo, color, opt = {}) {
  const m = new THREE.Mesh(geo, toon(color));
  m.castShadow = opt.shadow !== false; m.receiveShadow = !!opt.receive;
  if (opt.outline !== false) { const o = new THREE.Mesh(geo, OUTLINE); o.scale.setScalar(opt.ow || 1.07); m.add(o); }
  return m;
}
export function put(parent, m, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) { m.position.set(x, y, z); m.rotation.set(rx, ry, rz); parent.add(m); return m; }

export function canvasTex(size, draw, repeat = 1, srgb = true) {
  const c = document.createElement('canvas'); c.width = c.height = size; draw(c.getContext('2d'), size);
  const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat, repeat); t.anisotropy = 8; return t;
}

// ---- nhieu gia tri 2D (value noise) nhieu tang ----
export function makeNoise(seed = 1) {
  const hsh = (i, j) => { const v = Math.sin(i * 127.1 + j * 311.7 + seed * 17.3) * 43758.5453; return v - Math.floor(v); };
  const sm = t => t * t * (3 - 2 * t);
  const n = (x, z) => {
    const i = Math.floor(x), j = Math.floor(z), fx = sm(x - i), fz = sm(z - j);
    const a = hsh(i, j), b = hsh(i + 1, j), c = hsh(i, j + 1), d = hsh(i + 1, j + 1);
    return (a + (b - a) * fx + (c - a) * fz + (a - b - c + d) * fx * fz) * 2 - 1;
  };
  return (x, z, oct = 3) => { let s = 0, amp = 1, f = 1, tot = 0; for (let o = 0; o < oct; o++) { s += n(x * f + o * 31.7, z * f - o * 17.1) * amp; tot += amp; amp *= 0.5; f *= 2; } return s / tot; };
}

// lam meo hinh khoi (cung vi tri -> cung do lech, khong bi rach mat)
export function lumpy(geo, amt) {
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const k = 1 + amt * (Math.sin(x * 3.1 + y * 2.3) * Math.cos(z * 2.7 - x * 1.3) + 0.5 * Math.sin(y * 5.1 + z * 4.3));
    p.setXYZ(i, x * k, y * k, z * k);
  }
  geo.computeVertexNormals(); return geo;
}

// ---- cat bo moi thu ngoai ban kinh R (san co lai o che do Dau truong) ----
export const CLIP = { value:999 };
export function clipped(mat, extra) {
  mat.onBeforeCompile = sh => {
    sh.uniforms.uClipR = CLIP;
    sh.vertexShader = 'varying vec3 vWPos;\n' + sh.vertexShader.replace('#include <project_vertex>', `#include <project_vertex>
      #ifdef USE_INSTANCING
        vWPos = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;
      #else
        vWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
      #endif`);
    sh.fragmentShader = 'uniform float uClipR;\nvarying vec3 vWPos;\n' + sh.fragmentShader.replace('void main() {', 'void main() {\n  if (length(vWPos.xz) > uClipR) discard;');
    if (extra) extra(sh);
  };
  return mat;
}

// ---- nhieu 3D muot (cho da, tan cay khong bi goc canh) ----
export function makeNoise3(seed = 1) {
  const hsh = (i, j, k) => { const v = Math.sin(i * 127.1 + j * 311.7 + k * 74.7 + seed * 17.3) * 43758.5453; return v - Math.floor(v); };
  const sm = t => t * t * (3 - 2 * t), L = (a, b, t) => a + (b - a) * t;
  return (x, y, z) => {
    const i = Math.floor(x), j = Math.floor(y), k = Math.floor(z), fx = sm(x - i), fy = sm(y - j), fz = sm(z - k);
    const c = (a, b, d) => hsh(i + a, j + b, k + d);
    return L(L(L(c(0, 0, 0), c(1, 0, 0), fx), L(c(0, 1, 0), c(1, 1, 0), fx), fy), L(L(c(0, 0, 1), c(1, 0, 1), fx), L(c(0, 1, 1), c(1, 1, 1), fx), fy), fz) * 2 - 1;
  };
}
const N3 = makeNoise3(11);
// bien dang hinh cau/tru theo nhieu 3D muot (luoi co chi so -> phap tuyen muot)
export function displace(geo, amt, freq = 1.5, oct = 2) {
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    let n = 0, a = 1, f = freq, t = 0;
    for (let o = 0; o < oct; o++) { n += N3(x * f + o * 7.1, y * f - o * 3.3, z * f) * a; t += a; a *= 0.5; f *= 2; }
    const k = 1 + amt * n / t; p.setXYZ(i, x * k, y * k, z * k);
  }
  geo.computeVertexNormals(); return geo;
}
// phap tuyen huong ra tu tam tan cay -> anh sang mem nhu mot khoi bong
export function fluffNormals(geo, center, mix = 0.72) {
  const p = geo.attributes.position, n = geo.attributes.normal, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.set(p.getX(i) - center.x, p.getY(i) - center.y, p.getZ(i) - center.z).normalize();
    v.multiplyScalar(mix).add(new THREE.Vector3(n.getX(i), n.getY(i), n.getZ(i)).multiplyScalar(1 - mix)).normalize();
    n.setXYZ(i, v.x, v.y, v.z);
  }
  n.needsUpdate = true; return geo;
}
// normal map song nuoc (lap lai lien mach)
export function waterNormalTex() {
  const S = 256, c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d'), img = g.createImageData(S, S), T = 6.2831853;
  const h = (x, y) => Math.sin(x / S * T * 3 + Math.sin(y / S * T * 2) * 1.2) * 0.5 + Math.sin(y / S * T * 5 + x / S * T * 2) * 0.3 + Math.sin((x + y) / S * T * 7) * 0.2;
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const dx = h(x + 1, y) - h(x - 1, y), dy = h(x, y + 1) - h(x, y - 1), l = Math.hypot(dx * 3, dy * 3, 1), o = (y * S + x) * 4;
    img.data[o] = (-dx * 3 / l * 0.5 + 0.5) * 255; img.data[o + 1] = (-dy * 3 / l * 0.5 + 0.5) * 255; img.data[o + 2] = (1 / l * 0.5 + 0.5) * 255; img.data[o + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 3); return t;
}
