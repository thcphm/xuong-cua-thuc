/* Căn nhà 3D. Toạ độ dùng chung với mặt bằng 2D: 50 đơn vị bản vẽ = 1 mét. */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { createMascot, tpShape, tpTexture } from './mascot.js';

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

scene.add(new THREE.HemisphereLight('#6d8fc9', '#0a1020', 1.7));
const moon = new THREE.DirectionalLight('#a8c4ff', 1.5);
moon.position.set(-7, 18, 10);
moon.castShadow = true;
moon.shadow.mapSize.set(lowPower ? 1024 : 2048, lowPower ? 1024 : 2048);
Object.assign(moon.shadow.camera, { left: -13, right: 13, top: 11, bottom: -11, near: 1, far: 44 });
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
const ground = new THREE.Mesh(new THREE.CircleGeometry(60, 48), std('#060a13', { roughness: 0.9 }));
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
  hoc: { rect: [40, 340, 290, 590], color: '#9fd3ff', floor: '#11203a', light: [165, 420, 2.2], power: 22 }
};
const floors = [];
Object.keys(ROOMS).forEach((id) => {
  const room = ROOMS[id], [x0, y0, x1, y1] = room.rect;
  const [ax, az] = P(x0, y0), [bx, bz] = P(x1, y1);
  const floor = box(house, bx - ax, 0.04, bz - az, (ax + bx) / 2, 0, (az + bz) / 2, std(room.floor, { roughness: 0.55 }));
  /* Vùng bấm cao bằng cả phòng: bấm trúng đồ đạc vẫn vào đúng phòng đó */
  const hit = new THREE.Mesh(new THREE.BoxGeometry(bx - ax, 1.7, bz - az), floor.material);
  hit.position.set((ax + bx) / 2, 0.85, (az + bz) / 2);
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
      new THREE.Vector3(ax + 0.14, 0.05, az + 0.14), new THREE.Vector3(bx - 0.14, 0.05, az + 0.14),
      new THREE.Vector3(bx - 0.14, 0.05, bz - 0.14), new THREE.Vector3(ax + 0.14, 0.05, bz - 0.14)
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
  if (y1 === 590 && y2 === 590) { wall(40, 590, 390, 590, LOW); wall(470, 590, 960, 590, LOW); return; }
  if (x1 === 960 && x2 === 960) return wall(x1, y1, x2, y2, LOW);
  if (y1 === 30 && y2 === 30) return wall(x1, y1, x2, y2, TALL, 0.2);
  if (x1 === 40 && x2 === 40) return wall(x1, y1, x2, y2, TALL, 0.2);
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
    addHot(cabinet, 'cong', 'Mở terminal', () => document.dispatchEvent(new Event('tp:terminal')), { noMove: true });
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
  addHot(screen, 'cong', 'Mở terminal', () => document.dispatchEvent(new Event('tp:terminal')), { noMove: true });
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
  const [px, pz] = P(535, 552);
  cyl(house, 0.2, 0.15, 0.32, px, 0.18, pz, furn2);
  for (let i = 0; i < 7; i++) {
    const a = i / 7 * Math.PI * 2;
    ball(house, 0.2, px + Math.cos(a) * 0.17, 0.56 + (i % 3) * 0.14, pz + Math.sin(a) * 0.17, std('#2a6b58'));
  }
  const [sx, sz] = P(342, 562);
  box(house, 1.3, 0.42, 0.5, sx, 0.23, sz, wood);
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
const walkerPos = { x: 0, z: 0, heading: 0 };
let lastMove = 0;
Walk.onMove((pos) => {
  const [x, z] = P(pos.x, pos.y);
  const dx = x - walkerPos.x, dz = z - walkerPos.z;
  if (Math.hypot(dx, dz) > 0.0005) { walkerPos.heading = Math.atan2(dx, dz); lastMove = performance.now(); }
  walkerPos.x = x; walkerPos.z = z;
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
  hoc: { look: P(165, 420), off: [3, 3.6, 7.4], y: 0.6 }
};
const shot = { pos: HOME.pos.clone(), look: HOME.look.clone() };
const from = { pos: HOME.pos.clone(), look: HOME.look.clone() };
const to = { pos: HOME.pos.clone(), look: HOME.look.clone() };
let tween = 1, currentRoom = '', hovered = null, viewShift = 0;

function layout() {
  const w = innerWidth, h = innerHeight;
  if (!w || !h) return;
  renderer.setSize(w, h, false);
  if (composer) composer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  scene.fog.near = 34 * homeDistance();
  scene.fog.far = 66 * homeDistance();
  applyOffset();
}
function applyOffset() {
  const w = innerWidth, h = innerHeight;
  const wide = w > 900;
  if (viewShift > 0.001) {
    if (wide) camera.setViewOffset(w, h, -w * viewShift, 0, w, h);
    else camera.setViewOffset(w, h, 0, h * viewShift * 1.5, w, h);
  } else camera.clearViewOffset();
}
function homeDistance() {
  if (!innerWidth || !innerHeight) return 1.08;
  const aspect = innerWidth / innerHeight;
  return aspect > 1.5 ? 1.08 : aspect > 1 ? 1.3 : Math.max(1.5, 1.05 / aspect);
}
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
  tween = instant || reduceMotion ? 1 : 0;
  if (tween === 1) { shot.pos.copy(to.pos); shot.look.copy(to.look); }
}

/* Chuột: xoay nhà, chọn phòng */
const pointer = new THREE.Vector2(0, 0), ray = new THREE.Raycaster();
let pointerOnUI = true, hotHover = null;
const tipNode = document.getElementById('hotspotTip');
let orbit = 0, orbitGoal = 0, tilt = 0, drag = null, moved = false;
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
  drag = null;
  if (moved || currentRoom !== '') return;
  pointer.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  const id = pickRoom();
  if (id) location.hash = id;
});

let listHover = null, lightsOut = false;
document.addEventListener('tp:hover', (e) => { listHover = e.detail; });
document.addEventListener('tp:lights', (e) => { lightsOut = e.detail; });
document.addEventListener('tp:go', (e) => {
  currentRoom = e.detail;
  hovered = null;
  document.body.style.cursor = '';
  orbitGoal = 0;
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
viewShift = currentRoom ? 0 : innerWidth > 900 ? 0.11 : 0.2;
applyOffset();

/* Vòng lặp */
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const levels = new Uint8Array(128);
const introStart = performance.now();
const introOrder = { nhac: 0.3, sach: 0.6, cong: 0.9, game: 1.2, hoc: 1.5 };
let last = performance.now(), running = false, termTick = 0;

function frame(now) {
  requestAnimationFrame(frame);
  const paused = document.hidden || document.body.dataset.room === 'hoc' || document.body.classList.contains('in-game');
  if (paused) { last = now; return; }
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  const t = now / 1000;

  if (tween < 1) {
    tween = Math.min(1, tween + dt / 0.95);
    const k = ease(tween);
    shot.pos.lerpVectors(from.pos, to.pos, k);
    shot.look.lerpVectors(from.look, to.look, k);
  }
  const wide = innerWidth > 900;
  const shiftGoal = !currentRoom ? (wide ? 0.11 : 0.2) : wide && currentRoom !== 'hoc' && currentRoom !== 'nhac' ? 0.2 : 0;
  if (Math.abs(viewShift - shiftGoal) > 0.002) {
    viewShift += (shiftGoal - viewShift) * (1 - Math.exp(-dt * 7));
    applyOffset();
  }

  orbit += (orbitGoal - orbit) * (1 - Math.exp(-dt * 8));
  tilt += ((reduceMotion ? 0 : pointer.x * 0.035) - tilt) * (1 - Math.exp(-dt * 4));
  const offset = shot.pos.clone().sub(shot.look);
  offset.applyAxisAngle(THREE.Object3D.DEFAULT_UP, orbit + tilt);
  offset.y += reduceMotion ? 0 : pointer.y * 0.35;
  camera.position.copy(shot.look).add(offset);
  camera.lookAt(shot.look);

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

  /* Đèn phòng */
  const playing = Music.state.playing;
  let beat = 0;
  if (playing && Music.levels(levels)) beat = (levels[3] + levels[6] + levels[10]) / 765;
  Object.keys(ROOMS).forEach((id) => {
    const room = ROOMS[id];
    const on = !LOCKED.has(id) && (id === hovered || id === listHover || id === Walk.region() || id === currentRoom);
    let goal = on ? 1 : currentRoom ? 0.08 : 0.5;
    if (lightsOut && id === currentRoom) goal = 0.05;
    if (LOCKED.has(id)) goal = 0.12;
    if (!reduceMotion && t * 1000 - introStart < 2600 && (now - introStart) / 1000 < introOrder[id]) goal = 0;
    room.level += (goal - room.level) * (1 - Math.exp(-dt * 8));
    room.pointLight.intensity = room.power * room.level;
    room.edge.material.opacity = (on && !currentRoom) ? 0.85 : 0;
    room.glows.forEach((g) => { g.mat.emissiveIntensity = g.base * (currentRoom === id ? 0.45 : 0.15 + room.level); });
    room.doors.forEach((door) => {
      const goalAngle = on ? door.open : door.ajar;
      door.pivot.rotation.y += (goalAngle - door.pivot.rotation.y) * (1 - Math.exp(-dt * 9));
    });
  });
  if (playing) disc.rotation.y -= dt * 3.4;
  tonearm.rotation.y += ((playing ? -0.62 : -0.1) - tonearm.rotation.y) * (1 - Math.exp(-dt * 5));
  if (currentRoom === 'cong' || currentRoom === '') {
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
  walker.group.position.set(walkerPos.x, 0.02, walkerPos.z);
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

  if (composer) composer.render(); else renderer.render(scene, camera);

  /* Nhãn tên phòng bám theo căn nhà */
  const showLabels = currentRoom === '' && viewShift > 0.9;
  Object.keys(labels).forEach((id) => {
    const node = labels[id];
    if (!showLabels) { node.style.opacity = 0; return; }
    const r = ROOMS[id].rect;
    const [lx, lz] = P((r[0] + r[2]) / 2, (r[1] + r[3]) / 2);
    const v = new THREE.Vector3(lx, 2.3, lz).project(camera);
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
