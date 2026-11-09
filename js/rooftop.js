/* Sân Thượng: bầu trời thật theo giờ và vị trí, nhật ký, thư gửi tương lai. */
window.Rooftop = (function () {
  'use strict';
  const KEY = 'tp-san-v1';
  const ENGINE = 'https://cdn.jsdelivr.net/npm/astronomy-engine@2.1.19/astronomy.browser.min.js';
  const DEG = Math.PI / 180;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (id) => document.getElementById(id);
  function h(tag, props, ...kids) {
    const n = document.createElement(tag);
    Object.entries(props || {}).forEach(([k, v]) => {
      if (v == null || v === false) return;
      if (k === 'class') n.className = v;
      else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
      else if (k in n && k !== 'list') n[k] = v;
      else n.setAttribute(k, v);
    });
    n.append(...kids.flat().filter((x) => x != null && x !== false));
    return n;
  }

  let store = { diary: [], letters: [], city: 'dongnai', tab: 'diary' };
  try { store = Object.assign(store, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { /* dùng tạm trong phiên */ }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) { /* bỏ qua */ } }
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const pad = (n) => String(n).padStart(2, '0');
  const iso = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const today = () => iso(new Date());
  const show = (s) => s.split('-').reverse().join('/');
  const addMonths = (n) => { const d = new Date(); d.setMonth(d.getMonth() + n); return iso(d); };
  const daysTo = (s) => Math.ceil((new Date(s + 'T00:00:00') - new Date(today() + 'T00:00:00')) / 864e5);
  const dueLetters = () => store.letters.filter((l) => l.open <= today() && !l.read);

  /* Tên Việt của chòm và sao quen thuộc */
  const CONS_VI = { Ori: 'Lạp Hộ', UMa: 'Đại Hùng', UMi: 'Tiểu Hùng', Cas: 'Tiên Hậu', Cep: 'Tiên Vương', And: 'Tiên Nữ', Per: 'Anh Tiên', Peg: 'Phi Mã', Lyr: 'Thiên Cầm', Cyg: 'Thiên Nga', Aql: 'Thiên Ưng', CMa: 'Đại Khuyển', CMi: 'Tiểu Khuyển', Dra: 'Thiên Long', Boo: 'Mục Phu', Aur: 'Ngự Phu', Cru: 'Nam Thập Tự', Her: 'Vũ Tiên', Ari: 'Bạch Dương', Tau: 'Kim Ngưu', Gem: 'Song Tử', Cnc: 'Cự Giải', Leo: 'Sư Tử', Vir: 'Xử Nữ', Lib: 'Thiên Bình', Sco: 'Bọ Cạp', Sgr: 'Nhân Mã', Cap: 'Ma Kết', Aqr: 'Bảo Bình', Psc: 'Song Ngư', Cen: 'Bán Nhân Mã', Lep: 'Thiên Thố', Oph: 'Xà Phu', Cet: 'Kình Ngư' };
  const STAR_INFO = { Sirius: ['Thiên Lang', 8.6], Vega: ['Chức Nữ', 25], Altair: ['Ngưu Lang', 17], Polaris: ['Sao Bắc Cực', 433], Antares: ['Tâm Tú Nhị', 550], Canopus: ['Lão Nhân', 310], Arcturus: ['Đại Giác', 37], Spica: ['Giác Tú Nhất', 250], Aldebaran: ['Tất Tú Ngũ', 65], Regulus: ['Hiên Viên Thập Tứ', 79], Deneb: ['Thiên Tân Tứ', 2600], Betelgeuse: ['Sâm Tú Tứ', 550], Rigel: ['Sâm Tú Thất', 860], Capella: ['Ngũ Xa Nhị', 43], Procyon: ['Nam Hà Tam', 11.5], Pollux: ['Bắc Hà Tam', 34], Castor: ['Bắc Hà Nhị', 51] };
  const CITIES = { dongnai: ['Đồng Nai', 10.95, 106.82], hcm: ['TP. Hồ Chí Minh', 10.78, 106.7], hn: ['Hà Nội', 21.03, 105.85], hue: ['Huế', 16.46, 107.59], dn: ['Đà Nẵng', 16.05, 108.21], ct: ['Cần Thơ', 10.03, 105.78] };
  const BODIES = [['Moon', 'Mặt Trăng', '#f3efe0', 9], ['Mercury', 'Sao Thủy', '#d9c9b0', 3], ['Venus', 'Sao Kim', '#fff3cf', 4.6], ['Mars', 'Sao Hỏa', '#ff9a6b', 3.6], ['Jupiter', 'Sao Mộc', '#ffe9c4', 4.4], ['Saturn', 'Sao Thổ', '#f0dca2', 3.8]];
  const SHOWERS = [[1, 3, 'Quadrantid'], [4, 22, 'Lyrid'], [5, 6, 'Eta Aquariid'], [8, 12, 'Perseid'], [10, 21, 'Orionid'], [11, 17, 'Leonid'], [12, 14, 'Geminid']];
  const DIRS = ['Bắc', 'Đông Bắc', 'Đông', 'Đông Nam', 'Nam', 'Tây Nam', 'Tây', 'Tây Bắc'];
  const bvColor = (bv) => bv < 0 ? '#a9c4ff' : bv < 0.3 ? '#d3e0ff' : bv < 0.6 ? '#fff6ea' : bv < 1 ? '#ffe7bd' : bv < 1.4 ? '#ffc98a' : '#ff9f6b';
  const bvName = (bv) => bv < 0 ? 'xanh lam' : bv < 0.3 ? 'trắng xanh' : bv < 0.6 ? 'trắng' : bv < 1 ? 'vàng' : bv < 1.4 ? 'cam' : 'đỏ cam';
  const tempOf = (bv) => Math.round(4600 * (1 / (0.92 * bv + 1.7) + 1 / (0.92 * bv + 0.62)) / 100) * 100;

  let Sky, cv, g, W = 0, H = 0, built = false;
  let starData, spots, lat = 10.95, lon = 106.82, offsetMin = 0;
  const camera = { az: 180, alt: 58, zoom: 1 };
  let bodies = [], sunAlt = -30, moonText = '', chosen = null, showLines = true, showNames = true;
  let dirty = true, lastPaint = 0;

  function loadScript(src) {
    return new Promise((resolve, reject) => { document.head.append(h('script', { src: src, onload: resolve, onerror: reject })); });
  }
  const when = () => new Date(Date.now() + offsetMin * 60000);
  function lst(date) {
    const jd = date.getTime() / 864e5 + 2440587.5;
    return (280.46061837 + 360.98564736629 * (jd - 2451545) + lon) * DEG;
  }
  /* Xích đạo sang véc-tơ chân trời: x Đông, y Bắc, z Thiên đỉnh */
  function horizon(ra, dec, side, out) {
    const H_ = side - ra, sd = Math.sin(dec), cd = Math.cos(dec), sl = Math.sin(lat * DEG), cl = Math.cos(lat * DEG), ch = Math.cos(H_);
    out[0] = -cd * Math.sin(H_);
    out[1] = sd * cl - cd * sl * ch;
    out[2] = sd * sl + cd * cl * ch;
    return out;
  }
  function basis() {
    const a = camera.az * DEG, e = camera.alt * DEG, se = Math.sin(e), ce = Math.cos(e), sa = Math.sin(a), ca = Math.cos(a);
    return { f: [ce * sa, ce * ca, se], r: [ca, -sa, 0], u: [-se * sa, -se * ca, ce], scale: camera.zoom * Math.min(W, H) * 0.62, cx: W / 2, cy: H / 2 };
  }
  function project(v, b, out) {
    const X = v[0] * b.r[0] + v[1] * b.r[1], Y = v[0] * b.u[0] + v[1] * b.u[1] + v[2] * b.u[2], Z = v[0] * b.f[0] + v[1] * b.f[1] + v[2] * b.f[2], k = 2 / (1 + Z);
    out[0] = b.cx + b.scale * k * X * 0.5 * 2 * 0.5;
    out[1] = b.cy - b.scale * k * Y * 0.5 * 2 * 0.5;
    return Z > -0.92;
  }
  const altAz = (v) => ({ alt: Math.asin(Math.max(-1, Math.min(1, v[2]))) / DEG, az: (Math.atan2(v[0], v[1]) / DEG + 360) % 360 });
  const dirName = (az) => DIRS[Math.round(az / 45) % 8];

  function updateBodies() {
    bodies = [];
    if (!window.Astronomy) return;
    const A = window.Astronomy, date = when(), obs = new A.Observer(lat, lon, 15);
    const eq = (name) => A.Equator(name, date, obs, false, true);
    const sun = eq('Sun'), side = lst(date), t = [0, 0, 0];
    sunAlt = altAz(horizon(sun.ra * 15 * DEG, sun.dec * DEG, side, t)).alt;
    BODIES.forEach(([id, name, color, r]) => {
      const e = eq(id), ill = A.Illumination(id, date);
      bodies.push({ id, name, color, r, ra: e.ra * 15 * DEG, dec: e.dec * DEG, dist: e.dist, phase: ill.phase_fraction, angle: ill.phase_angle });
    });
    const angle = A.MoonPhase(date), names = ['Trăng non', 'Trăng lưỡi liềm đầu tháng', 'Trăng thượng huyền', 'Trăng khuyết đầu tháng', 'Trăng tròn', 'Trăng khuyết cuối tháng', 'Trăng hạ huyền', 'Trăng lưỡi liềm cuối tháng'];
    const moon = bodies[0];
    moon.waxing = angle < 180;
    moonText = names[Math.round(angle / 45) % 8] + ', sáng ' + Math.round(moon.phase * 100) + '%';
  }
  function nextShower() {
    const now = new Date(), y = now.getFullYear();
    const list = SHOWERS.map(([m, d, name]) => { let at = new Date(y, m - 1, d); if (at < new Date(y, now.getMonth(), now.getDate())) at = new Date(y + 1, m - 1, d); return { at, name }; }).sort((a, b) => a.at - b.at);
    return 'Mưa sao băng ' + list[0].name + ' đạt đỉnh khoảng ' + pad(list[0].at.getDate()) + '/' + pad(list[0].at.getMonth() + 1);
  }
  function infoLine() {
    const d = when(), text = pad(d.getHours()) + ':' + pad(d.getMinutes()) + ' ngày ' + pad(d.getDate()) + '/' + pad(d.getMonth() + 1);
    const place = store.city === 'me' ? 'vị trí của bạn' : CITIES[store.city][0];
    $('skyNow').textContent = text + ', ' + place + (moonText ? '. ' + moonText : '') + '.';
    $('skyHint').textContent = sunAlt > -6 ? 'Trời đang sáng nên sao bị che. Kéo thanh thời gian tới buổi tối.' : nextShower() + '.';
  }

  const tmp = [0, 0, 0], tmp2 = [0, 0, 0], p2 = [0, 0];
  function circle(a, b, c) {
    const d = 2 * (a[0] * (b[1] - c[1]) + b[0] * (c[1] - a[1]) + c[0] * (a[1] - b[1]));
    const s = (p) => p[0] * p[0] + p[1] * p[1];
    const x = (s(a) * (b[1] - c[1]) + s(b) * (c[1] - a[1]) + s(c) * (a[1] - b[1])) / d;
    const y = (s(a) * (c[0] - b[0]) + s(b) * (a[0] - c[0]) + s(c) * (b[0] - a[0])) / d;
    return { x, y, r: Math.hypot(a[0] - x, a[1] - y) };
  }
  function vecAz(az, alt) { const a = az * DEG, e = alt * DEG; return [Math.cos(e) * Math.sin(a), Math.cos(e) * Math.cos(a), Math.sin(e)]; }

  function paint(time) {
    const date = when(), side = lst(date), b = basis();
    const dark = Math.max(0, Math.min(1, (-sunAlt - 2) / 14));
    /* Đường chân trời qua phép chiếu vẫn là đường tròn; bầu trời nằm trong nó */
    const pts = [0, 120, 240].map((az) => { const q = [0, 0]; project(vecAz(az, 0), b, q); return q; });
    const hz = circle(pts[0], pts[1], pts[2]);
    g.fillStyle = '#04070d';
    g.fillRect(0, 0, W, H);
    g.save();
    g.beginPath();
    g.arc(hz.x, hz.y, hz.r, 0, Math.PI * 2);
    g.clip();
    const grad = g.createRadialGradient(hz.x, hz.y, hz.r * 0.15, hz.x, hz.y, hz.r);
    grad.addColorStop(0, 'rgb(' + [Math.round(6 + (1 - dark) * 38), Math.round(11 + (1 - dark) * 86), Math.round(30 + (1 - dark) * 140)] + ')');
    grad.addColorStop(1, 'rgb(' + [Math.round(20 + (1 - dark) * 110), Math.round(32 + (1 - dark) * 120), Math.round(66 + (1 - dark) * 130)] + ')');
    g.fillStyle = grad;
    g.fillRect(0, 0, W, H);

    /* Đường nối chòm sao */
    if (showLines) {
      Object.keys(Sky.lines).forEach((id) => {
        const on = chosen && chosen.con === id;
        g.strokeStyle = on ? 'rgba(199,184,255,.95)' : 'rgba(148,170,220,' + (0.34 * dark + 0.05) + ')';
        g.lineWidth = on ? 1.6 : 1;
        g.beginPath();
        Sky.lines[id].forEach((seg) => {
          let drawing = false;
          seg.forEach((pt) => {
            horizon(pt[0] * DEG, pt[1] * DEG, side, tmp);
            if (tmp[2] < -0.05 || !project(tmp, b, p2)) { drawing = false; return; }
            if (drawing) g.lineTo(p2[0], p2[1]); else g.moveTo(p2[0], p2[1]);
            drawing = true;
          });
        });
        g.stroke();
      });
    }
    if (showNames) {
      g.font = '500 13px Saira, sans-serif';
      g.textAlign = 'center';
      Sky.cons.forEach(([id, name, ra, dec]) => {
        if (!Sky.lines[id]) return;
        horizon(ra * DEG, dec * DEG, side, tmp);
        if (tmp[2] < 0.04 || !project(tmp, b, p2)) return;
        if (!CONS_VI[id] && camera.zoom < 1.5) return;
        g.fillStyle = 'rgba(168,190,235,' + (0.62 * dark + 0.18) + ')';
        g.fillText(CONS_VI[id] || name, p2[0], p2[1]);
      });
    }
    /* Sao */
    const twinkle = !reduceMotion;
    const n = Sky.stars.length, boost = Math.pow(camera.zoom, 0.35);
    g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < n; i++) {
      const s = starData[i];
      tmp[0] = -s.cd * Math.sin(side - s.ra);
      const sl = Math.sin(lat * DEG), cl = Math.cos(lat * DEG), ch = Math.cos(side - s.ra);
      tmp[1] = s.sd * cl - s.cd * sl * ch;
      tmp[2] = s.sd * sl + s.cd * cl * ch;
      spots[i * 3 + 2] = 0;
      if (tmp[2] < -0.02 || !project(tmp, b, p2)) continue;
      if (p2[0] < -20 || p2[1] < -20 || p2[0] > W + 20 || p2[1] > H + 20) continue;
      spots[i * 3] = p2[0]; spots[i * 3 + 1] = p2[1]; spots[i * 3 + 2] = 1;
      const near = Math.min(1, tmp[2] / 0.18 + 0.28);
      const flick = twinkle && s.mag < 4 ? 0.82 + 0.18 * Math.sin(time * 0.0031 * (1 + i % 5) + i) : 1;
      const r = Math.max(0.55, (5.4 - s.mag) * 0.5) * boost;
      g.globalAlpha = Math.min(1, (0.28 + (5.4 - s.mag) * 0.2) * dark * near * flick + 0.02);
      g.fillStyle = s.color;
      g.beginPath();
      g.arc(p2[0], p2[1], r, 0, 6.283);
      g.fill();
      if (s.mag < 1.6) {
        g.globalAlpha = 0.16 * dark * near * flick;
        g.beginPath();
        g.arc(p2[0], p2[1], r * 3.4, 0, 6.283);
        g.fill();
      }
    }
    g.globalAlpha = 1;
    g.globalCompositeOperation = 'source-over';
    if (showNames) {
      g.font = '12px Saira, sans-serif';
      g.textAlign = 'left';
      g.fillStyle = 'rgba(223,232,243,' + (0.7 * dark + 0.1) + ')';
      for (let i = 0; i < n; i++) {
        const s = starData[i];
        if (!s.name || spots[i * 3 + 2] === 0) continue;
        if (s.mag < (camera.zoom > 1.8 ? 3.2 : 1.7)) g.fillText((STAR_INFO[s.name] || [s.name])[0], spots[i * 3] + 7, spots[i * 3 + 1] - 5);
      }
    }
    /* Trăng và hành tinh */
    bodies.forEach((o) => {
      horizon(o.ra, o.dec, side, tmp2);
      o.on = tmp2[2] > -0.02 && project(tmp2, b, p2);
      if (!o.on) return;
      o.x = p2[0]; o.y = p2[1];
      const r = o.r * Math.pow(camera.zoom, 0.5);
      g.fillStyle = o.color;
      g.shadowColor = o.color;
      g.shadowBlur = o.id === 'Moon' ? 18 : 8;
      g.beginPath();
      g.arc(o.x, o.y, r, 0, 6.283);
      g.fill();
      g.shadowBlur = 0;
      if (o.id === 'Moon') {
        /* Phần tối của Trăng theo pha thật */
        const k = 1 - 2 * o.phase, dir = o.waxing ? 1 : -1;
        g.fillStyle = '#0b1224';
        g.beginPath();
        g.arc(o.x, o.y, r + 0.3, Math.PI / 2, -Math.PI / 2, dir > 0);
        g.ellipse(o.x, o.y, Math.abs(k) * (r + 0.3), r + 0.3, 0, -Math.PI / 2, Math.PI / 2, k * dir > 0 ? dir < 0 : dir > 0);
        g.fill();
      }
      g.font = '500 13px Saira, sans-serif';
      g.textAlign = 'left';
      g.fillStyle = o.color;
      g.fillText(o.name, o.x + r + 6, o.y + 4);
    });
    if (chosen) {
      const v = chosen.vec(side);
      if (v[2] > -0.02 && project(v, b, p2)) {
        g.strokeStyle = '#c7b8ff';
        g.lineWidth = 1.4;
        g.beginPath();
        g.arc(p2[0], p2[1], 15, 0, 6.283);
        g.stroke();
      }
    }
    g.restore();
    /* Mép chân trời và hướng */
    g.strokeStyle = 'rgba(120,150,200,.45)';
    g.lineWidth = 1;
    g.beginPath();
    g.arc(hz.x, hz.y, hz.r, 0, 6.283);
    g.stroke();
    g.font = '600 15px "Chakra Petch", sans-serif';
    g.textAlign = 'center';
    [['B', 0], ['ĐB', 45], ['Đ', 90], ['ĐN', 135], ['N', 180], ['TN', 225], ['T', 270], ['TB', 315]].forEach(([t, az]) => {
      if (!project(vecAz(az, 2.2), b, p2)) return;
      g.fillStyle = t.length === 1 ? '#c7b8ff' : 'rgba(199,184,255,.55)';
      g.fillText(t, p2[0], p2[1]);
    });
  }
  function loop(time) {
    requestAnimationFrame(loop);
    if (document.body.dataset.room !== 'san' || document.hidden || !built) return;
    if (dirty || (!reduceMotion && time - lastPaint > 66)) {
      dirty = false;
      lastPaint = time;
      paint(time);
    }
  }
  function resize() {
    const r = cv.getBoundingClientRect(), ratio = Math.min(2, devicePixelRatio || 1);
    if (!r.width || !r.height) return;
    W = r.width; H = r.height;
    cv.width = W * ratio; cv.height = H * ratio;
    g.setTransform(ratio, 0, 0, ratio, 0, 0);
    dirty = true;
  }

  /* Bấm vào sao */
  function pick(x, y) {
    let best = null, bestD = 18;
    bodies.forEach((o) => { if (!o.on) return; const d = Math.hypot(o.x - x, o.y - y) - o.r; if (d < bestD) { bestD = d; best = { body: o }; } });
    if (best) return best;
    bestD = 15;
    for (let i = 0; i < starData.length; i++) {
      if (!spots[i * 3 + 2]) continue;
      const d = Math.hypot(spots[i * 3] - x, spots[i * 3 + 1] - y) + starData[i].mag * 0.8;
      if (d < bestD) { bestD = d; best = { star: starData[i] }; }
    }
    return best;
  }
  function choose(hit) {
    const card = $('skyCard');
    if (!hit) { chosen = null; card.hidden = true; dirty = true; return; }
    const side = lst(when()), v = [0, 0, 0];
    if (hit.body) {
      const o = hit.body;
      horizon(o.ra, o.dec, side, v);
      chosen = { con: null, vec: (s) => horizon(o.ra, o.dec, s, [0, 0, 0]) };
      const where = altAz(v), au = o.id === 'Moon' ? Math.round(o.dist * 149597870.7).toLocaleString('vi-VN') + ' km' : o.dist.toFixed(2) + ' AU';
      card.replaceChildren(h('button', { type: 'button', class: 'w-close', onclick: () => choose(null) }, 'Đóng'), h('h2', null, o.name), h('p', null, 'Đang sáng ' + Math.round(o.phase * 100) + '% bề mặt nhìn từ Trái Đất.'), h('p', null, 'Cách Trái Đất ' + au + '.'), h('p', null, placeText(where)));
    } else {
      const s = hit.star, info = STAR_INFO[s.name];
      horizon(s.ra, s.dec, side, v);
      chosen = { con: s.c, vec: (q) => horizon(s.ra, s.dec, q, [0, 0, 0]) };
      const conName = s.c ? (CONS_VI[s.c] || (Sky.cons.find((c) => c[0] === s.c) || [0, s.c])[1]) : '';
      card.replaceChildren(h('button', { type: 'button', class: 'w-close', onclick: () => choose(null) }, 'Đóng'),
        h('h2', null, info ? info[0] : (s.name || 'Sao chưa có tên riêng')), info ? h('p', { class: 'sky-latin' }, s.name) : null,
        conName ? h('p', null, 'Chòm ' + conName + '.') : null,
        h('p', null, 'Cấp sáng ' + s.mag.toFixed(2) + ', màu ' + bvName(s.bv) + ', bề mặt khoảng ' + tempOf(s.bv).toLocaleString('vi-VN') + ' K.'),
        info ? h('p', null, 'Cách Trái Đất khoảng ' + info[1].toLocaleString('vi-VN') + ' năm ánh sáng.') : null,
        h('p', null, placeText(altAz(v))));
    }
    card.hidden = false;
    dirty = true;
  }
  function placeText(w) { return w.alt < 0 ? 'Đang ở dưới đường chân trời.' : 'Cao ' + Math.round(w.alt) + ' độ, hướng ' + dirName(w.az) + '.'; }
  function aim(v) { const w = altAz(v); camera.az = w.az; camera.alt = Math.max(8, Math.min(88, w.alt)); dirty = true; }

  function setupControls() {
    const select = $('skyCity');
    Object.entries(CITIES).forEach(([id, c]) => select.append(h('option', { value: id }, c[0])));
    select.append(h('option', { value: 'me' }, 'Vị trí của tôi'));
    if (store.city === 'me' || !CITIES[store.city]) store.city = 'dongnai';
    select.value = store.city;
    const place = () => { [, lat, lon] = CITIES[store.city]; updateBodies(); infoLine(); dirty = true; };
    select.addEventListener('change', () => {
      if (select.value !== 'me') { store.city = select.value; save(); return place(); }
      if (!navigator.geolocation) { select.value = store.city; return; }
      navigator.geolocation.getCurrentPosition((p) => { lat = p.coords.latitude; lon = p.coords.longitude; store.city = 'me'; updateBodies(); infoLine(); dirty = true; }, () => { select.value = store.city; });
    });
    const slider = $('skyTime');
    const apply = () => { offsetMin = Number(slider.value); updateBodies(); infoLine(); dirty = true; };
    slider.addEventListener('input', apply);
    $('skyReset').addEventListener('click', () => { slider.value = 0; apply(); });
    $('skyLines').addEventListener('change', (e) => { showLines = e.target.checked; dirty = true; });
    $('skyNames').addEventListener('change', (e) => { showNames = e.target.checked; dirty = true; });
    /* Danh sách tìm sao */
    const find = $('skyFind');
    const options = [...BODIES.map((b) => [b[1], 'b:' + b[0]]), ...Sky.cons.filter((c) => CONS_VI[c[0]]).map((c) => ['Chòm ' + CONS_VI[c[0]], 'c:' + c[0]]), ...starData.filter((s) => STAR_INFO[s.name]).map((s) => [STAR_INFO[s.name][0], 's:' + s.name])];
    options.sort((a, b) => a[0].localeCompare(b[0], 'vi')).forEach(([label, value]) => find.append(h('option', { value }, label)));
    find.addEventListener('change', () => {
      const [kind, id] = [find.value.slice(0, 1), find.value.slice(2)];
      const side = lst(when());
      if (kind === 'b') { const o = bodies.find((x) => x.id === id); if (o) { aim(horizon(o.ra, o.dec, side, [0, 0, 0])); o.on = o.on || false; choose({ body: o }); } }
      if (kind === 's') { const s = starData.find((x) => x.name === id); if (s) { aim(horizon(s.ra, s.dec, side, [0, 0, 0])); choose({ star: s }); } }
      if (kind === 'c') { const c = Sky.cons.find((x) => x[0] === id); if (c) { aim(horizon(c[2] * DEG, c[3] * DEG, side, [0, 0, 0])); chosen = { con: id, vec: (q) => horizon(c[2] * DEG, c[3] * DEG, q, [0, 0, 0]) }; $('skyCard').hidden = true; dirty = true; } }
    });
    /* Kéo để nhìn quanh, cuộn để phóng to */
    let drag = null;
    cv.addEventListener('pointerdown', (e) => { cv.setPointerCapture(e.pointerId); drag = { x: e.clientX, y: e.clientY, az: camera.az, alt: camera.alt, moved: false }; });
    cv.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (Math.hypot(dx, dy) > 4) drag.moved = true;
      const speed = 95 / (camera.zoom * Math.min(W, H));
      camera.az = (drag.az - dx * speed + 360) % 360;
      camera.alt = Math.max(6, Math.min(88, drag.alt + dy * speed));
      dirty = true;
    });
    cv.addEventListener('pointerup', (e) => {
      if (drag && !drag.moved) { const r = cv.getBoundingClientRect(); choose(pick(e.clientX - r.left, e.clientY - r.top)); }
      drag = null;
    });
    cv.addEventListener('wheel', (e) => { e.preventDefault(); camera.zoom = Math.max(0.7, Math.min(5, camera.zoom * Math.exp(-e.deltaY * 0.0012))); dirty = true; }, { passive: false });
    cv.addEventListener('keydown', (e) => {
      const map = { ArrowLeft: [-5, 0], ArrowRight: [5, 0], ArrowUp: [0, 4], ArrowDown: [0, -4] }, m = map[e.key];
      if (m) { e.preventDefault(); camera.az = (camera.az + m[0] / camera.zoom + 360) % 360; camera.alt = Math.max(6, Math.min(88, camera.alt + m[1] / camera.zoom)); dirty = true; }
      if (e.key === '+' || e.key === '=') { camera.zoom = Math.min(5, camera.zoom * 1.2); dirty = true; }
      if (e.key === '-') { camera.zoom = Math.max(0.7, camera.zoom / 1.2); dirty = true; }
    });
    new ResizeObserver(resize).observe(cv);
    place();
  }
  async function build() {
    built = 'loading';
    cv = $('skyCanvas');
    g = cv.getContext('2d');
    if (!window.SKY) await loadScript('data/sky.js');
    Sky = window.SKY;
    starData = Sky.stars.map((s) => ({ ra: s[0] * DEG, dec: s[1] * DEG, sd: Math.sin(s[1] * DEG), cd: Math.cos(s[1] * DEG), mag: s[2], bv: s[3], c: s[4], name: s[5] || '', color: bvColor(s[3]) }));
    spots = new Float32Array(starData.length * 3);
    resize();
    setupControls();
    built = true;
    requestAnimationFrame(loop);
    try { await loadScript(ENGINE); updateBodies(); infoLine(); dirty = true; } catch (e) { /* không tải được thì vẫn có sao */ }
  }

  /* Sổ: nhật ký và thư */
  const MOODS = ['Vui', 'Bình yên', 'Biết ơn', 'Mệt', 'Buồn'];
  function renderBook() {
    document.querySelectorAll('.sky-tab').forEach((b) => { const on = b.dataset.tab === store.tab; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); });
    const due = dueLetters().length;
    $('skyLetterTab').textContent = 'Thư tương lai' + (due ? ' (' + due + ' thư đến hạn)' : '');
    (store.tab === 'letters' ? renderLetters : renderDiary)();
  }
  let editing = null;
  function renderDiary() {
    const entry = editing ? store.diary.find((d) => d.id === editing) : null;
    const date = h('input', { type: 'date', value: entry ? entry.date : today(), max: today(), 'aria-label': 'Ngày viết' });
    let mood = entry ? entry.mood : '';
    const chips = h('div', { class: 'sky-moods', role: 'group', 'aria-label': 'Tâm trạng' }, MOODS.map((m) => {
      const b = h('button', { type: 'button', class: 'chip', 'aria-pressed': String(m === mood), onclick: () => {
        mood = mood === m ? '' : m;
        chips.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', String(c.textContent === mood)));
      } }, m);
      return b;
    }));
    const text = h('textarea', { rows: 5, maxLength: 8000, placeholder: 'Hôm nay của bạn thế nào?', 'aria-label': 'Nội dung nhật ký', value: entry ? entry.text : '' });
    const msg = h('p', { class: 'sky-msg', role: 'status' });
    const form = h('form', { class: 'sky-form', onsubmit: (e) => {
      e.preventDefault();
      const value = text.value.trim();
      if (!value) { msg.textContent = 'Viết vài dòng rồi lưu nhé.'; text.focus(); return; }
      if (entry) Object.assign(entry, { date: date.value, mood, text: value });
      else store.diary.push({ id: uid(), date: date.value || today(), mood, text: value, sky: moonText });
      store.diary.sort((a, b) => b.date.localeCompare(a.date));
      save();
      editing = null;
      renderBook();
    } }, h('div', { class: 'sky-row' }, date, entry ? h('button', { type: 'button', class: 'ghost-btn', onclick: () => { editing = null; renderBook(); } }, 'Hủy sửa') : null), chips, text, msg, h('button', { type: 'submit', class: 'play-btn' }, entry ? 'Lưu thay đổi' : 'Lưu vào nhật ký'));
    const list = store.diary.length ? h('ul', { class: 'sky-list' }, store.diary.map((d) => h('li', null,
      h('p', { class: 'sky-meta' }, show(d.date), d.mood ? h('b', null, d.mood) : null, d.sky ? h('span', null, d.sky) : null),
      h('p', { class: 'sky-text' }, d.text),
      h('p', { class: 'sky-acts' },
        h('button', { type: 'button', onclick: () => { editing = d.id; renderBook(); $('skyBody').scrollTop = 0; } }, 'Sửa'),
        h('button', { type: 'button', onclick: () => { if (confirm('Xóa trang nhật ký ngày ' + show(d.date) + '? Không khôi phục được.')) { store.diary = store.diary.filter((x) => x.id !== d.id); save(); renderBook(); } } }, 'Xóa'))))) : h('p', { class: 'sky-empty' }, 'Chưa có trang nào. Trang đầu tiên sẽ ghi lại cả dáng Trăng đêm nay.');
    $('skyBody').replaceChildren(form, list, backupRow());
  }
  function renderLetters() {
    let open = addMonths(12);
    const date = h('input', { type: 'date', value: open, min: addDays(1), 'aria-label': 'Ngày mở thư', oninput: () => { open = date.value; } });
    const quick = h('div', { class: 'sky-moods', role: 'group', 'aria-label': 'Chọn nhanh' }, [['1 tháng', 1], ['6 tháng', 6], ['1 năm', 12], ['5 năm', 60]].map(([label, n]) => h('button', { type: 'button', class: 'chip', onclick: () => { open = addMonths(n); date.value = open; } }, label)));
    const text = h('textarea', { rows: 5, maxLength: 8000, placeholder: 'Gửi bạn của sau này...', 'aria-label': 'Nội dung thư' });
    const msg = h('p', { class: 'sky-msg', role: 'status' });
    const form = h('form', { class: 'sky-form', onsubmit: (e) => {
      e.preventDefault();
      const value = text.value.trim();
      if (!value) { msg.textContent = 'Thư chưa có nội dung.'; text.focus(); return; }
      if (!date.value || date.value <= today()) { msg.textContent = 'Chọn một ngày trong tương lai.'; date.focus(); return; }
      store.letters.push({ id: uid(), wrote: today(), open: date.value, text: value, read: false });
      store.letters.sort((a, b) => a.open.localeCompare(b.open));
      save();
      renderBook();
    } }, h('label', { class: 'sky-label' }, 'Mở vào ngày', date), quick, text, msg, h('button', { type: 'submit', class: 'play-btn' }, 'Niêm phong thư'));
    const row = (l) => {
      const ready = l.open <= today();
      if (ready && l.opened) return h('li', null, h('p', { class: 'sky-meta' }, 'Viết ngày ' + show(l.wrote)), h('p', { class: 'sky-text' }, l.text), h('p', { class: 'sky-acts' }, h('button', { type: 'button', onclick: () => remove(l, 'Xóa lá thư này?') }, 'Xóa')));
      if (ready) return h('li', { class: 'sky-due' }, h('p', { class: 'sky-meta' }, 'Viết ngày ' + show(l.wrote)), h('button', { type: 'button', class: 'play-btn', onclick: () => { l.opened = true; l.read = true; save(); renderBook(); notify(); } }, 'Mở thư'));
      return h('li', { class: 'sky-sealed' }, h('p', { class: 'sky-meta' }, 'Viết ngày ' + show(l.wrote)), h('p', null, 'Mở vào ' + show(l.open) + ', còn ' + daysTo(l.open) + ' ngày'), h('p', { class: 'sky-acts' }, h('button', { type: 'button', onclick: () => calendar(l) }, 'Thêm nhắc vào lịch'), h('button', { type: 'button', onclick: () => remove(l, 'Hủy lá thư chưa mở này? Nội dung sẽ mất.') }, 'Hủy thư')));
    };
    $('skyBody').replaceChildren(form, store.letters.length ? h('ul', { class: 'sky-list' }, store.letters.map(row)) : h('p', { class: 'sky-empty' }, 'Chưa có lá thư nào đang chờ.'), h('p', { class: 'sky-note' }, 'Thư lưu trong trình duyệt này, không gửi qua email. Đến ngày, mở đúng trình duyệt này để đọc.'), backupRow());
  }
  const addDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return iso(d); };
  function remove(l, question) { if (confirm(question)) { store.letters = store.letters.filter((x) => x.id !== l.id); save(); renderBook(); notify(); } }
  function download(name, type, text) {
    const a = h('a', { href: URL.createObjectURL(new Blob([text], { type })), download: name });
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
  function calendar(l) {
    const day = l.open.replace(/-/g, '');
    download('mo-thu-' + l.open + '.ics', 'text/calendar', ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Xuong cua Thuc//VI', 'BEGIN:VEVENT', 'UID:' + l.id + '@xuong-cua-thuc', 'DTSTAMP:' + new Date().toISOString().replace(/[-:]|\.\d+/g, ''), 'DTSTART;VALUE=DATE:' + day, 'SUMMARY:Mở thư gửi tương lai ở Xưởng của Thức', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n'));
  }
  function backupRow() {
    const file = h('input', { type: 'file', accept: 'application/json', hidden: true, onchange: async () => {
      try {
        const data = JSON.parse(await file.files[0].text());
        if (!Array.isArray(data.diary) || !Array.isArray(data.letters)) throw new Error('bad');
        const merge = (old, add) => old.concat(add.filter((x) => x.id && !old.some((o) => o.id === x.id)));
        store.diary = merge(store.diary, data.diary).sort((a, b) => b.date.localeCompare(a.date));
        store.letters = merge(store.letters, data.letters).sort((a, b) => a.open.localeCompare(b.open));
        save(); renderBook(); notify();
      } catch (e) { alert('Tệp này không phải bản sao của Sân Thượng.'); }
    } });
    return h('div', { class: 'sky-backup' }, h('p', { class: 'sky-note' }, 'Nhật ký chỉ nằm trong trình duyệt này. Thỉnh thoảng hãy tải bản sao.'), h('p', { class: 'sky-acts' },
      h('button', { type: 'button', onclick: () => download('san-thuong-' + today() + '.json', 'application/json', JSON.stringify({ diary: store.diary, letters: store.letters }, null, 1)) }, 'Tải bản sao'),
      h('button', { type: 'button', onclick: () => file.click() }, 'Nhập bản sao')), file);
  }
  function notify() { document.dispatchEvent(new CustomEvent('tp:letters', { detail: dueLetters().length })); }

  return {
    init() {
      document.querySelectorAll('.sky-tab').forEach((b) => b.addEventListener('click', () => { store.tab = b.dataset.tab; save(); editing = null; renderBook(); }));
      $('skyFold').addEventListener('click', () => {
        const shut = $('skyBook').classList.toggle('shut');
        $('skyFold').textContent = shut ? 'Mở sổ' : 'Gấp sổ';
        $('skyFold').setAttribute('aria-expanded', String(!shut));
      });
      renderBook();
    },
    enter() { if (!built) build(); else { updateBodies(); infoLine(); resize(); } renderBook(); },
    dueCount() { return dueLetters().length; }
  };
})();
