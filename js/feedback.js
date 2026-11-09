/* Góp ý sau khi chơi game: gửi lên Firestore, chỉ admin đọc được. */
window.Feedback = (function () {
  'use strict';
  const LAST = 'tp-feedback-last', GAP = 30000;
  function h(tag, props, ...kids) {
    const n = document.createElement(tag);
    Object.entries(props || {}).forEach(([k, v]) => {
      if (v == null || v === false) return;
      if (k === 'class') n.className = v;
      else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
      else if (k in n) n[k] = v;
      else n.setAttribute(k, v);
    });
    n.append(...kids.filter((x) => x != null && x !== false));
    return n;
  }
  function open(game) {
    let stars = 0;
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    const close = () => { overlay.remove(); document.removeEventListener('keydown', onKey); };
    const row = h('div', { class: 'fb-stars', role: 'group', 'aria-label': 'Chấm điểm' });
    [1, 2, 3, 4, 5].forEach((n) => row.append(h('button', {
      type: 'button', 'aria-label': n + ' sao', 'aria-pressed': 'false',
      onclick: () => {
        stars = n;
        [...row.children].forEach((b, i) => { b.classList.toggle('on', i < n); b.setAttribute('aria-pressed', String(i + 1 === n)); });
      }
    }, '★')));
    const text = h('textarea', { rows: 5, maxLength: 2000, required: true, placeholder: 'Điều gì bạn thích? Điều gì nên sửa?', 'aria-label': 'Nội dung góp ý' });
    const name = window.Session.name ? null : h('input', { maxLength: 24, placeholder: 'Tên của bạn (không bắt buộc)', 'aria-label': 'Tên của bạn' });
    const msg = h('p', { class: 'gate-msg', role: 'status' });
    const send = h('button', { type: 'submit', class: 'gate-main' }, 'Gửi góp ý');
    const form = h('form', { onsubmit: async (e) => {
      e.preventDefault();
      if (!stars) { msg.textContent = 'Chọn số sao trước đã.'; return; }
      const content = text.value.trim();
      if (!content) { msg.textContent = 'Viết vài dòng góp ý nhé.'; text.focus(); return; }
      let last = 0;
      try { last = Number(localStorage.getItem(LAST)) || 0; } catch (x) { /* bỏ qua */ }
      if (Date.now() - last < GAP) { msg.textContent = 'Bạn vừa gửi góp ý. Đợi một lát rồi gửi tiếp nhé.'; return; }
      send.disabled = true;
      msg.textContent = '';
      try {
        const cloud = await window.Session.cloud();
        await cloud.sendFeedback({ game: game.id, stars, text: content, name: window.Session.name || (name ? name.value.trim() : '') });
        try { localStorage.setItem(LAST, String(Date.now())); } catch (x) { /* bỏ qua */ }
        form.replaceWith(h('p', { class: 'fb-done', role: 'status' }, 'Cảm ơn bạn đã góp ý.'));
        setTimeout(close, 1600);
      } catch (x) {
        msg.textContent = 'Chưa gửi được. Kiểm tra mạng rồi thử lại.';
        send.disabled = false;
      }
    } }, row, text, name, msg, send);
    const overlay = h('div', { class: 'gate', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Góp ý cho ' + game.title },
      h('div', { class: 'gate-card' }, h('h1', null, 'Góp ý cho ' + game.title), h('p', { class: 'gate-sub' }, 'Chơi xong rồi, bạn thấy thế nào?'), form,
        h('button', { type: 'button', class: 'gate-guest', onclick: close }, 'Để sau')));
    overlay.addEventListener('pointerdown', (e) => { if (e.target === overlay) close(); });
    document.addEventListener('keydown', onKey);
    document.body.append(overlay);
    text.focus();
  }
  return { open };
})();
