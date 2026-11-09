// Ban do nhieu tang: khoi kien truc, bac thang, lan can, tuong da, do vat chi tiet
import { THREE, V3, rand, pick, hyp, clampN, canvasTex, lumpy, put, clipped } from './core.js';
import { World } from './maps.js';

// ---------------- van be mat (ve bang canvas, lap lien mach) ----------------
let TX = null;
function textures() {
  if (TX) return TX;
  const C = (draw, size = 256) => canvasTex(size, draw, 1);
  const noise = (g, s, n, cols, r0 = 0.5, r1 = 1.5) => { for (let i = 0; i < n; i++) { g.fillStyle = pick(cols); g.beginPath(); g.arc(Math.random() * s, Math.random() * s, rand(r0, r1), 0, 6.28); g.fill(); } };
  const rr = (g, x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
  TX = {
    cobble:C((g, s) => { g.fillStyle = '#a8a196'; g.fillRect(0, 0, s, s); const n = 8, c = s / n;
      for (let y = 0; y < n; y++) for (let x = -1; x < n; x++) { const ox = (y % 2) * c / 2; g.fillStyle = pick(['#d8d3ca', '#cfc9be', '#e2ddd5', '#c6c0b4', '#d3cdc3']); rr(g, x * c + ox + 3, y * c + 3, c - 6, c - 6, 9); g.fill(); g.fillStyle = 'rgba(255,255,255,0.18)'; rr(g, x * c + ox + 6, y * c + 5, c - 14, c * 0.35, 6); g.fill(); } }),
    paving:C((g, s) => { g.fillStyle = '#b9ad9c'; g.fillRect(0, 0, s, s); const n = 2, c = s / n;
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { g.fillStyle = pick(['#eadfce', '#e3d7c4', '#efe6d8']); g.fillRect(x * c + 3, y * c + 3, c - 6, c - 6); }
      noise(g, s, 500, ['rgba(120,100,80,0.12)', 'rgba(255,255,255,0.2)'], 0.5, 1.6); }),
    stoneWall:C((g, s) => { g.fillStyle = '#6f6a63'; g.fillRect(0, 0, s, s); const rows = 5, h = s / rows;
      for (let y = 0; y < rows; y++) { let x = -(y % 2) * 30; while (x < s) { const w = rand(40, 80); g.fillStyle = pick(['#9d978d', '#a8a297', '#928c82', '#b0aa9f', '#8a857c']); rr(g, x + 3, y * h + 3, w - 6, h - 6, 6); g.fill(); g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(x + 6, y * h + 5, w - 12, 4); x += w; } }
      noise(g, s, 60, ['rgba(110,150,70,0.35)'], 2, 5); }),
    wood:C((g, s) => { const n = 4, h = s / n;
      for (let y = 0; y < n; y++) { g.fillStyle = pick(['#c48d55', '#b9824b', '#cf9a62', '#bf8a52']); g.fillRect(0, y * h, s, h);
        g.strokeStyle = 'rgba(90,50,20,0.25)'; g.lineWidth = 1.2; for (let k = 0; k < 6; k++) { const yy = y * h + rand(4, h - 4); g.beginPath(); g.moveTo(0, yy); g.bezierCurveTo(s * 0.3, yy + rand(-3, 3), s * 0.6, yy + rand(-3, 3), s, yy); g.stroke(); }
        g.fillStyle = '#6b4325'; g.fillRect(0, y * h, s, 3); const cut = rand(0.2, 0.8) * s; g.fillRect(cut, y * h, 3, h); } }),
    grass:C((g, s) => { g.fillStyle = '#79b04f'; g.fillRect(0, 0, s, s); noise(g, s, 2500, ['#6ea546', '#86bd5a', '#72aa4a', '#8fc463'], 0.8, 2.2); }),
    concrete:C((g, s) => { g.fillStyle = '#c9c7c2'; g.fillRect(0, 0, s, s); noise(g, s, 1800, ['rgba(0,0,0,0.06)', 'rgba(255,255,255,0.2)'], 0.5, 1.5); g.strokeStyle = 'rgba(0,0,0,0.12)'; g.lineWidth = 2; g.strokeRect(1, 1, s - 2, s - 2); }),
    gravel:C((g, s) => { g.fillStyle = '#8f8d88'; g.fillRect(0, 0, s, s); noise(g, s, 3000, ['#a5a39d', '#7d7b76', '#b3b1ab', '#9a9893'], 0.8, 2); }),
    soil:C((g, s) => { g.fillStyle = '#6b4a32'; g.fillRect(0, 0, s, s); noise(g, s, 1500, ['#7b5a3e', '#5a3d28', '#8a6a4a'], 1, 3); }),
    dirtSide:C((g, s) => { g.fillStyle = '#7a5a3c'; g.fillRect(0, 0, s, s); noise(g, s, 900, ['#8d6b4a', '#654a31', '#9a7a58'], 1, 4); g.fillStyle = '#5f9a3c'; g.fillRect(0, 0, s, 18); noise(g, s * 0.1, 0, []); }),
    facade:C((g, s) => { g.fillStyle = '#d9cfc0'; g.fillRect(0, 0, s, s); for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) { const X = x * s / 2 + 26, Y = y * s / 2 + 22; g.fillStyle = '#7d6e5e'; g.fillRect(X - 4, Y - 4, 84, 92); g.fillStyle = pick(['#8fb4cf', '#a3c4dc', '#7fa6c4']); g.fillRect(X, Y, 76, 84); g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(X + 6, Y + 6, 20, 70); g.fillStyle = '#7d6e5e'; g.fillRect(X + 36, Y, 4, 84); } }),
    tiles:C((g, s) => { const n = 6, h = s / n; for (let y = 0; y < n; y++) { g.fillStyle = y % 2 ? '#b8513e' : '#c45c46'; g.fillRect(0, y * h, s, h); g.fillStyle = 'rgba(0,0,0,0.2)'; g.fillRect(0, y * h + h - 4, s, 4); for (let x = 0; x < 8; x++) g.fillRect(x * s / 8 + (y % 2) * s / 16, y * h, 2, h); } }),
    helipad:C((g, s) => { g.fillStyle = '#5d6168'; g.fillRect(0, 0, s, s); g.strokeStyle = '#f2d23c'; g.lineWidth = 12; g.beginPath(); g.arc(s / 2, s / 2, s * 0.42, 0, 6.283); g.stroke(); g.fillStyle = '#ffffff'; g.font = `bold ${s * 0.5}px Arial`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('H', s / 2, s / 2 + 6); }, 256),
    solar:C((g, s) => { g.fillStyle = '#1f3557'; g.fillRect(0, 0, s, s); g.strokeStyle = '#9fb4d0'; g.lineWidth = 3; for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * s / 4, 0); g.lineTo(i * s / 4, s); g.stroke(); g.beginPath(); g.moveTo(0, i * s / 4); g.lineTo(s, i * s / 4); g.stroke(); } }),
    skyline:C((g, s) => { g.fillStyle = '#9fb3c8'; g.fillRect(0, 0, s, s); for (let y = 0; y < 8; y++) for (let x = 0; x < 6; x++) { g.fillStyle = Math.random() < 0.3 ? '#ffe9a8' : pick(['#c9d8e6', '#b4c6d8', '#d8e4ee']); g.fillRect(x * s / 6 + 8, y * s / 8 + 8, s / 6 - 16, s / 8 - 14); } }),
  };
  TX.helipad.repeat.set(1, 1);
  return TX;
}
let MT = null;
function mats() {
  if (MT) return MT;
  const t = textures();
  const S = (o) => clipped(new THREE.MeshStandardMaterial({ roughness:0.88, metalness:0, ...o }));
  MT = {
    cobble:S({ map:t.cobble }), paving:S({ map:t.paving }), stone:S({ map:t.stoneWall }), wood:S({ map:t.wood, roughness:0.8 }),
    grass:S({ map:t.grass }), concrete:S({ map:t.concrete }), gravel:S({ map:t.gravel }), soil:S({ map:t.soil }), dirt:S({ map:t.dirtSide }),
    facade:S({ map:t.facade, roughness:0.7 }), tiles:S({ map:t.tiles, roughness:0.7 }), helipad:S({ map:t.helipad, roughness:0.8 }),
    solar:S({ map:t.solar, roughness:0.25, metalness:0.4 }),
    ironDark:S({ color:0x2f3a3a, roughness:0.45, metalness:0.6 }), metal:S({ color:0xb8bec6, roughness:0.4, metalness:0.7 }),
    white:S({ color:0xf3f1ec }), terracotta:S({ color:0xc8673f, roughness:0.75 }), red:S({ color:0xd8473b, roughness:0.6 }),
    glass:clipped(new THREE.MeshPhysicalMaterial({ color:0x9fd2ff, roughness:0.05, transparent:true, opacity:0.45, clearcoat:1 })),
    lampGlow:new THREE.MeshStandardMaterial({ color:0xfff1c8, emissive:0xffd88a, emissiveIntensity:1.2 }),
    hedge:S({ color:0x4f8a3a, roughness:0.9 }),
    water:clipped(new THREE.MeshPhysicalMaterial({ color:0x3fa3c9, roughness:0.05, transparent:true, opacity:0.78, clearcoat:1 })),
    foam:new THREE.MeshBasicMaterial({ color:0xffffff, transparent:true, opacity:0.55 }),
  };
  return MT;
}

// hop chu nhat co UV theo kich thuoc that (van khong bi keo gian)
function boxGeo(w, h, d, tile = 2) {
  const g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv;
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) { const i = f * 4 + k; uv.setXY(i, uv.getX(i) * dims[f][0] / tile, uv.getY(i) * dims[f][1] / tile); }
  return g;
}

// ---------------- them cong cu dung ban do vao World ----------------
Object.assign(World.prototype, {
  levelInit(R0) {
    this.levelMode = true; this.R0 = R0; this.solids = []; this.walls = []; this.waters = []; this.lights = [];
    this.h = (x, z) => {
      let h = -99;
      for (const b of this.solids) {
        if (x < b.x0 || x > b.x1 || z < b.z0 || z > b.z1) continue;
        let t = b.top;
        if (b.ramp) { const r = b.ramp, u = r.axis === 'x' ? (x - b.x0) / (b.x1 - b.x0) : (z - b.z0) / (b.z1 - b.z0); t = r.y0 + (r.y1 - r.y0) * (r.dir > 0 ? u : 1 - u); }
        if (t > h) h = t;
      }
      return h;
    };
    this.colorAt = () => {};
  },
  block(x0, x1, z0, z1, top, bottom, topM, sideM, opt = {}) {
    const w = x1 - x0, d = z1 - z0, hh = top - bottom;
    const mesh = new THREE.Mesh(boxGeo(w, hh, d, opt.tile || 2), [sideM, sideM, topM, sideM, sideM, sideM]);
    mesh.position.set((x0 + x1) / 2, (top + bottom) / 2, (z0 + z1) / 2);
    mesh.castShadow = opt.cast !== false; mesh.receiveShadow = true; this.group.add(mesh);
    if (opt.solid !== false) this.solids.push({ x0, x1, z0, z1, top });
    return mesh;
  },
  // bac thang: va cham la doc tron, hinh la tung bac
  stairs(x0, x1, z0, z1, y0, y1, axis, dir, steps, topM, sideM) {
    this.solids.push({ x0, x1, z0, z1, top:Math.max(y0, y1), ramp:{ axis, dir, y0, y1 } });
    const len = axis === 'x' ? x1 - x0 : z1 - z0, dh = (y1 - y0) / steps;
    for (let i = 0; i < steps; i++) {
      const a = len * i / steps, b = len * (i + 1) / steps, k = dir > 0 ? i : steps - 1 - i, top = y0 + dh * (k + 1);
      const [sx0, sx1, sz0, sz1] = axis === 'x' ? [x0 + a, x0 + b, z0, z1] : [x0, x1, z0 + a, z0 + b];
      const m = new THREE.Mesh(boxGeo(sx1 - sx0, top - (y0 - 0.02), sz1 - sz0, 1), [sideM, sideM, topM, sideM, sideM, sideM]);
      m.position.set((sx0 + sx1) / 2, (top + y0 - 0.02) / 2, (sz0 + sz1) / 2); m.castShadow = true; m.receiveShadow = true; this.group.add(m);
      const nose = new THREE.Mesh(boxGeo(axis === 'x' ? 0.08 : sx1 - sx0, 0.04, axis === 'x' ? sz1 - sz0 : 0.08, 1), mats().white);
      nose.position.set(axis === 'x' ? (dir > 0 ? sx1 : sx0) : (sx0 + sx1) / 2, top + 0.01, axis === 'x' ? (sz0 + sz1) / 2 : (dir > 0 ? sz1 : sz0)); this.group.add(nose);
    }
  },
  // lan can / tuong thap: doan thang co va cham
  rail(pts, base, kind = 'iron', h = 1.0) {
    const m = mats();
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, az] = pts[i], [bx, bz] = pts[i + 1], len = hyp(bx - ax, bz - az), ang = Math.atan2(bz - az, bx - ax);
      this.walls.push({ x0:ax, z0:az, x1:bx, z1:bz, base, top:base + h, th:kind === 'stone' ? 0.4 : 0.14 });
      const seg = new THREE.Group(); seg.position.set((ax + bx) / 2, base, (az + bz) / 2); seg.rotation.y = -ang; this.group.add(seg);
      if (kind === 'stone') {
        const wall = new THREE.Mesh(boxGeo(len, h, 0.4, 1), m.stone); wall.position.y = h / 2; wall.castShadow = wall.receiveShadow = true; seg.add(wall);
        const cap = new THREE.Mesh(boxGeo(len + 0.04, 0.1, 0.5, 1), m.paving); cap.position.y = h + 0.05; cap.castShadow = true; seg.add(cap);
        continue;
      }
      const postM = kind === 'wood' ? m.wood : m.ironDark, railM = kind === 'wood' ? m.wood : m.ironDark;
      const n = Math.max(1, Math.round(len / 1.3));
      for (let k = 0; k <= n; k++) {
        const p = new THREE.Mesh(kind === 'wood' ? boxGeo(0.14, h, 0.14, 1) : new THREE.CylinderGeometry(0.045, 0.05, h, 8), postM);
        p.position.set(-len / 2 + len * k / n, h / 2, 0); p.castShadow = true; seg.add(p);
        if (kind === 'iron' && k < n) for (let j = 1; j < 4; j++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, h * 0.8, 6), postM); b.position.set(-len / 2 + len * (k + j / 4) / n, h * 0.42, 0); seg.add(b); }
      }
      for (const y of kind === 'wood' ? [h * 0.45, h * 0.9] : [h, h * 0.15]) {
        const r = new THREE.Mesh(kind === 'wood' ? boxGeo(len, 0.1, 0.07, 1) : new THREE.CylinderGeometry(0.035, 0.035, len, 8), railM);
        if (kind !== 'wood') r.rotation.z = Math.PI / 2; r.position.y = y; r.castShadow = true; seg.add(r);
      }
    }
  },
  ringWall(cx, cz, r, base, h, mat) {
    const n = 28, pts = [];
    for (let i = 0; i <= n; i++) { const a = i / n * Math.PI * 2; pts.push([cx + Math.cos(a) * r, cz + Math.sin(a) * r]); }
    for (let i = 0; i < n; i++) this.walls.push({ x0:pts[i][0], z0:pts[i][1], x1:pts[i + 1][0], z1:pts[i + 1][1], base, top:base + h, th:0.45 });
    const t = new THREE.Mesh(new THREE.TorusGeometry(r, 0.26, 12, 64), mat); t.rotation.x = Math.PI / 2; t.scale.z = h / 0.52; t.position.set(cx, base + h / 2, cz); t.castShadow = t.receiveShadow = true; this.group.add(t);
  },
  addWater(cx, cz, r, y) {
    this.waters.push({ x:cx, z:cz, r, y });
    const w = new THREE.Mesh(new THREE.CircleGeometry(r, 48), mats().water); w.rotation.x = -Math.PI / 2; w.position.set(cx, y, cz); this.group.add(w);
    const f = new THREE.Mesh(new THREE.RingGeometry(r - 0.18, r, 48), mats().foam); f.rotation.x = -Math.PI / 2; f.position.set(cx, y + 0.01, cz); this.group.add(f);
    this.waterMeshes = (this.waterMeshes || []).concat([{ w, f, y }]);
  },
  circleCol(x, z, r, top = 99, stand = false) { this.cols.push({ x, z, r, top, stand }); },
  lamp(x, z) {
    const m = mats(), y = this.h(x, z), g = new THREE.Group(); g.position.set(x, y, z);
    put(g, new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.11, 3.2, 10), m.ironDark), 0, 1.6, 0).castShadow = true;
    put(g, new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.25, 10), m.ironDark), 0, 0.12, 0);
    put(g, new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 12), m.lampGlow), 0, 3.35, 0);
    put(g, new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.22, 12), m.ironDark), 0, 3.6, 0).castShadow = true;
    this.addProp(g, x, z, { x, z, r:0.15, top:99 });
  },
  bench(x, z, rotY = 0) {
    const m = mats(), y = this.h(x, z), g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = rotY;
    for (let i = 0; i < 3; i++) put(g, new THREE.Mesh(boxGeo(1.8, 0.06, 0.16, 1), m.wood), 0, 0.46, -0.18 + i * 0.18).castShadow = true;
    for (let i = 0; i < 2; i++) put(g, new THREE.Mesh(boxGeo(1.8, 0.06, 0.14, 1), m.wood), 0, 0.72 + i * 0.18, -0.3, -0.15, 0, 0).castShadow = true;
    for (const s of [-1, 1]) { put(g, new THREE.Mesh(boxGeo(0.08, 0.46, 0.55, 1), m.ironDark), s * 0.8, 0.23, -0.05); put(g, new THREE.Mesh(boxGeo(0.08, 0.5, 0.06, 1), m.ironDark), s * 0.8, 0.75, -0.32); }
    this.group.add(g);
    const sw = Math.abs(Math.sin(rotY)) > 0.5; const hw = sw ? 0.3 : 0.9, hd = sw ? 0.9 : 0.3;
    this.solids.push({ x0:x - hw, x1:x + hw, z0:z - hd, z1:z + hd, top:y + 0.5 });
  },
  crate(x, z, s = 0.7, base) {
    const m = mats(), y = base ?? this.h(x, z);
    const c = new THREE.Mesh(boxGeo(s, s, s, s), m.wood); c.position.set(x, y + s / 2, z); c.rotation.y = rand(-0.1, 0.1); c.castShadow = c.receiveShadow = true; this.group.add(c);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const e = new THREE.Mesh(boxGeo(0.06, s + 0.01, 0.06, 1), m.ironDark); e.position.set(x + sx * s / 2, y + s / 2, z + sz * s / 2); this.group.add(e); }
    this.solids.push({ x0:x - s / 2, x1:x + s / 2, z0:z - s / 2, z1:z + s / 2, top:y + s });
  },
  planter(x0, x1, z0, z1, h, hedge = true) {
    const m = mats(), y = this.h((x0 + x1) / 2, (z0 + z1) / 2);
    this.block(x0, x1, z0, z1, y + h, y, m.soil, m.stone, { solid:false });
    let top = y + h;
    if (hedge) {
      const hg = new THREE.Mesh(lumpy(new THREE.BoxGeometry(x1 - x0 - 0.15, 0.7, z1 - z0 - 0.15, 6, 3, 6), 0.03), m.hedge);
      hg.position.set((x0 + x1) / 2, y + h + 0.3, (z0 + z1) / 2); hg.castShadow = hg.receiveShadow = true; this.group.add(hg); top += 0.62;
      for (let i = 0; i < 6; i++) { const fl = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), new THREE.MeshStandardMaterial({ color:pick(['#ff6b8b', '#ffd43b', '#ffffff', '#b197fc']) })); fl.position.set(rand(x0 + 0.2, x1 - 0.2), top + 0.02, rand(z0 + 0.2, z1 - 0.2)); this.group.add(fl); }
    }
    this.solids.push({ x0, x1, z0, z1, top });
  },
  potPlant(x, z, s = 1) {
    const m = mats(), y = this.h(x, z), g = new THREE.Group(); g.position.set(x, y, z);
    put(g, new THREE.Mesh(new THREE.CylinderGeometry(0.45 * s, 0.32 * s, 0.75 * s, 20), m.terracotta), 0, 0.37 * s, 0).castShadow = true;
    put(g, new THREE.Mesh(new THREE.TorusGeometry(0.45 * s, 0.05 * s, 8, 24), m.terracotta), 0, 0.75 * s, 0, Math.PI / 2, 0, 0);
    for (let i = 0; i < 5; i++) { const b = new THREE.Mesh(new THREE.IcosahedronGeometry(rand(0.25, 0.38) * s, 2), m.hedge); b.position.set(rand(-0.2, 0.2) * s, (0.95 + rand(0, 0.35)) * s, rand(-0.2, 0.2) * s); b.castShadow = true; g.add(b); }
    this.addProp(g, x, z, { x, z, r:0.45 * s, top:y + 0.75 * s, stand:true });
  },
  hedgeRow(x0, x1, z0, z1, h = 0.9) {
    const m = mats(), y = this.h((x0 + x1) / 2, (z0 + z1) / 2);
    const hg = new THREE.Mesh(lumpy(new THREE.BoxGeometry(x1 - x0, h, z1 - z0, 8, 3, 8), 0.035), m.hedge);
    hg.position.set((x0 + x1) / 2, y + h / 2, (z0 + z1) / 2); hg.castShadow = hg.receiveShadow = true; this.group.add(hg);
    this.solids.push({ x0, x1, z0, z1, top:y + h });
  },
  skyline(color) {
    const t = textures().skyline;
    for (let i = 0; i < 26; i++) {
      const a = i / 26 * 6.283 + rand(-0.08, 0.08), r = rand(45, 85), w = rand(6, 14), hh = rand(18, 55), d = rand(6, 14);
      const tex = t.clone(); tex.needsUpdate = true; tex.repeat.set(w / 8, hh / 8);
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, hh, d), new THREE.MeshStandardMaterial({ color, map:tex, roughness:0.8 }));
      b.position.set(Math.cos(a) * r, -30 + hh / 2, Math.sin(a) * r); b.rotation.y = -a; this.group.add(b);
    }
  },
});

// ================= QUANG TRUONG CONG VIEN =================
World.prototype.build_plaza = function () {
  this.levelInit(22);
  const m = mats();
  // dao nen
  this.block(-15, 15, -16, 16, 0, -3, m.cobble, m.stone, { cast:false, tile:2.4 });
  const under = new THREE.Mesh(lumpy(new THREE.CylinderGeometry(18, 7, 10, 24, 4), 0.05), clipped(new THREE.MeshStandardMaterial({ color:0x7d756b, roughness:1 })));
  under.position.y = -8; this.group.add(under);
  // san thuong dong + tay (tuong da xep, bac thang, lan can sat)
  for (const s of [-1, 1]) {
    const xa = s < 0 ? -15 : 6.5, xb = s < 0 ? -6.5 : 15;
    this.block(xa, xb, -10, 10, 1.4, 0, m.paving, m.stone, { tile:2 });
    const sx0 = s < 0 ? -6.5 : 4, sx1 = s < 0 ? -4 : 6.5;
    this.stairs(sx0, sx1, -1.6, 1.6, 0, 1.4, 'x', s < 0 ? -1 : 1, 5, m.paving, m.stone);
    const ex = s * 6.5;
    this.rail([[ex, -10], [ex, -1.65]], 1.4, 'iron'); this.rail([[ex, 1.65], [ex, 10]], 1.4, 'iron');
    this.rail([[s * 15, -10], [s * 15, -4]], 1.4, 'stone', 0.7); this.rail([[s * 15, 4], [s * 15, 10]], 1.4, 'stone', 0.7);
  }
  // tang cao nhat (phia tay) + bac len
  this.block(-15, -11.5, -4, 4, 2.8, 1.4, m.paving, m.stone);
  this.stairs(-11.5, -9.5, -1.3, 1.3, 1.4, 2.8, 'x', -1, 5, m.paving, m.stone);
  this.rail([[-11.5, -4], [-11.5, -1.35]], 2.8, 'iron'); this.rail([[-11.5, 1.35], [-11.5, 4]], 2.8, 'iron');
  // choi nghi (phia dong)
  const gz = new THREE.Group(); gz.position.set(12, 1.4, 0); this.group.add(gz);
  for (const [px, pz] of [[-1.6, -1.6], [1.6, -1.6], [-1.6, 1.6], [1.6, 1.6]]) { put(gz, new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 2.6, 12), m.white), px, 1.3, pz).castShadow = true; this.circleCol(12 + px, pz, 0.18); }
  put(gz, new THREE.Mesh(new THREE.ConeGeometry(2.8, 1.3, 8), m.tiles), 0, 3.25, 0, 0, Math.PI / 8, 0).castShadow = true;
  put(gz, new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 0.15, 8), m.white), 0, 2.62, 0, 0, Math.PI / 8, 0);
  // san giua tron (co B) + dai phun nuoc phia bac
  this.block(-2.2, 2.2, -2.2, 2.2, 0.25, 0, m.paving, m.stone);
  this.ringWall(0, -8.5, 2.5, 0, 0.55, m.paving);
  this.addWater(0, -8.5, 2.3, 0.35);
  const fz = new THREE.Group(); fz.position.set(0, 0, -8.5); this.group.add(fz);
  put(fz, new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.85, 1.2, 20), m.paving), 0, 0.6, 0).castShadow = true;
  put(fz, new THREE.Mesh(new THREE.CylinderGeometry(1.3, 0.7, 0.3, 24), m.paving), 0, 1.3, 0).castShadow = true;
  put(fz, new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 0.7, 16), m.paving), 0, 1.75, 0);
  put(fz, new THREE.Mesh(new THREE.CircleGeometry(1.15, 24), m.water), 0, 1.46, 0, -Math.PI / 2, 0, 0);
  this.spray = put(fz, new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.2, 16, 1, true), new THREE.MeshPhysicalMaterial({ color:0xcfeeff, transparent:true, opacity:0.45, roughness:0.05, side:THREE.DoubleSide })), 0, 2.25, 0, Math.PI, 0, 0);
  this.circleCol(0, -8.5, 0.9);
  // bai co 4 goc + cay + ghe + den + bon hoa
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    this.block(sx < 0 ? -15 : 6.5, sx < 0 ? -6.5 : 15, sz < 0 ? -16 : 10, sz < 0 ? -10 : 16, 0.06, -0.02, m.grass, m.dirt, { cast:false, solid:false, tile:3 });
    this.tree(sx * 11, sz * 13, rand(0.95, 1.15));
    this.hedgeRow(sx < 0 ? -14.6 : 7, sx < 0 ? -7 : 14.6, sz * 15.4 - 0.3, sz * 15.4 + 0.3, 0.8);
  }
  for (const [x, z] of [[-5.2, -5], [5.2, -5], [-5.2, 5], [5.2, 5], [-5.2, -12.5], [5.2, -12.5], [-5.2, 12.5], [5.2, 12.5]]) this.lamp(x, z);
  this.bench(-3.6, -12.5, Math.PI / 2); this.bench(3.6, -12.5, -Math.PI / 2); this.bench(-3.6, 9, Math.PI / 2); this.bench(3.6, 9, -Math.PI / 2);
  this.bench(9.5, -7.5, 0); this.bench(-9.5, 7.5, Math.PI);
  this.planter(8, 10.5, 6.5, 8.5, 0.5); this.planter(-10.5, -8, -8.5, -6.5, 0.5);
  this.planter(-1.2, 1.2, 4.6, 5.6, 0.45); this.planter(-1.2, 1.2, -5.6, -4.6, 0.45);
  for (const [x, z] of [[13.5, -8.5], [13.5, 8.5], [-13.5, -8.5], [-13.5, 8.5], [-14, 3], [-14, -3]]) this.potPlant(x, z, 0.9);
  this.crate(8.5, 4, 0.7); this.crate(8.5, 4.75, 0.7); this.crate(8.5, 4.35, 0.7, 2.1);
  this.spots = { flags:[['A', -9, 0], ['B', 0, 0], ['C', 9, 0]], bases:{ red:[0, 13.5], blue:[0, -13.5] } };
  this.cliffColor = 0x7d756b;
  this.env = { sky:skyGrad(['#5fb0ee', '#bfe2fa', '#f2f6f8']), fog:'#d6eaf7', fogNear:60, fogFar:170,
               sun:'#fff6e8', sunI:2.9, hemiSky:'#d9ecff', hemiGround:'#8a7a62', hemiI:0.85, rim:'#ffffff', rimI:0.4, envI:0.35 };
  this.cloudLayer(0xffffff);
};

// ================= SAN THUONG THANH PHO =================
World.prototype.build_rooftop = function () {
  this.levelInit(22);
  const m = mats();
  this.block(-14, 14, -15, 15, 0, -40, m.gravel, m.facade, { cast:false, tile:3 });
  this.block(-2.2, 2.2, -2.2, 2.2, 0.03, -0.01, m.helipad, m.concrete, { cast:false, solid:false, tile:4.4 });
  // tuong chan mep (co khe de bi nem ra ngoai)
  this.rail([[-14, 15], [-4, 15]], 0, 'stone', 0.7); this.rail([[4, 15], [14, 15]], 0, 'stone', 0.7);
  this.rail([[14, -7.5], [14, 3]], 0, 'stone', 0.7); this.rail([[14, 7], [14, 15]], 0, 'stone', 0.7);
  this.rail([[-14, -7.5], [-14, -2]], 0, 'stone', 0.7); this.rail([[-14, 3], [-14, 15]], 0, 'stone', 0.7);
  // san go nang phia bac + cau thang + lan can
  this.block(-11, 11, -15, -7.5, 1.2, 0, m.wood, m.concrete, { tile:2 });
  this.stairs(-1.6, 1.6, -7.5, -5, 0, 1.2, 'z', -1, 5, m.wood, m.concrete);
  this.rail([[-11, -7.5], [-1.65, -7.5]], 1.2, 'iron'); this.rail([[1.65, -7.5], [11, -7.5]], 1.2, 'iron');
  this.rail([[-11, -15], [11, -15]], 1.2, 'iron');
  // thap nuoc
  const wt = new THREE.Group(); wt.position.set(7.5, 1.2, -12); this.group.add(wt);
  for (const [px, pz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) put(wt, new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 3, 8), m.ironDark), px, 1.5, pz).castShadow = true;
  put(wt, new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 2.4, 24), m.wood), 0, 4.2, 0).castShadow = true;
  put(wt, new THREE.Mesh(new THREE.ConeGeometry(1.65, 0.9, 24), m.ironDark), 0, 5.85, 0).castShadow = true;
  this.circleCol(7.5, -12, 1.5);
  // chui thang may (tang 3) + bac len
  this.block(9, 13.5, 3, 9, 2.4, 0, m.concrete, m.concrete);
  this.stairs(5.6, 9, 3.2, 5.2, 0, 2.4, 'x', 1, 7, m.concrete, m.concrete);
  this.rail([[9, 5.25], [9, 9]], 2.4, 'iron'); this.rail([[9, 9], [13.5, 9]], 2.4, 'iron');
  // may lanh, ong thong gio, gieng troi, pin mat troi
  const ac = (x, z) => { this.block(x - 1, x + 1, z - 0.7, z + 0.7, 1.1, 0, m.metal, m.metal); const f = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.05, 24), m.ironDark); f.position.set(x, 1.13, z); this.group.add(f); };
  ac(-9, 4.5); ac(-9, 7.2); ac(-5.5, 11.5); ac(-11, -3.5);
  for (const [x, z] of [[4.5, -3], [-4.5, -3.5], [11.5, -4.5]]) { const v = new THREE.Group(); v.position.set(x, 0, z); this.group.add(v); put(v, new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 1.4, 14), m.metal), 0, 0.7, 0).castShadow = true; put(v, new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.3, 14), m.metal), 0, 1.5, 0); this.circleCol(x, z, 0.3); }
  for (const [x, z] of [[-3.5, 6], [3.5, 6]]) { this.block(x - 1, x + 1, z - 0.8, z + 0.8, 0.5, 0, m.glass, m.concrete); }
  for (let i = 0; i < 3; i++) { const z = 10 + i * 1.6; this.block(5, 11, z - 0.5, z + 0.5, 0.35, 0, m.concrete, m.concrete); const p = new THREE.Mesh(boxGeo(6, 0.08, 1.2, 6), m.solar); p.position.set(8, 0.75, z); p.rotation.x = -0.4; p.castShadow = true; this.group.add(p); this.solids.push({ x0:5, x1:11, z0:z - 0.6, z1:z + 0.6, top:0.95 }); }
  for (const [x, z] of [[-12.5, 13.5], [12.5, 13.5], [-12.5, -6], [6, 1.5]]) this.potPlant(x, z, 0.85);
  this.crate(-3, 11, 0.7); this.crate(-2.2, 11, 0.7); this.crate(-2.6, 11, 0.7, 0.7);
  // day den trang tri tren san go
  for (let i = 0; i < 18; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), m.lampGlow); const t = i / 17; b.position.set(-10 + t * 20, 3.2 - Math.sin(t * Math.PI) * 0.6, -14.6); this.group.add(b); }
  for (const x of [-10.5, 10.5]) { put(this.group, new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.2, 8), m.ironDark), x, 2.3, -14.6); }
  this.skyline(0xffffff);
  this.spots = { flags:[['A', -9, 0], ['B', 0, 0], ['C', 9, 0]], bases:{ red:[0, 12.5], blue:[0, -11.5] } };
  this.cliffColor = 0xd9cfc0;
  this.env = { sky:skyGrad(['#4f8fd6', '#a9cdef', '#ffe3c2']), fog:'#cfdcea', fogNear:60, fogFar:180,
               sun:'#ffe6c8', sunI:2.8, hemiSky:'#cfe3ff', hemiGround:'#7a7068', hemiI:0.8, rim:'#ffd8b0', rimI:0.5, envI:0.35 };
};

// ================= KHU VUON SAU NHA =================
World.prototype.build_garden = function () {
  this.levelInit(22);
  const m = mats();
  this.block(-15, 15, -12, 16, 0, -3, m.grass, m.dirt, { cast:false, tile:3 });
  const under = new THREE.Mesh(lumpy(new THREE.CylinderGeometry(17, 7, 10, 24, 4), 0.05), clipped(new THREE.MeshStandardMaterial({ color:0x6b4f36, roughness:1 })));
  under.position.y = -8; this.group.add(under);
  // san go + bac + lan can + tuong nha
  this.block(-15, 15, -17, -9, 0.9, -3, m.wood, m.wood, { tile:2 });
  this.stairs(-2, 2, -9, -6.6, 0, 0.9, 'z', -1, 4, m.wood, m.wood);
  this.rail([[-13, -9], [-2.05, -9]], 0.9, 'wood'); this.rail([[2.05, -9], [13, -9]], 0.9, 'wood');
  this.block(-15, 15, -20, -17, 7, -3, m.facade, m.facade, { tile:4 });
  const door = new THREE.Mesh(boxGeo(1.8, 2.6, 0.1, 1), m.wood); door.position.set(0, 2.2, -16.95); this.group.add(door);
  const roof = new THREE.Mesh(boxGeo(31, 0.4, 4.5, 2), m.tiles); roof.position.set(0, 7.4, -18.2); roof.rotation.x = 0.35; roof.castShadow = true; this.group.add(roof);
  for (const x of [-9, 9]) { const pot = this.potPlant; pot.call(this, x, -15.5, 1); }
  this.bench(-6, -15.6, 0); this.bench(6, -15.6, 0);
  // hang rao go hai ben (co khe)
  this.rail([[-15, -9], [-15, 1]], 0, 'wood', 1.1); this.rail([[-15, 5], [-15, 16]], 0, 'wood', 1.1);
  this.rail([[15, -9], [15, -2]], 0, 'wood', 1.1); this.rail([[15, 2.5], [15, 16]], 0, 'wood', 1.1);
  // luong rau / hoa (hop go dat cao)
  const bed = (x0, x1, z0, z1) => {
    this.block(x0, x1, z0, z1, 0.6, 0, m.soil, m.wood, { tile:1 });
    for (let x = x0 + 0.35; x < x1 - 0.2; x += 0.55) for (let z = z0 + 0.35; z < z1 - 0.2; z += 0.6) {
      const p = new THREE.Mesh(new THREE.IcosahedronGeometry(rand(0.16, 0.24), 1), new THREE.MeshStandardMaterial({ color:pick([0x4f9a3a, 0x5fae44, 0x3f8a32]), roughness:0.8 }));
      p.position.set(x + rand(-0.05, 0.05), 0.75, z); p.castShadow = true; this.group.add(p);
      if (Math.random() < 0.35) { const f = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), new THREE.MeshStandardMaterial({ color:pick(['#ff5d5d', '#ffd43b', '#ff8fab', '#ffa94d']) })); f.position.set(x, 0.95, z); this.group.add(f); }
    }
  };
  bed(-12, -7, 2.6, 4.2); bed(-12, -7, 6.2, 7.8); bed(4, 7.5, -5.5, -4);
  // ao + da buoc
  this.addWater(8.5, 6.5, 3, 0.04);
  for (let i = 0; i < 5; i++) { const a = -0.6 + i * 0.45, st = new THREE.Mesh(lumpy(new THREE.CylinderGeometry(0.45, 0.5, 0.18, 14), 0.06), m.paving); st.position.set(8.5 + Math.cos(a) * 1.4, 0.1, 6.5 + Math.sin(a) * 1.4 - 0.5); st.castShadow = st.receiveShadow = true; this.group.add(st); }
  for (let i = 0; i < 6; i++) { const lp = new THREE.Mesh(new THREE.CircleGeometry(rand(0.25, 0.4), 16, 0.3, 5.8), new THREE.MeshStandardMaterial({ color:0x4f9a3a, side:THREE.DoubleSide })); lp.rotation.x = -Math.PI / 2; lp.position.set(8.5 + rand(-2, 2), 0.07, 6.5 + rand(-2, 2)); this.group.add(lp); }
  // nha kho + thung go de treo len
  this.block(-14.5, -9.5, 10, 14.5, 2.5, 0, m.wood, m.wood);
  const sr = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 3.6, 1.4, 4, 1), m.tiles); sr.position.set(-12, 3.2, 12.25); sr.rotation.y = Math.PI / 4; sr.scale.set(1, 1, 0.9); sr.castShadow = true; this.group.add(sr);
  this.solids.push({ x0:-14.2, x1:-9.8, z0:10.3, z1:14.2, top:2.5 });
  this.crate(-8.9, 12.6, 0.7); this.crate(-8.9, 11.8, 0.7); this.crate(-8.9, 12.2, 0.7, 0.7);
  this.crate(-7.9, 13.5, 0.6);
  // ban picnic + ghe
  this.block(1.5, 4.5, 9.5, 10.7, 0.8, 0.7, m.wood, m.wood, { tile:1 });
  for (const [x, z] of [[1.7, 9.7], [4.3, 9.7], [1.7, 10.5], [4.3, 10.5]]) { const l = new THREE.Mesh(boxGeo(0.1, 0.7, 0.1, 1), m.wood); l.position.set(x, 0.35, z); this.group.add(l); }
  this.block(1.5, 4.5, 8.6, 9.0, 0.45, 0.35, m.wood, m.wood, { tile:1 }); this.block(1.5, 4.5, 11.2, 11.6, 0.45, 0.35, m.wood, m.wood, { tile:1 });
  // chau hoa khong lo, cay, bui
  for (const [x, z, s] of [[-4, -4, 1.2], [12.5, -6.5, 1.1], [-13, -6.5, 1.0], [12.5, 13.5, 1.2]]) this.potPlant(x, z, s);
  this.tree(-12.5, -3, 1.1); this.tree(12, 12.5, 1.15); this.tree(-3, 14, 1.0);
  for (const [x, z] of [[6, 14.5], [-6, 14.8], [13.8, 0.5], [-13.8, 3]]) this.bush(x, z, 1.1);
  // co
  const lawn = (x, z, y) => y > -0.02 && y < 0.05 && !this.waters.some(w => hyp(x - w.x, z - w.z) < w.r + 0.2) && z > -9;
  this.buildGrass(18000, lawn, 0.5);
  this.buildFlowers(300, lawn);
  this.spots = { flags:[['A', -9, 0], ['B', 0, 1.5], ['C', 9, 0]], bases:{ red:[0, 13.5], blue:[0, -12.5] } };
  this.cliffColor = 0x6b4f36;
  this.env = { sky:skyGrad(['#58aef0', '#c4e6fb', '#f6f4ea']), fog:'#d8ecf7', fogNear:60, fogFar:170,
               sun:'#fff4e2', sunI:2.9, hemiSky:'#dbeeff', hemiGround:'#6b8a4a', hemiI:0.85, rim:'#ffffff', rimI:0.4, envI:0.35 };
  this.cloudLayer(0xffffff);
};

function skyGrad(c) {
  return canvasTex(256, (g, s) => { const gr = g.createLinearGradient(0, 0, 0, s); gr.addColorStop(0, c[0]); gr.addColorStop(0.55, c[1]); gr.addColorStop(1, c[2]); g.fillStyle = gr; g.fillRect(0, 0, s, s); }, 1);
}

export const LEVELS = [
  { id:'plaza',   vn:'Quảng Trường', desc:'Quảng trường lát đá, sân thượng hai bên có bậc thang và lan can, đài phun nước, chòi nghỉ, tầng cao nhất.' },
  { id:'rooftop', vn:'Sân Thượng',   desc:'Nóc nhà cao tầng: sàn gỗ nâng, cầu thang, tháp nước, máy lạnh, tường chắn mép có khe để rơi xuống.' },
  { id:'garden',  vn:'Khu Vườn',     desc:'Sân gỗ, bãi cỏ, luống rau, ao có đá bước, nhà kho trèo lên được bằng thùng gỗ.' },
];
