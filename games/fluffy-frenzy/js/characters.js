// Nhan vat thu bong + he thong chuyen dong
import { THREE, V3, rand, clampN, put, part } from './core.js';
import { buildCritter2 } from './critter2.js';

export const ANIMALS = [
  { id:'cat',   name:'Mochi',   vn:'Mèo cam',   body:0xf3a24f, belly:0xfff1dc, inner:0xf7b0b0, speed:1.05, jump:1.0,  weight:1.0  },
  { id:'dog',   name:'Biscuit', vn:'Cún',       body:0xe8913a, belly:0xffffff, inner:0xffffff, speed:1.0,  jump:1.0,  weight:0.95 },
  { id:'bunny', name:'Clover',  vn:'Thỏ',       body:0xf2edf0, belly:0xffffff, inner:0xf2a7bd, speed:1.08, jump:1.18, weight:1.08 },
  { id:'panda', name:'Bao',     vn:'Gấu trúc',  body:0xf7f6f0, belly:0xffffff, dark:0x2e2e33, limb:0x2e2e33, speed:0.92, jump:0.95, weight:0.82 },
  { id:'pig',   name:'Peaches', vn:'Heo hồng',  body:0xf5a3b2, belly:0xffc7d1, inner:0xe07b90, speed:0.97, jump:0.97, weight:0.9  },
  { id:'frog',  name:'Lily',    vn:'Ếch',       body:0x78c457, belly:0xe9f5b8, speed:1.02, jump:1.12, weight:1.0  },
];
export const COLLARS = ['#ffd23f', '#ff5d5d', '#4dabf7', '#69db7c', '#c77dff', '#ff922b', '#20c997', '#f783ac'];

// ---------- Vat lieu long mem (kieu thu bong) ----------
const FUR = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
  g.fillStyle = '#808080'; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 9000; i++) {
    const x = Math.random() * 256, y = Math.random() * 256, l = 90 + Math.random() * 90 | 0;
    g.strokeStyle = `rgb(${l},${l},${l})`; g.lineWidth = 1; g.beginPath(); g.moveTo(x, y); g.lineTo(x + rand(-1.5, 1.5), y + rand(2, 5)); g.stroke();
  }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 3); return t;
})();
const plushCache = new Map();
function plush(color, gloss) {
  const key = color + '|' + (gloss ? 1 : 0);
  if (!plushCache.has(key)) {
    const c = new THREE.Color(color);
    plushCache.set(key, gloss
      ? new THREE.MeshPhysicalMaterial({ color:c, roughness:0.2, clearcoat:1, clearcoatRoughness:0.06 })
      : new THREE.MeshPhysicalMaterial({ color:c, roughness:0.85, sheen:1, sheenRoughness:0.4, sheenColor:c.clone().lerp(new THREE.Color(0xffffff), 0.6), bumpMap:FUR, bumpScale:0.6 }));
  }
  return plushCache.get(key);
}
function pm(geo, color, opt = {}) { const m = new THREE.Mesh(geo, plush(color, opt.gloss)); m.castShadow = opt.shadow !== false; return m; }
const SPH = (r, w = 24, h = 18) => new THREE.SphereGeometry(r, w, h);
const BLUSH = new THREE.MeshBasicMaterial({ color:0xff8fa3, transparent:true, opacity:0.5, depthWrite:false });

// ---------- Long that (shell fur) + than mem rung (jiggle) ----------
const FURTEX = (() => {
  const S = 128, c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d'), img = g.createImageData(S, S);
  for (let i = 0; i < S * S; i++) { const v = Math.pow(Math.random(), 0.8) * 255; img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v; img.data[i * 4 + 3] = 255; }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
})();
const furTexCache = new Map();
function furTex(rx, ry) {
  const k = rx + 'x' + ry;
  if (!furTexCache.has(k)) { const t = FURTEX.clone(); t.repeat.set(rx, ry); t.needsUpdate = true; furTexCache.set(k, t); }
  return furTexCache.get(k);
}
const JIG_GLSL = `{ float jk = clamp((position.y + 0.6) / 1.2, 0.0, 1.0); transformed.z += uJig.x * jk * jk; transformed.y += uJig.y * jk; }`;
function furMat(color, len, layers, rx, ry, jig) {
  const mat = new THREE.MeshStandardMaterial({ color:new THREE.Color(color), roughness:0.92, alphaMap:furTex(rx, ry) });
  mat.onBeforeCompile = sh => {
    sh.uniforms.uLen = { value:len }; sh.uniforms.uLayers = { value:layers }; sh.uniforms.uJig = jig || { value:new THREE.Vector2() };
    sh.vertexShader = 'uniform float uLen; uniform float uLayers; uniform vec2 uJig; varying float vLayer;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      float layer = float(gl_InstanceID + 1) / uLayers;
      vLayer = layer;
      transformed += normalize(objectNormal) * uLen * layer;
      transformed.y -= uLen * 0.55 * layer * layer;
      ${JIG_GLSL}`);
    sh.fragmentShader = 'varying float vLayer;\n' + sh.fragmentShader.replace('#include <alphamap_fragment>', `
      float strand = texture2D(alphaMap, vAlphaMapUv).r;
      if (strand < vLayer * 0.97) discard;
      diffuseColor.rgb *= mix(0.6, 1.1, vLayer);
      diffuseColor.a = 1.0;`);
  };
  mat.customProgramCacheKey = () => 'fur-shell';
  return mat;
}
// boc long cho mot bo phan: N lop vo dung chung luoi (1 draw call)
function fur(mesh, color, len, layers, rx, ry, jig) {
  const im = new THREE.InstancedMesh(mesh.geometry, furMat(color, len, layers, rx, ry, jig), layers);
  const id = new THREE.Matrix4(); for (let i = 0; i < layers; i++) im.setMatrixAt(i, id);
  im.castShadow = false; im.receiveShadow = true; im.frustumCulled = false; im.userData.furMax = layers; mesh.add(im); return im;
}
function jiggleMat(base, jig) {
  const m = base.clone();
  m.onBeforeCompile = sh => {
    sh.uniforms.uJig = jig;
    sh.vertexShader = 'uniform vec2 uJig;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n' + JIG_GLSL);
  };
  m.customProgramCacheKey = () => 'jiggle';
  return m;
}

export function makeAnimal(a, collarColor) {
  if (a.id === 'cat') return buildCritter2(a, collarColor, newAnim);
  const root = new THREE.Group(), tumble = new THREE.Group(), rig = new THREE.Group();
  tumble.position.y = 0.85; rig.position.y = -0.85; root.add(tumble); tumble.add(rig);
  const limb = a.limb ?? a.body, paw = a.id === 'panda' ? a.dark : a.belly, dark = 0x1a1210;
  // than + bung + long nguc
  const jig = { value:new THREE.Vector2() };
  const body = put(rig, pm(SPH(0.62, 40, 30), a.body), 0, 0.72, 0); body.scale.set(1, 0.95, 0.9);
  body.material = jiggleMat(body.material, jig); fur(body, a.body, 0.075, 14, 3, 2, jig);
  const belly = put(rig, pm(SPH(0.47, 32, 24), a.belly, { shadow:false }), 0, 0.66, 0.33); belly.scale.set(1, 1.08, 0.62);
  belly.material = jiggleMat(belly.material, jig); fur(belly, a.belly, 0.06, 12, 3, 2, jig);
  for (let i = 0; i < 7; i++) { const u = (i - 3) / 3; put(rig, pm(new THREE.ConeGeometry(0.075, 0.2, 10), a.belly, { shadow:false }), u * 0.3, 1.0 - Math.abs(u) * 0.12, 0.5 - Math.abs(u) * 0.14, Math.PI + 0.4, 0, u * 0.35); }

  // dau (co pivot rieng o co de nghieng/gat)
  const head = put(rig, new THREE.Group(), 0, 1.12, 0);
  const skull = put(head, pm(SPH(0.6, 40, 30), a.body), 0, 0.42, 0); skull.scale.set(1.06, 0.93, 0.96);
  fur(skull, a.body, 0.05, 12, 3, 2);
  for (let i = -1; i <= 1; i++) put(head, pm(new THREE.ConeGeometry(0.07, 0.2, 8), a.body), i * 0.09, 0.93, 0.06, -0.25, 0, -i * 0.5);
  const eyes = [];
  const eye = (x, y, z, r) => {
    const g = put(head, new THREE.Group(), x, y, z + 0.035);
    put(g, pm(SPH(r, 18, 14), dark, { gloss:true, shadow:false })).scale.set(1, 1.12, 0.62);
    put(g, pm(SPH(r * 0.34, 10, 8), 0xffffff, { gloss:true, shadow:false }), r * 0.32, r * 0.42, r * 0.55);
    put(g, pm(SPH(r * 0.17, 8, 6), 0xffffff, { gloss:true, shadow:false }), -r * 0.28, -r * 0.35, r * 0.58);
    eyes.push(g); return g;
  };
  if (a.id === 'frog') {
    for (const s of [-1, 1]) {
      put(head, pm(SPH(0.2), a.body), s * 0.26, 0.82, 0.22);
      put(head, pm(SPH(0.15, 18, 14), 0xffffff, { gloss:true, shadow:false }), s * 0.26, 0.84, 0.33);
      eye(s * 0.26, 0.84, 0.45, 0.085);
    }
    put(head, pm(new THREE.TorusGeometry(0.24, 0.022, 6, 24, Math.PI), 0x3a2219, { shadow:false }), 0, 0.3, 0.565, 0.2, 0, Math.PI).scale.set(1, 0.45, 1);
  } else {
    if (a.id === 'panda') for (const s of [-1, 1]) { const p = put(head, pm(SPH(0.14, 16, 12), a.dark, { shadow:false }), s * 0.21, 0.45, 0.5, 0, 0, s * 0.5); p.scale.set(1, 1.35, 0.5); }
    for (const s of [-1, 1]) eye(s * 0.21, 0.47, 0.51, 0.095);
  }
  for (const s of [-1, 1]) { const b = put(head, new THREE.Mesh(SPH(0.09, 12, 8), BLUSH), s * 0.35, 0.3, 0.505); b.scale.set(1, 0.6, 0.35); }
  // mom, mui
  if (a.id === 'pig') {
    const sn = put(head, pm(new THREE.CylinderGeometry(0.17, 0.19, 0.16, 24), a.inner), 0, 0.29, 0.59, Math.PI / 2, 0, 0); sn.scale.set(1.2, 1, 0.85);
    for (const s of [-1, 1]) put(head, pm(SPH(0.035, 8, 6), 0x7a3040, { shadow:false }), s * 0.065, 0.29, 0.675);
    put(head, pm(new THREE.TorusGeometry(0.045, 0.012, 6, 12, Math.PI), 0x3a2219, { shadow:false }), 0, 0.15, 0.565, 0, 0, Math.PI);
  } else if (a.id !== 'frog') {
    const sn = put(head, pm(SPH(0.2, 24, 18), a.belly), 0, 0.28, 0.53); sn.scale.set(1.25, 0.82, 0.75); fur(sn, a.belly, 0.022, 6, 2, 1);
    put(head, pm(SPH(0.058, 12, 8), a.id === 'bunny' ? 0xf28aa8 : 0x2b1a14, { gloss:true, shadow:false }), 0, 0.335, 0.68);
    put(head, pm(new THREE.TorusGeometry(0.045, 0.012, 6, 12, Math.PI), 0x3a2219, { shadow:false }), 0, 0.15, 0.635, 0, 0, Math.PI);
  }
  // tai (moi tai co pivot de lac theo quan tinh)
  const ears = [];
  const ear = (x, y, z, rx, rz, build) => { const piv = put(head, new THREE.Group(), x, y, z, rx, 0, rz); build(piv); ears.push({ piv, bx:rx, bz:rz }); };
  if (a.id === 'cat' || a.id === 'dog') {
    const big = a.id === 'dog';
    for (const s of [-1, 1]) ear(s * 0.3, 0.84, 0.02, 0, -s * 0.32, p => {
      put(p, pm(new THREE.ConeGeometry(big ? 0.21 : 0.18, big ? 0.42 : 0.34, 16), a.body), 0, big ? 0.17 : 0.13, 0);
      put(p, pm(new THREE.ConeGeometry(big ? 0.13 : 0.11, big ? 0.3 : 0.24, 12), a.inner, { shadow:false }), 0, big ? 0.14 : 0.11, 0.07);
    });
  }
  if (a.id === 'bunny') for (const s of [-1, 1]) ear(s * 0.17, 0.9, -0.02, 0, -s * 0.12, p => {
    put(p, pm(new THREE.CapsuleGeometry(0.12, 0.5, 6, 14), a.body), 0, 0.36, 0);
    put(p, pm(new THREE.CapsuleGeometry(0.06, 0.38, 6, 10), a.inner, { shadow:false }), 0, 0.36, 0.075);
  });
  if (a.id === 'panda') for (const s of [-1, 1]) ear(s * 0.4, 0.8, 0, 0, 0, p => put(p, pm(SPH(0.17, 16, 12), a.dark), 0, 0.05, 0));
  if (a.id === 'pig') for (const s of [-1, 1]) ear(s * 0.34, 0.78, 0.12, 0.8, -s * 0.35, p => put(p, pm(new THREE.ConeGeometry(0.17, 0.3, 14), a.body), 0, 0.13, 0));
  // duoi
  const tail = put(rig, new THREE.Group(), 0, 0.45, -0.5);
  if (a.id === 'cat') tail.add(pm(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new V3(0, 0, 0), new V3(0, 0.08, -0.38), new V3(0, 0.45, -0.5), new V3(0.05, 0.75, -0.36)]), 20, 0.075, 10), a.body));
  if (a.id === 'dog') put(tail, pm(new THREE.TorusGeometry(0.16, 0.075, 10, 18, Math.PI * 1.5), a.body), 0, 0.3, -0.12, 0, Math.PI / 2, 0);
  if (a.id === 'bunny') fur(put(tail, pm(SPH(0.15), 0xffffff), 0, 0.02, -0.05), 0xffffff, 0.08, 12, 2, 1);
  if (a.id === 'panda') put(tail, pm(SPH(0.11), a.dark), 0, 0, -0.06);
  if (a.id === 'pig') put(tail, pm(new THREE.TorusGeometry(0.09, 0.035, 8, 16), a.inner), 0, 0.1, -0.08, 0, Math.PI / 2, 0);
  // vong co + chuong
  const collarMat = new THREE.MeshPhysicalMaterial({ color:collarColor, roughness:0.45, clearcoat:0.4 });
  const collar = put(rig, new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.065, 12, 40), collarMat), 0, 1.1, 0, Math.PI / 2, 0, 0); collar.castShadow = true;
  put(rig, pm(SPH(0.08, 14, 10), 0xffc93c, { gloss:true }), 0, 1.02, 0.585);
  // tay, chan
  const arms = [-1, 1].map(s => {
    const piv = put(rig, new THREE.Group(), s * 0.53, 0.98, 0.08);
    fur(put(piv, pm(new THREE.CapsuleGeometry(0.14, 0.2, 10, 16), limb), 0, -0.17, 0), limb, 0.045, 9, 2, 1);
    fur(put(piv, pm(SPH(0.16, 20, 14), paw), 0, -0.36, 0.02), paw, 0.035, 8, 2, 1);
    return piv;
  });
  const legs = [-1, 1].map(s => {
    const piv = put(rig, new THREE.Group(), s * 0.26, 0.3, 0.06);
    fur(put(piv, pm(new THREE.CapsuleGeometry(0.17, 0.06, 10, 16), limb), 0, -0.07, 0), limb, 0.045, 9, 2, 1);
    const foot = put(piv, pm(SPH(0.19, 20, 14), paw), 0, -0.19, 0.08); foot.scale.set(1, 0.62, 1.25); fur(foot, paw, 0.03, 7, 2, 1);
    return piv;
  });
  // hieu ung gan theo nhan vat
  const shield = put(root, new THREE.Mesh(new THREE.SphereGeometry(1.35, 24, 16), new THREE.MeshBasicMaterial({ color:0x7fd4ff, transparent:true, opacity:0.3, depthWrite:false })), 0, 1.05, 0);
  const ring = put(root, new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.06, 8, 32), new THREE.MeshBasicMaterial({ color:0xffd23f })), 0, 1, 0, Math.PI / 2, 0, 0);
  const bubble = put(root, new THREE.Mesh(new THREE.SphereGeometry(1.5, 24, 16), new THREE.MeshBasicMaterial({ color:0xff9ed2, transparent:true, opacity:0.35, depthWrite:false })), 0, 1.05, 0);
  const hammer = new THREE.Group();
  put(hammer, part(new THREE.CylinderGeometry(0.05, 0.05, 0.9, 8), 0x8b5a2b), 0, -0.45, 0);
  put(hammer, part(new THREE.CylinderGeometry(0.24, 0.24, 0.5, 16), 0xe03131), 0, -0.95, 0, 0, 0, Math.PI / 2);
  put(arms[1], hammer, 0, -0.36, 0);
  const gun = new THREE.Group();
  put(gun, part(new THREE.SphereGeometry(0.2, 14, 10), 0xf783ac), 0, -0.46, 0.1);
  put(gun, part(new THREE.CylinderGeometry(0.07, 0.09, 0.4, 10), 0x4dabf7), 0, -0.71, 0.1);
  put(arms[1], gun, 0, 0, 0);
  const dizzy = new THREE.Group(); dizzy.position.y = 2.4; root.add(dizzy);
  for (let i = 0; i < 3; i++) put(dizzy, new THREE.Mesh(new THREE.OctahedronGeometry(0.12), new THREE.MeshBasicMaterial({ color:0xffe066 })), Math.cos(i * 2.09) * 0.45, 0, Math.sin(i * 2.09) * 0.45);
  shield.visible = ring.visible = bubble.visible = hammer.visible = gun.visible = dizzy.visible = false;
  return { root, tumble, rig, head, jig, eyes, ears, tail, arms, legs, shield, ring, bubble, hammer, gun, dizzy, collar, collarMat, anim:newAnim() };
}

// ---------- He thong chuyen dong (lo xo vat ly: lac lu, mem oat, nga lan) ----------
const BASE_POSE = { rigX:0, rigY:0, rigZ:0, rigPy:0, headX:0, headY:0, headZ:0, aLx:0, aLz:-0.2, aRx:0, aRz:0.2, lLx:0, lRx:0 };
function newAnim() {
  const z = () => ({ x:0, v:0 });
  const sp = {}; for (const k in BASE_POSE) sp[k] = { x:BASE_POSE[k], v:0 };
  return { sp, phase:0, w:0, sq:{ x:1, v:0 }, hit:z(), ear:z(), earS:z(), tail:z(), leanX:z(), leanZ:z(), pitch:z(), roll:z(),
           eyeS:1, blinkT:rand(1, 4), blink:0, lookT:0, lookY:0, prevGround:true, prevVy:0, prevFwd:0, prevBob:0, wasTumble:false, jx:z(), jy:z() };
}
function spring(s, target, k, c, dt) { s.v += (-k * (s.x - target) - c * s.v) * dt; s.x += s.v * dt; }
const wrapTo = (x, t) => t + Math.atan2(Math.sin(x - t), Math.cos(x - t));

// s: { speed, fwd, yawRate, onGround, vy, sprint, atk, lying, flail, holding, grabbing, reviving, block, stun, tumble,
//      trapped, gun, wave, hitImpulse, knock:{fwd,side}, squint, happy }
export function animateCritter(m, s, dt, t) {
  dt = Math.min(dt, 1 / 20);
  const steps = dt > 1 / 50 ? 2 : 1;
  for (let i = 0; i < steps; i++) stepAnim(m, s, dt / steps, t, i === 0);
}

function stepAnim(m, s, dt, t, first) {
  const A = m.anim;
  const T = { ...BASE_POSE };
  const w = Math.min(1, s.speed / 5.5);
  A.w += ((s.onGround && !s.lying && !s.tumble ? w : 0) - A.w) * Math.min(1, dt * 9);
  A.phase += s.speed * dt * (s.sprint ? 2.6 : 2.3);
  let cyc = 1, sqT = 1;

  // ---- tu the dich ----
  A.lookT -= dt; if (A.lookT <= 0) { A.lookT = rand(1.5, 4); A.lookY = Math.random() < 0.45 ? 0 : rand(-0.55, 0.55); }
  T.headY = A.lookY * (1 - A.w);
  T.rigX = clampN(s.fwd * 0.035, -0.15, 0.32) + (s.sprint ? 0.18 : 0);
  T.headX = -T.rigX * 0.6 + (1 - A.w) * Math.sin(t * 1.3) * 0.05;
  T.headZ = (1 - A.w) * Math.sin(t * 0.9) * 0.07;
  T.aLz = -0.22 - Math.sin(t * 2.4) * 0.06; T.aRz = 0.22 + Math.sin(t * 2.4) * 0.06;
  if (!s.onGround && !s.lying) {
    T.aLz = -1.3 + Math.sin(t * 14) * 0.15; T.aRz = 1.3 - Math.sin(t * 14) * 0.15; T.aLx = -0.35; T.aRx = -0.35;
    T.lLx = 0.6; T.lRx = -0.3; T.headX = s.vy > 0 ? -0.2 : 0.15;
    sqT = 1 + clampN(s.vy * 0.016, -0.12, 0.16);
  }
  if (s.gun) { T.aRx = -1.2; T.aRz = 0.05; }
  if (s.atk) {
    cyc = 0.35;
    const p = s.atk.p, q = Math.max(0, p);
    if (s.atk.type === 'punch') {
      const k = s.atk.side ? 'aR' : 'aL', o = s.atk.side ? 'aL' : 'aR', sg = s.atk.side ? -1 : 1;
      T[k + 'x'] = -1.75 * p; T[k + 'z'] = 0; T[o + 'x'] = -0.75; T[o + 'z'] = -sg * 0.45;
      T.rigY = sg * (0.45 * q + 0.35 * Math.min(0, p)); T.rigX = 0.14 * q; T.headY = -T.rigY * 0.5; sqT = 1 - 0.05 * q;
    } else if (s.atk.type === 'kick') {
      T.lRx = -1.75 * p; T.lLx = 0.15 * q; T.rigX = -0.3 * q; T.aLz = -1.0; T.aRz = 1.0; T.headX = 0.15 * q;
    } else if (s.atk.type === 'dropkick') {
      T.rigX = -1.25 * q; T.lLx = -1.5 * q; T.lRx = -1.5 * q; T.aLz = -1.35; T.aRz = 1.35; T.aLx = 0.6; T.aRx = 0.6; T.rigPy = 0.5 * q;
    } else if (s.atk.type === 'hammer') {
      T.aRx = s.atk.ham; T.aRz = 0; T.aLx = s.atk.ham * 0.8; T.aLz = 0; T.rigX = s.atk.wind ? -0.28 : 0.42 * q; T.headX = s.atk.wind ? -0.2 : 0.2;
    } else if (s.atk.type === 'bubble') { T.aRx = -1.55; T.aRz = 0; T.rigX = -0.08; }
  }
  if (s.holding) { T.aLx = -2.95; T.aRx = -2.95; T.aLz = -0.15; T.aRz = 0.15; T.rigX = -0.14 + (s.sprint ? 0.1 : 0); T.headX = 0.12; sqT = 0.96; }
  else if (s.grabbing) { T.aLx = -1.55; T.aRx = -1.55; T.aLz = 0.3; T.aRz = -0.3; T.rigX = 0.24; }
  if (s.reviving) { cyc = 0; T.rigX = 0.5; T.headX = 0.3; T.aLx = -1.1 - Math.abs(Math.sin(t * 10)) * 0.5; T.aRx = -1.1 - Math.abs(Math.cos(t * 10)) * 0.5; T.aLz = 0.2; T.aRz = -0.2; }
  if (s.block) { T.aLx = -1.45; T.aRx = -1.45; T.aLz = 0.6; T.aRz = -0.6; T.rigX = -0.05; T.headX = 0.22; sqT = 0.92; }
  if (s.stun && s.onGround) { T.rigX = -0.25; T.headZ = Math.sin(t * 6) * 0.3; T.aLz = -0.8; T.aRz = 0.8; T.lLx = 0.2; T.lRx = -0.2; }
  if (s.tumble) { T.aLz = -1.6 + Math.sin(t * 13) * 0.5; T.aRz = 1.6 - Math.sin(t * 11) * 0.5; T.aLx = -0.6; T.aRx = -0.6; T.lLx = -0.6 + Math.sin(t * 12) * 0.6; T.lRx = 0.4 - Math.sin(t * 12) * 0.6; T.headX = 0; }
  if (s.trapped) { T.rigZ = Math.sin(t * 4) * 0.3; T.aLz = -1.2 - Math.sin(t * 10) * 0.3; T.aRz = 1.2 + Math.sin(t * 10) * 0.3; T.lLx = Math.sin(t * 9) * 0.5; T.lRx = -Math.sin(t * 9) * 0.5; }
  if (s.lying) {
    cyc = 0;
    const f = s.flail ? 1 : 0.1;
    T.rigX = 0; T.rigY = 0; T.rigZ = 0; T.rigPy = 0;
    T.aLz = -1.35 + Math.sin(t * 12) * 0.45 * f; T.aRz = 1.35 - Math.sin(t * 12) * 0.45 * f; T.aLx = -0.3; T.aRx = -0.3;
    T.lLx = 0.3 + Math.sin(t * 10) * 0.7 * f; T.lRx = 0.3 - Math.sin(t * 10) * 0.7 * f;
    T.headY = Math.sin(t * 8) * 0.45 * f; T.headX = 0; T.headZ = 0;
  }
  if (s.wave) { T.aLx = -2.75; T.aLz = -0.25 + Math.sin(t * 9) * 0.35; T.headZ = Math.sin(t * 2) * 0.12; T.headY = 0; }

  // chu ky buoc: tay + dau dua vao lo xo -> theo sau than mot nhip (follow-through)
  const sn = Math.sin(A.phase), cs = Math.cos(A.phase), W = A.w * cyc, run = s.sprint ? 1.4 : 1;
  const bob = Math.abs(cs) * 0.1 * W * run;
  if (!s.wave) T.aLx += -sn * 0.95 * W * run;
  T.aRx += sn * 0.95 * W * run;
  T.aLz -= bob * 0.9; T.aRz += bob * 0.9;
  sqT -= (1 - Math.abs(cs)) * 0.045 * W;
  T.headX -= bob * 1.1; T.headY -= sn * 0.12 * W; T.headZ -= sn * 0.08 * W;

  // ---- lo xo cho tung khop (hoi nay -> qua da nhe, mem mai) ----
  let K = 230, Z = 0.6;
  if (s.atk) { K = 950; Z = 0.85; }
  if (s.grabbing || s.block || s.holding) { K = 520; Z = 0.8; }
  if (s.stun || s.tumble || s.trapped) { K = 50; Z = 0.38; }
  if (s.lying) { K = 65; Z = 0.42; }
  const C = 2 * Math.sqrt(K) * Z;
  for (const k in T) spring(A.sp[k], T[k], K, C, dt);
  const c = {}; for (const k in A.sp) c[k] = A.sp[k].x;

  // ---- xung luc: trung don, tiep dat ----
  if (first) {
    if (s.knock) { A.pitch.v += clampN(s.knock.fwd, -22, 22) * 0.55; A.roll.v += clampN(-s.knock.side, -22, 22) * 0.55; A.sq.v -= 2.5; }
    if (s.hitImpulse) { A.hit.v -= 10; A.sq.v -= 3; A.ear.v += 5; }
    if (s.onGround && !A.prevGround && A.prevVy < -5) { A.sq.v -= Math.min(8, -A.prevVy * 0.45); A.ear.v -= 3; A.jy.v -= Math.min(3, -A.prevVy * 0.25); }
    if (s.hitImpulse) { A.jx.v -= 1.6; A.jy.v -= 1.0; }
    A.prevGround = s.onGround; A.prevVy = s.vy;
  }
  spring(A.sq, sqT, 260, 11, dt); A.sq.x = clampN(A.sq.x, 0.68, 1.28);
  spring(A.hit, 0, 170, 10, dt); A.hit.x = clampN(A.hit.x, -0.7, 0.7);

  // ---- nga lan (than quay quanh tam co the) ----
  if (s.tumble) {
    const dmp = Math.exp(-0.7 * dt); A.pitch.v *= dmp; A.roll.v *= dmp;
    A.pitch.x += A.pitch.v * dt; A.roll.x += A.roll.v * dt; A.wasTumble = true;
  } else {
    const pT = s.lying ? (Math.sin(A.pitch.x) > 0.3 ? 1.45 : -1.45) : 0;
    if (A.wasTumble) { A.pitch.x = wrapTo(A.pitch.x, pT); A.roll.x = wrapTo(A.roll.x, 0); A.wasTumble = false; }
    spring(A.pitch, pT, s.lying ? 55 : 85, s.lying ? 8 : 11, dt);
    spring(A.roll, 0, 85, 11, dt);
  }

  // ---- lac lu theo gia toc (than tre theo quan tinh) ----
  const fwdAcc = (s.fwd - A.prevFwd) / Math.max(dt, 1e-3); A.prevFwd = s.fwd;
  A.leanX.v += clampN(-fwdAcc, -80, 80) * 0.018 * (s.onGround ? 1 : 0.3);
  spring(A.leanX, 0, 110, 8, dt); A.leanX.x = clampN(A.leanX.x, -0.45, 0.45);
  spring(A.leanZ, clampN(-s.yawRate * 0.06, -0.35, 0.35) * A.w, 95, 8, dt);
  // than mem: rung theo quan tinh va nhun theo buoc chan
  A.jx.v += clampN(-fwdAcc, -80, 80) * 0.005;
  spring(A.jx, 0, 85, 4.5, dt); A.jx.x = clampN(A.jx.x, -0.1, 0.1);
  spring(A.jy, -bob * 0.4, 150, 6, dt); A.jy.x = clampN(A.jy.x, -0.12, 0.08);
  if (m.jig) m.jig.value.set(A.jx.x, A.jy.x);
  if (m.belly) m.belly.position.set(m.bellyRest.x, m.bellyRest.y + A.jy.x * 0.9, m.bellyRest.z + A.jx.x * 1.1);

  // ---- ap dung ----
  const lie = Math.min(1, Math.abs(Math.sin(A.pitch.x)) + Math.abs(Math.sin(A.roll.x)));
  m.tumble.rotation.set(A.pitch.x, 0, A.roll.x);
  m.tumble.position.y = 0.85 - 0.3 * lie;
  m.rig.rotation.set(c.rigX + A.hit.x + A.leanX.x, c.rigY + sn * 0.13 * W, c.rigZ + A.leanZ.x + sn * 0.12 * W);
  m.rig.position.set(sn * 0.04 * W, -0.85 + c.rigPy + bob, 0);
  const breathe = 1 + Math.sin(t * 2.6) * 0.02 * (1 - A.w);
  const sq = A.sq.x * breathe;
  m.rig.scale.set(1 / Math.sqrt(sq), sq, 1 / Math.sqrt(sq));
  m.head.rotation.set(c.headX - A.leanX.x * 0.7, c.headY, c.headZ - A.leanZ.x * 0.5);
  const ab = m.armBias || 0;
  m.arms[0].rotation.set(c.aLx, 0, c.aLz - ab);
  m.arms[1].rotation.set(c.aRx, 0, c.aRz + ab);
  // chan bam theo mat dat (khong qua lo xo) + nhac chan khi buoc toi
  const amp = (s.sprint ? 1.1 : 0.85) * W;
  m.legs[0].rotation.x = c.lLx + sn * amp; m.legs[0].position.y = 0.3 + Math.max(0, -cs) * 0.1 * W * run;
  m.legs[1].rotation.x = c.lRx - sn * amp; m.legs[1].position.y = 0.3 + Math.max(0, cs) * 0.1 * W * run;

  // ---- tai + duoi lac theo quan tinh ----
  const bobV = (bob - A.prevBob) / Math.max(dt, 1e-3); A.prevBob = bob;
  A.ear.v += (-fwdAcc * 0.01 - bobV * 0.9 - A.pitch.v * 0.4) * dt * 10;
  spring(A.ear, 0, 130, 6.5, dt); A.ear.x = clampN(A.ear.x, -0.9, 0.9);
  spring(A.earS, clampN(s.yawRate * 0.05, -0.5, 0.5) + c.headZ * 0.5 - A.roll.v * 0.03, 110, 7, dt);
  for (const e of m.ears) { e.piv.rotation.x = e.bx + A.ear.x; e.piv.rotation.z = e.bz + A.earS.x; }
  const wag = Math.sin(t * (s.happy || A.w > 0.3 ? 11 : 4)) * (s.happy ? 0.6 : 0.3);
  spring(A.tail, wag, 120, 7, dt);
  m.tail.rotation.set(-A.ear.x * 0.7, A.tail.x, 0);

  // ---- mat ----
  A.blinkT -= dt; if (A.blinkT <= 0) { A.blink = 0.13; A.blinkT = rand(2, 5); }
  A.blink -= dt;
  const eyeT = s.squint || s.tumble ? 0.16 : A.blink > 0 ? 0.1 : 1;
  A.eyeS += (eyeT - A.eyeS) * Math.min(1, dt * 35);
  for (const e of m.eyes) e.scale.y = A.eyeS;
  // bieu cam khuon mat
  if (m.face) {
    const ex = (s.lying || s.tumble || s.trapped || (s.stun && !s.atk)) ? 'hurt' : (s.atk || s.holding || s.grabbing || s.block) ? 'shout' : (s.happy || s.wave) ? 'happy' : 'calm';
    m.face.set(ex);
  }
}
