/* Phòng Kế Hoạch: Planner gồm trang kế hoạch tuần (lịch hẹn, bảy ngày, việc cần làm, ghi chú),
   lịch tháng và nhắc giờ. Ngày giờ lấy theo đồng hồ máy người dùng và tự cập nhật.
   Mỗi việc có ngày và giờ (không bắt buộc), mức ưu tiên, kiểu lặp và kiểu nhắc.
   Việc lưu trên trình duyệt, không gửi đi đâu. Nhắc giờ chỉ chạy khi trang đang mở. */
(function () {
  'use strict';
  var panel = document.getElementById('khPanel');
  if (!panel) return;
  var SITE = window.SITE || {};
  var KEY = 'xuong.kehoach.viec', SET = 'xuong.kehoach.caidat', NOTE = 'xuong.kehoach.ghichu';
  var DAYS = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  var DOW = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
  var REPEAT = { day: 'lặp mỗi ngày', week: 'lặp mỗi tuần', month: 'lặp mỗi tháng' };
  var REMIND = { 0: 'nhắc đúng giờ', 10: 'nhắc trước 10 phút', 60: 'nhắc trước 1 giờ', 1440: 'nhắc trước 1 ngày' };
  var SNOOZE = 10 * 60000;

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }
  function button(className, text, run) {
    var b = el('button', className, text);
    b.type = 'button';
    b.addEventListener('click', run);
    return b;
  }
  function two(n) { return String(n).padStart(2, '0'); }
  /* Ngày theo giờ máy người dùng, dạng năm-tháng-ngày để so sánh được bằng chuỗi */
  function ymd(d) { return d.getFullYear() + '-' + two(d.getMonth() + 1) + '-' + two(d.getDate()); }
  function parse(s) { var p = s.split('-'); return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2])); }
  function short(s) { var d = parse(s); return DAYS[d.getDay()] + ' ' + d.getDate() + '/' + (d.getMonth() + 1); }
  function today() { return ymd(new Date()); }
  function addDays(s, n) { var d = parse(s); d.setDate(d.getDate() + n); return ymd(d); }
  function daysIn(y, m) { return new Date(y, m + 1, 0).getDate(); }
  /* Tuần bắt đầu từ thứ Hai */
  function monday(s) { var d = parse(s); d.setDate(d.getDate() - (d.getDay() + 6) % 7); return ymd(d); }
  function week(from) { var out = []; for (var i = 0; i < 7; i++) out.push(addDays(from, i)); return out; }

  /* Dữ liệu */
  var tasks = [];
  try {
    (JSON.parse(localStorage.getItem(KEY)) || []).forEach(function (t) {
      if (!t || typeof t.title !== 'string') return;
      /* Việc không có ngày nằm ở ô Việc cần làm của trang tuần */
      var day = /^\d{4}-\d{2}-\d{2}$/.test(t.date) ? t.date : '';
      var time = day && /^\d{2}:\d{2}$/.test(t.time) ? t.time : '';
      tasks.push({
        id: String(t.id), title: t.title.slice(0, 120), date: day, time: time, done: !!t.done,
        prio: t.prio === 0 || t.prio === 2 ? t.prio : 1,
        repeat: day && REPEAT[t.repeat] ? t.repeat : '',
        remind: time && REMIND[t.remind] ? Number(t.remind) : -1,
        fired: typeof t.fired === 'string' ? t.fired : '',
        snooze: Number(t.snooze) || 0
      });
    });
  } catch (e) { /* bỏ qua */ }
  var settings = { sound: true };
  try { var s0 = JSON.parse(localStorage.getItem(SET)); if (s0 && s0.sound === false) settings.sound = false; } catch (e) { /* bỏ qua */ }
  /* Ghi chú theo tuần, khóa là ngày thứ Hai của tuần */
  var notes = {};
  try { var n0 = JSON.parse(localStorage.getItem(NOTE)); if (n0 && typeof n0 === 'object') Object.keys(n0).forEach(function (k) { if (typeof n0[k] === 'string') notes[k] = n0[k].slice(0, 2000); }); } catch (e) { /* bỏ qua */ }
  function saveNotes() { try { localStorage.setItem(NOTE, JSON.stringify(notes)); } catch (e) { /* bỏ qua */ } }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(tasks)); } catch (e) { /* trình duyệt chặn lưu trữ: vẫn chạy, chỉ không nhớ */ }
    document.dispatchEvent(new CustomEvent('tp:planner'));
  }
  function saveSettings() { try { localStorage.setItem(SET, JSON.stringify(settings)); } catch (e) { /* bỏ qua */ } }

  function byTime(a, b) { var x = a.time || '99', y = b.time || '99'; return x < y ? -1 : x > y ? 1 : b.prio - a.prio; }
  function byDate(a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : byTime(a, b); }

  /* Việc lặp: lần kế tiếp sau ngày đang ghi */
  function nextDate(t) {
    if (t.repeat === 'day') return addDays(t.date, 1);
    if (t.repeat === 'week') return addDays(t.date, 7);
    var d = parse(t.date), y = d.getFullYear(), m = d.getMonth() + 1;
    if (m > 11) { m = 0; y++; }
    return ymd(new Date(y, m, Math.min(d.getDate(), daysIn(y, m))));
  }
  /* Việc lặp có rơi vào một ngày sau ngày đang ghi không */
  function occurs(t, day) {
    if (!t.repeat || t.done || !t.date || day <= t.date) return false;
    if (t.repeat === 'day') return true;
    var a = parse(t.date), b = parse(day);
    if (t.repeat === 'week') return Math.round((b - a) / 864e5) % 7 === 0;
    return b.getDate() === Math.min(a.getDate(), daysIn(b.getFullYear(), b.getMonth()));
  }
  function onDay(day) {
    var real = [], ghost = [];
    tasks.forEach(function (t) { if (t.date === day) real.push(t); else if (occurs(t, day)) ghost.push(t); });
    return { real: real.sort(byTime), ghost: ghost.sort(byTime) };
  }
  /* Đánh dấu xong. Việc lặp không đóng lại mà chuyển sang lần kế tiếp. */
  function setDone(t, done) {
    if (done && t.repeat && t.date) { t.date = nextDate(t); t.snooze = 0; } else { t.done = done; if (done) t.snooze = 0; }
    save();
    render();
  }

  /* Nhắc giờ */
  function fireAt(t) {
    if (t.done || t.remind < 0 || !t.time) return null;
    var d = parse(t.date), p = t.time.split(':');
    d.setHours(Number(p[0]), Number(p[1]), 0, 0);
    return d.getTime() - t.remind * 60000;
  }
  function fireKey(t) { return t.date + ' ' + t.time + ' ' + t.remind; }
  /* Việc vừa ghi mà giờ nhắc đã qua thì coi như đã nhắc, tránh kêu ngay lúc bấm Thêm */
  function settle(t) { var at = fireAt(t); t.fired = at != null && at <= Date.now() ? fireKey(t) : ''; t.snooze = 0; }

  var toasts = el('div', 'kh-toasts');
  toasts.setAttribute('role', 'status');
  toasts.setAttribute('aria-live', 'polite');
  document.body.append(toasts);
  var audio = null;
  function chime() {
    if (!settings.sound) return;
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === 'suspended') audio.resume();
      [880, 1175].forEach(function (hz, n) {
        var osc = audio.createOscillator(), gain = audio.createGain(), at = audio.currentTime + n * 0.18;
        osc.type = 'sine';
        osc.frequency.value = hz;
        gain.gain.setValueAtTime(0.0001, at);
        gain.gain.exponentialRampToValueAtTime(0.16, at + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.5);
        osc.connect(gain).connect(audio.destination);
        osc.start(at);
        osc.stop(at + 0.55);
      });
    } catch (e) { /* trình duyệt chưa cho phát tiếng */ }
  }
  function notice(t, late) {
    var when = t.time ? t.time + ', ' + short(t.date) : short(t.date);
    var box = el('div', 'kh-toast');
    var text = el('div', 'kh-toast-text');
    text.append(el('p', 'kh-toast-kind', late ? 'Đã lỡ giờ nhắc' : 'Nhắc việc'), el('p', 'kh-toast-title', t.title), el('p', 'kh-toast-when', when));
    var acts = el('div', 'kh-toast-acts');
    function close() { box.remove(); }
    acts.append(
      button('bep-mini', 'Xong', function () { if (tasks.indexOf(t) >= 0) setDone(t, true); close(); }),
      button('bep-clear', 'Hoãn 10 phút', function () { if (tasks.indexOf(t) >= 0) { t.snooze = Date.now() + SNOOZE; save(); render(); } close(); })
    );
    var x = button('bep-x', '×', close);
    x.setAttribute('aria-label', 'Đóng lời nhắc');
    box.append(text, x, acts);
    while (toasts.children.length >= 4) toasts.firstChild.remove();
    toasts.append(box);
    chime();
    try {
      if (window.Notification && Notification.permission === 'granted') new Notification(late ? 'Đã lỡ giờ nhắc' : 'Nhắc việc', { body: t.title + ' (' + when + ')', tag: 'kh-' + t.id });
    } catch (e) { /* Chrome trên Android không cho tạo thông báo kiểu này: vẫn có lời nhắc trong trang */ }
    document.dispatchEvent(new CustomEvent('tp:remind', { detail: { title: t.title, when: when, late: late } }));
  }
  function check() {
    var now = Date.now(), changed = false;
    tasks.forEach(function (t) {
      if (t.done) return;
      var at = t.snooze || fireAt(t);
      if (at == null || at > now) return;
      var key = t.snooze ? 'hoan ' + t.snooze : fireKey(t);
      if (t.fired === key) return;
      t.fired = key;
      t.snooze = 0;
      changed = true;
      notice(t, now - at > 30 * 60000);
    });
    if (changed) { save(); render(); }
  }

  /* Tab */
  var tabs = Array.prototype.slice.call(panel.querySelectorAll('[role="tab"]'));
  function show(tab) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
    panel.scrollTop = 0;
  }
  tabs.forEach(function (t, n) {
    t.addEventListener('click', function () { show(t); });
    t.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      var next = tabs[(n + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
      show(next);
      next.focus();
    });
  });

  /* Ô nhập: thêm việc mới hoặc sửa việc đang chọn */
  var form = document.getElementById('khForm'), title = document.getElementById('khTitle'), date = document.getElementById('khDate'), time = document.getElementById('khTime');
  var prio = document.getElementById('khPrio'), repeat = document.getElementById('khRepeat'), remind = document.getElementById('khRemind');
  var more = document.getElementById('khMore'), opts = document.getElementById('khOpts'), submit = document.getElementById('khSubmit'), editing = document.getElementById('khEditing');
  var selected = today(), weekStart = monday(today()), viewY = new Date().getFullYear(), viewM = new Date().getMonth(), editId = '';
  date.value = selected;
  function openOpts(on) { opts.hidden = !on; more.setAttribute('aria-expanded', on ? 'true' : 'false'); }
  more.addEventListener('click', function () { openOpts(opts.hidden); });
  function resetForm() {
    editId = '';
    title.value = '';
    time.value = '';
    prio.value = '1';
    repeat.value = '';
    remind.value = '0';
    date.value = selected;
    submit.textContent = 'Thêm';
    editing.hidden = true;
  }
  document.getElementById('khCancel').addEventListener('click', function () { resetForm(); openOpts(false); });
  /* Gõ nhanh: "mai 9h họp nhóm", "hôm nay 14:30 nộp bài". Từ chỉ ngày phải đứng đầu câu. */
  function quick(raw) {
    var text = raw.normalize('NFC'), out = { title: raw, date: '', time: '' };
    var m = text.match(/^(hôm nay|ngày mai|mai|ngày mốt|mốt)(?=\s)/i);
    if (m) { var w = m[1].toLowerCase(); out.date = addDays(today(), w === 'hôm nay' ? 0 : w.indexOf('mốt') >= 0 ? 2 : 1); text = text.slice(m[0].length).trim(); }
    var t = text.match(/(^|\s)(?:lúc\s+)?(\d{1,2})(?:h(\d{2})?|:(\d{2}))(?=\s|$)/i);
    if (t && Number(t[2]) < 24 && Number(t[3] || t[4] || 0) < 60) {
      out.time = two(Number(t[2])) + ':' + two(Number(t[3] || t[4] || 0));
      text = (text.slice(0, t.index) + ' ' + text.slice(t.index + t[0].length)).replace(/\s+/g, ' ').trim();
    }
    if (!text || (!out.date && !out.time)) return { title: raw, date: '', time: '' };
    out.title = text.charAt(0).toUpperCase() + text.slice(1);
    return out;
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var raw = title.value.trim();
    if (!raw) { title.focus(); return; }
    var q = editId ? { title: raw, date: '', time: '' } : quick(raw);
    var at = time.value || q.time;
    /* Bỏ trống ngày: việc vào ô Việc cần làm. Có giờ mà không có ngày thì tính là hôm nay. */
    var day = q.date || date.value || (at ? today() : '');
    var data = {
      title: q.title.slice(0, 120), date: day, time: at,
      prio: Number(prio.value), repeat: day ? repeat.value : '', remind: at ? Number(remind.value) : -1
    };
    var task = tasks.filter(function (t) { return t.id === editId; })[0];
    if (!task) { task = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), done: false }; tasks.push(task); }
    Object.keys(data).forEach(function (k) { task[k] = data[k]; });
    settle(task);
    save();
    if (task.date) {
      selected = task.date;
      weekStart = monday(selected);
      var d = parse(selected);
      viewY = d.getFullYear();
      viewM = d.getMonth();
    }
    resetForm();
    render();
    title.focus();
  });
  function edit(task) {
    editId = task.id;
    title.value = task.title;
    date.value = task.date;
    time.value = task.time;
    prio.value = String(task.prio);
    repeat.value = task.repeat;
    remind.value = String(task.remind);
    submit.textContent = 'Lưu';
    editing.hidden = false;
    openOpts(true);
    panel.scrollTop = 0;
    title.focus();
  }

  /* Một dòng việc: ô đánh dấu, tên, thông tin phụ, nút sửa, nút xóa.
     ghost: lần lặp sắp tới của một việc, chỉ để xem. */
  function row(task, withDate, ghost) {
    var li = el('li', 'kh-task p' + task.prio + (task.done ? ' done' : '') + (ghost ? ' ghost' : ''));
    var bits = [];
    if (withDate && task.date) bits.push(short(task.date));
    if (task.time) bits.push(task.time);
    if (task.repeat) bits.push(REPEAT[task.repeat]);
    if (task.remind >= 0) bits.push(task.snooze ? 'đã hoãn' : REMIND[task.remind]);
    var text = el('span', 'kh-text');
    text.append(el('span', 'kh-name', task.title));
    if (bits.length) text.append(el('span', 'kh-meta' + (withDate && !task.done && task.date && task.date < today() ? ' late' : ''), bits.join(', ')));
    if (ghost) { li.append(text); return li; }
    var label = el('label');
    var box = el('input');
    box.type = 'checkbox';
    box.checked = task.done;
    box.addEventListener('change', function () { setDone(task, box.checked); });
    label.append(box, text);
    var pen = button('kh-edit', 'Sửa', function () { edit(task); });
    pen.setAttribute('aria-label', 'Sửa việc ' + task.title);
    var x = button('bep-x', '×', function () { tasks = tasks.filter(function (t) { return t !== task; }); if (editId === task.id) resetForm(); save(); render(); });
    x.setAttribute('aria-label', 'Xóa việc ' + task.title);
    li.append(label, pen, x);
    return li;
  }
  function list(items, withDate, ghosts) {
    var ul = el('ul', 'kh-list');
    items.forEach(function (t) { ul.append(row(t, withDate, false)); });
    (ghosts || []).forEach(function (t) { ul.append(row(t, false, true)); });
    return ul;
  }
  function block(parent, heading, items, withDate, empty) {
    if (heading) parent.append(el('h3', '', heading));
    if (!items.length) { if (empty) parent.append(el('p', 'bep-note', empty)); return; }
    parent.append(list(items, withDate));
  }
  function meter(parent, done, total) {
    if (!total) return;
    var bar = el('div', 'kh-meter');
    bar.setAttribute('aria-hidden', 'true');
    var fill = el('i');
    fill.style.width = Math.round(done / total * 100) + '%';
    bar.append(fill);
    parent.append(bar);
  }

  /* Lịch tháng */
  var calBox = document.getElementById('khCal'), todayBox = document.getElementById('khToday'), sheetBox = document.getElementById('khSheet'), allBox = document.getElementById('khAll'), bellBox = document.getElementById('khBell');
  function pick(day, focus) {
    selected = day;
    weekStart = monday(day);
    var d = parse(day);
    viewY = d.getFullYear();
    viewM = d.getMonth();
    if (!editId) date.value = day;
    render();
    if (focus) { var cell = calBox.querySelector('[data-day="' + day + '"]'); if (cell) cell.focus(); }
  }
  function move(n) {
    viewM += n;
    if (viewM < 0) { viewM = 11; viewY--; }
    if (viewM > 11) { viewM = 0; viewY++; }
    render();
  }
  function renderCal(now) {
    calBox.replaceChildren();
    var head = el('div', 'kh-cal-head');
    var prev = button('bep-step', '‹', function () { move(-1); }), next = button('bep-step', '›', function () { move(1); });
    prev.setAttribute('aria-label', 'Tháng trước');
    next.setAttribute('aria-label', 'Tháng sau');
    head.append(el('h3', '', 'Tháng ' + (viewM + 1) + ', ' + viewY), button('bep-mini', 'Hôm nay', function () { pick(today(), true); }), prev, next);
    var grid = el('div', 'kh-grid');
    grid.setAttribute('role', 'group');
    grid.setAttribute('aria-label', 'Chọn ngày');
    DOW.forEach(function (d) { var h = el('span', 'kh-dow', d); h.setAttribute('aria-hidden', 'true'); grid.append(h); });
    var first = new Date(viewY, viewM, 1), lead = (first.getDay() + 6) % 7;
    var total = Math.ceil((lead + daysIn(viewY, viewM)) / 7) * 7;
    var d = new Date(viewY, viewM, 1 - lead);
    for (var i = 0; i < total; i++) {
      (function (day, num, out) {
        var got = onDay(day), open = got.real.filter(function (t) { return !t.done; }).concat(got.ghost);
        var cell = el('button', 'kh-cell' + (out ? ' out' : '') + (day === now ? ' now' : ''));
        cell.type = 'button';
        cell.dataset.day = day;
        cell.setAttribute('aria-pressed', day === selected ? 'true' : 'false');
        cell.setAttribute('aria-label', short(day) + (day === now ? ', hôm nay' : '') + (open.length ? ', ' + open.length + ' việc' : got.real.length ? ', xong hết' : ''));
        cell.append(el('span', 'kh-num', String(num)));
        var dots = el('span', 'kh-dots');
        open.slice().sort(function (a, b) { return b.prio - a.prio; }).slice(0, 3).forEach(function (t) { dots.append(el('i', 'p' + t.prio)); });
        if (!open.length && got.real.length) dots.append(el('i', 'ok'));
        cell.append(dots);
        cell.addEventListener('click', function () { pick(day, true); });
        grid.append(cell);
      })(ymd(d), d.getDate(), d.getMonth() !== viewM);
      d.setDate(d.getDate() + 1);
    }
    grid.addEventListener('keydown', function (e) {
      var step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
      if (!step) return;
      e.preventDefault();
      pick(addDays(selected, step), true);
    });
    calBox.append(head, grid);
    var got = onDay(selected);
    calBox.append(el('h3', 'kh-agenda', short(selected) + (selected === now ? ' (hôm nay)' : '')));
    if (got.real.length || got.ghost.length) calBox.append(list(got.real, false, got.ghost));
    else calBox.append(el('p', 'bep-note', 'Ngày này chưa có việc. Gõ ở ô trên để thêm.'));
  }

  /* Trang kế hoạch tuần: tiêu đề và ngày giờ, lịch hẹn, bảy ngày, việc cần làm, ghi chú */
  var clock = null, lastDay = today();
  function stamp(t) { var d = parse(t.date), p = t.time.split(':'); d.setHours(Number(p[0]), Number(p[1]), 0, 0); return d.getTime(); }
  function clockText() {
    var d = new Date();
    return DAYS[d.getDay()] + ', ' + d.getDate() + '/' + (d.getMonth() + 1) + '/' + d.getFullYear() + ', ' + two(d.getHours()) + ':' + two(d.getMinutes()) + ':' + two(d.getSeconds());
  }
  function bar(text) { return el('h3', 'kh-bar', text); }
  function renderSheet(now) {
    /* Đang gõ dở ở ô việc hoặc ô ghi chú thì giữ lại chỗ gõ sau khi vẽ lại */
    var was = document.activeElement, keep = was && (was.id === 'khNote' || was.id === 'khTodo') ? { id: was.id, value: was.value, at: was.selectionStart } : null;
    sheetBox.replaceChildren();
    var days = week(weekStart), a = parse(days[0]), b = parse(days[6]);

    var head = el('div', 'kh-sheet-head');
    clock = el('p', 'kh-clock', clockText());
    head.append(el('h2', '', 'Kế hoạch tuần'), clock);
    var fields = el('div', 'kh-fields');
    function field(name, value) { var f = el('span', 'kh-field'); f.append(el('span', '', name), el('b', '', value)); return f; }
    function go(n) { weekStart = n ? addDays(weekStart, n) : monday(today()); render(); }
    var prev = button('bep-step', '‹', function () { go(-7); }), next = button('bep-step', '›', function () { go(7); });
    prev.setAttribute('aria-label', 'Tuần trước');
    next.setAttribute('aria-label', 'Tuần sau');
    fields.append(
      field('Tháng', a.getMonth() === b.getMonth() ? String(a.getMonth() + 1) : (a.getMonth() + 1) + ' - ' + (b.getMonth() + 1)),
      field('Năm', a.getFullYear() === b.getFullYear() ? String(a.getFullYear()) : a.getFullYear() + ' - ' + b.getFullYear()),
      button('bep-mini', 'Tuần này', function () { go(0); }), prev, next
    );
    head.append(fields);
    sheetBox.append(head);

    /* Lịch hẹn: việc có giờ trong tuần, bấm để sửa */
    var appt = tasks.filter(function (t) { return t.time && !t.done && t.date >= days[0] && t.date <= days[6]; }).sort(byDate);
    var grid = el('div', 'kh-appt');
    appt.forEach(function (t) {
      var d = parse(t.date), at = stamp(t);
      var slot = button('kh-slot' + (at < Date.now() ? ' past' : ''), '', function () { edit(t); });
      slot.dataset.at = String(at);
      slot.setAttribute('aria-label', 'Sửa lịch hẹn ' + t.title);
      slot.append(el('span', 'kh-slot-at', DOW[(d.getDay() + 6) % 7] + ' ' + d.getDate() + '/' + (d.getMonth() + 1) + ', ' + t.time), el('span', 'kh-slot-name', t.title));
      grid.append(slot);
    });
    for (var i = appt.length; i < 4 || i % 2; i++) grid.append(el('span', 'kh-slot empty'));
    sheetBox.append(bar('Lịch hẹn'), grid);

    var cols = el('div', 'kh-cols'), wk = el('div', 'kh-week');
    days.forEach(function (day, n) {
      var got = onDay(day), d = parse(day);
      var line = el('div', 'kh-wday' + (day === now ? ' now' : '') + (day === selected ? ' sel' : ''));
      var tab = button('kh-wtab', '', function () { pick(day, false); title.focus(); });
      tab.setAttribute('aria-label', 'Thêm việc vào ' + short(day) + (day === now ? ', hôm nay' : ''));
      tab.append(el('b', '', DOW[n]), el('span', '', d.getDate() + '/' + (d.getMonth() + 1)));
      var body = el('div', 'kh-wbody');
      if (got.real.length || got.ghost.length) body.append(list(got.real, false, got.ghost));
      line.append(tab, body);
      wk.append(line);
    });

    var side = el('div', 'kh-side');
    var todo = tasks.filter(function (t) { return !t.date; }).sort(function (x, y) { return (x.done ? 1 : 0) - (y.done ? 1 : 0) || y.prio - x.prio; });
    var box = el('section', 'kh-box');
    box.append(bar('Việc cần làm'));
    if (todo.length) box.append(list(todo, false));
    else box.append(el('p', 'bep-note', 'Việc chưa gắn ngày ghi ở đây.'));
    var mini = el('form', 'kh-mini'), input = el('input');
    input.id = 'khTodo';
    input.type = 'text';
    input.maxLength = 120;
    input.placeholder = 'Thêm việc';
    input.autocomplete = 'off';
    input.setAttribute('aria-label', 'Thêm việc chưa gắn ngày');
    var add = el('button', 'bep-mini', 'Thêm');
    add.type = 'submit';
    mini.append(input, add);
    mini.addEventListener('submit', function (e) {
      e.preventDefault();
      var text = input.value.trim();
      if (!text) { input.focus(); return; }
      tasks.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), title: text.slice(0, 120), date: '', time: '', prio: 1, repeat: '', remind: -1, done: false, fired: '', snooze: 0 });
      save();
      render();
      document.getElementById('khTodo').focus();
    });
    box.append(mini);
    var noteBox = el('section', 'kh-box');
    var note = el('textarea', 'kh-note');
    note.id = 'khNote';
    note.maxLength = 2000;
    note.rows = 5;
    note.placeholder = 'Ghi chú của tuần này';
    note.setAttribute('aria-label', 'Ghi chú của tuần');
    note.value = notes[weekStart] || '';
    note.addEventListener('input', function () { if (note.value) notes[weekStart] = note.value; else delete notes[weekStart]; saveNotes(); });
    noteBox.append(bar('Ghi chú'), note);
    side.append(box, noteBox);
    cols.append(wk, side);
    sheetBox.append(cols);

    if (keep) {
      var back = document.getElementById(keep.id);
      if (keep.id === 'khTodo') back.value = keep.value;
      back.focus();
      try { back.setSelectionRange(keep.at, keep.at); } catch (e) { /* bỏ qua */ }
    }
  }
  /* Đồng hồ thật: mỗi giây cập nhật giờ và lịch hẹn đã qua, sang ngày mới thì vẽ lại cả Planner */
  setInterval(function () {
    if (clock) clock.textContent = clockText();
    var t = Date.now();
    Array.prototype.forEach.call(sheetBox.querySelectorAll('.kh-slot[data-at]'), function (s) { s.classList.toggle('past', Number(s.dataset.at) < t); });
    var day = today();
    if (day === lastDay) return;
    if (weekStart === monday(lastDay)) weekStart = monday(day);
    if (selected === lastDay) { selected = day; if (!editId) date.value = day; }
    lastDay = day;
    render();
  }, 1000);

  function renderBell() {
    bellBox.replaceChildren();
    var info = SITE.planning || {};
    bellBox.append(el('h3', '', 'Nhắc giờ'));
    bellBox.append(el('p', '', 'Việc có giờ sẽ được nhắc bằng một thẻ ở góc trang kèm tiếng chuông. Nhắc chỉ chạy khi trang này đang mở.'));
    var perm = window.Notification ? Notification.permission : 'none';
    var state = el('p', 'bep-note', perm === 'granted' ? 'Thông báo của trình duyệt: đang bật.' : perm === 'denied' ? 'Thông báo của trình duyệt: đang bị chặn. Mở lại trong phần cài đặt trang của trình duyệt.' : perm === 'none' ? 'Trình duyệt này không có thông báo, chỉ có lời nhắc trong trang.' : 'Thông báo của trình duyệt: chưa bật.');
    bellBox.append(state);
    var foot = el('div', 'bep-foot');
    if (perm === 'default') foot.append(button('bep-go', 'Bật thông báo', function () {
      try { var p = Notification.requestPermission(renderBell); if (p && p.then) p.then(renderBell, renderBell); } catch (e) { renderBell(); }
    }));
    foot.append(button('bep-mini', 'Thử lời nhắc', function () { notice({ id: 'thu', title: 'Đây là lời nhắc thử', date: today(), time: two(new Date().getHours()) + ':' + two(new Date().getMinutes()) }, false); }));
    bellBox.append(foot);
    var sound = el('label', 'kh-switch');
    var box = el('input');
    box.type = 'checkbox';
    box.checked = settings.sound;
    box.addEventListener('change', function () { settings.sound = box.checked; saveSettings(); });
    sound.append(box, el('span', '', 'Kêu chuông khi nhắc'));
    bellBox.append(sound);

    var now = Date.now();
    var soon = tasks.map(function (t) { return { t: t, at: t.done ? null : t.snooze || fireAt(t) }; }).filter(function (r) { return r.at != null && r.at > now; }).sort(function (a, b) { return a.at - b.at; }).slice(0, 5);
    bellBox.append(el('h3', '', 'Sắp nhắc'));
    if (!soon.length) bellBox.append(el('p', 'bep-note', 'Chưa có lời nhắc nào đang chờ. Thêm giờ cho một việc để được nhắc.'));
    else {
      var ul = el('ul', 'kh-soon');
      soon.forEach(function (r) {
        var d = new Date(r.at), li = el('li');
        li.append(el('span', 'kh-soon-at', short(ymd(d)) + ' ' + two(d.getHours()) + ':' + two(d.getMinutes())), el('span', '', r.t.title));
        ul.append(li);
      });
      bellBox.append(ul);
    }
    if (info.about) { bellBox.append(el('h3', '', 'Về Planner'), el('p', '', info.about)); }
  }

  function render() {
    var now = today();
    var open = tasks.filter(function (t) { return !t.done; }).sort(byDate);
    var late = open.filter(function (t) { return t.date && t.date < now; });
    var due = tasks.filter(function (t) { return t.date === now; }).sort(byTime);
    var left = due.filter(function (t) { return !t.done; }).length + late.length;
    document.getElementById('khCount').textContent = left ? String(left) : '';

    renderCal(now);

    todayBox.replaceChildren();
    var doneToday = due.length - due.filter(function (t) { return !t.done; }).length;
    todayBox.append(el('p', 'bep-lead', short(now) + '. ' + (left ? 'Còn ' + left + ' việc.' : due.length ? 'Xong hết việc hôm nay.' : 'Hôm nay chưa có việc nào.') + (due.length ? ' Xong ' + doneToday + '/' + due.length + '.' : '')));
    meter(todayBox, doneToday, due.length);
    if (late.length) block(todayBox, 'Quá hạn', late, true);
    block(todayBox, late.length ? 'Hôm nay' : '', due, false, late.length ? 'Hôm nay chưa có việc nào.' : '');

    renderSheet(now);

    allBox.replaceChildren();
    var done = tasks.filter(function (t) { return t.done; }).sort(byDate).reverse();
    block(allBox, 'Chưa xong (' + open.length + ')', open, true, 'Không còn việc nào đang chờ.');
    block(allBox, 'Đã xong (' + done.length + ')', done, true, 'Chưa có việc nào xong.');
    if (done.length) {
      var foot = el('div', 'bep-foot');
      foot.append(button('bep-clear', 'Xóa việc đã xong', function () { tasks = tasks.filter(function (t) { return !t.done; }); save(); render(); }));
      allBox.append(foot);
    }

    renderBell();
  }

  document.getElementById('khIntro').textContent = (SITE.planning || {}).intro || '';
  render();
  check();
  setInterval(check, 20000);
  /* Quay lại trang hoặc sang ngày mới khi trang vẫn mở: vẽ lại và soát lời nhắc */
  document.addEventListener('visibilitychange', function () { if (!document.hidden) { render(); check(); } });
})();
