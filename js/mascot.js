/* Logo TP và các robot trợ lí, dựng hoàn toàn bằng hình khối, không dùng file 3D ngoài.
   Kiểu 'tom' là T.O.M, kiểu 'xmas' là X.M.A.S (trợ lí tổng: dáng thon, vòng sáng, tông trắng xanh lá),
   kiểu 'jeff' là J.E.F.F (robot đầu bếp: mũ bếp, áo hai hàng cúc, khăn cổ đỏ, tông trắng kem, đỏ cà chua, cam lửa),
   kiểu 'icare' là I.C.A.R.E (bạn đồng hành chăm sóc: áo blouse trắng, gương khám trên trán, ống nghe, tông trắng và hồng san hô). */
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
function createScreen(theme = {}) {
  const TONE = Object.assign({ glow: '#bfefff', halo: '#39c6ff', top: '#0b2bb0', bottom: '#0a1560', rim: '#4fdcff', mustache: false }, theme);
  const W = 512, H = 300;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const g = canvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  const GLOW = TONE.glow, HALO = TONE.halo;

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
    fill.addColorStop(0, TONE.top);
    fill.addColorStop(1, TONE.bottom);
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
    } else if (TONE.mustache) {
      /* Ria mép vểnh của đầu bếp */
      g.lineWidth = 13;
      g.lineCap = 'round';
      g.strokeStyle = GLOW;
      g.beginPath();
      g.moveTo(256 + x, 218);
      g.bezierCurveTo(238 + x, 244, 198 + x, 244, 182 + x, 208);
      g.moveTo(256 + x, 218);
      g.bezierCurveTo(274 + x, 244, 314 + x, 244, 330 + x, 208);
      g.stroke();
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
    g.strokeStyle = TONE.rim;
    g.shadowColor = TONE.rim;
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

/* Áo bếp của J.E.F.F: vạt chéo và hai hàng cúc */
function jacketTexture(color) {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const g = canvas.getContext('2d');
  g.strokeStyle = '#cfc7b8';
  g.lineWidth = 6;
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(206, 10);
  g.quadraticCurveTo(196, 150, 128, 246);
  g.stroke();
  g.fillStyle = color;
  [84, 172].forEach((bx) => [58, 122, 186].forEach((by) => {
    g.beginPath();
    g.arc(bx, by, 13, 0, Math.PI * 2);
    g.fill();
  }));
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/* Áo blouse của I.C.A.R.E: cổ chữ V màu nhấn, hai ve áo, túi ngực có dấu cộng, đường nhịp tim.
   Dùng dấu cộng màu hồng, không dùng chữ thập đỏ. */
function coatTexture(color) {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const g = canvas.getContext('2d');
  g.lineCap = 'round';
  g.lineJoin = 'round';
  g.fillStyle = color;
  g.beginPath();
  g.moveTo(84, 0);
  g.lineTo(172, 0);
  g.lineTo(128, 92);
  g.closePath();
  g.fill();
  g.strokeStyle = '#c3ccd9';
  g.lineWidth = 7;
  g.beginPath();
  g.moveTo(78, 0);
  g.lineTo(128, 100);
  g.lineTo(178, 0);
  g.moveTo(128, 100);
  g.lineTo(128, 252);
  g.stroke();
  g.lineWidth = 6;
  g.strokeRect(166, 106, 60, 54);
  g.fillStyle = color;
  g.fillRect(190, 116, 12, 34);
  g.fillRect(179, 127, 34, 12);
  g.strokeStyle = color;
  g.lineWidth = 8;
  g.beginPath();
  g.moveTo(18, 150);
  g.lineTo(40, 150);
  g.lineTo(50, 122);
  g.lineTo(64, 178);
  g.lineTo(74, 150);
  g.lineTo(94, 150);
  g.stroke();
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/* Lõi ngực của X.M.A.S: lục giác sáng, bên trong là dấu X */
function coreTexture(color) {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const g = canvas.getContext('2d');
  const hex = (r) => {
    g.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = Math.PI / 6 + i * Math.PI / 3;
      g[i ? 'lineTo' : 'moveTo'](128 + Math.cos(a) * r, 128 + Math.sin(a) * r);
    }
    g.closePath();
  };
  hex(112);
  g.fillStyle = '#062a1c';
  g.fill();
  g.shadowColor = color;
  g.shadowBlur = 18;
  g.strokeStyle = color;
  g.lineWidth = 12;
  g.lineJoin = 'round';
  hex(100);
  g.stroke();
  g.lineWidth = 20;
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(92, 84);
  g.lineTo(164, 172);
  g.moveTo(164, 84);
  g.lineTo(92, 172);
  g.stroke();
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
  const look = Object.assign({ kind: 'tom', shell: '#dfe3ea', accent: '#1fb5b0', mark: '#e6fbf9', glow: '#5cffb0', env: 0.62 }, cfg);
  const X = look.kind === 'xmas', J = look.kind === 'jeff', I = look.kind === 'icare';

  /* Phản chiếu môi trường studio: thứ làm vật liệu trông thật */
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envMap = pmrem.fromScene(new RoomEnvironment(renderer), 0.03).texture;
  pmrem.dispose();

  const vinyl = (color, extra = {}) => new THREE.MeshPhysicalMaterial(Object.assign({ color, roughness: 0.46, clearcoat: 0.4, clearcoatRoughness: 0.32, envMap, envMapIntensity: look.env }, extra));
  const shell = vinyl(look.shell);
  const accent = vinyl(look.accent, { roughness: 0.34, clearcoat: 0.6 });
  /* Chỉ X.M.A.S dùng: viền kim loại và các chi tiết tự phát sáng */
  const chrome = new THREE.MeshPhysicalMaterial({ color: '#d5ddd9', metalness: 1, roughness: 0.2, envMap, envMapIntensity: look.env * 1.6 });
  const neon = new THREE.MeshBasicMaterial({ color: look.glow, toneMapped: false });
  const quiet = (mesh) => { mesh.castShadow = false; mesh.receiveShadow = false; return mesh; };

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

  /* X.M.A.S: thân thon, vai rộng hơn hông */
  const BODY = X ? { rx: 0.43, ry: 0.6, rz: 0.39, n: 2.5, taper: 0.3 } : { rx: 0.5, ry: 0.56, rz: 0.46, n: 2.15, taper: 0.14 };
  add(body, surfaceMesh(BODY), shell, 0, 0.6, 0);
  if (X) {
    /* Đai lưng sáng, hai đường chạy dọc sườn, lõi lục giác trên ngực */
    quiet(add(body, surfaceMesh({ ...BODY, t0: 1.78, t1: 1.83, grow: 1.006, segT: 2 }), neon, 0, 0.6, 0));
    quiet(add(body, surfaceMesh({ ...BODY, t0: 1.86, t1: 2.3, grow: 1.004, segT: 12 }), vinyl('#12382a', { roughness: 0.3, clearcoat: 0.8 }), 0, 0.6, 0));
    [1, -1].forEach((side) => {
      quiet(add(body, surfaceMesh({ ...BODY, t0: 0.9, t1: 1.74, p0: side * 1.02, p1: side * 1.08, grow: 1.006, segT: 30, segP: 2 }), neon, 0, 0.6, 0));
    });
    quiet(add(body, surfaceMesh({ ...BODY, t0: 0.98, t1: 1.6, p0: -0.36, p1: 0.36, grow: 1.012, segT: 30, segP: 30 }),
      new THREE.MeshBasicMaterial({ map: coreTexture(look.glow), transparent: true, alphaTest: 0.4, toneMapped: false }), 0, 0.6, 0));
    /* Cổ áo kim loại có vòng sáng */
    const collar = add(body, new THREE.TorusGeometry(0.33, 0.05, 20, 64), chrome, 0, 1.14, 0);
    collar.rotation.x = Math.PI / 2;
    collar.scale.set(1, 0.86, 1);
    const collarGlow = quiet(add(body, new THREE.TorusGeometry(0.36, 0.014, 12, 64), neon, 0, 1.17, 0));
    collarGlow.rotation.x = Math.PI / 2;
    collarGlow.scale.set(1, 0.86, 1);
  } else if (J) {
    /* J.E.F.F: áo bếp hai hàng cúc, đai đỏ, tạp dề sẫm phía trước, khăn cổ đỏ thắt nút */
    quiet(add(body, surfaceMesh({ ...BODY, t0: 0.95, t1: 1.7, p0: -0.7, p1: 0.7, grow: 1.012, segT: 30, segP: 40 }),
      vinyl('#ffffff', { map: jacketTexture(look.accent), transparent: true, alphaTest: 0.5, roughness: 0.4 }), 0, 0.6, 0));
    quiet(add(body, surfaceMesh({ ...BODY, t0: 1.7, t1: 1.8, grow: 1.006, segT: 3 }), accent, 0, 0.6, 0));
    quiet(add(body, surfaceMesh({ ...BODY, t0: 1.8, t1: 2.6, p0: -1.0, p1: 1.0, grow: 1.008, segT: 20, segP: 40 }), vinyl('#2b2420', { roughness: 0.6, clearcoat: 0.1 }), 0, 0.6, 0));
    const scarf = add(body, new THREE.TorusGeometry(0.33, 0.075, 20, 64), accent, 0, 1.13, 0);
    scarf.rotation.x = Math.PI / 2;
    scarf.scale.set(1, 0.9, 1);
    [1, -1].forEach((side) => {
      const tail = add(body, new THREE.ConeGeometry(0.075, 0.24, 20), accent, side * 0.075, 0.99, 0.37);
      tail.rotation.set(0.25, 0, side * 0.5);
    });
    add(body, new THREE.SphereGeometry(0.07, 20, 14), accent, 0, 1.09, 0.39);
  } else if (I) {
    /* I.C.A.R.E: áo blouse có cổ chữ V, túi ngực, đường nhịp tim; ống nghe vắt quanh cổ */
    quiet(add(body, surfaceMesh({ ...BODY, t0: 0.95, t1: 1.9, p0: -0.7, p1: 0.7, grow: 1.012, segT: 30, segP: 40 }),
      vinyl('#ffffff', { map: coatTexture(look.accent), transparent: true, alphaTest: 0.5, roughness: 0.4 }), 0, 0.6, 0));
    const tube = vinyl('#33415c', { roughness: 0.55, clearcoat: 0.2 });
    const neck = add(body, new THREE.TorusGeometry(0.34, 0.032, 16, 64), tube, 0, 1.13, 0);
    neck.rotation.x = Math.PI / 2;
    neck.scale.set(1, 0.9, 1);
    const hose = (points) => add(body, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(([x, y, z]) => new THREE.Vector3(x, y, z))), 40, 0.026, 12), tube);
    hose([[0.27, 1.12, 0.17], [0.25, 0.98, 0.385], [0.16, 0.8, 0.475], [0.03, 0.67, 0.505]]);
    hose([[-0.27, 1.12, 0.17], [-0.24, 1.0, 0.375], [-0.2, 0.9, 0.44]]);
    const piece = add(body, new THREE.CylinderGeometry(0.075, 0.075, 0.035, 40), chrome, 0.01, 0.635, 0.512);
    piece.rotation.x = Math.PI / 2 - 0.06;
    quiet(add(body, new THREE.CircleGeometry(0.05, 32), accent, 0.01, 0.634, 0.532)).rotation.x = -0.06;
    add(body, new THREE.SphereGeometry(0.04, 20, 14), chrome, -0.2, 0.89, 0.445);
  } else {
    add(body, surfaceMesh({ ...BODY, t0: 1.72, t1: 1.745, grow: 1.004, segT: 2 }), new THREE.MeshStandardMaterial({ color: '#1b2f6b', roughness: 0.5 }), 0, 0.6, 0).castShadow = false;
    const chest = add(body, surfaceMesh({ ...BODY, t0: 1.32, t1: 2.5, p0: -0.74, p1: 0.74, grow: 1.012, segT: 40, segP: 50 }),
      vinyl('#ffffff', { map: chestTexture(look.accent, look.mark), transparent: true, alphaTest: 0.5, roughness: 0.32, clearcoat: 0.7 }), 0, 0.6, 0);
    chest.castShadow = false;
  }

  /* Tay hình giọt nước */
  const teardrop = [];
  for (let i = 0; i <= 48; i++) {
    const s = i / 48;
    teardrop.push(new THREE.Vector2(Math.max(0.0001, 0.185 * Math.pow(Math.sin(Math.PI * Math.pow(s, 0.72)), 0.72)), -s * 0.68));
  }
  const armGeo = new THREE.LatheGeometry(teardrop, 64);
  armGeo.scale(X ? 0.8 : 1, 1, X ? 0.6 : 0.72);
  const capGeo = new THREE.SphereGeometry(0.21, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2);
  function arm(side) {
    const pivot = new THREE.Group();
    pivot.position.set(side * (X ? 0.5 : 0.45), X ? 0.98 : 0.94, 0);
    body.add(pivot);
    add(pivot, armGeo, shell, side * 0.03, 0, 0);
    if (J && side === 1) {
      /* Xẻng lật cầm ở tay: vẫy tay là vẫy xẻng */
      add(pivot, new THREE.CylinderGeometry(0.024, 0.024, 0.26, 16), vinyl('#5a3a22', { roughness: 0.7 }), side * 0.03, -0.72, 0.07);
      add(pivot, new THREE.BoxGeometry(0.16, 0.18, 0.02), chrome, side * 0.03, -0.91, 0.07);
    }
    if (X) {
      /* Giáp vai: chỏm trắng, viền kim loại, đường sáng xanh */
      const cap = add(pivot, capGeo, shell, side * 0.04, -0.06, 0);
      cap.scale.set(1, 0.7, 0.86);
      const trim = add(pivot, new THREE.TorusGeometry(0.21, 0.018, 12, 48), chrome, side * 0.04, -0.06, 0);
      trim.rotation.x = Math.PI / 2;
      trim.scale.set(1, 0.86, 1);
      const line = quiet(add(pivot, new THREE.TorusGeometry(0.19, 0.01, 8, 48), neon, side * 0.04, -0.1, 0));
      line.rotation.x = Math.PI / 2;
      line.scale.set(1, 0.86, 1);
    }
    return pivot;
  }
  const armL = arm(1), armR = arm(-1);

  const head = new THREE.Group();
  head.position.y = X ? 1.14 : 1.08;
  body.add(head);
  const headY = 0.5;
  const HEAD = X ? { rx: 0.68, ry: 0.53, rz: 0.58, n: 2.9 } : { rx: 0.74, ry: 0.57, rz: 0.62, n: 2.5 };
  add(head, surfaceMesh(HEAD), shell, 0, headY, 0);

  /* X.M.A.S: vòng sáng lơ lửng trên đầu và vòng quỹ đạo quanh thân, quay chậm */
  let halo = null, orbit = null;
  if (X) {
    halo = new THREE.Group();
    halo.position.set(0, headY + 0.74, -0.04);
    head.add(halo);
    const ring = quiet(add(halo, new THREE.TorusGeometry(0.4, 0.022, 14, 96), neon));
    ring.rotation.x = Math.PI / 2;
    const inner = add(halo, new THREE.TorusGeometry(0.33, 0.012, 10, 96), chrome);
    inner.rotation.x = Math.PI / 2;
    [0, 1, 2].forEach((i) => {
      const a = i * Math.PI * 2 / 3;
      quiet(add(halo, new THREE.SphereGeometry(0.035, 16, 12), neon, Math.cos(a) * 0.4, 0, Math.sin(a) * 0.4));
    });
    orbit = new THREE.Group();
    orbit.position.y = 0.46;
    orbit.rotation.z = 0.22;
    body.add(orbit);
    const path = quiet(add(orbit, new THREE.TorusGeometry(0.7, 0.008, 8, 120), neon));
    path.rotation.x = Math.PI / 2;
    quiet(add(orbit, new THREE.SphereGeometry(0.04, 16, 12), neon, 0.7, 0, 0));
    quiet(add(orbit, new THREE.SphereGeometry(0.026, 16, 12), neon, -0.7, 0, 0));
    /* Sống đầu: một dải sáng mảnh chạy từ trán ra sau */
    quiet(add(head, surfaceMesh({ ...HEAD, t0: 0.12, t1: 0.86, p0: -0.05, p1: 0.05, grow: 1.006, segT: 30, segP: 2 }), neon, 0, headY, 0));
  } else if (J) {
    /* Mũ bếp: vành thẳng, chóp phồng nhiều múi, đội hơi lệch */
    const hat = new THREE.Group();
    hat.position.set(0, headY + 0.44, -0.02);
    hat.rotation.z = -0.07;
    head.add(hat);
    add(hat, new THREE.CylinderGeometry(0.4, 0.43, 0.24, 56), shell, 0, 0.1, 0);
    quiet(add(hat, new THREE.CylinderGeometry(0.435, 0.435, 0.035, 56), accent, 0, 0.0, 0));
    const puff = add(hat, new THREE.SphereGeometry(0.44, 40, 24), shell, 0, 0.42, 0);
    puff.scale.set(1, 0.6, 1);
    for (let i = 0; i < 6; i++) {
      const a = i * Math.PI / 3;
      const lobe = add(hat, new THREE.SphereGeometry(0.24, 28, 18), shell, Math.cos(a) * 0.3, 0.4, Math.sin(a) * 0.3);
      lobe.scale.y = 0.82;
    }
  } else if (I) {
    /* Gương khám của bác sĩ: đai quanh trán, đĩa gương lệch một bên */
    add(head, surfaceMesh({ ...HEAD, t0: 0.62, t1: 0.74, grow: 1.012, segT: 4 }), vinyl('#55647f', { roughness: 0.6, clearcoat: 0.1 }), 0, headY, 0).castShadow = false;
    const pw = (v, e) => Math.sign(v) * Math.pow(Math.abs(v), e);
    const t = 0.68, p = -0.42, e = 2 / HEAD.n, h = pw(Math.sin(t), e);
    const at = new THREE.Vector3(HEAD.rx * h * pw(Math.sin(p), e), HEAD.ry * pw(Math.cos(t), e), HEAD.rz * h * pw(Math.cos(p), e));
    const out = at.clone().normalize().lerp(new THREE.Vector3(0, 0.25, 1), 0.45).normalize();
    const mirror = new THREE.Group();
    mirror.position.copy(at).addScaledVector(out, 0.1);
    mirror.position.y += headY;
    mirror.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), out);
    head.add(mirror);
    add(mirror, new THREE.CylinderGeometry(0.15, 0.15, 0.03, 48), chrome);
    add(mirror, new THREE.TorusGeometry(0.15, 0.02, 12, 48), vinyl('#55647f', { roughness: 0.5 }), 0, 0.012, 0).rotation.x = Math.PI / 2;
    quiet(add(mirror, new THREE.CylinderGeometry(0.04, 0.04, 0.04, 28), vinyl('#33415c', { roughness: 0.5 }), 0, 0.004, 0));
    /* Khớp nối gương với dây đai */
    add(mirror, new THREE.CylinderGeometry(0.03, 0.03, 0.1, 16), vinyl('#55647f', { roughness: 0.5 }), 0, -0.06, 0);
  } else {
    /* Mào trên đỉnh */
    const crest = add(head, softTrapezoid(0.6, 0.42, 0.14, 0.34, 0.07), shell, 0, headY + 0.585, -0.03);
    crest.rotation.x = -0.06;
  }

  /* Tai tròn, vây xanh, thấu kính bên trái */
  const puck = [];
  const edge = new THREE.CatmullRomCurve3([[0, -0.12], [0.16, -0.12], [0.215, -0.08], [0.225, 0], [0.215, 0.08], [0.16, 0.12], [0, 0.12]].map(([x, y]) => new THREE.Vector3(x, y, 0)));
  edge.getPoints(48).forEach((p) => puck.push(new THREE.Vector2(Math.max(0.0001, p.x), p.y)));
  const earGeo = new THREE.LatheGeometry(puck, 64);
  [1, -1].forEach((side) => {
    if (X) {
      /* Tai nghe dẹt viền kim loại, ăng-ten mảnh vuốt ra sau, đầu ăng-ten phát sáng */
      const ear = add(head, earGeo, chrome, side * 0.665, headY - 0.02, -0.02);
      ear.rotation.z = Math.PI / 2;
      ear.scale.set(0.7, 0.42, 0.7);
      const dot = quiet(add(head, new THREE.CircleGeometry(0.085, 32), neon, side * 0.722, headY - 0.02, -0.02));
      dot.rotation.y = side * Math.PI / 2;
      const blade = add(head, softTrapezoid(0.13, 0.05, 0.6, 0.04, 0.018), shell, side * 0.74, headY + 0.34, -0.12);
      blade.rotation.order = 'YXZ';
      blade.rotation.y = side * Math.PI / 2;
      blade.rotation.x = -0.42;
      blade.rotation.z = -side * 0.1;
      quiet(add(head, new THREE.SphereGeometry(0.038, 16, 12), neon, side * 0.775, headY + 0.63, -0.26));
      return;
    }
    const ear = add(head, earGeo, shell, side * 0.735, headY, -0.02);
    ear.rotation.z = Math.PI / 2;
    if (J) return;
    if (I) {
      /* Tai tròn có chấm màu nhấn, không có vây */
      const dot = quiet(add(head, new THREE.CircleGeometry(0.1, 32), accent, side * 0.857, headY, -0.02));
      dot.rotation.y = side * Math.PI / 2;
      return;
    }
    const fin = add(head, softTrapezoid(0.3, 0.17, 0.44, 0.08, 0.04), accent, side * 0.76, headY + 0.42, -0.02);
    fin.rotation.order = 'YXZ';
    fin.rotation.y = side * 0.95;
    fin.rotation.z = -side * 0.12;
  });
  if (!X && !J && !I) {
    const lens = add(head, new THREE.SphereGeometry(0.1, 40, 24), new THREE.MeshPhysicalMaterial({ color: '#060a24', roughness: 0.06, clearcoat: 1, envMap, envMapIntensity: 1.4 }), -0.925, headY, -0.02);
    lens.scale.x = 0.34;
    lens.castShadow = false;
  }

  /* Màn hình mặt: viền lõm, lớp hiển thị, lớp kính thật phía trên */
  const mask = roundedMask();
  const VISOR = { ...HEAD, t0: 0.92, t1: 2.22, p0: -1.04, p1: 1.04, segT: 60, segP: 90 };
  add(head, surfaceMesh({ ...VISOR, t0: 0.87, t1: 2.27, p0: -1.1, p1: 1.1, grow: 1.003 }),
    new THREE.MeshPhysicalMaterial({ color: '#c4ccda', roughness: 0.3, envMap, alphaMap: mask, transparent: true, alphaTest: 0.5 }), 0, headY, 0).castShadow = false;
  const screen = createScreen(X ? { glow: '#e2fff0', halo: look.glow, top: '#075c3c', bottom: '#04271a', rim: look.glow } : J ? { glow: '#fff1d8', halo: look.glow, top: '#6e2c12', bottom: '#2a0f07', rim: look.glow, mustache: true } : I ? { glow: '#fff0f3', halo: look.glow, top: '#1b3a86', bottom: '#0b1a4a', rim: look.glow } : {});
  const visor = add(head, surfaceMesh({ ...VISOR, grow: 1.008 }), new THREE.MeshBasicMaterial({ map: screen.texture, transparent: true, alphaTest: 0.02, toneMapped: false }), 0, headY, 0);
  visor.castShadow = false;
  visor.receiveShadow = false;
  const glass = add(head, surfaceMesh({ ...VISOR, grow: 1.014 }), new THREE.MeshPhysicalMaterial({ color: X ? '#06321f' : J ? '#3a1608' : '#0a1a50', roughness: 0.05, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.04, envMap, envMapIntensity: 1.5, transparent: true, opacity: 0.2, alphaMap: mask, depthWrite: false }), 0, headY, 0);
  glass.castShadow = false;
  glass.receiveShadow = false;

  const hover = new THREE.Mesh(new THREE.CircleGeometry(0.34, 48), new THREE.MeshBasicMaterial({ color: X || J || I ? look.glow : '#4fdcff', transparent: true, opacity: 0.3, depthWrite: false, blending: THREE.AdditiveBlending }));
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
    /* Ngủ: gục đầu, tay buông, thở chậm */
    if (state === 'sleep') { p.hx = 0.36; p.hz = 0.1; p.lz = 0.14; p.rz = -0.14; p.bob = -0.05 + Math.sin(t * 0.9) * 0.025; }
    if (talking && state === 'idle') { p.lz = 0.55 + Math.sin(t * 5) * 0.16; p.hx = Math.sin(t * 7) * 0.03; }
    return p;
  }
  const AUTO_FACE = { sleep: 'sleepy', wave: 'happy', cheer: 'happy', dance: 'music', think: 'think', point: 'neutral', shake: 'surprised' };

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
      /* Bước thời gian âm hoặc quá dài (khung hình đầu, thẻ vừa được mở lại) làm tư thế văng đi rất xa: chặn lại */
      dt = Math.max(0, Math.min(0.1, dt || 0));
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
      /* I.C.A.R.E: quầng sáng dưới chân đập theo nhịp tim, hai nhịp liền nhau rồi nghỉ */
      if (I) {
        const beat = (t * 1.1) % 1;
        hover.material.opacity = 0.24 + 0.3 * (Math.exp(-Math.pow((beat - 0.1) * 14, 2)) + 0.7 * Math.exp(-Math.pow((beat - 0.3) * 14, 2)));
      }
      if (halo) {
        halo.rotation.y = t * 0.9;
        halo.position.y = headY + 0.74 + Math.sin(t * 1.7) * 0.018;
        orbit.rotation.y = -t * 0.6;
      }

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
