/* Phòng học: cảnh nền, bảng công cụ kéo thả, hẹn giờ, âm nền, ghi chú, lịch, flashcard.
   Dữ liệu học lưu trong trình duyệt của từng người, không gửi đi đâu. */
window.Study = (function () {
  var KEY = 'nha-cua-tp.phong-hoc.v1';
  var MESSAGES = [
    'Có công mài sắt, có ngày nên kim.',
    'Đi một ngày đàng, học một sàng khôn.',
    'Học thầy không tày học bạn.',
    'Nước chảy đá mòn.',
    'Kiến tha lâu cũng đầy tổ.',
    'Muốn biết phải hỏi, muốn giỏi phải học.',
    'Thất bại là mẹ thành công.',
    'Học ăn, học nói, học gói, học mở.'
  ];
  var DEFAULTS = {
    stars: 0, days: {}, notes: '', tasks: [], scene: 'mua', pos: {}, open: ['clock'], messageDate: '', focus: 25, rest: 5,
    cards: [
      { front: 'Flashcard là gì?', back: 'Thẻ hai mặt: một mặt câu hỏi, một mặt đáp án.' },
      { front: 'Pomodoro', back: '25 phút tập trung, 5 phút nghỉ.' },
      { front: 'Thêm thẻ của bạn', back: 'Điền hai ô bên dưới rồi bấm Thêm thẻ.' }
    ]
  };

  var data = load();
  function load() {
    var saved = {};
    try { saved = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) {}
    return Object.assign({}, DEFAULTS, saved);
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {}
  }

  var $ = function (id) { return document.getElementById(id); };
  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }
  function button(text, className, onClick) {
    var b = el('button', className, text);
    b.type = 'button';
    b.addEventListener('click', onClick);
    return b;
  }
  function dateKey(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  var reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Âm thanh: bối cảnh riêng để nhạc tạm dừng không làm tắt âm nền */
  var audio, noiseBuffer, ambient = {};
  function getAudio() {
    if (!audio) {
      audio = new (window.AudioContext || window.webkitAudioContext)();
      var size = audio.sampleRate * 3;
      noiseBuffer = audio.createBuffer(1, size, audio.sampleRate);
      var d = noiseBuffer.getChannelData(0);
      for (var i = 0; i < size; i++) d[i] = Math.random() * 2 - 1;
    }
    audio.resume();
    return audio;
  }
  function tone(freq, at, length, level) {
    var ctx = getAudio();
    var osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(level, at + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, at + length);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(at);
    osc.stop(at + length + 0.05);
  }
  function chime() {
    var t = getAudio().currentTime;
    [659, 784, 1047].forEach(function (f, i) { tone(f, t + i * 0.18, 1.3, 0.16); });
  }
  function click() { var c = getAudio(); tone(1900, c.currentTime, 0.04, 0.09); }

  var SOUNDS = [
    { id: 'mua', name: 'Mưa', type: 'lowpass', freq: 7500, max: 1.4, file: 'assets/sounds/rain.mp3' },
    { id: 'lofi', name: 'Lofi', type: 'lowpass', freq: 12000, max: 0.4, file: 'assets/sounds/lofi.mp3', length: 40.42 },
    { id: 'quat', name: 'Quạt trần', type: 'lowpass', freq: 320, max: 0.8 },
    { id: 'song', name: 'Sóng biển', type: 'bandpass', freq: 520, max: 0.6, wave: true }
  ];
  /* Âm thu sẵn chỉ tải khi người dùng kéo thanh lần đầu. Bỏ một đoạn rất ngắn ở hai đầu file MP3 để vòng lặp liền. */
  var fileBuffers = {};
  function loadSound(sound) {
    if (!fileBuffers[sound.id]) {
      fileBuffers[sound.id] = fetch(sound.file)
        .then(function (res) { if (!res.ok) throw new Error('sound ' + res.status); return res.arrayBuffer(); })
        .then(function (bytes) { return getAudio().decodeAudioData(bytes); });
    }
    return fileBuffers[sound.id];
  }
  function playFile(sound, src) {
    var edge = 0.03;
    loadSound(sound).then(function (buffer) {
      src.buffer = buffer;
      src.loopStart = edge;
      src.loopEnd = sound.length ? Math.min(buffer.duration, edge + sound.length) : buffer.duration - edge;
      src.start(0, edge);
    }).catch(function () { delete fileBuffers[sound.id]; delete ambient[sound.id]; });
  }
  function setAmbient(sound, value) {
    if (!ambient[sound.id] && value > 0) {
      var ctx = getAudio();
      var src = ctx.createBufferSource();
      src.loop = true;
      if (!sound.file) src.buffer = noiseBuffer;
      var filter = ctx.createBiquadFilter();
      filter.type = sound.type;
      filter.frequency.value = sound.freq;
      var gain = ctx.createGain();
      gain.gain.value = 0;
      src.connect(filter);
      filter.connect(gain);
      if (sound.wave) {
        var swell = ctx.createGain();
        swell.gain.value = 0.6;
        var lfo = ctx.createOscillator(), depth = ctx.createGain();
        lfo.frequency.value = 0.13;
        depth.gain.value = 0.4;
        lfo.connect(depth);
        depth.connect(swell.gain);
        lfo.start();
        gain.connect(swell);
        swell.connect(ctx.destination);
      } else {
        gain.connect(ctx.destination);
      }
      if (sound.file) playFile(sound, src); else src.start();
      ambient[sound.id] = gain;
    }
    if (ambient[sound.id]) ambient[sound.id].gain.setTargetAtTime(value * sound.max, audio.currentTime, 0.15);
  }

  /* Bảng công cụ */
  var TOOLS = [
    { id: 'clock', name: 'Hẹn giờ', w: 330, fx: 0.5, fy: 0.42, build: buildClock },
    { id: 'sound', name: 'Âm nền', w: 270, fx: 0.15, fy: 0.3, build: buildSound },
    { id: 'scene', name: 'Cảnh', w: 270, fx: 0.15, fy: 0.72, build: buildScene },
    { id: 'notes', name: 'Ghi chú', w: 300, fx: 0.85, fy: 0.28, build: buildNotes },
    { id: 'tasks', name: 'Việc cần làm', w: 300, fx: 0.85, fy: 0.68, build: buildTasks },
    { id: 'calendar', name: 'Lịch', w: 300, fx: 0.3, fy: 0.5, build: buildCalendar }
  ];
  var widgets = {}, topZ = 5, stage, toolButtons = {};

  function narrow() { return matchMedia('(max-width: 900px)').matches; }
  function clamp(node, left, top) {
    var maxX = Math.max(0, stage.clientWidth - node.offsetWidth);
    var maxY = Math.max(0, stage.clientHeight - node.offsetHeight);
    node.style.left = Math.round(Math.min(maxX, Math.max(0, left))) + 'px';
    node.style.top = Math.round(Math.min(maxY, Math.max(0, top))) + 'px';
  }
  function place(tool, node) {
    if (narrow()) { node.style.left = node.style.top = ''; return; }
    var saved = data.pos[tool.id];
    if (saved) return clamp(node, saved[0], saved[1]);
    clamp(node, stage.clientWidth * tool.fx - node.offsetWidth / 2, stage.clientHeight * tool.fy - node.offsetHeight / 2);
  }
  function raise(node) { node.style.zIndex = ++topZ; }

  function openTool(tool, focus) {
    if (widgets[tool.id]) { raise(widgets[tool.id]); return; }
    var node = el('section', 'widget');
    node.style.setProperty('--w', tool.w + 'px');
    node.setAttribute('aria-label', tool.name);
    var head = el('header', 'w-head');
    head.append(el('h2', '', tool.name), button('Đóng', 'w-close', function () { closeTool(tool); }));
    var body = el('div', 'w-body');
    tool.build(body);
    node.append(head, body);
    stage.append(node);
    widgets[tool.id] = node;
    place(tool, node);
    raise(node);
    node.addEventListener('pointerdown', function () { raise(node); });
    makeDraggable(tool, node, head);
    toolButtons[tool.id].setAttribute('aria-pressed', 'true');
    if (data.open.indexOf(tool.id) < 0) { data.open.push(tool.id); save(); }
    if (!reduceMotion && node.animate) node.animate([{ opacity: 0, transform: 'scale(.96)' }, { opacity: 1, transform: 'none' }], { duration: 160, easing: 'ease-out' });
    if (focus) node.querySelector('.w-close').focus();
  }
  function closeTool(tool) {
    if (tool.id === 'calendar') calendarRefresh = null;
    if (tool.id === 'clock') clockRefresh = null;
    widgets[tool.id].remove();
    delete widgets[tool.id];
    toolButtons[tool.id].setAttribute('aria-pressed', 'false');
    toolButtons[tool.id].focus();
    data.open = data.open.filter(function (id) { return id !== tool.id; });
    save();
  }
  function makeDraggable(tool, node, handle) {
    var grab = null;
    handle.addEventListener('pointerdown', function (e) {
      if (e.target.closest('button') || narrow()) return;
      grab = { x: e.clientX - node.offsetLeft, y: e.clientY - node.offsetTop };
      handle.setPointerCapture(e.pointerId);
      node.classList.add('dragging');
    });
    handle.addEventListener('pointermove', function (e) {
      if (grab) clamp(node, e.clientX - grab.x, e.clientY - grab.y);
    });
    function drop() {
      if (!grab) return;
      grab = null;
      node.classList.remove('dragging');
      data.pos[tool.id] = [node.offsetLeft, node.offsetTop];
      save();
    }
    handle.addEventListener('pointerup', drop);
    handle.addEventListener('pointercancel', drop);
  }

  /* Hẹn giờ */
  var clock = { phase: 'focus', running: false, remaining: data.focus * 60, endAt: 0 };
  var clockRefresh = null, calendarRefresh = null;
  var phaseMinutes = function () { return clock.phase === 'focus' ? data.focus : data.rest; };
  function fmt(s) {
    s = Math.max(0, Math.ceil(s));
    return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
  }
  function paintTimer() {
    var mini = $('miniTimer');
    mini.hidden = !clock.running;
    mini.textContent = fmt(clock.remaining);
    document.title = clock.running ? fmt(clock.remaining) + ' ' + (window.pageTitle || '') : (window.pageTitle || '');
    if (clockRefresh) clockRefresh();
  }
  function setRunning(run) {
    clock.running = run;
    if (run) clock.endAt = Date.now() + clock.remaining * 1000;
    paintTimer();
  }
  function switchPhase(phase, run) {
    clock.phase = phase;
    clock.remaining = phaseMinutes() * 60;
    setRunning(run);
  }
  function finishPhase() {
    chime();
    if (clock.phase === 'focus') {
      data.stars++;
      var today = dateKey(new Date());
      data.days[today] = (data.days[today] || 0) + 1;
      save();
      paintStars();
      if (calendarRefresh) calendarRefresh();
      document.dispatchEvent(new Event('tp:focus-done'));
      switchPhase('rest', true);
    } else {
      switchPhase('focus', false);
    }
  }
  setInterval(function () {
    if (!clock.running) return;
    clock.remaining = (clock.endAt - Date.now()) / 1000;
    if (clock.remaining <= 0) finishPhase(); else paintTimer();
  }, 250);

  function buildClock(body) {
    var R = 104, C = 2 * Math.PI * R, NS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 260 260');
    svg.setAttribute('class', 'dial');
    var track = document.createElementNS(NS, 'circle');
    var arc = document.createElementNS(NS, 'circle');
    var knob = document.createElementNS(NS, 'circle');
    [[track, 'd-track'], [arc, 'd-arc']].forEach(function (c) {
      c[0].setAttribute('cx', 130); c[0].setAttribute('cy', 130); c[0].setAttribute('r', R);
      c[0].setAttribute('class', c[1]);
    });
    arc.setAttribute('transform', 'rotate(-90 130 130)');
    arc.setAttribute('stroke-dasharray', C);
    knob.setAttribute('r', 11);
    knob.setAttribute('class', 'd-knob');
    knob.setAttribute('tabindex', '0');
    knob.setAttribute('role', 'slider');
    knob.setAttribute('aria-label', 'Số phút');
    knob.setAttribute('aria-valuemin', '1');
    knob.setAttribute('aria-valuemax', '60');
    for (var m = 0; m < 12; m++) {
      var tick = document.createElementNS(NS, 'line');
      tick.setAttribute('x1', 130); tick.setAttribute('x2', 130);
      tick.setAttribute('y1', 12); tick.setAttribute('y2', 19);
      tick.setAttribute('transform', 'rotate(' + m * 30 + ' 130 130)');
      tick.setAttribute('class', 'd-tick');
      svg.append(tick);
    }
    svg.append(track, arc, knob);

    var wrap = el('div', 'dial-wrap');
    var center = el('div', 'dial-center');
    var phase = el('p', 'dial-phase');
    var time = el('p', 'dial-time');
    center.append(phase, time);
    wrap.append(svg, center);

    var start = button('Bắt đầu', 'play-btn', function () {
      getAudio();
      setRunning(!clock.running);
    });
    var reset = button('Đặt lại', 'ghost-btn', function () { switchPhase(clock.phase, false); });
    var skip = button('Bỏ qua', 'ghost-btn', function () { switchPhase(clock.phase === 'focus' ? 'rest' : 'focus', false); });
    var actions = el('div', 'w-row');
    actions.append(start, reset, skip);

    var presets = el('div', 'w-row');
    [[25, 5], [50, 10], [15, 3]].forEach(function (p) {
      presets.append(button(p[0] + ' / ' + p[1] + ' phút', 'chip', function () {
        data.focus = p[0]; data.rest = p[1]; save();
        switchPhase('focus', false);
      }));
    });
    body.append(wrap, actions, presets);

    function setMinutes(min) {
      if (clock.running) return;
      min = Math.max(1, Math.min(60, min));
      if (clock.phase === 'focus') data.focus = min; else data.rest = min;
      save();
      clock.remaining = min * 60;
      paintTimer();
    }
    clockRefresh = function () {
      var fraction = Math.min(1, clock.remaining / 3600);
      arc.setAttribute('stroke-dashoffset', C * (1 - fraction));
      var a = fraction * 2 * Math.PI - Math.PI / 2;
      knob.setAttribute('cx', 130 + R * Math.cos(a));
      knob.setAttribute('cy', 130 + R * Math.sin(a));
      knob.setAttribute('aria-valuenow', Math.ceil(clock.remaining / 60));
      knob.classList.toggle('locked', clock.running);
      phase.textContent = clock.phase === 'focus' ? 'Tập trung' : 'Nghỉ';
      time.textContent = fmt(clock.remaining);
      start.textContent = clock.running ? 'Tạm dừng' : 'Bắt đầu';
    };
    clockRefresh();

    var dragging = false;
    function fromPointer(e) {
      var box = svg.getBoundingClientRect();
      var a = Math.atan2(e.clientY - (box.top + box.height / 2), e.clientX - (box.left + box.width / 2)) + Math.PI / 2;
      if (a < 0) a += 2 * Math.PI;
      setMinutes(Math.round(a / (2 * Math.PI) * 60) || 60);
    }
    knob.addEventListener('pointerdown', function (e) {
      if (clock.running) return;
      dragging = true;
      knob.setPointerCapture(e.pointerId);
      e.stopPropagation();
    });
    knob.addEventListener('pointermove', function (e) { if (dragging) fromPointer(e); });
    knob.addEventListener('pointerup', function () { dragging = false; });
    knob.addEventListener('pointercancel', function () { dragging = false; });
    knob.addEventListener('keydown', function (e) {
      var delta = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1 }[e.key];
      if (delta) { e.preventDefault(); setMinutes(Math.ceil(clock.remaining / 60) + delta); }
    });
  }

  function buildSound(body) {
    SOUNDS.forEach(function (sound) {
      var label = el('label', 'mixer');
      label.append(el('span', '', sound.name));
      var input = el('input');
      input.type = 'range'; input.min = 0; input.max = 100;
      input.value = ambient[sound.id] ? Math.round(ambient[sound.id].gain.value / sound.max * 100) : 0;
      input.addEventListener('input', function () { setAmbient(sound, input.value / 100); });
      label.append(input);
      body.append(label);
    });
    var music = button('Phát hoặc dừng nhạc', 'ghost-btn wide', function () { window.Music.toggle(); });
    body.append(music);
  }

  var SCENES = [{ id: 'mua', name: 'Đêm mưa' }, { id: 'sao', name: 'Trời sao' }, { id: 'bim', name: 'Sắp sáng' }].concat(window.StudyScenes.list);
  function buildScene(body) {
    var row = el('div', 'w-row');
    SCENES.forEach(function (scene) {
      var b = button(scene.name, 'chip', function () {
        data.scene = scene.id; save();
        row.querySelectorAll('.chip').forEach(function (c) { c.removeAttribute('aria-pressed'); });
        b.setAttribute('aria-pressed', 'true');
        startScene();
      });
      if (data.scene === scene.id) b.setAttribute('aria-pressed', 'true');
      row.append(b);
    });
    body.append(row);
  }

  function buildNotes(body) {
    var area = el('textarea', 'notes');
    area.value = data.notes;
    area.placeholder = 'Viết gì đó. Ghi chú được lưu tự động trên máy này.';
    area.setAttribute('aria-label', 'Ghi chú');
    area.addEventListener('input', function () { data.notes = area.value; save(); });
    body.append(area);
  }

  function buildTasks(body) {
    var list = el('ul', 'tasks');
    var form = el('form', 'w-row');
    var input = el('input', 'field');
    input.placeholder = 'Thêm việc mới';
    input.setAttribute('aria-label', 'Việc mới');
    form.append(input, button('Thêm', 'ghost-btn', function () {}));
    form.lastChild.type = 'submit';
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!input.value.trim()) return;
      data.tasks.push({ text: input.value.trim(), done: false });
      input.value = '';
      save();
      draw();
    });
    function draw() {
      list.replaceChildren();
      if (!data.tasks.length) list.append(el('li', 'empty', 'Chưa có việc nào. Thêm việc đầu tiên ở ô bên dưới.'));
      data.tasks.forEach(function (task, i) {
        var li = el('li', task.done ? 'done' : '');
        var label = el('label');
        var check = el('input');
        check.type = 'checkbox';
        check.checked = task.done;
        check.addEventListener('change', function () { task.done = check.checked; save(); draw(); });
        label.append(check, el('span', '', task.text));
        li.append(label, button('Xoá', 'w-close', function () { data.tasks.splice(i, 1); save(); draw(); }));
        list.append(li);
      });
    }
    draw();
    body.append(list, form);
  }

  function buildCalendar(body) {
    var view = new Date();
    view.setDate(1);
    var title = el('p', 'cal-title');
    var grid = el('div', 'cal-grid');
    var info = el('p', 'cal-info', 'Ngày nào có phiên tập trung sẽ sáng lên.');
    var nav = el('div', 'cal-nav');
    function shift(by) { view.setMonth(view.getMonth() + by); draw(); }
    nav.append(button('Tháng trước', 'w-close', function () { shift(-1); }), title, button('Tháng sau', 'w-close', function () { shift(1); }));
    function draw() {
      title.textContent = 'Tháng ' + (view.getMonth() + 1) + ', ' + view.getFullYear();
      grid.replaceChildren();
      ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].forEach(function (d) { grid.append(el('span', 'cal-dow', d)); });
      var offset = (view.getDay() + 6) % 7;
      for (var b = 0; b < offset; b++) grid.append(el('span'));
      var days = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
      var todayKey = dateKey(new Date());
      for (var n = 1; n <= days; n++) (function (n) {
        var key = dateKey(new Date(view.getFullYear(), view.getMonth(), n));
        var count = data.days[key] || 0;
        var cell = button(String(n), 'cal-day' + (count ? ' has' : '') + (key === todayKey ? ' today' : ''), function () {
          info.textContent = n + '/' + (view.getMonth() + 1) + ': ' + (count ? count + ' phiên tập trung' : 'chưa có phiên nào');
        });
        grid.append(cell);
      })(n);
    }
    calendarRefresh = draw;
    draw();
    body.append(nav, grid, info);
  }

  function paintStars() { $('starCount').textContent = data.stars + ' sao'; }

  /* Thông điệp mỗi ngày */
  function showMessage() {
    var box = $('message');
    var today = dateKey(new Date());
    var seed = today.split('-').reduce(function (a, b) { return a * 31 + Number(b); }, 7);
    var text = MESSAGES[seed % MESSAGES.length];
    var card = el('button', 'msg-card');
    card.type = 'button';
    var inner = el('span', 'msg-inner');
    var front = el('span', 'msg-face', 'Bấm để rút thông điệp hôm nay');
    var back = el('span', 'msg-face back');
    back.append(el('span', 'msg-text', text), el('span', 'msg-from', 'Tục ngữ Việt Nam'));
    inner.append(front, back);
    card.append(inner);
    card.addEventListener('click', function () {
      card.classList.add('flipped');
      data.messageDate = today;
      save();
    });
    box.replaceChildren(card, button('Vào bàn học', 'ghost-btn', function () { box.hidden = true; toolButtons.clock.focus(); }));
    box.hidden = false;
  }

  /* Cảnh nền vẽ bằng canvas */
  var canvas, g, rafId = 0, drops = [], stars = [], W = 0, H = 0;
  function resizeCanvas() {
    var box = canvas.getBoundingClientRect();
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    W = box.width; H = box.height;
    canvas.width = W * dpr; canvas.height = H * dpr;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    drops = [];
    for (var i = 0; i < 170; i++) drops.push({ x: Math.random() * W, y: Math.random() * H, v: 500 + Math.random() * 500, l: 12 + Math.random() * 20 });
    stars = [];
    for (var s = 0; s < 190; s++) stars.push({ x: Math.random() * W, y: Math.random() * H * 0.85, r: Math.random() * 1.4 + 0.3, p: Math.random() * 6.28 });
    if (window.StudyScenes.has(data.scene)) window.StudyScenes.prepare(data.scene, W, H, dpr, function () { if (reduceMotion) drawScene(0, 0); });
  }
  function windowFrame() {
    g.strokeStyle = 'rgba(74,97,132,.32)';
    g.lineWidth = 3;
    var m = W * 0.08, top = H * 0.06, bottom = H * 0.86;
    g.strokeRect(m, top, W - m * 2, bottom - top);
    g.beginPath();
    g.moveTo(W / 2, top); g.lineTo(W / 2, bottom);
    g.moveTo(m, H * 0.4); g.lineTo(W - m, H * 0.4);
    g.stroke();
    g.fillStyle = '#080e1a';
    g.fillRect(0, bottom, W, H - bottom);
    g.fillStyle = '#16233a';
    g.fillRect(0, bottom, W, 3);
  }
  function drawScene(now, dt) {
    if (window.StudyScenes.has(data.scene)) {
      window.StudyScenes.draw(g, data.scene, now, dt);
      return;
    }
    var sky = g.createLinearGradient(0, 0, 0, H);
    if (data.scene === 'bim') { sky.addColorStop(0, '#070d1b'); sky.addColorStop(0.62, '#11294a'); sky.addColorStop(0.86, '#2d5a73'); }
    else if (data.scene === 'sao') { sky.addColorStop(0, '#03050b'); sky.addColorStop(1, '#0b1730'); }
    else { sky.addColorStop(0, '#060a13'); sky.addColorStop(1, '#0e1a2e'); }
    g.fillStyle = sky;
    g.fillRect(0, 0, W, H);
    if (data.scene === 'sao' || data.scene === 'bim') {
      var fade = data.scene === 'bim' ? 0.4 : 1;
      stars.forEach(function (s) {
        g.globalAlpha = fade * (0.45 + 0.45 * Math.sin(now / 900 + s.p));
        g.fillStyle = '#dfe8f3';
        g.beginPath(); g.arc(s.x, s.y, s.r, 0, 6.29); g.fill();
      });
      g.globalAlpha = 1;
    }
    if (data.scene === 'mua') {
      g.strokeStyle = 'rgba(159,211,255,.3)';
      g.lineWidth = 1;
      g.beginPath();
      drops.forEach(function (d) {
        d.y += d.v * dt; d.x -= d.v * dt * 0.08;
        if (d.y > H) { d.y = -d.l; d.x = Math.random() * W * 1.1; }
        g.moveTo(d.x, d.y); g.lineTo(d.x - d.l * 0.08, d.y + d.l);
      });
      g.stroke();
    }
    windowFrame();
  }
  var lastFrame = 0;
  function sceneLoop(now) {
    if (document.body.dataset.room !== 'hoc' || document.body.classList.contains('in-game')) { rafId = 0; return; }
    drawScene(now, Math.min(0.05, (now - lastFrame) / 1000));
    lastFrame = now;
    rafId = requestAnimationFrame(sceneLoop);
  }
  function startScene() {
    if (document.body.dataset.room !== 'hoc') return;
    resizeCanvas();
    if (reduceMotion) { drawScene(0, 0); return; }
    lastFrame = performance.now();
    if (!rafId) rafId = requestAnimationFrame(sceneLoop);
  }

  var ready = false;
  function enter() {
    if (!ready) {
      ready = true;
      data.open.forEach(function (id) {
        var tool = TOOLS.filter(function (t) { return t.id === id; })[0];
        if (tool) openTool(tool);
      });
      if (data.messageDate !== dateKey(new Date())) showMessage();
    } else {
      TOOLS.forEach(function (tool) { if (widgets[tool.id]) place(tool, widgets[tool.id]); });
    }
    startScene();
  }

  function init() {
    stage = $('stage');
    canvas = $('sceneCanvas');
    g = canvas.getContext('2d');
    paintStars();
    TOOLS.forEach(function (tool) {
      var b = button(tool.name, 'tool', function () {
        if (widgets[tool.id]) closeTool(tool); else openTool(tool, true);
      });
      b.setAttribute('aria-pressed', 'false');
      toolButtons[tool.id] = b;
      $('toolbar').append(b);
    });
    $('toolbar').append(button('Flashcard', 'tool', function () { window.Flashcard.open(); }));
    $('toolbar').append(button('Thông điệp', 'tool', showMessage));
    window.Flashcard.adopt(data.cards.filter(function (c) { return !DEFAULTS.cards.some(function (d) { return d.front === c.front; }); }));
    window.addEventListener('resize', function () {
      if (document.body.dataset.room !== 'hoc') return;
      startScene();
      TOOLS.forEach(function (tool) { if (widgets[tool.id]) place(tool, widgets[tool.id]); });
    });
  }

  return { init: init, enter: enter, click: click, refreshTitle: paintTimer };
})();
