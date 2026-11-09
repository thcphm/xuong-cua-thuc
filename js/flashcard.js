/* Flashcard của Phòng Học: bốn ngôn ngữ, bộ từ có sẵn, bộ từ tự tạo, bốn cách luyện và lặp lại ngắt quãng. */
window.Flashcard = (function () {
  'use strict';
  const KEY = 'tp-flashcard-v1';
  const DAY = 864e5;
  const INTERVALS = [0, 1, 3, 7, 14, 30];
  const LEVELS = { 1: 'Rất dễ', 2: 'Dễ', 3: 'Trung bình', 4: 'Khó', 5: 'Rất khó' };
  const SPEECH = { en: 'en-US', zh: 'zh-CN', ko: 'ko-KR', ja: 'ja-JP' };
  const LANGS = {
    en: { name: 'Anh', flag: '<svg viewBox="0 0 32 32"><clipPath id="fa"><circle cx="16" cy="16" r="16"/></clipPath><g clip-path="url(#fa)"><rect width="32" height="32" fill="#fff"/><path d="M0 2h32v4H0zM0 10h32v4H0zM0 18h32v4H0zM0 26h32v4H0z" fill="#d22f3f"/><rect width="16" height="16" fill="#2c3f8f"/><circle cx="4" cy="4" r="1" fill="#fff"/><circle cx="10" cy="4" r="1" fill="#fff"/><circle cx="7" cy="8" r="1" fill="#fff"/><circle cx="4" cy="12" r="1" fill="#fff"/><circle cx="10" cy="12" r="1" fill="#fff"/></g></svg>' },
    zh: { name: 'Trung', flag: '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="#ee1c25"/><path fill="#ffde00" d="M10 6l1.6 4.8h5l-4 3 1.5 4.8-4.1-3-4.1 3 1.5-4.8-4-3h5z"/><circle cx="20" cy="7" r="1.4" fill="#ffde00"/><circle cx="23" cy="11" r="1.4" fill="#ffde00"/><circle cx="23" cy="16" r="1.4" fill="#ffde00"/><circle cx="20" cy="20" r="1.4" fill="#ffde00"/></svg>' },
    ko: { name: 'Hàn', flag: '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="15.5" fill="#fff" stroke="#e3e6ea"/><path fill="#cd2e3a" d="M9 16a7 7 0 0 1 14 0 3.5 3.5 0 0 1-7 0 3.5 3.5 0 0 0-7 0z"/><path fill="#0047a0" d="M9 16a7 7 0 0 0 14 0 3.5 3.5 0 0 1-7 0 3.5 3.5 0 0 0-7 0z"/><path stroke="#222" stroke-width="1.4" d="M5 9l3-4M7 11l3-4M22 5l3 4M24 7l3 4M5 23l3 4M7 21l3 4M22 27l3-4M24 25l3-4"/></svg>' },
    ja: { name: 'Nhật', flag: '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="15.5" fill="#fff" stroke="#e3e6ea"/><circle cx="16" cy="16" r="8" fill="#bc002d"/></svg>' }
  };
  const ICONS = {
    cap: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-4.5"/>',
    home: '<path d="M3 11l9-7 9 7"/><path d="M6 9.5V20h12V9.5"/><path d="M10 20v-6h4v6"/>',
    layers: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 12.5l9 5 9-5"/><path d="M3 16.5l9 5 9-5"/>',
    bolt: '<path d="M13 2L5 14h6l-1 8 8-12h-6z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    sound: '<path d="M4 10v4h4l5 4V6L8 10z"/><path d="M16.5 9a4 4 0 0 1 0 6"/>',
    right: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    caret: '<path d="M9 6l6 6-6 6"/>',
    down: '<path d="M6 9l6 6 6-6"/>',
    check: '<path d="M5 13l4 4L19 7"/>',
    back: '<path d="M19 12H5M11 6l-6 6 6 6"/>'
  };
  const icon = (name) => { const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('class', 'fc-i'); s.setAttribute('aria-hidden', 'true'); s.innerHTML = ICONS[name]; return s; };
  const flag = (lang) => { const n = document.createElement('span'); n.className = 'fc-flag'; n.innerHTML = LANGS[lang].flag; return n; };
  function h(tag, props, ...kids) {
    const n = document.createElement(tag);
    Object.entries(props || {}).forEach(([k, v]) => {
      if (v == null || v === false) return;
      if (k === 'class') n.className = v;
      else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
      else if (k in n && k !== 'list') n[k] = v;
      else n.setAttribute(k, v);
    });
    n.append(...kids.flat(2).filter((x) => x != null && x !== false));
    return n;
  }
  const shuffle = (list) => { const a = list.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const dayKey = (d = new Date()) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');

  let store = { lang: 'en', words: {}, custom: [], days: [], seconds: 0 };
  try { store = Object.assign(store, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { /* dùng tạm trong phiên */ }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) { /* bỏ qua */ } }

  /* Dòng "từ|nghĩa" hoặc "từ|phiên âm|nghĩa"; chấp nhận cả dấu tab và chấm phẩy */
  function parseLines(text) {
    return text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).map((l) => {
      const p = l.split(/\s*[|\t;]\s*/).map((x) => x.trim());
      if (p.length < 2 || !p[0] || !p[p.length - 1]) return null;
      return p.length === 2 ? { t: p[0], p: '', m: p[1] } : { t: p[0], p: p[1], m: p.slice(2).join(', ') };
    });
  }
  const builtIn = window.CARDS.map((d) => Object.assign({}, d, { id: d.lang + ':' + d.title, cards: parseLines(d.words) }));
  const allDecks = () => builtIn.concat(store.custom.map((d) => Object.assign({}, d, { mine: true })));
  const decksOf = (lang) => allDecks().filter((d) => d.lang === lang);
  const deckById = (id) => allDecks().find((d) => d.id === id);
  const wordKey = (deck, c) => deck.lang + '|' + c.t;
  const wordState = (deck, c) => store.words[wordKey(deck, c)];
  const learned = (deck) => deck.cards.filter((c) => { const s = wordState(deck, c); return s && s.box >= 1; }).length;
  const mastered = (deck) => deck.cards.filter((c) => { const s = wordState(deck, c); return s && s.box >= 3; }).length;
  const touched = (deck) => deck.cards.some((c) => wordState(deck, c));
  const finished = (deck) => deck.cards.length > 0 && learned(deck) === deck.cards.length;
  function dueCards() {
    const now = Date.now(), seen = new Set(), out = [];
    decksOf(store.lang).forEach((deck) => deck.cards.forEach((c) => {
      const k = wordKey(deck, c), s = store.words[k];
      if (s && s.due <= now && !seen.has(k)) { seen.add(k); out.push(c); }
    }));
    return out;
  }
  function mark(lang, c, right) {
    const k = lang + '|' + c.t, s = store.words[k] || { box: 0, due: 0 };
    s.box = right ? Math.min(5, s.box + 1) : Math.max(0, s.box - 1);
    s.due = Date.now() + INTERVALS[s.box] * DAY;
    store.words[k] = s;
    const d = dayKey();
    if (!store.days.includes(d)) store.days.push(d);
    save();
  }
  function streak() {
    const set = new Set(store.days), d = new Date();
    if (!set.has(dayKey(d))) d.setDate(d.getDate() - 1);
    let n = 0;
    while (set.has(dayKey(d))) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }
  function say(lang, text) {
    if (!window.speechSynthesis) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = SPEECH[lang];
    u.rate = 0.9;
    const v = speechSynthesis.getVoices().find((x) => x.lang.replace('_', '-').toLowerCase().startsWith(SPEECH[lang].slice(0, 2)));
    if (v) u.voice = v;
    speechSynthesis.speak(u);
  }
  const soundBtn = (lang, text) => h('button', { type: 'button', class: 'fc-sound', 'aria-label': 'Nghe phát âm ' + text, onclick: (e) => { e.stopPropagation(); say(lang, text); } }, icon('sound'));

  /* Khung ứng dụng */
  let root, main, langBox, searchInput, cleanup = null, studyId = 0;
  const view = { page: 'home', cat: 'Tất cả', q: '' };
  function leave() { if (cleanup) { cleanup(); cleanup = null; } if (window.speechSynthesis) speechSynthesis.cancel(); }
  function go(page, extra) { studyId++; leave(); Object.assign(view, { page }, extra); render(); root.scrollTop = 0; }

  function buildShell() {
    searchInput = h('input', { type: 'search', placeholder: 'Tìm bộ từ...', 'aria-label': 'Tìm bộ từ', oninput: () => { view.q = searchInput.value; if (view.page !== 'decks') go('decks'); else renderDeckGrid(); } });
    langBox = h('div', { class: 'fc-lang' });
    main = h('main', { class: 'fc-main' });
    root = h('div', { class: 'fc-root', hidden: true, role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Flashcard' },
      h('header', { class: 'fc-top' },
        h('button', { type: 'button', class: 'fc-logo', onclick: () => go('home') }, h('span', { class: 'fc-logo-i' }, icon('cap')), 'Flashcard'),
        h('nav', { class: 'fc-nav', id: 'fcNav', 'aria-label': 'Flashcard' }),
        h('div', { class: 'fc-right' }, h('label', { class: 'fc-search' }, icon('search'), searchInput, h('kbd', null, 'Ctrl K')), langBox,
          h('button', { type: 'button', class: 'fc-close', 'aria-label': 'Đóng Flashcard', onclick: close }, icon('close')))),
      main);
    document.body.append(root);
    document.addEventListener('keydown', (e) => {
      if (root.hidden) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); searchInput.focus(); }
      if (e.key === 'Escape' && !cleanup) close();
    });
    document.addEventListener('click', (e) => { if (!langBox.contains(e.target)) langBox.classList.remove('open'); });
  }
  function renderNav() {
    const items = [['home', 'Trang chủ', 'home'], ['decks', 'Bộ flashcard', 'layers'], ['practice', 'Luyện tập', 'bolt'], ['add', 'Thêm mới', 'plus']];
    root.querySelector('#fcNav').replaceChildren(...items.map(([p, label, ic]) => h('button', { type: 'button', class: view.page === p ? 'on' : '', 'aria-current': view.page === p ? 'page' : null, onclick: () => go(p, p === 'add' ? { editing: null } : {}) }, icon(ic), label)));
    const cur = LANGS[store.lang];
    langBox.replaceChildren(
      h('button', { type: 'button', class: 'fc-lang-btn', 'aria-haspopup': 'true', onclick: () => langBox.classList.toggle('open') }, flag(store.lang), cur.name, icon('down')),
      h('div', { class: 'fc-lang-menu' }, h('p', null, 'Ngôn ngữ đang học'), Object.keys(LANGS).map((l) => h('button', { type: 'button', class: l === store.lang ? 'on' : '', onclick: () => { store.lang = l; save(); langBox.classList.remove('open'); view.q = ''; searchInput.value = ''; view.cat = 'Tất cả'; go(view.page === 'deck' || view.page === 'study' ? 'home' : view.page); } }, flag(l), h('span', null, h('b', null, LANGS[l].name), h('small', null, decksOf(l).length + ' bộ từ')), l === store.lang ? icon('check') : null))));
  }
  function render() {
    renderNav();
    ({ home: renderHome, decks: renderDecks, practice: renderPractice, add: renderAdd, deck: renderDeck }[view.page] || renderHome)();
  }

  /* Thẻ bộ từ */
  function levelBadge(level) {
    return h('span', { class: 'fc-level l' + level }, h('i', { class: 'bars' }, [1, 2, 3, 4, 5].map((n) => h('b', { class: n <= level ? 'on' : '' }))), LEVELS[level]);
  }
  function deckCard(d) {
    const n = learned(d), total = d.cards.length;
    return h('button', { type: 'button', class: 'fc-deck', onclick: () => go('deck', { id: d.id }) },
      h('span', { class: 'fc-deck-title' }, d.title, d.mine ? h('em', null, 'Của bạn') : null),
      h('span', { class: 'fc-deck-count' }, icon('layers'), total + ' từ'),
      touched(d) ? h('span', { class: 'fc-prog' }, h('i', null, h('b', { style: 'width:' + (total ? n / total * 100 : 0) + '%' })), n + '/' + total + ' từ đã học') : null,
      levelBadge(d.level));
  }
  function renderHome() {
    const decks = decksOf(store.lang);
    const unique = new Map();
    decks.forEach((d) => d.cards.forEach((c) => unique.set(d.lang + '|' + c.t, c)));
    const total = unique.size, done = [...unique.keys()].filter((k) => store.words[k] && store.words[k].box >= 3).length;
    const cats = groupCats(decks);
    const fresh = decks.filter((d) => !finished(d)).slice(0, 6);
    const stat = (value, label, cls) => h('div', { class: 'fc-stat' }, h('b', { class: cls }, value), h('span', null, label));
    const link = (ic, title, text, page, cls) => h('button', { type: 'button', class: 'fc-action', onclick: () => go(page, page === 'add' ? { editing: null } : {}) }, h('span', { class: 'fc-action-i ' + cls }, icon(ic)), h('span', null, h('b', null, title), h('small', null, text)), icon('right'));
    const head = (title, page) => h('div', { class: 'fc-head' }, h('h2', null, title), h('button', { type: 'button', onclick: () => go(page, { cat: 'Tất cả' }) }, 'Xem tất cả', icon('caret')));
    main.replaceChildren(
      h('p', { class: 'fc-tag' }, 'Học nhanh, nhớ lâu với flashcard và phương pháp ôn tập chủ động.'),
      h('section', { class: 'fc-stats' },
        h('div', { class: 'fc-stat-row' }, stat(total, 'Tổng từ', 'c1'), stat(done, 'Đã thuộc', 'c2'), stat((total ? Math.round(done / total * 100) : 0) + '%', 'Tiến độ', 'c3'), stat(streak(), 'Chuỗi ngày', 'c4')),
        h('p', null, 'Đang học ' + decks.filter((d) => touched(d) && !finished(d)).length + ' bộ · Đã xong ' + decks.filter(finished).length + ' bộ · ' + Math.round(store.seconds / 60) + ' phút')),
      h('div', { class: 'fc-actions' }, link('layers', 'Bộ flashcard', 'Duyệt kho từ theo danh mục', 'decks', 'a1'), link('bolt', 'Luyện tập', 'Các bộ đang học và đã học', 'practice', 'a2'), link('plus', 'Thêm flashcard', 'Tạo bộ từ của riêng bạn', 'add', 'a3')),
      head('Danh mục', 'decks'),
      h('div', { class: 'fc-cats' }, cats.map(([name, list]) => h('button', { type: 'button', class: 'fc-cat', onclick: () => go('decks', { cat: name, q: '' }) }, h('span', { class: 'fc-action-i a1' }, icon('layers')), h('span', null, h('b', null, name), h('small', null, list.length + ' bộ')), icon('caret')))),
      fresh.length ? head('Bắt đầu với bộ này', 'decks') : null,
      fresh.length ? h('div', { class: 'fc-grid' }, fresh.map(deckCard)) : null
    );
    main.append(...[]);
  }
  function groupCats(decks) {
    const map = new Map();
    decks.forEach((d) => { if (!map.has(d.cat)) map.set(d.cat, []); map.get(d.cat).push(d); });
    return [...map.entries()];
  }
  let gridHolder = null;
  function renderDecks() {
    const decks = decksOf(store.lang), cats = ['Tất cả', ...groupCats(decks).map((c) => c[0])];
    if (!cats.includes(view.cat)) view.cat = 'Tất cả';
    const input = h('input', { type: 'search', value: view.q, placeholder: 'Tìm bộ từ...', 'aria-label': 'Tìm bộ từ', oninput: () => { view.q = input.value; searchInput.value = input.value; renderDeckGrid(); } });
    gridHolder = h('div');
    main.replaceChildren(
      h('label', { class: 'fc-wide-search' }, icon('search'), input),
      h('div', { class: 'fc-chips' }, cats.map((c) => h('button', { type: 'button', class: c === view.cat ? 'on' : '', 'aria-pressed': String(c === view.cat), onclick: () => { view.cat = c; render(); } }, c))),
      gridHolder);
    renderDeckGrid();
  }
  function renderDeckGrid() {
    if (!gridHolder) return;
    const q = view.q.trim().toLowerCase();
    const list = decksOf(store.lang).filter((d) => (view.cat === 'Tất cả' || d.cat === view.cat) && (!q || d.title.toLowerCase().includes(q) || d.cards.some((c) => (c.t + ' ' + c.m).toLowerCase().includes(q))));
    const groups = new Map();
    list.forEach((d) => { const name = d.sub ? d.cat + ' › ' + d.sub : d.cat; if (!groups.has(name)) groups.set(name, []); groups.get(name).push(d); });
    gridHolder.replaceChildren(...(groups.size ? [...groups.entries()].map(([name, ds]) => h('section', { class: 'fc-group' }, h('h2', null, name, h('small', null, ds.length + ' bộ')), h('div', { class: 'fc-grid' }, ds.map(deckCard)))) : [h('p', { class: 'fc-empty' }, 'Không có bộ từ nào khớp. Thử từ khác, hoặc tự tạo bộ mới.')]));
  }
  function renderPractice() {
    const decks = decksOf(store.lang), going = decks.filter((d) => touched(d) && !finished(d)), done = decks.filter(finished), due = dueCards();
    const section = (title, list) => list.length ? h('section', { class: 'fc-group' }, h('h2', null, title, h('small', null, list.length + ' bộ')), h('div', { class: 'fc-grid' }, list.map(deckCard))) : null;
    main.replaceChildren(
      h('section', { class: 'fc-due' }, h('div', null, h('h2', null, due.length ? due.length + ' từ đến hạn ôn' : 'Chưa có từ nào đến hạn ôn'), h('p', null, 'Từ nhớ tốt sẽ được hẹn ôn thưa dần: 1, 3, 7, 14, rồi 30 ngày.')),
        h('button', { type: 'button', class: 'fc-primary', disabled: !due.length, onclick: () => startStudy({ id: 'due', lang: store.lang, title: 'Ôn từ đến hạn', cards: due }, 'flip') }, 'Ôn ngay')),
      !going.length && !done.length ? h('p', { class: 'fc-empty' }, 'Bạn chưa học bộ nào. Mở một bộ trong mục Bộ flashcard để bắt đầu.') : null,
      section('Đang học', going), section('Đã học xong', done));
    [...main.childNodes].forEach((n) => { if (n.nodeType === 3) n.remove(); });
  }
  function renderDeck() {
    const d = deckById(view.id);
    if (!d) return go('decks');
    const modes = [['flip', 'Lật thẻ', 'Tự nhớ rồi lật để kiểm tra'], ['quiz', 'Trắc nghiệm', 'Chọn nghĩa đúng trong 4 đáp án'], ['type', 'Gõ từ', 'Nhìn nghĩa, gõ lại từ'], ['match', 'Ghép cặp', 'Nối từ với nghĩa thật nhanh']];
    main.replaceChildren(h('div', { class: 'fc-page' },
      h('button', { type: 'button', class: 'fc-back', onclick: () => go('decks') }, icon('back'), 'Bộ flashcard'),
      h('div', { class: 'fc-deck-head' }, h('h1', null, d.title), levelBadge(d.level)),
      h('p', { class: 'fc-sub' }, d.cards.length + ' từ · Đã học ' + learned(d) + ' · Đã thuộc ' + mastered(d)),
      d.mine ? h('p', { class: 'fc-own' }, h('button', { type: 'button', onclick: () => go('add', { editing: d.id }) }, 'Sửa bộ từ'), h('button', { type: 'button', onclick: () => { if (confirm('Xóa bộ "' + d.title + '"? Không khôi phục được.')) { store.custom = store.custom.filter((x) => x.id !== d.id); save(); go('decks'); } } }, 'Xóa bộ từ')) : null,
      h('div', { class: 'fc-modes' }, modes.map(([m, title, text]) => h('button', { type: 'button', class: 'fc-mode', onclick: () => startStudy(d, m) }, h('b', null, title), h('small', null, text)))),
      h('h2', { class: 'fc-list-h' }, 'Danh sách từ'),
      h('ul', { class: 'fc-words' }, d.cards.map((c) => { const s = wordState(d, c); return h('li', null, soundBtn(d.lang, c.t), h('span', { class: 'fc-w-t' }, c.t, c.p ? h('small', null, c.p) : null), h('span', { class: 'fc-w-m' }, c.m), h('span', { class: 'fc-w-s' + (s && s.box >= 3 ? ' good' : s && s.box >= 1 ? ' mid' : '') }, s && s.box >= 3 ? 'Đã thuộc' : s && s.box >= 1 ? 'Đang nhớ' : s ? 'Cần ôn' : 'Mới')); }))));
  }

  /* Tự tạo bộ từ */
  function renderAdd() {
    const editing = view.editing ? deckById(view.editing) : null;
    const name = h('input', { value: editing ? editing.title : '', maxLength: 80, required: true, placeholder: 'Ví dụ: Từ vựng tháng này' });
    const lang = h('select', null, Object.keys(LANGS).map((l) => h('option', { value: l }, LANGS[l].name)));
    lang.value = editing ? editing.lang : store.lang;
    const catList = 'fcCats';
    const cat = h('input', { value: editing ? editing.cat : 'Của tôi', maxLength: 40, list: catList });
    const level = h('select', null, Object.entries(LEVELS).map(([v, t]) => h('option', { value: v }, t)));
    level.value = String(editing ? editing.level : 2);
    const lines = h('textarea', { rows: 10, spellcheck: false, placeholder: 'apple | quả táo\n学校 | xuéxiào | trường học', value: editing ? editing.cards.map((c) => (c.p ? [c.t, c.p, c.m] : [c.t, c.m]).join(' | ')).join('\n') : '' });
    const note = h('p', { class: 'fc-note', role: 'status' });
    const count = () => { const p = parseLines(lines.value), bad = p.filter((x) => !x).length; note.textContent = p.length - bad + ' từ hợp lệ' + (bad ? ', ' + bad + ' dòng cần sửa: mỗi dòng cần có từ và nghĩa' : ''); note.classList.toggle('bad', !!bad); };
    lines.addEventListener('input', count);
    count();
    const file = h('input', { type: 'file', accept: '.csv,.txt,.tsv,text/plain', hidden: true, onchange: async () => { if (!file.files[0]) return; const text = await file.files[0].text(); lines.value = (lines.value ? lines.value.trim() + '\n' : '') + text.replace(/,/g, '|'); count(); } });
    const field = (label, control) => h('label', { class: 'fc-field' }, h('span', null, label), control);
    main.replaceChildren(h('form', { class: 'fc-form', onsubmit: (e) => {
      e.preventDefault();
      const parsed = parseLines(lines.value);
      if (!parsed.length || parsed.some((x) => !x)) { note.textContent = 'Cần ít nhất một từ, và mỗi dòng phải có từ và nghĩa.'; note.classList.add('bad'); lines.focus(); return; }
      const data = { lang: lang.value, cat: cat.value.trim() || 'Của tôi', title: name.value.trim(), level: Number(level.value), cards: parsed };
      let id;
      if (editing) { id = editing.id; Object.assign(store.custom.find((x) => x.id === id), data); }
      else { id = 'mine:' + Date.now().toString(36); store.custom.push(Object.assign({ id }, data)); }
      store.lang = data.lang;
      save();
      go('deck', { id });
    } },
      h('h1', null, editing ? 'Sửa bộ từ' : 'Thêm flashcard'),
      h('p', { class: 'fc-sub' }, 'Tạo bộ từ của riêng bạn, học được bằng cả bốn cách luyện. Bộ từ lưu trong trình duyệt này.'),
      h('div', { class: 'fc-form-grid' }, field('Tên bộ từ', name), field('Ngôn ngữ', lang), field('Danh mục', cat), field('Độ khó', level)),
      h('datalist', { id: catList }, [...new Set(allDecks().map((d) => d.cat))].map((c) => h('option', { value: c }))),
      field('Danh sách từ, mỗi dòng: từ | nghĩa, hoặc từ | phiên âm | nghĩa', lines),
      note,
      h('div', { class: 'fc-form-acts' }, h('button', { type: 'submit', class: 'fc-primary' }, editing ? 'Lưu thay đổi' : 'Tạo bộ từ'), h('button', { type: 'button', class: 'fc-ghost', onclick: () => file.click() }, 'Nhập từ tệp CSV'), file)));
  }

  /* Học */
  function startStudy(deck, mode) {
    leave();
    const sid = ++studyId;
    view.page = 'study';
    renderNav();
    root.scrollTop = 0;
    const started = Date.now();
    const finishTime = () => { store.seconds += Math.min(3600, Math.round((Date.now() - started) / 1000)); save(); };
    const again = new Map();
    const back = () => (deck.id === 'due' ? go('practice') : go('deck', { id: deck.id }));
    const frame = (progress, content) => main.replaceChildren(h('div', { class: 'fc-study' },
      h('div', { class: 'fc-study-top' }, h('button', { type: 'button', class: 'fc-back', onclick: () => { finishTime(); back(); } }, icon('back'), 'Thoát'), h('span', null, deck.title), h('span', { class: 'fc-count' }, progress[0] + '/' + progress[1])),
      h('div', { class: 'fc-bar' }, h('b', { style: 'width:' + (progress[1] ? progress[0] / progress[1] * 100 : 0) + '%' })),
      content));
    function result(right, total) {
      finishTime();
      leave();
      const missed = [...again.values()];
      main.replaceChildren(h('div', { class: 'fc-result' }, h('h1', null, right === total ? 'Làm tốt lắm!' : 'Xong một lượt'), h('p', { class: 'fc-score' }, right + '/' + total), h('p', { class: 'fc-sub' }, missed.length ? missed.length + ' từ cần ôn thêm.' : 'Bạn nhớ hết các từ trong lượt này.'),
        h('div', { class: 'fc-form-acts' }, missed.length ? h('button', { type: 'button', class: 'fc-primary', onclick: () => startStudy(Object.assign({}, deck, { cards: missed }), mode) }, 'Ôn lại từ sai') : null, h('button', { type: 'button', class: missed.length ? 'fc-ghost' : 'fc-primary', onclick: () => startStudy(deck, mode) }, 'Học lại'), h('button', { type: 'button', class: 'fc-ghost', onclick: back }, 'Về bộ từ'))));
      renderNav();
    }
    const record = (c, right) => { mark(deck.lang, c, right); if (right) again.delete(c.t); else again.set(c.t, c); };
    const order = shuffle(deck.cards);
    let i = 0, score = 0;
    const pool = () => decksOf(deck.lang).flatMap((d) => d.cards).concat(deck.cards);

    function flipCard() {
      if (i >= order.length) return result(score, order.length);
      const c = order[i];
      let shown = false;
      const inner = h('div', { class: 'fc-flip-inner' },
        h('div', { class: 'fc-face' }, h('p', { class: 'fc-term' }, c.t), c.p ? h('p', { class: 'fc-phon' }, c.p) : null, soundBtn(deck.lang, c.t), h('small', null, 'Bấm thẻ hoặc phím cách để lật')),
        h('div', { class: 'fc-face back' }, h('p', { class: 'fc-mean' }, c.m), h('p', { class: 'fc-phon' }, c.t + (c.p ? ' · ' + c.p : ''))));
      const card = h('button', { type: 'button', class: 'fc-flip', onclick: flip }, inner);
      function flip() { shown = !shown; card.classList.toggle('shown', shown); buttons.hidden = !shown; if (shown) say(deck.lang, c.t); }
      const answer = (right) => { record(c, right); if (right) score++; i++; flipCard(); };
      const buttons = h('div', { class: 'fc-answers', hidden: true }, h('button', { type: 'button', class: 'fc-no', onclick: () => answer(false) }, 'Chưa nhớ'), h('button', { type: 'button', class: 'fc-yes', onclick: () => answer(true) }, 'Đã nhớ'));
      frame([i, order.length], [card, buttons]);
      const onKey = (e) => {
        if (e.key === ' ') { e.preventDefault(); flip(); }
        if (shown && e.key === '1') answer(false);
        if (shown && e.key === '2') answer(true);
      };
      leave();
      document.addEventListener('keydown', onKey);
      cleanup = () => document.removeEventListener('keydown', onKey);
    }
    function quiz() {
      if (i >= order.length) return result(score, order.length);
      const c = order[i];
      const wrong = shuffle([...new Map(pool().filter((x) => x.m !== c.m).map((x) => [x.m, x])).values()]).slice(0, 3);
      const options = shuffle([c, ...wrong]);
      let locked = false;
      const pick = (o, node) => {
        if (locked) return;
        locked = true;
        const right = o.m === c.m;
        record(c, right);
        if (right) score++;
        node.classList.add(right ? 'right' : 'wrong');
        if (!right) [...box.children].find((b) => b.textContent === c.m).classList.add('right');
        say(deck.lang, c.t);
        setTimeout(() => { if (sid === studyId) { i++; quiz(); } }, right ? 650 : 1500);
      };
      const box = h('div', { class: 'fc-options' }, options.map((o) => { const b = h('button', { type: 'button', onclick: () => pick(o, b) }, o.m); return b; }));
      frame([i, order.length], [h('div', { class: 'fc-ask' }, h('p', { class: 'fc-term' }, c.t), c.p ? h('p', { class: 'fc-phon' }, c.p) : null, soundBtn(deck.lang, c.t)), box]);
    }
    const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[\s.?!,'’-]/g, '').toLowerCase();
    const answersOf = (c) => { const parts = c.p ? c.p.split(/\s+/) : []; return [c.t, c.p, ...parts, parts.slice(1).join(' ')].filter(Boolean).map(norm); };
    function typing() {
      if (i >= order.length) return result(score, order.length);
      const c = order[i];
      const input = h('input', { autocomplete: 'off', autocapitalize: 'off', spellcheck: false, 'aria-label': 'Gõ từ', placeholder: deck.lang === 'en' ? 'Gõ từ tiếng Anh' : 'Gõ chữ gốc hoặc phiên âm' });
      const msg = h('div', { class: 'fc-type-msg', role: 'status' });
      const go2 = h('button', { type: 'submit', class: 'fc-primary' }, 'Kiểm tra');
      let checked = false;
      const form = h('form', { class: 'fc-type', onsubmit: (e) => {
        e.preventDefault();
        if (checked) { i++; return typing(); }
        if (!input.value.trim()) return;
        checked = true;
        const right = answersOf(c).includes(norm(input.value));
        record(c, right);
        if (right) score++;
        input.readOnly = true;
        input.classList.add(right ? 'right' : 'wrong');
        msg.replaceChildren(h('b', { class: right ? 'ok' : 'no' }, right ? 'Chính xác' : 'Chưa đúng'), h('span', null, c.t + (c.p ? ' · ' + c.p : '')), soundBtn(deck.lang, c.t));
        go2.textContent = 'Từ tiếp theo';
        say(deck.lang, c.t);
      } }, input, go2);
      frame([i, order.length], [h('div', { class: 'fc-ask' }, h('p', { class: 'fc-mean' }, c.m)), form, msg]);
      input.focus();
    }
    function matching() {
      const groups = [];
      for (let k = 0; k < order.length; k += 6) groups.push(order.slice(k, k + 6));
      let g = 0, solved = 0;
      function board() {
        if (g >= groups.length) return result(score, order.length);
        const set = groups[g];
        const tiles = shuffle([...set.map((c) => ({ c, text: c.t, kind: 't' })), ...set.map((c) => ({ c, text: c.m, kind: 'm' }))]);
        let first = null, left = set.length;
        const missed = new Set();
        const grid = h('div', { class: 'fc-match' }, tiles.map((tile) => {
          const b = h('button', { type: 'button', onclick: () => {
            if (b.disabled) return;
            if (!first) { first = { tile, b }; b.classList.add('sel'); if (tile.kind === 't') say(deck.lang, tile.c.t); return; }
            if (first.b === b) { b.classList.remove('sel'); first = null; return; }
            const a = first; first = null;
            a.b.classList.remove('sel');
            if (a.tile.kind !== tile.kind && a.tile.c === tile.c) {
              a.b.disabled = b.disabled = true;
              a.b.classList.add('done'); b.classList.add('done');
              const ok = !missed.has(tile.c.t);
              record(tile.c, ok);
              if (ok) score++;
              solved++; left--;
              if (left === 0) { g++; setTimeout(() => { if (sid === studyId) board(); }, 350); }
              else frameCount();
            } else {
              [a, { tile, b }].forEach((x) => { missed.add(x.tile.c.t); x.b.classList.add('bad'); setTimeout(() => x.b.classList.remove('bad'), 380); });
            }
          } }, tile.text);
          return b;
        }));
        const counter = () => [solved, order.length];
        function frameCount() { const bar = main.querySelector('.fc-bar b'), n = main.querySelector('.fc-count'); bar.style.width = solved / order.length * 100 + '%'; n.textContent = solved + '/' + order.length; }
        frame(counter(), grid);
      }
      board();
    }
    ({ flip: flipCard, quiz, type: typing, match: matching })[mode]();
  }

  function open() {
    if (!root) buildShell();
    root.hidden = false;
    document.body.classList.add('fc-open');
    if (window.speechSynthesis) speechSynthesis.getVoices();
    view.page = 'home';
    render();
    root.querySelector('.fc-close').focus({ preventScroll: true });
  }
  function close() {
    studyId++;
    leave();
    root.hidden = true;
    document.body.classList.remove('fc-open');
  }
  /* Bộ thẻ cũ của ô Flashcard nhỏ được giữ lại thành một bộ từ riêng */
  function adopt(cards) {
    if (!cards || !cards.length || store.adopted) return;
    store.adopted = true;
    const own = cards.filter((c) => c.front && c.back).map((c) => ({ t: c.front, p: '', m: c.back }));
    if (own.length) store.custom.push({ id: 'mine:old', lang: 'en', cat: 'Của tôi', title: 'Thẻ cũ của tôi', level: 2, cards: own });
    save();
  }
  return { open, adopt };
})();
