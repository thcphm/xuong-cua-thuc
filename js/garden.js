/* Sân Vườn: vườn cây 3D thu nhỏ trên mái, bấm cây để xem thông tin và tưới. */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { buildPlant } from './plants.js';

const FACTS = window.GARDEN;
const KEY = 'tp-vuon-v1';
const DAY = 864e5;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const lowPower = matchMedia('(pointer: coarse)').matches;
const $ = (id) => document.getElementById(id);
function h(tag, props, ...kids) {
  const n = document.createElement(tag);
  Object.entries(props || {}).forEach(([k, v]) => {
    if (v == null || v === false) return;
    if (k === 'class') n.className = v;
    else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
    else if (k in n) n[k] = v;
    else n.setAttribute(k, v);
  });
  n.append(...kids.flat().filter((x) => x != null && x !== false));
  return n;
}

/* Trạng thái cây lưu trong trình duyệt. Lần đầu mỗi cây có độ ẩm khác nhau để vườn có việc làm ngay. */
let store = {};
try { store = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { /* dùng tạm trong phiên */ }
FACTS.forEach((f, i) => { if (!store[f.id]) store[f.id] = { m: [0.62, 0.3, 0.75, 0.12, 0.2, 0.9, 0.5, 0.35, 0.08][i % 9], t: Date.now(), cares: 0 }; });
function save() { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) { /* bỏ qua */ } }
const moisture = (f, now = Date.now()) => Math.max(0, Math.min(1.4, store[f.id].m - (now - store[f.id].t) / (f.days * DAY)));
const stageOf = (f) => Math.min(5, 1 + Math.floor(store[f.id].cares / 3));
function statusOf(m) {
  if (m < 0.15) return { text: 'Đang khát, cần tưới ngay', cls: 'bad' };
  if (m < 0.4) return { text: 'Đất hơi khô', cls: 'warn' };
  if (m <= 1) return { text: 'Đủ ẩm', cls: 'ok' };
  return { text: 'Thừa nước, đừng tưới thêm', cls: 'bad' };
}
function nextWater(f, m) {
  const days = (m - 0.4) * f.days;
  if (days <= 0) return 'Nên tưới hôm nay.';
  return days < 1 ? 'Nên tưới lại sau khoảng ' + Math.max(1, Math.round(days * 24)) + ' giờ.' : 'Nên tưới lại sau khoảng ' + Math.round(days) + ' ngày.';
}

let built = false, renderer, scene, camera, controls, plants = [], selected = -1, hovered = -1;
let sun, hemi, ring, can, drops, dropState = [], pour = 0, pourIdx = -1, night = 0, lightsGroup;
const look = new THREE.Vector3(0, 1.2, 0);
const wantLook = look.clone(), wantDist = { v: 9.5 };
const ray = new THREE.Raycaster(), pointer = new THREE.Vector2();

function woodTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const g = c.getContext('2d');
  for (let i = 0; i < 8; i++) {
    g.fillStyle = ['#5e4632', '#654b35', '#58412e', '#6a4f38'][i % 4];
    g.fillRect(0, i * 64, 512, 64);
    g.strokeStyle = 'rgba(25,15,8,.28)';
    for (let k = 0; k < 9; k++) {
      g.beginPath();
      const y = i * 64 + Math.random() * 64;
      g.moveTo(0, y);
      g.bezierCurveTo(170, y + Math.random() * 14 - 7, 340, y + Math.random() * 14 - 7, 512, y);
      g.stroke();
    }
    g.fillStyle = 'rgba(0,0,0,.6)';
    g.fillRect(0, i * 64, 512, 3);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
function buildCan() {
  const group = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({ color: '#7fb6c9', metalness: 0.65, roughness: 0.28 });
  const body = new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [0.26, 0], [0.29, 0.03], [0.24, 0.42], [0.2, 0.44], [0, 0.42]].map(([x, y]) => new THREE.Vector2(x, y)), 32), metal);
  const spout = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0.22, 0.1, 0), new THREE.Vector3(0.5, 0.26, 0), new THREE.Vector3(0.74, 0.54, 0)]), 16, 0.04, 10), metal);
  const head = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.05, 0.09, 18), metal);
  head.position.set(0.77, 0.58, 0);
  head.rotation.z = -0.75;
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.21, 0.025, 10, 28, Math.PI * 1.2), metal);
  handle.position.set(-0.13, 0.38, 0);
  handle.rotation.z = 0.5;
  group.add(body, spout, head, handle);
  group.visible = false;
  return group;
}
function build() {
  built = true;
  const canvas = $('gardenCanvas');
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(lowPower ? 1.5 : 2, devicePixelRatio));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(34, 1, 0.1, 120);
  camera.position.set(3.2, 5.4, 8.4);
  controls = new OrbitControls(camera, canvas);
  controls.enablePan = false;
  controls.enableDamping = true;
  controls.minDistance = 3;
  controls.maxDistance = 13;
  controls.minPolarAngle = 0.7;
  controls.maxPolarAngle = 1.48;
  controls.target.copy(look);

  hemi = new THREE.HemisphereLight('#bcd4ff', '#2a2318', 1.2);
  sun = new THREE.DirectionalLight('#ffe2bc', 2.2);
  sun.position.set(-6, 10, 5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(lowPower ? 1024 : 2048, lowPower ? 1024 : 2048);
  Object.assign(sun.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: 1, far: 30 });
  sun.shadow.bias = -0.0008;
  scene.add(hemi, sun);

  /* Bầu trời đổi theo giờ thật */
  const clock = new Date(), hour = clock.getHours() + clock.getMinutes() / 60;
  const step = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const day = step(5.2, 7.2, hour) * (1 - step(17.2, 18.8, hour));
  night = 1 - day;
  const top = new THREE.Color('#091329').lerp(new THREE.Color('#6da9df'), day), low = new THREE.Color('#1c2a4c').lerp(new THREE.Color('#f3d9b4'), day);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(70, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, uniforms: { top: { value: top }, low: { value: low } },
    vertexShader: 'varying float v; void main(){ v = normalize(position).y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 top,low; varying float v; void main(){ gl_FragColor = vec4(mix(low, top, pow(clamp(v*1.5,0.0,1.0),0.65)),1.0);\n#include <colorspace_fragment>\n }'
  }));
  scene.add(dome);
  hemi.intensity = 0.45 + day * 1.25;
  sun.intensity = 0.55 + day * 2.4;
  sun.color.set('#a9c1ff').lerp(new THREE.Color('#ffe9c9'), day);
  renderer.toneMappingExposure = 0.95 + night * 0.25;

  if (night > 0.3) {
    const n = 600, arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { const a = Math.random() * 6.283, e = Math.random() * 1.45 + 0.08, r = 60; arr[i * 3] = Math.cos(a) * Math.cos(e) * r; arr[i * 3 + 1] = Math.sin(e) * r; arr[i * 3 + 2] = Math.sin(a) * Math.cos(e) * r; }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: '#dbe6ff', size: 0.16, transparent: true, opacity: night * 0.85, depthWrite: false })));
  }

  /* Sàn, bậc đặt chậu, lan can */
  const wood = woodTexture();
  const deckTex = wood.clone(); deckTex.repeat.set(3, 3); deckTex.needsUpdate = true;
  const deck = new THREE.Mesh(new THREE.BoxGeometry(12, 0.2, 10), new THREE.MeshStandardMaterial({ map: deckTex, roughness: 0.8 }));
  deck.position.y = -0.1;
  deck.receiveShadow = true;
  scene.add(deck);
  const stepTex = wood.clone(); stepTex.repeat.set(2, 0.5); stepTex.needsUpdate = true;
  const stepMat = new THREE.MeshStandardMaterial({ map: stepTex, roughness: 0.72 });
  [[0.3, 0.3, 0.6, 0], [0.6, 0.6, -1.65, 0]].forEach(([, hgt, z]) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(6.6, hgt, 1.9), stepMat);
    m.position.set(0, hgt / 2, z);
    m.castShadow = m.receiveShadow = true;
    scene.add(m);
  });
  const rail = new THREE.MeshStandardMaterial({ color: '#2b3442', roughness: 0.4, metalness: 0.7 });
  for (let i = -6; i <= 6; i += 1.2) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.1, 10), rail);
    p.position.set(i, 0.55, -4.9);
    p.castShadow = true;
    scene.add(p);
  }
  const bar = new THREE.Mesh(new THREE.BoxGeometry(12, 0.06, 0.08), rail);
  bar.position.set(0, 1.12, -4.9);
  scene.add(bar);

  /* Thành phố phía xa */
  const skyline = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: new THREE.Color('#0e1730').lerp(new THREE.Color('#8ca0b8'), day) }), 46);
  const d = new THREE.Object3D();
  for (let i = 0; i < 46; i++) { const a = -2.5 + i / 45 * 1.9 * Math.PI * 0.62, r = 34 + (i * 7 % 9), hgt = 5 + (i * 13 % 17); d.position.set(Math.sin(a) * r, hgt / 2 - 8, -Math.cos(a) * r * 0.9 - 6); d.scale.set(3 + i % 3, hgt, 3); d.updateMatrix(); skyline.setMatrixAt(i, d.matrix); }
  scene.add(skyline);

  /* Dây đèn */
  lightsGroup = new THREE.Group();
  [[-5.8, -4.6, 5.8, -4.6, 3.3], [-5.8, -4.6, -5.8, 3.4, 3.1]].forEach(([x0, z0, x1, z1, y0]) => {
    const count = 22;
    const beads = new THREE.InstancedMesh(new THREE.SphereGeometry(0.06, 10, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffd28a').multiplyScalar(0.7 + night * 1.5), toneMapped: false }), count);
    for (let i = 0; i < count; i++) { const t = i / (count - 1); d.position.set(x0 + (x1 - x0) * t, y0 - Math.sin(t * Math.PI) * 0.7, z0 + (z1 - z0) * t); d.scale.setScalar(1); d.updateMatrix(); beads.setMatrixAt(i, d.matrix); }
    lightsGroup.add(beads);
  });
  [[-5.8, 3.1, -4.6], [5.8, 3.1, -4.6], [-5.8, 3, 3.4]].forEach(([x, top2, z]) => { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, top2 + 0.1, 10), rail); p.position.set(x, top2 / 2, z); lightsGroup.add(p); });
  if (night > 0.3) { const pl = new THREE.PointLight('#ffcf8a', 24 * night, 13, 1.7); pl.position.set(0, 2.6, -2.5); lightsGroup.add(pl); }
  scene.add(lightsGroup);

  /* Chín chậu cây xếp ba bậc */
  const LAYOUT = { mai: [-2.15, 0.6, -1.65], 'hoa-giay': [0, 0.6, -1.65], si: [2.15, 0.6, -1.65], lan: [-2.15, 0.3, 0.6], 'duong-xi': [0, 0.3, 0.6], 'luoi-ho': [2.15, 0.3, 0.6], 'sen-da': [-2.15, 0, 2.7], 'tai-tho': [0, 0, 2.7], 'hung-que': [2.15, 0, 2.7] };
  const SIZES = { mai: 1.12, 'hoa-giay': 1.1, si: 1.1, 'duong-xi': 1, lan: 1, 'luoi-ho': 1, 'sen-da': 1.15, 'tai-tho': 1.15, 'hung-que': 1.15 };
  FACTS.forEach((f, i) => {
    const plant = buildPlant(f.id, i + 3);
    const [x, y, z] = LAYOUT[f.id];
    plant.group.position.set(x, y, z);
    plant.group.scale.setScalar(SIZES[f.id]);
    const hit = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 2.4, 10), new THREE.MeshBasicMaterial());
    hit.position.y = 1.15;
    hit.visible = false;
    hit.userData.idx = i;
    plant.group.add(hit);
    plant.hit = hit;
    plant.fact = f;
    plant.droop = 0; plant.grow = 0.82 + stageOf(f) * 0.06; plant.wet = 0;
    plant.foliage.scale.setScalar(plant.grow);
    scene.add(plant.group);
    plants.push(plant);
  });
  ring = new THREE.Mesh(new THREE.RingGeometry(0.72, 0.78, 56), new THREE.MeshBasicMaterial({ color: '#b8f28f', toneMapped: false, transparent: true, side: THREE.DoubleSide }));
  ring.rotation.x = -Math.PI / 2;
  ring.visible = false;
  scene.add(ring);

  can = buildCan();
  can.scale.setScalar(0.9);
  scene.add(can);
  const n = reduceMotion ? 1 : 150;
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  drops = new THREE.Points(g, new THREE.PointsMaterial({ color: '#a9dcff', size: 0.05, transparent: true, opacity: 0.9, depthWrite: false }));
  drops.visible = false;
  drops.frustumCulled = false;
  scene.add(drops);
  dropState = Array.from({ length: n }, () => ({ life: 0, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0 }));

  /* Chuột và chạm */
  const setPointer = (e) => { const r = canvas.getBoundingClientRect(); pointer.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); };
  const pick = () => { ray.setFromCamera(pointer, camera); const hit = ray.intersectObjects(plants.map((p) => p.hit), false)[0]; return hit ? hit.object.userData.idx : -1; };
  let down = null;
  canvas.addEventListener('pointerdown', (e) => { down = [e.clientX, e.clientY]; });
  canvas.addEventListener('pointerup', (e) => {
    if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 6) return;
    setPointer(e);
    const i = pick();
    if (i >= 0) select(i);
  });
  const tip = $('gardenTip');
  canvas.addEventListener('pointermove', (e) => {
    setPointer(e);
    hovered = e.buttons ? -1 : pick();
    canvas.style.cursor = hovered >= 0 ? 'pointer' : 'grab';
    tip.hidden = hovered < 0;
    if (hovered >= 0) { tip.textContent = FACTS[hovered].name; tip.style.transform = 'translate(' + (e.offsetX + 16) + 'px,' + (e.offsetY + 14) + 'px)'; }
  });
  canvas.addEventListener('pointerleave', () => { hovered = -1; tip.hidden = true; });
  new ResizeObserver(fit).observe(canvas.parentElement);
  fit();
  requestAnimationFrame(loop);
}
function fit() {
  const c = $('gardenCanvas'), w = c.clientWidth, hgt = c.clientHeight;
  if (!w || !hgt) return;
  renderer.setSize(w, hgt, false);
  camera.aspect = w / hgt;
  /* Panel thông tin nằm bên phải, dịch vườn sang vùng trống */
  if (innerWidth > 960) camera.setViewOffset(w, hgt, 190, 0, w, hgt); else camera.clearViewOffset();
  camera.updateProjectionMatrix();
}

let last = performance.now();
function loop(now) {
  requestAnimationFrame(loop);
  if (document.body.dataset.room !== 'vuon' || document.hidden) { last = now; return; }
  const dt = Math.min(0.05, (now - last) / 1000), t = now / 1000;
  last = now;
  const rate = 1 - Math.exp(-dt * 4);
  controls.target.lerp(wantLook, rate);
  if (wantDist.v) {
    const off = camera.position.clone().sub(controls.target), len = off.length();
    camera.position.copy(controls.target).addScaledVector(off, (len + (wantDist.v - len) * rate) / len);
    if (Math.abs(len - wantDist.v) < 0.03) wantDist.v = 0;
  }
  controls.update();
  plants.forEach((p) => {
    const m = moisture(p.fact), thirst = Math.max(0, Math.min(1, (0.36 - m) / 0.36));
    p.droop += (thirst * p.stiff - p.droop) * (1 - Math.exp(-dt * 2.5));
    p.uniforms.uDroop.value = p.droop;
    p.uniforms.uDry.value = thirst * thirst * 0.55;
    p.uniforms.uTime.value = t;
    p.uniforms.uSway.value = reduceMotion ? 0 : 1;
    const goal = 0.82 + stageOf(p.fact) * 0.06;
    p.grow += (goal - p.grow) * (1 - Math.exp(-dt * 3));
    p.foliage.scale.setScalar(p.grow);
    p.wet += (Math.min(1, m) - p.wet) * (1 - Math.exp(-dt * 3));
    p.soil.material.color.set('#7a5a3c').lerp(new THREE.Color('#2a1a10'), p.wet);
  });
  if (selected >= 0) {
    const g = plants[selected].group;
    ring.visible = true;
    ring.position.set(g.position.x, g.position.y + 0.015, g.position.z);
    ring.material.opacity = 0.6 + Math.sin(t * 3) * 0.25;
  }
  runPour(dt);
  renderer.render(scene, camera);
}
function runPour(dt) {
  if (pour <= 0) { can.visible = false; if (!dropState.some((s) => s.life > 0)) drops.visible = false; }
  const target = pourIdx >= 0 ? plants[pourIdx].group : null;
  const pos = drops.geometry.attributes.position;
  let origin = null;
  if (pour > 0 && target) {
    pour -= dt;
    const total = 1.9, age = total - pour;
    const tilt = Math.min(1, age / 0.35) * Math.min(1, pour / 0.3);
    can.visible = true;
    can.position.set(target.position.x - 0.92, target.position.y + 1.25 + Math.max(0, (1 - age / 0.3)) * 0.5, target.position.z + 0.05);
    can.rotation.z = -0.72 * tilt;
    can.updateMatrixWorld();
    origin = new THREE.Vector3(0.82, 0.6, 0).applyMatrix4(can.matrixWorld);
    drops.visible = true;
  }
  dropState.forEach((s, i) => {
    if (s.life <= 0 && origin && Math.random() < 0.55) {
      s.life = 1;
      s.x = origin.x + (Math.random() - 0.5) * 0.09; s.y = origin.y; s.z = origin.z + (Math.random() - 0.5) * 0.09;
      s.vx = 0.55 + Math.random() * 0.5; s.vy = -0.6 - Math.random() * 0.6; s.vz = (Math.random() - 0.5) * 0.5;
    }
    if (s.life > 0) {
      s.vy -= 7.5 * dt;
      s.x += s.vx * dt; s.y += s.vy * dt; s.z += s.vz * dt;
      if (target && s.y < target.position.y + 0.42) s.life = 0;
    }
    pos.setXYZ(i, s.x, s.life > 0 ? s.y : -50, s.z);
  });
  pos.needsUpdate = true;
}

/* Tưới và thông tin cây */
function water(i) {
  const f = FACTS[i], m = moisture(f), st = store[f.id];
  let note;
  if (m > 1) { note = 'Đất đã ướt. ' + f.name + ' tưới thêm dễ úng rễ.'; }
  else if (m >= 0.75) note = 'Đất còn ẩm, chưa cần tưới đâu.';
  else if (m < 0.05) { st.cares += 1; note = 'Cây vừa qua cơn khát. Lần sau tưới sớm hơn nhé.'; }
  else { st.cares += 1; note = 'Tưới đúng lúc. Cây khỏe hơn rồi.'; }
  st.m = Math.min(1.4, m + (m >= 0.75 ? 0.3 : 0.6));
  st.t = Date.now();
  save();
  if (built && !reduceMotion) { pour = 1.9; pourIdx = i; }
  return note;
}
function renderList() {
  $('gardenList').replaceChildren(...FACTS.map((f, i) => {
    const s = statusOf(moisture(f));
    return h('button', { type: 'button', class: 'garden-chip ' + s.cls + (i === selected ? ' on' : ''), 'aria-pressed': String(i === selected), onclick: () => select(i) }, f.name);
  }));
  const thirsty = FACTS.filter((f) => moisture(f) < 0.4).length;
  $('gardenSummary').textContent = thirsty ? thirsty + ' cây đang cần nước' : 'Cả vườn đủ nước';
  $('gardenAll').hidden = !thirsty;
}
async function photo(f, holder) {
  const key = 'tp-vuon-img:' + f.wiki;
  let info = null;
  try { const hit = JSON.parse(localStorage.getItem(key) || 'null'); if (hit && hit.until > Date.now()) info = hit.info; } catch (e) { /* gọi mạng */ }
  try {
    if (!info) {
      const res = await fetch('https://en.wikipedia.org/api/rest_v1/page/summary/' + f.wiki);
      if (!res.ok) throw new Error(String(res.status));
      const d = await res.json();
      info = { src: d.thumbnail && d.thumbnail.source, page: d.content_urls.desktop.page };
      try { localStorage.setItem(key, JSON.stringify({ until: Date.now() + 30 * DAY, info })); } catch (e) { /* bỏ qua */ }
    }
    if (!info.src || !holder.isConnected) return;
    holder.replaceChildren(h('img', { src: info.src, alt: 'Ảnh ' + f.name, loading: 'lazy' }), h('a', { href: info.page, target: '_blank', rel: 'noopener' }, 'Ảnh và giấy phép trên Wikipedia'));
  } catch (e) { holder.remove(); }
}
function panel(i, note) {
  const f = FACTS[i], m = moisture(f), s = statusOf(m), stage = stageOf(f);
  const pic = h('figure', { class: 'garden-photo' });
  $('gardenPanel').replaceChildren(
    h('h2', null, f.name),
    h('p', { class: 'garden-sci' }, f.sci),
    pic,
    h('div', { class: 'garden-care' },
      h('div', { class: 'garden-meter', role: 'img', 'aria-label': 'Độ ẩm đất ' + Math.round(Math.min(1, m) * 100) + ' phần trăm' }, h('i', { class: s.cls, style: 'width:' + Math.round(Math.min(1, m) * 100) + '%' })),
      h('p', { class: 'garden-state ' + s.cls }, s.text),
      h('p', { class: 'garden-next' }, nextWater(f, m) + ' Giai đoạn phát triển ' + stage + '/5.'),
      h('button', { type: 'button', class: 'play-btn garden-water', onclick: () => { const text = water(i); panel(i, text); renderList(); } }, 'Tưới cây'),
      note ? h('p', { class: 'garden-note', role: 'status' }, note) : null),
    h('dl', { class: 'garden-facts' },
      h('dt', null, 'Tên thường gọi'), h('dd', null, f.name + ', ' + f.other),
      h('dt', null, 'Tên khoa học'), h('dd', null, h('i', null, f.sci)),
      h('dt', null, 'Họ thực vật'), h('dd', null, f.family),
      h('dt', null, 'Nguồn gốc'), h('dd', null, f.origin)),
    h('h3', null, 'Đặc điểm'),
    h('ul', { class: 'garden-traits' }, f.traits.map((x) => h('li', null, x))),
    h('h3', null, 'Cách chăm'),
    h('p', { class: 'garden-tend' }, f.care)
  );
  photo(f, pic);
}
function select(i) {
  selected = i;
  panel(i);
  renderList();
  if (built) {
    const g = plants[i].group;
    wantLook.set(g.position.x, g.position.y + 0.95, g.position.z);
    wantDist.v = 6.2;
  }
}
function waterAll() {
  let n = 0;
  FACTS.forEach((f) => { if (moisture(f) < 0.4) { water(FACTS.indexOf(f)); n++; } });
  pour = 0;
  renderList();
  if (selected >= 0) panel(selected, 'Đã tưới ' + n + ' cây đang khát.');
}

function enter() {
  if (!built) { build(); select(FACTS.findIndex((f) => moisture(f) < 0.15) >= 0 ? FACTS.findIndex((f) => moisture(f) < 0.15) : 0); }
  fit();
}
$('gardenAll').addEventListener('click', waterAll);
document.addEventListener('tp:room', (e) => { if (e.detail === 'vuon') enter(); });
if (document.body.dataset.room === 'vuon') enter();
setInterval(() => { if (built && document.body.dataset.room === 'vuon' && selected >= 0 && pour <= 0) renderList(); }, 30000);
