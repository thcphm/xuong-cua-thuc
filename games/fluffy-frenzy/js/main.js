// ================= Fluffy Frenzy – ban goc, choi offline voi bot =================
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { THREE, V3, rand, randInt, pick, hyp, lerpAngle, toon, part, put, GRAD } from './core.js';
import { ANIMALS, COLLARS, makeAnimal, animateCritter } from './characters.js';
import { World, R0, FLAG_SPOTS, BASES } from './maps.js';
import { LEVELS as MAP_LIST } from './levels.js';

const $ = s => document.querySelector(s);

// ---------- Renderer / scene / anh sang ----------
const renderer = new THREE.WebGLRenderer({ canvas:$('#c'), antialias:true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1.0;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 600);
// ---- hau ky: glow + chinh mau + mo nhe ria khung (tilt-shift) + vignette ----
const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(1, 1, { type:THREE.HalfFloatType, samples:4 }));
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.1, 0.3, 2.0); composer.addPass(bloom);
composer.addPass(new OutputPass());
const grade = new ShaderPass({
  uniforms:{ tDiffuse:{ value:null }, uRes:{ value:new THREE.Vector2(1, 1) }, uTilt:{ value:0 } },
  vertexShader:'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader:`uniform sampler2D tDiffuse; uniform vec2 uRes; uniform float uTilt; varying vec2 vUv;
    void main(){
      float band = smoothstep(0.3, 0.55, abs(vUv.y - 0.5)) * uTilt;
      vec2 px = band * 1.3 / uRes;
      vec4 c = texture2D(tDiffuse, vUv) * 0.28;
      c += texture2D(tDiffuse, vUv + vec2( px.x,  px.y)) * 0.18; c += texture2D(tDiffuse, vUv + vec2(-px.x,  px.y)) * 0.18;
      c += texture2D(tDiffuse, vUv + vec2( px.x, -px.y)) * 0.18; c += texture2D(tDiffuse, vUv + vec2(-px.x, -px.y)) * 0.18;
      float l = dot(c.rgb, vec3(0.299, 0.587, 0.114));
      c.rgb = mix(vec3(l), c.rgb, 1.08);
      c.rgb = (c.rgb - 0.5) * 1.04 + 0.5;
      vec2 d = vUv - 0.5; c.rgb *= 1.0 - dot(d, d) * 0.28;
      gl_FragColor = vec4(c.rgb, 1.0);
    }`,
});
composer.addPass(grade);
function resize() {
  const pr = renderer.getPixelRatio();
  renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  composer.setPixelRatio(pr); composer.setSize(innerWidth, innerHeight);
  grade.uniforms.uRes.value.set(innerWidth * pr, innerHeight * pr);
}
addEventListener('resize', resize); resize();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.45;

const hemi = new THREE.HemisphereLight(0xffffff, 0x9a7a5a, 1.0); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff4e0, 2.4);
sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left:-22, right:22, top:22, bottom:-22, near:1, far:100 });
sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.025; sun.shadow.radius = 1.4;
scene.add(sun, sun.target);
const rim = new THREE.DirectionalLight(0xfff1d6, 1.0); scene.add(rim, rim.target);
const STAGE_BG = new THREE.Color('#3a1210');

const world = new World(scene, { sun, hemi, rim });

// ---------- Am thanh ----------
const Sound = {
  ac:null, muted:(() => { try { return localStorage.getItem('ff-muted') === '1'; } catch (e) { return false; } })(),
  toggle() { this.muted = !this.muted; try { localStorage.setItem('ff-muted', this.muted ? '1' : '0'); } catch (e) {} updateMuteBtn(); },
  init() { if (!this.ac) try { this.ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} if (this.ac && this.ac.state === 'suspended') this.ac.resume(); },
  tone(f, d, type = 'square', v = 0.06, slide = 0) {
    if (!this.ac || this.muted) return; const t = this.ac.currentTime, o = this.ac.createOscillator(), g = this.ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t + d);
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d); o.connect(g); g.connect(this.ac.destination); o.start(t); o.stop(t + d);
  },
  hit()   { this.tone(200, 0.12, 'square', 0.07, -140); },
  heavy() { this.tone(130, 0.25, 'sawtooth', 0.08, -90); },
  block() { this.tone(620, 0.07, 'triangle', 0.06); },
  whoosh(){ this.tone(800, 0.07, 'triangle', 0.025, -500); },
  jump()  { this.tone(420, 0.09, 'triangle', 0.04, 260); },
  grab()  { this.tone(300, 0.1, 'square', 0.05, 120); },
  throw() { this.tone(500, 0.25, 'triangle', 0.06, -380); },
  pickup(){ this.tone(660, 0.08, 'square', 0.04); setTimeout(() => this.tone(990, 0.1, 'square', 0.04), 70); },
  out()   { this.tone(500, 0.6, 'square', 0.06, -420); },
  boom()  { this.tone(90, 0.5, 'sawtooth', 0.09, -60); },
  boop()  { this.tone(520, 0.06, 'triangle', 0.05); },
  splash(){ this.tone(900, 0.12, 'sine', 0.03, -600); },
  flag()  { this.tone(587, 0.1, 'square', 0.05); setTimeout(() => this.tone(880, 0.16, 'square', 0.05), 100); },
  go()    { this.tone(523, 0.1, 'square', 0.05); setTimeout(() => this.tone(784, 0.2, 'square', 0.05), 110); },
};

// ---------- Input ----------
const keys = new Set(), pressed = new Set();
function updateMuteBtn() { const b = document.querySelector('#muteBtn'); if (b) b.textContent = Sound.muted ? '🔇' : '🔊'; }
addEventListener('keydown', e => {
  if (!keys.has(e.code)) pressed.add(e.code); keys.add(e.code);
  if (e.code === 'KeyM') Sound.toggle();
  if (['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code) && game.state !== 'menu') e.preventDefault();
  Sound.init();
});
addEventListener('keyup', e => keys.delete(e.code));
addEventListener('blur', () => keys.clear());
$('#c').addEventListener('pointerdown', e => { pressed.add('Mouse' + e.button); keys.add('MouseHeld' + e.button); Sound.init(); });
addEventListener('pointerup', e => keys.delete('MouseHeld' + e.button));
addEventListener('contextmenu', e => { if (game.state !== 'menu') e.preventDefault(); });
const down = (...c) => c.some(k => keys.has(k));
const hit = (...c) => c.some(k => pressed.has(k));
const blankInput = () => ({ x:0, z:0, jump:false, punch:false, kick:false, block:false, sprint:false, grab:false, grabPress:false, interact:false, use:false, struggle:0, aim:null });
const STRUGGLE_KEYS = ['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','KeyJ','Mouse0'];

// ---------- Hieu ung hat ----------
const fx = new THREE.Group(); scene.add(fx);
const POOL = Array.from({ length:160 }, () => {
  const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.12), new THREE.MeshBasicMaterial({ color:0xffffff, transparent:true }));
  m.visible = false; fx.add(m); return { m, v:new V3(), life:0, max:1, grow:0 };
});
function burst(pos, color, n = 10, spd = 5, grow = 0, up = 2) {
  for (let i = 0; i < n; i++) {
    const p = POOL.find(q => q.life <= 0); if (!p) return;
    p.m.position.copy(pos); p.m.material.color.set(color); p.m.scale.setScalar(grow ? 2 : 1); p.m.visible = true;
    p.v.set(rand(-1, 1), rand(0, 1), rand(-1, 1)).normalize().multiplyScalar(rand(0.4, 1) * spd); p.v.y += up;
    p.life = p.max = rand(0.35, 0.7); p.grow = grow;
  }
}
function updateFx(dt) {
  for (const r of RINGS) if (r.life > 0) { r.life -= dt; const k = 1 - r.life / 0.3; r.sp.scale.setScalar((0.4 + k * 2.2) * r.size); r.sp.material.opacity = Math.max(0, 1 - k); if (r.life <= 0) r.sp.visible = false; }
  for (const p of POOL) if (p.life > 0) {
    p.life -= dt; p.v.y -= (p.grow ? 0 : 14) * dt; p.m.position.addScaledVector(p.v, dt);
    p.m.rotation.x += dt * 8; p.m.rotation.y += dt * 6;
    if (p.grow) p.m.scale.multiplyScalar(1 + p.grow * dt);
    p.m.material.opacity = Math.max(0, p.life / p.max); if (p.life <= 0) p.m.visible = false;
  }
}
const tagLayer = $('#tags');
const dmgTexts = [];
function dmgText(pos, text, color = '#ffe066') {
  const el = document.createElement('div'); el.className = 'dmg'; el.textContent = text; el.style.color = color; tagLayer.appendChild(el);
  dmgTexts.push({ el, pos:pos.clone(), life:0.9 });
}
let shake = 0, hitStop = 0;
const ringTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); g.strokeStyle = '#fff'; g.lineWidth = 10; g.beginPath(); g.arc(64, 64, 50, 0, 6.283); g.stroke(); return new THREE.CanvasTexture(c); })();
const RINGS = Array.from({ length:14 }, () => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map:ringTex, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending })); sp.visible = false; fx.add(sp); return { sp, life:0, size:1 }; });
function impactRing(pos, color, size = 1) {
  const r = RINGS.find(q => q.life <= 0); if (!r) return;
  r.sp.position.copy(pos); r.sp.material.color.set(color); r.sp.visible = true; r.life = 0.3; r.size = size; r.sp.scale.setScalar(0.3);
}
const blobTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(0,0,0,0.55)'); gr.addColorStop(0.6, 'rgba(0,0,0,0.25)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();

// ---------- Vat the theo che do (vung, co, tuong bo) ----------
const modeG = new THREE.Group(); scene.add(modeG);
const zoneG = new THREE.Group(); modeG.add(zoneG);
const zoneWall = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 2.4, 48, 1, true), new THREE.MeshBasicMaterial({ color:0xffffff, transparent:true, opacity:0.22, side:THREE.DoubleSide, depthWrite:false }));
zoneWall.position.y = 1.2; zoneG.add(zoneWall);
const zoneFloor = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 3, 48, 1, true), new THREE.MeshBasicMaterial({ color:0xffffff, transparent:true, opacity:0.35, side:THREE.DoubleSide, depthWrite:false }));
zoneFloor.scale.y = 0.05; zoneFloor.position.y = 0.05; zoneG.add(zoneFloor);
zoneG.visible = false;
// tuong nang luong khi san co lai
const barrierTex = (() => { const c = document.createElement('canvas'); c.width = 4; c.height = 128; const g = c.getContext('2d'); const gr = g.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.7, 'rgba(255,255,255,0.6)'); gr.addColorStop(1, 'rgba(255,255,255,1)'); g.fillStyle = gr; g.fillRect(0, 0, 4, 128); return new THREE.CanvasTexture(c); })();
const barrier = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 6, 128, 1, true), new THREE.MeshBasicMaterial({ color:0xff3b30, alphaMap:barrierTex, transparent:true, opacity:0.55, side:THREE.DoubleSide, depthWrite:false, blending:THREE.AdditiveBlending }));
barrier.position.y = 0.5; modeG.add(barrier); barrier.visible = false;

const FLAG_R = 2.6;
const TEAM = { red:{ vn:'Đỏ', col:'#ff5d5d', base:new V3(BASES.red[0], 0, BASES.red[1]) }, blue:{ vn:'Xanh', col:'#4dabf7', base:new V3(BASES.blue[0], 0, BASES.blue[1]) } };
const flagG = new THREE.Group(); modeG.add(flagG); flagG.visible = false;
function makeFlag(id, x, z) {
  const g = new THREE.Group(); g.position.set(x, 0, z); flagG.add(g);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 3.4, 12), new THREE.MeshStandardMaterial({ color:0xd8d8d8, metalness:0.6, roughness:0.3 })); pole.position.y = 1.7; pole.castShadow = true; g.add(pole);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.14, 14, 10), new THREE.MeshStandardMaterial({ color:0xffc93c, metalness:0.7, roughness:0.25 })); knob.position.y = 3.45; g.add(knob);
  const clothMat = new THREE.MeshStandardMaterial({ color:0xffffff, side:THREE.DoubleSide, roughness:0.8 });
  const cloth = put(g, new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.75, 10, 1), clothMat), 0.62, 2.95, 0); cloth.castShadow = true;
  const floor = new THREE.Mesh(new THREE.CylinderGeometry(FLAG_R, FLAG_R, 0.15, 48, 1, true), new THREE.MeshBasicMaterial({ color:0xffffff, transparent:true, opacity:0.5, side:THREE.DoubleSide, depthWrite:false }));
  floor.position.y = 0.05; g.add(floor);
  const disc = new THREE.Mesh(new THREE.CircleGeometry(FLAG_R, 48), new THREE.MeshBasicMaterial({ color:0xffffff, transparent:true, opacity:0.2, depthWrite:false }));
  disc.rotation.x = -Math.PI / 2; disc.position.y = 0.04; g.add(disc);
  const label = document.createElement('div'); label.className = 'flagTag'; label.textContent = id; tagLayer.appendChild(label); label.hidden = true;
  return { id, x, z, y:0, p:0, owner:null, g, cloth, clothMat, floor, disc, label };
}
const FLAGS = FLAG_SPOTS.map(([id, x, z]) => makeFlag(id, x, z));
const baseDiscs = ['red', 'blue'].map(k => {
  const b = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 0.12, 40, 1, true), new THREE.MeshBasicMaterial({ color:TEAM[k].col, transparent:true, opacity:0.6, side:THREE.DoubleSide, depthWrite:false }));
  b.position.set(TEAM[k].base.x, 0.05, TEAM[k].base.z); flagG.add(b); return b;
});

// ---------- San khau menu ----------
const STAGE = new V3(0, 0, 320);
const stage = new THREE.Group(); stage.position.copy(STAGE); scene.add(stage);
const woodTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); g.fillStyle = '#c98a4b'; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 16; i++) { g.fillStyle = i % 2 ? '#bd7f42' : '#d39558'; g.fillRect(i * 16, 0, 15, 256); }
  for (let i = 0; i < 300; i++) { g.strokeStyle = 'rgba(90,50,20,.18)'; g.beginPath(); const x = Math.random() * 256; g.moveTo(x, Math.random() * 256); g.lineTo(x + rand(-2, 2), Math.random() * 256); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 3); return t; })();
const stageFloor = new THREE.Mesh(new THREE.CylinderGeometry(9, 9, 0.4, 64), new THREE.MeshStandardMaterial({ map:woodTex, roughness:0.6 }));
stageFloor.position.y = -0.2; stageFloor.receiveShadow = true; stage.add(stageFloor);
put(stage, new THREE.Mesh(new THREE.CylinderGeometry(9, 9, 10, 48, 1, true, Math.PI - 1.5, 3.0), new THREE.MeshStandardMaterial({ color:0xb32f27, roughness:0.85, side:THREE.BackSide })), 0, 5, 0);
const archG = new THREE.Group(); archG.position.set(0, 0, -6.3); stage.add(archG);
put(archG, new THREE.Mesh(new THREE.TorusGeometry(5.2, 0.35, 16, 64, Math.PI), new THREE.MeshStandardMaterial({ color:0x9a2620, roughness:0.5 })), 0, 2.2, 0);
const bulbs = [];
for (let i = 0; i <= 18; i++) { const a = i / 18 * Math.PI; bulbs.push(put(archG, new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 10), new THREE.MeshBasicMaterial({ color:0xffe7a0 })), Math.cos(a) * 5.2, 2.2 + Math.sin(a) * 5.2, 0.35)); }
for (const s of [-1, 1]) for (let y = 0.4; y < 2.2; y += 0.6) bulbs.push(put(archG, new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 10), new THREE.MeshBasicMaterial({ color:0xffe7a0 })), s * 5.2, y, 0.35));
const ped = put(stage, new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.45, 0.35, 48), new THREE.MeshStandardMaterial({ color:0xf2c230, metalness:0.5, roughness:0.3 })), 0, 0.17, 1.6); ped.receiveShadow = true; ped.castShadow = true;
const stageLight = new THREE.SpotLight(0xffe2b0, 45, 30, 0.5, 0.7, 1.5); stageLight.position.set(0, 9, 6); stage.add(stageLight); stageLight.target.position.set(0, 0, 1); stage.add(stageLight.target);
const lineup = ANIMALS.map((a, i) => { const m = makeAnimal(a, COLLARS[(i + 1) % COLLARS.length]); stage.add(m.root); return m; });

// ---------- Vat pham ----------
const ITEM_INFO = { hammer:{ vn:'Búa cao su' }, boots:{ vn:'Giày tăng tốc' }, shield:{ vn:'Khiên năng lượng' }, bubble:{ vn:'Súng bong bóng' }, star:{ vn:'Ngôi sao' } };
function starGeo() {
  const s = new THREE.Shape();
  for (let i = 0; i < 10; i++) { const r = i % 2 ? 0.17 : 0.4, a = i / 10 * Math.PI * 2 + Math.PI / 2; i ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
  const g = new THREE.ExtrudeGeometry(s, { depth:0.14, bevelEnabled:true, bevelSize:0.03, bevelThickness:0.03, bevelSegments:2 }); g.center(); return g;
}
const shiny = c => new THREE.MeshPhysicalMaterial({ color:c, roughness:0.3, clearcoat:1 });
function makeItemMesh(type) {
  const g = new THREE.Group(), inner = new THREE.Group(); g.add(inner);
  const M = (geo, c) => { const m = new THREE.Mesh(geo, shiny(c)); m.castShadow = true; return m; };
  if (type === 'hammer') { put(inner, M(new THREE.CylinderGeometry(0.06, 0.06, 0.8, 10), 0x8b5a2b), 0, -0.1, 0); put(inner, M(new THREE.CylinderGeometry(0.22, 0.22, 0.5, 20), 0xe03131), 0, 0.35, 0, 0, 0, Math.PI / 2); }
  if (type === 'boots') { put(inner, M(new THREE.BoxGeometry(0.3, 0.42, 0.3), 0x22b8cf), 0, 0.05, -0.05); put(inner, M(new THREE.BoxGeometry(0.32, 0.16, 0.55), 0x1098ad), 0, -0.2, 0.08); put(inner, M(new THREE.ConeGeometry(0.12, 0.35, 8), 0xffffff), 0.2, 0.15, -0.1, 0, 0, -1.2); }
  if (type === 'shield') { put(inner, M(new THREE.CylinderGeometry(0.42, 0.42, 0.12, 28), 0x4dabf7), 0, 0, 0, Math.PI / 2, 0, 0); put(inner, M(starGeo(), 0xffd43b), 0, 0, 0.09).scale.setScalar(0.6); }
  if (type === 'bubble') { put(inner, M(new THREE.SphereGeometry(0.26, 18, 12), 0xf783ac), 0, 0, 0); put(inner, M(new THREE.CylinderGeometry(0.09, 0.11, 0.45, 12), 0x4dabf7), 0, 0, 0.3, Math.PI / 2, 0, 0); }
  if (type === 'star') put(inner, M(starGeo(), 0xffd43b), 0, 0, 0);
  const glow = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.75, 28), new THREE.MeshBasicMaterial({ color:0xffe066, transparent:true, opacity:0.6, side:THREE.DoubleSide, depthWrite:false }));
  glow.rotation.x = -Math.PI / 2; glow.position.y = 0.05; g.add(glow);
  g.userData.inner = inner; return g;
}

// ---------- Don danh ----------
const ATK = {
  punch:   { wind:0.08, act:0.1,  total:0.32, range:1.75, dmg:[8, 10],  kb:7,  up:3, pts:2 },
  kick:    { wind:0.18, act:0.12, total:0.55, range:1.95, dmg:[12, 15], kb:11, up:5, pts:3 },
  dropkick:{ wind:0.04, act:0.4,  total:0.7,  range:1.6,  dmg:[12, 14], kb:15, up:6, pts:3 },
  hammer:  { wind:0.32, act:0.12, total:0.8,  range:2.4,  dmg:[20, 20], kb:19, up:8, pts:3 },
  bubble:  { wind:0.1,  act:0.02, total:0.4,  range:0 },
};
const TALENTS = [
  { id:'iron',    vn:'Nắm đấm thép', desc:'Đòn đánh đẩy xa hơn 25%' },
  { id:'heavy',   vn:'Bụng bự',      desc:'Bị đẩy lùi ít hơn 25%' },
  { id:'swift',   vn:'Chân sáo',     desc:'Chạy nhanh hơn 15%' },
  { id:'spring',  vn:'Lò xo',        desc:'Nhảy cao hơn 25%' },
  { id:'stamina', vn:'Dẻo dai',      desc:'Thể lực hồi gấp đôi' },
  { id:'regen',   vn:'Tự hồi máu',   desc:'Hồi 2 máu mỗi giây' },
  { id:'grip',    vn:'Tay kìm',      desc:'Túm lâu hơn, ném xa hơn 30%' },
];
const BOT_NAMES = ['Nugget','Pudding','Tofu','Waffles','Sprout','Pickle','Muffin','Noodle','Bean','Toast'];

// ---------- Fighter ----------
class Fighter {
  constructor(animal, name, color, isPlayer, team) {
    this.a = animal; this.name = name; this.color = color; this.isPlayer = isPlayer; this.team = team;
    this.talent = pick(TALENTS);
    this.m = makeAnimal(animal, color); scene.add(this.m.root);
    this.pos = new V3(); this.vel = new V3(); this.yaw = 0; this.score = 0;
    this.prevPos = new V3(); this.prevYaw = 0; this.rpos = new V3(); this.ryaw = 0;
    this.input = blankInput();
    const tag = document.createElement('div'); tag.className = 'tag' + (isPlayer ? ' me' : '');
    tag.innerHTML = `<div class="tn"></div><div class="hp"><i></i></div>`; tagLayer.appendChild(tag);
    this.tag = tag; this.tagName = tag.querySelector('.tn'); this.tagHp = tag.querySelector('i');
    this.blob = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.8), new THREE.MeshBasicMaterial({ map:blobTex, transparent:true, depthWrite:false, polygonOffset:true, polygonOffsetFactor:-2 }));
    this.blob.rotation.x = -Math.PI / 2; this.blob.renderOrder = 1; scene.add(this.blob);
    if (team) this.tagName.style.color = isPlayer ? '#ffe27a' : TEAM[team].col;
    this.resetState();
  }
  resetState() {
    this.vel.set(0, 0, 0); this.hp = 100; this.onGround = true; this.atk = null; this.atkT = 0; this.punchSide = 0;
    this.stun = 0; this.block = 0; this.blockHeld = 0; this.blockCd = 0; this.stamina = 100; this.sprintLock = false; this.restT = 0; this.sprinting = false;
    this.shield = false; this.speedT = 0; this.weapon = null; this.ammo = 0; this.trapped = 0; this.inWater = false;
    this.holding = null; this.heldBy = null; this.holdT = 0; this.struggle = 0; this.grabCd = 0; this.grabWhiff = 0;
    this.downed = false; this.downT = 0; this.reviveT = 0; this.reviveP = 0; this.reviving = null;
    this.out = false; this.respawnT = 0; this.roundPlace = 0;
    this.lastHitBy = null; this.lastHitT = 99; this.hitFlash = 0; this._hf = false; this.yawV = 0; this._knock = null;
    this.ai = { t:0, target:null, item:null, atkCd:0.5, blockT:0, skill:this.ai ? this.ai.skill : rand(0.55, 1), seen:null, carryT:0, dropkick:false, flag:null, stuckT:0 };
  }
  standing() { return !this.out && !this.downed && !this.heldBy; }
  isFoe(o) { return o !== this && (game.mode !== 'team' || o.team !== this.team); }
  dispose() { scene.remove(this.m.root); scene.remove(this.blob); this.tag.remove(); }
  forward() { return new V3(Math.sin(this.yaw), 0, Math.cos(this.yaw)); }
  tal(id) { return this.talent.id === id; }

  update(dt) {
    if (this.out) {
      if (game.mode !== 'arena' && game.state === 'play' && (this.respawnT -= dt) <= 0) respawn(this);
      return;
    }
    this.stun = Math.max(0, this.stun - dt); this.blockCd = Math.max(0, this.blockCd - dt); this.grabCd = Math.max(0, this.grabCd - dt);
    this.speedT = Math.max(0, this.speedT - dt); this.trapped = Math.max(0, this.trapped - dt); this.grabWhiff = Math.max(0, this.grabWhiff - dt);
    this.hitFlash = Math.max(0, this.hitFlash - dt); this.lastHitT += dt;
    if (this.tal('regen') && !this.downed && this.hp > 0 && this.hp < 100) this.hp = Math.min(100, this.hp + 2 * dt);
    const inp = this.input;

    if (this.downed) {
      this.downT -= dt;
      if (this.downT <= 0) { if (game.mode === 'team') { eliminate(this, false); return; } rise(this, game.mode === 'arena' ? 40 : 50); }
    }
    if (this.heldBy) {
      this.holdT += dt; this.struggle += inp.struggle || 0;
      const limit = this.downed ? 6 : 2.2 * (this.heldBy.tal('grip') ? 1.4 : 1);
      if (this.holdT + this.struggle >= limit && !this.downed) breakFree(this);
      return;
    }
    const ctrl = !this.downed && this.stun <= 0 && this.trapped <= 0 && game.state === 'play';

    // vac / tum
    let punch = inp.punch;
    if (this.holding) {
      const t = this.holding;
      if (t.out || t.heldBy !== this) this.holding = null;
      else if (!inp.grab || this.stun > 0 || this.downed || this.trapped > 0) dropHeld(this);
      else if (punch) { throwHeld(this); punch = false; }
    } else if (ctrl && inp.grabPress && this.grabCd <= 0 && !this.atk) tryGrab(this);

    // do don
    if (this.block > 0) {
      this.blockHeld += dt; this.block -= dt;
      if (this.block <= 0 || !ctrl || (!inp.block && this.blockHeld > 0.2)) { this.block = 0; this.blockCd = 0.7; }
    } else if (ctrl && inp.block && this.blockCd <= 0 && !this.atk && !this.holding) { this.block = 1.5; this.blockHeld = 0; }

    // tan cong
    if (this.atk) {
      this.atkT += dt; const A = ATK[this.atk.type];
      if (this.atk.type === 'bubble' && !this.atk.fired && this.atkT >= A.wind) { this.atk.fired = true; fireBubble(this); }
      if (this.atkT >= A.total) { if (this.atk.type === 'dropkick') this.stun = Math.max(this.stun, 0.3); this.atk = null; }
    } else if (ctrl && this.block <= 0 && !this.holding) {
      let type = null;
      if (punch) type = this.weapon || (this.onGround ? 'punch' : 'dropkick'); else if (inp.kick) type = this.onGround ? 'kick' : 'dropkick';
      if (type) {
        if (type === this.weapon && --this.ammo <= 0) this.weapon = null;
        this.atk = { type, hit:new Set(), fired:false }; this.atkT = 0;
        if (type === 'punch') this.punchSide ^= 1;
        autoAim(this);
        if (type === 'dropkick') { const fw = this.forward(); this.vel.x = fw.x * 13; this.vel.z = fw.z * 13; this.vel.y = Math.max(this.vel.y, 3.5); }
        Sound.whoosh();
      }
    }
    if (ctrl && inp.interact && !this.holding) tryPickup(this);
    this.reviving = null;
    if (ctrl && inp.use && game.mode === 'team' && !this.holding) {
      const mate = game.fighters.find(o => o !== this && o.team === this.team && o.downed && !o.heldBy && !o.out && hyp(o.pos.x - this.pos.x, o.pos.z - this.pos.z) < 1.8);
      if (mate) {
        this.reviving = mate; mate.reviveT += dt; mate.reviveP = mate.reviveT / 1.5;
        if (mate.reviveT >= 1.5) { rise(mate, 50); this.score += 2; feed(`💚 ${this.name} cứu ${mate.name}`); Sound.pickup(); }
      }
    }

    // toc do
    let mx = ctrl ? inp.x : 0, mz = ctrl ? inp.z : 0;
    if (this.reviving) mx = mz = 0;
    const ml = hyp(mx, mz); if (ml > 1) { mx /= ml; mz /= ml; }
    let spd = 6.2 * this.a.speed * (this.tal('swift') ? 1.15 : 1) * (this.speedT > 0 ? 1.5 : 1) * (this.block > 0 ? 0.35 : 1) * (this.atk ? 0.45 : 1) * (this.holding ? 0.75 : 1) * (this.inWater ? 0.55 : 1);
    this.sprinting = false;
    if (ctrl && inp.sprint && ml > 0.1 && !this.sprintLock && this.block <= 0 && this.stamina > 0) {
      spd *= this.holding ? 1.25 : 1.55; this.stamina -= 28 * dt; this.sprinting = true; this.restT = 0;
    } else { this.restT += dt; if (this.restT > 0.5) this.stamina = Math.min(100, this.stamina + 22 * (this.tal('stamina') ? 2 : 1) * dt); }
    if (this.stamina <= 0) { this.stamina = 0; this.sprintLock = true; }
    if (this.sprintLock && this.stamina > 25) this.sprintLock = false;

    if (this.trapped > 0) { this.vel.x *= 0.9; this.vel.z *= 0.9; this.vel.y = 0.9; }
    else {
      if (!(this.atk && this.atk.type === 'dropkick')) {
        const speeding = mx * this.vel.x + mz * this.vel.z > 0.1;
        const k = this.downed ? (this.onGround ? 6 : 0.5) : this.onGround ? (this.stun > 0 ? 3.2 : ml > 0.1 ? (speeding ? 9 : 13) : 11) : (this.stun > 0 ? 0.5 : 4);
        const f = Math.min(1, k * dt);
        this.vel.x += (mx * spd - this.vel.x) * f; this.vel.z += (mz * spd - this.vel.z) * f;
      }
      if (ctrl && inp.jump && this.onGround && !this.atk) { this.vel.y = 11 * this.a.jump * (this.tal('spring') ? 1.25 : 1); this.onGround = false; Sound.jump(); }
      this.vel.y -= 30 * dt;
    }

    // di chuyen ngang, chan boi vach doc
    const ox = this.pos.x, oz = this.pos.z;
    let nx = ox + this.vel.x * dt, nz = oz + this.vel.z * dt;
    const blk = (x, z) => hyp(x, z) <= world.R && world.h(x, z) > this.pos.y + 0.65;
    this.bumped = false;
    if (blk(nx, nz)) { this.bumped = true; if (!blk(nx, oz)) nz = oz; else if (!blk(ox, nz)) nx = ox; else { nx = ox; nz = oz; } }
    this.pos.x = nx; this.pos.z = nz;
    world.collide(this.pos, 0.5);
    if (this.onGround) { const cv = world.conveyorAt(this.pos.x, this.pos.z, this.pos.y); if (cv) { this.pos.x += cv.vx * dt; this.pos.z += cv.vz * dt; } }
    this.pos.y += this.vel.y * dt;

    // mat dat
    const wasAir = !this.onGround;
    const gh = world.groundAt(this.pos.x, this.pos.z, this.pos.y);
    const snap = !wasAir && this.vel.y <= 0 ? 0.45 : 0;
    if (gh !== null && this.pos.y <= gh + snap && this.pos.y > gh - 0.9) {
      if (wasAir && this.vel.y < -9) burst(this.pos.clone().setY(gh + 0.1), world.id === 'volcano' ? 0x5a4a44 : 0xe8dcc0, 5, 2, 1.5, 0.5);
      this.pos.y = gh; if (this.vel.y < 0) this.vel.y = 0; this.onGround = true;
    } else this.onGround = false;
    const hz = this.onGround ? world.hazard(this.pos.x, this.pos.z) : null;
    if (hz === 'lava') { burst(this.pos.clone().setY(this.pos.y + 0.5), 0xff7a1a, 20, 6, 0, 4); eliminate(this, true, 'lava'); return; }
    if (hz === 'water' && !this.inWater) { Sound.splash(); burst(this.pos.clone(), 0x9fd4ff, 10, 3, 0, 3); }
    this.inWater = hz === 'water';
    if (this.inWater && hyp(this.vel.x, this.vel.z) > 2 && Math.random() < 0.2) burst(this.pos.clone().setY(this.pos.y + 0.1), 0xcfe9ff, 1, 1.5, 0, 1.5);

    if (!this.atk && !this.downed) {
      let ax = mx, az = mz;
      if (inp.aim) { ax = inp.aim.x; az = inp.aim.z; }
      // xoay nguoi bang lo xo: muot, hoi qua da nhe
      if (hyp(ax, az) > 0.1) { const d = lerpAngle(0, Math.atan2(ax, az) - this.yaw, 1); this.yawV += (d * 170 - this.yawV * 22) * dt; }
      else this.yawV *= Math.exp(-12 * dt);
      this.yaw += this.yawV * dt;
    } else this.yawV = 0;
    if (this.pos.y < -14) eliminate(this, true);
  }

  carry() {
    const t = this.holding; if (!t) return;
    const ty = this.yaw + Math.PI / 2;
    t.yaw = ty; t.pos.set(this.pos.x + Math.sin(ty) * 0.9, this.pos.y + 1.75, this.pos.z + Math.cos(ty) * 0.9);
    t.vel.copy(this.vel); t.onGround = false;
  }

  animate(dt, t, alpha = 1) {
    const m = this.m;
    // vi tri hien thi = noi suy giua buoc vat ly truoc va hien tai -> muot o moi tan so man hinh
    if (this.prevPos.distanceToSquared(this.pos) > 9) this.prevPos.copy(this.pos);
    this.rpos.lerpVectors(this.prevPos, this.pos, alpha);
    this.ryaw = this.prevYaw + lerpAngle(0, this.yaw - this.prevYaw, 1) * alpha;
    m.root.visible = !this.out; if (this.out) this.blob.visible = false;
    if (this.out) return;
    m.root.position.copy(this.rpos);
    const A = m.anim, prevYaw = A.prevYaw ?? this.ryaw;
    m.root.rotation.y = this.ryaw;
    const yawRate = lerpAngle(0, this.ryaw - prevYaw, 1) / Math.max(dt, 1e-3); A.prevYaw = this.ryaw;
    const fwd = Math.sin(this.yaw) * this.vel.x + Math.cos(this.yaw) * this.vel.z;
    let atk = null;
    if (this.atk) {
      const D = ATK[this.atk.type], tt = this.atkT, rec = D.total - D.wind - D.act;
      const p = tt < D.wind ? -0.4 * (tt / D.wind) : tt < D.wind + D.act ? 1 : Math.max(0, 1 - (tt - D.wind - D.act) / rec);
      const ham = tt < D.wind ? -2.9 * (tt / D.wind) : tt < D.wind + D.act ? -2.9 + 1.7 * ((tt - D.wind) / D.act) : -1.2 * Math.max(0, 1 - (tt - D.wind - D.act) / rec);
      atk = { type:this.atk.type, p, side:this.punchSide, ham, wind:tt < D.wind };
    }
    const lying = this.downed || !!this.heldBy;
    const hitImpulse = this.hitFlash > 0 && !this._hf; this._hf = this.hitFlash > 0;
    let knock = null;
    if (this._knock) { const kx = this._knock.x, kz = this._knock.z; knock = { fwd:Math.sin(this.yaw) * kx + Math.cos(this.yaw) * kz, side:Math.cos(this.yaw) * kx - Math.sin(this.yaw) * kz }; this._knock = null; }
    const tumble = !lying && !this.atk && !this.onGround && this.stun > 0.2;
    // bong mem duoi chan
    const gy = world.groundAt(this.pos.x, this.pos.z, this.pos.y + 0.2);
    this.blob.visible = gy !== null && this.pos.y - gy < 6;
    if (this.blob.visible) { const hgt = Math.max(0, this.pos.y - gy); this.blob.position.set(this.rpos.x, gy + 0.04, this.rpos.z); this.blob.scale.setScalar(1 - Math.min(0.5, hgt * 0.12) + (lying ? 0.3 : 0)); this.blob.material.opacity = 1 - Math.min(0.85, hgt * 0.25); }
    animateCritter(m, {
      speed:hyp(this.vel.x, this.vel.z), fwd, yawRate, onGround:this.onGround || lying, vy:this.vel.y, sprint:this.sprinting,
      atk, lying, flail:!!this.heldBy && !this.downed, holding:!!this.holding, knock, tumble,
      grabbing:!this.holding && (this.grabWhiff > 0 || (this.input.grab && this.standing() && !this.atk)),
      reviving:!!this.reviving, block:this.block > 0, stun:this.stun > 0.05 && !this.atk && !lying, trapped:this.trapped > 0,
      gun:this.weapon === 'bubble' && !this.atk, hitImpulse, squint:this.downed || this.stun > 0.3 || !!this.heldBy,
      happy:game.state === 'end' && ranking()[0] === this,
    }, dt, t);
    m.dizzy.visible = this.downed || (this.stun > 0.4 && !this.atk);
    if (m.dizzy.visible) { m.dizzy.rotation.y = t * 5; m.dizzy.position.set(0, this.downed ? 1.2 : 2.45, this.downed ? -1.6 : 0); }
    m.shield.visible = this.block > 0; if (m.shield.visible) m.shield.material.opacity = 0.22 + Math.sin(t * 20) * 0.06;
    m.ring.visible = this.shield; m.ring.rotation.z = t * 3; m.ring.position.y = 1 + Math.sin(t * 4) * 0.3;
    m.bubble.visible = this.trapped > 0; m.bubble.scale.setScalar(1 + Math.sin(t * 8) * 0.04);
    m.hammer.visible = this.weapon === 'hammer' || (this.atk && this.atk.type === 'hammer');
    m.gun.visible = this.weapon === 'bubble' || (this.atk && this.atk.type === 'bubble');
    if (m.prop) m.prop.visible = !m.hammer.visible && !m.gun.visible;
    const sp = hyp(this.vel.x, this.vel.z);
    if ((this.speedT > 0 || this.sprinting) && sp > 3 && this.onGround && !this.inWater && Math.random() < 0.35)
      burst(this.pos.clone().setY(this.pos.y + 0.15), this.speedT > 0 ? 0x9be7ff : (world.id === 'volcano' ? 0x5a4a44 : 0xeee2c8), 1, 0.5, 1, 0.5);
  }
}

// ---------- Tum, vac, nem, guc, cuu ----------
function tryGrab(f) {
  let best = null, bd = 1.8; const fw = f.forward();
  for (const o of game.fighters) {
    if (!f.isFoe(o) || o.out || o.heldBy || o.holding) continue;
    const dx = o.pos.x - f.pos.x, dz = o.pos.z - f.pos.z, d = hyp(dx, dz);
    if (d < bd && Math.abs(o.pos.y - f.pos.y) < 1.4 && ((dx * fw.x + dz * fw.z) / (d || 1) > 0.25 || o.downed)) { bd = d; best = o; }
  }
  if (!best) { f.grabWhiff = 0.25; f.grabCd = 0.45; return; }
  f.holding = best; best.heldBy = f; best.holdT = 0; best.struggle = 0; best.atk = null; best.block = 0; best.trapped = 0;
  Sound.grab(); burst(best.pos.clone().setY(best.pos.y + 1.2), 0xffffff, 6, 3);
}
function dropHeld(f) {
  const t = f.holding; if (!t) return;
  f.holding = null; t.heldBy = null; f.grabCd = 0.4;
  const fw = f.forward(); t.pos.set(f.pos.x + fw.x * 1.1, f.pos.y + 0.8, f.pos.z + fw.z * 1.1); t.vel.set(fw.x * 2, 2, fw.z * 2);
  if (!t.downed) t.stun = Math.max(t.stun, 0.3);
}
function throwHeld(f) {
  const t = f.holding; if (!t) return;
  f.holding = null; t.heldBy = null; f.grabCd = 0.5;
  const fw = f.forward(), power = 12 * (f.tal('grip') ? 1.3 : 1) * (t.tal('heavy') ? 0.8 : 1);
  t.pos.set(f.pos.x + fw.x * 1.0, f.pos.y + 1.7, f.pos.z + fw.z * 1.0);
  t.vel.set(fw.x * power, 6.5, fw.z * power); t._knock = { x:fw.x * power, z:fw.z * power };
  t.stun = Math.max(t.stun, 0.9); t.lastHitBy = f; t.lastHitT = 0;
  if (!t.downed) { t.hp = Math.max(1, t.hp - 8); dmgText(t.pos.clone().setY(t.pos.y + 1), '-8'); }
  if (game.mode !== 'arena') f.score += 2;
  Sound.throw(); if (f.isPlayer || t.isPlayer) shake = Math.max(shake, 0.35);
  f.atk = { type:'punch', hit:new Set(game.fighters), fired:false }; f.atkT = ATK.punch.wind;
}
function breakFree(t) {
  const f = t.heldBy; if (!f) return;
  f.holding = null; t.heldBy = null; f.stun = Math.max(f.stun, 0.45); f.grabCd = 0.8;
  const fw = f.forward(); t.pos.set(f.pos.x - fw.x * 1.0, f.pos.y + 0.6, f.pos.z - fw.z * 1.0); t.vel.set(-fw.x * 4, 4, -fw.z * 4);
  burst(t.pos.clone().setY(t.pos.y + 1), 0xffffff, 8, 4);
  if (t.isPlayer) feed('💪 Bạn đã vùng thoát!');
}
function setDown(f, by) {
  f.downed = true; f.hp = 0; f.downT = game.mode === 'team' ? 10 : game.mode === 'arena' ? 4 : 3.5;
  f.atk = null; f.block = 0; f.reviveT = 0; f.reviveP = 0;
  if (f.holding) dropHeld(f);
  feed(`💫 ${by ? by.name + ' hạ gục ' : ''}${f.name}`);
  if (f.isPlayer) bigText('', game.mode === 'team' ? 'Bị hạ gục! Chờ đồng đội cứu…' : 'Bị hạ gục! Coi chừng bị vác ném…', 2);
}
function rise(f, hp) {
  if (f.heldBy) { const h = f.heldBy; h.holding = null; f.heldBy = null; }
  f.downed = false; f.hp = hp; f.stun = 0.25; f.reviveT = 0; f.reviveP = 0; f.vel.y = 4;
}

// ---------- Trang thai game ----------
const game = { state:'menu', mode:'arena', modePref:'random', mapPref:'random', mapId:'meadow', bots:5, sel:0, fighters:[], items:[], projs:[], time:0, R:R0, zone:null,
               itemT:0, quakeT:0, quake:0, cd:0, endT:0, rt:0, round:1, rounds:5, player:null, lastMode:null, lastMap:null, focus:new V3(),
               teamScore:{ red:0, blue:0 }, teamTick:0, worldDirty:false };
const LIMIT = { arena:90, koth:180, team:300 };
const ARENA_R = 15;
const MODE_NAME = { arena:'ĐẤU TRƯỜNG', koth:'VUA ĐỒI', team:'CHIẾM CỜ' };
const MODE_DESC = {
  random:'Mỗi ván đổi chế độ.',
  arena:'Mỗi người một mình, 5 vòng. Sàn co lại, ai rơi xuống là bị loại. Trụ cuối +3, nhì +2, ba +1.',
  team:'Hai đội Đỏ – Xanh giành 3 lá cờ. Giữ cờ để ghi điểm, 100 điểm thắng. Cứu đồng đội bị hạ gục.',
  koth:'Đứng một mình trong vòng sáng để ghi điểm. Đánh trúng cũng được điểm. 100 điểm thắng.',
};

function clearWorldObjects() {
  for (const it of game.items) scene.remove(it.mesh);
  for (const p of game.projs) scene.remove(p.mesh);
  for (const d of dmgTexts) d.el.remove(); dmgTexts.length = 0;
  game.items = []; game.projs = [];
}
function startGame() {
  for (const f of game.fighters) f.dispose(); game.fighters = [];
  clearWorldObjects();
  game.mode = game.modePref === 'random' ? pick(['arena', 'team', 'koth'].filter(m => m !== game.lastMode)) : game.modePref;
  game.lastMode = game.mode;
  game.mapId = game.mapPref === 'random' ? pick(MAP_LIST.map(m => m.id).filter(m => m !== game.lastMap)) : game.mapPref;
  game.lastMap = game.mapId;
  world.build(game.mapId); world.applyEnv(); game.worldDirty = false;
  game.round = 1; game.teamScore = { red:0, blue:0 };
  zoneG.visible = game.mode === 'koth'; flagG.visible = game.mode === 'team';
  const sp = world.spots || { flags:FLAG_SPOTS, bases:BASES };
  TEAM.red.base.set(sp.bases.red[0], 0, sp.bases.red[1]); TEAM.blue.base.set(sp.bases.blue[0], 0, sp.bases.blue[1]);
  FLAGS.forEach((fl, i) => { fl.x = sp.flags[i][1]; fl.z = sp.flags[i][2]; fl.g.position.x = fl.x; fl.g.position.z = fl.z; });
  FLAGS.forEach(fl => { fl.label.hidden = game.mode !== 'team'; fl.y = world.groundAt(fl.x, fl.z, 99) ?? world.h(fl.x, fl.z); fl.g.position.y = fl.y; });
  baseDiscs.forEach((b, i) => { const base = i ? TEAM.blue.base : TEAM.red.base; b.position.set(base.x, (world.groundAt(base.x, base.z, 99) ?? 0) + 0.05, base.z); });

  const team = game.mode === 'team';
  const player = new Fighter(ANIMALS[game.sel], ANIMALS[game.sel].name, team ? TEAM.red.col : COLLARS[0], true, team ? 'red' : null);
  game.player = player; game.fighters.push(player);
  const names = [...BOT_NAMES].sort(() => Math.random() - 0.5);
  for (let i = 0; i < game.bots; i++) {
    const t = team ? (i % 2 === 0 ? 'blue' : 'red') : null;
    game.fighters.push(new Fighter(pick(ANIMALS), names[i], team ? TEAM[t].col : COLLARS[(i + 1) % COLLARS.length], false, t));
  }
  stage.visible = false;
  showUI('hud');
  $('#modeName').textContent = MODE_NAME[game.mode];
  $('#meName').textContent = player.name + ' (bạn)' + (team ? ' · Đội Đỏ' : '');
  $('#meTalent').textContent = '✨ Thiên phú: ' + player.talent.vn + ' – ' + player.talent.desc;
  feed(`🗺️ Bản đồ: ${MAP_LIST.find(m => m.id === game.mapId).vn}`);
  if (perfLevel) applyFurLevel();
  setupRound(3.6);
}
function spawnPoint(f, i, n) {
  if (game.mode === 'team') {
    const base = TEAM[f.team].base, mates = game.fighters.filter(o => o.team === f.team), k = mates.indexOf(f);
    const x = base.x + (k - (mates.length - 1) / 2) * 1.8, z = base.z;
    return new V3(x, world.groundAt(x, z, 99) ?? world.h(x, z), z);
  }
  const a = i / n * Math.PI * 2 + Math.PI / 2, r = (game.mode === 'arena' ? ARENA_R : R0) * 0.55;
  const x = Math.cos(a) * r, z = Math.sin(a) * r;
  if (world.hazard(x, z) || world.h(x, z) < -50) { const p = world.randomSpot(r + 2, Math.max(0, r - 3)); return p; }
  return new V3(x, world.groundAt(x, z, 99) ?? world.h(x, z), z);
}
function setupRound(cd) {
  clearWorldObjects();
  const g = game;
  if (g.worldDirty) { world.build(g.mapId); world.applyEnv(); g.worldDirty = false; }
  g.R = g.mode === 'arena' ? ARENA_R : world.R0; world.setR(g.R);
  g.time = 0; g.itemT = 3; g.quakeT = rand(25, 35); g.quake = 0; g.teamTick = 0;
  if (g.mode === 'koth') { const p = world.randomSpot(R0 - 5); g.zone = { x:p.x, z:p.z, y:p.y, r:3, t:20 }; } else g.zone = null;
  for (const fl of FLAGS) { fl.p = 0; fl.owner = null; }
  const n = g.fighters.length;
  g.fighters.forEach((f, i) => { f.resetState(); f.pos.copy(spawnPoint(f, i, n)); f.yaw = Math.atan2(-f.pos.x, -f.pos.z); });
  g.focus.set(0, 0, 0);
  g.state = 'countdown'; g.cd = cd;
  if (g.mode === 'arena') bigText('VÒNG ' + g.round + '/' + g.rounds, '', 1.2);
}

function autoAim(f) {
  let best = null, bd = 2.8; const fw = f.forward();
  for (const o of game.fighters) if (f.isFoe(o) && !o.out && !o.heldBy) {
    const dx = o.pos.x - f.pos.x, dz = o.pos.z - f.pos.z, d = hyp(dx, dz);
    if (d < bd && Math.abs(o.pos.y - f.pos.y) < 1.6 && (dx * fw.x + dz * fw.z) / (d || 1) > 0.2) { bd = d; best = o; }
  }
  if (best) { f.yaw = Math.atan2(best.pos.x - f.pos.x, best.pos.z - f.pos.z); f.yawV = 0; }
}
function canHit(f, o) { return f.isFoe(o) && !o.out && !o.heldBy; }

function applyHit(att, def, type) {
  const A = ATK[type];
  const dir = new V3(def.pos.x - att.pos.x, 0, def.pos.z - att.pos.z);
  if (dir.lengthSq() < 0.0001) dir.copy(att.forward()); dir.normalize();
  const hp = def.pos.clone().setY(def.pos.y + 1.2);
  if (def.shield && !def.downed) {
    def.shield = false; def.vel.x += dir.x * 2; def.vel.z += dir.z * 2;
    burst(hp, 0xffd23f, 14, 5); Sound.block(); dmgText(hp, 'CHẶN!', '#ffd23f'); return;
  }
  const blocked = def.block > 0;
  let dmg = randInt(A.dmg[0], A.dmg[1]), kb = A.kb, up = A.up;
  if (blocked) { dmg = Math.round(dmg * 0.25); kb *= 0.3; up *= 0.3; }
  kb *= (1 + (100 - def.hp) / 130) * def.a.weight * (att.tal('iron') ? 1.25 : 1) * (def.tal('heavy') ? 0.75 : 1);
  if (def.trapped > 0) { def.trapped = 0; kb *= 1.2; burst(hp, 0xff9ed2, 12, 5); }
  if (def.downed) { dmg = 0; kb *= 0.7; }
  def.hp = Math.max(0, def.hp - dmg);
  def.vel.x = dir.x * kb; def.vel.z = dir.z * kb; def.vel.y = Math.max(def.vel.y, up); def.onGround = false;
  def._knock = { x:dir.x * kb, z:dir.z * kb };
  impactRing(hp, blocked ? 0x9fdcff : type === 'punch' ? 0xfff2a8 : 0xffb066, type === 'punch' ? 0.9 : 1.4);
  if (att.isPlayer || def.isPlayer) hitStop = Math.max(hitStop, blocked ? 0.03 : type === 'punch' ? 0.05 : 0.09);
  if (!def.downed) { def.stun = blocked ? 0.12 : 0.3 + kb * 0.025; def.atk = null; }
  def.hitFlash = 0.15; def.lastHitBy = att; def.lastHitT = 0;
  if (def.holding) dropHeld(def);
  if (!blocked && !def.downed && game.mode !== 'arena') { att.score += A.pts; if (game.mode === 'koth') def.score = Math.max(0, def.score - 1); }
  if (blocked) { burst(hp, 0x9fdcff, 8, 3); Sound.block(); dmgText(hp, '-' + dmg, '#bfe6ff'); }
  else { burst(hp, type === 'punch' ? 0xffe066 : 0xff8a3d, type === 'punch' ? 9 : 15, type === 'punch' ? 5 : 8); type === 'punch' ? Sound.hit() : Sound.heavy(); if (dmg) dmgText(hp, '-' + dmg); }
  if (att.isPlayer || def.isPlayer) shake = Math.max(shake, type === 'punch' ? 0.25 : 0.5);
  if (def.hp <= 0 && !def.downed) setDown(def, att);
}
// vu no (thien thach)
function blast(p, r, dmg, kb) {
  burst(p.clone().setY(p.y + 0.5), 0xff7a1a, 24, 9, 0, 4); impactRing(p.clone().setY(p.y + 0.5), 0xff7a1a, 3); burst(p.clone().setY(p.y + 0.3), 0x5a4a44, 10, 4, 2, 1);
  Sound.boom(); if (game.player && hyp(game.player.pos.x - p.x, game.player.pos.z - p.z) < 10) shake = Math.max(shake, 0.6);
  for (const f of game.fighters) {
    if (f.out || f.heldBy) continue;
    const dx = f.pos.x - p.x, dz = f.pos.z - p.z, d = hyp(dx, dz);
    if (d > r || Math.abs(f.pos.y - p.y) > 2.5) continue;
    const nx = d > 0.01 ? dx / d : 1, nz = d > 0.01 ? dz / d : 0, k = kb * (1 - d / r * 0.5);
    f.vel.set(nx * k, 8, nz * k); f.onGround = false; f.stun = Math.max(f.stun, 0.6); f.hitFlash = 0.15; f._knock = { x:nx * k, z:nz * k };
    if (!f.downed) { f.hp = Math.max(0, f.hp - dmg); dmgText(f.pos.clone().setY(f.pos.y + 1.4), '-' + dmg, '#ff9a3d'); if (f.hp <= 0) setDown(f, null); }
    if (f.holding) dropHeld(f);
  }
}

function eliminate(f, ringOut, cause) {
  if (f.out) return;
  const credit = f.lastHitBy && f.lastHitT < 6 && f.lastHitBy !== f && !f.lastHitBy.out ? f.lastHitBy : null;
  if (cause === 'lava') { Sound.out(); feed(credit ? `🔥 ${credit.name} đẩy ${f.name} vào dung nham` : `🔥 ${f.name} rơi vào dung nham`); }
  else if (ringOut) { Sound.out(); feed(credit ? `🌀 ${credit.name} hất ${f.name} khỏi sàn` : `🌀 ${f.name} rơi khỏi sàn`); }
  else { burst(f.pos.clone().setY(f.pos.y + 1), 0xffffff, 18, 5, 2, 1); feed(`☁️ ${f.name} bị loại`); }
  if (f.holding) dropHeld(f);
  if (f.heldBy) { f.heldBy.holding = null; f.heldBy = null; }
  if (game.mode === 'arena') {
    f.roundPlace = game.fighters.filter(x => !x.out).length;
    if (credit) credit.score += 1;
    if (f.isPlayer) bigText('BỊ LOẠI!', `Hạng ${f.roundPlace} vòng này – Enter để bỏ qua`, 2.5);
  } else if (game.mode === 'koth') {
    if (credit) credit.score += 5;
    f.score = Math.max(0, f.score - 5); f.respawnT = 3;
    if (f.isPlayer) bigText('', 'Hồi sinh sau 3 giây…', 2.5);
  } else {
    if (credit) credit.score += 3;
    f.respawnT = 4;
    if (f.isPlayer) bigText('', 'Hồi sinh ở căn cứ sau 4 giây…', 2.5);
  }
  f.out = true; f.downed = false; f.atk = null; f.weapon = null; f.trapped = 0; f.block = 0;
}
function respawn(f) {
  f.resetState();
  if (game.mode === 'team') { const b = TEAM[f.team].base, x = b.x + rand(-2, 2), z = b.z + rand(-1, 1); f.pos.set(x, world.h(x, z) + 6, z); }
  else { const p = world.randomSpot(R0 * 0.55); f.pos.set(p.x, p.y + 7, p.z); }
  f.stun = 0.3;
}

function tryPickup(f) {
  let best = null, bd = 1.7;
  for (const it of game.items) { const d = hyp(it.pos.x - f.pos.x, it.pos.z - f.pos.z); if (d < bd && Math.abs(f.pos.y - it.pos.y) < 1.5) { bd = d; best = it; } }
  if (!best) return;
  game.items.splice(game.items.indexOf(best), 1); scene.remove(best.mesh);
  const t = best.type;
  if (t === 'hammer') { f.weapon = 'hammer'; f.ammo = 1; }
  if (t === 'bubble') { f.weapon = 'bubble'; f.ammo = 3; }
  if (t === 'boots') f.speedT = 5;
  if (t === 'shield') f.shield = true;
  if (t === 'star') { if (game.mode === 'arena') f.hp = Math.min(100, f.hp + 25); else f.score += 5; }
  burst(best.pos.clone().setY(best.pos.y + 0.8), 0xffe066, 10, 3);
  if (f.isPlayer) { Sound.pickup(); feed(`✨ Bạn nhặt ${ITEM_INFO[t].vn}${t === 'star' ? (game.mode === 'arena' ? ' (+25 máu)' : ' (+5 điểm)') : ''}`); }
}
function spawnItem() {
  const types = ['hammer', 'boots', 'shield', 'bubble', 'star', 'star'];
  const p = world.randomSpot(Math.max(1.5, game.R - 2.5));
  const it = { type:pick(types), pos:p, t:rand(0, 6), vy:0 };
  it.mesh = makeItemMesh(it.type); it.mesh.position.copy(it.pos); scene.add(it.mesh); game.items.push(it);
}
function fireBubble(f) {
  const fw = f.forward();
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.35, 20, 14), new THREE.MeshPhysicalMaterial({ color:0xff9ed2, transparent:true, opacity:0.55, roughness:0.05, clearcoat:1, iridescence:1 }));
  const p = { owner:f, pos:f.pos.clone().add(fw.clone().multiplyScalar(1)).setY(f.pos.y + 1), dir:fw, life:1.1, mesh };
  mesh.position.copy(p.pos); scene.add(mesh); game.projs.push(p); Sound.boop();
}

// ---------- AI ----------
function botThink(b, dt) {
  const inp = b.input, ai = b.ai, prevGrab = inp.grab;
  Object.assign(inp, blankInput());
  if (b.out || game.state !== 'play') return;
  if (b.heldBy) { if (Math.random() < dt * 7 * ai.skill) inp.struggle = 0.12; return; }
  if (b.downed) return;
  ai.t -= dt; ai.atkCd -= dt; ai.blockT -= dt;
  const g = game;
  const dist = o => hyp(o.pos.x - b.pos.x, o.pos.z - b.pos.z);
  const foes = g.fighters.filter(o => b.isFoe(o) && !o.out && !o.heldBy);
  const dC = hyp(b.pos.x, b.pos.z);
  const steerSafe = () => {
    // tranh mep va dung nham
    const px = b.pos.x + inp.x * 1.8, pz = b.pos.z + inp.z * 1.8;
    if (hyp(px, pz) > g.R - 1.2 || world.hazard(px, pz) === 'lava' || world.h(px, pz) < -50) { const l = dC || 1; inp.x = -b.pos.x / l; inp.z = -b.pos.z / l; }
    // ket vao vach -> nhay
    const moving = hyp(inp.x, inp.z) > 0.3;
    ai.stuckT = moving && b.onGround && hyp(b.vel.x, b.vel.z) < 1.2 ? ai.stuckT + dt : Math.max(0, ai.stuckT - dt);
    if (ai.stuckT > 0.3 || (b.bumped && moving && Math.random() < 0.15)) { inp.jump = true; ai.stuckT = 0; }
  };

  if (b.holding) {
    inp.grab = true; ai.carryT += dt;
    const ox = dC > 0.3 ? b.pos.x / dC : 1, oz = dC > 0.3 ? b.pos.z / dC : 0;
    inp.x = ox; inp.z = oz; inp.sprint = b.stamina > 15;
    if (dC > g.R - 3.2 || ai.carryT > 2.6) inp.punch = true;
    // nem vao dung nham neu gan
    if (world.lavaLevel !== null) { const fw = b.forward(); if (world.hazard(b.pos.x + fw.x * 3, b.pos.z + fw.z * 3) === 'lava') inp.punch = true; }
    return;
  }
  ai.carryT = 0;

  if (g.mode === 'team') {
    const mate = g.fighters.filter(o => o.team === b.team && o !== b && o.downed && !o.heldBy && !o.out).sort((x, y) => dist(x) - dist(y))[0];
    const threat = foes.some(o => o.standing() && dist(o) < 2.5);
    if (mate && dist(mate) < 12 && !threat) {
      const d = dist(mate);
      if (d < 1.4) { inp.use = true; return; }
      inp.x = (mate.pos.x - b.pos.x) / d; inp.z = (mate.pos.z - b.pos.z) / d; inp.sprint = d > 5 && b.stamina > 40;
      steerSafe(); return;
    }
  }

  if (ai.t <= 0) {
    ai.t = rand(0.25, 0.6);
    let best = null, bs = 1e9;
    for (const o of foes) { const s = dist(o) * (o.isPlayer ? 0.85 : 1) + (o.downed ? -3 : 0) + (o.hp < 40 ? -1.5 : 0) + Math.abs(o.pos.y - b.pos.y) * 2 + rand(0, 2); if (s < bs) { bs = s; best = o; } }
    ai.target = best;
    ai.item = null;
    if (!b.weapon) for (const it of g.items) if (hyp(it.pos.x - b.pos.x, it.pos.z - b.pos.z) < 6 && Math.random() < 0.6) { ai.item = it; break; }
    if (g.mode === 'team') {
      const score = fl => {
        const d = hyp(fl.x - b.pos.x, fl.z - b.pos.z);
        const enemyIn = g.fighters.some(o => o.team !== b.team && o.standing() && hyp(o.pos.x - fl.x, o.pos.z - fl.z) < FLAG_R);
        return d + (fl.owner === b.team && !enemyIn ? 30 : 0) - (enemyIn ? 4 : 0) + rand(0, 6);
      };
      ai.flag = [...FLAGS].sort((x, y) => score(x) - score(y))[0];
    }
  }
  const T = ai.target && !ai.target.out && !ai.target.heldBy ? ai.target : null;
  const td = T ? dist(T) : 99;
  let gx = 0, gz = 0;
  if (ai.item && g.items.includes(ai.item)) {
    gx = ai.item.pos.x; gz = ai.item.pos.z;
    if (hyp(gx - b.pos.x, gz - b.pos.z) < 1.4) inp.interact = true;
  } else if (g.mode === 'koth' && (!T || td > 2.5 || hyp(T.pos.x - g.zone.x, T.pos.z - g.zone.z) > g.zone.r + 1)) {
    gx = g.zone.x + rand(-1, 1); gz = g.zone.z + rand(-1, 1);
  } else if (g.mode === 'team' && ai.flag && (!T || td > 4)) {
    gx = ai.flag.x + rand(-1, 1); gz = ai.flag.z + rand(-1, 1);
  } else if (T) {
    const tc = hyp(T.pos.x, T.pos.z) || 1;
    gx = T.pos.x - T.pos.x / tc * 0.9; gz = T.pos.z - T.pos.z / tc * 0.9;
  }
  const dx = gx - b.pos.x, dz = gz - b.pos.z, d = hyp(dx, dz);
  if (d > 0.6) { inp.x = dx / d; inp.z = dz / d; inp.sprint = d > 5 && b.stamina > 45; }
  // muc tieu tren cao -> nhay len
  if (T && td < 3 && T.pos.y > b.pos.y + 0.6 && b.onGround && Math.random() < 0.1) inp.jump = true;

  if (T) {
    if (td < 4) inp.aim = { x:T.pos.x - b.pos.x, z:T.pos.z - b.pos.z };
    if (ai.dropkick && !b.onGround && b.vel.y < 4) { inp.punch = true; ai.dropkick = false; }
    else if (ai.atkCd <= 0) {
      if (T.downed && td < 1.5) { inp.grab = true; ai.atkCd = 0.5; }
      else if (b.weapon === 'bubble' && td < 7) { inp.punch = true; ai.atkCd = rand(0.6, 1.2); }
      else if (td > 3 && td < 5 && b.onGround && Math.random() < 0.012 * ai.skill) { inp.jump = true; ai.dropkick = true; inp.x = (T.pos.x - b.pos.x) / td; inp.z = (T.pos.z - b.pos.z) / td; }
      else if (td < (b.weapon === 'hammer' ? 2.2 : 1.7) && Math.abs(T.pos.y - b.pos.y) < 1.4) {
        const r = Math.random(), nearEdge = hyp(T.pos.x, T.pos.z) > g.R - 4;
        if (r < (nearEdge ? 0.3 : 0.12) * ai.skill + 0.04) inp.grab = true;
        else if (r < 0.7) inp.punch = true; else inp.kick = true;
        ai.atkCd = rand(0.3, 0.85) / ai.skill;
      }
    }
    if (prevGrab && !b.holding && ai.atkCd > 0.2) inp.grab = false;
  }
  for (const o of foes) if (o.atk && o.atkT < 0.05 && dist(o) < 2.4 && ai.seen !== o.atk) {
    ai.seen = o.atk; if (Math.random() < 0.3 * ai.skill) ai.blockT = rand(0.35, 0.7);
  }
  inp.block = ai.blockT > 0 && !inp.grab;
  if (inp.block) inp.x = inp.z = 0;
  inp.grabPress = inp.grab && !prevGrab;
  if (!inp.block) steerSafe();
  if (Math.random() < 0.003) inp.jump = true;
}

// ---------- Che do choi ----------
function tickMode(dt) {
  const g = game;
  if (g.mode === 'arena') {
    const nr = g.time < 8 ? ARENA_R : Math.max(4, ARENA_R - (g.time - 8) * (11 / 65));
    if (nr < g.R) { g.R = nr; world.setR(nr); g.worldDirty = true; }
    g.quakeT -= dt;
    if (g.quakeT <= 0 && g.quake <= 0) { g.quake = 2.5; g.quakeT = rand(25, 35); feed('🌋 ĐỘNG ĐẤT!'); bigText('ĐỘNG ĐẤT!', '', 1.2); }
    if (g.quake > 0) {
      g.quake -= dt; shake = Math.max(shake, 0.3);
      if (Math.random() < dt * 3) for (const f of g.fighters) if (f.standing() && f.onGround) {
        const a = rand(0, 6.28); f.vel.x += Math.cos(a) * 5; f.vel.z += Math.sin(a) * 5; f.vel.y = 3; f.stun = Math.max(f.stun, 0.2);
      }
    }
  } else if (g.mode === 'koth') {
    const z = g.zone; z.t -= dt;
    if (z.t <= 0) { const p = world.randomSpot(R0 - 5); z.x = p.x; z.z = p.z; z.y = p.y; z.t = 20; feed('📍 Vùng chiếm đóng đã dời chỗ!'); }
    const inside = g.fighters.filter(f => f.standing() && hyp(f.pos.x - z.x, f.pos.z - z.z) < z.r && Math.abs(f.pos.y - z.y) < 2);
    z.owner = inside.length === 1 ? inside[0] : null; z.contested = inside.length > 1;
    if (z.owner) z.owner.score += 5 * dt;
  } else {
    for (const fl of FLAGS) {
      const inside = g.fighters.filter(f => f.standing() && hyp(f.pos.x - fl.x, f.pos.z - fl.z) < FLAG_R && Math.abs(f.pos.y - fl.y) < 2.2);
      const reds = inside.filter(f => f.team === 'red').length, blues = inside.length - reds;
      fl.contested = reds > 0 && blues > 0;
      if (reds && !blues) fl.p = Math.min(1, fl.p + dt * 0.25 * Math.sqrt(reds));
      if (blues && !reds) fl.p = Math.max(-1, fl.p - dt * 0.25 * Math.sqrt(blues));
      for (const [team, sign] of [['red', 1], ['blue', -1]]) if (fl.p * sign >= 1 && fl.owner !== team) {
        fl.owner = team; g.teamScore[team] += 1;
        for (const f of inside) if (f.team === team) f.score += 3;
        feed(`🚩 Đội ${TEAM[team].vn} chiếm cờ ${fl.id}`); Sound.flag();
      }
      if ((fl.owner === 'red' && fl.p <= 0) || (fl.owner === 'blue' && fl.p >= 0)) { feed(`🏳️ Cờ ${fl.id} bị mất`); fl.owner = null; }
    }
    g.teamTick += dt;
    if (g.teamTick >= 3) { g.teamTick -= 3; for (const fl of FLAGS) if (fl.owner) g.teamScore[fl.owner] += 1; }
  }
  g.itemT -= dt;
  if (g.itemT <= 0) { g.itemT = rand(5, 8); if (g.items.length < (g.mode === 'team' ? 6 : 4)) spawnItem(); }
  for (const it of [...g.items]) {
    if (hyp(it.pos.x, it.pos.z) > g.R) { it.vy -= 30 * dt; it.pos.y += it.vy * dt; it.mesh.position.y = it.pos.y; if (it.pos.y < -15) { g.items.splice(g.items.indexOf(it), 1); scene.remove(it.mesh); } }
  }
  for (const p of [...g.projs]) {
    p.pos.addScaledVector(p.dir, 13 * dt); p.life -= dt; p.mesh.position.copy(p.pos);
    for (const f of g.fighters) if (canHit(p.owner, f) && f.standing() && hyp(f.pos.x - p.pos.x, f.pos.z - p.pos.z) < 1 && Math.abs(f.pos.y + 1 - p.pos.y) < 1.4) {
      p.life = 0;
      if (f.shield) { f.shield = false; burst(p.pos, 0xffd23f, 10, 4); Sound.block(); }
      else { f.trapped = 2; f.atk = null; f.block = 0; if (f.holding) dropHeld(f); f.vel.set(0, 0, 0); f.lastHitBy = p.owner; f.lastHitT = 0; if (g.mode !== 'arena') p.owner.score += 2; burst(p.pos, 0xff9ed2, 10, 3); Sound.boop(); }
      break;
    }
    if (p.life <= 0) { scene.remove(p.mesh); g.projs.splice(g.projs.indexOf(p), 1); }
  }
}

function checkEnd() {
  const g = game;
  if (g.mode === 'arena') { if (g.fighters.filter(f => !f.out).length <= 1 || g.time >= LIMIT.arena) endRound(); }
  else if (g.mode === 'koth') { if (g.time >= LIMIT.koth || g.fighters.some(f => f.score >= 100)) endMatch(); }
  else if (g.time >= LIMIT.team || g.teamScore.red >= 100 || g.teamScore.blue >= 100) endMatch();
}
function endRound() {
  const g = game;
  const alive = g.fighters.filter(f => !f.out).sort((a, b) => b.hp - a.hp);
  alive.forEach((f, i) => f.roundPlace = i + 1);
  const pts = [0, 3, 2, 1];
  for (const f of g.fighters) f.score += pts[f.roundPlace] || 0;
  const w = g.fighters.find(f => f.roundPlace === 1);
  bigText(`HẾT VÒNG ${g.round}`, w ? `${w.isPlayer ? 'Bạn' : w.name} trụ lại cuối cùng (+3)` : '', 2.8);
  g.state = 'roundEnd'; g.rt = 3; Sound.go();
}
function ranking() {
  const fs = [...game.fighters];
  if (game.mode === 'team') {
    const win = game.teamScore.red >= game.teamScore.blue ? 'red' : 'blue';
    return fs.sort((a, b) => (a.team === win ? 0 : 1) - (b.team === win ? 0 : 1) || b.score - a.score);
  }
  return fs.sort((a, b) => b.score - a.score || (a.roundPlace || 99) - (b.roundPlace || 99));
}
function endMatch() {
  game.state = 'end'; game.endT = 1.8;
  if (game.mode === 'team') {
    const { red, blue } = game.teamScore;
    bigText(red === blue ? 'HOÀ!' : `ĐỘI ${red > blue ? 'ĐỎ' : 'XANH'} THẮNG!`, `${red} – ${blue}`, 1.8);
  } else { const w = ranking()[0]; bigText(w.isPlayer ? 'CHIẾN THẮNG!' : w.name + ' THẮNG!', '', 1.8); }
  Sound.go();
}
function showResult() {
  const r = ranking(), me = game.player, mapName = MAP_LIST.find(m => m.id === game.mapId).vn;
  if (game.mode === 'team') {
    const { red, blue } = game.teamScore;
    $('#resTitle').textContent = red === blue ? 'HOÀ!' : (red > blue) ? '🏆 ĐỘI BẠN THẮNG!' : 'Đội bạn thua rồi';
    $('#resSub').textContent = `Đỏ ${red} – ${blue} Xanh · Chiếm cờ · ${mapName}`;
  } else {
    const myRank = r.indexOf(me) + 1;
    $('#resTitle').textContent = myRank === 1 ? '🏆 BẠN THẮNG!' : `Hạng ${myRank} / ${r.length}`;
    $('#resSub').textContent = MODE_NAME[game.mode] + (game.mode === 'arena' ? ` · ${game.rounds} vòng` : '') + ' · ' + mapName;
  }
  $('#resTable').innerHTML = r.map((f, i) => `<tr class="${f.isPlayer ? 'me' : ''}"><td>${i + 1}. <span style="color:${f.color}">●</span> ${f.isPlayer ? f.name + ' (bạn)' : f.name}</td><td>${f.a.vn} · <small>${f.talent.vn}</small></td><td>${Math.floor(f.score)} điểm</td></tr>`).join('');
  showUI('result');
}

// ---------- UI ----------
let feedEls = [];
function feed(msg) {
  const el = document.createElement('div'); el.textContent = msg; $('#feed').appendChild(el); feedEls.push({ el, t:4 });
  if (feedEls.length > 5) feedEls.shift().el.remove();
}
let bigT = 0;
function bigText(a, b, t) { $('#big').textContent = a; $('#sub').textContent = b; bigT = t; }
function showUI(which) {
  $('#title').hidden = $('#menu').hidden = which !== 'menu';
  $('#hud').hidden = which === 'menu';
  $('#result').hidden = which !== 'result';
  $('#pause').hidden = which !== 'pause';
  tagLayer.hidden = which === 'menu';
}
function updateMenuName() { const a = ANIMALS[game.sel]; $('#animalName').innerHTML = `${a.name}<small>${a.vn}</small>`; }
function toMenu() {
  for (const f of game.fighters) f.dispose(); game.fighters = [];
  clearWorldObjects(); FLAGS.forEach(fl => fl.label.hidden = true);
  game.state = 'menu'; stage.visible = true; enterStageEnv(); showUI('menu'); bigText('', '', 0);
}
function enterStageEnv() { scene.background = STAGE_BG; scene.fog = null; hemi.color.set(0xffe9d6); hemi.groundColor.set(0x6a3a2a); hemi.intensity = 0.7; sun.intensity = 1.3; sun.color.set(0xfff0dc); rim.intensity = 0.8; rim.color.set(0xffc58a); scene.environmentIntensity = 0.3; }
$('#prev').onclick = () => { game.sel = (game.sel + ANIMALS.length - 1) % ANIMALS.length; updateMenuName(); Sound.init(); Sound.boop(); };
$('#next').onclick = () => { game.sel = (game.sel + 1) % ANIMALS.length; updateMenuName(); Sound.init(); Sound.boop(); };
$('#mapSeg').innerHTML = `<button data-v="random" class="on">Ngẫu nhiên</button>` + MAP_LIST.map(m => `<button data-v="${m.id}">${m.vn}</button>`).join('');
for (const seg of ['#modeSeg', '#botSeg', '#mapSeg']) $(seg).addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  $(seg).querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
  if (seg === '#modeSeg') { game.modePref = b.dataset.v; $('#modeDesc').textContent = MODE_DESC[b.dataset.v]; }
  else if (seg === '#mapSeg') { game.mapPref = b.dataset.v; const m = MAP_LIST.find(x => x.id === b.dataset.v); $('#modeDesc').textContent = m ? m.desc : 'Mỗi ván đổi bản đồ.'; }
  else game.bots = +b.dataset.v;
  Sound.init(); Sound.boop();
});
$('#modeDesc').textContent = MODE_DESC.random;
$('#muteBtn').onclick = () => { Sound.init(); Sound.toggle(); };
updateMuteBtn();
$('#play').onclick = () => { Sound.init(); startGame(); };
$('#again').onclick = () => startGame();
$('#toMenu').onclick = toMenu;
$('#resume').onclick = () => { game.state = game.prevState; showUI('hud'); };
$('#quit').onclick = toMenu;

function updateHUD() {
  const g = game, me = g.player;
  const tl = Math.max(0, LIMIT[g.mode] - g.time);
  $('#timer').textContent = g.state === 'countdown' ? `${Math.floor(LIMIT[g.mode] / 60)}:${String(LIMIT[g.mode] % 60).padStart(2, '0')}` : `${Math.floor(tl / 60)}:${String(Math.floor(tl % 60)).padStart(2, '0')}`;
  if (g.mode === 'arena') { $('#modeName').textContent = `ĐẤU TRƯỜNG · VÒNG ${g.round}/${g.rounds}`; $('#objective').textContent = 'Đẩy, vác, ném đối thủ khỏi sàn – trụ lại cuối cùng'; }
  else if (g.mode === 'koth') $('#objective').textContent = 'Đứng một mình trong vòng sáng để ghi điểm – 100 điểm thắng';
  else $('#objective').innerHTML = `<span class="ts" style="color:${TEAM.red.col}">${g.teamScore.red}</span> Đỏ – Xanh <span class="ts" style="color:${TEAM.blue.col}">${g.teamScore.blue}</span> · ` +
    FLAGS.map(fl => `<b style="color:${fl.owner ? TEAM[fl.owner].col : '#999'}">${fl.id}</b>`).join(' ');
  const rows = ranking();
  $('#board').innerHTML = rows.map(f => `<div class="r ${f.out && g.mode === 'arena' ? 'out' : ''} ${f.isPlayer ? 'me' : ''}"><span class="dot" style="background:${f.color}"></span><span class="nm">${f.isPlayer ? 'Bạn' : f.name}${f.downed ? ' 💫' : ''}</span><span class="hp"><i style="width:${f.hp}%"></i></span><b>${Math.floor(f.score)}</b></div>`).join('');
  $('#meHp i').style.width = me.hp + '%';
  $('#meSta i').style.width = me.stamina + '%'; $('#meSta i').style.background = me.sprintLock ? '#e8a33d' : '#ffc53d';
  $('#meBlk i').style.width = (me.block > 0 ? me.block / 1.5 * 100 : me.blockCd > 0 ? 0 : 100) + '%';
  const st = [];
  if (me.weapon) st.push(`${ITEM_INFO[me.weapon].vn}${me.weapon === 'bubble' ? ' ×' + me.ammo : ''} (đấm để dùng)`);
  if (me.holding) st.push('🏋️ Đang vác – đấm để ném!');
  if (me.heldBy) st.push('😵 Bị túm – bấm liên tục để thoát!');
  if (me.downed) st.push(`💫 Bị hạ gục ${Math.ceil(me.downT)}s`);
  if (me.shield) st.push('🛡 Khiên');
  if (me.speedT > 0) st.push(`👟 ${me.speedT.toFixed(1)}s`);
  if (me.trapped > 0) st.push('🫧 Bị nhốt!');
  if (me.inWater) st.push('💧 Dưới nước – đi chậm');
  if (g.mode === 'koth' && g.zone && g.zone.owner === me) st.push('📍 Đang chiếm +5/s');
  $('#meStatus').innerHTML = st.map(s => `<span>${s}</span>`).join('');
  let prompt = '';
  if (me.standing()) {
    for (const it of g.items) if (hyp(it.pos.x - me.pos.x, it.pos.z - me.pos.z) < 1.7) { prompt = 'E: nhặt ' + ITEM_INFO[it.type].vn; break; }
    if (!prompt && g.mode === 'team') { const mate = g.fighters.find(o => o !== me && o.team === me.team && o.downed && !o.heldBy && hyp(o.pos.x - me.pos.x, o.pos.z - me.pos.z) < 1.8); if (mate) prompt = `Giữ E: cứu ${mate.name} ${Math.round(mate.reviveP * 100)}%`; }
    if (!prompt && !me.holding) { const dn = g.fighters.find(o => me.isFoe(o) && o.downed && !o.heldBy && !o.out && hyp(o.pos.x - me.pos.x, o.pos.z - me.pos.z) < 1.8); if (dn) prompt = `Giữ U / chuột phải: vác ${dn.name}`; }
  }
  $('#prompt').hidden = !prompt; $('#prompt').textContent = prompt;
}

const _v = new V3();
function project(v) { _v.copy(v).project(camera); return _v.z > 1 ? null : { x:(_v.x + 1) / 2 * innerWidth, y:(1 - _v.y) / 2 * innerHeight }; }
function updateTags() {
  for (const f of game.fighters) {
    if (f.out) { f.tag.style.display = 'none'; continue; }
    const p = project(new V3(f.rpos.x, f.rpos.y + (f.downed || f.heldBy ? 1.6 : f.a.id === 'bunny' ? 3.1 : 2.55), f.rpos.z));
    if (!p) { f.tag.style.display = 'none'; continue; }
    f.tag.style.display = ''; f.tag.style.left = p.x + 'px'; f.tag.style.top = p.y + 'px';
    f.tagName.textContent = (f.isPlayer ? '▼ BẠN' : f.name) + (f.downed ? (f.reviveP > 0 ? ` 💚${Math.round(f.reviveP * 100)}%` : ' 💫') : '');
    f.tagHp.style.width = f.hp + '%';
  }
  if (game.mode === 'team') for (const fl of FLAGS) {
    const p = project(new V3(fl.x, fl.y + 4.2, fl.z)); fl.label.hidden = !p; if (!p) continue;
    fl.label.style.left = p.x + 'px'; fl.label.style.top = p.y + 'px';
    fl.label.style.background = fl.owner ? TEAM[fl.owner].col : '#8a8a8a';
  }
}

// ---------- Vong lap ----------
const STEP = 1 / 60;
const worldApi = {
  live:false,
  burst:(p, c, n, s, g, u) => burst(p.clone(), c, n, s, g, u),
  blast:(p, r, dmg, kb) => blast(p, r, dmg, kb),
  announce:() => { feed('☄️ Mưa thiên thạch!'); bigText('', '☄️ Mưa thiên thạch! Tránh các vòng đỏ!', 1.6); },
};
function readPlayer() {
  const p = game.player, i = p.input;
  i.x = (down('KeyD', 'ArrowRight') ? 1 : 0) - (down('KeyA', 'ArrowLeft') ? 1 : 0);
  i.z = (down('KeyS', 'ArrowDown') ? 1 : 0) - (down('KeyW', 'ArrowUp') ? 1 : 0);
  i.jump = hit('Space'); i.punch = hit('KeyJ', 'Mouse0'); i.kick = hit('KeyK');
  i.block = down('KeyL', 'KeyQ'); i.sprint = down('ShiftLeft', 'ShiftRight');
  i.grab = down('KeyU', 'MouseHeld2'); i.grabPress = hit('KeyU', 'Mouse2');
  i.interact = hit('KeyE'); i.use = down('KeyE'); i.aim = null;
  i.struggle = STRUGGLE_KEYS.filter(k => pressed.has(k)).length * 0.12;
  if (hit('KeyT')) bigText('✨ ' + p.talent.vn, p.talent.desc, 2);
}
function tick(dt) {
  const g = game;
  if (g.state === 'menu') return;
  if (g.state === 'paused') { if (hit('Escape')) { g.state = g.prevState; showUI('hud'); } return; }
  if (['play', 'countdown', 'roundEnd'].includes(g.state) && hit('Escape', 'KeyP')) { g.prevState = g.state; g.state = 'paused'; showUI('pause'); return; }
  if (g.state === 'countdown') {
    const before = Math.ceil(g.cd - 0.6); g.cd -= dt; const now = Math.ceil(g.cd - 0.6);
    if (now !== before && now > 0 && now <= 3) { bigText(String(now), g.round === 1 ? '✨ ' + g.player.talent.vn + ' – ' + g.player.talent.desc : '', 1); Sound.boop(); }
    if (g.cd <= 0.6 && before > 0) { bigText('ĐÁNH!', '', 0.8); Sound.go(); }
    if (g.cd <= 0) g.state = 'play';
  }
  worldApi.live = g.state === 'play';
  world.update(dt, worldApi);
  if (g.state === 'play') {
    g.time += dt;
    readPlayer();
    for (const f of g.fighters) if (!f.isPlayer) botThink(f, dt);
    tickMode(dt);
    if (g.player.out && g.mode === 'arena' && hit('Enter')) g.time = LIMIT.arena;
  } else for (const f of g.fighters) Object.assign(f.input, blankInput());

  for (const f of g.fighters) { f.prevPos.copy(f.pos); f.prevYaw = f.yaw; }
  for (const f of g.fighters) f.update(dt);
  for (const f of g.fighters) f.carry();

  const fs = g.fighters.filter(f => !f.out && !f.heldBy);
  for (let a = 0; a < fs.length; a++) for (let b = a + 1; b < fs.length; b++) {
    const A = fs[a], B = fs[b], dx = B.pos.x - A.pos.x, dz = B.pos.z - A.pos.z, d = hyp(dx, dz);
    if (d < 1.25 && Math.abs(A.pos.y - B.pos.y) < 1.6) {
      const push = (1.25 - d) / 2, nx = d > 0.001 ? dx / d : 1, nz = d > 0.001 ? dz / d : 0;
      const wa = 1 / A.a.weight, wb = 1 / B.a.weight, s = wa + wb;
      A.pos.x -= nx * push * 2 * (wb / s); A.pos.z -= nz * push * 2 * (wb / s);
      B.pos.x += nx * push * 2 * (wa / s); B.pos.z += nz * push * 2 * (wa / s);
    }
  }
  if (g.state === 'play') for (const f of g.fighters) {
    if (!f.atk || !f.standing()) continue;
    const A = ATK[f.atk.type];
    if (!A.range || f.atkT < A.wind || f.atkT >= A.wind + A.act) continue;
    const fw = f.forward();
    for (const o of g.fighters) {
      if (!canHit(f, o) || f.atk.hit.has(o)) continue;
      const dx = o.pos.x - f.pos.x, dz = o.pos.z - f.pos.z, d = hyp(dx, dz);
      if (d < A.range && Math.abs(o.pos.y - f.pos.y) < 1.6 && ((dx * fw.x + dz * fw.z) / (d || 1) > 0.35 || d < 0.9)) {
        f.atk.hit.add(o); applyHit(f, o, f.atk.type);
        if (f.atk && f.atk.type === 'dropkick') { f.vel.x *= -0.3; f.vel.z *= -0.3; }
        if (!f.atk) break;
      }
    }
  }
  if (g.state === 'play') checkEnd();
  if (g.state === 'roundEnd') { g.rt -= dt; if (g.rt <= 0) { if (g.round >= g.rounds) endMatch(); else { g.round++; setupRound(2.6); } } }
  if (g.state === 'end') { g.endT -= dt; if (g.endT <= 0 && $('#result').hidden) showResult(); }
}

let last = performance.now(), acc = 0, T = 0;
// tu ha chat luong neu may yeu: giam lop long + do phan giai
let perfEma = 1 / 60, perfSlowT = 0, perfLevel = 0;
function applyFurLevel() {
  const k = [1, 0.6, 0.4][perfLevel];
  scene.traverse(o => { if (o.isInstancedMesh && o.userData.furMax) o.count = Math.max(4, Math.ceil(o.userData.furMax * k)); });
}
function perfGuard(dt) {
  if (game.state !== 'play' || dt > 0.09) return;
  perfEma += (dt - perfEma) * 0.05;
  perfSlowT = perfEma > 0.024 ? perfSlowT + dt : 0;
  if (perfSlowT > 2 && perfLevel < 2) {
    perfLevel++; perfSlowT = 0; perfEma = 1 / 60;
    applyFurLevel();
    if (perfLevel === 2) { renderer.setPixelRatio(1); resize(); }
  }
}
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000); last = now; acc += dt; T += dt;
  perfGuard(dt);
  if (hitStop > 0) { hitStop -= dt; acc = 0; }
  else while (acc >= STEP) { tick(STEP); pressed.clear(); acc -= STEP; }
  render(dt, hitStop > 0 ? 1 : acc / STEP);
  requestAnimationFrame(frame);
}

function render(dt, alpha = 1) {
  const g = game;
  if (g.state === 'menu') {
    const sel = g.sel;
    lineup.forEach((m, i) => {
      const slot = (i - sel + ANIMALS.length) % ANIMALS.length;
      let tx, tz, ty = 0, ry;
      if (slot === 0) { tx = 0; tz = 1.6; ty = 0.35; ry = Math.sin(T * 0.8) * 0.35; }
      else { const k = slot <= 3 ? slot : slot - 6; tx = k * 2.0; tz = -1.2 - Math.abs(k) * 0.35; ry = -k * 0.18; }
      const px = m.root.position.x, pz = m.root.position.z;
      m.root.position.x += (tx - px) * Math.min(1, dt * 6);
      m.root.position.z += (tz - pz) * Math.min(1, dt * 6);
      const hop = slot === 0 ? Math.max(0, Math.sin(T * 3.2)) * 0.25 : 0;
      m.root.position.y = ty + hop;
      m.root.rotation.y = ry;
      const sc = slot === 0 ? 1.15 : 0.9; m.root.scale.setScalar(m.root.scale.x + (sc - m.root.scale.x) * Math.min(1, dt * 8));
      const mv = hyp(m.root.position.x - px, m.root.position.z - pz) / Math.max(dt, 1e-3);
      animateCritter(m, { speed:Math.min(mv, 6), fwd:0, yawRate:0, onGround:hop < 0.02, vy:Math.cos(T * 3.2) * 3, wave:slot === 0, happy:slot === 0 }, dt, T + i * 1.7);
    });
    bulbs.forEach((b, i) => b.material.color.setHex(((i + Math.floor(T * 6)) % 3 === 0) ? 0xfff2c4 : 0xd9a441));
    camera.position.set(STAGE.x + Math.sin(T * 0.25) * 0.6, STAGE.y + 1.7, STAGE.z + 10.5);
    camera.lookAt(STAGE.x, STAGE.y - 0.15, STAGE.z);
    sun.position.set(STAGE.x + 6, 18, STAGE.z + 14); sun.target.position.copy(STAGE);
    rim.position.set(STAGE.x - 6, 8, STAGE.z - 8); rim.target.position.copy(STAGE);
  } else {
    const p = g.player, target = new V3(), team = g.mode === 'team';
    if (p && !p.out) target.set(p.rpos.x * (team ? 0.9 : 0.75) + p.vel.x * 0.12, Math.max(0, p.rpos.y) * 0.6, p.rpos.z * (team ? 0.9 : 0.75) + p.vel.z * 0.12);
    g.focus.lerp(target, 1 - Math.exp(-3 * dt));
    const sx = shake > 0 ? rand(-1, 1) * shake : 0, sy = shake > 0 ? rand(-1, 1) * shake : 0; shake = Math.max(0, shake - dt * 1.5);
    const dist = (g.state === 'end' || (p && p.out) ? 1.2 : 1) * (team ? 1.08 : 1);
    camera.position.set(g.focus.x + sx, g.focus.y + 9.2 * dist + sy, g.focus.z + 14.5 * dist);
    camera.lookAt(g.focus.x, g.focus.y + 0.3, g.focus.z - 1.5);
    sun.position.set(g.focus.x + 12, 28, g.focus.z + 10); sun.target.position.copy(g.focus);
    rim.position.set(g.focus.x - 10, 10, g.focus.z - 16); rim.target.position.copy(g.focus);

    const shrinking = g.mode === 'arena' && g.R < ARENA_R + 0.01;
    barrier.visible = shrinking; barrier.scale.set(g.R, 1, g.R);
    barrier.material.opacity = 0.4 + Math.sin(T * 6) * 0.15;
    if (g.zone) {
      zoneG.position.set(g.zone.x, g.zone.y, g.zone.z); zoneG.scale.set(g.zone.r, 1, g.zone.r);
      const c = g.zone.owner ? g.zone.owner.color : g.zone.contested ? (Math.sin(T * 12) > 0 ? '#ff922b' : '#ffffff') : '#ffffff';
      zoneWall.material.color.set(c); zoneFloor.material.color.set(c);
      zoneWall.material.opacity = 0.18 + Math.sin(T * 3) * 0.06;
    }
    if (g.mode === 'team') for (const fl of FLAGS) {
      const tcol = fl.p > 0 ? TEAM.red.col : TEAM.blue.col;
      fl.disc.material.color.set(Math.abs(fl.p) > 0.02 ? tcol : '#ffffff'); fl.disc.material.opacity = 0.12 + Math.abs(fl.p) * 0.3;
      fl.floor.material.color.set(fl.contested ? (Math.sin(T * 12) > 0 ? '#ff922b' : '#ffffff') : fl.owner ? TEAM[fl.owner].col : '#ffffff');
      fl.clothMat.color.set(fl.owner ? TEAM[fl.owner].col : '#f1f1f1');
      const pos = fl.cloth.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) { const x = pos.getX(i); pos.setZ(i, Math.sin(T * 6 + x * 4) * 0.09 * (x + 0.6)); }
      pos.needsUpdate = true; fl.cloth.geometry.computeVertexNormals();
    }
    for (const it of g.items) { it.t += dt; const inner = it.mesh.userData.inner; inner.position.y = 0.8 + Math.sin(it.t * 3) * 0.15; inner.rotation.y = it.t * 2; }
    for (const f of g.fighters) f.animate(dt, T, alpha);
    updateTags();
    updateHUD();
  }
  updateFx(dt);
  for (const d of [...dmgTexts]) {
    d.life -= dt; d.pos.y += dt * 1.6; const p = project(d.pos);
    if (p) { d.el.style.left = p.x + 'px'; d.el.style.top = p.y + 'px'; } d.el.style.opacity = Math.min(1, d.life * 2);
    if (d.life <= 0) { d.el.remove(); dmgTexts.splice(dmgTexts.indexOf(d), 1); }
  }
  for (const f of [...feedEls]) { f.t -= dt; if (f.t <= 0) { f.el.remove(); feedEls.splice(feedEls.indexOf(f), 1); } }
  if (bigT > 0) { bigT -= dt; if (bigT <= 0) bigText('', '', 0); }
  composer.render(dt);
}

// khoi dong
enterStageEnv();
updateMenuName(); showUI('menu');
window.game = game; window.world = world; window.__dbg = { tick:(dt) => { tick(dt); pressed.clear(); }, startGame }; // de debug
requestAnimationFrame(frame);
