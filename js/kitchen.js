/* Phòng Bếp: J.E.F.F gợi ý món, lên thực đơn tuần và tổng hợp danh sách đi chợ.
   Tủ lạnh: người dùng chọn nguyên liệu đang có.
   Gợi ý món: so nguyên liệu đã chọn với kho công thức trong data/recipes.js, không dùng AI.
   Hôm nay ăn gì: chọn ngẫu nhiên một món theo bữa và thời gian nấu.
   Thực đơn: xếp món vào 7 ngày, cộng dồn nguyên liệu theo số người ăn thành danh sách đi chợ.
   Mọi thứ lưu trên trình duyệt, không gửi đi đâu. */
(function () {
  'use strict';
  var K = window.KITCHEN || { groups: [], recipes: [], serves: 2 };
  var panel = document.getElementById('bepPanel');
  if (!panel) return;
  var KEY = 'xuong.bep.tulanh', PLAN_KEY = 'xuong.bep.thucdon';
  var MEALS = { sang: 'Sáng', trua: 'Trưa', toi: 'Tối' };
  var DAYS = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'];
  var BASE = K.serves || 2;

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
  var ITEMS = {}, RECIPES = {};
  K.groups.forEach(function (g) { g.items.forEach(function (i) { ITEMS[i.id] = i; }); });
  K.recipes.forEach(function (r) { RECIPES[r.id] = r; });
  function name(id) { return ITEMS[id].name; }
  function load(key) { try { return JSON.parse(localStorage.getItem(key)); } catch (e) { return null; } }
  function save(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* trình duyệt chặn lưu trữ: vẫn chạy, chỉ không nhớ */ } }

  /* Tủ lạnh: tập id nguyên liệu */
  var have = {};
  (load(KEY) || []).forEach(function (id) { if (ITEMS[id]) have[id] = true; });
  function missing(recipe) { return recipe.need.filter(function (id) { return !have[id]; }); }

  /* Thực đơn tuần: số người ăn, món của từng ngày, các dòng đã đánh dấu mua */
  var plan = { serves: BASE, days: DAYS.map(function () { return []; }), ticks: {} };
  (function () {
    var kept = load(PLAN_KEY);
    if (!kept || !Array.isArray(kept.days)) return;
    plan.serves = Math.min(10, Math.max(1, Number(kept.serves) || BASE));
    plan.days = DAYS.map(function (d, n) { return (kept.days[n] || []).filter(function (id) { return RECIPES[id]; }); });
    (kept.ticks || []).forEach(function (id) { if (ITEMS[id]) plan.ticks[id] = true; });
  })();
  function savePlan() { save(PLAN_KEY, { serves: plan.serves, days: plan.days, ticks: Object.keys(plan.ticks) }); }
  function dishCount() { return plan.days.reduce(function (sum, d) { return sum + d.length; }, 0); }

  /* Lượng nguyên liệu: gam làm tròn lên 50, đơn vị đếm làm tròn lên nửa đơn vị */
  function amount(n, unit) {
    if (unit === 'g') {
      var g = Math.ceil(n / 50 - 1e-9) * 50;
      return g >= 1000 ? String(g / 1000).replace('.', ',') + ' kg' : g + ' g';
    }
    return String(Math.ceil(n * 2 - 1e-9) / 2).replace('.', ',') + ' ' + unit;
  }
  function scaled(recipe, id) { return ((recipe.qty || {})[id] || 0) * plan.serves / BASE; }

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
  var cookTab = document.getElementById('bepTabCook'), planTab = document.getElementById('bepTabPlan');

  /* ---------- Tab Tủ lạnh ---------- */
  var fridge = document.getElementById('bepFridge');
  var summary = el('p', 'bep-note');
  fridge.append(el('p', 'bep-lead', 'Bấm chọn những thứ bạn đang có. J.E.F.F sẽ tìm món nấu được.'));
  K.groups.forEach(function (group) {
    fridge.append(el('h3', '', group.title));
    var row = el('div', 'bep-chips');
    group.items.forEach(function (item) {
      var chip = button('bep-chip', item.name, function () {
        if (have[item.id]) delete have[item.id]; else have[item.id] = true;
        chip.setAttribute('aria-pressed', have[item.id] ? 'true' : 'false');
        save(KEY, Object.keys(have));
        refresh();
      });
      chip.setAttribute('aria-pressed', have[item.id] ? 'true' : 'false');
      row.append(chip);
    });
    fridge.append(row);
  });
  var foot = el('div', 'bep-foot');
  foot.append(
    button('bep-go', 'Xem món nấu được', function () { show(cookTab); }),
    button('bep-clear', 'Bỏ chọn hết', function () {
      have = {};
      save(KEY, []);
      fridge.querySelectorAll('.bep-chip').forEach(function (c) { c.setAttribute('aria-pressed', 'false'); });
      refresh();
    })
  );
  fridge.append(summary, foot, el('p', 'bep-note', 'Gia vị coi như có sẵn: ' + K.pantry + '.'));

  /* ---------- Tab Gợi ý món ---------- */
  var cook = document.getElementById('bepCook');
  function select(label, options) {
    var s = el('select');
    s.setAttribute('aria-label', label);
    options.forEach(function (o) { var op = el('option', '', o[1]); op.value = o[0]; s.append(op); });
    return s;
  }
  var mealPick = select('Bữa ăn', [['', 'Bữa nào cũng được'], ['sang', 'Bữa sáng'], ['trua', 'Bữa trưa'], ['toi', 'Bữa tối']]);
  var timePick = select('Thời gian nấu', [['', 'Nấu bao lâu cũng được'], ['15', 'Trong 15 phút'], ['30', 'Trong 30 phút'], ['45', 'Trong 45 phút']]);
  var picked = el('div', 'bep-picked');
  picked.setAttribute('aria-live', 'polite');
  var filters = el('div', 'bep-filters');
  filters.append(mealPick, timePick);
  var listTitle = el('h3', '', 'Món nấu được');
  var list = el('div', 'bep-list');
  cook.append(filters, button('bep-go', 'Hôm nay ăn gì?', pick), picked, listTitle, list);

  function fits(recipe) {
    if (mealPick.value && recipe.meals.indexOf(mealPick.value) < 0) return false;
    if (timePick.value && recipe.minutes > Number(timePick.value)) return false;
    return true;
  }
  function meta(recipe) {
    return recipe.minutes + ' phút, ' + recipe.meals.map(function (m) { return MEALS[m].toLowerCase(); }).join(', ');
  }
  /* Phần chi tiết của một món: nguyên liệu theo số người ăn (đánh dấu thứ còn thiếu), cách làm, nút thêm vào thực đơn */
  function body(recipe) {
    var box = el('div', 'bep-body');
    var need = el('p', 'bep-need');
    need.append(el('strong', '', 'Nguyên liệu cho ' + plan.serves + ' người: '));
    recipe.need.forEach(function (id, n) {
      var q = scaled(recipe, id);
      need.append(el('span', have[id] ? 'has' : 'lacks', name(id) + (q ? ' ' + amount(q, ITEMS[id].unit) : '') + (have[id] ? '' : ' (thiếu)')));
      if (n < recipe.need.length - 1) need.append(', ');
    });
    need.append(', gia vị cơ bản.');
    var ol = el('ol');
    recipe.steps.forEach(function (s) { ol.append(el('li', '', s)); });
    var add = el('div', 'bep-add');
    var day = select('Ngày trong tuần', DAYS.map(function (d, n) { return [String(n), d]; }));
    var said = el('span', 'bep-said');
    said.setAttribute('aria-live', 'polite');
    add.append(day, button('bep-mini', 'Thêm vào thực đơn', function () {
      plan.days[Number(day.value)].push(recipe.id);
      savePlan();
      renderPlan();
      said.textContent = 'Đã thêm vào ' + DAYS[Number(day.value)] + '.';
    }), said);
    box.append(need, ol, add);
    return box;
  }
  function lackText(lack, lead) { return lead + ' ' + lack.map(function (id) { return name(id).toLowerCase(); }).join(', '); }
  function row(recipe) {
    var d = el('details', 'bep-dish');
    var s = el('summary');
    var lack = missing(recipe);
    s.append(el('span', 'bep-dish-name', recipe.name));
    s.append(el('span', lack.length ? 'bep-dish-lack' : 'bep-dish-ok', lack.length ? lackText(lack, 'Thiếu') : 'Đủ nguyên liệu'));
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
    card.append(el('p', lack.length ? 'bep-dish-lack' : 'bep-dish-ok', lack.length ? lackText(lack, 'Còn thiếu') + '.' : 'Bạn có đủ nguyên liệu.'));
    card.append(body(recipe));
    picked.append(card);
    document.dispatchEvent(new Event('tp:jeff'));
  }

  /* ---------- Tab Thực đơn ---------- */
  var planBox = document.getElementById('bepPlan');
  /* Cộng dồn nguyên liệu của cả tuần theo số người ăn */
  function totals() {
    var sum = {};
    plan.days.forEach(function (day) {
      day.forEach(function (id) {
        var r = RECIPES[id];
        r.need.forEach(function (item) { sum[item] = (sum[item] || 0) + scaled(r, item); });
      });
    });
    return sum;
  }
  function listText() {
    var sum = totals(), lines = ['Danh sách đi chợ (' + plan.serves + ' người, ' + dishCount() + ' món)'];
    K.groups.forEach(function (g) {
      var rows = g.items.filter(function (i) { return sum[i.id] && !have[i.id]; });
      if (!rows.length) return;
      lines.push('', g.title);
      rows.forEach(function (i) { lines.push('- ' + i.name + ': ' + amount(sum[i.id], i.unit)); });
    });
    return lines.join('\n');
  }
  function copy(text, done) {
    function fallback() {
      var area = el('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.append(area);
      area.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      area.remove();
      done(ok);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function () { done(true); }, fallback);
    else fallback();
  }
  /* J.E.F.F xếp giúp: mỗi ngày còn trống nhận hai món trưa hoặc tối, ưu tiên món chưa có trong tuần và món đủ nguyên liệu */
  function autoFill() {
    var used = {};
    plan.days.forEach(function (d) { d.forEach(function (id) { used[id] = true; }); });
    plan.days.forEach(function (day) {
      if (day.length) return;
      var pool = K.recipes.filter(function (r) { return r.meals.indexOf('trua') >= 0 || r.meals.indexOf('toi') >= 0; })
        .map(function (r) { return { r: r, k: (used[r.id] ? 4 : 0) + (missing(r).length ? 1 : 0) + Math.random() }; })
        .sort(function (a, b) { return a.k - b.k; });
      pool.slice(0, 2).forEach(function (p) { day.push(p.r.id); used[p.r.id] = true; });
    });
    savePlan();
    renderPlan();
    document.dispatchEvent(new Event('tp:jeff'));
  }

  function renderPlan(focusKey) {
    var count = dishCount();
    document.getElementById('bepPlanCount').textContent = count ? String(count) : '';
    planBox.replaceChildren();

    var people = el('div', 'bep-people');
    var minus = button('bep-step', '−', function () { plan.serves = Math.max(1, plan.serves - 1); savePlan(); refresh('minus'); });
    var plus = button('bep-step', '+', function () { plan.serves = Math.min(10, plan.serves + 1); savePlan(); refresh('plus'); });
    minus.setAttribute('aria-label', 'Bớt một người');
    plus.setAttribute('aria-label', 'Thêm một người');
    minus.dataset.key = 'minus';
    plus.dataset.key = 'plus';
    minus.disabled = plan.serves <= 1;
    plus.disabled = plan.serves >= 10;
    var num = el('strong', 'bep-num', String(plan.serves));
    num.setAttribute('aria-live', 'polite');
    people.append(el('span', '', 'Số người ăn'), minus, num, plus);
    var tools = el('div', 'bep-foot');
    tools.append(button('bep-go', 'J.E.F.F xếp giúp', autoFill));
    if (count) tools.append(button('bep-clear', 'Xóa thực đơn', function () {
      plan.days = DAYS.map(function () { return []; });
      plan.ticks = {};
      savePlan();
      renderPlan();
    }));
    planBox.append(people, tools, el('p', 'bep-note', 'J.E.F.F xếp hai món cho mỗi ngày còn trống. Ngày đã có món thì giữ nguyên.'));

    DAYS.forEach(function (dayName, n) {
      var box = el('div', 'bep-day');
      box.append(el('h3', '', dayName));
      var ul = el('ul');
      plan.days[n].forEach(function (id, k) {
        var li = el('li', '', RECIPES[id].name);
        var x = button('bep-x', '×', function () { plan.days[n].splice(k, 1); savePlan(); renderPlan('day' + n); });
        x.setAttribute('aria-label', 'Bỏ ' + RECIPES[id].name + ' khỏi ' + dayName);
        li.append(x);
        ul.append(li);
      });
      if (plan.days[n].length) box.append(ul);
      var add = select('Thêm món cho ' + dayName, [['', 'Thêm món...']].concat(K.recipes.map(function (r) { return [r.id, r.name]; })));
      add.dataset.key = 'day' + n;
      add.addEventListener('change', function () {
        if (!add.value) return;
        plan.days[n].push(add.value);
        savePlan();
        renderPlan('day' + n);
      });
      box.append(add);
      planBox.append(box);
    });

    /* Danh sách đi chợ */
    planBox.append(el('h3', 'bep-shop-title', 'Danh sách đi chợ'));
    if (!count) { planBox.append(el('p', 'bep-note', 'Thêm món vào thực đơn, J.E.F.F sẽ cộng dồn nguyên liệu cần mua.')); focus(focusKey); return; }
    var sum = totals(), owned = [], buying = 0;
    K.groups.forEach(function (g) {
      var rows = g.items.filter(function (i) { return sum[i.id]; });
      rows.filter(function (i) { return have[i.id]; }).forEach(function (i) { owned.push(i.name.toLowerCase()); });
      rows = rows.filter(function (i) { return !have[i.id]; });
      if (!rows.length) return;
      planBox.append(el('h4', 'bep-shop-group', g.title));
      var ul = el('ul', 'bep-shop');
      rows.forEach(function (i) {
        buying++;
        var label = el('label');
        var box = el('input');
        box.type = 'checkbox';
        box.checked = !!plan.ticks[i.id];
        box.addEventListener('change', function () {
          if (box.checked) plan.ticks[i.id] = true; else delete plan.ticks[i.id];
          savePlan();
        });
        label.append(box, el('span', 'bep-shop-name', i.name), el('span', 'bep-shop-qty', amount(sum[i.id], i.unit)));
        var li = el('li');
        li.append(label);
        ul.append(li);
      });
      planBox.append(ul);
    });
    if (!buying) planBox.append(el('p', 'bep-dish-ok', 'Tủ lạnh đã có đủ, không cần mua gì.'));
    if (owned.length) planBox.append(el('p', 'bep-note', 'Đã có trong tủ lạnh, không tính vào danh sách: ' + owned.join(', ') + '.'));
    planBox.append(el('p', 'bep-note', 'Lượng là số ước tính cho ' + plan.serves + ' người, đã làm tròn lên.'));
    var said = el('span', 'bep-said');
    said.setAttribute('aria-live', 'polite');
    var send = el('div', 'bep-foot');
    send.append(button('bep-go', 'Chép danh sách', function () {
      copy(listText(), function (ok) { said.textContent = ok ? 'Đã chép, dán vào Zalo hoặc ghi chú.' : 'Trình duyệt không cho chép. Hãy bôi đen danh sách để chép tay.'; });
    }), said);
    planBox.append(send);
    focus(focusKey);
  }
  /* Vẽ lại xong thì trả con trỏ bàn phím về đúng nút vừa bấm */
  function focus(key) {
    if (!key) return;
    var node = planBox.querySelector('[data-key="' + key + '"]');
    if (node && !node.disabled) node.focus();
  }

  function refresh(focusKey) {
    var n = Object.keys(have).length;
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
    renderPlan(focusKey);
  }
  mealPick.addEventListener('change', function () { refresh(); });
  timePick.addEventListener('change', function () { refresh(); });
  refresh();
  void planTab;
})();
