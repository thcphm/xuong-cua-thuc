// Nhan vat the he 2: mot khoi lien mach (metaball -> marching cubes) + bo xuong (skinning) + trang phuc + bieu cam
import { MarchingCubes } from 'three/addons/objects/MarchingCubes.js';
import { THREE, V3, rand, put, part, canvasTex } from './core.js';

const ISO = 80, SUB = 12;
const bakeCache = new Map();
// xuong: 0 rig(goc o ban chan), 1 dau, 2 tay trai(-x), 3 tay phai(+x), 4 chan trai, 5 chan phai, 6 bung, 7 duoi
const ARM_BIND = 0.75;
const BONE_POS = [[0, 0, 0], [0, 1.12, 0], [-0.5, 1.0, 0.08], [0.5, 1.0, 0.08], [-0.25, 0.3, 0.06], [0.25, 0.3, 0.06], [0, 0.66, 0.25], [0, 0.45, -0.5]];

// ---------- hinh khoi (cac qua cau hoa vao nhau) ----------
function catSpec(a) {
  const O = a.body, C = a.belly, balls = [];
  const B = (p, r, col, bone) => balls.push({ p:p.clone ? p.clone() : new V3(...p), r, col:new THREE.Color(col), bone });
  // than
  B([0, 0.5, 0], 0.44, O, 0); B([0, 0.82, -0.02], 0.47, O, 0); B([0, 0.64, 0.2], 0.4, C, 6);
  // dau: so + tran + 2 ma phinh + mom
  B([0, 1.55, 0], 0.53, O, 1); B([0, 1.72, -0.03], 0.42, O, 1);
  B([-0.27, 1.38, 0.24], 0.24, C, 1); B([0.27, 1.38, 0.24], 0.24, C, 1); B([0, 1.36, 0.36], 0.19, C, 1);
  for (const s of [-1, 1]) {
    // tay (luc gan xuong: chech ra ngoai de khong dinh vao than)
    const sh = new V3(s * 0.5, 1.0, 0.08), d = new V3(s * Math.sin(ARM_BIND), -Math.cos(ARM_BIND), 0), bone = s < 0 ? 2 : 3;
    B(sh.clone().addScaledVector(d, 0.1), 0.17, O, bone);
    B(sh.clone().addScaledVector(d, 0.28), 0.155, O, bone);
    B(sh.clone().addScaledVector(d, 0.45), 0.175, C, bone);
    // chan ngan + ban chan
    const lb = s < 0 ? 4 : 5;
    B([s * 0.25, 0.22, 0.04], 0.19, O, lb); B([s * 0.26, 0.12, 0.13], 0.17, C, lb);
  }
  return { balls, base:new THREE.Color(O), stripes:true };
}

function bake(spec) {
  // truong khoang cach co dau (SDF): hop cac qua cau bang "smooth-min" -> moi phan giu dung kich thuoc, cho noi bo tron
  const RES = 84, S = 2.6, CEN = new V3(0, 1.1, 0.05), K = 0.09;
  const mc = new MarchingCubes(RES, new THREE.MeshBasicMaterial(), false, false, 600000);
  mc.isolation = ISO; mc.reset();
  const balls = spec.balls, nb = balls.length, half = RES / 2;
  const smin = (a, b) => { const h = Math.max(K - Math.abs(a - b), 0) / K; return Math.min(a, b) - h * h * K * 0.25; };
  for (let z = 0; z < RES; z++) for (let y = 0; y < RES; y++) for (let x = 0; x < RES; x++) {
    const wx = CEN.x + (x - half) / half * S / 2, wy = CEN.y + (y - half) / half * S / 2, wz = CEN.z + (z - half) / half * S / 2;
    let d = 9;
    for (let k = 0; k < nb; k++) { const b = balls[k]; d = smin(d, Math.hypot(wx - b.p.x, (wy - b.p.y) / (b.sy || 1), wz - b.p.z) - b.r); }
    mc.field[x + y * RES + z * RES * RES] = ISO - d * 600;
  }
  mc.update();
  const n = mc.count, P = mc.geometry.attributes.position.array, N = mc.geometry.attributes.normal.array;
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3);
  const si = new Uint16Array(n * 4), sw = new Float32Array(n * 4), wB = new Float32Array(BONE_POS.length), dk = new Float32Array(nb);
  const dark = spec.base.clone().multiplyScalar(0.72);
  for (let i = 0; i < n; i++) {
    const x = P[i * 3] * S / 2 + CEN.x, y = P[i * 3 + 1] * S / 2 + CEN.y, z = P[i * 3 + 2] * S / 2 + CEN.z;
    pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
    const l = Math.hypot(N[i * 3], N[i * 3 + 1], N[i * 3 + 2]) || 1;
    nor[i * 3] = N[i * 3] / l; nor[i * 3 + 1] = N[i * 3 + 1] / l; nor[i * 3 + 2] = N[i * 3 + 2] / l;
    let dmin = 9;
    for (let k = 0; k < nb; k++) { const b = balls[k]; dk[k] = Math.hypot(x - b.p.x, (y - b.p.y) / (b.sy || 1), z - b.p.z) - b.r; dmin = Math.min(dmin, dk[k]); }
    // trong so xuong (mem, rong) + mau (sac net hon) theo khoang cach toi tung qua cau
    wB.fill(0); let cr = 0, cg = 0, cb = 0, ct = 0;
    for (let k = 0; k < nb; k++) {
      const e = dk[k] - dmin, b = balls[k];
      const ws = Math.exp(-e / 0.07); wB[b.bone] += ws;
      const wc = Math.exp(-e / 0.025); cr += b.col.r * wc; cg += b.col.g * wc; cb += b.col.b * wc; ct += wc;
    }
    let r = cr / ct, g = cg / ct, bb = cb / ct;
    if (spec.stripes && Math.abs(r - spec.base.r) + Math.abs(g - spec.base.g) < 0.08) {
      const onHead = y > 1.72 && z < 0.42 && Math.sin(x * 21) > 0.45;
      const onBack = z < -0.15 && y > 0.45 && y < 1.15 && Math.sin(y * 17) > 0.55;
      if (onHead || onBack) { r = dark.r; g = dark.g; bb = dark.b; }
    }
    col[i * 3] = r; col[i * 3 + 1] = g; col[i * 3 + 2] = bb;
    const idx = [...wB.keys()].sort((p, q) => wB[q] - wB[p]).slice(0, 4);
    let tot = 0; for (const k of idx) tot += wB[k];
    idx.forEach((k, j) => { si[i * 4 + j] = k; sw[i * 4 + j] = wB[k] / tot; });
  }
  mc.geometry.dispose();
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4));
  geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4));
  geo.computeBoundingSphere();
  return geo;
}

// ---------- vat lieu ----------
let MAT = null;
function mats() {
  if (MAT) return MAT;
  const check = canvasTex(128, (g, s) => { g.fillStyle = '#fbf3e6'; g.fillRect(0, 0, s, s); g.fillStyle = 'rgba(214,72,60,0.85)'; for (let i = 0; i < 8; i += 2) { g.fillRect(i * s / 8, 0, s / 8, s); g.fillRect(0, i * s / 8, s, s / 8); } }, 1);
  check.repeat.set(5, 3);
  MAT = {
    skin:new THREE.MeshPhysicalMaterial({ vertexColors:true, roughness:0.78, sheen:0.7, sheenRoughness:0.55, sheenColor:new THREE.Color(0.85, 0.85, 0.85) }),
    eye:new THREE.MeshPhysicalMaterial({ color:0x17100c, roughness:0.15, clearcoat:1, clearcoatRoughness:0.05 }),
    white:new THREE.MeshPhysicalMaterial({ color:0xffffff, roughness:0.2, clearcoat:1 }),
    line:new THREE.MeshStandardMaterial({ color:0x2a1a14, roughness:0.6 }),
    mouth:new THREE.MeshStandardMaterial({ color:0x5a1e22, roughness:0.7 }),
    tongue:new THREE.MeshStandardMaterial({ color:0xff7a8a, roughness:0.6 }),
    nose:new THREE.MeshPhysicalMaterial({ color:0xe5737f, roughness:0.3, clearcoat:1 }),
    blush:new THREE.MeshBasicMaterial({ color:0xff8fa3, transparent:true, opacity:0.45, depthWrite:false }),
    whisker:new THREE.MeshStandardMaterial({ color:0xfff7ee, roughness:0.5 }),
    hat:new THREE.MeshPhysicalMaterial({ color:0xffffff, roughness:0.7, sheen:0.6, sheenColor:new THREE.Color(0.9, 0.9, 0.9) }),
    apron:new THREE.MeshStandardMaterial({ map:check, roughness:0.85, side:THREE.DoubleSide }),
    steel:new THREE.MeshStandardMaterial({ color:0xc9ced6, metalness:0.85, roughness:0.25 }),
    wood:new THREE.MeshStandardMaterial({ color:0x9a6a3e, roughness:0.7 }),
  };
  return MAT;
}
const M = (geo, mat, cast = true) => { const m = new THREE.Mesh(geo, mat); m.castShadow = cast; return m; };

// ---------- khuon mat co bieu cam ----------
function buildFace(head, eyes) {
  const m = mats(), sets = { normal:new THREE.Group(), happy:new THREE.Group(), hurt:new THREE.Group(), smile:new THREE.Group(), open:new THREE.Group() };
  for (const k in sets) head.add(sets[k]);
  for (const s of [-1, 1]) {
    // mat hat bong
    const g = put(sets.normal, new THREE.Group(), s * 0.2, 0.46, 0.5);
    put(g, M(new THREE.SphereGeometry(0.1, 20, 16), m.eye, false)).scale.set(1, 1.15, 0.6);
    put(g, M(new THREE.SphereGeometry(0.034, 10, 8), m.white, false), 0.032, 0.045, 0.056);
    put(g, M(new THREE.SphereGeometry(0.017, 8, 6), m.white, false), -0.028, -0.035, 0.058);
    eyes.push(g);
    // mat cuoi ^ ^
    put(sets.happy, M(new THREE.TorusGeometry(0.065, 0.018, 8, 16, Math.PI), m.line, false), s * 0.2, 0.43, 0.53);
    // mat nham tit > <
    const h = put(sets.hurt, new THREE.Group(), s * 0.2, 0.46, 0.53);
    for (const k of [-1, 1]) put(h, M(new THREE.CapsuleGeometry(0.016, 0.09, 4, 8), m.line, false), -s * 0.025, k * 0.03, 0, 0, 0, Math.PI / 2 + k * s * 0.55);
    // ma hong
    put(head, new THREE.Mesh(new THREE.SphereGeometry(0.085, 12, 8), m.blush), s * 0.31, 0.27, 0.43).scale.set(1, 0.6, 0.35);
    // ria meo
    for (let k = 0; k < 3; k++) {
      const w = put(head, M(new THREE.CylinderGeometry(0.006, 0.004, 0.32, 5), m.whisker, false), s * 0.3, 0.22 + k * 0.035, 0.46, 0, 0, s * (Math.PI / 2 - 0.15 + k * 0.15));
      w.translateY(-s * 0.0);
    }
  }
  // mui
  put(head, M(new THREE.SphereGeometry(0.045, 12, 10), m.nose, false), 0, 0.31, 0.55).scale.set(1.3, 0.85, 0.8);
  // mieng cuoi "w"
  for (const s of [-1, 1]) put(sets.smile, M(new THREE.TorusGeometry(0.033, 0.011, 6, 12, Math.PI), m.line, false), s * 0.032, 0.235, 0.555, 0, 0, Math.PI);
  // mieng ha to
  const mo = put(sets.open, M(new THREE.SphereGeometry(0.075, 16, 12), m.mouth, false), 0, 0.2, 0.53); mo.scale.set(1.1, 0.95, 0.5);
  put(sets.open, M(new THREE.SphereGeometry(0.045, 12, 8), m.tongue, false), 0, 0.165, 0.555).scale.set(1.2, 0.6, 0.6);
  let cur = null;
  const face = {
    set(ex) {
      if (ex === cur) return; cur = ex;
      sets.normal.visible = ex === 'calm' || ex === 'shout';
      sets.happy.visible = ex === 'happy';
      sets.hurt.visible = ex === 'hurt';
      sets.smile.visible = ex === 'calm';
      sets.open.visible = ex !== 'calm';
    },
  };
  face.set('calm');
  return face;
}

// ---------- trang phuc dau bep ----------
function chefOutfit(rig, head, hand, collarMat) {
  const m = mats();
  // mu dau bep phong: tien + day xep nep
  const prof = [[0.31, 0], [0.32, 0.2], [0.4, 0.25], [0.49, 0.34], [0.52, 0.45], [0.46, 0.56], [0.3, 0.62], [0.0, 0.64]].map(([x, y]) => new THREE.Vector2(x, y));
  const hg = new THREE.LatheGeometry(prof, 40), hp = hg.attributes.position;
  for (let i = 0; i < hp.count; i++) {
    const x = hp.getX(i), y = hp.getY(i), z = hp.getZ(i), a = Math.atan2(z, x), k = 1 + (y > 0.22 ? 0.06 * Math.sin(a * 7) * Math.min(1, (y - 0.22) * 4) : 0);
    hp.setXYZ(i, x * k, y, z * k);
  }
  hg.computeVertexNormals();
  const hat = put(head, M(hg, m.hat), 0.03, 0.83, -0.03, -0.14, 0, -0.12);
  put(hat, M(new THREE.TorusGeometry(0.315, 0.035, 8, 40), m.hat), 0, 0.03, 0, Math.PI / 2, 0, 0);
  // tap de ke o (mot mang cong om bung)
  const ap = M(new THREE.SphereGeometry(0.64, 40, 20, Math.PI / 2 - 0.8, 1.6, 1.0, 1.02), m.apron);
  put(rig, ap, 0, 0.66, 0.05);
  // day co + day that lung (mau nhan dien nguoi choi) + no sau lung
  put(rig, M(new THREE.TorusGeometry(0.44, 0.03, 8, 36), collarMat), 0, 1.07, 0.02, Math.PI / 2 - 0.12, 0, 0);
  put(rig, M(new THREE.TorusGeometry(0.62, 0.04, 8, 48), collarMat), 0, 0.62, 0.0, Math.PI / 2, 0, 0);
  for (const s of [-1, 1]) put(rig, M(new THREE.SphereGeometry(0.1, 12, 10), collarMat), s * 0.09, 0.64, -0.62, 0, 0, s * 0.4).scale.set(1.3, 0.75, 0.45);
  // cai muoi tren tay
  const ladle = new THREE.Group();
  put(ladle, M(new THREE.CylinderGeometry(0.022, 0.026, 0.62, 10), m.steel), 0, -0.2, 0.06);
  put(ladle, M(new THREE.SphereGeometry(0.1, 16, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), m.steel), 0, -0.52, 0.06);
  put(ladle, M(new THREE.CylinderGeometry(0.03, 0.03, 0.14, 10), m.wood), 0, 0.12, 0.06);
  hand.add(ladle); ladle.position.set(0, -0.46, 0.04); ladle.rotation.set(-0.5, 0, 0);
  return { ladle };
}

// ---------- lap rap ----------
export function buildCritter2(a, collarColor, newAnim) {
  if (!bakeCache.has(a.id)) bakeCache.set(a.id, bake(catSpec(a)));
  const geo = bakeCache.get(a.id), m = mats();
  const root = new THREE.Group(), tumble = new THREE.Group(); tumble.position.y = 0.85; root.add(tumble);
  const bones = BONE_POS.map(() => new THREE.Bone());
  const rig = bones[0]; rig.position.set(0, -0.85, 0); tumble.add(rig);
  for (let i = 1; i < bones.length; i++) { rig.add(bones[i]); bones[i].position.fromArray(BONE_POS[i]); }
  bones[2].rotation.z = -ARM_BIND; bones[3].rotation.z = ARM_BIND;
  const mesh = new THREE.SkinnedMesh(geo, m.skin); mesh.position.y = -0.85; mesh.castShadow = true; mesh.receiveShadow = true; mesh.frustumCulled = false;
  tumble.add(mesh);
  root.updateMatrixWorld(true);
  mesh.bind(new THREE.Skeleton(bones));

  const head = bones[1], eyes = [];
  const face = buildFace(head, eyes);
  // tai meo (goc chim vao dau)
  const ears = [];
  for (const s of [-1, 1]) {
    const piv = put(head, new THREE.Group(), s * 0.34, 0.8, 0.0, 0, 0, -s * 0.42);
    put(piv, M(new THREE.ConeGeometry(0.17, 0.34, 20), m.skin.clone()), 0, 0.12, 0).material.vertexColors = false;
    piv.children[0].material.color.set(a.body);
    put(piv, M(new THREE.ConeGeometry(0.1, 0.22, 16), new THREE.MeshStandardMaterial({ color:a.inner, roughness:0.7 }), false), 0, 0.1, 0.07);
    ears.push({ piv, bx:0, bz:-s * 0.42 });
  }
  // duoi cong
  const tail = bones[7];
  const curve = new THREE.CatmullRomCurve3([new V3(0, 0, 0.05), new V3(0, 0.05, -0.35), new V3(0, 0.4, -0.5), new V3(0.06, 0.72, -0.38)]);
  const tm = new THREE.MeshPhysicalMaterial({ color:a.body, roughness:0.78, sheen:0.7, sheenRoughness:0.55 });
  put(tail, M(new THREE.TubeGeometry(curve, 24, 0.075, 12), tm));
  put(tail, M(new THREE.SphereGeometry(0.075, 12, 10), tm), 0.06, 0.72, -0.38);

  const collarMat = new THREE.MeshPhysicalMaterial({ color:collarColor, roughness:0.5, clearcoat:0.3 });
  const outfit = chefOutfit(rig, head, bones[3], collarMat);

  // hieu ung gan theo nhan vat (giong ban cu)
  const shield = put(root, new THREE.Mesh(new THREE.SphereGeometry(1.35, 24, 16), new THREE.MeshBasicMaterial({ color:0x7fd4ff, transparent:true, opacity:0.3, depthWrite:false })), 0, 1.05, 0);
  const ring = put(root, new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.06, 8, 32), new THREE.MeshBasicMaterial({ color:0xffd23f })), 0, 1, 0, Math.PI / 2, 0, 0);
  const bubble = put(root, new THREE.Mesh(new THREE.SphereGeometry(1.5, 24, 16), new THREE.MeshBasicMaterial({ color:0xff9ed2, transparent:true, opacity:0.35, depthWrite:false })), 0, 1.05, 0);
  const hammer = new THREE.Group();
  put(hammer, part(new THREE.CylinderGeometry(0.05, 0.05, 0.9, 8), 0x8b5a2b), 0, -0.45, 0);
  put(hammer, part(new THREE.CylinderGeometry(0.24, 0.24, 0.5, 16), 0xe03131), 0, -0.95, 0, 0, 0, Math.PI / 2);
  put(bones[3], hammer, 0, -0.46, 0);
  const gun = new THREE.Group();
  put(gun, part(new THREE.SphereGeometry(0.2, 14, 10), 0xf783ac), 0, -0.56, 0.1);
  put(gun, part(new THREE.CylinderGeometry(0.07, 0.09, 0.4, 10), 0x4dabf7), 0, -0.81, 0.1);
  put(bones[3], gun, 0, 0, 0);
  const dizzy = new THREE.Group(); dizzy.position.y = 2.5; root.add(dizzy);
  for (let i = 0; i < 3; i++) put(dizzy, new THREE.Mesh(new THREE.OctahedronGeometry(0.12), new THREE.MeshBasicMaterial({ color:0xffe066 })), Math.cos(i * 2.09) * 0.45, 0, Math.sin(i * 2.09) * 0.45);
  shield.visible = ring.visible = bubble.visible = hammer.visible = gun.visible = dizzy.visible = false;

  return { root, tumble, rig, head, jig:null, eyes, ears, tail, arms:[bones[2], bones[3]], legs:[bones[4], bones[5]],
           belly:bones[6], bellyRest:bones[6].position.clone(), armBias:0.3, face, prop:outfit.ladle,
           shield, ring, bubble, hammer, gun, dizzy, collar:null, collarMat, anim:newAnim(), v2:true };
}
