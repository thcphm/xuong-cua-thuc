/* Phòng Kế Hoạch: PLANNER giữ danh sách việc cần làm.
   Thêm việc kèm ngày, xem theo hôm nay, theo tuần hoặc tất cả, đánh dấu xong, xóa.
   Việc lưu trên trình duyệt, không gửi đi đâu. */
(function () {
  'use strict';
  var panel = document.getElementById('khPanel');
  if (!panel) return;
  var SITE = window.SITE || {};
  var KEY = 'xuong.kehoach.viec';
  var DAYS = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

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
  /* Ngày theo giờ máy người dùng, dạng năm-tháng-ngày để so sánh được bằng chuỗi */
  function ymd(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function parse(s) { var p = s.split('-'); return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2])); }
  function short(s) { var d = parse(s); return DAYS[d.getDay()] + ' ' + d.getDate() + '/' + (d.getMonth() + 1); }
  function today() { return ymd(new Date()); }
  /* Tuần bắt đầu từ thứ Hai */
  function week() {
    var d = new Date();
    d.setDate(d.getDate() - (d.getDay() + 6) % 7);
    var out = [];
    for (var i = 0; i < 7; i++) { out.push(ymd(d)); d.setDate(d.getDate() + 1); }
    return out;
  }

  var tasks = [];
  try {
    (JSON.parse(localStorage.getItem(KEY)) || []).forEach(function (t) {
      if (t && typeof t.title === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(t.date)) tasks.push({ id: String(t.id), title: t.title.slice(0, 120), date: t.date, done: !!t.done });
    });
  } catch (e) { /* bỏ qua */ }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(tasks)); } catch (e) { /* trình duyệt chặn lưu trữ: vẫn chạy, chỉ không nhớ */ } }
  function byDate(a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; }

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

  /* Thêm việc */
  var form = document.getElementById('khForm'), title = document.getElementById('khTitle'), date = document.getElementById('khDate');
  date.value = today();
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var text = title.value.trim();
    if (!text) { title.focus(); return; }
    tasks.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), title: text.slice(0, 120), date: date.value || today(), done: false });
    save();
    title.value = '';
    render();
    title.focus();
  });

  /* Một dòng việc: ô đánh dấu, tên, ngày (nếu cần), nút xóa */
  function row(task, withDate) {
    var li = el('li', 'kh-task' + (task.done ? ' done' : ''));
    var label = el('label');
    var box = el('input');
    box.type = 'checkbox';
    box.checked = task.done;
    box.addEventListener('change', function () { task.done = box.checked; save(); render(); });
    label.append(box, el('span', 'kh-name', task.title));
    li.append(label);
    if (withDate) li.append(el('span', 'kh-date' + (!task.done && task.date < today() ? ' late' : ''), short(task.date)));
    var x = button('bep-x', '×', function () { tasks = tasks.filter(function (t) { return t !== task; }); save(); render(); });
    x.setAttribute('aria-label', 'Xóa việc ' + task.title);
    li.append(x);
    return li;
  }
  function block(parent, heading, items, withDate, empty) {
    if (heading) parent.append(el('h3', '', heading));
    if (!items.length) { if (empty) parent.append(el('p', 'bep-note', empty)); return; }
    var ul = el('ul', 'kh-list');
    items.forEach(function (t) { ul.append(row(t, withDate)); });
    parent.append(ul);
  }

  var todayBox = document.getElementById('khToday'), weekBox = document.getElementById('khWeek'), allBox = document.getElementById('khAll');
  function render() {
    var now = today();
    var open = tasks.filter(function (t) { return !t.done; }).sort(byDate);
    var late = open.filter(function (t) { return t.date < now; });
    var due = tasks.filter(function (t) { return t.date === now; });
    var left = due.filter(function (t) { return !t.done; }).length + late.length;
    document.getElementById('khCount').textContent = left ? String(left) : '';

    todayBox.replaceChildren();
    todayBox.append(el('p', 'bep-lead', short(now) + '. ' + (left ? 'Còn ' + left + ' việc.' : due.length ? 'Xong hết việc hôm nay.' : 'Hôm nay chưa có việc nào.')));
    if (late.length) block(todayBox, 'Quá hạn', late, true);
    block(todayBox, late.length ? 'Hôm nay' : '', due, false, late.length ? 'Hôm nay chưa có việc nào.' : '');

    weekBox.replaceChildren();
    week().forEach(function (day) {
      var items = tasks.filter(function (t) { return t.date === day; });
      var box = el('div', 'kh-day' + (day === now ? ' now' : ''));
      box.append(el('h3', '', short(day) + (day === now ? ' (hôm nay)' : '')));
      if (items.length) { var ul = el('ul', 'kh-list'); items.forEach(function (t) { ul.append(row(t, false)); }); box.append(ul); }
      else box.append(el('p', 'bep-note', 'Trống'));
      weekBox.append(box);
    });

    allBox.replaceChildren();
    var done = tasks.filter(function (t) { return t.done; }).sort(byDate).reverse();
    block(allBox, 'Chưa xong (' + open.length + ')', open, true, 'Không còn việc nào đang chờ.');
    block(allBox, 'Đã xong (' + done.length + ')', done, true, 'Chưa có việc nào xong.');
    if (done.length) {
      var foot = el('div', 'bep-foot');
      foot.append(button('bep-clear', 'Xóa việc đã xong', function () { tasks = tasks.filter(function (t) { return !t.done; }); save(); render(); }));
      allBox.append(foot);
    }
  }

  /* Tab PLANNER: thẻ giới thiệu, lấy từ cây agent của Trạm Agent */
  (function () {
    var info = SITE.planning || {}, card = document.getElementById('khAbout');
    document.getElementById('khIntro').textContent = info.intro || '';
    var kids = (((SITE.basement || {}).agents || {}).tree || {}).children || [];
    var me = kids.filter(function (a) { return a.id === 'planner'; })[0];
    if (!me) return;
    var top = el('div', 'bep-top');
    var name = el('div');
    name.append(el('h2', '', me.name), el('p', 'bep-role', me.role));
    top.append(name);
    card.append(top);
    if (info.about) card.append(el('p', '', info.about));
    var ul = el('ul');
    (me.tasks || []).forEach(function (t) { ul.append(el('li', '', t)); });
    card.append(el('h3', '', 'PLANNER làm gì'), ul);
    if (me.status) card.append(el('p', 'bep-status', 'Trạng thái: ' + me.status));
  })();

  render();
  /* Sang ngày mới khi trang vẫn mở: vẽ lại để "hôm nay" đúng */
  document.addEventListener('visibilitychange', function () { if (!document.hidden) render(); });
})();
