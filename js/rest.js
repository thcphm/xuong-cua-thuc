/* Phòng nghỉ: I.C.A.R.E nhắc uống nước, nghỉ mắt, đứng dậy và vận động trong lúc bạn ngồi làm việc.
   Bấm "Bắt đầu phiên" thì I.C.A.R.E đếm giờ. Tới mốc của việc nào thì hiện lời nhắc việc đó,
   kèm hai nút: "Xong rồi" (đếm lại từ đầu) và "Nhắc lại sau 10 phút".
   Phiên vẫn chạy khi bạn sang phòng khác, nhưng chỉ nhắc được khi thẻ trang này còn mở.
   Ngoài phiên, I.C.A.R.E nhắc giờ đi ngủ mỗi tối: đúng giờ ngủ và trước đó theo các mốc trong SITE.rest.bedtime.
   Mọi thứ lưu trên trình duyệt, không gửi đi đâu. I.C.A.R.E không chẩn đoán và không khuyên thuốc. */
(function () {
  'use strict';
  var INFO = (window.SITE && window.SITE.rest) || {};
  var LIST = INFO.reminders || [];
  var panel = document.getElementById('nghiPanel');
  if (!panel || !LIST.length) return;

  var KEY = 'xuong.nghi';
  var MIN = 60 * 1000;
  var SNOOZE = (INFO.snooze || 10) * MIN;

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
  function today(now) {
    var d = new Date(now);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  /* Trạng thái: on (đang trong phiên), started (lúc bắt đầu), next[id] (lúc sẽ nhắc), due[id] (đang chờ bấm), day và count[id] (số lần xong trong ngày) */
  var state = { on: false, started: 0, next: {}, due: {}, day: '', count: {}, bedOn: true, bedDay: '', bedSent: [], bedDue: null };
  try {
    var saved = JSON.parse(localStorage.getItem(KEY));
    if (saved && typeof saved === 'object') state = Object.assign(state, saved);
  } catch (e) { /* chưa có gì lưu */ }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* trình duyệt chặn lưu trữ: vẫn chạy, chỉ không nhớ */ } }
  function rollDay(now) {
    if (state.day !== today(now)) { state.day = today(now); state.count = {}; }
  }

  function start() {
    var now = Date.now();
    rollDay(now);
    state.on = true;
    state.started = now;
    state.next = {};
    state.due = {};
    LIST.forEach(function (r) { state.next[r.id] = now + r.every * MIN; });
    save();
    if ('Notification' in window && Notification.permission === 'default') {
      try { Notification.requestPermission(); } catch (e) { /* trình duyệt cũ */ }
    }
    render();
  }
  function stop() {
    state.on = false;
    state.next = {};
    state.due = {};
    save();
    render();
  }
  function done(id) {
    var now = Date.now(), item = find(id);
    rollDay(now);
    state.count[id] = (state.count[id] || 0) + 1;
    delete state.due[id];
    state.next[id] = now + item.every * MIN;
    save();
    render();
  }
  function later(id) {
    delete state.due[id];
    state.next[id] = Date.now() + SNOOZE;
    save();
    render();
  }
  function find(id) { return LIST.filter(function (r) { return r.id === id; })[0]; }

  /* ---------- Giờ đi ngủ ---------- */
  var BED = INFO.bedtime || null;
  var BED_AT = BED ? BED.time.split(':').map(Number) : null;
  var BED_MARKS = BED ? (BED.before || []).slice().sort(function (a, b) { return b - a; }).concat([0]) : [];
  var LATE = 4 * 60 * MIN;                 // quá giờ ngủ hơn 4 tiếng thì thôi không nhắc nữa
  /* Giờ ngủ của "đêm nay". Sau nửa đêm tới 4 giờ sáng vẫn tính là đêm hôm trước. */
  function bedTarget(now) {
    var d = new Date(now);
    if (d.getHours() < 4) d.setDate(d.getDate() - 1);
    d.setHours(BED_AT[0], BED_AT[1], 0, 0);
    return d.getTime();
  }
  function clock(ms) {
    var d = new Date(ms);
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }
  function bedText(now) {
    var mins = Math.ceil((bedTarget(now) - now) / MIN);
    if (mins > 0) return 'Còn ' + (mins >= 60 ? '1 giờ' + (mins > 60 ? ' ' + (mins - 60) + ' phút' : '') : mins + ' phút') + ' nữa là tới giờ ngủ ' + BED.time + '. Thu xếp việc dần nhé.';
    if (mins > -5) return 'Đến giờ ngủ rồi (' + BED.time + '). Tắt máy và đi ngủ thôi.';
    return 'Đã quá giờ ngủ ' + BED.time + '. Đi ngủ sớm nhất có thể nhé.';
  }
  /* Mỗi mốc chỉ nhắc một lần mỗi đêm. Mở trang muộn thì chỉ nhắc mốc gần nhất, không nhắc dồn. */
  function checkBed() {
    if (!BED || !state.bedOn) return false;
    var now = Date.now(), target = bedTarget(now), key = today(target);
    if (state.bedDay !== key) { state.bedDay = key; state.bedSent = []; state.bedDue = null; }
    if (now - target > LATE) return false;
    var left = (target - now) / MIN;
    var passed = BED_MARKS.filter(function (m) { return left <= m; });
    if (!passed.length) return false;
    var latest = passed[passed.length - 1];
    if (state.bedSent.indexOf(latest) >= 0) return false;
    state.bedSent = passed;
    state.bedDue = { mark: latest };
    save();
    if ('Notification' in window && Notification.permission === 'granted' && document.hidden) {
      try { new Notification('I.C.A.R.E: Giờ đi ngủ', { body: bedText(now), icon: 'img/agents/icare.png', tag: 'icare-ngu' }); } catch (e) { /* bỏ qua */ }
    }
    document.dispatchEvent(new CustomEvent('tp:icare', { detail: ['ngu'] }));
    return true;
  }
  function bedSeen() { state.bedDue = null; save(); render(); }
  function bedToggle() {
    state.bedOn = !state.bedOn;
    if (!state.bedOn) state.bedDue = null;
    save();
    askNotify();
    checkBed();
    render();
  }
  function askNotify() {
    if ('Notification' in window && Notification.permission === 'default') {
      try { Notification.requestPermission().then(render, render); } catch (e) { /* trình duyệt cũ */ }
    }
  }

  /* Tới mốc: đánh dấu đang chờ, hiện thông báo của máy nếu được phép, cho I.C.A.R.E trong phòng vẫy tay */
  function check() {
    if (!state.on) return false;
    var now = Date.now(), fresh = [];
    LIST.forEach(function (r) {
      if (!state.due[r.id] && state.next[r.id] && now >= state.next[r.id]) {
        state.due[r.id] = now;
        fresh.push(r);
      }
    });
    if (!fresh.length) return false;
    save();
    fresh.forEach(function (r) {
      if ('Notification' in window && Notification.permission === 'granted' && document.hidden) {
        try { new Notification('I.C.A.R.E: ' + r.name, { body: r.text, icon: 'img/agents/icare.png', tag: 'icare-' + r.id }); } catch (e) { /* bỏ qua */ }
      }
    });
    document.dispatchEvent(new CustomEvent('tp:icare', { detail: fresh.map(function (r) { return r.id; }) }));
    return true;
  }

  function left(ms) {
    var m = Math.max(0, Math.ceil(ms / MIN));
    if (m >= 60) return 'Còn ' + Math.floor(m / 60) + ' giờ' + (m % 60 ? ' ' + (m % 60) + ' phút' : '');
    return 'Còn ' + m + ' phút';
  }

  /* ---------- Bảng trong Phòng nghỉ ---------- */
  var lead = el('p', 'nghi-lead');
  var toggle = button('nghi-go', '', function () { if (state.on) stop(); else start(); });
  var rows = el('ul', 'nghi-list');
  var note = el('p', 'nghi-note', INFO.note || '');
  var bed = el('div', 'nghi-bed');
  var allow = button('nghi-allow', 'Cho phép thông báo của máy', askNotify);
  panel.append(lead, toggle, rows, bed, allow, note);

  /* ---------- Lời nhắc nổi: hiện ở mọi phòng khi có việc tới mốc ---------- */
  var toast = el('div', 'nghi-toast');
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.hidden = true;
  document.body.append(toast);

  function render() {
    var now = Date.now();
    rollDay(now);
    lead.textContent = state.on ? 'Phiên đang chạy. I.C.A.R.E sẽ nhắc khi tới mốc, kể cả khi bạn sang phòng khác.' : (INFO.lead || '');
    toggle.textContent = state.on ? 'Kết thúc phiên' : 'Bắt đầu phiên';
    toggle.classList.toggle('on', state.on);
    rows.replaceChildren.apply(rows, LIST.map(function (r) {
      var li = el('li', 'nghi-row' + (state.due[r.id] ? ' due' : ''));
      var head = el('div', 'nghi-row-head');
      head.append(el('strong', '', r.name), el('span', 'nghi-every', 'Mỗi ' + r.every + ' phút'));
      var status = el('p', 'nghi-status', !state.on ? 'Chưa chạy' : state.due[r.id] ? 'Đến giờ: ' + r.text : left(state.next[r.id] - now));
      var count = el('p', 'nghi-count', 'Hôm nay: ' + (state.count[r.id] || 0) + ' lần');
      li.append(head, status, count);
      if (state.due[r.id]) li.append(actions(r));
      return li;
    }));
    /* Khối giờ đi ngủ */
    if (BED) {
      var times = BED_MARKS.map(function (m) { return clock(bedTarget(now) - m * MIN); });
      var head = el('div', 'nghi-row-head');
      head.append(el('strong', '', 'Giờ đi ngủ: ' + BED.time), button('nghi-switch' + (state.bedOn ? ' on' : ''), state.bedOn ? 'Đang bật' : 'Đang tắt', bedToggle));
      head.lastChild.setAttribute('aria-pressed', state.bedOn ? 'true' : 'false');
      head.lastChild.setAttribute('aria-label', 'Nhắc giờ đi ngủ');
      bed.replaceChildren(head, el('p', 'nghi-status', state.bedOn ? 'Mỗi tối I.C.A.R.E nhắc lúc ' + times.join(', ') + '. Không cần bắt đầu phiên.' : 'Đang tắt. Bấm nút để I.C.A.R.E nhắc giờ đi ngủ.'));
    }
    allow.hidden = !('Notification' in window) || Notification.permission !== 'default';

    var due = LIST.filter(function (r) { return state.due[r.id]; });
    toast.hidden = !due.length && !state.bedDue;
    if (state.bedDue) {
      var bedBox = el('div', 'nghi-toast-box');
      var bedFace = el('img');
      bedFace.src = 'img/agents/icare.png';
      bedFace.alt = '';
      var bedWords = el('div');
      bedWords.append(el('strong', '', 'I.C.A.R.E: Giờ đi ngủ'), el('p', '', bedText(now)));
      if (due.length) bedWords.append(el('p', 'nghi-more', 'Còn ' + due.length + ' lời nhắc nữa ở Phòng nghỉ.'));
      bedBox.append(bedFace, bedWords);
      var bedActs = el('div', 'nghi-acts');
      bedActs.append(button('nghi-done', state.bedDue.mark === 0 ? 'Đi ngủ đây' : 'Đã biết', bedSeen));
      toast.replaceChildren(bedBox, bedActs);
    } else if (due.length) {
      var r = due[0];
      var box = el('div', 'nghi-toast-box');
      var face = el('img');
      face.src = 'img/agents/icare.png';
      face.alt = '';
      var text = el('div');
      text.append(el('strong', '', 'I.C.A.R.E: ' + r.name), el('p', '', r.text));
      if (due.length > 1) text.append(el('p', 'nghi-more', 'Còn ' + (due.length - 1) + ' lời nhắc nữa ở Phòng nghỉ.'));
      box.append(face, text);
      toast.replaceChildren(box, actions(r));
    }
  }
  function actions(r) {
    var wrap = el('div', 'nghi-acts');
    wrap.append(
      button('nghi-done', r.done || 'Xong rồi', function () { done(r.id); }),
      button('nghi-later', 'Nhắc lại sau ' + (INFO.snooze || 10) + ' phút', function () { later(r.id); })
    );
    return wrap;
  }

  /* Mỗi giây xem có việc nào tới mốc; chữ đếm ngược chỉ cần vẽ lại mỗi 15 giây */
  var ticks = 0;
  setInterval(function () {
    ticks += 1;
    var fresh = check(), bedFresh = checkBed();
    if (fresh || bedFresh || ((state.on || state.bedDue) && ticks % 15 === 0)) render();
  }, 1000);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) { check(); checkBed(); render(); } });
  check();
  checkBed();
  render();

  /* Cho việc kiểm thử và cho các phần khác của trang hỏi trạng thái */
  window.Rest = { state: function () { return JSON.parse(JSON.stringify(state)); }, start: start, stop: stop };
})();
