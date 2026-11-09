/* Các cảnh tranh của Phòng Học: tranh nét, thêm đốm sáng bay; Thủy cung có cá bơi lặp. Tranh chỉ tải khi được chọn. */
window.StudyScenes = (function () {
  'use strict';
  var W = 0, H = 0, dpr = 1, current = '', images = {}, item = {};

  var SCENES = {
    co: { name: 'Đồng cỏ', mote: '#fff3c4', motes: 34 },
    suoi: { name: 'Suối', mote: '#eef8d8', motes: 20 },
    rung: { name: 'Rừng', mote: '#fbf3b6', motes: 60 },
    thac: { name: 'Thác núi', mote: '#f2fbff', motes: 28 },
    bien: { name: 'Bờ biển', mote: '#fff4e0', motes: 14 },
    lop: { name: 'Lớp học', mote: '#fff0cf', motes: 40 },
    thuy: { name: 'Thủy cung', mote: '#e6fbff', motes: 0 }
  };

  function seeded(s) { return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function initMotes(scene) {
    var r = seeded(41);
    item.motes = [];
    for (var i = 0; i < scene.motes; i++) item.motes.push({ x: r() * W, y: r() * H * 0.9, p: r() * 6.28, r: 0.9 + r() * 1.6 });
  }

  /* Cá và sinh vật biển bơi lặp trên tranh Thủy cung */
  function initSea() {
    var r = seeded(29), i;
    item.schools = [
      { n: 46, color: '#dcEEF2', size: 12, cx: 0.74, cy: 0.56, ax: 0.14, ay: 0.08, wx: 0.11, wy: 0.23, spread: 0.1 },
      { n: 34, color: '#f1e27e', size: 11, cx: 0.8, cy: 0.74, ax: 0.1, ay: 0.05, wx: 0.13, wy: 0.31, spread: 0.08 },
      { n: 40, color: '#bfe2ee', size: 10, cx: 0.5, cy: 0.42, ax: 0.2, ay: 0.08, wx: 0.09, wy: 0.17, spread: 0.11 }
    ];
    item.schools.forEach(function (s) {
      s.p = r() * 6.28; s.fish = [];
      for (var f = 0; f < s.n; f++) s.fish.push({ x: (r() + r() - 1) * s.spread, y: (r() + r() - 1) * s.spread * 0.55, p: r() * 6.28, k: 0.7 + r() * 0.6 });
    });
    item.swim = [];
    function add(kind, count, lenMin, lenMax, yMin, yMax, vMin, vMax, color) {
      for (var n = 0; n < count; n++) item.swim.push({ kind: kind, x: r() * W, y: H * (yMin + r() * (yMax - yMin)), len: lenMin + r() * (lenMax - lenMin), v: vMin + r() * (vMax - vMin), dir: r() < 0.5 ? -1 : 1, p: r() * 6.28, color: color });
    }
    add('fish', 14, 30, 50, 0.06, 0.56, 14, 26, '#1d6496');
    add('fish', 8, 70, 110, 0.08, 0.54, 26, 40, '#c4d8df');
    add('fish', 3, 130, 170, 0.14, 0.5, 20, 28, '#163f68');
    add('turtle', 1, 90, 110, 0.2, 0.46, 18, 24, '#3f6b58');
    add('shark', 2, 230, 290, 0.16, 0.5, 34, 46, '#2b4f6e');
    add('manta', 2, 190, 250, 0.06, 0.3, 24, 32, '#0d3259');
    item.swim.sort(function (a, b) { return a.len - b.len; });
    item.bubbles = [];
    for (i = 0; i < 34; i++) item.bubbles.push({ x: [0.42, 0.62, 0.9][i % 3] * W + (r() - 0.5) * 60, y: r() * H, v: 30 + r() * 44, r: 1.5 + r() * 4, p: r() * 6.28 });
  }
  function bigFish(g, s, wag) {
    g.fillStyle = s.color;
    g.beginPath();
    g.moveTo(50, 0);
    g.bezierCurveTo(30, -24, -14, -22, -36, -3);
    g.lineTo(-52, -18 + wag * 3); g.lineTo(-46, 0); g.lineTo(-52, 18 + wag * 3); g.lineTo(-36, 3);
    g.bezierCurveTo(-14, 22, 30, 22, 50, 0);
    g.fill();
    g.beginPath(); g.moveTo(8, -20); g.lineTo(-16, -33); g.lineTo(-20, -15); g.fill();
    g.fillStyle = 'rgba(235,248,250,.3)';
    g.beginPath(); g.moveTo(44, 3); g.bezierCurveTo(24, 18, -12, 17, -32, 3); g.closePath(); g.fill();
    g.fillStyle = '#0a2238';
    g.beginPath(); g.arc(33, -5, 2.4, 0, 6.29); g.fill();
  }
  function shark(g, s, wag) {
    g.fillStyle = s.color;
    g.beginPath();
    g.moveTo(52, 1);
    g.bezierCurveTo(30, -11, -12, -11, -35, -2);
    g.lineTo(-54, -17 + wag * 4); g.lineTo(-47, 0); g.lineTo(-50, 10 + wag * 4); g.lineTo(-35, 2);
    g.bezierCurveTo(-12, 9, 30, 9, 52, 1);
    g.fill();
    g.beginPath(); g.moveTo(10, -9); g.lineTo(-3, -24); g.lineTo(-8, -9); g.fill();
    g.beginPath(); g.moveTo(14, 5); g.lineTo(2, 19); g.lineTo(-3, 6); g.fill();
    g.fillStyle = 'rgba(220,235,240,.4)';
    g.beginPath(); g.moveTo(50, 2); g.bezierCurveTo(28, 9, -10, 8, -30, 2); g.closePath(); g.fill();
  }
  function manta(g, s, now) {
    var flap = Math.sin(now / 950 + s.p) * 12;
    g.rotate(1.75);
    g.strokeStyle = s.color;
    g.lineWidth = 1;
    g.beginPath(); g.moveTo(0, 16); g.quadraticCurveTo(Math.sin(now / 800 + s.p) * 6, 44, 0, 66); g.stroke();
    g.fillStyle = s.color;
    g.beginPath();
    g.moveTo(-9, -24); g.quadraticCurveTo(-30, -22, -52, -6 + flap);
    g.quadraticCurveTo(-30, 8, -7, 24); g.lineTo(7, 24);
    g.quadraticCurveTo(30, 8, 52, -6 + flap); g.quadraticCurveTo(30, -22, 9, -24);
    g.quadraticCurveTo(0, -18, -9, -24);
    g.fill();
  }
  function turtle(g, s, now) {
    var paddle = Math.sin(now / 700 + s.p) * 0.5;
    g.fillStyle = '#6f9a78';
    g.save(); g.translate(24, 12); g.rotate(0.7 + paddle); g.beginPath(); g.ellipse(0, 18, 7, 22, 0, 0, 6.29); g.fill(); g.restore();
    g.save(); g.translate(-26, 12); g.rotate(-0.5 - paddle * 0.6); g.beginPath(); g.ellipse(0, 12, 5, 13, 0, 0, 6.29); g.fill(); g.restore();
    g.beginPath(); g.ellipse(48, -3, 11, 8, 0, 0, 6.29); g.fill();
    g.fillStyle = s.color;
    g.beginPath(); g.ellipse(0, 0, 40, 23, 0, 0, 6.29); g.fill();
  }
  function drawSea(g, now, dt) {
    var t = now / 1000;
    item.schools.forEach(function (s) {
      var px = s.cx + s.ax * Math.sin(t * s.wx + s.p), py = s.cy + s.ay * Math.sin(t * s.wy + s.p * 1.3);
      var dir = Math.cos(t * s.wx + s.p) >= 0 ? 1 : -1;
      g.fillStyle = s.color;
      g.beginPath();
      s.fish.forEach(function (f) {
        var x = W * (px + f.x + Math.sin(t * 0.7 + f.p) * 0.008), y = H * (py + f.y + Math.cos(t * 0.9 + f.p) * 0.012);
        var L = s.size * f.k, h = L * 0.3, tail = Math.sin(t * 9 + f.p) * h * 0.5;
        g.moveTo(x + dir * L * 0.55, y);
        g.quadraticCurveTo(x, y - h * 1.5, x - dir * L * 0.32, y);
        g.lineTo(x - dir * L * 0.62, y - h + tail); g.lineTo(x - dir * L * 0.62, y + h + tail); g.lineTo(x - dir * L * 0.32, y);
        g.quadraticCurveTo(x, y + h * 1.5, x + dir * L * 0.55, y);
      });
      g.fill();
    });
    item.swim.forEach(function (s) {
      s.x += s.v * s.dir * dt;
      var margin = s.len;
      if (s.dir > 0 && s.x > W + margin) s.x = -margin;
      if (s.dir < 0 && s.x < -margin) s.x = W + margin;
      var wag = Math.sin(t * (s.kind === 'shark' ? 3.2 : 6) + s.p);
      g.save();
      g.globalAlpha = 0.9;
      g.translate(s.x, s.y + Math.sin(t * 0.5 + s.p) * 14);
      g.scale(s.dir * s.len / 100, s.len / 100);
      if (s.kind === 'shark') shark(g, s, wag);
      else if (s.kind === 'manta') manta(g, s, now);
      else if (s.kind === 'turtle') turtle(g, s, now);
      else bigFish(g, s, wag);
      g.restore();
    });
    g.strokeStyle = 'rgba(225,250,255,.6)';
    g.lineWidth = 1;
    item.bubbles.forEach(function (b) {
      b.y -= b.v * dt;
      if (b.y < -10) b.y = H * 0.9;
      g.beginPath(); g.arc(b.x + Math.sin(t * 2 + b.p) * 5, b.y, b.r, 0, 6.29); g.stroke();
    });
  }

  function prepare(id, width, height, ratio, redraw) {
    W = width; H = height; dpr = ratio; current = id;
    item = {};
    initMotes(SCENES[id]);
    if (id === 'thuy') initSea();
    var img = images[id];
    if (!img) {
      img = images[id] = new Image();
      img.onload = function () { if (current === id && redraw) redraw(); };
      img.src = 'assets/scenes/' + id + '.jpg?v=2';
    }
  }
  function drawPicture(g, img) {
    var scale = Math.max(W / img.naturalWidth, H / img.naturalHeight), w = img.naturalWidth * scale, h = img.naturalHeight * scale;
    g.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
  }
  function draw(g, id, now, dt) {
    var scene = SCENES[id], img = images[id];
    if (!img || !img.naturalWidth) { g.fillStyle = '#0b1a2b'; g.fillRect(0, 0, W, H); return; }
    drawPicture(g, img);
    var shade = g.createLinearGradient(0, 0, 0, H * 0.14);
    shade.addColorStop(0, 'rgba(5,7,13,.6)');
    shade.addColorStop(1, 'rgba(5,7,13,0)');
    g.fillStyle = shade;
    g.fillRect(0, 0, W, H * 0.14);
    g.fillStyle = scene.mote;
    item.motes.forEach(function (m) {
      g.globalAlpha = 0.25 + 0.45 * Math.abs(Math.sin(now / 1200 + m.p));
      g.beginPath(); g.arc(m.x + Math.sin(now / 2100 + m.p) * 18, m.y + Math.cos(now / 2600 + m.p) * 14, m.r, 0, 6.29); g.fill();
    });
    g.globalAlpha = 1;
    if (id === 'thuy') drawSea(g, now, dt);
  }
  return {
    list: Object.keys(SCENES).map(function (id) { return { id: id, name: SCENES[id].name }; }),
    has: function (id) { return !!SCENES[id]; },
    prepare: prepare,
    draw: draw
  };
})();
