/* Phòng Thực Nghiệm: thẻ thông tin hiện khi máy quay lại gần một khu.
   Tủ kính: dự án chia theo mảng, mỗi nhóm một tủ; bấm một sản phẩm để xem ảnh và tính năng.
   Nội dung lấy từ SITE.showcase và SITE.basement. */
(function () {
  'use strict';
  var fields = (window.SITE.showcase && window.SITE.showcase.fields) || [];
  var base = window.SITE.basement || {};
  var panel = document.getElementById('hamPanel'), card = document.getElementById('hamCard'), back = document.getElementById('hamBack');
  if (!panel || !card) return;

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }
  function para(parent, cls, text) { parent.append(el('p', cls, text)); }
  function link(parent, item) {
    if (!item.link) return;
    var a = el('a', '', item.link.label);
    a.href = item.link.href;
    /* Link ra trang ngoài mở ở thẻ mới, căn nhà vẫn giữ nguyên */
    if (/^https?:/.test(item.link.href)) { a.target = '_blank'; a.rel = 'noopener'; }
    parent.append(a);
  }

  /* Thứ tự tủ trong 3D trùng với thứ tự nhóm ở đây */
  var cabinets = [];
  fields.forEach(function (field) {
    field.groups.forEach(function (group) { cabinets.push({ field: field, group: group }); });
  });

  /* Ảnh phóng to */
  var zoom = el('div', 'ham-zoom');
  zoom.hidden = true;
  var zoomImg = el('img');
  zoom.append(zoomImg);
  zoom.addEventListener('click', function () { zoom.hidden = true; });
  document.body.append(zoom);

  function open(wide) {
    panel.classList.toggle('wide', !!wide);
    panel.hidden = false;
    panel.scrollTop = 0;
    document.body.classList.add('ham-open');
  }

  /* Các khu không phải tủ kính */
  var ZONES = {
    /* Cây phân cấp các bot agent: nhánh con thụt vào dưới nhánh cha */
    agents: function () {
      var t = base.agents || {};
      card.replaceChildren(el('h3', '', t.title), el('p', 'about', t.about));
      function node(a) {
        var box = el('div', 'ham-node');
        if (a.color) box.style.setProperty('--c', a.color);
        var head = el('h4', '', a.name);
        if (a.avatar) {
          var face = el('img', 'ham-face');
          face.src = a.avatar;
          face.alt = '';
          face.loading = 'lazy';
          head.prepend(face);
        }
        head.append(el('span', '', a.role));
        if (a.full) box.append(head, el('p', 'full', a.full + (a.note ? '. ' + a.note : '')));
        else box.append(head);
        if (a.tasks && a.tasks.length) {
          var ul = el('ul', 'ham-features');
          a.tasks.forEach(function (f) { ul.append(el('li', '', f)); });
          box.append(ul);
        }
        if (a.status) box.append(el('p', 'status', 'Trạng thái: ' + a.status));
        if (a.children && a.children.length) {
          var branch = el('div', 'ham-branch');
          a.children.forEach(function (kid) { branch.append(node(kid)); });
          box.append(branch);
        }
        return box;
      }
      if (t.tree) card.append(node(t.tree));
    },
    lab: function () {
      var t = base.lab || {};
      card.replaceChildren(el('h3', '', t.title), el('p', 'about', t.about));
      if (!(t.items || []).length) para(card, 'status', 'Bàn còn trống. Thử nghiệm mới sẽ được bày ở đây.');
      (t.items || []).forEach(function (item) {
        card.append(pick(item, function () {
          detail(item, 'Về ' + t.title, function () { ZONES.lab(); open(false); });
        }));
      });
    },
    road: function () {
      var t = base.roadmap || {};
      card.replaceChildren(el('h3', '', t.title));
      (t.columns || []).forEach(function (col) {
        var box = el('div', 'ham-item');
        box.append(el('h4', '', col.title));
        if (!col.items.length) para(box, 'status', 'Chưa có gì.');
        col.items.forEach(function (item) {
          para(box, 'road-line', item.title);
          if (item.about) para(box, 'status', item.about);
        });
        card.append(box);
      });
    }
  };

  /* Nút chọn một sản phẩm trong danh sách */
  function pick(item, run) {
    var b = el('button', 'ham-pick');
    b.type = 'button';
    if (item.images && item.images.length) {
      var thumb = el('img');
      thumb.src = item.images[0];
      thumb.alt = '';
      thumb.loading = 'lazy';
      b.append(thumb);
    }
    var text = el('span', 'ham-pick-text');
    text.append(el('strong', '', item.title));
    if (item.kind) text.append(el('span', '', item.kind));
    b.append(text);
    b.addEventListener('click', run);
    return b;
  }

  /* Danh sách sản phẩm trong một tủ */
  function showCabinet(i) {
    var slot = cabinets[i];
    if (!slot) return;
    var same = slot.field.title === slot.group.title;
    card.replaceChildren(el('h3', '', same ? slot.group.title : slot.field.title + ': ' + slot.group.title));
    var items = slot.group.items || [];
    para(card, 'status', items.length ? 'Bấm một sản phẩm để xem ảnh và tính năng.' : 'Tủ này còn trống.');
    items.forEach(function (item, n) {
      card.append(pick(item, function () { showProduct(i, n); }));
    });
    open(false);
  }

  function showProduct(i, n) {
    var slot = cabinets[i], item = slot && (slot.group.items || [])[n];
    if (!item) return;
    detail(item, 'Về tủ ' + slot.group.title, function () { showCabinet(i); });
  }

  /* Chi tiết một sản phẩm: ảnh, mô tả, tính năng */
  function detail(item, upText, goUp) {
    var up = el('button', 'ham-up', upText);
    up.type = 'button';
    up.addEventListener('click', goUp);
    card.replaceChildren(up, el('h3', '', item.title));
    if (item.kind) para(card, 'kind', item.kind);

    var images = item.images || [];
    if (images.length) {
      var main = el('button', 'ham-shot');
      main.type = 'button';
      main.setAttribute('aria-label', 'Phóng to ảnh');
      var img = el('img');
      img.src = images[0];
      img.alt = 'Ảnh chụp ' + item.title;
      main.append(img);
      main.addEventListener('click', function () { zoomImg.src = img.src; zoomImg.alt = img.alt; zoom.hidden = false; });
      card.append(main);
      if (images.length > 1) {
        var strip = el('div', 'ham-thumbs');
        images.forEach(function (src, k) {
          var t = el('button', '');
          t.type = 'button';
          t.setAttribute('aria-label', 'Ảnh ' + (k + 1));
          t.setAttribute('aria-pressed', k === 0 ? 'true' : 'false');
          var ti = el('img');
          ti.src = src;
          ti.alt = '';
          ti.loading = 'lazy';
          t.append(ti);
          t.addEventListener('click', function () {
            img.src = src;
            Array.prototype.forEach.call(strip.children, function (c) { c.setAttribute('aria-pressed', c === t ? 'true' : 'false'); });
          });
          strip.append(t);
        });
        card.append(strip);
      }
    }
    if (item.about) para(card, 'about', item.about);
    if (item.features && item.features.length) {
      card.append(el('h4', 'ham-sub', 'Tính năng'));
      var ul = el('ul', 'ham-features');
      item.features.forEach(function (f) { ul.append(el('li', '', f)); });
      card.append(ul);
    }
    if (item.tech) para(card, 'status', 'Công nghệ: ' + item.tech);
    if (item.status) para(card, 'status', 'Trạng thái: ' + item.status);
    link(card, item);
    open(true);
  }

  function close() {
    if (!zoom.hidden) { zoom.hidden = true; return; }
    if (panel.hidden) return;
    panel.hidden = true;
    document.body.classList.remove('ham-open');
    document.dispatchEvent(new Event('tp:exhibit-close'));
  }

  document.addEventListener('tp:exhibit', function (e) {
    if (ZONES[e.detail]) { ZONES[e.detail](); open(false); return; }
    showCabinet(e.detail);
  });
  /* Bấm thẳng vào một món trong tủ kính */
  document.addEventListener('tp:product', function (e) { showProduct(e.detail.cabinet, e.detail.item); });
  back.addEventListener('click', function () { zoom.hidden = true; close(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  /* Rời phòng thì cất thẻ */
  document.addEventListener('tp:go', function () { panel.hidden = true; zoom.hidden = true; document.body.classList.remove('ham-open'); });
})();
