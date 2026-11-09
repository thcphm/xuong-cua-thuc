/* Các cảnh nền vẽ bằng canvas của Phòng Học. Phần tĩnh vẽ sẵn một lần, mỗi khung hình chỉ vẽ phần chuyển động. */
window.StudyScenes = (function () {
  'use strict';
  var W = 0, H = 0, dpr = 1, back = null, current = '', item = {};

  function seeded(s) { return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function fill(c, stops, x0, y0, x1, y1, rect) {
    var grad = c.createLinearGradient(x0, y0, x1, y1);
    stops.forEach(function (s) { grad.addColorStop(s[0], s[1]); });
    c.fillStyle = grad;
    c.fillRect(rect[0], rect[1], rect[2], rect[3]);
  }
  function glow(c, x, y, r, color, alpha) {
    var grad = c.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, color);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    c.globalAlpha = alpha;
    c.fillStyle = grad;
    c.fillRect(x - r, y - r, r * 2, r * 2);
    c.globalAlpha = 1;
  }
  function ridge(c, base, amp, freq, phase, color) {
    c.fillStyle = color;
    c.beginPath();
    c.moveTo(0, H);
    for (var x = 0; x <= W + 12; x += 12) {
      var t = x / W * 6.283;
      c.lineTo(x, base + Math.sin(t * freq + phase) * amp + Math.sin(t * freq * 2.3 + phase * 1.7) * amp * 0.35);
    }
    c.lineTo(W, H);
    c.closePath();
    c.fill();
  }
  function treeLine(c, base, tall, color, r) {
    c.fillStyle = color;
    c.fillRect(0, base, W, H - base);
    for (var x = -20; x < W + 20; x += 10 + r() * 16) {
      var size = tall * (0.4 + r() * 0.6);
      c.beginPath();
      c.ellipse(x, base - size * 0.35, size * 0.5, size * 0.75, 0, 0, 6.29);
      c.fill();
    }
  }

  /* Mây mềm: nhiều cụm bông chồng lên nhau trong một ảnh, đổ màu theo nắng chiều. Chỉ vẽ một lần. */
  var cloudImages = null;
  function clouds() {
    if (cloudImages) return cloudImages;
    var r = seeded(23);
    cloudImages = [0, 1, 2, 3].map(function () {
      var w = 520, h = 220, canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      var c = canvas.getContext('2d');
      for (var i = 0; i < 90; i++) {
        var side = r() + r() - 1, x = w / 2 + side * w * 0.4, lift = (1 - side * side) * h * 0.62 * r();
        var y = h * 0.74 - lift, rad = (1 - Math.abs(side) * 0.6) * (24 + r() * 42);
        var puff = c.createRadialGradient(x, y, 0, x, y, rad);
        puff.addColorStop(0, 'rgba(255,255,255,.62)');
        puff.addColorStop(0.55, 'rgba(255,255,255,.3)');
        puff.addColorStop(1, 'rgba(255,255,255,0)');
        c.fillStyle = puff;
        c.fillRect(x - rad, y - rad, rad * 2, rad * 2);
      }
      c.globalCompositeOperation = 'source-atop';
      var tone = c.createLinearGradient(0, h * 0.1, 0, h * 0.85);
      tone.addColorStop(0, '#fffaf0'); tone.addColorStop(0.55, '#ffe9d4'); tone.addColorStop(1, '#c7a6b4');
      c.fillStyle = tone;
      c.fillRect(0, 0, w, h);
      return canvas;
    });
    return cloudImages;
  }

  /* Thú trong rừng: vẽ quanh điểm chân chạm đất, mặt quay sang phải */
  function rabbit(g, t) {
    var phase = t * 5.2, hop = Math.abs(Math.sin(phase));
    g.translate(0, -hop * 30);
    g.rotate((Math.cos(phase) * (Math.sin(phase) >= 0 ? 1 : -1)) * -0.2);
    g.fillStyle = '#a08e78';
    g.beginPath(); g.ellipse(-2, -14, 18, 11, 0, 0, 6.29); g.fill();
    g.beginPath(); g.ellipse(-11, -12, 11, 11, 0, 0, 6.29); g.fill();
    g.beginPath(); g.ellipse(15, -24, 8.5, 7, 0.2, 0, 6.29); g.fill();
    g.beginPath(); g.ellipse(11, -39, 2.8, 11, -0.2, 0, 6.29); g.fill();
    g.beginPath(); g.ellipse(16, -38, 2.8, 11, 0.12, 0, 6.29); g.fill();
    g.strokeStyle = '#a08e78';
    g.lineWidth = 4;
    g.lineCap = 'round';
    var reach = 5 + hop * 12;
    g.beginPath(); g.moveTo(10, -6); g.lineTo(10 + reach, 0); g.moveTo(-12, -4); g.lineTo(-12 - reach, 0); g.stroke();
    g.fillStyle = '#f1ece2';
    g.beginPath(); g.arc(-21, -17, 4.5, 0, 6.29); g.fill();
    g.fillStyle = '#20180f';
    g.beginPath(); g.arc(18, -26, 1.3, 0, 6.29); g.fill();
  }
  function deer(g, t) {
    var phase = t * 3.4;
    g.translate(0, Math.sin(phase * 2) * 1.5);
    g.strokeStyle = '#5b3f28';
    g.lineCap = 'round';
    g.lineWidth = 4.6;
    [[-27, 0], [-20, 3.14], [22, 3.14], [29, 0]].forEach(function (leg) {
      var a = Math.sin(phase + leg[1]) * 0.34, kx = leg[0] + Math.sin(a) * 26, ky = -52 + Math.cos(a) * 26;
      g.beginPath(); g.moveTo(leg[0], -52); g.lineTo(kx, ky); g.lineTo(kx + Math.sin(a * 0.4) * 26, ky + 26); g.stroke();
    });
    g.fillStyle = '#7a5636';
    g.beginPath(); g.ellipse(0, -62, 37, 15, 0, 0, 6.29); g.fill();
    g.beginPath(); g.moveTo(22, -72); g.lineTo(39, -108); g.lineTo(50, -102); g.lineTo(36, -56); g.closePath(); g.fill();
    g.beginPath(); g.ellipse(50, -108, 13, 7, 0.2, 0, 6.29); g.fill();
    g.beginPath(); g.ellipse(36, -113, 3.2, 8, -0.8, 0, 6.29); g.fill();
    g.fillStyle = '#c9ab85';
    g.beginPath(); g.ellipse(0, -54, 28, 6, 0, 0, 6.29); g.fill();
    g.fillStyle = '#efe6d6';
    g.beginPath(); g.ellipse(-38, -68, 5, 7, 0.5, 0, 6.29); g.fill();
    g.strokeStyle = '#4a3322';
    g.lineWidth = 2.2;
    g.beginPath();
    g.moveTo(44, -113); g.lineTo(38, -136); g.moveTo(40, -124); g.lineTo(31, -130); g.moveTo(38, -136); g.lineTo(31, -143);
    g.moveTo(49, -114); g.lineTo(52, -136); g.moveTo(51, -126); g.lineTo(60, -131); g.moveTo(52, -136); g.lineTo(59, -143);
    g.stroke();
    g.fillStyle = '#20180f';
    g.beginPath(); g.arc(52, -110, 1.5, 0, 6.29); g.fill();
  }
  function bird(g, t) {
    var flap = Math.sin(t * 11) * 15;
    g.fillStyle = '#1b2c2e';
    g.strokeStyle = '#1b2c2e';
    g.beginPath(); g.ellipse(0, 0, 13, 4.2, -0.08, 0, 6.29); g.fill();
    g.beginPath(); g.moveTo(11, -2); g.lineTo(20, -1); g.lineTo(11, 2); g.fill();
    g.beginPath(); g.moveTo(-11, 0); g.lineTo(-23, -5); g.lineTo(-22, 4); g.fill();
    g.beginPath(); g.moveTo(5, -2); g.quadraticCurveTo(-4, -12 - flap * 0.5, -14, -22 - flap); g.quadraticCurveTo(-10, -6 - flap * 0.3, -6, -1); g.fill();
    g.globalAlpha = 0.7;
    g.beginPath(); g.moveTo(5, 1); g.quadraticCurveTo(0, -8 - flap * 0.4, -8, -15 - flap * 0.8); g.quadraticCurveTo(-5, -4, -5, 2); g.fill();
    g.globalAlpha = 1;
  }
  var FOREST_ANIMALS = {
    tho: { draw: rabbit, speed: 130, gap: 70, size: 1 },
    huou: { draw: deer, speed: 62, gap: 150, size: 1.15 },
    chim: { draw: bird, speed: 230, gap: 90, size: 1.6 }
  };
  function spawnAnimals() {
    var r = item.rand;
    if (!item.bag.length) item.bag = ['tho', 'huou', 'chim'].sort(function () { return r() - 0.5; });
    var kind = item.bag.pop(), type = FOREST_ANIMALS[kind], count = r() < 0.5 ? 1 : 2, dir = r() < 0.5 ? 1 : -1, unit = H / 900;
    var base = kind === 'chim' ? H * (0.34 + r() * 0.2) : H * (0.81 + r() * 0.03), margin = 180 * unit;
    for (var i = 0; i < count; i++) {
      item.animals.push({
        type: type, dir: dir, size: unit * type.size * (0.9 + r() * 0.2), p: r() * 6.28, margin: margin,
        x: dir > 0 ? -margin - i * type.gap * unit : W + margin + i * type.gap * unit,
        y: base + (kind === 'chim' ? (r() - 0.5) * 50 * unit : i * 5 * unit),
        v: type.speed * unit * (0.92 + r() * 0.16)
      });
    }
  }
  function drawAnimals(g, now, dt) {
    item.nextAnimal -= dt;
    if (item.nextAnimal <= 0 && dt > 0) { spawnAnimals(); item.nextAnimal = 9 + item.rand() * 10; }
    item.animals = item.animals.filter(function (a) { return a.dir > 0 ? a.x < W + a.margin * 2 : a.x > -a.margin * 2; });
    item.animals.forEach(function (a) {
      a.x += a.v * a.dir * dt;
      g.save();
      g.translate(a.x, a.y);
      g.scale(a.dir * a.size, a.size);
      a.type.draw(g, now / 1000 + a.p);
      g.restore();
    });
    g.lineCap = 'butt';
  }

  /* Sinh vật biển của Thủy cung */
  function reef(c, r, cx, width, height, color, count) {
    c.fillStyle = color;
    for (var i = 0; i < count; i++) {
      var side = (r() + r() - 1), x = cx + side * width / 2, top = height * (1 - Math.abs(side)) * (0.35 + r() * 0.65);
      c.beginPath(); c.ellipse(x, H - top * 0.5 - H * 0.07, width * 0.05 + r() * width * 0.09, top * 0.55 + H * 0.02, 0, 0, 6.29); c.fill();
    }
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
    g.fillStyle = 'rgba(235,248,250,.42)';
    g.beginPath(); g.moveTo(44, 3); g.bezierCurveTo(24, 18, -12, 17, -32, 3); g.closePath(); g.fill();
    g.fillStyle = '#0a2238';
    g.beginPath(); g.arc(33, -5, 2.6, 0, 6.29); g.fill();
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
    g.fillStyle = 'rgba(220,235,240,.55)';
    g.beginPath(); g.moveTo(50, 2); g.bezierCurveTo(28, 9, -10, 8, -30, 2); g.closePath(); g.fill();
    g.fillStyle = '#071a2c';
    g.beginPath(); g.arc(39, -2.5, 1.2, 0, 6.29); g.fill();
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
    g.fillStyle = 'rgba(214,236,244,.32)';
    g.beginPath(); g.ellipse(0, 2, 13, 17, 0, 0, 6.29); g.fill();
  }
  function turtle(g, s, now) {
    var paddle = Math.sin(now / 700 + s.p) * 0.5;
    g.fillStyle = '#6f9a78';
    g.save(); g.translate(24, 12); g.rotate(0.7 + paddle); g.beginPath(); g.ellipse(0, 18, 7, 22, 0, 0, 6.29); g.fill(); g.restore();
    g.save(); g.translate(-26, 12); g.rotate(-0.5 - paddle * 0.6); g.beginPath(); g.ellipse(0, 12, 5, 13, 0, 0, 6.29); g.fill(); g.restore();
    g.beginPath(); g.ellipse(48, -3, 11, 8, 0, 0, 6.29); g.fill();
    g.fillStyle = s.color;
    g.beginPath(); g.ellipse(0, 0, 40, 23, 0, 0, 6.29); g.fill();
    g.strokeStyle = 'rgba(190,220,190,.4)';
    g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(-26, -6); g.lineTo(-8, -18); g.lineTo(14, -16); g.lineTo(30, -4); g.moveTo(-8, -18); g.lineTo(-8, 16); g.moveTo(14, -16); g.lineTo(14, 16); g.stroke();
  }

  var SCENES = {
    co: {
      name: 'Đồng cỏ', framed: true,
      paint: function (c, r) {
        fill(c, [[0, '#14294a'], [0.5, '#3f6f8c'], [0.72, '#d9a877'], [1, '#d9a877']], 0, 0, 0, H, [0, 0, W, H]);
        glow(c, W * 0.7, H * 0.62, H * 0.55, '#f7d39a', 0.75);
        ridge(c, H * 0.6, H * 0.03, 1.4, 0.4, '#4a7d68');
        ridge(c, H * 0.66, H * 0.03, 1.9, 2.1, '#376650');
        ridge(c, H * 0.74, H * 0.025, 1.2, 4, '#28523e');
        var colors = ['#ecd67d', '#e8a3ab', '#dfeaf4'];
        for (var i = 0; i < 130; i++) {
          c.fillStyle = colors[i % 3];
          c.globalAlpha = 0.75;
          c.beginPath(); c.arc(r() * W, H * (0.77 + r() * 0.09), 1 + r() * 1.4, 0, 6.29); c.fill();
        }
        c.globalAlpha = 1;
      },
      init: function (r) {
        var images = clouds();
        item.clouds = [];
        for (var i = 0; i < 9; i++) {
          var near = i < 3, wide = W * (near ? 0.26 + r() * 0.12 : 0.09 + r() * 0.1);
          item.clouds.push({ x: r() * W, y: H * (near ? 0.04 + r() * 0.12 : 0.27 + r() * 0.2), w: wide, v: near ? 8 + r() * 3 : 3 + r() * 2, a: near ? 0.92 : 0.7, img: images[i % images.length] });
        }
        item.clouds.sort(function (a, b) { return a.w - b.w; });
        item.blades = [];
        for (var b = 0; b < 300; b++) item.blades.push({ x: r() * W, y: H * (0.8 + r() * 0.07), h: 16 + r() * 30, p: r() * 6.28, dark: b % 2 === 0 });
      },
      tick: function (g, now, dt) {
        item.clouds.forEach(function (o) {
          o.x += o.v * dt;
          if (o.x > W) o.x = -o.w;
          g.globalAlpha = o.a;
          g.drawImage(o.img, o.x, o.y, o.w, o.w * o.img.height / o.img.width);
        });
        g.globalAlpha = 1;
        g.lineWidth = 1.4;
        [true, false].forEach(function (dark) {
          g.strokeStyle = dark ? '#1c4230' : '#4c8560';
          g.beginPath();
          item.blades.forEach(function (b) {
            if (b.dark !== dark) return;
            var sway = Math.sin(now / 950 + b.p + b.x * 0.01) * b.h * 0.3;
            g.moveTo(b.x, b.y);
            g.quadraticCurveTo(b.x + sway * 0.3, b.y - b.h * 0.6, b.x + sway, b.y - b.h);
          });
          g.stroke();
        });
      }
    },
    suoi: {
      name: 'Suối', framed: true,
      paint: function (c, r) {
        fill(c, [[0, '#1c3f40'], [0.42, '#8fbba4']], 0, 0, 0, H, [0, 0, W, H]);
        glow(c, W * 0.5, H * 0.3, H * 0.5, '#e9f3cc', 0.45);
        treeLine(c, H * 0.4, H * 0.2, '#4a7f69', r);
        treeLine(c, H * 0.46, H * 0.16, '#2f6049', r);
        fill(c, [[0, '#2c5a42'], [1, '#14301f']], 0, H * 0.48, 0, H, [0, H * 0.5, W, H]);
        var i, y;
        c.fillStyle = '#3f7a50';
        for (i = 0; i < 520; i++) {
          y = H * (0.5 + r() * 0.42);
          c.globalAlpha = 0.16 + r() * 0.3;
          c.beginPath(); c.ellipse(r() * W, y, 4 + r() * 18 * (y / H), 2 + r() * 6 * (y / H), 0, 0, 6.29); c.fill();
        }
        c.globalAlpha = 1;
        var top = item.top, bot = item.bot;
        function edge(side) { for (y = top; y <= bot; y += 3) c.lineTo(item.cx(y) + side * item.hw(y), y); }
        var water = c.createLinearGradient(0, top, 0, bot);
        water.addColorStop(0, '#b4d8cf'); water.addColorStop(0.45, '#5a9ea5'); water.addColorStop(1, '#2c6b78');
        c.fillStyle = '#23402f';
        c.beginPath();
        for (y = top; y <= bot; y += 3) c.lineTo(item.cx(y) - item.hw(y) - 3 - H * 0.012 * (y - top) / (bot - top), y);
        for (y = bot; y >= top; y -= 3) c.lineTo(item.cx(y) + item.hw(y) + 3 + H * 0.012 * (y - top) / (bot - top), y);
        c.closePath();
        c.fill();
        c.fillStyle = water;
        c.beginPath();
        edge(-1);
        for (y = bot; y >= top; y -= 3) c.lineTo(item.cx(y) + item.hw(y), y);
        c.closePath();
        c.fill();
        var stones = [];
        for (i = 0; i < 66; i++) {
          var u = 0.04 + r() * 0.96, sy = item.y(u), inside = i % 4 === 0;
          var off = inside ? (r() - 0.5) * 1.3 : (i % 2 ? 1 : -1) * (1 + r() * 0.34);
          stones.push({ x: item.cx(sy) + off * item.hw(sy), y: sy, size: (5 + r() * 15) * (0.28 + u * 1.1), moss: r() < 0.65 });
        }
        item.ledges.forEach(function (ledge) {
          var ly = item.y(ledge), half = item.hw(ly);
          c.fillStyle = '#35484b';
          c.fillRect(item.cx(ly) - half, ly - 1, half * 2, H * 0.006 + 4 * ledge);
        });
        stones.sort(function (a, b) { return a.y - b.y; }).forEach(function (s) {
          c.fillStyle = '#46565a';
          c.beginPath(); c.ellipse(s.x, s.y, s.size * 1.4, s.size * 0.82, 0, 0, 6.29); c.fill();
          c.fillStyle = '#6f8286';
          c.beginPath(); c.ellipse(s.x - s.size * 0.25, s.y - s.size * 0.3, s.size * 0.78, s.size * 0.3, 0, 0, 6.29); c.fill();
          if (s.moss) { c.fillStyle = '#5b8f58'; c.beginPath(); c.ellipse(s.x + s.size * 0.25, s.y - s.size * 0.42, s.size * 0.62, s.size * 0.22, 0.2, 0, 6.29); c.fill(); }
        });
        [[0.05, 62], [0.14, 34], [0.92, 66], [0.84, 30], [0.25, 18], [0.76, 16]].forEach(function (t) {
          var tx = W * t[0], tw = t[1];
          c.fillStyle = t[1] > 40 ? '#14281f' : '#1f4133';
          c.beginPath();
          c.moveTo(tx - tw * 0.62, H * 0.86); c.lineTo(tx - tw * 0.36, 0); c.lineTo(tx + tw * 0.36, 0); c.lineTo(tx + tw * 0.62, H * 0.86);
          c.closePath();
          c.fill();
        });
        for (i = 0; i < 90; i++) {
          c.fillStyle = i % 2 ? '#14281f' : '#1f4133';
          c.beginPath(); c.ellipse(r() * W, r() * H * 0.16, 40 + r() * 80, 18 + r() * 34, 0, 0, 6.29); c.fill();
        }
        c.strokeStyle = '#356b48';
        c.lineWidth = 1.4;
        for (i = 0; i < 300; i++) {
          var fy = H * (0.72 + r() * 0.14), fx = r() * W;
          if (Math.abs(fx - item.cx(fy)) < item.hw(fy) * 1.25) continue;
          var bend = (r() - 0.5) * 30;
          c.beginPath(); c.moveTo(fx, fy); c.quadraticCurveTo(fx + bend * 0.3, fy - 18, fx + bend, fy - 22 - r() * 18); c.stroke();
        }
      },
      init: function (r) {
        var top = H * 0.5, bot = H * 0.92;
        item.top = top; item.bot = bot;
        item.y = function (u) { return top + (bot - top) * Math.pow(u, 1.5); };
        item.cx = function (y) { var t = (y - top) / (bot - top); return W * (0.5 + (0.05 + 0.17 * t) * Math.sin(t * 7.4 + 0.9)); };
        item.hw = function (y) { var t = (y - top) / (bot - top); return W * (0.005 + 0.082 * Math.pow(t, 1.25)); };
        item.ledges = [0.46, 0.68, 0.86];
        item.flow = [];
        for (var i = 0; i < 210; i++) item.flow.push({ u: r(), off: r() * 1.76 - 0.88, v: 0.16 + r() * 0.16, step: 0.012 + r() * 0.03 });
        item.foam = [];
        for (var f = 0; f < 72; f++) item.foam.push({ at: item.ledges[f % 3], off: r() * 1.9 - 0.95, p: r() * 6.28, l: 0.4 + r() });
      },
      tick: function (g, now, dt) {
        g.strokeStyle = '#f1fbf9';
        g.lineCap = 'round';
        item.flow.forEach(function (p) {
          p.u += p.v * dt;
          if (p.u > 0.985) p.u -= 0.985;
          var y0 = item.y(p.u), y1 = item.y(Math.min(1, p.u + p.step)), ym = (y0 + y1) / 2;
          g.globalAlpha = 0.12 + 0.34 * p.u;
          g.lineWidth = 0.6 + p.u * 1.5;
          g.beginPath();
          g.moveTo(item.cx(y0) + p.off * item.hw(y0), y0);
          g.quadraticCurveTo(item.cx(ym) + p.off * item.hw(ym), ym, item.cx(y1) + p.off * item.hw(y1), y1);
          g.stroke();
        });
        item.foam.forEach(function (m) {
          var y = item.y(m.at), half = item.hw(y), x = item.cx(y) + m.off * half;
          var size = (2 + m.at * 9) * m.l, drop = (now / 260 + m.p) % 1;
          g.globalAlpha = 0.5 + 0.4 * Math.abs(Math.sin(now / 170 + m.p));
          g.lineWidth = 1 + m.at * 2;
          g.beginPath(); g.moveTo(x - size, y + drop * 3); g.lineTo(x + size, y + drop * 3 + Math.sin(now / 200 + m.p)); g.stroke();
          g.globalAlpha = 0.28;
          g.beginPath(); g.moveTo(x, y + 3); g.lineTo(x + Math.sin(m.p) * 2, y + 3 + (4 + m.at * 16) * (0.5 + 0.5 * Math.sin(now / 140 + m.p))); g.stroke();
        });
        g.globalAlpha = 1;
        g.lineCap = 'butt';
      }
    },
    rung: {
      name: 'Rừng', framed: true,
      paint: function (c, r) {
        fill(c, [[0, '#183837'], [0.55, '#6aa58f'], [0.86, '#2c5a4b']], 0, 0, 0, H, [0, 0, W, H]);
        glow(c, W * 0.2, 0, H, '#eef5cf', 0.6);
        [[30, 5, 12, '#5a8f7e'], [18, 14, 26, '#35625a'], [7, 36, 70, '#13261f']].forEach(function (layer, depth) {
          for (var i = 0; i < layer[0]; i++) {
            var x = r() * W, w = layer[1] + r() * (layer[2] - layer[1]), base = H * (0.78 + depth * 0.05);
            c.fillStyle = layer[3];
            c.beginPath();
            c.moveTo(x - w * 0.5, base); c.lineTo(x - w * 0.32, 0); c.lineTo(x + w * 0.32, 0); c.lineTo(x + w * 0.5, base);
            c.closePath();
            c.fill();
          }
          for (var n = 0; n < 70; n++) {
            c.fillStyle = layer[3];
            c.beginPath(); c.ellipse(r() * W, r() * H * (0.12 + depth * 0.05), 30 + r() * 70, 18 + r() * 40, 0, 0, 6.29); c.fill();
          }
        });
        ridge(c, H * 0.8, H * 0.012, 2.4, 1, '#1d3d30');
        c.strokeStyle = '#2f6048';
        c.lineWidth = 1.3;
        for (var f = 0; f < 240; f++) {
          var fx = r() * W, fy = H * (0.82 + r() * 0.05), bend = (r() - 0.5) * 22;
          c.beginPath(); c.moveTo(fx, fy); c.quadraticCurveTo(fx + bend * 0.4, fy - 16, fx + bend, fy - 20 - r() * 12); c.stroke();
        }
      },
      init: function (r) {
        item.motes = [];
        for (var i = 0; i < 60; i++) item.motes.push({ x: r() * W, y: H * (0.2 + r() * 0.62), p: r() * 6.28, r: 1 + r() * 1.6 });
        item.animals = [];
        item.bag = [];
        item.rand = r;
        item.nextAnimal = 2.5;
      },
      tick: function (g, now, dt) {
        drawAnimals(g, now, dt);
        g.save();
        g.globalCompositeOperation = 'lighter';
        g.fillStyle = '#f4f5cf';
        [0.02, 0.17, 0.33, 0.5].forEach(function (x, i) {
          g.globalAlpha = 0.05 + 0.03 * Math.sin(now / 2400 + i * 1.6);
          g.beginPath();
          g.moveTo(W * x, 0); g.lineTo(W * (x + 0.07), 0);
          g.lineTo(W * (x + 0.34), H * 0.86); g.lineTo(W * (x + 0.16), H * 0.86);
          g.closePath();
          g.fill();
        });
        g.fillStyle = '#fbf3b6';
        item.motes.forEach(function (m) {
          g.globalAlpha = 0.3 + 0.5 * Math.abs(Math.sin(now / 1100 + m.p));
          g.beginPath(); g.arc(m.x + Math.sin(now / 1900 + m.p) * 16, m.y + Math.cos(now / 2300 + m.p) * 12, m.r, 0, 6.29); g.fill();
        });
        g.restore();
      }
    },
    thac: {
      name: 'Thác nước', framed: true,
      paint: function (c, r) {
        fill(c, [[0, '#17335a'], [0.32, '#5f9ab8'], [0.56, '#d8e4d0']], 0, 0, 0, H, [0, 0, W, H]);
        glow(c, W * 0.76, H * 0.1, H * 0.5, '#fff1cf', 0.7);
        ridge(c, H * 0.3, H * 0.06, 1.5, 1, '#6f98ab');
        ridge(c, H * 0.36, H * 0.05, 2.4, 3, '#4f7f8c');
        treeLine(c, H * 0.42, H * 0.13, '#35695a', r);
        var f = item.fall, i;
        c.fillStyle = '#39474b';
        c.beginPath();
        c.moveTo(W * 0.33, H * 0.76);
        c.lineTo(W * 0.39, H * 0.42); c.lineTo(W * 0.49, H * 0.34); c.lineTo(f.left, f.top); c.lineTo(f.right, f.top);
        c.lineTo(W * 0.86, H * 0.33); c.lineTo(W * 0.96, H * 0.43); c.lineTo(W * 1.04, H * 0.76);
        c.closePath();
        c.fill();
        c.strokeStyle = 'rgba(18,28,30,.42)';
        c.lineWidth = 2;
        for (i = 0; i < 90; i++) {
          var sx = W * (0.38 + r() * 0.6), sy = H * (0.38 + r() * 0.36), run = 20 + r() * 80;
          c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx + run, sy + (r() - 0.5) * 12); c.stroke();
        }
        c.fillStyle = '#4f8a58';
        for (i = 0; i < 260; i++) {
          c.globalAlpha = 0.5 + r() * 0.4;
          var mx = W * (0.38 + r() * 0.6);
          if (mx > f.left - 16 && mx < f.right + 16) continue;
          c.beginPath(); c.ellipse(mx, H * (0.34 + r() * 0.42), 4 + r() * 12, 2 + r() * 5, 0, 0, 6.29); c.fill();
        }
        c.globalAlpha = 1;
        var fall = c.createLinearGradient(f.left, 0, f.right, 0);
        fall.addColorStop(0, '#a9d3df'); fall.addColorStop(0.3, '#f4fbfd'); fall.addColorStop(0.7, '#e6f4f8'); fall.addColorStop(1, '#9fcbd8');
        c.fillStyle = fall;
        c.beginPath();
        c.moveTo(f.left, f.top); c.lineTo(f.right, f.top); c.lineTo(f.right + f.spread, f.bot); c.lineTo(f.left - f.spread, f.bot);
        c.closePath();
        c.fill();
        var pool = c.createLinearGradient(0, H * 0.72, 0, H * 0.9);
        pool.addColorStop(0, '#a5d6d8'); pool.addColorStop(0.5, '#4b98a6'); pool.addColorStop(1, '#2a6a79');
        c.fillStyle = pool;
        c.beginPath(); c.ellipse(W * 0.69, H * 0.92, W * 0.42, H * 0.2, 0, 0, 6.29); c.fill();
        var stones = [];
        for (i = 0; i < 34; i++) {
          var side = i % 2 ? 1 : -1, near = r();
          stones.push({ x: W * (0.69 + side * (0.12 + near * 0.26)), y: H * (0.74 + near * 0.13), size: 10 + near * 34 + r() * 10, moss: r() < 0.55 });
        }
        stones.sort(function (a, b) { return a.y - b.y; }).forEach(function (s) {
          c.fillStyle = '#46565a';
          c.beginPath(); c.ellipse(s.x, s.y, s.size * 1.4, s.size * 0.8, 0, 0, 6.29); c.fill();
          c.fillStyle = '#74878b';
          c.beginPath(); c.ellipse(s.x - s.size * 0.25, s.y - s.size * 0.3, s.size * 0.76, s.size * 0.28, 0, 0, 6.29); c.fill();
          if (s.moss) { c.fillStyle = '#5b8f58'; c.beginPath(); c.ellipse(s.x + s.size * 0.25, s.y - s.size * 0.42, s.size * 0.6, s.size * 0.2, 0.2, 0, 6.29); c.fill(); }
        });
        [[0.04, 70], [0.12, 34], [0.95, 74], [0.87, 32]].forEach(function (t) {
          c.fillStyle = t[1] > 40 ? '#14281f' : '#1f4133';
          c.beginPath();
          c.moveTo(W * t[0] - t[1] * 0.62, H * 0.86); c.lineTo(W * t[0] - t[1] * 0.36, 0); c.lineTo(W * t[0] + t[1] * 0.36, 0); c.lineTo(W * t[0] + t[1] * 0.62, H * 0.86);
          c.closePath();
          c.fill();
        });
        for (i = 0; i < 80; i++) {
          c.fillStyle = i % 2 ? '#14281f' : '#1f4133';
          var edge = i % 2 ? r() * W * 0.2 : W - r() * W * 0.2;
          c.beginPath(); c.ellipse(edge, r() * H * 0.2, 40 + r() * 70, 18 + r() * 34, 0, 0, 6.29); c.fill();
        }
      },
      init: function (r) {
        item.fall = { left: W * 0.62, right: W * 0.76, top: H * 0.33, bot: H * 0.76, spread: W * 0.022 };
        item.streaks = [];
        var i;
        for (i = 0; i < 190; i++) item.streaks.push({ off: r(), u: r(), v: 0.6 + r() * 0.5, len: 0.05 + r() * 0.1, shade: r() < 0.3 });
        item.foam = [];
        for (i = 0; i < 90; i++) item.foam.push({ x: r() * 1.3 - 0.15, p: r() * 6.28, s: 2 + r() * 7 });
        item.mist = [];
        for (i = 0; i < 22; i++) item.mist.push({ x: W * (0.54 + r() * 0.3), y: H * (0.68 + r() * 0.1), r: H * (0.06 + r() * 0.08), p: r() * 6.28, v: 0.3 + r() * 0.5 });
        item.rings = [];
        for (i = 0; i < 12; i++) item.rings.push({ x: W * (0.62 + r() * 0.14), p: r() });
      },
      tick: function (g, now) {
        var f = item.fall, t = now / 1000;
        g.lineCap = 'round';
        item.streaks.forEach(function (s) {
          var u = (s.u + t * s.v * 0.42) % 1, end = Math.min(1, u + s.len);
          var y0 = f.top + (f.bot - f.top) * u * u, y1 = f.top + (f.bot - f.top) * end * end;
          var at = function (k) { return f.left - f.spread * k + (f.right - f.left + f.spread * 2 * k) * s.off; };
          g.strokeStyle = s.shade ? '#8fc0cf' : '#ffffff';
          g.globalAlpha = s.shade ? 0.5 : 0.75;
          g.lineWidth = 1 + u * 2.4;
          g.beginPath(); g.moveTo(at(u), y0); g.lineTo(at(end), y1); g.stroke();
        });
        g.strokeStyle = '#ffffff';
        item.foam.forEach(function (o) {
          var x = f.left - f.spread + (f.right - f.left + f.spread * 2) * o.x, y = f.bot + Math.sin(t * 5 + o.p) * 5;
          g.globalAlpha = 0.45 + 0.45 * Math.abs(Math.sin(t * 4 + o.p));
          g.lineWidth = 2.4;
          g.beginPath(); g.moveTo(x - o.s, y); g.lineTo(x + o.s, y + Math.sin(t * 7 + o.p) * 2); g.stroke();
        });
        g.lineWidth = 1.4;
        item.rings.forEach(function (o) {
          var k = (o.p + t * 0.22) % 1;
          g.globalAlpha = 0.5 * (1 - k);
          g.beginPath(); g.ellipse(o.x, H * 0.79 + k * H * 0.05, 10 + k * W * 0.1, 3 + k * H * 0.018, 0, 0, 6.29); g.stroke();
        });
        g.globalAlpha = 1;
        g.lineCap = 'butt';
        item.mist.forEach(function (m) {
          var x = m.x + Math.sin(t * m.v + m.p) * 34, y = m.y - ((t * m.v * 9 + m.p * 12) % 42);
          glow(g, x, y, m.r, '#ffffff', 0.2 + 0.1 * Math.sin(t + m.p));
        });
      }
    },
    thuy: {
      name: 'Thủy cung', framed: false,
      paint: function (c, r) {
        fill(c, [[0, '#2fb2e2'], [0.3, '#0d7ec4'], [0.68, '#07599e'], [1, '#063f78']], 0, 0, 0, H, [0, 0, W, H]);
        glow(c, W * 0.5, 0, W * 0.5, '#a8ecff', 0.55);
        glow(c, W * 0.5, H, W * 0.55, '#c6f4f6', 0.7);
        reef(c, r, W * 0.14, W * 0.5, H * 0.62, '#0a63a2', 90);
        reef(c, r, W * 0.88, W * 0.5, H * 0.7, '#0a63a2', 90);
        reef(c, r, W * 0.5, W * 0.46, H * 0.34, '#0b6dab', 70);
        reef(c, r, W * 0.03, W * 0.36, H * 0.46, '#064a82', 80);
        reef(c, r, W * 0.97, W * 0.36, H * 0.52, '#064a82', 80);
        reef(c, r, W * 0.62, W * 0.26, H * 0.2, '#07558f', 40);
        fill(c, [[0, 'rgba(126,207,221,0)'], [1, 'rgba(173,232,232,.9)']], 0, H * 0.84, 0, H, [0, H * 0.84, W, H * 0.16]);
        reef(c, r, W * 0.05, W * 0.22, H * 0.3, '#042b52', 50);
        reef(c, r, W * 0.95, W * 0.24, H * 0.34, '#042b52', 50);
        c.strokeStyle = '#2a8cb0';
        c.lineCap = 'round';
        for (var i = 0; i < 110; i++) {
          var x = i % 2 ? r() * W * 0.28 : W - r() * W * 0.28, y = H * (0.72 + r() * 0.2), tall = 14 + r() * 40;
          c.lineWidth = 2 + r() * 3;
          c.globalAlpha = 0.55;
          c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + (r() - 0.5) * 26, y - tall * 0.6, x + (r() - 0.5) * 30, y - tall); c.stroke();
        }
        c.globalAlpha = 1;
        c.lineCap = 'butt';
      },
      init: function (r) {
        var i;
        item.schools = [
          { n: 60, color: '#efe07a', size: 13, cx: 0.34, cy: 0.6, ax: 0.2, ay: 0.08, wx: 0.11, wy: 0.23, spread: 0.1 },
          { n: 54, color: '#d6efe6', size: 12, cx: 0.7, cy: 0.42, ax: 0.2, ay: 0.12, wx: 0.09, wy: 0.17, spread: 0.11 },
          { n: 40, color: '#f6c95a', size: 10, cx: 0.55, cy: 0.74, ax: 0.26, ay: 0.05, wx: 0.13, wy: 0.31, spread: 0.08 }
        ];
        item.schools.forEach(function (s) {
          s.p = r() * 6.28; s.fish = [];
          for (var f = 0; f < s.n; f++) s.fish.push({ x: (r() + r() - 1) * s.spread, y: (r() + r() - 1) * s.spread * 0.55, p: r() * 6.28, k: 0.7 + r() * 0.6 });
        });
        item.swim = [];
        function add(kind, count, lenMin, lenMax, yMin, yMax, vMin, vMax, color) {
          for (var n = 0; n < count; n++) item.swim.push({ kind: kind, x: r() * W, y: H * (yMin + r() * (yMax - yMin)), len: lenMin + r() * (lenMax - lenMin), v: vMin + r() * (vMax - vMin), dir: n % 2 ? -1 : 1, p: r() * 6.28, color: color });
        }
        add('fish', 22, 26, 44, 0.08, 0.7, 14, 26, '#3f8fbf');
        add('fish', 12, 86, 130, 0.12, 0.66, 26, 42, '#a9c3ce');
        add('fish', 6, 150, 200, 0.2, 0.6, 20, 30, '#2f5f83');
        add('turtle', 2, 110, 130, 0.25, 0.55, 18, 24, '#3f6b58');
        add('shark', 2, 300, 380, 0.22, 0.62, 36, 48, '#40637f');
        add('manta', 2, 240, 320, 0.14, 0.4, 24, 32, '#0c3058');
        item.swim.sort(function (a, b) { return a.len - b.len; });
        item.bubbles = [];
        for (i = 0; i < 46; i++) item.bubbles.push({ x: [0.12, 0.47, 0.86][i % 3] * W + (r() - 0.5) * 50, y: r() * H, v: 30 + r() * 44, r: 1.5 + r() * 4, p: r() * 6.28 });
      },
      tick: function (g, now, dt) {
        var t = now / 1000;
        g.save();
        g.globalCompositeOperation = 'lighter';
        g.fillStyle = '#bff1ff';
        [0.08, 0.26, 0.44, 0.62, 0.8].forEach(function (x, i) {
          g.globalAlpha = 0.05 + 0.035 * Math.sin(t * 0.4 + i * 1.7);
          var sway = Math.sin(t * 0.17 + i) * W * 0.03;
          g.beginPath(); g.moveTo(W * x, 0); g.lineTo(W * (x + 0.09), 0); g.lineTo(W * (x + 0.16) + sway, H); g.lineTo(W * (x - 0.05) + sway, H); g.closePath(); g.fill();
        });
        g.strokeStyle = '#d8fbff';
        g.lineWidth = 2;
        for (var l = 0; l < 7; l++) {
          g.globalAlpha = 0.1;
          var base = H * (0.86 + l * 0.02);
          g.beginPath();
          for (var cx = 0; cx <= W + 24; cx += 24) g.lineTo(cx, base + Math.sin(cx * 0.018 + t * (0.8 + l * 0.15) + l) * (5 + l));
          g.stroke();
        }
        g.restore();
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
          if (s.dir > 0 && s.x > W + s.len) s.x = -s.len;
          if (s.dir < 0 && s.x < -s.len) s.x = W + s.len;
          var wag = Math.sin(t * (s.kind === 'shark' ? 3.2 : 6) + s.p);
          g.save();
          g.translate(s.x, s.y + Math.sin(t * 0.5 + s.p) * 14);
          g.scale(s.dir * s.len / 100, s.len / 100);
          if (s.kind === 'shark') shark(g, s, wag);
          else if (s.kind === 'manta') manta(g, s, now);
          else if (s.kind === 'turtle') turtle(g, s, now);
          else bigFish(g, s, wag);
          g.restore();
        });
        g.strokeStyle = 'rgba(225,250,255,.65)';
        g.lineWidth = 1;
        item.bubbles.forEach(function (b) {
          b.y -= b.v * dt;
          if (b.y < -10) b.y = H * 0.92;
          g.beginPath(); g.arc(b.x + Math.sin(t * 2 + b.p) * 5, b.y, b.r, 0, 6.29); g.stroke();
        });
      }
    },
    bien: {
      name: 'Bờ biển', framed: true,
      paint: function (c) {
        fill(c, [[0, '#17264d'], [0.3, '#57638f'], [0.48, '#e39a7c'], [0.56, '#f5c98e']], 0, 0, 0, H, [0, 0, W, H]);
        glow(c, W * 0.62, H * 0.53, H * 0.42, '#ffe0a3', 0.8);
        c.fillStyle = '#ffe9bd';
        c.beginPath(); c.arc(W * 0.62, H * 0.53, H * 0.045, 0, 6.29); c.fill();
        fill(c, [[0, '#3a6684'], [1, '#4f96a0']], 0, H * 0.56, 0, H * 0.72, [0, H * 0.56, W, H * 0.16]);
        fill(c, [[0, '#cdaa83'], [1, '#7f6652']], 0, H * 0.72, 0, H * 0.9, [0, H * 0.72, W, H * 0.28]);
      },
      init: function (r) {
        item.shine = [];
        for (var i = 0; i < 110; i++) {
          var near = i % 2 === 0;
          item.shine.push({ x: near ? W * (0.62 + (r() - 0.5) * 0.2) : r() * W, y: H * (0.565 + r() * 0.15), l: 8 + r() * 38, p: r() * 6.28, warm: near });
        }
      },
      tick: function (g, now) {
        g.lineWidth = 1.2;
        item.shine.forEach(function (s) {
          g.strokeStyle = s.warm ? '#ffe5b2' : '#cfeef0';
          g.globalAlpha = 0.12 + 0.55 * Math.abs(Math.sin(now / 800 + s.p));
          g.beginPath(); g.moveTo(s.x, s.y); g.lineTo(s.x + s.l, s.y); g.stroke();
        });
        g.globalAlpha = 1;
        var edge = H * (0.745 + 0.022 * Math.sin(now / 1900)), x;
        g.fillStyle = 'rgba(77,142,153,.55)';
        g.beginPath();
        g.moveTo(0, H * 0.71);
        for (x = 0; x <= W + 16; x += 16) g.lineTo(x, edge + Math.sin(x * 0.012 + now / 1500) * H * 0.012);
        g.lineTo(W, H * 0.71);
        g.closePath();
        g.fill();
        g.strokeStyle = 'rgba(245,250,250,.8)';
        g.lineWidth = 2.4;
        g.beginPath();
        for (x = 0; x <= W + 16; x += 16) g.lineTo(x, edge + Math.sin(x * 0.012 + now / 1500) * H * 0.012);
        g.stroke();
      }
    },
    lop: {
      name: 'Lớp học', framed: false,
      paint: function (c) {
        fill(c, [[0, '#3a5052'], [0.72, '#2c4042']], 0, 0, 0, H, [0, 0, W, H]);
        fill(c, [[0.72, '#4b4034'], [1, '#2f2820']], 0, 0, 0, H, [0, H * 0.72, W, H * 0.28]);
        c.strokeStyle = 'rgba(0,0,0,.2)';
        c.lineWidth = 1;
        c.beginPath();
        for (var t = -8; t <= 8; t++) { c.moveTo(W / 2 + t * W * 0.05, H * 0.72); c.lineTo(W / 2 + t * W * 0.14, H); }
        c.stroke();
        [0.03, 0.87].forEach(function (x) {
          var wx = W * x, ww = W * 0.1, wy = H * 0.14, wh = H * 0.42;
          fill(c, [[0, '#f4d9a0'], [1, '#d8a96a']], 0, wy, 0, wy + wh, [wx, wy, ww, wh]);
          c.strokeStyle = '#5d4a30';
          c.lineWidth = 5;
          c.strokeRect(wx, wy, ww, wh);
          c.beginPath(); c.moveTo(wx + ww / 2, wy); c.lineTo(wx + ww / 2, wy + wh); c.moveTo(wx, wy + wh * 0.45); c.lineTo(wx + ww, wy + wh * 0.45); c.stroke();
          glow(c, wx + ww / 2, H * 0.84, W * 0.2, '#f6d79c', 0.28);
        });
        var bx = W * 0.2, by = H * 0.12, bw = W * 0.6, bh = H * 0.36;
        c.fillStyle = '#6b4b2c';
        c.fillRect(bx - 10, by - 10, bw + 20, bh + 20);
        fill(c, [[0, '#24574a'], [1, '#1c4539']], 0, by, 0, by + bh, [bx, by, bw, bh]);
        c.fillStyle = '#8a6a44';
        c.fillRect(bx - 18, by + bh + 8, bw + 36, 7);
        c.fillStyle = 'rgba(238,242,232,.9)';
        var chalk = Math.round(Math.min(H * 0.034, W * 0.02));
        c.font = '600 ' + chalk + 'px "Chakra Petch", sans-serif';
        c.fillText('Có công mài sắt,', bx + bw * 0.03, by + bh * 0.3);
        c.fillText('có ngày nên kim', bx + bw * 0.03, by + bh * 0.3 + chalk * 1.4);
        c.fillStyle = '#6a4d2e';
        c.fillRect(W * 0.36, H * 0.56, W * 0.28, H * 0.13);
        c.fillStyle = '#86653f';
        c.fillRect(W * 0.345, H * 0.55, W * 0.31, H * 0.018);
        for (var row = 0; row < 3; row++) {
          var y = H * (0.73 + row * 0.085), s = 0.68 + row * 0.2, dw = W * 0.15 * s, dh = H * 0.03 * s;
          [-1.5, -0.5, 0.5, 1.5].forEach(function (col) {
            var dx = W / 2 + col * W * 0.235 * s;
            c.fillStyle = '#6d4f30';
            c.fillRect(dx - dw * 0.44, y + dh, dw * 0.05, H * 0.08 * s);
            c.fillRect(dx + dw * 0.39, y + dh, dw * 0.05, H * 0.08 * s);
            c.fillStyle = '#a07c50';
            c.beginPath();
            c.moveTo(dx - dw * 0.42, y); c.lineTo(dx + dw * 0.42, y); c.lineTo(dx + dw * 0.5, y + dh); c.lineTo(dx - dw * 0.5, y + dh);
            c.closePath();
            c.fill();
          });
        }
      },
      init: function (r) {
        item.dust = [];
        for (var i = 0; i < 44; i++) item.dust.push({ x: (i % 2 ? 0.03 : 0.8) * W + r() * W * 0.17, y: H * (0.16 + r() * 0.55), p: r() * 6.28 });
      },
      tick: function (g, now) {
        [0.3, 0.7].forEach(function (x, f) {
          var cx = W * x, cy = H * 0.075, R = W * 0.085, a = now / 170 + f;
          g.strokeStyle = '#1e2c2e';
          g.lineWidth = 3;
          g.beginPath(); g.moveTo(cx, 0); g.lineTo(cx, cy); g.stroke();
          g.fillStyle = 'rgba(32,46,48,.82)';
          for (var b = 0; b < 3; b++) {
            var angle = a + b * 2.094;
            g.beginPath(); g.ellipse(cx + Math.cos(angle) * R * 0.55, cy + Math.sin(angle) * R * 0.1, R * 0.5, R * 0.05 + Math.abs(Math.sin(angle)) * R * 0.05, Math.sin(angle) * 0.14, 0, 6.29); g.fill();
          }
          g.fillStyle = '#1e2c2e';
          g.beginPath(); g.ellipse(cx, cy, 11, 6, 0, 0, 6.29); g.fill();
        });
        g.fillStyle = '#fff0cf';
        item.dust.forEach(function (d) {
          g.globalAlpha = 0.15 + 0.4 * Math.abs(Math.sin(now / 1300 + d.p));
          g.beginPath(); g.arc(d.x + Math.sin(now / 2600 + d.p) * 12, d.y + Math.sin(now / 3100 + d.p) * 18, 1.3, 0, 6.29); g.fill();
        });
        g.globalAlpha = 1;
      }
    }
  };

  function repaint() {
    var scene = SCENES[current];
    if (!scene) return;
    back = back || document.createElement('canvas');
    back.width = W * dpr; back.height = H * dpr;
    var c = back.getContext('2d');
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    item = {};
    scene.init(seeded(41));
    scene.paint(c, seeded(7));
  }
  function prepare(id, width, height, ratio) {
    W = width; H = height; dpr = ratio; current = id;
    repaint();
    /* Bảng lớp có chữ: font có thể tải xong sau lần vẽ đầu */
    if (id === 'lop' && document.fonts) document.fonts.load('600 40px "Chakra Petch"', 'Có công').then(function () { if (current === 'lop') repaint(); });
  }
  function draw(g, id, now, dt) {
    g.drawImage(back, 0, 0, W, H);
    SCENES[id].tick(g, now, dt);
  }
  return {
    list: Object.keys(SCENES).map(function (id) { return { id: id, name: SCENES[id].name }; }),
    has: function (id) { return !!SCENES[id]; },
    framed: function (id) { return SCENES[id].framed; },
    prepare: prepare,
    draw: draw
  };
})();
