/* Tủ trưng bày ở Phòng Thực Nghiệm: bấm một tủ kính trong 3D thì máy quay lại gần và thẻ thông tin hiện ra.
   Dự án chia theo mảng, mỗi nhóm là một tủ. Nội dung lấy từ SITE.showcase. */
(function () {
  'use strict';
  var fields = (window.SITE.showcase && window.SITE.showcase.fields) || [];
  var panel = document.getElementById('hamPanel'), card = document.getElementById('hamCard'), back = document.getElementById('hamBack');
  if (!panel || !card) return;

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  /* Thứ tự tủ trong 3D trùng với thứ tự nhóm ở đây */
  var cabinets = [];
  fields.forEach(function (field) {
    field.groups.forEach(function (group) { cabinets.push({ field: field, group: group }); });
  });

  function show(i) {
    var slot = cabinets[i];
    if (!slot) return;
    var same = slot.field.title === slot.group.title;
    card.replaceChildren(el('h3', '', same ? slot.group.title : slot.field.title + ': ' + slot.group.title));
    var items = slot.group.items || [];
    if (!items.length) card.append(el('p', 'status', 'Tủ này còn trống.'));
    items.forEach(function (item) {
      var box = el('div', 'ham-item');
      box.append(el('h4', '', item.title), el('p', 'kind', item.kind));
      if (item.about) box.append(el('p', 'about', item.about));
      if (item.status) box.append(el('p', 'status', 'Trạng thái: ' + item.status));
      if (item.link) {
        var a = el('a', '', item.link.label);
        a.href = item.link.href;
        box.append(a);
      }
      card.append(box);
    });
    panel.hidden = false;
    panel.scrollTop = 0;
  }
  function close() {
    if (panel.hidden) return;
    panel.hidden = true;
    document.dispatchEvent(new Event('tp:exhibit-close'));
  }

  document.addEventListener('tp:exhibit', function (e) { show(e.detail); });
  back.addEventListener('click', close);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  /* Rời phòng thì cất thẻ */
  document.addEventListener('tp:go', function () { panel.hidden = true; });
})();
