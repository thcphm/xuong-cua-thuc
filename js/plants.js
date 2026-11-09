/* Cây 3D dựng bằng code, dùng chung cho Sân Vườn và nhà 3D. */
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const C = (hex) => new THREE.Color(hex);
const UP = V(0, 1, 0);
const rngOf = (seed) => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const between = (rng, a, b) => a + rng() * (b - a);

const SHAPES = {
  oval: (t) => Math.pow(Math.sin(Math.PI * Math.pow(t, 0.8)), 0.8),
  pointed: (t) => Math.pow(Math.sin(Math.PI * Math.pow(t, 0.62)), 1.1),
  sword: (t) => Math.min(1, t * 7) * (1 - Math.pow(t, 7)),
  round: (t) => Math.pow(Math.sin(Math.PI * t), 0.5),
  petal: (t) => Math.pow(Math.sin(Math.PI * Math.pow(t, 1.25)), 0.65)
};

function setColors(geo, fn) {
  const p = geo.attributes.position, data = new Float32Array(p.count * 3), c = new THREE.Color();
  for (let i = 0; i < p.count; i++) { fn(c, i, p); data[i * 3] = c.r; data[i * 3 + 1] = c.g; data[i * 3 + 2] = c.b; }
  geo.setAttribute('color', new THREE.BufferAttribute(data, 3));
  return geo;
}
/* Phiến lá cong, mọc theo +Y và cong về +Z */
function blade({ len, wid, bend = 0.5, fold = 0.25, shape = SHAPES.oval, color, wseg = 2, lseg = 7 }) {
  const g = new THREE.PlaneGeometry(1, 1, wseg, lseg), p = g.attributes.position, st = [];
  for (let i = 0; i < p.count; i++) {
    const s = p.getX(i) * 2, t = p.getY(i) + 0.5, w = wid * 0.5 * shape(t), a = bend * t;
    const y = len * (bend > 0.01 ? Math.sin(a) / bend : t), z = len * (bend > 0.01 ? (1 - Math.cos(a)) / bend : 0);
    const f = Math.abs(s) * w * fold;
    p.setXYZ(i, s * w, y + Math.sin(a) * f, z - Math.cos(a) * f);
    st.push([t, s]);
  }
  g.computeVertexNormals();
  return setColors(g, (c, i) => color(c, st[i][0], st[i][1]));
}
/* Lá mọng dày, dùng cho sen đá */
function fleshy({ len, wid, thick, bend, color }) {
  const g = new THREE.SphereGeometry(1, 10, 12), p = g.attributes.position, ts = [];
  for (let i = 0; i < p.count; i++) {
    const t = (p.getY(i) + 1) / 2, prof = Math.pow(Math.sin(Math.PI * Math.pow(t, 0.72)), 0.55) * (0.45 + 0.55 * t), a = bend * t;
    const x = p.getX(i) * wid * prof, zz = p.getZ(i) * thick * prof;
    p.setXYZ(i, x, len * Math.sin(a) / bend - Math.sin(a) * zz, len * (1 - Math.cos(a)) / bend + Math.cos(a) * zz);
    ts.push(t);
  }
  g.computeVertexNormals();
  return setColors(g, (c, i) => color(c, ts[i]));
}
function tube(points, r0, r1, color, seg = 8, radial = 7) {
  const curve = new THREE.CatmullRomCurve3(points), g = new THREE.TubeGeometry(curve, seg, r0, radial, false), p = g.attributes.position, c0 = C(color);
  const v = V(), center = V();
  for (let i = 0; i <= seg; i++) {
    curve.getPointAt(i / seg, center);
    const k = 1 + (r1 / r0 - 1) * (i / seg);
    for (let j = 0; j <= radial; j++) {
      const n = i * (radial + 1) + j;
      v.fromBufferAttribute(p, n).sub(center).multiplyScalar(k).add(center);
      p.setXYZ(n, v.x, v.y, v.z);
    }
  }
  g.computeVertexNormals();
  return setColors(g, (c) => c.copy(c0));
}
function orb(r, color, sy = 1) {
  const g = new THREE.SphereGeometry(r, 8, 6);
  g.scale(1, sy, 1);
  const c0 = C(color);
  return setColors(g, (c) => c.copy(c0));
}
/* Đặt mảnh tại p, trục +Y hướng theo d, xoay quanh trục đó */
function put(g, p, d, spin = 0, s = 1) {
  const q = new THREE.Quaternion().setFromUnitVectors(UP, d.clone().normalize());
  q.multiply(new THREE.Quaternion().setFromAxisAngle(UP, spin));
  g.applyMatrix4(new THREE.Matrix4().compose(p, q, V(s, s, s)));
  return g;
}
/* Đặt lá quanh gốc: góc ngang, độ ngả ra ngoài */
function around(g, p, yaw, tilt, s = 1) {
  const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(tilt, yaw, 0, 'YXZ'));
  g.applyMatrix4(new THREE.Matrix4().compose(p, q, V(s, s, s)));
  return g;
}
function branches(parts, rng, { start, dir, len, r, depth, color, wiggle, spread, shrink = 0.74, onNode }) {
  const walk = (p, d, l, rad, n) => {
    const off = V(rng() * 2 - 1, rng() * 0.8 - 0.3, rng() * 2 - 1).multiplyScalar(wiggle);
    const mid = p.clone().addScaledVector(d, l * 0.5).addScaledVector(off, l * 0.3);
    const end = p.clone().addScaledVector(d, l).addScaledVector(off, l * 0.42);
    parts.push(tube([p, mid, end], rad, rad * 0.7, color, 5, 6));
    if (onNode) onNode(mid, end, end.clone().sub(p).normalize(), n);
    if (n <= 0) return;
    const kids = n === depth ? 3 : 2;
    for (let i = 0; i < kids; i++) {
      const nd = d.clone().add(V(rng() * 2 - 1, rng() * 0.7 - 0.15, rng() * 2 - 1).multiplyScalar(spread)).normalize();
      walk(end, nd, l * shrink, rad * 0.68, n - 1);
    }
  };
  walk(start, dir, len, r, depth);
}
const mixer = (a, b) => { const A = C(a), B = C(b); return (c, t) => c.copy(A).lerp(B, t); };
const leafColor = (a, b, rib) => { const A = C(a), B = C(b), R = C(rib); return (c, t, s) => { c.copy(A).lerp(B, t); if (Math.abs(s) < 0.2) c.lerp(R, 0.55); }; };

function flower5(parts, p, d, spin, size, petal) {
  for (let i = 0; i < 5; i++) {
    const g = blade({ len: size, wid: size * 0.78, bend: 0.5, fold: -0.1, shape: SHAPES.petal, color: petal, wseg: 1, lseg: 3 });
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(1.35, i / 5 * Math.PI * 2 + spin, 0, 'YXZ'));
    const orient = new THREE.Quaternion().setFromUnitVectors(UP, d);
    g.applyMatrix4(new THREE.Matrix4().compose(p, orient.multiply(q), V(1, 1, 1)));
    parts.push(g);
  }
}

const BUILD = {
  mai(parts, rng) {
    const petal = mixer('#f5b70f', '#ffe36b');
    const leaf = leafColor('#5f9a3a', '#a4cf58', '#c9e38a');
    branches(parts, rng, { start: V(), dir: V(0.05, 1, 0), len: 0.62, r: 0.055, depth: 3, color: '#4a3527', wiggle: 0.34, spread: 0.72, onNode(mid, end, d, n) {
      const count = n === 0 ? 8 : n === 1 ? 5 : 0;
      for (let i = 0; i < count; i++) {
        const q = end.clone().add(V(rng() - 0.5, rng() * 0.4 - 0.2, rng() - 0.5).multiplyScalar(0.17));
        const dir = d.clone().add(V(rng() * 2 - 1, rng() * 1.2, rng() * 2 - 1)).normalize();
        flower5(parts, q, dir, rng() * 6, 0.075, petal);
        parts.push(put(orb(0.018, '#e0741b'), q.clone().addScaledVector(dir, 0.02), dir));
        if (i % 2) parts.push(put(blade({ len: 0.2, wid: 0.075, bend: 0.5, color: leaf, wseg: 2, lseg: 4 }), q, dir.clone().add(V(rng() - 0.5, 0.1, rng() - 0.5)), rng() * 6));
      }
    } });
  },
  'hoa-giay'(parts, rng) {
    const bract = (c, t) => c.setRGB(0.78, 0.09, 0.47).lerp(C('#ff5fae'), t * 0.8);
    const leaf = leafColor('#2f6f3a', '#4f9a4d', '#86c078');
    branches(parts, rng, { start: V(), dir: V(0, 1, 0), len: 0.58, r: 0.042, depth: 3, color: '#5b4632', wiggle: 0.5, spread: 0.95, shrink: 0.8, onNode(mid, end, d, n) {
      if (n > 1) return;
      for (let i = 0; i < 9; i++) {
        const q = end.clone().lerp(mid, rng()).add(V(rng() - 0.5, rng() - 0.5, rng() - 0.5).multiplyScalar(0.22));
        const dir = V(rng() * 2 - 1, rng() * 1.2 - 0.1, rng() * 2 - 1).normalize();
        if (i % 3 === 0) { parts.push(put(blade({ len: 0.19, wid: 0.11, bend: 0.5, color: leaf, wseg: 2, lseg: 4 }), q, dir, rng() * 6)); continue; }
        const spin = rng() * 6;
        for (let k = 0; k < 3; k++) {
          const tilt = dir.clone().applyAxisAngle(UP, k / 3 * Math.PI * 2).add(V(0, 0.6, 0)).normalize();
          parts.push(put(blade({ len: 0.13, wid: 0.115, bend: 0.8, fold: -0.2, shape: SHAPES.round, color: bract, wseg: 2, lseg: 3 }), q, tilt, spin + k * 2.1));
        }
        parts.push(put(orb(0.012, '#fff1cf', 2), q, dir));
      }
    } });
  },
  si(parts, rng) {
    const trunkPts = [V(0, 0, 0), V(0.14, 0.2, 0.04), V(-0.08, 0.42, -0.04), V(0.1, 0.66, 0.05), V(0.02, 0.86, 0)];
    parts.push(tube(trunkPts, 0.095, 0.042, '#6a5647', 16, 9));
    parts.push(tube([V(0.03, 0, 0), V(0.3, -0.02, 0.1), V(0.42, -0.02, 0.14)], 0.05, 0.016, '#5a4a3d', 5, 6), tube([V(-0.02, 0, 0), V(-0.26, -0.02, -0.14), V(-0.38, -0.02, -0.16)], 0.05, 0.016, '#5a4a3d', 5, 6));
    const leaf = leafColor('#2d6b35', '#5da648', '#8cc86e');
    const pads = [[V(0.46, 0.62, 0.12), 0.34], [V(-0.42, 0.74, -0.1), 0.36], [V(0.32, 1.0, -0.2), 0.3], [V(-0.2, 1.08, 0.24), 0.32], [V(0.05, 1.22, 0), 0.34], [V(-0.1, 0.42, 0.34), 0.22]];
    pads.forEach(([c, size]) => {
      parts.push(tube([trunkPts[3].clone().lerp(trunkPts[4], rng()), c.clone().multiplyScalar(0.72).add(V(0, 0.08, 0)), c], 0.03, 0.012, '#6a5647', 5, 5));
      for (let i = 0; i < 58; i++) {
        const a = rng() * Math.PI * 2, r = Math.sqrt(rng()) * size;
        const p = c.clone().add(V(Math.cos(a) * r, (1 - r / size) * size * 0.32 * rng() - 0.02, Math.sin(a) * r));
        parts.push(put(blade({ len: 0.095, wid: 0.05, bend: 0.5, shape: SHAPES.pointed, color: leaf, wseg: 1, lseg: 3 }), p, V(Math.cos(a) * 0.7, 0.8, Math.sin(a) * 0.7), rng() * 6));
      }
    });
  },
  lan(parts, rng) {
    const leaf = leafColor('#2f7a43', '#58a35a', '#9fd08a');
    for (let i = 0; i < 6; i++) parts.push(around(blade({ len: 0.58 - i * 0.03, wid: 0.2, bend: 1.15, fold: 0.34, color: leaf, wseg: 4, lseg: 9 }), V(0, 0.02, 0), i * 2.4 + rng() * 0.3, 0.55));
    for (let i = 0; i < 5; i++) { const a = rng() * 6.28; parts.push(tube([V(0, 0.03, 0), V(Math.cos(a) * 0.2, 0.07, Math.sin(a) * 0.2), V(Math.cos(a) * 0.34, -0.03, Math.sin(a) * 0.34)], 0.018, 0.012, '#a9b9a0', 5, 5)); }
    const spike = [V(0, 0, 0), V(0.03, 0.42, 0), V(0.1, 0.84, 0.02), V(0.3, 1.14, 0.08), V(0.58, 1.2, 0.14)];
    parts.push(tube(spike, 0.015, 0.008, '#4d7d48', 16, 6));
    const curve = new THREE.CatmullRomCurve3(spike);
    const sepal = mixer('#f7eef6', '#ffffff');
    for (let n = 0; n < 7; n++) {
      const t = 0.56 + n * 0.062, p = curve.getPointAt(t).add(V(0, -0.08, 0.05)), f = V(0.1, 0.12, 1).normalize();
      if (n > 5) { parts.push(put(orb(0.03, '#b7cf89', 1.3), p, UP)); continue; }
      const s = 0.13;
      [0, 2.09, 4.19].forEach((a) => {
        const g = blade({ len: s, wid: s * 0.58, bend: 0.3, fold: 0.05, shape: SHAPES.petal, color: sepal, wseg: 2, lseg: 4 });
        g.applyMatrix4(new THREE.Matrix4().makeRotationZ(a)); g.applyMatrix4(new THREE.Matrix4().lookAt(V(), f.clone().negate(), UP).setPosition(p)); parts.push(g);
      });
      [1.05, 5.23].forEach((a) => {
        const g = blade({ len: s * 1.08, wid: s * 1.25, bend: 0.25, fold: 0.04, shape: SHAPES.round, color: (c, q, w) => c.set('#fff').lerp(C('#f0b6d8'), (1 - q) * 0.6 * (1 - Math.abs(w))), wseg: 3, lseg: 4 });
        g.applyMatrix4(new THREE.Matrix4().makeRotationZ(a)); g.applyMatrix4(new THREE.Matrix4().lookAt(V(), f.clone().negate(), UP).setPosition(p.clone().addScaledVector(f, 0.006))); parts.push(g);
      });
      parts.push(put(orb(0.026, '#c0267b', 1.4), p.clone().addScaledVector(f, 0.03).add(V(0, -0.02, 0)), f), put(orb(0.012, '#f6cf4a'), p.clone().addScaledVector(f, 0.045), f));
    }
  },
  'duong-xi'(parts, rng) {
    const col = leafColor('#2f8a42', '#7fce5a', '#9ad86e');
    for (let f = 0; f < 22; f++) {
      const yaw = f * 2.399 + rng() * 0.3, reach = between(rng, 0.62, 1.05), rise = between(rng, 0.42, 0.74);
      const dir = V(Math.sin(yaw), 0, Math.cos(yaw));
      const at = (t) => dir.clone().multiplyScalar(reach * t).add(V(0, rise * Math.sin(Math.PI * Math.min(1, t * 0.82)) - 0.06 * t, 0));
      parts.push(tube([at(0), at(0.3), at(0.6), at(1)], 0.009, 0.003, '#4f8a45', 7, 4));
      for (let i = 2; i < 25; i++) {
        const t = i / 25, p = at(t), tan = at(Math.min(1, t + 0.03)).sub(p).normalize(), side = tan.clone().cross(UP).normalize();
        const l = 0.135 * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.6)), 0.8) + 0.018;
        [-1, 1].forEach((k) => parts.push(put(blade({ len: l, wid: 0.03, bend: 0.5, fold: 0.05, shape: SHAPES.pointed, color: col, wseg: 1, lseg: 3 }), p, side.clone().multiplyScalar(k).addScaledVector(tan, 0.32).add(V(0, -0.1, 0)), k * 1.5)));
      }
    }
  },
  'luoi-ho'(parts, rng) {
    const banded = (c, t, s) => {
      const band = Math.sin(t * 58 + Math.sin(t * 11 + s * 2.4) * 1.9) > 0.1;
      c.set(band ? '#2f5c3b' : '#8fb18a');
      if (Math.abs(s) > 0.8) c.set('#e6d76a');
    };
    for (let i = 0; i < 10; i++) {
      const r = i < 3 ? 0.03 : 0.13, yaw = i * 2.2 + rng();
      parts.push(around(blade({ len: between(rng, 0.8, 1.32) * (i < 3 ? 1.08 : 0.9), wid: between(rng, 0.13, 0.17), bend: between(rng, 0.06, 0.22), fold: 0.3, shape: SHAPES.sword, color: banded, wseg: 4, lseg: 34 }), V(Math.sin(yaw) * r, 0, Math.cos(yaw) * r), yaw, between(rng, 0.02, 0.2)));
    }
  },
  'sen-da'(parts, rng) {
    const color = (c, t) => c.set('#9dc7bd').lerp(C('#c9dfd4'), t * 0.6).lerp(C('#e58f9f'), Math.pow(t, 9));
    const rosette = (center, n, size, base = 0) => {
      for (let i = 0; i < n; i++) {
        const k = (i + 1) / n, yaw = i * 2.39996 + base;
        parts.push(around(fleshy({ len: size * (0.42 + k * 0.62), wid: size * (0.16 + k * 0.19), thick: size * 0.075, bend: 0.75, color }), center.clone(), yaw, 0.12 + k * 1.15));
      }
    };
    rosette(V(0, 0.02, 0), 46, 0.42);
    rosette(V(0.34, 0, 0.18), 22, 0.15, 1);
    rosette(V(-0.32, 0, 0.2), 20, 0.13, 2);
  },
  'tai-tho'(parts, rng) {
    const pad = (p, tiltZ, tiltX, w, h) => {
      const g = new THREE.SphereGeometry(1, 22, 16);
      g.scale(w, h, 0.085);
      g.translate(0, h, 0);
      const stage = new THREE.Matrix4().compose(p, new THREE.Quaternion().setFromEuler(new THREE.Euler(tiltX, 0, tiltZ)), V(1, 1, 1));
      const dots = [];
      for (let lat = -6; lat <= 6; lat++) for (let lon = -5; lon <= 5; lon++) {
        const x = (lon + (lat & 1) * 0.5) / 6.3, y = lat / 7;
        if (x * x + y * y > 0.84) continue;
        [-1, 1].forEach((side) => {
          const d = new THREE.PlaneGeometry(0.03, 0.03);
          const z = 0.085 * Math.sqrt(Math.max(0, 1 - x * x - y * y)) * side + side * 0.004;
          if (side < 0) d.rotateY(Math.PI);
          d.translate(x * w, y * h + h, z);
          dots.push(setColors(d, (c) => c.set('#f0d98a')));
        });
      }
      setColors(g, (c, i, q) => c.set('#5d9c4c').lerp(C('#88bf63'), q.getY(i) / (2 * h)));
      [g, ...dots].forEach((m) => { m.applyMatrix4(stage); parts.push(m); });
      const top = V(0, h * 2, 0).applyMatrix4(stage);
      return { stage, top };
    };
    pad(V(0, -0.02, 0), 0, 0, 0.27, 0.35);
    const edge = (t, side) => V(side * 0.25 * Math.sin(t), 0.33 + 0.33 * Math.cos(t) * 0.95, 0);
    pad(edge(0.72, -1), 0.62, 0.08, 0.17, 0.22);
    pad(edge(0.72, 1), -0.62, -0.08, 0.17, 0.22);
    pad(edge(1.5, 1), -1.0, 0.16, 0.12, 0.15);
    pad(edge(1.45, -1), 1.05, -0.2, 0.11, 0.14);
  },
  'hung-que'(parts, rng) {
    const leaf = leafColor('#3f9a35', '#6cc247', '#a6df7a');
    for (let s = 0; s < 8; s++) {
      const yaw = s * 2.4, out = between(rng, 0.03, 0.26), h = between(rng, 0.56, 0.84);
      const tip = V(Math.sin(yaw) * (out + 0.13), h, Math.cos(yaw) * (out + 0.13));
      const pts = [V(Math.sin(yaw) * out * 0.3, 0, Math.cos(yaw) * out * 0.3), V(Math.sin(yaw) * out, h * 0.5, Math.cos(yaw) * out), tip];
      parts.push(tube(pts, 0.016, 0.006, '#5f9a3f', 7, 5));
      const curve = new THREE.CatmullRomCurve3(pts);
      for (let n = 1; n <= 6; n++) {
        const t = n / 6, p = curve.getPointAt(t), size = 0.2 * (1.12 - t * 0.55), phase = n * Math.PI / 2 + yaw;
        [0, Math.PI].forEach((a) => parts.push(around(blade({ len: size, wid: size * 0.68, bend: 1.0, fold: -0.16, color: leaf, wseg: 4, lseg: 6 }), p.clone(), phase + a, 0.78)));
      }
    }
  }
};

/* Mọi cây dùng chung một kiểu lay gió và héo */
function foliageMaterial(uniforms) {
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.56, metalness: 0 });
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = 'uniform float uTime,uDroop,uSway;\n' + shader.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      float hh = max(transformed.y, 0.0), rr = length(transformed.xz);
      vec2 outward = rr > 0.0001 ? transformed.xz / rr : vec2(0.0);
      float wilt = uDroop * smoothstep(0.02, 0.5, rr + hh * 0.25);
      transformed.y -= wilt * (hh * 0.42 + rr * 0.25);
      transformed.xz += outward * wilt * hh * 0.16;
      transformed.x += sin(uTime * 1.5 + position.y * 3.0 + position.z * 2.0) * uSway * hh * hh * 0.035;
      transformed.z += cos(uTime * 1.1 + position.x * 3.0) * uSway * hh * hh * 0.025;`);
    shader.fragmentShader = 'uniform float uDry;\n' + shader.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.42, 0.33, 0.16) * (0.6 + dot(diffuseColor.rgb, vec3(0.5))), uDry);`);
  };
  mat.customProgramCacheKey = () => 'tp-foliage';
  return mat;
}

const POTS = { mai: '#5f6d7f', 'hoa-giay': '#b0603e', si: '#3b4656', lan: '#d9d6cc', 'duong-xi': '#a65a3b', 'luoi-ho': '#39506b', 'sen-da': '#c9d3cf', 'tai-tho': '#b86c45', 'hung-que': '#8d4f35' };
const STIFF = { 'luoi-ho': 0.28, 'tai-tho': 0.14, 'sen-da': 0.3, si: 0.45, mai: 0.5 };
export const PLANT_IDS = Object.keys(BUILD);

export function buildPlant(id, seed = 7) {
  const parts = [];
  BUILD[id](parts, rngOf(seed * (id.length + 11)));
  const uniforms = { uTime: { value: 0 }, uDroop: { value: 0 }, uDry: { value: 0 }, uSway: { value: 1 } };
  const foliage = new THREE.Mesh(mergeGeometries(parts, false), foliageMaterial(uniforms));
  foliage.castShadow = true;
  const potProfile = [[0, 0], [0.26, 0], [0.3, 0.03], [0.4, 0.36], [0.45, 0.37], [0.46, 0.46], [0.42, 0.47], [0.4, 0.42], [0, 0.42]].map(([x, y]) => new THREE.Vector2(x, y));
  const pot = new THREE.Mesh(new THREE.LatheGeometry(potProfile, 44), new THREE.MeshStandardMaterial({ color: POTS[id], roughness: id === 'sen-da' || id === 'lan' ? 0.25 : 0.72 }));
  pot.castShadow = pot.receiveShadow = true;
  const soil = new THREE.Mesh(new THREE.CircleGeometry(0.405, 36), new THREE.MeshStandardMaterial({ color: '#4a3323', roughness: 0.95 }));
  soil.rotation.x = -Math.PI / 2;
  soil.position.y = 0.425;
  soil.receiveShadow = true;
  foliage.position.y = 0.43;
  const group = new THREE.Group();
  group.add(pot, soil, foliage);
  return { group, foliage, soil, pot, uniforms, stiff: STIFF[id] || 1 };
}
