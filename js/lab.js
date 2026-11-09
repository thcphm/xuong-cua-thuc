/* Phòng Công Nghệ: chọn ngôn ngữ, xem khóa học YouTube, làm bài có chấm tự động, project và link HackerRank, Hack The Box. */
window.Lab = (function () {
  'use strict';
  const DATA = window.LAB;
  const API = 'https://www.googleapis.com/youtube/v3/';
  const JSD = 'https://cdn.jsdelivr.net/';
  const CM = JSD + 'npm/codemirror@5.65.18/';
  const SQLJS = JSD + 'npm/sql.js@1.10.3/dist/';
  const PYODIDE = JSD + 'pyodide/v0.27.7/full/';
  const POINTS = { 'Dễ': 10, 'Trung bình': 20, 'Khó': 40 };
  const STEP_POINTS = 30;
  const TABS = [['courses', 'Khóa học'], ['practice', 'Thực hành'], ['project', 'Project'], ['w3', 'W3Schools'], ['hackerrank', 'HackerRank'], ['htb', 'Hack The Box']];
  /* Mục lục của từng ngôn ngữ trong data/w3.js */
  const W3_BOOKS = { web: ['html', 'css'], js: ['js'], python: ['python'], c: ['c'], cpp: ['cpp'], csharp: ['cs'], java: ['java'], sql: ['sql'], security: ['cybersecurity'] };
  const KEY = 'tp-lab-v1';

  const $ = (id) => document.getElementById(id);
  function h(tag, props, ...kids) {
    const node = document.createElement(tag);
    Object.entries(props || {}).forEach(([k, v]) => {
      if (v == null || v === false) return;
      if (k === 'class') node.className = v;
      else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
      else if (k in node && k !== 'list' && k !== 'form') node[k] = v;
      else node.setAttribute(k, v);
    });
    node.append(...kids.flat().filter((x) => x != null && x !== false));
    return node;
  }
  /* Văn bản bài học: \n\n tách đoạn, `...` là mã */
  function prose(text) {
    return text.split('\n\n').map((para) => h('p', null, para.split(/(`[^`]+`)/).map((part) =>
      part.charAt(0) === '`' ? h('code', null, part.slice(1, -1)) : part)));
  }

  /* Tiến độ lưu trong trình duyệt */
  let store = { solved: {}, code: {}, watched: {}, track: 'python', tab: 'courses' };
  try { store = Object.assign(store, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { /* trình duyệt chặn lưu thì dùng tạm trong phiên */ }
  let saveTimer = 0;
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) { /* bỏ qua */ } }, 200);
  }

  const track = () => DATA.tracks.find((t) => t.id === store.track) || DATA.tracks[0];
  const items = (t) => (t.runner === 'stdio' ? DATA.shared.concat(t.own) : t.items);
  const itemKey = (t, item) => t.id + ':' + item.id;
  const stepKey = (t, i) => t.id + ':project:' + i;
  const isSolved = (key) => Object.prototype.hasOwnProperty.call(store.solved, key);
  function counts(t) {
    const keys = items(t).map((i) => itemKey(t, i)).concat(t.project.steps.map((s, i) => stepKey(t, i)));
    return { done: keys.filter(isSolved).length, all: keys.length };
  }
  function renderScore() {
    const pts = Object.values(store.solved).reduce((a, b) => a + b, 0);
    $('labScore').textContent = pts + ' điểm, ' + Object.keys(store.solved).length + ' bài đã xong';
  }
  function award(key, pts) {
    if (isSolved(key)) return false;
    store.solved[key] = pts;
    save();
    renderScore();
    renderLangs();
    document.dispatchEvent(new CustomEvent('tp:lab-solved', { detail: pts }));
    return true;
  }

  /* Trình chạy trong Web Worker, chạy quá giờ thì dừng hẳn */
  class Sandbox {
    constructor(source) { this.source = source; this.ready = null; this.worker = null; }
    boot() {
      if (this.ready) return this.ready;
      this.ready = new Promise((resolve, reject) => {
        const url = URL.createObjectURL(new Blob([this.source], { type: 'text/javascript' }));
        const w = new Worker(url);
        setTimeout(() => URL.revokeObjectURL(url), 10000);
        const fail = (msg) => { w.terminate(); reject(new Error(msg)); };
        const limit = setTimeout(() => fail('Tải trình chạy quá lâu'), 120000);
        w.onerror = () => { clearTimeout(limit); fail('Không tải được trình chạy'); };
        w.onmessage = (e) => {
          clearTimeout(limit);
          if (e.data.ready) { this.worker = w; resolve(w); } else fail(e.data.fail || 'Không tải được trình chạy');
        };
      });
      this.ready.catch(() => { this.ready = null; });
      return this.ready;
    }
    async run(msg, ms) {
      const w = await this.boot();
      return new Promise((resolve) => {
        const limit = setTimeout(() => { w.terminate(); this.ready = null; resolve({ timeout: true }); }, ms);
        w.onerror = (e) => { clearTimeout(limit); w.terminate(); this.ready = null; resolve({ err: e.message || 'Lỗi khi chạy', failed: true }); };
        w.onmessage = (e) => { clearTimeout(limit); resolve(e.data); };
        w.postMessage(msg);
      });
    }
  }

  const jsBox = new Sandbox(`
    postMessage({ ready: true });
    onmessage = function (e) {
      var out = '', err = '', lines = e.data.stdin.split('\\n'), at = 0;
      if (lines[lines.length - 1] === '') lines.pop();
      var show = function (v) { return typeof v === 'string' ? v : (function () { try { return JSON.stringify(v); } catch (x) { return String(v); } })(); };
      var con = { log: function () { out += Array.prototype.map.call(arguments, show).join(' ') + '\\n'; }, error: function () { err += Array.prototype.map.call(arguments, show).join(' ') + '\\n'; } };
      con.info = con.log; con.warn = con.error;
      var readLine = function () { return at < lines.length ? lines[at++] : null; };
      try { new Function('console', 'readLine', e.data.code)(con, readLine); }
      catch (x) { err += x.name + ': ' + x.message + '\\n'; postMessage({ out: out, err: err, failed: true }); return; }
      postMessage({ out: out, err: err });
    };`);

  const pyBox = new Sandbox(`
    importScripts('${PYODIDE}pyodide.js');
    var py;
    loadPyodide({ indexURL: '${PYODIDE}' }).then(function (p) { py = p; postMessage({ ready: true }); }, function (e) { postMessage({ fail: String(e) }); });
    onmessage = function (e) {
      var out = '', err = '', dec = new TextDecoder(), given = false;
      py.setStdout({ write: function (b) { out += dec.decode(b); return b.length; } });
      py.setStderr({ write: function (b) { err += dec.decode(b); return b.length; } });
      py.setStdin({ stdin: function () { if (given) return null; given = true; return e.data.stdin || null; } });
      var scope = py.toPy({ __name__: '__main__' });
      try {
        py.runPython('import sys, io\\nsys.stdin = io.TextIOWrapper(io.FileIO(0, closefd=False))');
        py.runPython(e.data.code, { globals: scope });
        postMessage({ out: out, err: err });
      } catch (x) {
        var msg = String(x.message || x).split('\\n').filter(function (l) { return !/lib.python|_pyodide|[\\^]{3}|[.]run[(]globals|coroutine = eval/.test(l); }).join('\\n');
        postMessage({ out: out, err: err + msg, failed: true });
      } finally { scope.destroy(); }
    };`);

  const sqlBox = new Sandbox(`
    importScripts('${SQLJS}sql-wasm.js');
    var SQL;
    initSqlJs({ locateFile: function (f) { return '${SQLJS}' + f; } }).then(function (s) { SQL = s; postMessage({ ready: true }); }, function (e) { postMessage({ fail: String(e) }); });
    onmessage = function (e) {
      var db = new SQL.Database();
      try {
        db.run(e.data.schema);
        var res = e.data.sql.map(function (q) { var r = db.exec(q); return r.length ? r[r.length - 1] : { columns: [], values: [] }; });
        postMessage({ res: res });
      } catch (x) { postMessage({ err: x.message }); }
      finally { db.close(); }
    };`);

  async function remote(t, code, stdin) {
    const ctrl = new AbortController();
    const limit = setTimeout(() => ctrl.abort(), 45000);
    try {
      const res = await fetch('https://wandbox.org/api/compile.json', {
        method: 'POST', signal: ctrl.signal, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ compiler: t.compiler, code: code.replace(/public\s+class\s+Main\b/, 'class Main'), stdin: stdin, options: '', 'compiler-option-raw': t.options || '' })
      });
      if (!res.ok) return { net: 'Máy biên dịch trả về lỗi ' + res.status + '. Thử lại sau ít phút.' };
      const r = await res.json();
      const failed = String(r.status) !== '0' || !!r.signal;
      if (failed && !r.program_message && r.compiler_error) return { compile: r.compiler_error };
      if (r.signal === 'Killed' || r.signal === 'CPU time limit exceeded') return { timeout: true };
      return { out: r.program_output || '', err: r.program_error || '', failed: failed };
    } catch (e) {
      return { net: e.name === 'AbortError' ? 'Máy biên dịch không phản hồi. Thử lại sau.' : 'Không kết nối được máy biên dịch.' };
    } finally { clearTimeout(limit); }
  }
  function runStdio(t, code, stdin) {
    const input = stdin.endsWith('\n') ? stdin : stdin + '\n';
    if (t.engine === 'js') return jsBox.run({ code: code, stdin: input }, 5000);
    if (t.engine === 'python') return pyBox.run({ code: code, stdin: input }, 10000);
    return remote(t, code, input);
  }
  const clean = (s) => String(s).replace(/\r/g, '').split('\n').map((l) => l.replace(/\s+$/, '')).join('\n').replace(/\n+$/, '');

  /* Trình soạn mã */
  let editorLoad = null;
  function script(src) {
    return new Promise((resolve, reject) => { document.head.append(h('script', { src: src, onload: resolve, onerror: reject })); });
  }
  function loadEditor() {
    if (editorLoad) return editorLoad;
    document.head.append(h('link', { rel: 'stylesheet', href: CM + 'lib/codemirror.css' }));
    editorLoad = (async () => {
      await script(CM + 'lib/codemirror.js');
      await Promise.all(['xml/xml', 'javascript/javascript', 'css/css', 'clike/clike', 'python/python', 'sql/sql'].map((m) => script(CM + 'mode/' + m + '.js')));
      await script(CM + 'mode/htmlmixed/htmlmixed.js');
    })().catch(() => { /* không tải được thì dùng ô chữ thường */ });
    return editorLoad;
  }
  function makeEditor(host, mode, value, onChange) {
    if (window.CodeMirror && window.CodeMirror.modes) {
      const cm = window.CodeMirror(host, {
        value: value, mode: mode, lineNumbers: true, indentUnit: 4, tabSize: 4, indentWithTabs: false, viewportMargin: Infinity, theme: 'tp',
        screenReaderLabel: 'Ô viết mã',
        extraKeys: {
          Tab: (c) => (c.somethingSelected() ? c.indentSelection('add') : c.replaceSelection(' '.repeat(c.getOption('indentUnit')))),
          'Shift-Tab': (c) => c.indentSelection('subtract'),
          Esc: (c) => c.getInputField().blur()
        }
      });
      cm.on('change', () => onChange(cm.getValue()));
      setTimeout(() => cm.refresh(), 30);
      /* Mở bài khi phòng còn ẩn thì phải đo lại lúc hiện ra */
      new IntersectionObserver((seen, watcher) => { if (seen[0].isIntersecting) { cm.refresh(); watcher.disconnect(); } }).observe(host);
      return { get: () => cm.getValue(), set: (v) => cm.setValue(v) };
    }
    const area = h('textarea', { class: 'lab-plain', spellcheck: false, value: value, 'aria-label': 'Ô viết mã', oninput: () => onChange(area.value) });
    host.append(area);
    return { get: () => area.value, set: (v) => { area.value = v; } };
  }

  /* Khung trang */
  let body;
  const view = { open: null, list: false, token: 0, level: 'Tất cả', extra: {}, course: {}, w3: '' };

  function renderLangs() {
    $('labLangs').replaceChildren(...DATA.tracks.map((t) => {
      const c = counts(t);
      return h('button', {
        type: 'button', class: 'lab-lang' + (t.id === store.track ? ' on' : ''), 'aria-pressed': String(t.id === store.track),
        onclick: () => { store.track = t.id; view.open = null; view.list = false; save(); renderAll(); }
      }, h('span', { class: 'lab-lang-name' }, t.name), h('span', { class: 'lab-lang-count' }, c.done + '/' + c.all));
    }));
  }
  function renderTabs() {
    $('labTabs').replaceChildren(...TABS.map(([id, name]) => h('button', {
      type: 'button', class: 'lab-tab' + (id === store.tab ? ' on' : ''), 'aria-pressed': String(id === store.tab),
      onclick: () => { store.tab = id; view.open = null; view.list = false; save(); renderAll(); }
    }, name)));
  }
  function renderAll() {
    renderLangs();
    renderTabs();
    renderBody();
  }
  function renderBody() {
    const t = track();
    view.token++;
    if (view.open) return view.open();
    ({ courses: renderCourses, practice: renderPractice, project: renderProject, w3: renderW3, hackerrank: renderHackerRank, htb: renderHtb }[store.tab] || renderCourses)(t);
  }

  /* Khóa học từ YouTube */
  function ytKey() { return (window.SITE.music && window.SITE.music.apiKey) || ''; }
  async function ytGet(path, params, days) {
    const cacheKey = 'tp-lab-yt:' + path + ':' + JSON.stringify(params);
    try {
      const hit = JSON.parse(localStorage.getItem(cacheKey) || 'null');
      if (hit && hit.until > Date.now()) return hit.data;
    } catch (e) { /* không có bộ nhớ đệm thì gọi mạng */ }
    const query = new URLSearchParams(Object.assign({}, params, { key: ytKey() }));
    const res = await fetch(API + path + '?' + query);
    if (!res.ok) throw new Error('youtube ' + res.status);
    const data = await res.json();
    try { localStorage.setItem(cacheKey, JSON.stringify({ until: Date.now() + days * 864e5, data: data })); } catch (e) { /* đầy bộ nhớ thì thôi */ }
    return data;
  }
  function stopLesson() {
    const stage = document.querySelector('.lab-stage iframe');
    if (stage) stage.remove();
  }
  function embed(stage, src, title) {
    stage.replaceChildren(h('iframe', { src: src, title: title, allow: 'autoplay; encrypted-media; picture-in-picture', allowFullscreen: true, referrerPolicy: 'strict-origin-when-cross-origin' }));
  }
  function renderCourses(t) {
    const list = t.courses.concat(view.extra[t.id] || []);
    const chosen = list.find((c) => c.id === view.course[t.id]) || list[0];
    const stage = h('div', { class: 'lab-stage' });
    const now = h('p', { class: 'lab-now' }, chosen.title);
    const lessons = h('ol', { class: 'lab-lessons' });
    const more = h('button', { type: 'button', class: 'ghost-btn lab-more', hidden: true }, 'Xem thêm bài');
    const status = h('p', { class: 'lab-wait', role: 'status' }, 'Đang lấy danh sách bài từ YouTube');

    const seen = (id) => !!store.watched[id];
    function play(v, row, auto) {
      if (auto && window.Music && window.Music.pause) window.Music.pause();
      embed(stage, 'https://www.youtube-nocookie.com/embed/' + v.id + '?rel=0&modestbranding=1' + (auto ? '&autoplay=1' : ''), v.title);
      now.textContent = v.title;
      lessons.querySelectorAll('.current').forEach((n) => n.classList.remove('current'));
      row.classList.add('current');
      if (auto && !seen(v.id)) { store.watched[v.id] = 1; save(); row.classList.add('seen'); }
    }
    let token = '', opened = false;
    async function loadPage() {
      more.hidden = true;
      status.hidden = false;
      try {
        if (!ytKey()) throw new Error('no key');
        const params = { part: 'snippet', maxResults: 50, playlistId: chosen.id };
        if (token) params.pageToken = token;
        const data = await ytGet('playlistItems', params, 3);
        status.hidden = true;
        data.items.filter((i) => i.snippet.resourceId && !/^(Private|Deleted) video$/.test(i.snippet.title)).forEach((i) => {
          const v = { id: i.snippet.resourceId.videoId, title: i.snippet.title };
          const row = h('li', { class: seen(v.id) ? 'seen' : '' });
          row.append(h('button', { type: 'button', onclick: () => play(v, row, true) },
            h('img', { src: 'https://i.ytimg.com/vi/' + v.id + '/mqdefault.jpg', alt: '', loading: 'lazy', width: 96, height: 54 }),
            h('span', null, v.title)));
          lessons.append(row);
          if (!opened && !seen(v.id)) { opened = true; play(v, row, false); row.scrollIntoView({ block: 'nearest' }); }
        });
        token = data.nextPageToken || '';
        more.hidden = !token;
      } catch (e) {
        status.textContent = 'Không lấy được danh sách bài. Khung bên cạnh vẫn phát cả khóa, dùng nút danh sách trong video.';
        embed(stage, 'https://www.youtube-nocookie.com/embed/videoseries?list=' + chosen.id + '&rel=0', chosen.title);
      }
    }
    more.addEventListener('click', loadPage);

    const input = h('input', { type: 'search', placeholder: 'Tìm khóa ' + t.name + ' khác trên YouTube', 'aria-label': 'Tìm khóa học trên YouTube', maxLength: 80 });
    const note = h('span', { class: 'lab-wait', role: 'status' });
    const form = h('form', {
      class: 'lab-search', onsubmit: async (e) => {
        e.preventDefault();
        const q = input.value.trim();
        if (!q) return;
        note.textContent = 'Đang tìm';
        try {
          const text = q.toLowerCase().indexOf(t.name.toLowerCase()) >= 0 ? q : t.name + ' ' + q;
          const data = await ytGet('search', { part: 'snippet', type: 'playlist', maxResults: 8, q: text }, 1);
          view.extra[t.id] = data.items.map((i) => ({ id: i.id.playlistId, title: i.snippet.title, channel: i.snippet.channelTitle, found: true }));
          if (view.extra[t.id].length) view.course[t.id] = view.extra[t.id][0].id;
          renderBody();
        } catch (x) { note.textContent = 'Chưa tìm được. YouTube giới hạn số lượt tìm mỗi ngày, thử lại sau.'; }
      }
    }, input, h('button', { type: 'submit', class: 'ghost-btn' }, 'Tìm'), note);

    body.replaceChildren(
      h('div', { class: 'lab-course-row' }, list.map((c) => h('button', {
        type: 'button', class: 'lab-course' + (c.id === chosen.id ? ' on' : ''), 'aria-pressed': String(c.id === chosen.id),
        onclick: () => { view.course[t.id] = c.id; renderBody(); }
      }, h('b', null, c.title), h('span', null, c.channel + (c.count ? ', ' + c.count + ' bài' : ''))))),
      form,
      h('div', { class: 'lab-watch' }, h('div', null, stage, now, h('button', { type: 'button', class: 'play-btn lab-next', onclick: () => { store.tab = 'practice'; view.open = null; view.list = false; save(); renderAll(); } }, 'Thực hành ' + t.name)), h('div', { class: 'lab-side' }, status, lessons, more))
    );
    loadPage();
  }

  /* Danh sách bài */
  function levelClass(level) { return 'lab-level lv-' + ({ 'Dễ': 'de', 'Trung bình': 'tb', 'Khó': 'kho' }[level]); }
  function noticeFor(t) {
    if (t.engine === 'remote') return 'Code ' + t.name + ' được gửi tới wandbox.org để biên dịch. Đừng dán mật khẩu hay dữ liệu riêng vào bài làm.';
    if (t.runner === 'flag') return 'Mọi thử thách nằm trong trang này, không chạm tới máy của ai. Chỉ thử các kỹ thuật này trên hệ thống bạn được phép kiểm tra.';
    return '';
  }
  function renderPractice(t) {
    if (!view.list) {
      const first = items(t).find((i) => !isSolved(itemKey(t, i)));
      if (first) return openItem(t, first);
    }
    const levels = ['Tất cả', 'Dễ', 'Trung bình', 'Khó'];
    const row = (item, tag) => {
      const done = isSolved(itemKey(t, item));
      return h('li', null, h('button', { type: 'button', class: 'lab-row' + (done ? ' done' : ''), onclick: () => openItem(t, item) },
        h('span', { class: 'lab-state' }, done ? 'Đã xong' : 'Chưa làm'),
        h('span', { class: 'lab-title' }, item.title, tag ? h('small', null, tag) : null),
        h('span', { class: levelClass(item.level) }, item.level),
        h('span', { class: 'lab-pts' }, POINTS[item.level] + ' điểm')));
    };
    const visible = (list) => list.filter((i) => view.level === 'Tất cả' || i.level === view.level);
    const groups = t.runner === 'stdio'
      ? [['Riêng cho ' + t.name, visible(t.own)], ['Bài chung', visible(DATA.shared)]]
      : [[null, visible(t.items)]];
    const note = noticeFor(t) ? h('p', { class: 'lab-note' }, noticeFor(t)) : null;
    const lists = groups.filter((g) => g[1].length).flatMap(([name, list]) => [name ? h('h2', { class: 'lab-group' }, name) : null, h('ul', { class: 'lab-list' }, list.map((i) => row(i)))]);
    body.replaceChildren(...[
      h('div', { class: 'lab-levels' }, levels.map((l) => h('button', {
        type: 'button', class: 'chip' + (l === view.level ? ' on' : ''), 'aria-pressed': String(l === view.level),
        onclick: () => { view.level = l; renderBody(); }
      }, l))),
      note
    ].concat(lists).filter(Boolean));
  }
  function nextItem(t, item) {
    const list = items(t);
    return list.slice(list.indexOf(item) + 1).concat(list).find((i) => !isSolved(itemKey(t, i)) && i !== item);
  }
  function openItem(t, item) {
    const key = itemKey(t, item);
    const ctx = {
      title: item.title, level: item.level, tag: item.level, pts: POINTS[item.level], body: item.body, draft: key, solved: key, item: item,
      tests: item.tests, checks: item.checks, answer: item.answer ? [item] : null,
      back: () => { view.open = null; view.list = true; renderBody(); },
      backLabel: 'Danh sách bài',
      after: (box) => {
        const next = nextItem(t, item);
        if (next) box.append(h('button', { type: 'button', class: 'play-btn lab-next', onclick: () => openItem(t, next) }, 'Bài tiếp theo'));
      }
    };
    showWorkspace(t, ctx);
  }

  /* Project */
  function firstOpenStep(t) {
    const i = t.project.steps.findIndex((s, n) => !isSolved(stepKey(t, n)));
    return i < 0 ? t.project.steps.length - 1 : i;
  }
  function renderProject(t) {
    if (!view.list) return openStep(t, firstOpenStep(t));
    const p = t.project;
    const done = p.steps.filter((s, i) => isSolved(stepKey(t, i))).length;
    body.replaceChildren(h('div', { class: 'lab-project' },
      h('h2', null, p.title),
      prose(p.about),
      h('ol', { class: 'lab-steps' }, p.steps.map((s, i) => h('li', { class: isSolved(stepKey(t, i)) ? 'done' : '' }, h('b', null, 'Chặng ' + (i + 1) + ': ' + s.title), h('span', null, isSolved(stepKey(t, i)) ? 'Đã xong' : STEP_POINTS + ' điểm')))),
      h('button', { type: 'button', class: 'play-btn', onclick: () => openStep(t, firstOpenStep(t)) }, done === 0 ? 'Bắt đầu project' : done === p.steps.length ? 'Xem lại project' : 'Làm tiếp chặng ' + (done + 1))
    ));
  }
  function openStep(t, n) {
    const p = t.project, step = p.steps[n];
    const upto = p.steps.slice(0, n + 1);
    const stepper = h('ol', { class: 'lab-stepper' }, p.steps.map((s, i) => h('li', null, h('button', {
      type: 'button', class: (i === n ? 'on ' : '') + (isSolved(stepKey(t, i)) ? 'done' : ''),
      disabled: i > 0 && !isSolved(stepKey(t, i - 1)), onclick: () => openStep(t, i)
    }, (i + 1) + '. ' + s.title))));
    showWorkspace(t, {
      title: p.title, tag: 'Chặng ' + (n + 1) + ': ' + step.title, level: 'Khó', pts: STEP_POINTS, body: step.body, intro: p.about, stepper: stepper,
      draft: t.runner === 'sql' ? t.id + ':project:' + n : t.id + ':project', solved: stepKey(t, n), item: step,
      tests: step.tests ? upto.flatMap((s) => s.tests) : null,
      checks: step.checks ? upto.flatMap((s) => s.checks) : null,
      answer: step.answer ? [step] : null,
      back: () => { view.open = null; view.list = true; renderBody(); },
      backLabel: 'Về project',
      after: (box) => {
        const marks = stepper.querySelectorAll('button');
        marks[n].classList.add('done');
        if (marks[n + 1]) marks[n + 1].disabled = false;
        if (n + 1 < p.steps.length) box.append(h('button', { type: 'button', class: 'play-btn lab-next', onclick: () => openStep(t, n + 1) }, 'Sang chặng ' + (n + 2)));
        else box.append(h('p', { class: 'lab-pass' }, 'Bạn đã hoàn thành project ' + p.title + '.'));
      }
    });
  }

  /* Mục lục W3Schools: bấm chương là mở trang gốc ở tab mới */
  function renderW3(t) {
    const books = (W3_BOOKS[t.id] || []).flatMap((id) => (window.W3 && window.W3[id]) || []);
    const keyOf = (href) => 'w3:' + href;
    const all = books.flatMap((b) => b[1]);
    const total = h('span', { class: 'lab-wait' });
    const paint = () => { total.textContent = 'Đã mở ' + all.filter((c) => store.watched[keyOf(c[1])]).length + '/' + all.length + ' chương'; };
    const holder = h('div', { class: 'lab-w3' });
    function chapter(c) {
      const seen = !!store.watched[keyOf(c[1])];
      const a = h('a', {
        href: 'https://www.w3schools.com/' + c[1], target: '_blank', rel: 'noopener', class: seen ? 'seen' : '',
        onclick: () => { store.watched[keyOf(c[1])] = 1; save(); a.classList.add('seen'); paint(); }
      }, c[0]);
      return h('li', null, a);
    }
    function draw() {
      const q = view.w3.trim().toLowerCase();
      const match = (c) => !q || c[0].toLowerCase().indexOf(q) >= 0;
      const shown = books.map((b) => [b[0], b[1].filter(match)]).filter((b) => b[1].length);
      if (!shown.length) return holder.replaceChildren(h('p', { class: 'lab-wait' }, 'Không có chương nào khớp. Thử từ khác.'));
      holder.replaceChildren(...shown.map((b, i) => h('details', { open: i === 0 || !!q }, h('summary', null, b[0] + ' (' + b[1].length + ')'), h('ul', null, b[1].map(chapter)))));
    }
    const input = h('input', { type: 'search', value: view.w3, placeholder: 'Tìm chương, ví dụ: loop', 'aria-label': 'Tìm chương W3Schools', oninput: () => { view.w3 = input.value; draw(); } });
    paint();
    draw();
    body.replaceChildren(
      h('p', { class: 'lab-note' }, 'W3Schools chặn hiển thị trong trang khác và không cho chép nội dung bài, nên mỗi chương mở ở tab mới. Đọc xong quay lại tab Thực hành để viết code.'),
      h('div', { class: 'lab-search' }, input, total),
      holder
    );
  }

  /* HackerRank và Hack The Box */
  function linkList(list) {
    return h('ul', { class: 'lab-links' }, list.map((l) => h('li', null, h('a', { href: l.url, target: '_blank', rel: 'noopener' }, h('b', null, l.title), h('span', null, l.note)))));
  }
  function renderHackerRank(t) {
    body.replaceChildren(h('p', { class: 'lab-note' }, 'HackerRank không cho nhúng vào trang khác, nên bài làm mở ở tab mới và chấm trên tài khoản HackerRank của bạn.'), linkList(t.hackerrank));
  }
  function renderHtb(t) {
    body.replaceChildren(h('p', { class: 'lab-note' }, 'Hack The Box mở ở tab mới và cần tài khoản riêng. Máy thực hành chạy qua VPN hoặc Pwnbox của họ.'), linkList(t.htb));
  }

  /* Nơi làm bài */
  function shell(ctx, left, right) {
    body.replaceChildren(
      h('div', { class: 'lab-work' },
        h('div', { class: 'lab-brief' },
          h('button', { type: 'button', class: 'ghost-btn lab-back', onclick: ctx.back }, ctx.backLabel),
          ctx.stepper || null,
          h('h2', null, ctx.title),
          h('p', { class: 'lab-meta' }, ctx.stepper ? ctx.tag : h('span', { class: levelClass(ctx.level) }, ctx.level), h('span', { class: 'lab-pts' }, ctx.pts + ' điểm'), isSolved(ctx.solved) ? h('span', { class: 'lab-pass' }, 'Đã xong') : null),
          ctx.notice ? h('p', { class: 'lab-note lab-notice' }, ctx.notice) : null,
          ctx.intro ? h('div', { class: 'lab-intro' }, prose(ctx.intro)) : null,
          h('div', { class: 'lab-text' }, prose(ctx.body)),
          left),
        h('div', { class: 'lab-desk' }, right)));
    view.open = () => shell(ctx, left, right);
  }
  function outBox() {
    const box = h('div', { class: 'lab-out', role: 'status' });
    box.line = (text, cls) => box.append(h('p', { class: cls || '' }, text));
    box.pre = (text, cls) => box.append(h('pre', { class: cls || '' }, text));
    box.clear = () => box.replaceChildren();
    return box;
  }
  async function showWorkspace(t, ctx) {
    ctx.notice = noticeFor(t);
    if (t.runner === 'flag') return flagWorkspace(t, ctx);
    const run = view.token;
    body.replaceChildren(h('p', { class: 'lab-wait' }, 'Đang mở trình soạn mã'));
    await loadEditor();
    if (run !== view.token) return;
    if (t.runner === 'web') return webWorkspace(t, ctx);
    if (t.runner === 'sql') return sqlWorkspace(t, ctx);
    return stdioWorkspace(t, ctx);
  }
  function editorPanel(t, ctx, onChange) {
    const host = h('div', { class: 'lab-editor' });
    const start = store.code[ctx.draft] != null ? store.code[ctx.draft] : t.template;
    const editor = makeEditor(host, t.mode, start, (v) => { store.code[ctx.draft] = v; save(); if (onChange) onChange(v); });
    const reset = h('button', { type: 'button', class: 'lab-reset', onclick: () => { if (confirm('Xóa bài đang viết và quay về mã mẫu?')) editor.set(t.template); } }, 'Viết lại từ đầu');
    return { host, editor, reset };
  }
  function withBusy(buttons, fn) {
    return async () => {
      buttons.forEach((b) => { b.disabled = true; });
      try { await fn(); } finally { buttons.forEach((b) => { b.disabled = false; }); }
    };
  }
  function celebrate(box, ctx, first) {
    box.line(first ? 'Đạt. Bạn được cộng ' + ctx.pts + ' điểm.' : 'Đạt.', 'lab-pass');
    ctx.after(box);
  }

  function stdioWorkspace(t, ctx) {
    const sample = ctx.tests[0];
    const samplePanel = h('div', { class: 'lab-sample' },
      h('h3', null, 'Ví dụ'),
      h('div', { class: 'lab-io' }, h('div', null, h('b', null, 'Vào'), h('pre', null, sample[0])), h('div', null, h('b', null, 'Ra'), h('pre', null, sample[1] || ' '))));
    const { host, editor, reset } = editorPanel(t, ctx);
    const stdin = h('textarea', { class: 'lab-stdin', spellcheck: false, value: sample[0], 'aria-label': 'Dữ liệu vào khi chạy thử', rows: 3 });
    const box = outBox();
    const runBtn = h('button', { type: 'button', class: 'ghost-btn' }, 'Chạy thử');
    const sendBtn = h('button', { type: 'button', class: 'play-btn' }, 'Nộp bài');
    const both = [runBtn, sendBtn];
    const loading = () => { if (t.engine === 'python' && !pyBox.worker) box.line('Lần đầu cần tải Python, khoảng 10 MB.', 'lab-dim'); };

    function reportError(r) {
      if (r.compile) { box.line('Lỗi biên dịch', 'lab-bad'); box.pre(r.compile, 'lab-err'); return true; }
      if (r.net) { box.line(r.net, 'lab-bad'); return true; }
      if (r.timeout) { box.line('Chạy quá lâu nên đã dừng. Kiểm tra vòng lặp của bạn.', 'lab-bad'); return true; }
      return false;
    }
    runBtn.addEventListener('click', withBusy(both, async () => {
      box.clear(); loading(); box.line('Đang chạy', 'lab-dim');
      try {
        const r = await runStdio(t, editor.get(), stdin.value);
        box.clear();
        if (reportError(r)) return;
        box.pre(r.out || '(không có gì được in ra)');
        if (r.err) box.pre(r.err, 'lab-err');
      } catch (e) { box.clear(); box.line(e.message, 'lab-bad'); }
    }));
    sendBtn.addEventListener('click', withBusy(both, async () => {
      box.clear();
      const code = editor.get();
      for (const [pattern, message] of ctx.item.must || []) {
        if (!new RegExp(pattern).test(code)) { box.line(message + '.', 'lab-bad'); return; }
      }
      loading();
      const wait = h('p', { class: 'lab-dim' }, 'Đang chấm');
      box.append(wait);
      try {
        for (let i = 0; i < ctx.tests.length; i++) {
          wait.textContent = 'Đang chấm test ' + (i + 1) + '/' + ctx.tests.length;
          const r = await runStdio(t, code, ctx.tests[i][0]);
          if (reportError(r)) { wait.remove(); return; }
          if (r.failed) { wait.remove(); box.line('Test ' + (i + 1) + ' bị lỗi khi chạy', 'lab-bad'); if (r.err) box.pre(r.err, 'lab-err'); return; }
          if (clean(r.out) !== clean(ctx.tests[i][1])) {
            wait.remove();
            box.line('Test ' + (i + 1) + ' sai', 'lab-bad');
            box.append(h('div', { class: 'lab-io' }, h('div', null, h('b', null, 'Vào'), h('pre', null, ctx.tests[i][0])), h('div', null, h('b', null, 'Đúng'), h('pre', null, ctx.tests[i][1] || ' ')), h('div', null, h('b', null, 'Bạn in'), h('pre', null, r.out || ' '))));
            return;
          }
          box.insertBefore(h('p', { class: 'lab-ok' }, 'Test ' + (i + 1) + ' đạt'), wait);
        }
        wait.remove();
        celebrate(box, ctx, award(ctx.solved, ctx.pts));
      } catch (e) { wait.remove(); box.line(e.message, 'lab-bad'); }
    }));
    shell(ctx, samplePanel, [host, h('div', { class: 'lab-actions' }, runBtn, sendBtn, reset), h('label', { class: 'lab-label' }, 'Dữ liệu vào khi chạy thử', stdin), box]);
  }

  /* HTML và CSS chạy trong khung cách ly, trình chấm nằm trong chính khung đó */
  const CHECKER = `var $=function(s){return document.querySelector(s)},$$=function(s){return Array.prototype.slice.call(document.querySelectorAll(s))},cs=function(e,p){return e?getComputedStyle(e)[p]:''},rules=function(){var o=[];Array.prototype.forEach.call(document.styleSheets,function(s){Array.prototype.forEach.call(s.cssRules,function(r){o.push(r);if(r.cssRules)Array.prototype.forEach.call(r.cssRules,function(c){o.push(c)})})});return o};`;
  function checkScript(checks, nonce) {
    const data = JSON.stringify(checks.map((c) => c[1])).replace(/</g, '\\u003c');
    return '<script>' + CHECKER + 'addEventListener("load",function(){setTimeout(function(){var r=' + data + '.map(function(c){try{return !!eval(c)}catch(e){return false}});parent.postMessage({labNonce:"' + nonce + '",r:r},"*")},40)});<\/script>';
  }
  function webWorkspace(t, ctx) {
    const frame = h('iframe', { class: 'lab-preview', sandbox: 'allow-scripts', title: 'Xem trước trang của bạn', srcdoc: '' });
    let timer = 0;
    const { host, editor, reset } = editorPanel(t, ctx, () => { clearTimeout(timer); timer = setTimeout(() => { frame.srcdoc = editor.get(); }, 350); });
    const box = outBox();
    const send = h('button', { type: 'button', class: 'play-btn' }, 'Nộp bài');
    send.addEventListener('click', withBusy([send], () => new Promise((resolve) => {
      box.clear();
      box.line('Đang chấm', 'lab-dim');
      const nonce = Math.random().toString(36).slice(2);
      const finish = (res) => {
        clearTimeout(limit);
        removeEventListener('message', onMsg);
        box.clear();
        if (!res) { box.line('Trang không phản hồi. Kiểm tra lại mã của bạn.', 'lab-bad'); return resolve(); }
        ctx.checks.forEach((c, i) => box.line((res[i] ? 'Đạt: ' : 'Chưa đạt: ') + c[0], res[i] ? 'lab-ok' : 'lab-bad'));
        if (res.every(Boolean)) celebrate(box, ctx, award(ctx.solved, ctx.pts));
        resolve();
      };
      const onMsg = (e) => { if (e.source === frame.contentWindow && e.data && e.data.labNonce === nonce) finish(e.data.r); };
      addEventListener('message', onMsg);
      const limit = setTimeout(() => finish(null), 5000);
      frame.srcdoc = editor.get() + checkScript(ctx.checks, nonce);
    })));
    shell(ctx, h('div', { class: 'lab-sample' }, h('h3', null, 'Cần đạt'), h('ul', { class: 'lab-needs' }, ctx.checks.map((c) => h('li', null, c[0])))),
      [host, h('div', { class: 'lab-actions' }, send, reset), h('h3', { class: 'lab-label' }, 'Xem trước'), frame, box]);
    frame.srcdoc = editor.get();
  }

  /* SQL */
  function table(res) {
    if (!res.columns.length) return h('p', { class: 'lab-dim' }, 'Câu lệnh chạy xong, không có dòng nào.');
    const rows = res.values.slice(0, 100);
    return h('div', { class: 'lab-table' }, h('table', null,
      h('thead', null, h('tr', null, res.columns.map((c) => h('th', null, c)))),
      h('tbody', null, rows.map((r) => h('tr', null, r.map((v) => h('td', null, v === null ? 'NULL' : String(v))))))));
  }
  function sqlWorkspace(t, ctx) {
    const { host, editor, reset } = editorPanel(t, ctx);
    const box = outBox();
    const runBtn = h('button', { type: 'button', class: 'ghost-btn' }, 'Chạy thử');
    const sendBtn = h('button', { type: 'button', class: 'play-btn' }, 'Nộp bài');
    const both = [runBtn, sendBtn];
    const exec = (sql) => sqlBox.run({ schema: t.schema, sql: sql }, 5000);
    const problem = (r) => {
      if (r.timeout) { box.line('Truy vấn chạy quá lâu nên đã dừng.', 'lab-bad'); return true; }
      if (r.err) { box.line('Lỗi SQL', 'lab-bad'); box.pre(r.err, 'lab-err'); return true; }
      return false;
    };
    runBtn.addEventListener('click', withBusy(both, async () => {
      box.clear(); box.line('Đang chạy', 'lab-dim');
      try {
        const r = await exec([editor.get()]);
        box.clear();
        if (!problem(r)) box.append(table(r.res[0]));
      } catch (e) { box.clear(); box.line(e.message, 'lab-bad'); }
    }));
    sendBtn.addEventListener('click', withBusy(both, async () => {
      box.clear(); box.line('Đang chấm', 'lab-dim');
      try {
        const item = ctx.answer[0];
        const r = await exec([editor.get(), item.answer]);
        box.clear();
        if (problem(r)) return;
        const norm = (res) => { const rows = res.values.map((v) => JSON.stringify(v)); return item.ordered ? rows : rows.sort(); };
        const mine = norm(r.res[0]), right = norm(r.res[1]);
        if (JSON.stringify(mine) === JSON.stringify(right)) return celebrate(box, ctx, award(ctx.solved, ctx.pts));
        box.line('Kết quả chưa đúng. Bạn trả về ' + mine.length + ' dòng, đáp án có ' + right.length + ' dòng.', 'lab-bad');
        box.append(h('h3', { class: 'lab-label' }, 'Kết quả của bạn'), table(r.res[0]));
      } catch (e) { box.clear(); box.line(e.message, 'lab-bad'); }
    }));
    shell(ctx, h('div', { class: 'lab-sample' }, h('h3', null, 'Các bảng'), h('pre', null, t.schemaText)),
      [host, h('div', { class: 'lab-actions' }, runBtn, sendBtn, reset), box]);
  }

  /* Thử thách cờ */
  async function sha256(text) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  function loginWidget(schema) {
    const user = h('input', { autocomplete: 'off', spellcheck: false, 'aria-label': 'Tên đăng nhập', placeholder: 'Tên đăng nhập' });
    const pass = h('input', { autocomplete: 'off', spellcheck: false, 'aria-label': 'Mật khẩu', placeholder: 'Mật khẩu' });
    const box = outBox();
    return h('form', {
      class: 'lab-login', onsubmit: async (e) => {
        e.preventDefault();
        const sql = "SELECT username, secret FROM users WHERE username = '" + user.value + "' AND password = '" + pass.value + "'";
        box.clear();
        box.pre(sql);
        const r = await sqlBox.run({ schema: schema, sql: [sql] }, 4000);
        if (r.timeout) return box.line('Truy vấn chạy quá lâu.', 'lab-bad');
        if (r.err) return box.line('Lỗi SQL: ' + r.err, 'lab-bad');
        const row = r.res[0].values[0];
        if (!row) return box.line('Sai tên đăng nhập hoặc mật khẩu.', 'lab-bad');
        box.line('Đăng nhập thành công với tài khoản ' + row[0] + '.', 'lab-ok');
        box.pre(String(row[1]));
      }
    }, user, pass, h('button', { type: 'submit', class: 'ghost-btn' }, 'Đăng nhập'), box);
  }
  function flagWorkspace(t, ctx) {
    const item = ctx.item;
    const desk = [];
    if (item.artifact) {
      const copy = h('button', { type: 'button', class: 'lab-reset', onclick: async () => {
        try { await navigator.clipboard.writeText(item.artifact); copy.textContent = 'Đã chép'; } catch (e) { copy.textContent = 'Không chép được'; }
      } }, 'Chép');
      desk.push(h('div', { class: 'lab-artifact' }, h('pre', { tabIndex: 0 }, item.artifact), copy));
    }
    if (item.page) {
      const src = h('pre', { class: 'lab-source', hidden: true, tabIndex: 0 }, item.page);
      const toggle = h('button', { type: 'button', class: 'ghost-btn', onclick: () => { src.hidden = !src.hidden; toggle.textContent = src.hidden ? 'Xem mã nguồn' : 'Ẩn mã nguồn'; } }, 'Xem mã nguồn');
      desk.push(h('iframe', { class: 'lab-preview', sandbox: '', srcdoc: item.page, title: 'Trang cần kiểm tra' }), toggle, src);
    }
    if (item.login) desk.push(loginWidget(item.login));
    const input = h('input', { autocomplete: 'off', spellcheck: false, placeholder: 'TP{...}', 'aria-label': 'Nhập cờ' });
    const box = outBox();
    const send = h('button', { type: 'submit', class: 'play-btn' }, 'Nộp cờ');
    desk.push(h('form', {
      class: 'lab-flag', onsubmit: (e) => {
        e.preventDefault();
        withBusy([send], async () => {
          box.clear();
          if (await sha256(input.value.trim()) === item.hash) celebrate(box, ctx, award(ctx.solved, ctx.pts));
          else box.line('Cờ chưa đúng. Kiểm tra lại từng ký tự.', 'lab-bad');
        })();
      }
    }, input, send), box);
    const hint = item.hint ? h('details', { class: 'lab-hint' }, h('summary', null, 'Xem gợi ý'), h('p', null, item.hint)) : null;
    shell(ctx, hint, desk);
  }

  return {
    init() {
      body = $('labBody');
      renderScore();
      renderAll();
      document.addEventListener('tp:lab', () => { store.tab = 'practice'; view.open = null; view.list = false; save(); renderAll(); });
      document.addEventListener('tp:go', (e) => {
        if (e.detail !== 'cong') stopLesson();
        else if (!view.open && store.tab === 'courses' && !document.querySelector('.lab-stage iframe')) renderBody();
      });
      loadEditor();
    }
  };
})();
