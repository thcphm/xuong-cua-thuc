/* Robot nhỏ tự đi tới phòng được bấm, theo đường qua các cửa. */
window.Walk = (function () {
  var START = { x: 430, y: 476 };
  var pos = { x: START.x, y: START.y, h: 0 };

  /* Các đoạn tường [x1, y1, x2, y2], cửa là khoảng trống giữa các đoạn. */
  var WALLS = [
    [40, 30, 960, 30], [960, 30, 960, 470], [960, 530, 960, 590], [40, 30, 40, 340], [40, 340, 40, 500], [40, 560, 40, 590], [40, 590, 960, 590],
    [40, 340, 490, 340], [490, 260, 490, 340], [490, 30, 490, 200],
    [570, 30, 570, 90], [570, 150, 570, 280], [570, 340, 570, 465], [570, 525, 570, 590],
    [570, 210, 960, 210], [570, 400, 960, 400], [290, 340, 290, 430], [290, 490, 290, 590]
  ];
  var REGIONS = {
    nhac: [40, 30, 490, 340], sach: [570, 30, 960, 210], cong: [570, 210, 960, 400],
    game: [570, 400, 960, 590], hoc: [40, 340, 290, 590], garage: [965, 150, 1190, 590],
    bep: [470, 590, 830, 780],
    nghi: [-240, 340, 40, 590]
  };
  /* Trên mái: cùng mặt bằng với garage nhưng cao 2,7 mét */
  var ROOF = { san: [965, 150, 1190, 370], vuon: [965, 370, 1140, 590] };
  var TO_ANNEX = [[530, 495], [640, 495], [900, 500]];
  var TO_ROOF = TO_ANNEX.concat([[1120, 565], [1165, 596], [1165, 425, 2.7], [1165, 392, 2.7]]);
  /* Đường từ sảnh tới giữa từng phòng, đi qua cửa. */
  var PATHS = {
    nhac: [[530, 400], [530, 230], [440, 230], [345, 190]],
    sach: [[530, 400], [530, 120], [640, 120], [770, 150]],
    cong: [[530, 400], [530, 310], [640, 310], [770, 320]],
    game: [[530, 495], [640, 495], [765, 505]],
    hoc: [[340, 460], [230, 460], [165, 465]],
    /* Qua lối mở ở tường trước của sảnh */
    bep: [[520, 530], [520, 640], [600, 668]],
    /* Qua Phòng Học, rồi qua lối mở ở tường trái */
    nghi: [[340, 460], [230, 460], [120, 530], [-30, 530], [-110, 480]],
    garage: TO_ANNEX.concat([[1075, 440]]),
    san: TO_ROOF.concat([[1075, 262, 2.7]]),
    vuon: TO_ROOF.concat([[1060, 400, 2.7], [1050, 480, 2.7]]),
    /* Ra cửa chính, vòng ra miệng dốc, đi xuống tầng hầm sâu 3,6 mét */
    ham: [[430, 560], [430, 880], [140, 880], [140, 840], [140, 612, -3.58], [140, 500, -3.58]]
  };

  var walker, label, region = '';
  var moveListeners = [];

  function regionAt(x, y, h) {
    if (h < -1) return 'ham';
    var map = h >= 1 ? ROOF : REGIONS;
    for (var id in map) {
      var r = map[id];
      if (x > r[0] && x < r[2] && y > r[1] && y < r[3]) return id;
    }
    return '';
  }
  function render() {
    walker.setAttribute('transform', 'translate(' + pos.x + ' ' + pos.y + ')');
    var next = regionAt(pos.x, pos.y, pos.h);
    if (next !== region) {
      region = next;
      document.querySelectorAll('.plan .room').forEach(function (r) {
        r.classList.toggle('occupied', r.dataset.room === region);
      });
    }
    label.textContent = region ? '' : 'Bạn đang ở đây';
    var flip = pos.x > 800;
    label.setAttribute('x', flip ? -16 : 16);
    label.setAttribute('text-anchor', flip ? 'end' : 'start');
    moveListeners.forEach(function (fn) { fn(pos); });
  }
  function to(id, done) {
    var inside = regionAt(pos.x, pos.y, pos.h);
    if (inside === id || document.hidden || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      if (inside !== id) {
        var end = PATHS[id][PATHS[id].length - 1];
        pos = { x: end[0], y: end[1], h: end[2] || 0 };
        render();
      }
      return done();
    }
    var points = inside ? PATHS[inside].slice(0, -1).reverse().concat(PATHS[id]) : PATHS[id].slice();
    var total = 0, from = { x: pos.x, y: pos.y, h: pos.h };
    var legs = points.map(function (p) {
      var leg = { x0: from.x, y0: from.y, h0: from.h, x1: p[0], y1: p[1], h1: p[2] || 0, len: Math.hypot(p[0] - from.x, p[1] - from.y) };
      total += leg.len;
      from = { x: p[0], y: p[1], h: p[2] || 0 };
      return leg;
    });
    var duration = Math.min(total > 820 ? 950 : 620, total * 1.1), start = performance.now();
    requestAnimationFrame(function tick(now) {
      var t = Math.min(1, (now - start) / duration);
      var travelled = total * t, i = 0;
      while (i < legs.length - 1 && travelled > legs[i].len) { travelled -= legs[i].len; i++; }
      var leg = legs[i], f = leg.len ? Math.min(1, travelled / leg.len) : 1;
      pos.x = leg.x0 + (leg.x1 - leg.x0) * f;
      pos.y = leg.y0 + (leg.y1 - leg.y0) * f;
      pos.h = leg.h0 + (leg.h1 - leg.h0) * f;
      render();
      if (t < 1) return requestAnimationFrame(tick);
      done();
    });
  }

  return {
    init: function () {
      walker = document.getElementById('walker');
      label = document.getElementById('walkerText');
      render();
    },
    to: to,
    WALLS: WALLS,
    onMove: function (fn) { moveListeners.push(fn); },
    emit: function () { moveListeners.forEach(function (fn) { fn(pos); }); },
    region: function () { return region; }
  };
})();
