// Ban do co dia hinh that: Doi Co, Nha May Keo, Nui Lua
import { THREE, V3, rand, pick, hyp, clampN, smoothstep, makeNoise, canvasTex, lumpy, put, CLIP, clipped, displace, fluffNormals, waterNormalTex } from './core.js';

export const MAP_LIST = [
  { id:'meadow',  vn:'Đồi Cỏ',      desc:'Đồi cỏ lượn sóng, cao nguyên phải nhảy lên, hồ nước làm đi chậm.' },
  { id:'candy',   vn:'Nhà Máy Kẹo', desc:'Sàn kẹo nhiều tầng có dốc, băng chuyền đẩy người, kẹo mút chắn đường.' },
  { id:'volcano', vn:'Núi Lửa',     desc:'Đá gồ ghề, hồ dung nham chết người, mưa thiên thạch.' },
];
export const R0 = 17;
export const FLAG_SPOTS = [['A', -9, 0], ['B', 0, 0], ['C', 9, 0]];
export const BASES = { red:[0, 13], blue:[0, -13] };
const KEY = [[-9, 0], [0, 0], [9, 0], [0, 13], [0, -13]];
function segDist(x, z, x0, z0, x1, z1) {
  const dx = x1 - x0, dz = z1 - z0, l2 = dx * dx + dz * dz;
  const t = clampN(((x - x0) * dx + (z - z0) * dz) / l2, 0, 1);
  return hyp(x - (x0 + dx * t), z - (z0 + dz * t));
}

function gradTex(stops) {
  return canvasTex(256, (g, s) => { const gr = g.createLinearGradient(0, 0, 0, s); stops.forEach(([o, c]) => gr.addColorStop(o, c)); g.fillStyle = gr; g.fillRect(0, 0, s, s); }, 1);
}
const stdMat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness:0.9, metalness:0, ...o });
// vat lieu dung chung cho cay, da (tao 1 lan)
let _M = null;
function M() {
  if (_M) return _M;
  const speck = (bg, cols, n, r0, r1) => canvasTex(256, (g, s) => { g.fillStyle = bg; g.fillRect(0, 0, s, s); for (let i = 0; i < n; i++) { g.fillStyle = pick(cols); g.beginPath(); g.ellipse(Math.random() * s, Math.random() * s, rand(r0, r1), rand(r0, r1) * 0.6, rand(0, 3), 0, 6.28); g.fill(); } }, 2);
  const leafTex = speck('#ffffff', ['#d9e6cf', '#c4d6b5', '#f4fff0', '#b5c9a3'], 900, 2, 6);
  const bark = canvasTex(256, (g, s) => { g.fillStyle = '#c9b8a6'; g.fillRect(0, 0, s, s); for (let i = 0; i < 140; i++) { g.strokeStyle = pick(['#8c7560', '#a8927c', '#e2d4c4']); g.lineWidth = rand(1, 4); const x = Math.random() * s; g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + rand(-8, 8), s * 0.3, x + rand(-8, 8), s * 0.7, x + rand(-4, 4), s); g.stroke(); } }, 1);
  bark.repeat.set(2, 1);
  const rockBump = canvasTex(256, (g, s) => { g.fillStyle = '#808080'; g.fillRect(0, 0, s, s); for (let i = 0; i < 1800; i++) { const l = 60 + Math.random() * 140 | 0; g.fillStyle = `rgba(${l},${l},${l},0.6)`; g.beginPath(); g.arc(Math.random() * s, Math.random() * s, rand(1, 4), 0, 6.28); g.fill(); } }, 2, false);
  _M = {
    leaf:new THREE.MeshStandardMaterial({ vertexColors:true, roughness:0.82, map:leafTex }),
    rock:new THREE.MeshStandardMaterial({ vertexColors:true, roughness:0.9, bumpMap:rockBump, bumpScale:2.5 }),
    bark:new THREE.MeshStandardMaterial({ color:0x7a5a40, roughness:1, map:bark }),
    deadBark:new THREE.MeshStandardMaterial({ color:0x3a302c, roughness:1, map:bark }),
    rockBump,
  };
  return _M;
}

export class World {
  constructor(scene, lights) {
    this.scene = scene; this.L = lights; this.group = null; this.R = R0; this.time = 0;
  }
  dispose() {
    if (!this.group) return;
    this.scene.remove(this.group);
    this.group.traverse(o => { if (o.geometry) o.geometry.dispose(); });
    this.group = null;
  }
  build(id) {
    this.dispose();
    this.id = id; this.group = new THREE.Group(); this.scene.add(this.group);
    this.cols = []; this.props = []; this.conveyors = []; this.meteors = []; this.smokes = [];
    this.levelMode = false; this.R0 = R0; this.solids = []; this.walls = []; this.waters = []; this.waterMeshes = []; this.spray = null; this.spots = null;
    this.paths = null; this.water = null; this.waterMesh = null; this.lavaLevel = null; this.lavaTex = null; this.convTex = null; this.uTime = null;
    this.groundMap = this.groundBump = this.cliffMap = null; this.eruptT = rand(9, 13); this.smokeT = 0;
    this.noise = makeNoise(id === 'meadow' ? 7 : id === 'volcano' ? 3 : 5);
    this['build_' + id]();
    if (!this.levelMode) this.buildTerrain();
    this.setR(this.R0);
  }
  setR(R) { this.R = R; CLIP.value = R; }
  applyEnv() {
    const e = this.env, L = this.L;
    this.scene.background = e.sky; this.scene.fog = new THREE.Fog(e.fog, e.fogNear, e.fogFar);
    L.sun.color.set(e.sun); L.sun.intensity = e.sunI;
    L.hemi.color.set(e.hemiSky); L.hemi.groundColor.set(e.hemiGround); L.hemi.intensity = e.hemiI;
    L.rim.color.set(e.rim); L.rim.intensity = e.rimI;
    this.scene.environmentIntensity = e.envI;
  }

  // ---------- truy van dia hinh ----------
  groundAt(x, z, y) {
    if (hyp(x, z) > this.R) return null;
    let g = this.h(x, z);
    if (g < -50) return null;
    for (const c of this.cols) if (c.stand && !c.dead && (x - c.x) ** 2 + (z - c.z) ** 2 < c.r * c.r && c.top <= y + 0.65 && c.top > g) g = c.top;
    return g;
  }
  collide(pos, rad = 0.5) {
    for (const w of this.walls) {
      if (pos.y >= w.top - 0.35 || pos.y + 1.6 < w.base) continue;
      const dx = w.x1 - w.x0, dz = w.z1 - w.z0, l2 = dx * dx + dz * dz || 1;
      const t = clampN(((pos.x - w.x0) * dx + (pos.z - w.z0) * dz) / l2, 0, 1);
      const cx = w.x0 + dx * t, cz = w.z0 + dz * t, mn = w.th / 2 + rad;
      let ex = pos.x - cx, ez = pos.z - cz, d = hyp(ex, ez);
      if (d < mn) { if (d < 1e-4) { ex = -dz; ez = dx; d = Math.sqrt(l2); } pos.x = cx + ex / d * mn; pos.z = cz + ez / d * mn; }
    }
    for (const c of this.cols) {
      if (c.dead || (c.stand && pos.y >= c.top - 0.65)) continue;
      const dx = pos.x - c.x, dz = pos.z - c.z, d = hyp(dx, dz), m = c.r + rad;
      if (d < m && d > 0.0001) { pos.x = c.x + dx / d * m; pos.z = c.z + dz / d * m; }
    }
  }
  hazard(x, z) {
    if (this.lavaLevel !== null && this.h(x, z) < this.lavaLevel) return 'lava';
    if (this.water && this.h(x, z) < this.water.level - 0.05) return 'water';
    for (const w of this.waters) if (hyp(x - w.x, z - w.z) < w.r - 0.2) return 'water';
    return null;
  }
  conveyorAt(x, z, y) {
    if (y > 0.3) return null;
    for (const c of this.conveyors) if (x > c.x0 && x < c.x1 && z > c.z0 && z < c.z1) return c;
    return null;
  }
  slope(x, z) { const e = 0.3; return hyp(this.h(x + e, z) - this.h(x - e, z), this.h(x, z + e) - this.h(x, z - e)) / (2 * e); }
  randomSpot(maxR, minR = 0) {
    for (let i = 0; i < 80; i++) {
      const a = rand(0, 6.283), r = Math.sqrt(rand((minR / maxR) ** 2, 1)) * maxR, x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (this.h(x, z) < -50 || this.hazard(x, z) || this.slope(x, z) > 0.8) continue;
      if (this.cols.some(c => !c.dead && !c.stand && hyp(x - c.x, z - c.z) < c.r + 0.8)) continue;
      return new V3(x, this.groundAt(x, z, 99) ?? this.h(x, z), z);
    }
    return new V3(0, this.h(0, 0), 0);
  }
  freeSpot(minR, maxR, gap = 2.2, keyGap = 3.6, extra) {
    for (let i = 0; i < 120; i++) {
      const a = rand(0, 6.283), r = rand(minR, maxR), x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (KEY.some(([kx, kz]) => hyp(x - kx, z - kz) < keyGap)) continue;
      if (this.props.some(p => hyp(x - p.x, z - p.z) < gap)) continue;
      if (this.hazard(x, z) || this.slope(x, z) > 0.9) continue;
      if (extra && !extra(x, z)) continue;
      return [x, z];
    }
    return null;
  }
  addProp(g, x, z, col) { this.group.add(g); const p = { g, x, z, vy:0, col }; if (col) this.cols.push(col); this.props.push(p); return p; }

  // ---------- luoi dia hinh + vach da ----------
  buildTerrain() {
    const S = R0 + 1, N = 180;
    const geo = new THREE.PlaneGeometry(S * 2, S * 2, N, N); geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) pos.setY(i, this.h(pos.getX(i), pos.getZ(i)));
    geo.computeVertexNormals();
    const nrm = geo.attributes.normal, col = new Float32Array(pos.count * 3), c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) { this.colorAt(pos.getX(i), pos.getY(i), pos.getZ(i), nrm.getY(i), c); col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const mat = clipped(new THREE.MeshStandardMaterial({ vertexColors:true, roughness:0.95, map:this.groundMap || null, bumpMap:this.groundBump || null, bumpScale:1 }));
    const ground = new THREE.Mesh(geo, mat); ground.receiveShadow = true; this.group.add(ground);
    // vach da xung quanh dao
    const sk = new THREE.CylinderGeometry(R0, R0 * 0.6, 7, 120, 7, true), sp = sk.attributes.position;
    for (let i = 0; i < sp.count; i++) {
      const x = sp.getX(i), y = sp.getY(i), z = sp.getZ(i);
      if (y > 3.4) sp.setY(i, this.h(x * 0.995, z * 0.995) - 0.02);
      else { const k = 1 + this.noise(x * 0.4, y * 0.5 + z * 0.4) * 0.07; sp.setXYZ(i, x * k, y - 3.6, z * k); }
    }
    sk.computeVertexNormals();
    const skc = new Float32Array(sp.count * 3), cc = new THREE.Color(this.cliffColor), t2 = new THREE.Color(), grassEdge = new THREE.Color(0x4f7a32);
    for (let i = 0; i < sp.count; i++) {
      const x = sp.getX(i), yy = sp.getY(i), z = sp.getZ(i);
      const band = 0.8 + Math.sin(yy * 2.6 + this.noise(x * 0.2, z * 0.2) * 3) * 0.1 + this.noise(x * 0.7, yy * 1.4 + z * 0.7) * 0.1;
      t2.copy(cc).multiplyScalar(band);
      if (this.id === 'meadow') t2.lerp(grassEdge, smoothstep(-0.7, 0.15, yy) * 0.85);
      skc[i * 3] = t2.r; skc[i * 3 + 1] = t2.g; skc[i * 3 + 2] = t2.b;
    }
    sk.setAttribute('color', new THREE.BufferAttribute(skc, 3));
    const cliffMat = clipped(new THREE.MeshStandardMaterial({ vertexColors:true, roughness:1, map:this.cliffMap || null, bumpMap:M().rockBump, bumpScale:3 }));
    const skirt = new THREE.Mesh(sk, cliffMat); skirt.receiveShadow = true; this.group.add(skirt);
    const underMat = clipped(new THREE.MeshStandardMaterial({ color:new THREE.Color(this.cliffColor).multiplyScalar(0.7), roughness:1, bumpMap:M().rockBump, bumpScale:3 }));
    const under = new THREE.Mesh(displace(new THREE.ConeGeometry(R0 * 0.6, 10, 40, 8), 0.06, 0.25, 2), underMat); under.rotation.x = Math.PI; under.position.y = -12; this.group.add(under);
  }

  // ---------- co (instanced, lay theo gio) ----------
  buildGrass(count, ok, hs = 1) {
    const blade = new THREE.PlaneGeometry(0.09, 0.55, 1, 4); blade.translate(0, 0.275, 0);
    const p = blade.attributes.position, cols = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i) / 0.55; p.setX(i, p.getX(i) * (1 - y * 0.85)); p.setZ(i, y * y * 0.12);
      const v = 0.35 + y * 0.65; cols[i * 3] = v; cols[i * 3 + 1] = v; cols[i * 3 + 2] = v;
    }
    blade.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    const n = blade.attributes.normal; for (let i = 0; i < n.count; i++) n.setXYZ(i, 0, 1, 0);
    const uTime = this.uTime = { value:0 };
    const mat = clipped(new THREE.MeshStandardMaterial({ vertexColors:true, roughness:0.75, side:THREE.DoubleSide }), sh => {
      sh.uniforms.uTime = uTime;
      sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
        { vec2 ip = vec2(instanceMatrix[3][0], instanceMatrix[3][2]);
          float k = position.y / 0.55; k *= k;
          float wv = sin(uTime * 1.7 + ip.x * 0.32 + ip.y * 0.21) * 0.6 + sin(uTime * 3.3 + ip.x * 1.1 - ip.y * 0.7) * 0.25;
          transformed.x += wv * 0.16 * k; transformed.z += wv * 0.07 * k; }`);
    });
    const mesh = new THREE.InstancedMesh(blade, mat, count), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sc = new V3(), c = new THREE.Color(), at = new V3();
    let k = 0, tries = 0;
    while (k < count && tries < count * 4) {
      tries++;
      const a = rand(0, 6.283), r = Math.sqrt(Math.random()) * (this.R0 - 0.2), x = Math.cos(a) * r, z = Math.sin(a) * r, y = this.h(x, z);
      if (ok && !ok(x, z, y)) continue;
      e.set(rand(-0.2, 0.2), rand(0, 6.283), rand(-0.2, 0.2)); q.setFromEuler(e);
      const pn = this.noise(x * 0.12 + 40, z * 0.12, 2);
      const s = rand(0.7, 1.3); sc.set(s, s * rand(0.75, 1.3) * (1 + Math.max(0, pn) * 0.7) * hs, s); at.set(x, y - 0.03, z);
      m4.compose(at, q, sc); mesh.setMatrixAt(k, m4);
      c.setHSL(0.245 + pn * 0.05 + rand(-0.015, 0.015), 0.55 + pn * 0.1, 0.42 + rand(-0.05, 0.06) - pn * 0.05); mesh.setColorAt(k, c); k++;
    }
    mesh.count = k; mesh.receiveShadow = true; mesh.frustumCulled = false; this.group.add(mesh);
  }
  buildFlowers(count, ok) {
    const geo = new THREE.IcosahedronGeometry(0.07, 0), mat = clipped(stdMat(0xffffff, { roughness:0.6 }));
    const mesh = new THREE.InstancedMesh(geo, mat, count), m4 = new THREE.Matrix4(), c = new THREE.Color();
    let k = 0;
    for (let i = 0; i < count * 4 && k < count; i++) {
      const a = rand(0, 6.283), r = Math.sqrt(Math.random()) * (this.R0 - 0.5), x = Math.cos(a) * r, z = Math.sin(a) * r, y = this.h(x, z);
      if (ok && !ok(x, z, y)) continue;
      m4.makeTranslation(x, y + rand(0.25, 0.45), z); mesh.setMatrixAt(k, m4);
      c.set(pick(['#ffffff', '#ffd43b', '#ff8fab', '#b197fc', '#ff6b6b'])); mesh.setColorAt(k, c); k++;
    }
    mesh.count = k; this.group.add(mesh);
  }

  // ---------- do vat ----------
  // mot khoi la mem: bien dang muot + phap tuyen xop + mau toi duoi/sang tren
  leafBlob(parent, r, off, center, hue, y0, yr, freq) {
    const geo = displace(new THREE.SphereGeometry(r, 26, 20), 0.15, freq, 2);
    fluffNormals(geo, center.clone().sub(off));
    const dark = new THREE.Color().setHSL(hue + 0.02, 0.5, 0.12), base = new THREE.Color().setHSL(hue, 0.52, 0.3), light = new THREE.Color().setHSL(hue - 0.03, 0.62, 0.5);
    const p = geo.attributes.position, cols = new Float32Array(p.count * 3), c = new THREE.Color();
    for (let j = 0; j < p.count; j++) {
      const t = clampN((p.getY(j) + off.y - y0) / yr, 0, 1);
      c.copy(dark).lerp(base, Math.min(1, t * 1.7)); if (t > 0.6) c.lerp(light, (t - 0.6) * 1.7);
      cols[j * 3] = c.r; cols[j * 3 + 1] = c.g; cols[j * 3 + 2] = c.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    const b = new THREE.Mesh(geo, M().leaf); b.position.copy(off); b.castShadow = true; b.receiveShadow = true; parent.add(b); return b;
  }
  tree(x, z, s = 1, kind = 'leaf') {
    const g = new THREE.Group(), y = this.h(x, z); g.position.set(x, y, z);
    const mat = kind === 'dead' ? M().deadBark : M().bark;
    const tg = new THREE.CylinderGeometry(0.15 * s, 0.3 * s, 2.7 * s, 16, 8), tp = tg.attributes.position, bend = rand(-0.2, 0.2) * s;
    for (let i = 0; i < tp.count; i++) { const yy = tp.getY(i) / (2.7 * s) + 0.5; tp.setX(i, tp.getX(i) + Math.sin(yy * 2.4) * bend); }
    displace(tg, 0.07, 2.5 / s, 2);
    const trunk = new THREE.Mesh(tg, mat); trunk.position.y = 1.3 * s; trunk.castShadow = true; trunk.receiveShadow = true; g.add(trunk);
    const up = new V3(0, 1, 0);
    for (let i = 0; i < 5; i++) {
      const a = i * 1.257 + rand(-0.3, 0.3), root = new THREE.Mesh(new THREE.ConeGeometry(0.11 * s, 0.75 * s, 10), mat);
      root.position.set(Math.cos(a) * 0.3 * s, 0.1 * s, Math.sin(a) * 0.3 * s);
      root.quaternion.setFromUnitVectors(up, new V3(Math.cos(a), -0.45, Math.sin(a)).normalize()); root.castShadow = true; g.add(root);
    }
    let canopy = null;
    if (kind === 'dead') {
      for (let i = 0; i < 5; i++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.035 * s, 0.1 * s, 1.3 * s, 8), mat); b.position.set(0, (1.5 + i * 0.28) * s, 0); b.rotation.set(rand(0.6, 1.1), i * 1.7, 0); b.translateY(0.55 * s); b.castShadow = true; g.add(b); }
    } else {
      canopy = new THREE.Group(); g.add(canopy);
      const hue = rand(0.24, 0.31), cC = new V3(0, 3.3 * s, 0);
      for (let i = 0; i < 9; i++) {
        const a = rand(0, 6.28), rr = rand(0, 0.95) * s;
        this.leafBlob(canopy, rand(0.75, 1.15) * s, new V3(Math.cos(a) * rr, (2.75 + rand(-0.1, 1.3)) * s, Math.sin(a) * rr), cC, hue, 2.1 * s, 2.6 * s, 2.2 / s);
      }
    }
    const p = this.addProp(g, x, z, { x, z, r:0.42 * s, top:99 }); p.canopy = canopy; p.sway = rand(0, 6); return p;
  }
  rock(x, z, s, color = 0x8a8580, stand = true, moss = true) {
    const geo = displace(new THREE.SphereGeometry(s, 40, 28), 0.3, 1.3 / s, 3);
    geo.scale(rand(0.9, 1.15), rand(0.5, 0.72), rand(0.8, 1.05)); geo.computeVertexNormals(); geo.computeBoundingBox();
    const p = geo.attributes.position, nr = geo.attributes.normal, cols = new Float32Array(p.count * 3), base = new THREE.Color(color), mossC = new THREE.Color(0x5f8a38), c = new THREE.Color();
    for (let j = 0; j < p.count; j++) {
      const v = 0.82 + this.noise(p.getX(j) * 3 + x, p.getZ(j) * 3 + p.getY(j) * 2 + z, 2) * 0.28;
      c.copy(base).multiplyScalar(v);
      if (moss) c.lerp(mossC, smoothstep(0.45, 0.85, nr.getY(j)) * 0.75);
      cols[j * 3] = c.r; cols[j * 3 + 1] = c.g; cols[j * 3 + 2] = c.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    const m = new THREE.Mesh(geo, M().rock), y = this.h(x, z);
    m.position.set(x, y - s * 0.08, z); m.rotation.y = rand(0, 6.28); m.castShadow = true; m.receiveShadow = true;
    const g = new THREE.Group(); g.add(m);
    return this.addProp(g, x, z, { x, z, r:s * 0.85, top:y - s * 0.08 + geo.boundingBox.max.y * 0.92, stand });
  }
  bush(x, z, s = 1) {
    const g = new THREE.Group(), y = this.h(x, z); g.position.set(x, y, z);
    const hue = rand(0.25, 0.31), cC = new V3(0, 0.4 * s, 0);
    for (let i = 0; i < 6; i++) { const a = rand(0, 6.28), rr = rand(0, 0.55) * s; this.leafBlob(g, rand(0.35, 0.6) * s, new V3(Math.cos(a) * rr, rand(0.22, 0.6) * s, Math.sin(a) * rr), cC, hue, 0, 1.1 * s, 3.5 / s); }
    const p = this.addProp(g, x, z, null); p.canopy = null; return p;
  }

  // ================= DOI CO =================
  build_meadow() {
    const n = this.noise;
    this.h = (x, z) => {
      let h = n(x * 0.06, z * 0.06, 3) * 1.5 + n(x * 0.2, z * 0.2, 2) * 0.22 + 0.3;
      h += 1.3 * Math.exp(-((x - 9) ** 2 + (z - 9) ** 2) / 10);
      const dp = hyp(x + 8, z + 7); h = h + (1.9 - h) * (1 - smoothstep(3.0, 3.5, dp));
      const dw = hyp(x - 6, z + 6.5); h -= 1.5 * (1 - smoothstep(1.4, 3.8, dw));
      for (const [kx, kz] of KEY) { const d = hyp(x - kx, z - kz); h = 0.35 + (h - 0.35) * smoothstep(1.8, 3.6, d); }
      return h;
    };
    this.water = { x:6, z:-6.5, level:-0.3 };
    this.cliffColor = 0x8b6a4a;
    this.groundBump = canvasTex(256, (g, s) => { g.fillStyle = '#808080'; g.fillRect(0, 0, s, s); for (let i = 0; i < 4000; i++) { const l = 80 + Math.random() * 100 | 0; g.fillStyle = `rgb(${l},${l},${l})`; g.fillRect(Math.random() * s, Math.random() * s, 2, 2); } }, 8, false);
    this.colorAt = (x, y, z, ny, c) => {
      const v = n(x * 0.35, z * 0.35, 2);
      if (this.onPath(x, z, 1.55)) c.setRGB(0.4, 0.33, 0.22);
      else if (y < this.water.level + 0.05) c.setRGB(0.32, 0.27, 0.18);
      else if (ny < 0.78) c.setRGB(0.45 + v * 0.05, 0.34, 0.22);
      else if (y < this.water.level + 0.35) c.setRGB(0.72, 0.64, 0.45);
      else c.setHSL(0.26 + v * 0.03, 0.5, 0.27 + v * 0.05);
    };
    this.env = { sky:gradTex([[0, '#5aa9e6'], [0.55, '#bfe3fb'], [1, '#f8efd8']]), fog:'#cfe6f7', fogNear:45, fogFar:140,
                 sun:'#fff3dc', sunI:2.2, hemiSky:'#cfe9ff', hemiGround:'#6b8a4a', hemiI:0.75, rim:'#fff1d6', rimI:0.7, envI:0.3 };
    // nuoc
    const water = new THREE.Mesh(new THREE.CircleGeometry(4.3, 64), clipped(new THREE.MeshPhysicalMaterial({ color:0x2a78b0, roughness:0.04, metalness:0, normalMap:waterNormalTex(), normalScale:new THREE.Vector2(0.45, 0.45), transparent:true, opacity:0.84, clearcoat:1, clearcoatRoughness:0.04 })));
    water.rotation.x = -Math.PI / 2; water.position.set(6, this.water.level, -6.5); this.group.add(water); this.waterMesh = water;
    this.paths = [[0, 0, -9, 0], [0, 0, 9, 0], [0, 0, 0, 13], [0, 0, 0, -13]];
    this.buildStones();
    const grassOK = (x, z, y) => y > this.water.level + 0.25 && this.slope(x, z) < 0.9 && !this.onPath(x, z, 1.3);
    this.buildGrass(24000, grassOK);
    this.buildFlowers(700, grassOK);
    for (let i = 0; i < 10; i++) { const s = this.freeSpot(10.5, R0 - 1.2, 3.2); if (s) this.tree(s[0], s[1], rand(0.85, 1.2)); }
    const offPath = (x, z) => !this.onPath(x, z, 2.2);
    for (let i = 0; i < 9; i++) { const s = this.freeSpot(3, R0 - 1.2, 2.2, 3.6, offPath); if (s) this.rock(s[0], s[1], rand(0.5, 1.15)); }
    for (let i = 0; i < 16; i++) { const s = this.freeSpot(3, R0 - 1, 1.8, 3, offPath); if (s) this.bush(s[0], s[1], rand(0.8, 1.2)); }
    // canh xa: nui + may
    const far = new THREE.Group(); this.group.add(far);
    for (let i = 0; i < 14; i++) {
      const a = i / 14 * 6.283 + rand(-0.1, 0.1), r = rand(85, 120), hgt = rand(25, 50);
      const m = new THREE.Mesh(lumpy(new THREE.ConeGeometry(rand(20, 32), hgt, 9, 4), 0.06), stdMat(0x7790a8, { roughness:0.95 }));
      m.position.set(Math.cos(a) * r, -18 + hgt / 2, Math.sin(a) * r); far.add(m);
      const cap = new THREE.Mesh(new THREE.ConeGeometry(rand(6, 9), hgt * 0.28, 9), stdMat(0xf4f7fb, { roughness:0.8 }));
      cap.position.set(m.position.x, -18 + hgt * 0.87, m.position.z); far.add(cap);
    }
    this.cloudLayer(0xffffff);
  }
  onPath(x, z, w) {
    if (!this.paths) return false;
    if (hyp(x, z) < 3.1 + (w - 1.3)) return true;
    return this.paths.some(([x0, z0, x1, z1]) => segDist(x, z, x0, z0, x1, z1) < w);
  }
  // da lat: duong noi cac diem + quang truong tron o giua
  buildStones() {
    const spots = [];
    for (let x = -3; x <= 3; x += 0.78) for (let z = -3; z <= 3; z += 0.78) if (hyp(x, z) < 2.95) spots.push([x + rand(-0.06, 0.06), z + rand(-0.06, 0.06), 0.66]);
    for (const [x0, z0, x1, z1] of this.paths) {
      const len = hyp(x1 - x0, z1 - z0), ux = (x1 - x0) / len, uz = (z1 - z0) / len;
      for (let d = 3.3; d < len + 0.6; d += 0.8) for (const o of [-0.78, 0, 0.78]) {
        if (Math.random() < 0.08) continue;
        spots.push([x0 + ux * d - uz * o + rand(-0.1, 0.1), z0 + uz * d + ux * o + rand(-0.1, 0.1), rand(0.55, 0.72)]);
      }
    }
    const geo = lumpy(new THREE.BoxGeometry(1, 0.2, 1, 3, 1, 3), 0.05);
    const mesh = new THREE.InstancedMesh(geo, clipped(stdMat(0xffffff, { roughness:0.88 })), spots.length);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), qy = new THREE.Quaternion(), up = new V3(0, 1, 0), nrm = new V3(), sc = new V3(), at = new V3(), col = new THREE.Color();
    spots.forEach(([x, z, s], i) => {
      const e = 0.3; nrm.set(this.h(x - e, z) - this.h(x + e, z), 2 * e, this.h(x, z - e) - this.h(x, z + e)).normalize();
      q.setFromUnitVectors(up, nrm); qy.setFromAxisAngle(up, rand(-0.25, 0.25)); q.multiply(qy);
      sc.set(s * rand(0.9, 1.1), rand(0.8, 1.2), s * rand(0.9, 1.1)); at.set(x, this.h(x, z) + 0.02, z);
      m4.compose(at, q, sc); mesh.setMatrixAt(i, m4);
      const v = rand(0.62, 0.82); col.setRGB(v, v * 0.98, v * 0.92); if (Math.random() < 0.25) col.lerp(new THREE.Color(0x7fa65a), rand(0.2, 0.45));
      mesh.setColorAt(i, col);
    });
    mesh.castShadow = false; mesh.receiveShadow = true; this.group.add(mesh);
  }
  cloudLayer(color) {
    const mat = stdMat(color, { roughness:1 });
    for (let i = 0; i < 16; i++) {
      const c = new THREE.Group(), a = rand(0, 6.28), r = rand(26, 70);
      for (let k = 0; k < 5; k++) { const s = new THREE.Mesh(new THREE.IcosahedronGeometry(rand(1.6, 3), 2), mat); s.position.set(k * 2 - 4, rand(-0.5, 0.6), rand(-1, 1)); c.add(s); }
      c.position.set(Math.cos(a) * r, rand(-16, -6), Math.sin(a) * r); c.userData.cloud = rand(0.3, 0.9); this.group.add(c);
    }
  }

  // ================= NHA MAY KEO =================
  build_candy() {
    const boxes = [
      { x:0, z:0, hw:3, hd:3, top:1.0 }, { x:-8.5, z:-8, hw:2.6, hd:2, top:1.7 }, { x:8.5, z:8, hw:2.6, hd:2, top:1.7 },
      { x:-11, z:8, hw:1.6, hd:3, top:0.9 }, { x:11, z:-8, hw:1.6, hd:3, top:0.9 },
    ];
    const ramps = [{ x0:-1.6, x1:1.6, z0:3, z1:6.4, top:1.0, up:'z0' }, { x0:-1.6, x1:1.6, z0:-6.4, z1:-3, top:1.0, up:'z1' }];
    const sdb = (x, z, b) => Math.max(Math.abs(x - b.x) - b.hw, Math.abs(z - b.z) - b.hd);
    this.h = (x, z) => {
      let h = 0;
      for (const b of boxes) h = Math.max(h, b.top * (1 - smoothstep(-0.12, 0.12, sdb(x, z, b))));
      for (const r of ramps) {
        if (x < r.x0 - 0.15 || x > r.x1 + 0.15 || z < r.z0 || z > r.z1) continue;
        const t = r.up === 'z0' ? 1 - (z - r.z0) / (r.z1 - r.z0) : (z - r.z0) / (r.z1 - r.z0);
        h = Math.max(h, r.top * t * (1 - smoothstep(-0.12, 0.12, Math.max(r.x0 - x, x - r.x1))));
      }
      return h;
    };
    this.cliffColor = 0xd77fb0;
    this.groundMap = canvasTex(128, (g, s) => { g.fillStyle = '#f3e4ea'; g.fillRect(0, 0, s, s); g.fillStyle = '#efbcd2'; g.fillRect(0, 0, s / 2, s / 2); g.fillRect(s / 2, s / 2, s / 2, s / 2); }, 9);
    this.cliffMap = canvasTex(128, (g, s) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#ff7ab6' : '#ffe3f0'; g.fillRect(0, i * s / 8, s, s / 8); } }, 1);
    this.colorAt = (x, y, z, ny, c) => {
      if (ny < 0.6) c.set(0xff8cc6);
      else if (ny < 0.97) c.set(0xffc9a8);
      else if (y > 1.5) c.set(0xd8c8ff);
      else if (y > 0.95) c.set(0xb8f0c4);
      else if (y > 0.8) c.set(0xfff0a0);
      else c.set(0xe8dde2);
    };
    this.env = { sky:gradTex([[0, '#c9a7ff'], [0.55, '#ffd1ea'], [1, '#fff3e0']]), fog:'#f2cfe2', fogNear:50, fogFar:150,
                 sun:'#fff4f8', sunI:1.6, hemiSky:'#ffe4f3', hemiGround:'#b98aa8', hemiI:0.6, rim:'#ffd0ea', rimI:0.6, envI:0.28 };
    // bang chuyen
    this.conveyors = [{ x0:-15, x1:-3.5, z0:2.6, z1:4.2, vx:3.2, vz:0 }, { x0:3.5, x1:15, z0:-4.2, z1:-2.6, vx:-3.2, vz:0 }];
    this.convTex = [];
    for (const c of this.conveyors) {
      const tex = canvasTex(64, (g, s) => { g.fillStyle = '#5a4a6a'; g.fillRect(0, 0, s, s); g.fillStyle = '#ffd43b'; g.beginPath(); g.moveTo(s * 0.2, s * 0.2); g.lineTo(s * 0.6, s * 0.5); g.lineTo(s * 0.2, s * 0.8); g.lineTo(s * 0.35, s * 0.5); g.fill(); }, 1);
      tex.repeat.set((c.x1 - c.x0) / 1.6, 1); if (c.vx < 0) { tex.repeat.x *= -1; }
      const m = new THREE.Mesh(new THREE.BoxGeometry(c.x1 - c.x0, 0.1, c.z1 - c.z0), [stdMat(0x3d3350), stdMat(0x3d3350), new THREE.MeshStandardMaterial({ map:tex, roughness:0.6 }), stdMat(0x3d3350), stdMat(0x3d3350), stdMat(0x3d3350)].map(mm => clipped(mm)));
      m.position.set((c.x0 + c.x1) / 2, 0.03, (c.z0 + c.z1) / 2); m.receiveShadow = true; this.group.add(m);
      this.convTex.push({ tex, v:c.vx / 1.6 });
    }
    // keo mut, keo deo
    const swirl = canvasTex(256, (g, s) => { g.translate(s / 2, s / 2); for (let i = 0; i < 260; i++) { const a = i * 0.15, r = i * 0.48; g.fillStyle = i % 26 < 13 ? '#ff4f8b' : '#ffffff'; g.beginPath(); g.arc(Math.cos(a) * r, Math.sin(a) * r, 9, 0, 6.28); g.fill(); } }, 1);
    const candyCols = ['#ff6b9d', '#74c0fc', '#ffd43b', '#8ce99a', '#b197fc', '#ffa94d'];
    for (let i = 0; i < 7; i++) {
      const s = this.freeSpot(3.5, R0 - 1.2, 3.2, 3.8, (x, z) => this.h(x, z) < 0.05 && !this.conveyorAt(x, z, 0)); if (!s) continue;
      const [x, z] = s, g = new THREE.Group(), y = this.h(x, z); g.position.set(x, y, z);
      const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.8, 10), stdMat(0xffffff, { roughness:0.5 })); stick.position.y = 1.4; stick.castShadow = true; g.add(stick);
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.22, 40), [new THREE.MeshPhysicalMaterial({ color:0xffffff, roughness:0.3, clearcoat:1 }), new THREE.MeshPhysicalMaterial({ map:swirl, roughness:0.25, clearcoat:1 }), new THREE.MeshPhysicalMaterial({ map:swirl, roughness:0.25, clearcoat:1 })]);
      disc.rotation.x = Math.PI / 2; disc.rotation.z = rand(0, 3); disc.position.y = 3.1; disc.castShadow = true; g.add(disc);
      g.rotation.y = rand(0, 6.28);
      this.addProp(g, x, z, { x, z, r:0.3, top:99 });
    }
    for (let i = 0; i < 7; i++) {
      const s = this.freeSpot(3, R0 - 1, 2.6, 3.4, (x, z) => this.h(x, z) < 0.05 && !this.conveyorAt(x, z, 0)); if (!s) continue;
      const [x, z] = s, g = new THREE.Group(), r = rand(0.7, 0.95);
      const gd = new THREE.Mesh(new THREE.SphereGeometry(r, 28, 18, 0, 6.283, 0, Math.PI / 2), new THREE.MeshPhysicalMaterial({ color:pick(candyCols), roughness:0.35, clearcoat:1, sheen:0.5 }));
      gd.scale.y = 1.15; gd.castShadow = true; gd.receiveShadow = true; g.add(gd); g.position.set(x, 0, z);
      this.addProp(g, x, z, { x, z, r:r * 0.9, top:r * 1.1, stand:true });
    }
    // canh xa: may keo bong + banh donut
    this.cloudLayer(0xffc6e2);
    for (let i = 0; i < 8; i++) {
      const a = rand(0, 6.28), r = rand(40, 80), d = new THREE.Group();
      d.add(new THREE.Mesh(new THREE.TorusGeometry(4, 1.8, 16, 32), stdMat(0xd9a066, { roughness:0.7 })));
      const icing = new THREE.Mesh(new THREE.TorusGeometry(4, 1.85, 16, 32, Math.PI * 2), stdMat(pick(['#ff8cc6', '#b197fc', '#74c0fc']), { roughness:0.4 })); icing.scale.z = 0.6; icing.position.z = 0.5; d.add(icing);
      d.position.set(Math.cos(a) * r, rand(-10, 15), Math.sin(a) * r); d.rotation.set(rand(0, 3), rand(0, 3), 0); d.userData.spin = rand(0.05, 0.15); this.group.add(d);
    }
  }

  // ================= NUI LUA =================
  build_volcano() {
    const n = this.noise; this.lavaLevel = -0.6;
    const pools = [[-7, 6, 3.3], [7, -6, 3.5], [10, 9, 2.7], [-10, -9, 2.7]];
    this.pools = pools;
    this.h = (x, z) => {
      let h = n(x * 0.08, z * 0.08, 4) * 1.25 + 0.35 + (1 - Math.abs(n(x * 0.16 + 5, z * 0.16, 2))) * 0.5 - 0.25;
      for (const [px, pz, pr] of pools) { const d = hyp(x - px, z - pz); h -= 2.1 * (1 - smoothstep(pr * 0.45, pr, d)); }
      for (const [kx, kz] of KEY) { const d = hyp(x - kx, z - kz); h = 0.4 + (h - 0.4) * smoothstep(1.8, 3.6, d); }
      return h;
    };
    this.cliffColor = 0x221b18;
    this.groundBump = canvasTex(256, (g, s) => { g.fillStyle = '#808080'; g.fillRect(0, 0, s, s); for (let i = 0; i < 2500; i++) { const l = 50 + Math.random() * 150 | 0; g.fillStyle = `rgb(${l},${l},${l})`; g.beginPath(); g.arc(Math.random() * s, Math.random() * s, rand(1, 3), 0, 6.28); g.fill(); } }, 6, false);
    this.colorAt = (x, y, z, ny, c) => {
      const v = n(x * 0.4, z * 0.4, 2);
      if (y < this.lavaLevel + 0.45) c.setRGB(0.42, 0.1, 0.03);
      else if (ny < 0.8) c.setRGB(0.07 + v * 0.02, 0.06, 0.055);
      else c.setRGB(0.15 + v * 0.04, 0.13 + v * 0.03, 0.12 + v * 0.03);
    };
    this.env = { sky:gradTex([[0, '#2a0f0c'], [0.5, '#7a2a14'], [1, '#e0742c']]), fog:'#4a2318', fogNear:30, fogFar:110,
                 sun:'#ffb070', sunI:1.6, hemiSky:'#ff9a6a', hemiGround:'#3a1a10', hemiI:0.7, rim:'#ff6a2a', rimI:1.1, envI:0.22 };
    // dung nham
    this.lavaTex = canvasTex(256, (g, s) => {
      g.fillStyle = '#c42a00'; g.fillRect(0, 0, s, s);
      for (let i = 0; i < 260; i++) { g.fillStyle = pick(['#ff7a00', '#ffb000', '#ff4500', '#ffd24a']); g.globalAlpha = rand(0.3, 0.9); g.beginPath(); g.ellipse(Math.random() * s, Math.random() * s, rand(4, 22), rand(3, 10), rand(0, 3), 0, 6.28); g.fill(); }
      g.globalAlpha = 1;
    }, 5);
    const lava = new THREE.Mesh(new THREE.CircleGeometry(R0, 72), clipped(new THREE.MeshStandardMaterial({ color:0x1a0400, emissive:0xffffff, emissiveMap:this.lavaTex, emissiveIntensity:0.95, roughness:0.7 })));
    lava.rotation.x = -Math.PI / 2; lava.position.y = this.lavaLevel; this.group.add(lava);
    for (const [px, pz] of pools) { const pl = new THREE.PointLight(0xff6a20, 18, 9, 2); pl.position.set(px, 0.6, pz); this.group.add(pl); }
    // cot bazan, da, cay chet
    for (let i = 0; i < 9; i++) {
      const s = this.freeSpot(3, R0 - 1.5, 2.6); if (!s) continue;
      const [x, z] = s, y = this.h(x, z), g = new THREE.Group(), cnt = 3 + (Math.random() * 3 | 0); let top = 0;
      for (let k = 0; k < cnt; k++) {
        const hh = rand(0.8, 1.8), m = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.45, hh + 1, 6), stdMat(0x2a2422, { flatShading:true, roughness:0.85 }));
        const ox = (k % 2) * 0.75 - 0.35, oz = Math.floor(k / 2) * 0.68 - 0.6; m.position.set(ox, hh / 2 - 0.5, oz); m.castShadow = true; m.receiveShadow = true; g.add(m); top = Math.max(top, hh);
      }
      g.position.set(x, y, z);
      this.addProp(g, x, z, { x, z, r:1.15, top:y + top * 0.8, stand:true });
    }
    for (let i = 0; i < 7; i++) { const s = this.freeSpot(3, R0 - 1.2, 2.2); if (s) this.rock(s[0], s[1], rand(0.5, 1.1), 0x4a403c, true, false); }
    for (let i = 0; i < 5; i++) { const s = this.freeSpot(4, R0 - 1.5, 3); if (s) this.tree(s[0], s[1], rand(0.8, 1.1), 'dead'); }
    // canh xa: nui lua lon phun khoi
    const big = new THREE.Mesh(lumpy(new THREE.CylinderGeometry(9, 42, 48, 18, 6), 0.05), stdMat(0x2a1c18, { roughness:1 }));
    big.position.set(-10, -10, -95); this.group.add(big);
    const glow = new THREE.Mesh(new THREE.CircleGeometry(8.5, 24), new THREE.MeshBasicMaterial({ color:0xff6a00 })); glow.rotation.x = -Math.PI / 2; glow.position.set(-10, 14.1, -95); this.group.add(glow);
    this.crater = new V3(-10, 16, -95);
    this.smokeMat = new THREE.MeshStandardMaterial({ color:0x3a302c, transparent:true, opacity:0.22, depthWrite:false, roughness:1 });
  }

  // ---------- cap nhat hang khung hinh ----------
  update(dt, api) {
    this.time += dt;
    if (this.uTime) this.uTime.value = this.time;
    if (this.lavaTex) { this.lavaTex.offset.x += dt * 0.02; this.lavaTex.offset.y += dt * 0.012; }
    if (this.convTex) for (const c of this.convTex) c.tex.offset.x -= c.v * dt * Math.sign(c.tex.repeat.x);
    for (const o of this.group.children) {
      if (o.userData.cloud) { o.position.x += o.userData.cloud * dt; if (o.position.x > 80) o.position.x = -80; }
      if (o.userData.spin) o.rotation.y += o.userData.spin * dt;
    }
    if (this.waterMesh) { this.waterMesh.position.y = this.water.level + Math.sin(this.time * 1.5) * 0.02; this.waterMesh.material.normalMap.offset.set(this.time * 0.025, this.time * 0.017); }
    for (const p of this.props) if (p.canopy && !p.fall) { p.canopy.rotation.z = Math.sin(this.time * 1.3 + p.sway) * 0.022; p.canopy.rotation.x = Math.cos(this.time * 1.1 + p.sway * 1.7) * 0.018; }
    // do vat ngoai vung an toan roi xuong
    for (const p of this.props) {
      if (!p.fall && hyp(p.x, p.z) > this.R + 0.3) { p.fall = true; if (p.col) p.col.dead = true; }
      if (p.fall && p.g.visible) { p.vy -= 22 * dt; p.g.position.y += p.vy * dt; p.g.rotation.x += dt * 0.7; if (p.g.position.y < -40) p.g.visible = false; }
    }
    if (this.spray) { this.spray.rotation.y += dt * 2; this.spray.scale.y = 1 + Math.sin(this.time * 6) * 0.08; }
    for (const w of this.waterMeshes) { w.f.material.opacity = 0.4 + Math.sin(this.time * 2) * 0.15; }
    if (this.id === 'volcano') this.updateVolcano(dt, api);
  }
  updateVolcano(dt, api) {
    // khoi tu ho dung nham
    this.smokeT -= dt;
    if (this.smokeT <= 0) {
      this.smokeT = 0.4;
      const [px, pz, pr] = pick(this.pools);
      if (hyp(px, pz) < this.R) {
        const m = new THREE.Mesh(new THREE.IcosahedronGeometry(rand(0.25, 0.45), 1), this.smokeMat);
        m.position.set(px + rand(-pr, pr) * 0.4, this.lavaLevel + 0.3, pz + rand(-pr, pr) * 0.4); this.group.add(m);
        this.smokes.push({ m, life:3 });
      }
    }
    for (const s of [...this.smokes]) {
      s.life -= dt; s.m.position.y += dt * 1.4; s.m.scale.multiplyScalar(1 + dt * 0.35);
      if (s.life <= 0) { this.group.remove(s.m); s.m.geometry.dispose(); this.smokes.splice(this.smokes.indexOf(s), 1); }
    }
    // mua thien thach
    if (!api.live) return;
    this.eruptT -= dt;
    if (this.eruptT <= 0) {
      this.eruptT = rand(10, 15);
      api.announce();
      for (let i = 0; i < 5; i++) {
        const p = this.randomSpot(Math.max(2, this.R - 1));
        const warn = new THREE.Mesh(new THREE.RingGeometry(1.9, 2.4, 40), new THREE.MeshBasicMaterial({ color:0xff3b1f, transparent:true, opacity:0.8, side:THREE.DoubleSide, depthWrite:false }));
        warn.rotation.x = -Math.PI / 2; warn.position.set(p.x, p.y + 0.06, p.z); this.group.add(warn);
        const rockM = new THREE.Mesh(lumpy(new THREE.IcosahedronGeometry(0.5, 1), 0.15), new THREE.MeshStandardMaterial({ color:0x401a10, emissive:0xff5a10, emissiveIntensity:2 }));
        this.group.add(rockM);
        this.meteors.push({ p, warn, rockM, t:-i * 0.25, dur:1.7, from:new V3(p.x + rand(-8, 8), 28, p.z + rand(-8, 8)) });
      }
    }
    for (const m of [...this.meteors]) {
      m.t += dt;
      const k = clampN(m.t / m.dur, 0, 1);
      m.rockM.visible = m.t > 0;
      m.rockM.position.lerpVectors(m.from, m.p, k * k); m.rockM.rotation.x += dt * 6;
      m.warn.material.opacity = 0.4 + Math.sin(m.t * 18) * 0.35; m.warn.scale.setScalar(1.15 - k * 0.15);
      if (m.t > 0 && Math.random() < 0.5) api.burst(m.rockM.position, 0xff8a3d, 1, 1, 0, 1);
      if (k >= 1) {
        api.blast(m.p, 2.4, 18, 12);
        this.group.remove(m.warn); this.group.remove(m.rockM); m.warn.geometry.dispose(); m.rockM.geometry.dispose();
        this.meteors.splice(this.meteors.indexOf(m), 1);
      }
    }
  }
}
