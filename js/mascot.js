/* Logo TP và robot trợ lí TP, dựng hoàn toàn bằng hình khối, không dùng file 3D ngoài. */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export const TP_PATH = 'M0 0H78A30 30 0 0 1 78 60H62V100H48V14H34V100H20V14H0Z M62 14V46H76A16 16 0 0 0 76 14Z';

/* Texture logo TP dùng cho đĩa nhạc, màn hình, thảm. */
export function tpTexture({ fg = '#dfe8f3', bg = null, size = 256 } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const g = canvas.getContext('2d');
  if (bg) { g.fillStyle = bg; g.fillRect(0, 0, size, size); }
  const scale = size * 0.62 / 108;
  g.translate((size - 108 * scale) / 2, (size - 100 * scale) / 2);
  g.scale(scale, scale);
  g.fillStyle = fg;
  g.fill(new Path2D(TP_PATH), 'evenodd');
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

/* Hình khối logo TP để đùn thành chữ 3D. Trục y đảo so với SVG. */
export function tpShape() {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.lineTo(78, 0);
  s.absarc(78, -30, 30, Math.PI / 2, -Math.PI / 2, true);
  s.lineTo(62, -60);
  s.lineTo(62, -100);
  s.lineTo(48, -100);
  s.lineTo(48, -14);
  s.lineTo(34, -14);
  s.lineTo(34, -100);
  s.lineTo(20, -100);
  s.lineTo(20, -14);
  s.lineTo(0, -14);
  s.closePath();
  const hole = new THREE.Path();
  hole.moveTo(62, -14);
  hole.lineTo(76, -14);
  hole.absarc(76, -30, 16, Math.PI / 2, -Math.PI / 2, true);
  hole.lineTo(62, -46);
  hole.closePath();
  s.holes.push(hole);
  return s;
}

const lerp = (a, b, k) => a + (b - a) * k;

const FACES = {
  neutral: { l: 'oval', r: 'oval' },
  happy: { l: 'arc', r: 'arc' },
  wink: { l: 'oval', r: 'arc' },
  surprised: { l: 'big', r: 'big', mouth: 'o' },
  think: { l: 'oval', r: 'small', extra: 'dots' },
  sleepy: { l: 'flat', r: 'flat', extra: 'z' },
  music: { l: 'note', r: 'note' }
};

/* Màn hình mặt: vẽ biểu cảm lên canvas rồi dán lên kính cong */
function createScreen() {
  const W = 512, H = 300;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const g = canvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  const GLOW = '#bfefff', HALO = '#39c6ff';

  function panel() {
    g.beginPath();
    g.roundRect(14, 14, W - 28, H - 28, 118);
  }
  function eye(type, x, y, open) {
    g.fillStyle = GLOW;
    g.strokeStyle = GLOW;
    g.lineCap = 'round';
    g.beginPath();
    if (type === 'oval') {
      g.ellipse(x, y, 25, Math.max(4, 40 * open), 0, 0, Math.PI * 2);
      g.fill();
    } else if (type === 'small') {
      g.ellipse(x, y - 6, 19, Math.max(4, 27 * open), 0, 0, Math.PI * 2);
      g.fill();
    } else if (type === 'big') {
      g.arc(x, y - 4, 46, 0, Math.PI * 2);
      g.fill();
    } else if (type === 'arc') {
      g.lineWidth = 20;
      g.arc(x, y + 22, 40, Math.PI * 1.15, Math.PI * 1.85);
      g.stroke();
    } else if (type === 'flat') {
      g.lineWidth = 16;
      g.moveTo(x - 32, y + 6);
      g.lineTo(x + 32, y + 6);
      g.stroke();
    } else if (type === 'note') {
      g.ellipse(x - 12, y + 30, 22, 17, -0.3, 0, Math.PI * 2);
      g.fill();
      g.beginPath();
      g.lineWidth = 11;
      g.moveTo(x + 7, y + 28);
      g.lineTo(x + 7, y - 36);
      g.lineTo(x + 36, y - 22);
      g.stroke();
    }
  }
  function draw(state) {
    g.clearRect(0, 0, W, H);
    g.save();
    panel();
    const fill = g.createLinearGradient(0, 0, 0, H);
    fill.addColorStop(0, '#0b2bb0');
    fill.addColorStop(1, '#0a1560');
    g.fillStyle = fill;
    g.fill();
    g.clip();

    const face = FACES[state.face];
    const x = state.lx * 22, y = state.ly * 14;
    g.shadowColor = HALO;
    g.shadowBlur = 30;
    eye(face.l, 168 + x, 142 + y, state.open);
    eye(face.r, 344 + x, 142 + y, state.open);
    g.fillStyle = GLOW;
    if (face.extra === 'dots') {
      for (let i = 0; i < 3; i++) {
        g.globalAlpha = state.tick % 3 === i ? 1 : 0.35;
        g.beginPath();
        g.arc(404 + i * 24, 78, 8, 0, Math.PI * 2);
        g.fill();
      }
      g.globalAlpha = 1;
    }
    if (face.extra === 'z') {
      g.font = '600 46px sans-serif';
      g.fillText('z', 396, 88);
      g.font = '600 30px sans-serif';
      g.fillText('z', 434, 58);
    }
    if (state.talk) {
      for (let i = 0; i < 7; i++) {
        const h = 8 + Math.abs(Math.sin(state.tick * 1.3 + i * 1.7)) * 30;
        g.beginPath();
        g.roundRect(208 + i * 15 + x, 232 - h / 2, 8, h, 4);
        g.fill();
      }
    } else if (face.mouth === 'o') {
      g.beginPath();
      g.arc(256 + x, 234, 15, 0, Math.PI * 2);
      g.fill();
    }
    g.shadowBlur = 0;

    g.fillStyle = 'rgba(255,255,255,.07)';
    g.beginPath();
    g.ellipse(352, 62, 118, 36, 0.14, 0, Math.PI * 2);
    g.fill();
    g.restore();

    g.save();
    panel();
    g.lineWidth = 9;
    g.strokeStyle = '#4fdcff';
    g.shadowColor = '#4fdcff';
    g.shadowBlur = 16;
    g.stroke();
    g.restore();
    texture.needsUpdate = true;
  }
  return { texture, draw };
}

function chestTexture(accent, mark) {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const g = canvas.getContext('2d');
  g.fillStyle = accent;
  g.beginPath();
  g.moveTo(26, 34);
  g.quadraticCurveTo(128, 14, 230, 34);
  g.quadraticCurveTo(238, 170, 128, 238);
  g.quadraticCurveTo(18, 170, 26, 34);
  g.fill();
  const s = 0.82;
  g.translate(128 - 54 * s, 112 - 50 * s);
  g.scale(s, s);
  g.fillStyle = mark;
  g.fill(new Path2D(TP_PATH), 'evenodd');
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/* Lưới siêu elip: cho bề mặt cong liền mạch, cắt được một mảng để làm kính và túi ngực. */
function surfaceMesh({ rx, ry, rz, n = 2, taper = 0, t0 = 0.0001, t1 = Math.PI - 0.0001, p0 = -Math.PI, p1 = Math.PI, grow = 1, segT = 80, segP = 128 }) {
  const pos = [], uv = [], index = [];
  const pw = (v, e) => Math.sign(v) * Math.pow(Math.abs(v), e);
  for (let i = 0; i <= segT; i++) {
    const v = i / segT, t = t0 + (t1 - t0) * v;
    for (let j = 0; j <= segP; j++) {
      const u = j / segP, p = p0 + (p1 - p0) * u;
      const h = pw(Math.sin(t), 2 / n);
      const y = ry * pw(Math.cos(t), 2 / n);
      const squeeze = 1 + taper * (y / ry);
      pos.push(rx * h * pw(Math.sin(p), 2 / n) * squeeze * grow, y * grow, rz * h * pw(Math.cos(p), 2 / n) * squeeze * grow);
      uv.push(u, 1 - v);
    }
  }
  for (let i = 0; i < segT; i++) {
    for (let j = 0; j < segP; j++) {
      const a = i * (segP + 1) + j, b = a + segP + 1;
      index.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(index);
  geo.computeVertexNormals();
  return geo;
}

/* Khối bo tròn cho vây tai và mào: đùn từ hình thang, vát cạnh mượt */
function softTrapezoid(bottom, top, height, depth, bevel) {
  const s = new THREE.Shape();
  const b = bottom / 2, t = top / 2, r = Math.min(top, height) * 0.28;
  s.moveTo(-b, 0);
  s.lineTo(b, 0);
  s.lineTo(t, height - r);
  s.quadraticCurveTo(t, height, t - r, height);
  s.lineTo(-t + r, height);
  s.quadraticCurveTo(-t, height, -t, height - r);
  s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 10, curveSegments: 24, steps: 1 });
  geo.center();
  return geo;
}

function roundedMask() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 300;
  const g = canvas.getContext('2d');
  g.fillStyle = '#000';
  g.fillRect(0, 0, 512, 300);
  g.fillStyle = '#fff';
  g.beginPath();
  g.roundRect(14, 14, 484, 272, 118);
  g.fill();
  return new THREE.CanvasTexture(canvas);
}

export function createMascot(cfg = {}, renderer) {
  const look = Object.assign({ shell: '#dfe3ea', accent: '#1fb5b0', mark: '#e6fbf9', env: 0.62 }, cfg);

  /* Phản chiếu môi trường studio: thứ làm vật liệu trông thật */
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envMap = pmrem.fromScene(new RoomEnvironment(renderer), 0.03).texture;
  pmrem.dispose();

  const vinyl = (color, extra = {}) => new THREE.MeshPhysicalMaterial(Object.assign({ color, roughness: 0.46, clearcoat: 0.4, clearcoatRoughness: 0.32, envMap, envMapIntensity: look.env }, extra));
  const shell = vinyl(look.shell);
  const accent = vinyl(look.accent, { roughness: 0.34, clearcoat: 0.6 });

  const add = (parent, geo, material, x = 0, y = 0, z = 0) => {
    const mesh = new THREE.Mesh(geo, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };

  const root = new THREE.Group();
  const body = new THREE.Group();
  body.position.y = 0.22;
  root.add(body);

  const BODY = { rx: 0.5, ry: 0.56, rz: 0.46, n: 2.15, taper: 0.14 };
  add(body, surfaceMesh(BODY), shell, 0, 0.6, 0);
  add(body, surfaceMesh({ ...BODY, t0: 1.72, t1: 1.745, grow: 1.004, segT: 2 }), new THREE.MeshStandardMaterial({ color: '#1b2f6b', roughness: 0.5 }), 0, 0.6, 0).castShadow = false;
  const chest = add(body, surfaceMesh({ ...BODY, t0: 1.32, t1: 2.5, p0: -0.74, p1: 0.74, grow: 1.012, segT: 40, segP: 50 }),
    vinyl('#ffffff', { map: chestTexture(look.accent, look.mark), transparent: true, alphaTest: 0.5, roughness: 0.32, clearcoat: 0.7 }), 0, 0.6, 0);
  chest.castShadow = false;

  /* Tay hình giọt nước */
  const teardrop = [];
  for (let i = 0; i <= 48; i++) {
    const s = i / 48;
    teardrop.push(new THREE.Vector2(Math.max(0.0001, 0.185 * Math.pow(Math.sin(Math.PI * Math.pow(s, 0.72)), 0.72)), -s * 0.68));
  }
  const armGeo = new THREE.LatheGeometry(teardrop, 64);
  armGeo.scale(1, 1, 0.72);
  function arm(side) {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.45, 0.94, 0);
    body.add(pivot);
    add(pivot, armGeo, shell, side * 0.03, 0, 0);
    return pivot;
  }
  const armL = arm(1), armR = arm(-1);

  const head = new THREE.Group();
  head.position.y = 1.08;
  body.add(head);
  const headY = 0.5;
  const HEAD = { rx: 0.74, ry: 0.57, rz: 0.62, n: 2.5 };
  add(head, surfaceMesh(HEAD), shell, 0, headY, 0);

  /* Mào trên đỉnh */
  const crest = add(head, softTrapezoid(0.6, 0.42, 0.14, 0.34, 0.07), shell, 0, headY + 0.585, -0.03);
  crest.rotation.x = -0.06;

  /* Tai tròn, vây xanh, thấu kính bên trái */
  const puck = [];
  const edge = new THREE.CatmullRomCurve3([[0, -0.12], [0.16, -0.12], [0.215, -0.08], [0.225, 0], [0.215, 0.08], [0.16, 0.12], [0, 0.12]].map(([x, y]) => new THREE.Vector3(x, y, 0)));
  edge.getPoints(48).forEach((p) => puck.push(new THREE.Vector2(Math.max(0.0001, p.x), p.y)));
  const earGeo = new THREE.LatheGeometry(puck, 64);
  [1, -1].forEach((side) => {
    const ear = add(head, earGeo, shell, side * 0.735, headY, -0.02);
    ear.rotation.z = Math.PI / 2;
    const fin = add(head, softTrapezoid(0.3, 0.17, 0.44, 0.08, 0.04), accent, side * 0.76, headY + 0.42, -0.02);
    fin.rotation.order = 'YXZ';
    fin.rotation.y = side * 0.95;
    fin.rotation.z = -side * 0.12;
  });
  const lens = add(head, new THREE.SphereGeometry(0.1, 40, 24), new THREE.MeshPhysicalMaterial({ color: '#060a24', roughness: 0.06, clearcoat: 1, envMap, envMapIntensity: 1.4 }), -0.925, headY, -0.02);
  lens.scale.x = 0.34;
  lens.castShadow = false;

  /* Màn hình mặt: viền lõm, lớp hiển thị, lớp kính thật phía trên */
  const mask = roundedMask();
  const VISOR = { ...HEAD, t0: 0.92, t1: 2.22, p0: -1.04, p1: 1.04, segT: 60, segP: 90 };
  add(head, surfaceMesh({ ...VISOR, t0: 0.87, t1: 2.27, p0: -1.1, p1: 1.1, grow: 1.003 }),
    new THREE.MeshPhysicalMaterial({ color: '#c4ccda', roughness: 0.3, envMap, alphaMap: mask, transparent: true, alphaTest: 0.5 }), 0, headY, 0).castShadow = false;
  const screen = createScreen();
  const visor = add(head, surfaceMesh({ ...VISOR, grow: 1.008 }), new THREE.MeshBasicMaterial({ map: screen.texture, transparent: true, alphaTest: 0.02, toneMapped: false }), 0, headY, 0);
  visor.castShadow = false;
  visor.receiveShadow = false;
  const glass = add(head, surfaceMesh({ ...VISOR, grow: 1.014 }), new THREE.MeshPhysicalMaterial({ color: '#0a1a50', roughness: 0.05, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.04, envMap, envMapIntensity: 1.5, transparent: true, opacity: 0.2, alphaMap: mask, depthWrite: false }), 0, headY, 0);
  glass.castShadow = false;
  glass.receiveShadow = false;

  const hover = new THREE.Mesh(new THREE.CircleGeometry(0.34, 48), new THREE.MeshBasicMaterial({ color: '#4fdcff', transparent: true, opacity: 0.3, depthWrite: false, blending: THREE.AdditiveBlending }));
  hover.rotation.x = -Math.PI / 2;
  hover.position.y = 0.02;
  root.add(hover);

  /* Hoạt ảnh: mọi tư thế tính theo thời gian rồi trộn mượt với nhau */
  const clock = { t: 0, until: 0, faceUntil: 0, blink: 2 + Math.random() * 3, frame: 0 };
  let state = 'idle', talking = false, moving = 0, face = 'neutral', lastKey = '';
  const lookAt = { x: 0, y: 0 };
  const pose = { lz: 0.34, lx: 0, rz: -0.34, rx: 0, hx: 0, hy: 0, hz: 0, bob: 0, ry: 0, tilt: 0, lean: 0 };

  function target(t) {
    const p = { lz: 0.34 + Math.sin(t * 1.6) * 0.05, lx: 0, rz: -0.34 - Math.sin(t * 1.6) * 0.05, rx: 0, hx: 0, hy: 0, hz: Math.sin(t * 0.8) * 0.035, bob: Math.sin(t * 2.1) * 0.05, ry: 0, tilt: 0, lean: 0 };
    if (moving > 0.05) { p.lean = 0.34; p.lz = 0.9; p.rz = -0.9; p.bob = Math.sin(t * 9) * 0.03; }
    if (state === 'wave') { p.lz = 2.25 + Math.sin(t * 11) * 0.3; p.hz = -0.12; p.tilt = -0.06; }
    if (state === 'point') { p.rz = -1.5; p.rx = -0.5; p.hy = -0.3; p.ry = -0.25; }
    if (state === 'think') { p.rz = -0.9; p.rx = -1.4; p.hz = 0.16; p.hx = -0.08; }
    if (state === 'cheer') {
      p.lz = 2.5 + Math.sin(t * 14) * 0.18; p.rz = -2.5 - Math.sin(t * 14) * 0.18;
      p.bob = Math.abs(Math.sin(t * 8)) * 0.28;
      p.ry = (t * 9) % (Math.PI * 2);
    }
    if (state === 'dance') {
      const b = Math.sin(t * 7);
      p.lz = 1.5 + b * 0.7; p.rz = -1.5 + b * 0.7;
      p.tilt = b * 0.16; p.hz = -b * 0.2; p.ry = Math.sin(t * 3.5) * 0.5;
      p.bob = Math.abs(Math.cos(t * 7)) * 0.1;
    }
    if (state === 'shake') { p.hy = Math.sin(t * 13) * 0.42; p.rz = -0.7; p.lz = 0.7; }
    if (talking && state === 'idle') { p.lz = 0.55 + Math.sin(t * 5) * 0.16; p.hx = Math.sin(t * 7) * 0.03; }
    return p;
  }
  const AUTO_FACE = { wave: 'happy', cheer: 'happy', dance: 'music', think: 'think', point: 'neutral', shake: 'surprised' };

  return {
    group: root,
    head,
    play(name, seconds = 2.2) {
      state = name;
      clock.until = seconds > 0 ? clock.t + seconds : Infinity;
      if (AUTO_FACE[name]) { face = AUTO_FACE[name]; clock.faceUntil = clock.until; }
    },
    state: () => state,
    idle() { state = 'idle'; face = 'neutral'; },
    talk(on) { talking = on; },
    move(speed) { moving = speed; },
    look(x, y) { lookAt.x = x; lookAt.y = y; },
    face(name, seconds = 2) { face = name; clock.faceUntil = seconds > 0 ? clock.t + seconds : Infinity; },
    update(dt) {
      clock.t += dt;
      const t = clock.t;
      if (t > clock.until) state = 'idle';
      if (t > clock.faceUntil) face = 'neutral';
      const goal = target(t);
      const k = 1 - Math.exp(-dt * 11);
      const spin = state === 'cheer' ? goal.ry : null;
      Object.keys(pose).forEach((key) => { pose[key] = lerp(pose[key], goal[key], k); });
      if (spin !== null) pose.ry = spin;
      armL.rotation.set(pose.lx, 0, pose.lz);
      armR.rotation.set(pose.rx, 0, pose.rz);
      body.position.y = 0.22 + pose.bob;
      body.rotation.set(pose.lean, pose.ry, pose.tilt);
      const follow = state === 'dance' || state === 'cheer' ? 0.2 : 1;
      head.rotation.x = pose.hx + lookAt.y * 0.3 * follow;
      head.rotation.y = pose.hy + lookAt.x * 0.5 * follow;
      head.rotation.z = pose.hz;
      hover.scale.setScalar(1 - pose.bob * 1.6);

      if (t > clock.blink) clock.blink = t + 2 + Math.random() * 3.5;
      const open = clock.blink - t < 0.11 ? 0.08 : 1;
      const tick = Math.floor(t * (talking ? 14 : 3));
      const lx = Math.round(lookAt.x * follow * 5) / 5, ly = Math.round(lookAt.y * follow * 5) / 5;
      const key = [face, open, lx, ly, talking ? tick : 0, FACES[face].extra === 'dots' ? tick : 0, talking].join();
      if (key !== lastKey) {
        lastKey = key;
        screen.draw({ face, open, lx, ly, talk: talking, tick });
      }
    }
  };
}
