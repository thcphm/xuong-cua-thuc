/* Căn nhà 3D. Toạ độ dùng chung với mặt bằng 2D: 50 đơn vị bản vẽ = 1 mét. */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { createMascot, tpShape, tpTexture } from './mascot.js';
import { buildPlant } from './plants.js';

const canvas = document.getElementById('world');
const Walk = window.Walk;
const Music = window.Music;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const lowPower = matchMedia('(pointer: coarse)').matches;

const P = (x, y) => [(x - 500) / 50, (y - 310) / 50];

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(lowPower ? 1.5 : 2, devicePixelRatio));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#05070d');
scene.fog = new THREE.Fog('#05070d', 34, 66);
const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 140);

const hemi = new THREE.HemisphereLight('#6d8fc9', '#0a1020', 1.7);
scene.add(hemi);
const moon = new THREE.DirectionalLight('#a8c4ff', 1.5);
moon.position.set(-7, 18, 10);
moon.castShadow = true;
moon.shadow.mapSize.set(lowPower ? 1024 : 2048, lowPower ? 1024 : 2048);
Object.assign(moon.shadow.camera, { left: -13, right: 17, top: 11, bottom: -11, near: 1, far: 48 });
moon.shadow.bias = -0.0006;
scene.add(moon);

const std = (color, opts = {}) => new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.72, metalness: 0.08 }, opts));
const glow = (color, power = 1.6) => new THREE.MeshStandardMaterial({ color: '#000000', emissive: color, emissiveIntensity: power });

function box(parent, w, h, d, x, y, z, material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}
function cyl(parent, r1, r2, h, x, y, z, material, seg = 32) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}
function ball(parent, r, x, y, z, material, sy = 1) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, 28, 18), material);
  mesh.position.set(x, y, z);
  mesh.scale.y = sy;
  mesh.castShadow = mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

const house = new THREE.Group();
scene.add(house);

/* Đồ vật bấm được trong phòng */
const hots = [];
function addHot(mesh, room, tip, action, opts) {
  mesh.userData.hot = Object.assign({ mesh, room, tip, action, k: 0, home: mesh.position.clone() }, opts);
  hots.push(mesh.userData.hot);
}

/* Nền và móng nhà */
const WALL = '#16253d', WOOD = '#1d2a42', FURN = '#22324f', FURN2 = '#2c3f60';
box(house, 19.2, 0.5, 12, 0, -0.27, 0, std('#0a1220'));
const seam = new THREE.LineSegments(
  new THREE.EdgesGeometry(new THREE.BoxGeometry(19.24, 0.5, 12.04)),
  new THREE.LineBasicMaterial({ color: '#3f6fb0', transparent: true, opacity: 0.8 })
);
seam.position.y = -0.27;
house.add(seam);
/* Mặt đất có một ô hở làm miệng dốc xuống tầng hầm */
const groundShape = new THREE.Shape();
groundShape.absarc(0, 0, 60, 0, Math.PI * 2, false);
{
  const pit = new THREE.Path();
  pit.moveTo(-9.0, -10.6); pit.lineTo(-9.0, -6.0); pit.lineTo(-5.4, -6.0); pit.lineTo(-5.4, -10.6); pit.closePath();
  groundShape.holes.push(pit);
}
const ground = new THREE.Mesh(new THREE.ShapeGeometry(groundShape, 48), std('#060a13', { roughness: 0.9, side: THREE.DoubleSide }));
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.53;
ground.receiveShadow = true;
scene.add(ground);

/* Sao trời */
{
  const count = 520, data = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2, r = 22 + Math.random() * 34;
    data[i * 3] = Math.cos(a) * r;
    data[i * 3 + 1] = 2 + Math.random() * 26;
    data[i * 3 + 2] = Math.sin(a) * r - 12;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(data, 3));
  scene.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: '#b9cdf0', size: 0.09, transparent: true, opacity: 0.75, fog: false })));
}

/* Phòng */
const LOCKED = new Set(window.SITE.lockedRooms || []);
const ROOMS = {
  nhac: { rect: [40, 30, 490, 340], color: '#a9a4f5', floor: '#1a2045', light: [345, 130, 2.6], power: 42 },
  sach: { rect: [570, 30, 960, 210], color: '#f2c879', floor: '#2b2320', light: [770, 125, 2.2], power: 30 },
  cong: { rect: [570, 210, 960, 400], color: '#86e28a', floor: '#102519', light: [760, 305, 2.2], power: 26 },
  game: { rect: [570, 400, 960, 590], color: '#6fe0d2', floor: '#0e2a38', light: [790, 490, 2.2], power: 30 },
  hoc: { rect: [40, 340, 290, 590], color: '#9fd3ff', floor: '#11203a', light: [165, 420, 2.2], power: 22 },
  garage: { rect: [965, 150, 1190, 590], color: '#ffa873', floor: '#191c25', light: [1075, 400, 2.1], power: 30, hit: 2.5, label: [1060, 590, 1.4] },
  san: { rect: [965, 150, 1190, 370], y: 2.7, color: '#c7b8ff', floor: '#20263a', light: [1075, 260, 4.6], power: 26, label: [1075, 260, 4.5] },
  vuon: { rect: [965, 370, 1140, 590], y: 2.7, color: '#a5e27f', floor: '#33291c', light: [1050, 480, 4.6], power: 26, label: [1050, 480, 4.5] },
  kehoach: { rect: [250, 590, 390, 780], color: '#e88bff', floor: '#1d1830', light: [330, 700, 2.6], power: 14 },
  bep: { rect: [470, 590, 830, 780], color: '#ff7557', floor: '#2a1c18', light: [730, 720, 2.8], power: 14 },
  nghi: { rect: [-240, 340, 40, 590], color: '#ff9fb2', floor: '#241a26', light: [-110, 470, 2.8], power: 14 },
  ham: { rect: [20, 10, 980, 610], y: -3.6, color: '#ff8fa3', floor: '#1d2433', light: [500, 330, -1.2], power: 60, label: [140, 770, 0.5] }
};
const floors = [];
Object.keys(ROOMS).forEach((id) => {
  const room = ROOMS[id], [x0, y0, x1, y1] = room.rect;
  const [ax, az] = P(x0, y0), [bx, bz] = P(x1, y1);
  const base = room.y || 0, tall = room.hit || 1.7;
  const floor = box(house, bx - ax, 0.04, bz - az, (ax + bx) / 2, base, (az + bz) / 2, std(room.floor, { roughness: 0.55 }));
  /* Vùng bấm cao bằng cả phòng: bấm trúng đồ đạc vẫn vào đúng phòng đó */
  const hit = new THREE.Mesh(new THREE.BoxGeometry(bx - ax, tall, bz - az), floor.material);
  hit.position.set((ax + bx) / 2, base + tall / 2, (az + bz) / 2);
  hit.visible = false;
  hit.userData.room = id;
  house.add(hit);
  floors.push(hit);
  room.pointLight = new THREE.PointLight(room.color, 0, 13, 1.7);
  const [lx, lz] = P(room.light[0], room.light[1]);
  room.pointLight.position.set(lx, room.light[2], lz);
  house.add(room.pointLight);
  const line = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(ax + 0.14, base + 0.05, az + 0.14), new THREE.Vector3(bx - 0.14, base + 0.05, az + 0.14),
      new THREE.Vector3(bx - 0.14, base + 0.05, bz - 0.14), new THREE.Vector3(ax + 0.14, base + 0.05, bz - 0.14)
    ]),
    new THREE.LineBasicMaterial({ color: room.color, transparent: true, opacity: 0, toneMapped: false })
  );
  house.add(line);
  room.edge = line;
  room.level = 0;
  room.glows = [];
  room.doors = [];
});
{
  const [ax, az] = P(290, 340), [bx, bz] = P(570, 590);
  box(house, bx - ax, 0.04, bz - az, (ax + bx) / 2, 0, (az + bz) / 2, std('#101a2e', { roughness: 0.55 }));
  const [cx, , cz] = [...P(530, 185)].flatMap((v, i) => (i === 0 ? [v, 0] : [v]));
  box(house, 1.6, 0.04, 6.2, cx, 0, cz, std('#101a2e', { roughness: 0.55 }));
}

/* Tường: tường phía máy quay hạ thấp như nhà búp bê */
const wallMat = std(WALL), wallCap = new THREE.MeshBasicMaterial({ color: '#4a6c9c' });
function wall(x1, y1, x2, y2, h, t = 0.16) {
  const [ax, az] = P(x1, y1), [bx, bz] = P(x2, y2);
  const horizontal = y1 === y2;
  const w = horizontal ? Math.abs(bx - ax) + t : t, d = horizontal ? t : Math.abs(bz - az) + t;
  const cx = (ax + bx) / 2, cz = (az + bz) / 2;
  box(house, w, h, d, cx, h / 2, cz, wallMat);
  box(house, w, 0.02, d, cx, h + 0.01, cz, wallCap).castShadow = false;
}
const TALL = 2.5, MID = 1.7, LOW = 0.32;
Walk.WALLS.forEach(([x1, y1, x2, y2]) => {
  /* Tường trước: chừa lối sang Phòng Kế Hoạch (300 tới 360), cửa chính (390 tới 470) và lối sang Phòng Bếp (490 tới 550) */
  if (y1 === 590 && y2 === 590) { wall(40, 590, 300, 590, LOW); wall(360, 590, 390, 590, LOW); wall(470, 590, 490, 590, LOW); wall(550, 590, 960, 590, LOW); return; }
  if (x1 === 960 && x2 === 960) return wall(x1, y1, x2, y2, LOW);
  if (y1 === 30 && y2 === 30) return wall(x1, y1, x2, y2, TALL, 0.2);
  /* Tường trái: đoạn giáp Phòng nghỉ hạ thấp để nhìn thấy phòng, chừa lối sang (500 tới 560) */
  if (x1 === 40 && x2 === 40) return wall(x1, y1, x2, y2, y1 >= 340 ? LOW : TALL, 0.2);
  wall(x1, y1, x2, y2, MID);
});

/* Cửa: bản lề, góc hé, góc mở (độ, chiều như trong bản vẽ) */
const doorMat = std('#35527f');
[['nhac', 490, 200, 14, 84], ['sach', 570, 90, -14, -84], ['cong', 570, 280, -14, -84], ['game', 570, 465, -14, -84], ['hoc', 290, 430, 14, 84]].forEach(([id, x, y, ajar, open]) => {
  const [hx, hz] = P(x, y);
  const pivot = new THREE.Group();
  pivot.position.set(hx, 0, hz);
  house.add(pivot);
  box(pivot, 0.07, 1.5, 1.14, 0, 0.77, 0.57, doorMat);
  ball(pivot, 0.05, 0.08, 0.8, 1.0, new THREE.MeshBasicMaterial({ color: ROOMS[id].color }));
  ROOMS[id].doors.push({ pivot, ajar: LOCKED.has(id) ? 0 : THREE.MathUtils.degToRad(-ajar), open: LOCKED.has(id) ? 0 : THREE.MathUtils.degToRad(-open) });
  if (LOCKED.has(id)) {
    const brass = new THREE.MeshStandardMaterial({ color: '#000000', emissive: '#4fdcff', emissiveIntensity: 1.4 });
    box(pivot, 0.05, 0.2, 0.24, -0.08, 0.92, 0.57, brass);
    const shackle = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.02, 10, 24, Math.PI), brass);
    shackle.rotation.y = Math.PI / 2;
    shackle.position.set(-0.08, 1.02, 0.57);
    pivot.add(shackle);
  }
});

/* Phòng nhạc */
const wood = std(WOOD), furn = std(FURN), furn2 = std(FURN2), black = std('#080c14', { roughness: 0.35 });
let disc, tonearm, speakers = [];
{
  const [x, z] = P(345, 72);
  box(house, 3.6, 0.62, 1.1, x, 0.33, z, wood);
  cyl(house, 0.52, 0.52, 0.08, x, 0.68, z, furn2);
  disc = cyl(house, 0.47, 0.47, 0.03, x, 0.74, z, black);
  const label = new THREE.Mesh(new THREE.CircleGeometry(0.2, 32), new THREE.MeshBasicMaterial({ map: tpTexture({ fg: '#0a0d14', bg: '#a9a4f5', size: 128 }) }));
  label.rotation.x = -Math.PI / 2;
  label.position.y = 0.017;
  disc.add(label);
  addHot(disc, 'nhac', 'Bấm để phát hoặc dừng', () => Music.toggle(), { noMove: true });
  tonearm = new THREE.Group();
  tonearm.position.set(x + 0.72, 0.78, z - 0.34);
  house.add(tonearm);
  box(tonearm, 0.05, 0.05, 0.86, 0, 0.03, 0.43, std('#b8c6da', { metalness: 0.7, roughness: 0.3 }));
  cyl(tonearm, 0.07, 0.07, 0.1, 0, 0, 0, furn2);
  [-1.45, 1.45].forEach((dx) => {
    box(house, 0.62, 1.5, 0.55, x + dx, 0.77, z + 0.02, std('#0f1729'));
    const cone = cyl(house, 0.2, 0.2, 0.03, x + dx, 0.95, z + 0.31, glow('#a9a4f5', 0.9));
    cone.rotation.x = Math.PI / 2;
    cone.castShadow = false;
    speakers.push(cone);
  });
  const [rx, rz] = P(300, 235);
  cyl(house, 1.5, 1.5, 0.02, rx, 0.03, rz, std('#232a55'));
  ball(house, 0.62, rx, 0.3, rz, std('#5a5ab0'), 0.62);
}

/* Phòng sách */
{
  const [x, z] = P(790, 54);
  box(house, 6, 2.1, 0.08, x, 1.07, z - 0.2, wood);
  [0.1, 0.72, 1.34, 1.96].forEach((y) => box(house, 6, 0.06, 0.48, x, y + 0.02, z, wood));
  const PALETTE = ['#28405f', '#5a4630', '#7d3f3a', '#3f6b64', '#8a7240', '#39345f', '#a58a58', '#c9c1ad'].map((c) => new THREE.Color(c));
  const dummy = new THREE.Object3D(), matrixList = [];
  [0.13, 0.75, 1.37].forEach((y, tier) => {
    let cursor = x - 2.9;
    while (cursor < x + 2.8) {
      const w = 0.07 + Math.random() * 0.09, h = 0.36 + Math.random() * 0.17;
      const gap = tier === 1 && Math.abs(cursor - x) < 0.75;
      if (!gap && Math.random() < 0.9) matrixList.push([cursor + w / 2, y + h / 2, z, w, h]);
      cursor += w + 0.015;
    }
  });
  const books = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 0.34), std('#ffffff'), matrixList.length);
  matrixList.forEach(([px, py, pz, w, h], i) => {
    dummy.position.set(px, py, pz);
    dummy.scale.set(w, h, 1);
    dummy.updateMatrix();
    books.setMatrixAt(i, dummy.matrix);
    books.setColorAt(i, PALETTE[Math.floor(Math.random() * PALETTE.length)]);
  });
  books.castShadow = true;
  house.add(books);

  /* Sách thật trong dữ liệu: to hơn, rút ra được */
  window.SITE.books.list.forEach((book, i, list) => {
    const mesh = box(house, 0.3, 0.56, 0.38, x + (i - (list.length - 1) / 2) * 0.42, 1.05, z + 0.02, std(book.color, { emissive: book.color, emissiveIntensity: 0.25 }));
    addHot(mesh, 'sach', 'Rút cuốn ' + book.title, () => document.dispatchEvent(new CustomEvent('tp:pick-book', { detail: i })), { pull: 0.34, book: i });
  });

  const [lx, lz] = P(915, 165);
  cyl(house, 0.2, 0.26, 0.05, lx, 0.05, lz, black);
  cyl(house, 0.025, 0.025, 2.0, lx, 1.05, lz, black);
  const shade = cyl(house, 0.26, 0.4, 0.42, lx, 2.15, lz, glow('#f2c879', 2.4));
  shade.castShadow = false;
  ROOMS.sach.glows.push({ mat: shade.material, base: 2.4 });

  const [cx, cz] = P(675, 150);
  box(house, 1.15, 0.45, 1.05, cx, 0.25, cz, std('#5a4630'));
  box(house, 1.15, 0.9, 0.24, cx, 0.72, cz - 0.42, std('#6a5338'));
  [-0.5, 0.5].forEach((d) => box(house, 0.18, 0.66, 1.05, cx + d, 0.35, cz, std('#6a5338')));
}

/* Phòng Công Nghệ: tủ máy chủ, terminal chạy chữ */
const leds = [];
let termDraw = () => {};
{
  const [rx, rz] = P(850, 232);
  [-1, 0, 1].forEach((i) => {
    const cabinet = box(house, 0.86, 2.15, 0.7, rx + i * 0.98, 1.1, rz, std('#0d1524', { roughness: 0.35, metalness: 0.6 }));
    addHot(cabinet, 'cong', 'Mở bài tập', () => document.dispatchEvent(new Event('tp:lab')), { noMove: true });
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 3; col++) {
        const material = new THREE.MeshBasicMaterial({ color: col === 0 ? '#86e28a' : col === 1 ? '#9fd3ff' : '#f2c879', toneMapped: false });
        const led = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.035, 0.01), material);
        led.position.set(rx + i * 0.98 - 0.22 + col * 0.22, 0.42 + row * 0.22, rz + 0.356);
        house.add(led);
        leds.push({ material, phase: Math.random() * 10, speed: 2 + Math.random() * 7, base: new THREE.Color(material.color) });
      }
    }
  });
  const [x, z] = P(665, 234);
  box(house, 2.3, 0.08, 0.9, x, 0.78, z, wood);
  [-1.05, 1.05].forEach((d) => box(house, 0.09, 0.76, 0.8, x + d, 0.39, z, black));
  box(house, 0.08, 0.3, 0.08, x, 0.96, z - 0.1, black);
  box(house, 1.8, 1.0, 0.06, x, 1.5, z - 0.1, black);
  const c = document.createElement('canvas');
  c.width = 512; c.height = 284;
  const g = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const LINES = ['$ whoami', 'thuc', '$ ls xuong/', 'nhac  sach  hoc  giaitri', '$ git push', 'main -> main', '$ python main.py', 'pygame khoi dong', '$ echo TP', 'TP'];
  let offset = 0;
  termDraw = () => {
    offset++;
    g.fillStyle = '#04100c';
    g.fillRect(0, 0, 512, 284);
    g.font = '26px Consolas, monospace';
    for (let i = 0; i < 8; i++) {
      const text = LINES[(offset + i) % LINES.length];
      g.fillStyle = text.startsWith('$') ? '#86e28a' : '#c8f5cb';
      g.fillText(text, 22, 42 + i * 33);
    }
    tex.needsUpdate = true;
  };
  termDraw();
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.92), new THREE.MeshBasicMaterial({ map: tex }));
  screen.position.set(x, 1.5, z - 0.065);
  house.add(screen);
  addHot(screen, 'cong', 'Mở bài tập', () => document.dispatchEvent(new Event('tp:lab')), { noMove: true });
  const [cx, cz] = P(665, 306);
  cyl(house, 0.3, 0.3, 0.1, cx, 0.5, cz, furn2);
  cyl(house, 0.05, 0.05, 0.46, cx, 0.25, cz, black);
}

/* Phòng Giải Trí */
{
  const [x, z] = P(800, 432);
  box(house, 4.2, 0.08, 1.0, x, 0.78, z, wood);
  [-1.9, 1.9].forEach((dx) => box(house, 0.1, 0.76, 0.9, x + dx, 0.39, z, black));
  const brand = tpTexture({ fg: '#04121a', bg: '#6fe0d2', size: 256 });
  [-0.85, 0.85].forEach((dx, i) => {
    box(house, 0.08, 0.34, 0.08, x + dx, 0.98, z - 0.1, black);
    box(house, 1.55, 0.9, 0.06, x + dx, 1.5, z - 0.1, black);
    const material = i === 0
      ? new THREE.MeshBasicMaterial({ map: brand, toneMapped: true })
      : new THREE.MeshStandardMaterial({ color: '#000000', emissive: '#6fe0d2', emissiveIntensity: 0.85 });
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.45, 0.8), material);
    screen.position.set(x + dx, 1.5, z - 0.065);
    house.add(screen);
  });
  const [cx, cz] = P(800, 508);
  cyl(house, 0.34, 0.34, 0.12, cx, 0.56, cz, furn2);
  box(house, 0.66, 0.72, 0.1, cx, 1.0, cz + 0.32, furn2);
  cyl(house, 0.05, 0.05, 0.5, cx, 0.27, cz, black);
  cyl(house, 0.34, 0.34, 0.04, cx, 0.05, cz, black);

  const [ax, az] = P(630, 435);
  const cabinet = box(house, 0.92, 2.1, 0.8, ax, 1.07, az, std('#1a2a55', { emissive: '#1a2a55', emissiveIntensity: 0.35 }));
  addHot(cabinet, 'game', 'Chơi Fluffy Frenzy', () => document.dispatchEvent(new Event('tp:play')), { noMove: true, glowUp: true });
  box(house, 0.96, 0.08, 0.5, ax, 0.9, az + 0.56, furn2);
  const arcade = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.6), new THREE.MeshBasicMaterial({ map: tpTexture({ fg: '#f2c879', bg: '#101a3a', size: 128 }) }));
  arcade.position.set(ax, 1.5, az + 0.41);
  house.add(arcade);
  ball(house, 0.05, ax - 0.2, 1.0, az + 0.6, new THREE.MeshBasicMaterial({ color: '#e8574f' }));
  ball(house, 0.05, ax + 0.12, 1.0, az + 0.6, new THREE.MeshBasicMaterial({ color: '#6fe0d2' }));
}

/* Phòng học */
{
  const [x, z] = P(165, 374);
  box(house, 3.2, 0.08, 0.9, x, 0.74, z, wood);
  [-1.45, 1.45].forEach((dx) => box(house, 0.09, 0.72, 0.8, x + dx, 0.37, z, black));
  box(house, 0.74, 0.03, 0.5, x - 0.2, 0.8, z + 0.05, furn2);
  box(house, 0.74, 0.46, 0.03, x - 0.2, 1.03, z - 0.2, furn2);
  const laptop = new THREE.Mesh(new THREE.PlaneGeometry(0.66, 0.4), glow('#9fd3ff', 1.1));
  laptop.position.set(x - 0.2, 1.03, z - 0.18);
  house.add(laptop);
  cyl(house, 0.03, 0.03, 0.56, x + 1.1, 1.05, z, black);
  const lamp = cyl(house, 0.1, 0.18, 0.18, x + 1.1, 1.36, z, glow('#9fd3ff', 2.2));
  lamp.castShadow = false;
  ROOMS.hoc.glows.push({ mat: lamp.material, base: 2.2 });
  const [cx, cz] = P(165, 432);
  cyl(house, 0.3, 0.3, 0.1, cx, 0.5, cz, furn2);
  cyl(house, 0.05, 0.05, 0.46, cx, 0.25, cz, black);

  const c = document.createElement('canvas');
  c.width = 512; c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#10302e'; g.fillRect(0, 0, 512, 256);
  g.strokeStyle = 'rgba(223,232,243,.65)'; g.lineWidth = 4;
  g.beginPath();
  g.moveTo(180, 60); g.lineTo(450, 60); g.moveTo(180, 110); g.lineTo(400, 110); g.moveTo(180, 160); g.lineTo(430, 160);
  g.stroke();
  g.fillStyle = 'rgba(223,232,243,.85)';
  g.translate(40, 60); g.scale(1.15, 1.15);
  g.fill(new Path2D('M0 0H78A30 30 0 0 1 78 60H62V100H48V14H34V100H20V14H0Z M62 14V46H76A16 16 0 0 0 76 14Z'), 'evenodd');
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const [bx, bz] = P(165, 340);
  box(house, 2.5, 1.06, 0.05, bx, 1.2, bz + 0.1, wood);
  const board = new THREE.Mesh(new THREE.PlaneGeometry(2.36, 0.94), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 }));
  board.position.set(bx, 1.2, bz + 0.13);
  house.add(board);
}

/* Sảnh: thảm logo, cây, kệ giày, cửa chính */
{
  const [x, z] = P(430, 470);
  const mat = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.9), new THREE.MeshBasicMaterial({ map: tpTexture({ fg: '#4fdcff', bg: '#101c33', size: 256 }) }));
  mat.rotation.x = -Math.PI / 2;
  mat.position.set(x, 0.035, z);
  mat.receiveShadow = true;
  house.add(mat);
  /* Cây cảnh đứng ở góc trong của sảnh, không chắn lối sang Phòng Bếp */
  const [px, pz] = P(318, 372);
  cyl(house, 0.2, 0.15, 0.32, px, 0.18, pz, furn2);
  for (let i = 0; i < 7; i++) {
    const a = i / 7 * Math.PI * 2;
    ball(house, 0.2, px + Math.cos(a) * 0.17, 0.56 + (i % 3) * 0.14, pz + Math.sin(a) * 0.17, std('#2a6b58'));
  }
  /* Kệ giày dựa tường phải của sảnh, không chắn lối sang Phòng Kế Hoạch */
  const [sx, sz] = P(552, 402);
  box(house, 0.5, 0.42, 1.3, sx, 0.23, sz, wood);
}

/* Phòng Bếp: khối nối phía trước sảnh, bên phải cửa chính, vào bằng lối mở ở tường trước của sảnh.
   Đây là nơi J.E.F.F ở. */
let jeffBot = null;
{
  const room = ROOMS.bep;
  const [x0, z0] = P(470, 590), [x1, z1] = P(830, 780);
  box(house, x1 - x0 + 0.2, 0.5, z1 - z0 + 0.2, (x0 + x1) / 2, -0.27, (z0 + z1) / 2, std('#0a1220'));
  /* Tường trái cao làm nền cho tủ lạnh và kệ, hai tường phía máy quay hạ thấp */
  wall(470, 590, 470, 780, MID);
  wall(470, 780, 830, 780, LOW);
  wall(830, 590, 830, 780, LOW);
  const stone = std('#aab8cc', { roughness: 0.35, metalness: 0.2 }), steel = std('#9aa7b8', { roughness: 0.3, metalness: 0.7 });
  const cab = std(FURN2), dark = std('#0c111b', { roughness: 0.4 });
  const hot = glow(room.color, 1.4);
  room.glows.push({ mat: hot, base: 1.5 });

  /* Dãy bếp dọc tường sau: tủ dưới, mặt đá, bồn rửa, bếp nấu */
  const CZ = z0 + 0.44;
  const [ca] = P(585), [cb] = P(820);
  box(house, cb - ca, 0.86, 0.6, (ca + cb) / 2, 0.45, CZ, cab);
  box(house, cb - ca + 0.06, 0.05, 0.66, (ca + cb) / 2, 0.9, CZ, stone);
  for (let i = 0; i < 5; i++) box(house, 0.3, 0.02, 0.02, ca + 0.5 + i * 0.93, 0.7, CZ + 0.31, steel).castShadow = false;
  const [sx] = P(640);
  box(house, 0.7, 0.03, 0.4, sx, 0.93, CZ, dark);
  cyl(house, 0.02, 0.02, 0.3, sx, 1.08, CZ - 0.2, steel, 12);
  box(house, 0.03, 0.03, 0.2, sx, 1.22, CZ - 0.11, steel);
  const [vx] = P(745);
  box(house, 0.8, 0.03, 0.5, vx, 0.935, CZ, dark);
  [[-0.2, -0.11], [0.2, -0.11], [-0.2, 0.12], [0.2, 0.12]].forEach(([dx, dz]) => { cyl(house, 0.1, 0.1, 0.012, vx + dx, 0.956, CZ + dz, hot).castShadow = false; });
  /* Nồi đang nấu trên bếp */
  cyl(house, 0.13, 0.13, 0.17, vx - 0.2, 1.05, CZ - 0.11, steel);
  cyl(house, 0.135, 0.135, 0.02, vx - 0.2, 1.145, CZ - 0.11, dark);
  ball(house, 0.025, vx - 0.2, 1.17, CZ - 0.11, dark);

  /* Tủ lạnh và kệ gia vị dọc tường trái */
  const LX = x0 + 0.47;
  const [, fz] = P(0, 742);
  box(house, 0.72, 1.62, 0.8, LX, 0.83, fz, steel);
  box(house, 0.725, 0.02, 0.81, LX, 1.08, fz, dark).castShadow = false;
  box(house, 0.03, 0.42, 0.04, LX + 0.38, 1.38, fz + 0.26, dark);
  box(house, 0.03, 0.42, 0.04, LX + 0.38, 0.78, fz + 0.26, dark);
  const [, kz] = P(0, 682);
  [0.55, 0.98, 1.41].forEach((h, row) => {
    box(house, 0.3, 0.04, 0.9, x0 + 0.25, h, kz, wood);
    ['#ff7557', '#f2c879', '#86e28a', '#6fe0d2'].forEach((c, i) => {
      cyl(house, 0.06, 0.06, 0.15, x0 + 0.25, h + 0.095, kz - 0.3 + ((i + row) % 4) * 0.2, std(c, { roughness: 0.4 }), 16);
    });
  });

  /* Bảng tên trên tường trái, cạnh lối vào */
  {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 320;
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    const draw = () => {
      const g = canvas.getContext('2d');
      g.fillStyle = '#0c111b';
      g.fillRect(0, 0, 640, 320);
      g.strokeStyle = room.color;
      g.lineWidth = 8;
      g.strokeRect(10, 10, 620, 300);
      g.textAlign = 'center';
      g.fillStyle = room.color;
      g.font = '600 110px "Chakra Petch", sans-serif';
      g.fillText('J.E.F.F', 320, 160);
      g.fillStyle = '#dfe8f3';
      g.font = '500 44px "Saira", sans-serif';
      g.fillText('Just Eat Food Forever', 320, 240);
      tex.needsUpdate = true;
    };
    draw();
    if (document.fonts && document.fonts.load) Promise.all([document.fonts.load('600 110px "Chakra Petch"'), document.fonts.load('500 44px "Saira"')]).then(draw, () => {});
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.6), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
    const [, pz] = P(0, 628);
    plate.position.set(x0 + 0.1, 1.15, pz);
    plate.rotation.y = Math.PI / 2;
    house.add(plate);
  }

  /* Đảo bếp giữa phòng: thớt, rau củ, chảo, ba ghế đẩu phía trước */
  const [ix, iz] = P(655, 712);
  box(house, 2.0, 0.86, 0.8, ix, 0.45, iz, cab);
  box(house, 2.12, 0.05, 0.92, ix, 0.9, iz, stone);
  box(house, 2.0, 0.03, 0.02, ix, 0.2, iz + 0.41, hot).castShadow = false;
  box(house, 0.5, 0.03, 0.32, ix - 0.55, 0.94, iz, std('#8a6238', { roughness: 0.6 }));
  ball(house, 0.07, ix - 0.66, 1.02, iz - 0.03, std('#e2452f', { roughness: 0.35 }));
  ball(house, 0.07, ix - 0.52, 1.02, iz + 0.06, std('#e2452f', { roughness: 0.35 }));
  ball(house, 0.08, ix - 0.4, 1.03, iz - 0.05, std('#5fb04a', { roughness: 0.5 }));
  cyl(house, 0.17, 0.14, 0.05, ix + 0.5, 0.955, iz, dark);
  box(house, 0.26, 0.02, 0.04, ix + 0.78, 0.97, iz, dark);
  cyl(house, 0.12, 0.08, 0.09, ix + 0.02, 0.97, iz + 0.1, std('#dfe8f3', { roughness: 0.3 }));
  [-0.65, 0, 0.65].forEach((dx) => {
    cyl(house, 0.17, 0.17, 0.05, ix + dx, 0.62, iz + 0.78, wood);
    cyl(house, 0.03, 0.03, 0.6, ix + dx, 0.31, iz + 0.78, steel, 12);
  });

  /* J.E.F.F đứng sau đảo bếp. Vỏ tối hơn một bậc vì đèn phòng rọi gần. Bấm vào thì vẫy xẻng. */
  jeffBot = createMascot(Object.assign({}, window.SITE.mascotJeff, { shell: '#a39e96', env: 0.3 }), renderer);
  const [jx, jz] = P(655, 660);
  jeffBot.group.scale.setScalar(0.72);
  jeffBot.group.position.set(jx, 0.02, jz);
  house.add(jeffBot.group);
  const hit = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.5, 0.9), cab);
  hit.position.set(jx, 0.85, jz);
  hit.visible = false;
  house.add(hit);
  addHot(hit, 'bep', 'J.E.F.F', () => jeffBot.play('wave', 2), { noMove: true });
  /* J.E.F.F vừa chọn xong một món */
  document.addEventListener('tp:jeff', () => jeffBot.play('cheer', 1.4));
}

/* Phòng Kế Hoạch: khối nối phía trước sảnh, bên trái cửa chính, vào bằng lối mở ở tường trước của sảnh.
   Phòng của Planner (lịch, việc, nhắc giờ): bảng kế hoạch trên tường, bàn làm việc, đồng hồ. */
let plannerTick = null;
{
  const room = ROOMS.kehoach;
  const [x0, z0] = P(250, 590), [x1, z1] = P(390, 780);
  box(house, x1 - x0 + 0.2, 0.5, z1 - z0 + 0.2, (x0 + x1) / 2, -0.27, (z0 + z1) / 2, std('#0a1220'));
  /* Tường trái cao để treo bảng, hai tường phía máy quay hạ thấp */
  wall(250, 590, 250, 780, MID);
  wall(250, 780, 390, 780, LOW);
  wall(390, 590, 390, 780, LOW);
  const lit = glow(room.color, 1.3);
  room.glows.push({ mat: lit, base: 1.4 });
  const steel = std('#9aa7b8', { roughness: 0.3, metalness: 0.7 }), dark = std('#0c111b', { roughness: 0.4 });

  /* Bảng kế hoạch trên tường trái: lịch của tháng này lấy từ Planner, ba cột thẻ việc để trang trí */
  let redrawBoard = () => {};
  {
    const canvas = document.createElement('canvas');
    canvas.width = 880;
    canvas.height = 440;
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    const draw = () => {
      const g = canvas.getContext('2d');
      g.fillStyle = '#070b14';
      g.fillRect(0, 0, 880, 440);
      g.strokeStyle = room.color;
      g.lineWidth = 6;
      g.strokeRect(6, 6, 868, 428);
      g.textAlign = 'left';
      g.fillStyle = room.color;
      g.font = '600 50px "Chakra Petch", sans-serif';
      const today = new Date(), year = today.getFullYear(), month = today.getMonth();
      g.fillText('Tháng ' + (month + 1) + ', ' + year, 34, 68);
      /* Lịch tháng thật: ô hôm nay sáng nhất, ngày còn việc trong Planner có màu của phòng */
      const lead = (new Date(year, month, 1).getDay() + 6) % 7, count = new Date(year, month + 1, 0).getDate();
      const busy = new Set();
      try {
        (JSON.parse(localStorage.getItem('xuong.kehoach.viec')) || []).forEach((t) => {
          if (!t || t.done || typeof t.date !== 'string') return;
          const p = t.date.split('-');
          if (Number(p[0]) === year && Number(p[1]) === month + 1) busy.add(Number(p[2]));
        });
      } catch (e) { /* bỏ qua */ }
      const cell = 310 / Math.ceil((lead + count) / 7);
      g.font = '600 22px "Saira", sans-serif';
      for (let d = 1; d <= count; d++) {
        const n = lead + d - 1, cx = 34 + (n % 7) * 54, cy = 100 + Math.floor(n / 7) * cell, isNow = d === today.getDate();
        g.fillStyle = isNow ? '#ffffff' : busy.has(d) ? room.color : '#16253d';
        g.fillRect(cx, cy, 46, cell - 8);
        g.fillStyle = isNow || busy.has(d) ? '#0a1220' : '#7f90aa';
        g.fillText(String(d), cx + 6, cy + 24);
      }
      /* Ba cột thẻ việc */
      [['#4fdcff', 3], ['#f2c879', 2], ['#86e28a', 4]].forEach(([color, count], col) => {
        const x = 450 + col * 138;
        g.fillStyle = color;
        g.fillRect(x, 100, 120, 8);
        for (let i = 0; i < count; i++) {
          g.fillStyle = '#16253d';
          g.fillRect(x, 124 + i * 72, 120, 58);
          g.fillStyle = color;
          g.globalAlpha = 0.8;
          g.fillRect(x + 12, 140 + i * 72, 76, 8);
          g.globalAlpha = 0.4;
          g.fillRect(x + 12, 158 + i * 72, 52, 8);
          g.globalAlpha = 1;
        }
      });
      tex.needsUpdate = true;
    };
    draw();
    redrawBoard = draw;
    document.addEventListener('tp:planner', draw);
    if (document.fonts && document.fonts.load) document.fonts.load('600 50px "Chakra Petch"').then(draw, () => {});
    const [, bz] = P(0, 692);
    box(house, 0.06, 1.24, 2.34, x0 + 0.11, 1.0, bz, dark);
    const board = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.1), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
    board.position.set(x0 + 0.15, 1.0, bz);
    board.rotation.y = Math.PI / 2;
    house.add(board);
  }
  /* Đồng hồ treo tường cạnh bảng, kim chạy theo giờ thật */
  {
    const [, cz] = P(0, 616);
    const face = new THREE.Mesh(new THREE.CircleGeometry(0.19, 40), new THREE.MeshBasicMaterial({ color: '#0c111b' }));
    face.position.set(x0 + 0.1, 1.3, cz);
    face.rotation.y = Math.PI / 2;
    house.add(face);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.015, 10, 48), lit);
    rim.position.copy(face.position);
    rim.rotation.y = Math.PI / 2;
    house.add(rim);
    /* Mỗi kim quay quanh tâm mặt đồng hồ. Nhìn từ trong phòng, chiều kim đồng hồ là quay âm quanh trục x. */
    const hand = (len, wide) => {
      const pivot = new THREE.Group();
      pivot.position.set(x0 + 0.12, 1.3, cz);
      box(pivot, 0.01, len, wide, 0, len / 2 - 0.012, 0, lit).castShadow = false;
      house.add(pivot);
      return pivot;
    };
    const hourHand = hand(0.1, 0.02), minuteHand = hand(0.15, 0.014), secondHand = hand(0.16, 0.006);
    let lastSecond = -1, lastDate = new Date().getDate();
    plannerTick = () => {
      const d = new Date(), s = d.getSeconds();
      if (s === lastSecond) return;
      lastSecond = s;
      const turn = Math.PI * 2, minutes = d.getMinutes() + s / 60;
      secondHand.rotation.x = -turn * s / 60;
      minuteHand.rotation.x = -turn * minutes / 60;
      hourHand.rotation.x = -turn * ((d.getHours() % 12) + minutes / 60) / 12;
      if (d.getDate() !== lastDate) { lastDate = d.getDate(); redrawBoard(); }
    };
  }

  /* Bàn làm việc sát tường phải: màn hình, bàn phím, sổ, ghế */
  const DX = x1 - 0.5;
  const [, dz] = P(0, 706);
  box(house, 0.7, 0.05, 1.7, DX, 0.76, dz, wood);
  [-0.75, 0.75].forEach((k) => box(house, 0.6, 0.72, 0.05, DX, 0.37, dz + k, furn));
  box(house, 0.04, 0.5, 0.86, DX + 0.2, 1.16, dz - 0.15, dark);
  const screen = box(house, 0.01, 0.44, 0.8, DX + 0.175, 1.16, dz - 0.15, lit);
  screen.castShadow = false;
  box(house, 0.1, 0.14, 0.1, DX + 0.2, 0.85, dz - 0.15, dark);
  box(house, 0.16, 0.02, 0.5, DX - 0.12, 0.8, dz - 0.15, dark);
  box(house, 0.26, 0.03, 0.2, DX - 0.05, 0.8, dz + 0.55, std('#dfe8f3', { roughness: 0.6 }));
  cyl(house, 0.045, 0.045, 0.12, DX + 0.18, 0.85, dz + 0.6, std('#35527f'), 16);
  /* Ghế xoay */
  const CX = DX - 0.85;
  cyl(house, 0.26, 0.26, 0.07, CX, 0.5, dz - 0.1, furn2);
  box(house, 0.07, 0.6, 0.5, CX - 0.24, 0.82, dz - 0.1, furn2);
  cyl(house, 0.03, 0.03, 0.44, CX, 0.25, dz - 0.1, steel, 12);
  cyl(house, 0.22, 0.24, 0.04, CX, 0.04, dz - 0.1, dark);

  /* Thảm, và chậu cây ở góc trước bên phải để không che bảng */
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 2.0), std('#241a33', { roughness: 0.9 }));
  rug.rotation.x = -Math.PI / 2;
  rug.position.set((x0 + x1) / 2 - 0.2, 0.035, dz - 0.1);
  rug.receiveShadow = true;
  house.add(rug);
  const [, pz] = P(0, 762);
  const PX = x1 - 0.42;
  cyl(house, 0.2, 0.15, 0.32, PX, 0.18, pz, furn2);
  for (let i = 0; i < 7; i++) {
    const a = i / 7 * Math.PI * 2;
    ball(house, 0.2, PX + Math.cos(a) * 0.17, 0.56 + (i % 3) * 0.14, pz + Math.sin(a) * 0.17, std('#2a6b58'));
  }
}

/* Phòng nghỉ: khối nối bên trái Phòng Học, vào bằng lối mở ở tường trái của Phòng Học.
   Đây là nơi I.C.A.R.E ở. */
let icareBot = null;
{
  const room = ROOMS.nghi;
  const [x0, z0] = P(-240, 340), [x1, z1] = P(40, 590);
  box(house, x1 - x0 + 0.2, 0.5, z1 - z0 + 0.2, (x0 + x1) / 2, -0.27, (z0 + z1) / 2, std('#0a1220'));
  /* Tường sau và tường trái cao vừa làm nền, tường phía máy quay hạ thấp */
  wall(-240, 340, 40, 340, MID);
  wall(-240, 340, -240, 590, MID);
  wall(-240, 590, 40, 590, LOW);
  const soft = glow(room.color, 1.2);
  room.glows.push({ mat: soft, base: 1.3 });
  const steel = std('#9aa7b8', { roughness: 0.3, metalness: 0.7 }), linen = std('#e8edf5', { roughness: 0.85 });

  /* Giường nghỉ dọc tường sau: khung, nệm, gối, chăn gấp */
  const [bx, bz] = P(-140, 372);
  box(house, 2.3, 0.3, 1.0, bx, 0.19, bz, furn2);
  box(house, 2.2, 0.18, 0.9, bx, 0.43, bz, linen);
  box(house, 0.55, 0.13, 0.62, bx - 0.75, 0.585, bz, std('#ffd0d9', { roughness: 0.9 }));
  box(house, 0.95, 0.06, 0.9, bx + 0.58, 0.55, bz, std(room.color, { roughness: 0.9 }));
  box(house, 0.1, 0.62, 1.0, bx - 1.2, 0.35, bz, furn2);

  /* Đèn sàn cạnh giường */
  const [lx, lz] = P(-30, 372);
  cyl(house, 0.14, 0.16, 0.04, lx, 0.04, lz, steel);
  cyl(house, 0.025, 0.025, 1.3, lx, 0.7, lz, steel, 12);
  cyl(house, 0.14, 0.2, 0.26, lx, 1.42, lz, soft).castShadow = false;

  /* Cây nước nóng lạnh ở tường trái: thân máy, bình nước úp ngược, hai vòi */
  const [wx, wz] = P(-218, 452);
  box(house, 0.38, 0.92, 0.38, wx, 0.48, wz, std('#dfe8f3', { roughness: 0.4 }));
  cyl(house, 0.15, 0.15, 0.44, wx, 1.17, wz, new THREE.MeshPhysicalMaterial({ color: '#7fd4ff', transparent: true, opacity: 0.6, roughness: 0.1 }), 24).castShadow = false;
  cyl(house, 0.06, 0.1, 0.06, wx, 0.96, wz, std('#dfe8f3', { roughness: 0.4 }), 20);
  box(house, 0.04, 0.05, 0.06, wx + 0.2, 0.74, wz - 0.07, std('#4fa8ff', { roughness: 0.4 }));
  box(house, 0.04, 0.05, 0.06, wx + 0.2, 0.74, wz + 0.07, std('#ff7557', { roughness: 0.4 }));
  box(house, 0.1, 0.02, 0.26, wx + 0.22, 0.6, wz, steel);
  cyl(house, 0.04, 0.03, 0.09, wx + 0.24, 0.655, wz, std('#ffffff', { roughness: 0.3 }), 16);

  /* Thảm tập ở giữa phòng, hai quả tạ nhỏ bên cạnh */
  const [mx, mz] = P(-150, 520);
  box(house, 1.9, 0.03, 0.78, mx, 0.035, mz, std('#6fd6c4', { roughness: 0.9 }));
  box(house, 1.9, 0.032, 0.05, mx, 0.036, mz - 0.3, std('#4bb5a4', { roughness: 0.9 })).castShadow = false;
  [-0.14, 0.14].forEach((dz) => {
    box(house, 0.3, 0.04, 0.04, mx + 1.2, 0.1, mz + dz, steel);
    [-0.15, 0.15].forEach((dx) => { ball(house, 0.085, mx + 1.2 + dx, 0.1, mz + dz, black); });
  });

  /* Cây cảnh ở góc trước bên trái */
  const [px, pz] = P(-212, 560);
  cyl(house, 0.2, 0.15, 0.34, px, 0.19, pz, std('#b97a56', { roughness: 0.8 }));
  [[0, 0.62, 0, 0.3], [-0.16, 0.5, 0.08, 0.2], [0.16, 0.52, -0.06, 0.21], [0.02, 0.86, 0.04, 0.2]].forEach(([dx, y, dz, r]) => {
    ball(house, r, px + dx, y, pz + dz, std('#4f9a5d', { roughness: 0.75 }));
  });

  /* Bảng tên trên tường sau */
  {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 320;
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    const draw = () => {
      const g = canvas.getContext('2d');
      g.fillStyle = '#0c111b';
      g.fillRect(0, 0, 640, 320);
      g.strokeStyle = room.color;
      g.lineWidth = 8;
      g.strokeRect(10, 10, 620, 300);
      g.textAlign = 'center';
      g.fillStyle = room.color;
      g.font = '600 104px "Chakra Petch", sans-serif';
      g.fillText('I.C.A.R.E', 320, 156);
      g.fillStyle = '#dfe8f3';
      g.font = '500 40px "Saira", sans-serif';
      g.fillText('Uống nước, nghỉ ngơi, vận động', 320, 236);
      tex.needsUpdate = true;
    };
    draw();
    if (document.fonts && document.fonts.load) Promise.all([document.fonts.load('600 104px "Chakra Petch"'), document.fonts.load('500 40px "Saira"')]).then(draw, () => {});
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.6), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
    const [tx] = P(-140, 0);
    plate.position.set(tx, 1.2, z0 + 0.1);
    house.add(plate);
  }

  /* I.C.A.R.E đứng giữa phòng, cạnh thảm tập. Vỏ tối hơn một bậc vì đèn phòng rọi gần.
     Bấm vào thì vẫy tay; khi có lời nhắc tới mốc (sự kiện tp:icare) cũng vẫy tay. */
  icareBot = createMascot(Object.assign({}, window.SITE.mascotIcare, { shell: '#979ca6', env: 0.3 }), renderer);
  const [ix, iz] = P(-92, 468);
  icareBot.group.scale.setScalar(0.72);
  icareBot.group.position.set(ix, 0.02, iz);
  house.add(icareBot.group);
  const hit = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.5, 0.9), furn2);
  hit.position.set(ix, 0.85, iz);
  hit.visible = false;
  house.add(hit);
  addHot(hit, 'nghi', 'I.C.A.R.E', () => icareBot.play('wave', 2), { noMove: true });
  document.addEventListener('tp:icare', () => icareBot.play('wave', 2.6));
}

/* Khu phụ: tầng trệt là Garage AI, mái là Sân Thượng và Sân Vườn */
let armTop = null, armLow = null, gridDraw = () => {};
{
  const DECK = 2.7;
  const [ax0, az0] = P(965, 150), [ax1, az1] = P(1190, 590);
  box(house, ax1 - ax0 + 0.2, 0.5, az1 - az0 + 0.2, (ax0 + ax1) / 2, -0.27, (az0 + az1) / 2, std('#0a1220'));
  const annex = std('#1b2b45');
  const slab = (x0, y0, x1, y1, mat) => { const [a, b] = P(x0, y0), [c, d] = P(x1, y1); return box(house, c - a, 0.14, d - b, (a + c) / 2, DECK - 0.08, (b + d) / 2, mat); };
  const deckMat = std('#27324a', { roughness: 0.6 });
  slab(965, 150, 1190, 370, deckMat);
  slab(965, 370, 1140, 590, deckMat);
  slab(1140, 370, 1190, 420, deckMat);
  box(house, ax1 - ax0, DECK, 0.2, (ax0 + ax1) / 2, DECK / 2, az0, annex);
  box(house, 0.2, DECK, az1 - az0, ax1, DECK / 2, (az0 + az1) / 2, annex);
  [[965, 590], [1140, 590], [965, 370]].forEach(([x, y]) => { const [px, pz] = P(x, y); box(house, 0.2, DECK, 0.2, px, DECK / 2, pz, annex); });
  /* Cửa cuốn đã kéo lên */
  const [dx0] = P(965), [dx1] = P(1140), [, dz] = P(0, 590);
  for (let i = 0; i < 4; i++) box(house, dx1 - dx0 - 0.2, 0.09, 0.06, (dx0 + dx1) / 2, DECK - 0.2 - i * 0.1, dz, std('#35445f', { metalness: 0.5, roughness: 0.4 }));

  /* Cầu thang ngoài lên mái */
  const stepMat = std('#2f3c58');
  const STEPS = 12, run = 170 / STEPS;
  for (let i = 0; i < STEPS; i++) {
    const top = (i + 1) * DECK / STEPS, [sx, sz] = P(1165, 590 - (i + 0.5) * run);
    box(house, 0.96, top, run / 50, sx, top / 2, sz, stepMat);
  }
  const railMat = std('#7f93b5', { metalness: 0.7, roughness: 0.3 });
  const railTube = (pts) => { const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p[0], p[1], p[2])), false, 'catmullrom', 0), 10, 0.022, 8), railMat); house.add(m); };
  const [hx] = P(1141), [, hz0] = P(0, 590), [, hz1] = P(0, 420);
  railTube([[hx, 1.0, hz0], [hx, DECK + 1.0, hz1]]);
  function railing(x1, y1, x2, y2) {
    const [a, b] = P(x1, y1), [c, d] = P(x2, y2), n = Math.max(1, Math.round(Math.hypot(c - a, d - b) / 1.1));
    for (let i = 0; i <= n; i++) cyl(house, 0.022, 0.022, 1, a + (c - a) * i / n, DECK + 0.5, b + (d - b) * i / n, railMat, 8);
    railTube([[a, DECK + 1, b], [c, DECK + 1, d]]);
  }
  railing(965, 150, 1190, 150); railing(965, 150, 965, 590); railing(965, 590, 1140, 590); railing(1140, 590, 1140, 420); railing(1190, 150, 1190, 420);

  /* Sân Thượng: kính thiên văn, ghế, dây đèn */
  const [tx, tz] = P(1075, 245);
  const dark = std('#111a2c', { metalness: 0.5, roughness: 0.35 }), brass = std('#c7a968', { metalness: 0.85, roughness: 0.25 });
  const head = new THREE.Group();
  head.position.set(tx, DECK + 1.28, tz);
  head.rotation.set(0.75, -0.5, 0, 'YXZ');
  house.add(head);
  const barrel = cyl(head, 0.11, 0.09, 1.3, 0, 0, 0, std('#e2e7ef', { metalness: 0.35, roughness: 0.25 }));
  barrel.rotation.x = Math.PI / 2;
  [-0.62, 0.62].forEach((z) => { const b = cyl(head, 0.125, 0.125, 0.08, 0, 0, z, brass); b.rotation.x = Math.PI / 2; });
  [0, 2.09, 4.19].forEach((a) => {
    const leg = cyl(house, 0.02, 0.028, 1.4, tx + Math.cos(a) * 0.27, DECK + 0.62, tz + Math.sin(a) * 0.27, dark, 10);
    leg.rotation.set(Math.sin(a) * 0.42, 0, -Math.cos(a) * 0.42);
  });
  const [bx, bz] = P(1020, 330);
  box(house, 1.5, 0.08, 0.5, bx, DECK + 0.46, bz, std('#6e5238'));
  [-0.6, 0.6].forEach((d) => box(house, 0.08, 0.44, 0.44, bx + d, DECK + 0.22, bz, dark));
  const bulbs = new THREE.MeshBasicMaterial({ color: '#ffd9a0', toneMapped: false });
  const [lx0, lz0] = P(975, 160), [lx1, lz1] = P(1180, 160);
  for (let i = 0; i <= 14; i++) { const t = i / 14; ball(house, 0.035, lx0 + (lx1 - lx0) * t, DECK + 1.5 - Math.sin(t * Math.PI) * 0.34, lz0 + (lz1 - lz0) * t, bulbs); }
  ROOMS.san.glows.push({ mat: bulbs, base: 1, basic: true });

  /* Sân Vườn: bản thu nhỏ của chính vườn */
  [['si', 1000, 420], ['mai', 1095, 420], ['hoa-giay', 1000, 540], ['luoi-ho', 1100, 545], ['duong-xi', 1052, 480], ['lan', 1000, 480], ['tai-tho', 1100, 480]].forEach(([id, x, y], i) => {
    const p = buildPlant(id, i + 2);
    const [gx, gz] = P(x, y);
    p.group.position.set(gx, DECK + 0.03, gz);
    p.group.scale.setScalar(0.62);
    p.uniforms.uSway.value = 0;
    house.add(p.group);
  });

  /* Garage AI: bàn máy, màn hình, tủ tính toán, cánh tay robot */
  const [wx, wz] = P(1040, 178);
  box(house, 3, 0.08, 0.8, wx, 0.86, wz, std('#3a2f28'));
  [-1.4, 1.4].forEach((d) => box(house, 0.08, 0.84, 0.72, wx + d, 0.43, wz, dark));
  const c = document.createElement('canvas');
  c.width = 512; c.height = 288;
  const g = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const LAYERS = [3, 5, 6, 5, 2];
  gridDraw = (t) => {
    g.fillStyle = '#0a0e18'; g.fillRect(0, 0, 512, 288);
    const at = (l, n) => [60 + l * 98, 144 + (n - (LAYERS[l] - 1) / 2) * 44];
    g.lineWidth = 1.2;
    for (let l = 0; l < LAYERS.length - 1; l++) for (let a = 0; a < LAYERS[l]; a++) for (let b = 0; b < LAYERS[l + 1]; b++) {
      const p = at(l, a), q = at(l + 1, b), pulse = (Math.sin(t * 2 + l * 1.4 + a + b * 0.7) + 1) / 2;
      g.strokeStyle = 'rgba(255,168,115,' + (0.08 + pulse * 0.4) + ')';
      g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); g.stroke();
    }
    LAYERS.forEach((count, l) => { for (let n = 0; n < count; n++) { const p = at(l, n); g.fillStyle = (Math.sin(t * 3 + l + n) + 1) / 2 > 0.5 ? '#ffd2ad' : '#ff9a5e'; g.beginPath(); g.arc(p[0], p[1], 8, 0, 6.283); g.fill(); } });
    tex.needsUpdate = true;
  };
  gridDraw(0);
  box(house, 1.5, 0.86, 0.05, wx - 0.5, 1.55, wz - 0.2, black);
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(1.42, 0.78), new THREE.MeshBasicMaterial({ map: tex }));
  panel.position.set(wx - 0.5, 1.55, wz - 0.17);
  house.add(panel);
  box(house, 0.08, 0.3, 0.08, wx - 0.5, 1.04, wz - 0.22, black);
  const [rx, rz] = P(1118, 180);
  box(house, 0.8, 2.1, 0.62, rx, 1.05, rz, std('#0d1524', { metalness: 0.6, roughness: 0.35 }));
  for (let row = 0; row < 9; row++) for (let col = 0; col < 3; col++) {
    const material = new THREE.MeshBasicMaterial({ color: col === 1 ? '#ffd2ad' : '#ffa873', toneMapped: false });
    const led = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.03, 0.01), material);
    led.position.set(rx - 0.2 + col * 0.2, 0.3 + row * 0.2, rz + 0.316);
    house.add(led);
    leds.push({ material, phase: Math.random() * 10, speed: 2 + Math.random() * 7, base: new THREE.Color(material.color) });
  }
  /* Cánh tay robot */
  const [ax, az] = P(1040, 430);
  const white = std('#d9dfe9', { metalness: 0.25, roughness: 0.3 }), joint = std('#ff9a5e', { metalness: 0.4, roughness: 0.35 });
  cyl(house, 0.4, 0.46, 0.18, ax, 0.11, az, dark);
  armLow = new THREE.Group();
  armLow.position.set(ax, 0.2, az);
  house.add(armLow);
  ball(armLow, 0.16, 0, 0.06, 0, joint);
  cyl(armLow, 0.09, 0.1, 1.0, 0.2, 0.5, 0, white, 20).rotation.z = -0.42;
  armTop = new THREE.Group();
  armTop.position.set(0.42, 0.98, 0);
  armLow.add(armTop);
  ball(armTop, 0.12, 0, 0, 0, joint);
  cyl(armTop, 0.06, 0.08, 0.86, 0.36, 0.1, 0, white, 18).rotation.z = -1.33;
  ball(armTop, 0.08, 0.78, 0.2, 0, joint);
  box(armTop, 0.05, 0.2, 0.05, 0.78, 0.04, 0.07, dark);
  box(armTop, 0.05, 0.2, 0.05, 0.78, 0.04, -0.07, dark);
  /* Vạch sơn sàn */
  const [fx, fz] = P(1040, 430);
  const stripes = new THREE.Mesh(new THREE.RingGeometry(0.98, 1.08, 48), new THREE.MeshBasicMaterial({ color: '#ffa873', transparent: true, opacity: 0.55 }));
  stripes.rotation.x = -Math.PI / 2;
  stripes.position.set(fx, 0.03, fz);
  house.add(stripes);
}

/* Điểm máy quay tiến lại gần trong Phòng Thực Nghiệm: số là tủ kính, chữ là các khu khác */
const FOCUS = {};
/* Phòng Thực Nghiệm: tầng hầm dưới mặt đất, rộng bằng tầng chính, một phòng duy nhất chia thành nhiều khu */
const hamRamp = new THREE.Group();
house.add(hamRamp);
{
  const room = ROOMS.ham, FLOOR = -3.6, CEIL = -0.52, H = CEIL - FLOOR, MIDY = (FLOOR + CEIL) / 2;
  const concrete = std('#26344f', { roughness: 0.85 }), dark = std('#1a2438', { roughness: 0.9 });
  /* Tường sau và hai bên */
  box(house, 19.2, H, 0.2, 0, MIDY, -5.9, concrete);
  box(house, 0.2, H, 12, -9.5, MIDY, 0, concrete);
  box(house, 0.2, H, 12, 9.5, MIDY, 0, concrete);
  /* Tường trước, chừa lối vào ở chân dốc */
  box(house, 15, H, 0.2, 2.1, MIDY, 5.9, concrete);
  /* Sân bê tông trước cửa hầm */
  box(house, 60, 0.04, 30, 0, FLOOR - 0.03, 21, std('#070b14', { roughness: 0.95 })).castShadow = false;
  /* Cột */
  [-4.8, 4.8].forEach((x) => [-1.5, 3.2].forEach((z) => box(house, 0.36, H, 0.36, x, MIDY, z, dark)));
  /* Đèn tuýp trần */
  const tube = glow(room.color, 1.2);
  room.glows.push({ mat: tube, base: 3.2 });
  [-7.2, -2.4, 2.4, 7.2].forEach((x) => [-3.4, 1.2].forEach((z) => { box(house, 0.08, 0.05, 2.6, x, CEIL - 0.06, z, tube).castShadow = false; }));
  /* Vạch sơn chia khu trên sàn */
  const paint = new THREE.MeshBasicMaterial({ color: '#3b4c6b' });
  [-4.8, 0, 4.8].forEach((x) => { box(house, 0.06, 0.01, 6.6, x, FLOOR + 0.03, 2.5, paint).castShadow = false; });
  box(house, 18.6, 0.01, 0.06, 0, FLOOR + 0.03, -0.8, paint).castShadow = false;

  /* Khu tủ trưng bày: sáu tủ kính dọc tường sau */
  /* Mỗi nhóm trong SITE.showcase.fields là một tủ; một mảng có thể chiếm nhiều tủ liền nhau */
  const SHOW = [];
  ((window.SITE.showcase && window.SITE.showcase.fields) || []).forEach((field) => field.groups.forEach((group, n) => SHOW.push({ field, group, first: n === 0, span: field.groups.length })));
  /* Bảng tên dưới mỗi hiện vật, vẽ lại khi font tải xong */
  const plateTexture = (text, color = '#dfe8f3') => {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 128;
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const draw = () => {
      const g = c.getContext('2d');
      g.fillStyle = '#0c111b'; g.fillRect(0, 0, 512, 128);
      g.strokeStyle = '#2a3b57'; g.lineWidth = 4; g.strokeRect(4, 4, 504, 120);
      g.fillStyle = color; g.textAlign = 'center'; g.textBaseline = 'middle';
      let size = 58;
      do { g.font = '600 ' + size + 'px "Chakra Petch", "Segoe UI", sans-serif'; size -= 4; } while (g.measureText(text).width > 460 && size > 24);
      g.fillText(text, 256, 68);
      tex.needsUpdate = true;
    };
    draw();
    if (document.fonts && document.fonts.load) document.fonts.load('600 58px "Chakra Petch"').then(draw, () => {});
    return tex;
  };
  /* Mô hình hiện vật dựng bằng hình khối, gốc toạ độ nằm trên mặt kệ */
  const MODELS = {
    xuong(g) {
      box(g, 1.0, 0.06, 0.5, 0, 0.03, 0, std('#16253d'));
      [['#a9a4f5', -0.3, -0.1, 0.36, 0.24], ['#f2c879', 0.16, -0.14, 0.44, 0.16], ['#86e28a', 0.16, 0.02, 0.44, 0.14], ['#6fe0d2', 0.16, 0.17, 0.44, 0.14], ['#9fd3ff', -0.36, 0.14, 0.24, 0.2]]
        .forEach(([c, px, pz, w, d]) => { box(g, w, 0.02, d, px, 0.07, pz, glow(c, 0.9)).castShadow = false; });
      box(g, 1.0, 0.22, 0.03, 0, 0.17, -0.24, std('#22324f'));
      box(g, 0.03, 0.22, 0.5, -0.49, 0.17, 0, std('#22324f'));
    },
    tom(g) {
      const bot = createMascot(Object.assign({}, window.SITE.mascotTom, { env: 0.3 }), renderer);
      bot.group.scale.setScalar(0.36);
      g.add(bot.group);
    },
    xmas(g) {
      const bot = createMascot(Object.assign({}, window.SITE.mascot, { env: 0.3 }), renderer);
      bot.group.scale.setScalar(0.34);
      g.add(bot.group);
    },
    'the-ticket'(g) {
      const paper = std('#f2c879', { roughness: 0.5 });
      const t = new THREE.Group();
      box(t, 0.5, 0.3, 0.02, -0.08, 0, 0, paper);
      box(t, 0.14, 0.3, 0.02, 0.27, 0, 0, paper);
      box(t, 0.3, 0.035, 0.024, -0.12, 0.06, 0, std('#3a2c14'));
      box(t, 0.2, 0.035, 0.024, -0.17, -0.03, 0, std('#3a2c14'));
      t.position.y = 0.3; t.rotation.set(-0.2, 0.25, 0.12);
      g.add(t);
      box(g, 0.5, 0.05, 0.2, 0, 0.025, 0, std('#22324f'));
    },
    'fluffy-frenzy'(g) {
      const fur = std('#ffd9e4', { roughness: 0.95 });
      ball(g, 0.2, 0, 0.2, 0, fur, 0.92);
      [-0.11, 0.11].forEach((px) => ball(g, 0.07, px, 0.4, 0, fur, 1.5));
      [-0.07, 0.07].forEach((px) => ball(g, 0.028, px, 0.24, 0.17, std('#141a26', { roughness: 0.3 })));
      ball(g, 0.03, 0, 0.18, 0.19, std('#ff8fa3'));
      ball(g, 0.07, 0.3, 0.07, 0.04, std('#9fd3ff', { roughness: 0.95 }));
      ball(g, 0.06, -0.3, 0.06, -0.02, std('#f2c879', { roughness: 0.95 }));
    },
    'the-one'(g) {
      const px = glow('#4fdcff', 1.1);
      [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [-1, 3], [-1, 0], [1, 0]].forEach(([cx, cy]) => { box(g, 0.1, 0.1, 0.1, cx * 0.1, 0.1 + cy * 0.1, 0, px).castShadow = false; });
      box(g, 0.5, 0.05, 0.22, 0, 0.025, 0, std('#22324f'));
    },
    'a-usual-day'(g) {
      const sun = cyl(g, 0.17, 0.17, 0.04, 0, 0.36, 0, glow('#f2c879', 1.2));
      sun.rotation.x = Math.PI / 2; sun.castShadow = false;
      box(g, 0.03, 0.18, 0.03, 0, 0.12, 0, std('#22324f'));
      box(g, 0.34, 0.05, 0.2, 0, 0.025, 0, std('#22324f'));
      cyl(g, 0.055, 0.045, 0.1, 0.3, 0.05, 0.02, std('#dfe8f3', { roughness: 0.4 }));
    },
    olivenow(g) {
      /* Ba cửa sổ trình duyệt xếp lớp */
      const olive = glow('#b5c96a', 0.8);
      [[-0.2, 0.3, -0.08, 0.5], [0.12, 0.24, 0.02, 0.46], [0.02, 0.36, 0.12, 0.4]].forEach(([px, py, pz, w], n) => {
        box(g, w, w * 0.62, 0.02, px, py, pz, std('#1b2b45'));
        box(g, w, 0.05, 0.022, px, py + w * 0.31 - 0.025, pz + 0.002, n === 2 ? olive : std('#35445f')).castShadow = false;
      });
      box(g, 0.7, 0.05, 0.3, 0, 0.025, 0, std('#22324f'));
    },
    'olive-pos'(g) {
      /* Máy bán hàng: màn hình nghiêng trên chân đế, cuộn hóa đơn */
      box(g, 0.34, 0.05, 0.3, 0, 0.025, 0, std('#22324f'));
      box(g, 0.06, 0.2, 0.06, 0, 0.14, -0.04, std('#22324f'));
      const scr = box(g, 0.42, 0.28, 0.03, 0, 0.36, 0, std('#141a26'));
      scr.rotation.x = -0.35;
      const face = box(g, 0.36, 0.22, 0.01, 0, 0.365, 0.018, glow('#b5c96a', 0.8));
      face.rotation.x = -0.35; face.castShadow = false;
      box(g, 0.1, 0.16, 0.01, 0.26, 0.1, 0.05, std('#f4f1e6', { roughness: 0.6 })).rotation.x = -0.2;
    },
    other(g) { box(g, 0.3, 0.3, 0.3, 0, 0.15, 0, std('#2c3f60')); }
  };
  const frame = std('#0c111b', { roughness: 0.5, metalness: 0.4 });
  const glass = new THREE.MeshStandardMaterial({ color: '#9fd3ff', transparent: true, opacity: 0.12, roughness: 0.1, metalness: 0.2, depthWrite: false });
  const caseLight = glow('#dfe8f3', 1.1);
  room.glows.push({ mat: caseLight, base: 3 });
  const shelf = std('#2a3650', { roughness: 0.4 });
  for (let i = 0; i < 6; i++) {
    const x = -7.5 + i * 3, W = 2.5, CH = 2.3, D = 0.62, z = -5.48, y0 = FLOOR + 0.04;
    box(house, W, 0.12, D, x, y0 + 0.06, z, frame);
    box(house, W, 0.1, D, x, y0 + CH, z, frame);
    box(house, W, CH, 0.05, x, y0 + CH / 2, z - D / 2 + 0.03, frame);
    [-1, 1].forEach((side) => box(house, 0.06, CH, D, x + side * (W / 2 - 0.03), y0 + CH / 2, z, frame));
    [0.8, 1.5].forEach((h) => box(house, W - 0.12, 0.03, D - 0.1, x, y0 + h, z, shelf));
    box(house, W - 0.2, 0.03, 0.04, x, y0 + CH - 0.08, z + D / 2 - 0.08, caseLight).castShadow = false;
    const pane = box(house, W - 0.12, CH - 0.2, 0.02, x, y0 + CH / 2, z + D / 2, glass);
    pane.castShadow = false;
    /* Hiện vật: mỗi tủ một nhóm dự án, xếp hai món mỗi tầng kệ */
    const slot = SHOW[i];
    if (!slot) continue;
    const items = slot.group.items || [];
    items.slice(0, 4).forEach((item, n) => {
      const stand = new THREE.Group(), pair = items.length > 1;
      stand.position.set(x + (pair ? (n % 2 ? 0.58 : -0.58) : 0), y0 + (n < 2 ? 0.815 : 1.515), z);
      stand.scale.setScalar(pair ? 0.8 : 1);
      house.add(stand);
      (MODELS[item.id] || MODELS.other)(stand);
      /* Vùng bấm riêng cho từng món, nằm ngay trước mặt kính */
      const pick = new THREE.Mesh(new THREE.BoxGeometry(pair ? 1.05 : 2.1, 0.64, 0.02), paint);
      pick.position.set(stand.position.x, stand.position.y + 0.3, z + D / 2 + 0.03);
      pick.visible = false;
      house.add(pick);
      addHot(pick, 'ham', item.title, () => {
        document.dispatchEvent(new CustomEvent('tp:exhibit', { detail: i }));
        document.dispatchEvent(new CustomEvent('tp:product', { detail: { cabinet: i, item: n } }));
      });
    });
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.5, (W - 0.5) / 4), new THREE.MeshBasicMaterial({ map: plateTexture(slot.group.title), toneMapped: false }));
    plate.position.set(x, y0 + 0.46, z + D / 2 - 0.06);
    house.add(plate);
    /* Biển tên mảng treo trên tường, phủ hết các tủ của mảng đó */
    if (slot.first) {
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.55), new THREE.MeshBasicMaterial({ map: plateTexture(slot.field.title, room.color), toneMapped: false }));
      sign.position.set(x + (slot.span - 1) * 1.5, y0 + CH + 0.4, z - D / 2 + 0.1);
      house.add(sign);
    }
    FOCUS[i] = { look: new THREE.Vector3(x, y0 + CH / 2, z), pos: new THREE.Vector3(x, y0 + CH / 2 + 0.1, z + 3.1) };
    addHot(pane, 'ham', slot.field.title === slot.group.title ? slot.group.title : slot.field.title + ': ' + slot.group.title, () => document.dispatchEvent(new CustomEvent('tp:exhibit', { detail: i })));
  }

  const zone = (id, tip, w, h, d, x, y, z) => {
    const hit = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), paint);
    hit.position.set(x, y, z);
    hit.visible = false;
    house.add(hit);
    addHot(hit, 'ham', tip, () => document.dispatchEvent(new CustomEvent('tp:exhibit', { detail: id })));
  };
  const sign = (text, color, w, x, y, z, turn) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, w / 4), new THREE.MeshBasicMaterial({ map: plateTexture(text, color), toneMapped: false }));
    m.position.set(x, y, z);
    m.rotation.y = turn;
    house.add(m);
  };
  const steel = std('#2c3a55', { roughness: 0.45, metalness: 0.5 });

  /* Khu Trạm Agent ở tường trái: một bảng khung treo tường, vẽ cây phân cấp các bot agent bằng ảnh chân dung.
     Nội dung lấy từ SITE.basement.agents, ảnh nằm trong img/agents/. */
  {
    const info = (window.SITE.basement && window.SITE.basement.agents) || {};
    const tree = info.tree || {};
    const kids = tree.children || [];
    const canvas = document.createElement('canvas');
    canvas.width = 1440;
    canvas.height = 900;
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    const pics = {};
    const draw = () => {
      const g = canvas.getContext('2d');
      g.textAlign = 'left';
      g.fillStyle = '#070b14';
      g.fillRect(0, 0, 1440, 900);
      g.strokeStyle = '#2a3b57';
      g.lineWidth = 6;
      g.strokeRect(6, 6, 1428, 888);
      g.fillStyle = room.color;
      g.font = '600 58px "Chakra Petch", sans-serif';
      g.fillText(info.title || 'Trạm Agent', 48, 78);
      /* Một ô: khung ảnh đầu bot, tên và vai trò bên dưới */
      const cell = (agent, cx, cy, size) => {
        const color = agent.color || '#4fdcff', x = cx - size / 2, y = cy - size / 2, pic = pics[agent.id];
        g.save();
        g.beginPath();
        g.roundRect(x, y, size, size, 26);
        g.fillStyle = '#0d1626';
        g.fill();
        g.clip();
        if (pic && pic.complete && pic.naturalWidth) g.drawImage(pic, x, y, size, size);
        else {
          /* Agent chưa có avatar: chữ cái đầu của tên */
          g.textAlign = 'center';
          g.fillStyle = color;
          g.globalAlpha = 0.5;
          g.font = '600 ' + Math.round(size * 0.5) + 'px "Chakra Petch", sans-serif';
          g.fillText((agent.name || '?').charAt(0), cx, cy + size * 0.17);
          g.globalAlpha = 1;
        }
        g.restore();
        g.beginPath();
        g.roundRect(x, y, size, size, 26);
        g.strokeStyle = color;
        g.lineWidth = 6;
        g.stroke();
        g.textAlign = 'center';
        g.fillStyle = color;
        g.font = '600 46px "Chakra Petch", sans-serif';
        g.fillText(agent.name || '', cx, cy + size / 2 + 52);
        g.fillStyle = '#dfe8f3';
        g.font = '500 30px "Saira", sans-serif';
        g.fillText(agent.role || '', cx, cy + size / 2 + 90);
      };
      const TOP = 240, TOP_SIZE = 250, ROW = 660, SIZE = 200, BUS = 508;
      const step = kids.length > 1 ? Math.min(520, 1100 / (kids.length - 1)) : 0;
      const xs = kids.map((kid, n) => 720 + (n - (kids.length - 1) / 2) * step);
      /* Đường nối cha con */
      if (kids.length) {
        g.strokeStyle = '#3d5478';
        g.lineWidth = 5;
        g.beginPath();
        g.moveTo(720, TOP + TOP_SIZE / 2 + 104);
        g.lineTo(720, BUS);
        g.moveTo(xs[0], BUS);
        g.lineTo(xs[xs.length - 1], BUS);
        xs.forEach((x) => { g.moveTo(x, BUS); g.lineTo(x, ROW - SIZE / 2); });
        g.stroke();
      }
      cell(tree, 720, TOP, TOP_SIZE);
      kids.forEach((kid, n) => cell(kid, xs[n], ROW, SIZE));
      tex.needsUpdate = true;
    };
    [tree].concat(kids).forEach((agent) => {
      if (!agent.avatar) return;
      const pic = new Image();
      pic.onload = draw;
      pic.src = agent.avatar;
      pics[agent.id] = pic;
    });
    draw();
    if (document.fonts && document.fonts.load) Promise.all([document.fonts.load('600 58px "Chakra Petch"'), document.fonts.load('500 30px "Saira"')]).then(draw, () => {});
    box(house, 0.1, 2.7, 4.3, -9.34, FLOOR + 1.75, 0, frame);
    const board = new THREE.Mesh(new THREE.PlaneGeometry(4.0, 2.5), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
    board.position.set(-9.27, FLOOR + 1.75, 0);
    board.rotation.y = Math.PI / 2;
    house.add(board);
    addHot(board, 'ham', info.title || 'Trạm Agent', () => document.dispatchEvent(new CustomEvent('tp:exhibit', { detail: 'agents' })));
    /* Ngắm lệch để bảng nằm bên phải, không bị thẻ thông tin che */
    FOCUS.agents = { look: new THREE.Vector3(-9.27, FLOOR + 1.7, 0.5), pos: new THREE.Vector3(-5.2, FLOOR + 1.7, 0.5) };
  }

  /* Khu Bàn thí nghiệm: bàn dài phía trước phòng, bày đồ đang thử */
  {
    const TZ = 4.3, TOPY = FLOOR + 0.9;
    box(house, 5, 0.08, 1.1, 0, TOPY, TZ, steel);
    [-2.35, 2.35].forEach((dx) => [-0.45, 0.45].forEach((dz) => box(house, 0.08, 0.86, 0.08, dx, FLOOR + 0.47, TZ + dz, frame)));
    /* Màn hình */
    box(house, 0.8, 0.5, 0.04, -1.5, TOPY + 0.42, TZ + 0.2, frame);
    const scr = glow('#86e28a', 0.9);
    room.glows.push({ mat: scr, base: 1.6 });
    box(house, 0.72, 0.42, 0.01, -1.5, TOPY + 0.42, TZ + 0.17, scr).castShadow = false;
    box(house, 0.08, 0.16, 0.08, -1.5, TOPY + 0.12, TZ + 0.2, frame);
    /* Bo mạch */
    box(house, 0.5, 0.02, 0.34, -0.3, TOPY + 0.05, TZ, std('#17402b', { roughness: 0.5 }));
    [[-0.42, -0.06], [-0.2, 0.06], [-0.32, 0.1]].forEach(([px, pz]) => box(house, 0.08, 0.04, 0.08, px, TOPY + 0.08, TZ + pz, frame));
    /* Bình thí nghiệm */
    const liquid = glow(room.color, 0.9);
    room.glows.push({ mat: liquid, base: 1.5 });
    ball(house, 0.13, 0.7, TOPY + 0.17, TZ, liquid).castShadow = false;
    cyl(house, 0.04, 0.04, 0.2, 0.7, TOPY + 0.36, TZ, glass).castShadow = false;
    /* Khối lập phương đang thử */
    const cube = box(house, 0.22, 0.22, 0.22, 1.6, TOPY + 0.2, TZ + 0.05, glow('#4fdcff', 0.9));
    cube.rotation.set(0.5, 0.6, 0);
    cube.castShadow = false;
    sign('Bàn thí nghiệm', room.color, 2.2, 0, FLOOR + 2.6, 5.76, Math.PI);
    zone('lab', 'Bàn thí nghiệm', 5.2, 1.5, 1.3, 0, FLOOR + 0.8, TZ);
    FOCUS.lab = { look: new THREE.Vector3(-0.9, TOPY + 0.3, TZ), pos: new THREE.Vector3(-0.9, FLOOR + 1.9, 0.9) };
  }

  /* Khu Bảng lộ trình ở tường phải: ba cột lấy từ SITE.basement.roadmap */
  {
    const road = (window.SITE.basement && window.SITE.basement.roadmap) || { columns: [] };
    const c = document.createElement('canvas');
    c.width = 1440; c.height = 640;
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const draw = () => {
      const g = c.getContext('2d'), FONT = '"Chakra Petch", "Segoe UI", sans-serif', BODY = '"Saira", "Segoe UI", sans-serif';
      g.fillStyle = '#0c111b'; g.fillRect(0, 0, 1440, 640);
      g.strokeStyle = '#2a3b57'; g.lineWidth = 6; g.strokeRect(6, 6, 1428, 628);
      g.textBaseline = 'middle'; g.textAlign = 'left';
      g.fillStyle = '#ff8fa3'; g.font = '600 58px ' + FONT;
      g.fillText('Bảng lộ trình', 48, 70);
      const cols = road.columns.slice(0, 3), cw = (1440 - 96) / Math.max(1, cols.length);
      const tint = ['#4fdcff', '#f2c879', '#86e28a'];
      cols.forEach((col, n) => {
        const x = 48 + n * cw;
        g.fillStyle = tint[n]; g.fillRect(x, 124, cw - 28, 6);
        g.font = '600 42px ' + FONT;
        g.fillText(col.title, x, 168);
        g.fillStyle = '#dfe8f3'; g.font = '500 32px ' + BODY;
        col.items.slice(0, 7).forEach((item, k) => {
          let text = item.title || item;
          while (g.measureText(text).width > cw - 60 && text.length > 6) text = text.slice(0, -2);
          if (text !== (item.title || item)) text += '…';
          g.fillText(text, x, 232 + k * 54);
        });
      });
      tex.needsUpdate = true;
    };
    draw();
    if (document.fonts && document.fonts.load) Promise.all([document.fonts.load('600 58px "Chakra Petch"'), document.fonts.load('500 32px "Saira"')]).then(draw, () => {});
    box(house, 0.1, 2.6, 5.7, 9.34, FLOOR + 1.75, 0, frame);
    const board = new THREE.Mesh(new THREE.PlaneGeometry(5.4, 2.4), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
    board.position.set(9.27, FLOOR + 1.75, 0);
    board.rotation.y = -Math.PI / 2;
    house.add(board);
    addHot(board, 'ham', 'Bảng lộ trình', () => document.dispatchEvent(new CustomEvent('tp:exhibit', { detail: 'road' })));
    /* Ngắm lệch sang trái để bảng nằm bên phải, không bị thẻ thông tin che */
    FOCUS.road = { look: new THREE.Vector3(9.27, FLOOR + 1.7, -0.5), pos: new THREE.Vector3(4.4, FLOOR + 1.7, -0.5) };
  }

  /* Dốc xuống hầm, nằm trước Phòng Học */
  const RX0 = -9.0, RX1 = -5.4, RZ0 = 6.0, RZ1 = 10.6, TOP = -0.53;
  const run = RZ1 - RZ0, drop = TOP - FLOOR, len = Math.hypot(run, drop), ang = Math.atan2(drop, run);
  const CX = (RX0 + RX1) / 2, CY = (TOP + FLOOR) / 2, CZ = (RZ0 + RZ1) / 2;
  box(hamRamp, RX1 - RX0, 0.12, len, CX, CY - 0.06, CZ, concrete).rotation.x = -ang;
  [RX0, RX1].forEach((x) => {
    box(hamRamp, 0.14, drop, run, x, CY, CZ, dark);
    const strip = box(hamRamp, 0.05, 0.05, len, x + (x === RX0 ? 0.14 : -0.14), CY + 0.05, CZ, tube);
    strip.rotation.x = -ang;
    strip.castShadow = false;
  });
  /* Viền miệng dốc sáng lên để nhìn thấy từ sảnh */
  const lip = glow(room.color, 1.2);
  room.glows.push({ mat: lip, base: 1.4 });
  box(hamRamp, RX1 - RX0 + 0.3, 0.05, 0.08, CX, TOP + 0.04, RZ1 + 0.06, lip).castShadow = false;
  [RX0 - 0.1, RX1 + 0.1].forEach((x) => { box(hamRamp, 0.08, 0.05, run, x, TOP + 0.04, CZ, lip).castShadow = false; });
  /* Vùng bấm là miệng dốc, không phải cả tầng hầm */
  const hit = floors.find((f) => f.userData.room === 'ham');
  hit.geometry = new THREE.BoxGeometry(RX1 - RX0 + 0.4, 0.6, run + 0.4);
  hit.position.set(CX, TOP + 0.2, CZ);
  room.pointLight.distance = 26;
  /* Hai đèn phụ để hai đầu phòng không chìm trong tối */
  room.extra = [[-6.2, -1.5], [6.2, -1.5], [0, 3.4]].map(([x, z]) => { const l = new THREE.PointLight('#cfdcff', 0, 14, 1.6); l.position.set(x, -1.1, z); house.add(l); return l; });
}

/* Biển TP khổng lồ sau nhà: thân tối, viền sáng */
const sign = new THREE.Group();
const SIGN_Y = 5.05;
{
  const geo = new THREE.ExtrudeGeometry(tpShape(), { depth: 16, bevelEnabled: true, bevelThickness: 1.2, bevelSize: 1.2, bevelSegments: 3, curveSegments: 40 });
  geo.center();
  const body = new THREE.Mesh(geo, std('#0f1c35', { roughness: 0.32, metalness: 0.75 }));
  body.castShadow = true;
  sign.add(body);
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 24), new THREE.LineBasicMaterial({ color: '#8fe8ff', toneMapped: false }));
  sign.add(edges);
  const [x, z] = P(330, -30);
  sign.position.set(x, SIGN_Y, z);
  sign.scale.setScalar(0.042);
  scene.add(sign);
  const signLight = new THREE.PointLight('#4fdcff', 26, 14, 1.6);
  signLight.position.set(x, 4.2, z + 1.8);
  scene.add(signLight);
}

/* Mascot nhỏ đi trong nhà */
const walker = createMascot(Object.assign({}, window.SITE.mascot, { shell: '#8d97a9', accent: '#157f7c', env: 0.3 }), renderer);
walker.group.scale.setScalar(0.72);
scene.add(walker.group);
const walkerPos = { x: 0, z: 0, h: 0, heading: 0 };
let lastMove = 0;
Walk.onMove((pos) => {
  const [x, z] = P(pos.x, pos.y);
  const dx = x - walkerPos.x, dz = z - walkerPos.z;
  if (Math.hypot(dx, dz) > 0.0005) { walkerPos.heading = Math.atan2(dx, dz); lastMove = performance.now(); }
  walkerPos.x = x; walkerPos.z = z; walkerPos.h = pos.h || 0;
});
Walk.emit();
walker.group.rotation.y = 0.5;

/* Máy quay */
const HOME = { pos: new THREE.Vector3(11.5, 17.5, 24), look: new THREE.Vector3(0, 1.1, -0.9) };
const FRAME = {
  nhac: { look: P(345, 110), off: [2.2, 3.4, 6.2], y: 0.7 },
  sach: { look: P(790, 80), off: [-1.2, 4.2, 5.4], y: 1.1 },
  game: { look: P(760, 450), off: [-1.2, 2.3, 7.2], y: 1.0 },
  cong: { look: P(760, 265), off: [-1.2, 4.6, 5.4], y: 1.1 },
  hoc: { look: P(165, 420), off: [3, 3.6, 7.4], y: 0.6 },
  /* Máy quay đứng bên phải tường trái của phòng để thấy được bảng kế hoạch */
  kehoach: { look: P(205, 690), off: [4.6, 3.8, 8.4], y: 0.6 },
  /* Ngắm lệch sang trái để căn bếp nằm bên phải thẻ thông tin */
  bep: { look: P(585, 690), off: [-1.5, 5.6, 11], y: 0.6 },
  /* Ngắm lệch sang trái để phòng nghỉ nằm bên phải thẻ thông tin */
  nghi: { look: P(-190, 480), off: [-1.2, 5.4, 10.5], y: 0.6 },
  garage: { look: P(1060, 340), off: [-1.4, 1.5, 8.4], y: 1.1 },
  san: { look: P(1075, 260), off: [-1.6, 3.2, 6.2], y: 3.2 },
  vuon: { look: P(1050, 480), off: [-1.2, 3.2, 6], y: 3.2 },
  /* Đứng giữa tầng hầm, ống kính góc rộng. free: kéo chuột để quay nhìn đủ 360 độ */
  ham: { look: [0, -5.6], off: [0, 0.3, 7.6], y: -2.2, fov: 60, free: true }
};
const BASE_FOV = 26;
let fovFrom = BASE_FOV, fovTo = BASE_FOV;
const shot = { pos: HOME.pos.clone(), look: HOME.look.clone() };
const from = { pos: HOME.pos.clone(), look: HOME.look.clone() };
const to = { pos: HOME.pos.clone(), look: HOME.look.clone() };
let tween = 1, currentRoom = '', hovered = null, shiftX = 0, shiftY = 0;
const fit = { d: 1.08, sx: 0.11, sy: 0 };

function layout() {
  const w = innerWidth, h = innerHeight;
  if (!w || !h) return;
  renderer.setSize(w, h, false);
  if (composer) composer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  computeFit();
  scene.fog.near = 34 * homeDistance();
  scene.fog.far = 66 * homeDistance();
  applyOffset();
}
function applyOffset() {
  const w = innerWidth, h = innerHeight;
  if (Math.abs(shiftX) > 0.001 || Math.abs(shiftY) > 0.001) camera.setViewOffset(w, h, -w * shiftX, -h * shiftY, w, h);
  else camera.clearViewOffset();
}
/* Khung hình sảnh: đo căn nhà rồi đặt máy quay để nhà nằm trọn trong vùng trống, không đè lên danh sách phòng */
const FIT_POINTS = [new THREE.Vector3(-5.7, 7.3, -6.8), new THREE.Vector3(-1.1, 7.3, -6.8)];
[-9.7, 9.7].forEach((x) => [-6.1, 6.1].forEach((z) => [-0.6, 2.6].forEach((y) => FIT_POINTS.push(new THREE.Vector3(x, y, z)))));
[-3.5, 5.8].forEach((z) => [-0.6, 3.9].forEach((y) => FIT_POINTS.push(new THREE.Vector3(14.0, y, z))));
FIT_POINTS.push(new THREE.Vector3(-9.2, -0.5, 10.8), new THREE.Vector3(-5.2, -0.5, 10.8));
FIT_POINTS.push(new THREE.Vector3(6.8, -0.5, 9.6), new THREE.Vector3(6.8, 1.6, 9.6));
FIT_POINTS.push(new THREE.Vector3(-15.0, -0.5, 5.8), new THREE.Vector3(-15.0, 1.9, 0.5));
function measure(cam) {
  const out = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity };
  const v = new THREE.Vector3();
  FIT_POINTS.forEach((p) => {
    v.copy(p).project(cam);
    out.minX = Math.min(out.minX, v.x); out.maxX = Math.max(out.maxX, v.x);
    out.minY = Math.min(out.minY, v.y); out.maxY = Math.max(out.maxY, v.y);
  });
  return out;
}
function computeFit() {
  const w = innerWidth, h = innerHeight;
  if (!w || !h) return;
  const wide = w > 900;
  const pad = Math.min(56, Math.max(24, w * 0.04));
  const x0 = wide ? Math.max(0, (w - 1500) / 2) + pad + 320 + 28 : 8;
  const x1 = w - 12, y0 = 10, y1 = wide ? h - 12 : h * 0.54;
  const probe = new THREE.PerspectiveCamera(BASE_FOV, w / h, 0.1, 400);
  const dir = HOME.pos.clone().sub(HOME.look);
  let d = 1, m;
  const place = () => {
    probe.position.copy(HOME.look).addScaledVector(dir, d);
    probe.lookAt(HOME.look);
    probe.updateMatrixWorld(true);
    m = measure(probe);
  };
  for (let i = 0; i < 5; i++) {
    place();
    d *= Math.max((m.maxX - m.minX) / 2 * w / (x1 - x0), (m.maxY - m.minY) / 2 * h / (y1 - y0));
  }
  place();
  fit.d = d;
  fit.sx = ((x0 + x1) / 2 - ((m.minX + m.maxX) / 2 + 1) / 2 * w) / w;
  fit.sy = ((y0 + y1) / 2 - (1 - (m.minY + m.maxY) / 2) / 2 * h) / h;
}
function homeDistance() { return fit.d; }
function setShot(id, instant) {
  from.pos.copy(shot.pos);
  from.look.copy(shot.look);
  if (id && FRAME[id]) {
    const f = FRAME[id];
    to.look.set(f.look[0], f.y, f.look[1]);
    to.pos.set(f.look[0] + f.off[0], f.y + f.off[1], f.look[1] + f.off[2]);
  } else {
    to.look.copy(HOME.look);
    to.pos.copy(HOME.pos).sub(HOME.look).multiplyScalar(homeDistance()).add(HOME.look);
  }
  fovFrom = camera.fov;
  fovTo = (id && FRAME[id] && FRAME[id].fov) || BASE_FOV;
  tween = instant || reduceMotion ? 1 : 0;
  if (tween === 1) { shot.pos.copy(to.pos); shot.look.copy(to.look); camera.fov = fovTo; camera.updateProjectionMatrix(); }
}

/* Chuột: xoay nhà, chọn phòng */
const pointer = new THREE.Vector2(0, 0), ray = new THREE.Raycaster();
let pointerOnUI = true, hotHover = null;
const tipNode = document.getElementById('hotspotTip');
let orbit = 0, orbitGoal = 0, tilt = 0, drag = null, moved = false;
/* Góc quay đầu trong phòng nhìn tự do */
let yaw = 0, yawGoal = 0;
let focused = null;
const freeLook = () => focused === null && !!(currentRoom && FRAME[currentRoom] && FRAME[currentRoom].free);
const labels = {};
Object.keys(ROOMS).forEach((id) => { labels[id] = document.querySelector('.world-label[data-room="' + id + '"]'); });

function overUI(e) { return e.target !== document.body && e.target !== document.documentElement; }
function pickHot() {
  ray.setFromCamera(pointer, camera);
  const meshes = hots.filter((h) => h.room === currentRoom).map((h) => h.mesh);
  const hit = meshes.length ? ray.intersectObjects(meshes, false)[0] : null;
  return hit ? hit.object.userData.hot : null;
}
let selectedBook = 0;
document.addEventListener('tp:book', (e) => { selectedBook = e.detail; });
function pickRoom() {
  ray.setFromCamera(pointer, camera);
  const hit = ray.intersectObjects(floors, false)[0];
  return hit ? hit.object.userData.room : null;
}
addEventListener('pointermove', (e) => {
  pointer.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  pointerOnUI = overUI(e);
  tipNode.style.transform = 'translate(' + (e.clientX + 16) + 'px,' + (e.clientY + 18) + 'px)';
  if (drag && drag.free) {
    const dx = e.clientX - drag.x;
    if (Math.abs(dx) > 5) moved = true;
    yawGoal = drag.yaw + dx * 0.003;
    return;
  }
  if (currentRoom !== '') return;
  if (drag) {
    const dx = e.clientX - drag.x;
    if (Math.abs(dx) > 5) moved = true;
    orbitGoal = THREE.MathUtils.clamp(drag.orbit + dx * 0.004, -0.75, 0.75);
    return;
  }
});
addEventListener('pointerdown', (e) => {
  if (overUI(e) || e.button !== 0) return;
  if (freeLook()) {
    /* Kéo để quay; bấm không kéo mới tính là chọn đồ vật (xử lí ở pointerup) */
    drag = { x: e.clientX, yaw: yawGoal, free: true };
    moved = false;
    return;
  }
  if (currentRoom !== '') {
    pointer.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
    const hit = pickHot();
    if (hit) {
      if (hit.book !== undefined) selectedBook = hit.book;
      hit.action();
      document.dispatchEvent(new Event('tp:poke'));
    }
    return;
  }
  drag = { x: e.clientX, orbit: orbitGoal };
  moved = false;
});
addEventListener('pointerup', (e) => {
  if (!drag) return;
  const free = drag.free;
  drag = null;
  if (free) {
    if (moved || overUI(e)) return;
    pointer.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
    const hit = pickHot();
    if (hit) { hit.action(); document.dispatchEvent(new Event('tp:poke')); }
    return;
  }
  if (moved || currentRoom !== '') return;
  pointer.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  const id = pickRoom();
  if (id) location.hash = id;
});

/* Đang kéo để xoay thì không cho trình duyệt bôi đen chữ trên trang */
addEventListener('selectstart', (e) => { if (drag) e.preventDefault(); });
addEventListener('pointercancel', () => { drag = null; });

/* Bấm một tủ kính: máy quay tiến lại gần tủ đó. Đóng thẻ thông tin thì lùi về giữa phòng. */
document.addEventListener('tp:exhibit', (e) => {
  const spot = FOCUS[e.detail];
  if (!spot || currentRoom !== 'ham') return;
  /* Chốt hướng đang nhìn vào shot để chuyển cảnh không bị giật */
  const fwd = shot.look.clone().sub(shot.pos).applyAxisAngle(THREE.Object3D.DEFAULT_UP, yaw);
  shot.look.copy(shot.pos).add(fwd);
  yaw = 0; yawGoal = 0;
  from.pos.copy(shot.pos); from.look.copy(shot.look);
  to.look.copy(spot.look);
  to.pos.copy(spot.pos);
  fovFrom = fovTo = camera.fov;
  focused = e.detail;
  /* Thẻ thông tin vừa hiện ngay dưới con trỏ: ngừng dò đồ vật cho tới khi chuột nhúc nhích */
  pointerOnUI = true;
  tween = reduceMotion ? 1 : 0;
  if (tween === 1) { shot.pos.copy(to.pos); shot.look.copy(to.look); }
});
document.addEventListener('tp:exhibit-close', () => {
  if (focused === null) return;
  focused = null;
  if (currentRoom === 'ham') setShot('ham');
});

let listHover = null, lightsOut = false;
document.addEventListener('tp:hover', (e) => { listHover = e.detail; });
document.addEventListener('tp:lights', (e) => { lightsOut = e.detail; });
document.addEventListener('tp:go', (e) => {
  currentRoom = e.detail;
  hovered = null;
  document.body.style.cursor = '';
  orbitGoal = 0;
  focused = null;
  yaw = Math.atan2(Math.sin(yaw), Math.cos(yaw));
  yawGoal = 0;
  setShot(currentRoom);
});

let composer = null;
if (!lowPower) {
  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.5, 0.65, 0.82));
  composer.addPass(new OutputPass());
}
addEventListener('resize', () => { layout(); if (tween === 1) setShot(currentRoom, true); });
layout();
setShot(location.hash.slice(1), true);
currentRoom = location.hash.slice(1);
shiftX = currentRoom ? 0 : fit.sx;
shiftY = currentRoom ? 0 : fit.sy;
applyOffset();

/* Vòng lặp */
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const levels = new Uint8Array(128);
const introStart = performance.now();
const introOrder = { nhac: 0.3, sach: 0.6, cong: 0.9, game: 1.2, hoc: 1.5, nghi: 1.52, kehoach: 1.55, bep: 1.6, garage: 1.7, san: 1.9, vuon: 2.1, ham: 2.3 };
let last = performance.now(), running = false, termTick = 0, gridTick = 0;

function frame(now) {
  requestAnimationFrame(frame);
  const paused = document.hidden || ['hoc', 'san', 'vuon'].includes(document.body.dataset.room) || document.body.classList.contains('in-game');
  if (paused) { last = now; return; }
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  const t = now / 1000;

  if (tween < 1) {
    tween = Math.min(1, tween + dt / 0.95);
    const k = ease(tween);
    shot.pos.lerpVectors(from.pos, to.pos, k);
    shot.look.lerpVectors(from.look, to.look, k);
    if (fovFrom !== fovTo) { camera.fov = fovFrom + (fovTo - fovFrom) * k; camera.updateProjectionMatrix(); }
  }
  const sideRoom = innerWidth > 900 && currentRoom === 'game';
  const goalX = !currentRoom ? fit.sx : sideRoom ? 0.2 : (focused !== null && innerWidth > 900) ? 0.13 : 0;
  const goalY = !currentRoom ? fit.sy : 0;
  if (Math.abs(shiftX - goalX) > 0.001 || Math.abs(shiftY - goalY) > 0.001) {
    const rate = 1 - Math.exp(-dt * 7);
    shiftX += (goalX - shiftX) * rate;
    shiftY += (goalY - shiftY) * rate;
    applyOffset();
  }

  orbit += (orbitGoal - orbit) * (1 - Math.exp(-dt * 8));
  tilt += ((reduceMotion ? 0 : pointer.x * 0.035) - tilt) * (1 - Math.exp(-dt * 4));
  const offset = shot.pos.clone().sub(shot.look);
  offset.applyAxisAngle(THREE.Object3D.DEFAULT_UP, orbit + tilt);
  offset.y += reduceMotion ? 0 : pointer.y * 0.35;
  camera.position.copy(shot.look).add(offset);
  camera.lookAt(shot.look);
  yaw += (yawGoal - yaw) * (1 - Math.exp(-dt * 10));
  if (Math.abs(yaw) > 0.0005) {
    /* Nhìn tự do: máy quay đứng yên, hướng nhìn quay quanh nó */
    const fwd = shot.look.clone().sub(camera.position).applyAxisAngle(THREE.Object3D.DEFAULT_UP, yaw);
    camera.lookAt(fwd.add(camera.position));
    /* lookAt thứ hai để lại ma trận của hướng nhìn cũ; cập nhật lại để dò con trỏ đúng hướng đang thấy */
    camera.updateMatrixWorld();
  }

  /* Raycast đúng một lần mỗi khung hình */
  if (!drag && !pointerOnUI && tween === 1) {
    if (currentRoom === '') { hovered = pickRoom(); hotHover = null; }
    else { hovered = null; hotHover = pickHot(); }
  } else { hovered = null; hotHover = null; }
  document.body.style.cursor = hovered || hotHover ? 'pointer' : '';
  tipNode.hidden = !hotHover;
  if (hotHover && tipNode.textContent !== hotHover.tip) tipNode.textContent = hotHover.tip;
  hots.forEach((h) => {
    const on = h === hotHover || (h.book !== undefined && h.book === selectedBook && currentRoom === 'sach');
    h.k += ((on ? 1 : 0) - h.k) * (1 - Math.exp(-dt * 12));
    if (h.pull) h.mesh.position.z = h.home.z + h.k * h.pull;
    if (h.glowUp) h.mesh.material.emissiveIntensity = 0.35 + h.k * 1.1;
  });

  /* Tắt đèn trong phòng: cả căn nhà tối theo */
  const dimmed = lightsOut && currentRoom;
  const dimRate = 1 - Math.exp(-dt * 8);
  hemi.intensity += ((dimmed ? 0.12 : 1.7) - hemi.intensity) * dimRate;
  moon.intensity += ((dimmed ? 0.08 : 1.5) - moon.intensity) * dimRate;

  /* Đèn phòng */
  const playing = Music.state.playing;
  let beat = 0;
  if (playing && Music.levels(levels)) beat = (levels[3] + levels[6] + levels[10]) / 765;
  Object.keys(ROOMS).forEach((id) => {
    const room = ROOMS[id];
    const on = !LOCKED.has(id) && (id === hovered || id === listHover || id === Walk.region() || id === currentRoom);
    let goal = on ? 1 : currentRoom ? 0.08 : 0.5;
    if (lightsOut && currentRoom) goal = 0.02;
    if (LOCKED.has(id)) goal = 0.12;
    if (!reduceMotion && t * 1000 - introStart < 2600 && (now - introStart) / 1000 < introOrder[id]) goal = 0;
    room.level += (goal - room.level) * (1 - Math.exp(-dt * 8));
    room.pointLight.intensity = room.power * room.level;
    room.edge.material.opacity = (on && !currentRoom) ? 0.85 : 0;
    room.glows.forEach((g) => { if (!g.basic) g.mat.emissiveIntensity = g.base * (currentRoom === id ? 0.45 : 0.15 + room.level); });
    room.doors.forEach((door) => {
      const goalAngle = on ? door.open : door.ajar;
      door.pivot.rotation.y += (goalAngle - door.pivot.rotation.y) * (1 - Math.exp(-dt * 9));
    });
  });
  ROOMS.ham.extra.forEach((l) => { l.intensity = 16 * ROOMS.ham.level; });
  if (playing) disc.rotation.y -= dt * 3.4;
  tonearm.rotation.y += ((playing ? -0.62 : -0.1) - tonearm.rotation.y) * (1 - Math.exp(-dt * 5));
  if (armLow && !reduceMotion && (currentRoom === 'garage' || currentRoom === '')) {
    armLow.rotation.y = Math.sin(t * 0.5) * 0.9;
    armTop.rotation.z = Math.sin(t * 0.8) * 0.3 - 0.1;
    if (Math.floor(t * 8) !== gridTick) { gridTick = Math.floor(t * 8); gridDraw(t); }
  }
  if (currentRoom === 'cong' || currentRoom === 'garage' || currentRoom === '') {
    leds.forEach((l) => { l.material.color.copy(l.base).multiplyScalar(Math.sin(t * l.speed + l.phase) > 0.2 ? 1 : 0.15); });
    if (Math.floor(t * 2) !== termTick) { termTick = Math.floor(t * 2); termDraw(); }
  }
  speakers.forEach((s) => {
    const k = 1 + beat * 0.5;
    s.scale.set(k, 1, k);
    s.material.emissiveIntensity = 0.35 + beat * 1.1;
  });

  if (!reduceMotion) {
    sign.position.y = SIGN_Y + Math.sin(t * 0.7) * 0.1;
    sign.rotation.y = Math.sin(t * 0.35) * 0.14 + pointer.x * 0.12;
  }

  /* Mascot trong nhà */
  const walking = now - lastMove < 90;
  walker.group.visible = currentRoom === '' || tween < 0.6;
  walker.group.position.set(walkerPos.x, 0.02 + walkerPos.h, walkerPos.z);
  if (walking) {
    let d = walkerPos.heading - walker.group.rotation.y;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    walker.group.rotation.y += d * (1 - Math.exp(-dt * 14));
  } else if (now - lastMove > 1500) {
    let d = 0.5 - walker.group.rotation.y;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    walker.group.rotation.y += d * (1 - Math.exp(-dt * 3));
  }
  walker.move(walking ? 1 : 0);
  if (playing && !walking) { if (walker.state() !== 'dance') walker.play('dance', 0); }
  else if (walker.state() === 'dance') walker.idle();
  walker.update(dt);
  if (jeffBot) jeffBot.update(dt);
  if (icareBot) icareBot.update(dt);
  if (plannerTick) plannerTick();

  if (composer) composer.render(); else renderer.render(scene, camera);

  /* Nhãn tên phòng bám theo căn nhà */
  const showLabels = currentRoom === '' && tween === 1;
  Object.keys(labels).forEach((id) => {
    const node = labels[id];
    if (!showLabels) { node.style.opacity = 0; return; }
    const r = ROOMS[id].rect, at = ROOMS[id].label;
    const [lx, lz] = at ? P(at[0], at[1]) : P((r[0] + r[2]) / 2, (r[1] + r[3]) / 2);
    const v = new THREE.Vector3(lx, at ? at[2] : 2.3, lz).project(camera);
    const on = id === hovered || id === listHover || id === Walk.region();
    node.style.opacity = on ? 1 : 0.72;
    node.classList.toggle('on', on);
    node.style.transform = 'translate(-50%,-50%) translate(' + ((v.x + 1) / 2 * innerWidth).toFixed(1) + 'px,' + ((1 - v.y) / 2 * innerHeight).toFixed(1) + 'px)';
  });

  if (!running) {
    running = true;
    document.body.classList.add('has-3d');
    document.dispatchEvent(new Event('tp:ready'));
  }
}
requestAnimationFrame(frame);
