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
        item.clouds = [];
        for (var i = 0; i < 6; i++) item.clouds.push({ x: r() * W, y: H * (0.08 + r() * 0.26), s: 50 + r() * 70, v: 5 + r() * 8 });
        item.blades = [];
        for (var b = 0; b < 300; b++) item.blades.push({ x: r() * W, y: H * (0.8 + r() * 0.07), h: 16 + r() * 30, p: r() * 6.28, dark: b % 2 === 0 });
      },
      tick: function (g, now, dt) {
        g.fillStyle = '#f0e0d0';
        g.globalAlpha = 0.34;
        item.clouds.forEach(function (o) {
          o.x += o.v * dt;
          if (o.x > W + o.s * 2) o.x = -o.s * 2;
          [[-0.7, 0.1, 0.6], [0, 0, 0.8], [0.7, 0.12, 0.55]].forEach(function (p) {
            g.beginPath(); g.ellipse(o.x + p[0] * o.s, o.y + p[1] * o.s, o.s * p[2], o.s * p[2] * 0.42, 0, 0, 6.29); g.fill();
          });
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
        fill(c, [[0, '#17343f'], [0.45, '#86b3a2']], 0, 0, 0, H, [0, 0, W, H]);
        treeLine(c, H * 0.42, H * 0.2, '#3f7361', r);
        treeLine(c, H * 0.47, H * 0.14, '#2c5a49', r);
        fill(c, [[0, '#2f6049'], [1, '#183a2b']], 0, H * 0.46, 0, H, [0, H * 0.47, W, H]);
        var top = item.top, bot = item.bot, y;
        var water = c.createLinearGradient(0, top, 0, bot);
        water.addColorStop(0, '#9fcbc4'); water.addColorStop(0.5, '#3f8291'); water.addColorStop(1, '#1f5264');
        c.fillStyle = water;
        c.beginPath();
        for (y = top; y <= bot; y += 6) c.lineTo(item.cx(y) - item.hw(y), y);
        for (y = bot; y >= top; y -= 6) c.lineTo(item.cx(y) + item.hw(y), y);
        c.closePath();
        c.fill();
        for (var i = 0; i < 26; i++) {
          var u = 0.2 + r() * 0.8, py = top + (bot - top) * u, side = i % 2 ? 1 : -1, size = (6 + r() * 16) * (0.4 + u);
          var px = item.cx(py) + side * item.hw(py) * (0.82 + r() * 0.3);
          c.fillStyle = '#4c5c5e';
          c.beginPath(); c.ellipse(px, py, size * 1.5, size * 0.8, 0, 0, 6.29); c.fill();
          c.fillStyle = '#74868a';
          c.beginPath(); c.ellipse(px - size * 0.2, py - size * 0.25, size * 0.8, size * 0.32, 0, 0, 6.29); c.fill();
        }
      },
      init: function (r) {
        item.top = H * 0.47; item.bot = H * 0.9;
        item.cx = function (y) { return W * (0.5 + 0.16 * Math.sin((y - item.top) / (item.bot - item.top) * 3.2 + 0.6)); };
        item.hw = function (y) { return W * (0.012 + 0.29 * Math.pow((y - item.top) / (item.bot - item.top), 1.4)); };
        item.flow = [];
        for (var i = 0; i < 170; i++) item.flow.push({ u: r(), off: r() * 1.7 - 0.85, v: 0.1 + r() * 0.12 });
      },
      tick: function (g, now, dt) {
        g.strokeStyle = '#e6f6f4';
        item.flow.forEach(function (p) {
          p.u += p.v * dt;
          if (p.u > 1) p.u -= 1;
          var y = item.top + (item.bot - item.top) * Math.pow(p.u, 1.5), wide = item.hw(y);
          var x = item.cx(y) + p.off * wide, len = 3 + p.u * 26;
          g.globalAlpha = 0.14 + 0.34 * p.u;
          g.lineWidth = 0.6 + p.u * 1.5;
          g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.sin(now / 500 + y * 0.05) * 2, y + len); g.stroke();
        });
        g.globalAlpha = 1;
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
      },
      tick: function (g, now) {
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
