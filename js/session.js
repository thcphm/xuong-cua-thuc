/* Phiên đăng nhập. Tài khoản và tiến độ nằm trên Firebase, trình duyệt giữ một bản để trang mở nhanh.
   Khách dùng được mọi phòng nhưng tiến độ mất khi tải lại trang.
   File này phải chạy trước mọi script khác vì nó quyết định tiến độ được lưu vào đâu. */
window.Session = (function () {
  'use strict';
  const CURRENT = 'tp-session-v2', OLD_ACCOUNTS = 'tp-accounts', OLD_SESSION = 'tp-session';
  const PROGRESS = ['tp-lab-v1', 'tp-san-v1', 'tp-vuon-v1', 'tp-flashcard-v1', 'nha-cua-tp.phong-hoc.v1', 'nha-cua-tp.guide.v1'];
  const FLUSH_MS = 8000, LIMIT = 900000;
  const proto = Storage.prototype;
  const raw = { get: proto.getItem, set: proto.setItem, remove: proto.removeItem };
  let box = null;
  try { box = window.localStorage; } catch (e) { /* trình duyệt chặn lưu */ }
  const read = (k) => { try { return raw.get.call(box, k); } catch (e) { return null; } };
  const write = (k, v) => { try { raw.set.call(box, k, v); return true; } catch (e) { return false; } };
  const erase = (k) => { try { raw.remove.call(box, k); } catch (e) { /* bỏ qua */ } };
  const keyOf = (name) => name.trim().normalize('NFC').toLocaleLowerCase('vi');
  const loadCloud = () => import('./cloud.js?v=20261110i');

  let user = null;
  try { user = JSON.parse(read(CURRENT) || 'null'); } catch (e) { /* phiên hỏng thì coi như chưa đăng nhập */ }
  const local = (k, uid = user.uid) => 'c:' + uid + ':' + k;
  const metaKey = (uid = user.uid) => 'c:' + uid + ':__at';
  const readMeta = (uid) => { try { return JSON.parse(read(metaKey(uid)) || '{}'); } catch (e) { return {}; } };
  const memory = new Map();
  const dirty = new Set();
  let flushTimer = 0, cloudRef = null;

  function markDirty(k) {
    const meta = readMeta();
    meta[k] = Date.now();
    write(metaKey(), JSON.stringify(meta));
    dirty.add(k);
    clearTimeout(flushTimer);
    flushTimer = setTimeout(flush, FLUSH_MS);
  }
  async function flush() {
    if (!user || !cloudRef || !dirty.size) return;
    const keys = [...dirty];
    dirty.clear();
    const meta = readMeta();
    await Promise.all(keys.map(async (k) => {
      const v = read(local(k));
      if (v == null || v.length > LIMIT) return;
      try { await cloudRef.writeOne(user.uid, k, v, meta[k] || Date.now()); }
      catch (e) { dirty.add(k); }
    }));
  }
  if (box) {
    proto.getItem = function (k) {
      if (this !== box || !PROGRESS.includes(k)) return raw.get.call(this, k);
      if (user) return raw.get.call(this, local(k));
      return memory.has(k) ? memory.get(k) : null;
    };
    proto.setItem = function (k, v) {
      if (this !== box || !PROGRESS.includes(k)) return raw.set.call(this, k, v);
      if (user) { raw.set.call(this, local(k), v); markDirty(k); return; }
      memory.set(k, String(v));
    };
    proto.removeItem = function (k) {
      if (this !== box || !PROGRESS.includes(k)) return raw.remove.call(this, k);
      if (user) return raw.remove.call(this, local(k));
      memory.delete(k);
    };
  }

  /* Gộp theo từng mục: bên nào lưu sau thì thắng */
  async function merge(cloud, uid) {
    const remote = await cloud.readAll(uid), meta = readMeta(uid);
    let changed = false;
    Object.entries(remote).forEach(([k, item]) => {
      if (!PROGRESS.includes(k)) return;
      if (read(local(k, uid)) == null || item.at > (meta[k] || 0)) {
        write(local(k, uid), item.v);
        meta[k] = item.at;
        changed = true;
      }
    });
    write(metaKey(uid), JSON.stringify(meta));
    const uploads = PROGRESS.filter((k) => read(local(k, uid)) != null && (!remote[k] || (meta[k] || 0) > remote[k].at));
    await Promise.all(uploads.map((k) => {
      const v = read(local(k, uid));
      if (v.length > LIMIT) return null;
      return cloud.writeOne(uid, k, v, meta[k] || Date.now()).catch(() => {});
    }));
    return changed;
  }
  /* Đưa tiến độ sẵn có trên máy này vào tài khoản: phần đang làm khi là khách, dữ liệu cũ, tài khoản cũ cùng tên */
  function adoptLocal(uid, key) {
    const meta = readMeta(uid), now = Date.now();
    PROGRESS.forEach((k) => {
      const oldAccount = read('u:' + key + ':' + k), legacy = read(k);
      const value = memory.has(k) ? memory.get(k) : oldAccount != null ? oldAccount : legacy;
      if (value != null && read(local(k, uid)) == null) { write(local(k, uid), value); meta[k] = now; }
      if (oldAccount != null) erase('u:' + key + ':' + k);
      if (legacy != null) erase(k);
    });
    write(metaKey(uid), JSON.stringify(meta));
    try {
      const list = JSON.parse(read(OLD_ACCOUNTS) || '{}');
      delete list[key];
      if (Object.keys(list).length) write(OLD_ACCOUNTS, JSON.stringify(list)); else erase(OLD_ACCOUNTS);
    } catch (e) { /* bỏ qua */ }
    erase(OLD_SESSION);
  }
  async function enter(cloud, info, key) {
    adoptLocal(info.uid, key);
    await merge(cloud, info.uid);
    write(CURRENT, JSON.stringify({ uid: info.uid, key, name: info.name }));
    location.reload();
  }
  const MESSAGES = {
    'auth/invalid-credential': 'Sai tên tài khoản hoặc mật khẩu.',
    'auth/wrong-password': 'Sai tên tài khoản hoặc mật khẩu.',
    'auth/user-not-found': 'Sai tên tài khoản hoặc mật khẩu.',
    'auth/email-already-in-use': 'Tên này đã có người dùng. Chọn tên khác hoặc đăng nhập.',
    'auth/weak-password': 'Mật khẩu cần ít nhất 6 ký tự.',
    'auth/too-many-requests': 'Thử sai quá nhiều lần. Đợi vài phút rồi thử lại.',
    'auth/network-request-failed': 'Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.',
    'tp/blocked': 'Tài khoản này đã bị khóa.'
  };
  const messageOf = (e) => MESSAGES[e && e.code] || 'Chưa đăng nhập được. Thử lại nhé.';
  function nameProblem(name) {
    const clean = name.trim();
    if (clean.length < 2 || clean.length > 24) return 'Tên tài khoản cần từ 2 đến 24 ký tự.';
    if (!/^[\p{L}\p{N}_ .-]+$/u.test(clean)) return 'Tên chỉ gồm chữ, số, dấu cách, dấu chấm, gạch nối.';
    return '';
  }
  async function login(name, password) {
    try {
      const cloud = await loadCloud(), key = keyOf(name);
      await enter(cloud, await cloud.signIn(key, password), key);
      return '';
    } catch (e) { return messageOf(e); }
  }
  async function register(name, password) {
    const problem = nameProblem(name);
    if (problem) return problem;
    if (password.length < 6) return 'Mật khẩu cần ít nhất 6 ký tự.';
    try {
      const cloud = await loadCloud(), key = keyOf(name), display = name.trim().normalize('NFC');
      await enter(cloud, await cloud.signUp(key, display, password), key);
      return '';
    } catch (e) { return messageOf(e); }
  }
  const clearSession = () => erase(CURRENT);
  async function logout() {
    try { await flush(); await (cloudRef || await loadCloud()).logOut(); } catch (e) { /* vẫn đăng xuất trên máy này */ }
    clearSession();
    location.reload();
  }

  /* Khung đăng nhập: chỉ mở khi người dùng bấm */
  let gate = null;
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
  function closeGate() {
    if (gate) gate.remove();
    gate = null;
    document.removeEventListener('keydown', onGateKey);
  }
  function onGateKey(e) { if (e.key === 'Escape') closeGate(); }
  function showGate(startMode) {
    if (gate) closeGate();
    let mode = 'login';
    const name = h('input', { autocomplete: 'username', maxLength: 24, required: true, spellcheck: false, id: 'gateName' });
    const pass = h('input', { type: 'password', autocomplete: 'current-password', maxLength: 128, required: true, id: 'gatePass' });
    const msg = h('p', { class: 'gate-msg', role: 'alert' });
    const submit = h('button', { type: 'submit', class: 'gate-main' }, 'Đăng nhập');
    const tabLogin = h('button', { type: 'button', class: 'on', onclick: () => setMode('login') }, 'Đăng nhập');
    const tabNew = h('button', { type: 'button', onclick: () => setMode('new') }, 'Tạo tài khoản');
    function setMode(m) {
      mode = m;
      tabLogin.classList.toggle('on', m === 'login');
      tabNew.classList.toggle('on', m === 'new');
      submit.textContent = m === 'login' ? 'Đăng nhập' : 'Tạo tài khoản';
      pass.autocomplete = m === 'login' ? 'current-password' : 'new-password';
      msg.textContent = '';
    }
    const form = h('form', { onsubmit: async (e) => {
      e.preventDefault();
      submit.disabled = true;
      msg.textContent = '';
      msg.textContent = await (mode === 'login' ? login : register)(name.value, pass.value);
      submit.disabled = false;
    } },
      h('label', { htmlFor: 'gateName' }, 'Tên tài khoản'), name,
      h('label', { htmlFor: 'gatePass' }, 'Mật khẩu'), pass,
      msg, submit);
    gate = h('div', { class: 'gate', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Đăng nhập' },
      h('div', { class: 'gate-card' },
        h('h1', null, 'Xưởng của Thức'),
        h('p', { class: 'gate-sub' }, 'Lưu tiến độ và dùng trên mọi máy.'),
        h('div', { class: 'gate-tabs' }, tabLogin, tabNew),
        form,
        h('button', { type: 'button', class: 'gate-guest', onclick: closeGate }, 'Để sau'),
        h('p', { class: 'gate-note' }, 'Tiến độ và nhật ký lưu trên máy chủ, chủ Xưởng có thể xem. Mật khẩu không lấy lại được, và đừng dùng mật khẩu của tài khoản quan trọng.')));
    gate.addEventListener('pointerdown', (e) => { if (e.target === gate) closeGate(); });
    document.addEventListener('keydown', onGateKey);
    document.body.append(gate);
    setMode(startMode === 'new' ? 'new' : 'login');
    name.focus();
  }
  const isAdmin = () => !!user && !!window.SITE && !!window.SITE.admin && keyOf(window.SITE.admin) === user.key;
  function paintBoxes() {
    document.querySelectorAll('[data-session]').forEach((node) => {
      node.replaceChildren(...(user ? [
        h('span', { class: 'session-name' }, user.name),
        isAdmin() ? h('button', { type: 'button', onclick: showAdmin }, 'Quản trị') : null,
        h('button', { type: 'button', onclick: logout }, 'Đăng xuất')
      ] : [
        h('button', { type: 'button', class: 'session-login', onclick: () => showGate('login') }, 'Đăng nhập'),
        h('button', { type: 'button', class: 'session-new', onclick: () => showGate('new') }, 'Đăng ký')
      ]).filter(Boolean));
    });
  }
  /* Quản trị: mọi thao tác đều qua luật Firestore, chỉ tài khoản admin mới được phép */
  async function showAdmin() {
    const cloud = cloudRef || await loadCloud();
    const rows = h('ul', { class: 'admin-list' }), notes = h('ul', { class: 'admin-list' });
    const status = h('p', { class: 'gate-sub', role: 'status' }, 'Đang tải danh sách tài khoản');
    const overlay = h('div', { class: 'gate', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Quản trị' },
      h('div', { class: 'gate-card' }, h('h1', null, 'Quản trị'), status, rows, h('h2', { class: 'admin-h' }, 'Góp ý về game'), notes,
        h('p', { class: 'gate-note' }, 'Muốn xóa hẳn một tài khoản, vào mục Authentication trong Firebase console.'),
        h('button', { type: 'button', class: 'gate-guest', onclick: () => overlay.remove() }, 'Đóng')));
    document.body.append(overlay);
    async function draw() {
      try {
        const list = await cloud.listUsers();
        status.textContent = list.length + ' tài khoản. Admin vào được mọi phòng, kể cả phòng đang khóa.';
        rows.replaceChildren(...list.map((u) => {
          const me = u.uid === user.uid;
          return h('li', null,
            h('div', null, h('b', null, u.name), h('small', null, (me ? 'Admin. ' : u.blocked ? 'Đang khóa. ' : '') + Math.ceil(u.size / 1024) + ' KB tiến độ')),
            h('button', { type: 'button', onclick: async () => { if (!confirm('Xóa toàn bộ tiến độ của ' + u.name + '? Không khôi phục được.')) return; await cloud.eraseProgress(u.uid); draw(); } }, 'Xóa tiến độ'),
            me ? null : h('button', { type: 'button', onclick: async () => { await cloud.setBlocked(u.uid, !u.blocked); draw(); } }, u.blocked ? 'Mở khóa' : 'Khóa tài khoản'));
        }));
      } catch (e) { status.textContent = 'Không lấy được danh sách. Máy chủ từ chối hoặc mất mạng.'; }
    }
    async function drawNotes() {
      try {
        const list = await cloud.listFeedback();
        if (!list.length) { notes.replaceChildren(h('li', null, h('small', null, 'Chưa có góp ý nào.'))); return; }
        notes.replaceChildren(...list.map((f) => h('li', null,
          h('div', null, h('b', null, f.game + ' · ' + '★'.repeat(f.stars)), h('small', null, (f.name || 'Khách') + (f.when ? ', ' + f.when : '')), h('p', { class: 'admin-text' }, f.text)),
          h('button', { type: 'button', onclick: async () => { if (!confirm('Xóa góp ý này?')) return; await cloud.deleteFeedback(f.id); drawNotes(); } }, 'Xóa'))));
      } catch (e) { notes.replaceChildren(h('li', null, h('small', null, 'Không lấy được góp ý.'))); }
    }
    draw();
    drawNotes();
  }
  addEventListener('DOMContentLoaded', paintBoxes);

  /* Đã đăng nhập: kiểm tra phiên và kéo tiến độ mới nhất từ máy khác */
  if (user) {
    loadCloud().then(async (cloud) => {
      cloudRef = cloud;
      if (cloud.currentUid() !== user.uid || await cloud.isBlocked(user.uid)) { clearSession(); location.reload(); return; }
      if (await merge(cloud, user.uid)) location.reload();
      if (dirty.size) { clearTimeout(flushTimer); flushTimer = setTimeout(flush, FLUSH_MS); }
    }).catch(() => { /* mất mạng: dùng bản trên máy, lần sau đồng bộ */ });
    addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });
  }

  return {
    get name() { return user ? user.name : ''; },
    get isAdmin() { return isAdmin(); },
    open: showGate,
    cloud: loadCloud
  };
})();
