/* Phòng Bếp: J.E.F.F gợi ý món.
   Tủ lạnh: người dùng chọn nguyên liệu đang có, lưu trên trình duyệt.
   Gợi ý món: so nguyên liệu đã chọn với kho công thức trong data/recipes.js, không dùng AI.
   Hôm nay ăn gì: chọn ngẫu nhiên một món theo bữa và thời gian nấu. */
(function () {
  'use strict';
  var K = window.KITCHEN || { groups: [], recipes: [] };
  var panel = document.getElementById('bepPanel');
  if (!panel) return;
  var KEY = 'xuong.bep.tulanh';
  var MEALS = { sang: 'Sáng', trua: 'Trưa', toi: 'Tối' };

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }
  var NAMES = {};
  K.groups.forEach(function (g) { g.items.forEach(function (i) { NAMES[i.id] = i.name; }); });

  /* Tủ lạnh: tập id nguyên liệu. Trình duyệt chặn lưu trữ thì vẫn chạy, chỉ là không nhớ. */
  var have = {};
  try { (JSON.parse(localStorage.getItem(KEY)) || []).forEach(function (id) { if (NAMES[id]) have[id] = true; }); } catch (e) { /* bỏ qua */ }
  function remember() { try { localStorage.setItem(KEY, JSON.stringify(Object.keys(have))); } catch (e) { /* bỏ qua */ } }
  function haveCount() { return Object.keys(have).length; }
  function missing(recipe) { return recipe.need.filter(function (id) { return !have[id]; }); }

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

  /* Tab Tủ lạnh */
  var fridge = document.getElementById('bepFridge');
  var summary = el('p', 'bep-note');
  var toCook = el('button', 'bep-go', 'Xem món nấu được');
  toCook.type = 'button';
  toCook.addEventListener('click', function () { show(tabs[1]); });
  var clear = el('button', 'bep-clear', 'Bỏ chọn hết');
  clear.type = 'button';
  clear.addEventListener('click', function () {
    have = {};
    remember();
    fridge.querySelectorAll('.bep-chip').forEach(function (c) { c.setAttribute('aria-pressed', 'false'); });
    refresh();
  });
  fridge.append(el('p', 'bep-lead', 'Bấm chọn những thứ bạn đang có. J.E.F.F sẽ tìm món nấu được.'));
  K.groups.forEach(function (group) {
    fridge.append(el('h3', '', group.title));
    var row = el('div', 'bep-chips');
    group.items.forEach(function (item) {
      var chip = el('button', 'bep-chip', item.name);
      chip.type = 'button';
      chip.setAttribute('aria-pressed', have[item.id] ? 'true' : 'false');
      chip.addEventListener('click', function () {
        if (have[item.id]) delete have[item.id]; else have[item.id] = true;
        chip.setAttribute('aria-pressed', have[item.id] ? 'true' : 'false');
        remember();
        refresh();
      });
      row.append(chip);
    });
    fridge.append(row);
  });
  var foot = el('div', 'bep-foot');
  foot.append(toCook, clear);
  fridge.append(summary, foot, el('p', 'bep-note', 'Gia vị coi như có sẵn: ' + K.pantry + '.'));

  /* Tab Gợi ý món */
  var cook = document.getElementById('bepCook');
  var mealPick = el('select'), timePick = el('select');
  [['', 'Bữa nào cũng được'], ['sang', 'Bữa sáng'], ['trua', 'Bữa trưa'], ['toi', 'Bữa tối']].forEach(function (o) { var op = el('option', '', o[1]); op.value = o[0]; mealPick.append(op); });
  [['', 'Nấu bao lâu cũng được'], ['15', 'Trong 15 phút'], ['30', 'Trong 30 phút'], ['45', 'Trong 45 phút']].forEach(function (o) { var op = el('option', '', o[1]); op.value = o[0]; timePick.append(op); });
  mealPick.setAttribute('aria-label', 'Bữa ăn');
  timePick.setAttribute('aria-label', 'Thời gian nấu');
  var roll = el('button', 'bep-go', 'Hôm nay ăn gì?');
  roll.type = 'button';
  var picked = el('div', 'bep-picked');
  picked.setAttribute('aria-live', 'polite');
  var filters = el('div', 'bep-filters');
  filters.append(mealPick, timePick);
  var listTitle = el('h3', '', 'Món nấu được');
  var list = el('div', 'bep-list');
  cook.append(filters, roll, picked, listTitle, list);

  function fits(recipe) {
    if (mealPick.value && recipe.meals.indexOf(mealPick.value) < 0) return false;
    if (timePick.value && recipe.minutes > Number(timePick.value)) return false;
    return true;
  }
  function meta(recipe) {
    return recipe.minutes + ' phút, ' + recipe.meals.map(function (m) { return MEALS[m].toLowerCase(); }).join(', ');
  }
  /* Phần chi tiết của một món: nguyên liệu (đánh dấu thứ còn thiếu) và cách làm */
  function body(recipe) {
    var box = el('div', 'bep-body');
    var need = el('p', 'bep-need');
    need.append(el('strong', '', 'Nguyên liệu: '));
    recipe.need.forEach(function (id, n) {
      need.append(el('span', have[id] ? 'has' : 'lacks', NAMES[id] + (have[id] ? '' : ' (thiếu)')));
      if (n < recipe.need.length - 1) need.append(', ');
    });
    need.append(', gia vị cơ bản.');
    var ol = el('ol');
    recipe.steps.forEach(function (s) { ol.append(el('li', '', s)); });
    box.append(need, ol);
    return box;
  }
  function row(recipe) {
    var d = el('details', 'bep-dish');
    var s = el('summary');
    var lack = missing(recipe);
    s.append(el('span', 'bep-dish-name', recipe.name));
    s.append(el('span', lack.length ? 'bep-dish-lack' : 'bep-dish-ok', lack.length ? 'Thiếu ' + lack.map(function (id) { return NAMES[id].toLowerCase(); }).join(', ') : 'Đủ nguyên liệu'));
    s.append(el('span', 'bep-dish-meta', meta(recipe)));
    d.append(s, body(recipe));
    return d;
  }

  var last = '';
  function pick() {
    var pool = K.recipes.filter(fits);
    picked.replaceChildren();
    if (!pool.length) { picked.append(el('p', 'bep-note', 'Không có món nào hợp với bữa và thời gian đã chọn. Thử nới điều kiện ra.')); return; }
    /* Ưu tiên món đủ nguyên liệu, rồi tới món thiếu ít nhất */
    var best = Math.min.apply(null, pool.map(function (r) { return missing(r).length; }));
    var top = pool.filter(function (r) { return missing(r).length === best; });
    if (top.length > 1) top = top.filter(function (r) { return r.id !== last; });
    var recipe = top[Math.floor(Math.random() * top.length)];
    last = recipe.id;
    var lack = missing(recipe);
    var card = el('article', 'bep-pick');
    card.append(el('p', 'bep-pick-say', 'J.E.F.F chọn:'), el('h3', '', recipe.name), el('p', 'bep-dish-meta', meta(recipe)));
    card.append(el('p', lack.length ? 'bep-dish-lack' : 'bep-dish-ok', lack.length ? 'Còn thiếu ' + lack.map(function (id) { return NAMES[id].toLowerCase(); }).join(', ') + '.' : 'Bạn có đủ nguyên liệu.'));
    card.append(body(recipe));
    picked.append(card);
    document.dispatchEvent(new Event('tp:jeff'));
  }
  roll.addEventListener('click', pick);

  function refresh() {
    var n = haveCount();
    var ready = K.recipes.filter(function (r) { return !missing(r).length; }).length;
    summary.textContent = n ? 'Đã chọn ' + n + ' nguyên liệu, nấu được ' + ready + ' món.' : 'Chưa chọn nguyên liệu nào.';
    document.getElementById('bepCount').textContent = n ? String(ready) : '';
    /* Chưa chọn gì thì liệt kê cả kho. Đã chọn thì chỉ hiện món dùng tới ít nhất một thứ đang có. */
    var pool = K.recipes.filter(fits);
    if (n) pool = pool.filter(function (r) { return missing(r).length < r.need.length; });
    pool.sort(function (a, b) { return missing(a).length - missing(b).length || a.minutes - b.minutes; });
    listTitle.textContent = n ? 'Món nấu được từ tủ lạnh' : 'Tất cả món trong kho (' + pool.length + ')';
    list.replaceChildren();
    if (!pool.length) list.append(el('p', 'bep-note', n ? 'Chưa có món nào dùng tới nguyên liệu bạn chọn với điều kiện này.' : 'Không có món nào hợp điều kiện.'));
    pool.forEach(function (r) { list.append(row(r)); });
  }
  mealPick.addEventListener('change', refresh);
  timePick.addEventListener('change', refresh);
  refresh();
})();
