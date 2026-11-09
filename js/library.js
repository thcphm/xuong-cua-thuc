/* Phòng Sách: thư viện mở. Sách Việt lấy từ Wikisource, ngoại văn từ Open Library và Internet Archive.
   Chỉ dẫn tới bản được phép đọc tự do; sách còn bản quyền chỉ hiện link mua. */
window.Library = (function () {
  var cfg = window.SITE.library;
  var $ = function (id) { return document.getElementById(id); };
  var OL_FIELDS = 'key,title,author_name,cover_i,first_publish_year,ebook_access,ia';
  var cache = {};
  var token = 0;

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }
  function link(text, href, className) {
    var a = el('a', className, text);
    a.href = href;
    a.target = '_blank';
    a.rel = 'noopener';
    return a;
  }
  function fold(text) {
    return String(text || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().trim();
  }
  function getJson(url) {
    if (cache[url]) return Promise.resolve(cache[url]);
    return fetch(url).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    }).then(function (body) { cache[url] = body; return body; });
  }

  function buyLinks(query) {
    var q = encodeURIComponent(query);
    return [
      { name: 'Tiki', url: 'https://tiki.vn/search?q=' + q },
      { name: 'Fahasa', url: 'https://www.fahasa.com/searchengine?q=' + q },
      { name: 'Google', url: 'https://www.google.com/search?tbm=shop&q=' + encodeURIComponent('sách ' + query) }
    ];
  }
  /* Thông báo khi chưa có bản miễn phí, kèm link tìm mua theo đúng tên sách */
  function sorry(query) {
    var box = el('div', 'lib-sorry');
    box.append(el('p', '', 'Xin lỗi, sách bạn tìm chưa có phiên bản miễn phí. Bạn có thể tìm kiếm mua sách tại:'));
    var row = el('div', 'lib-links');
    buyLinks(query).forEach(function (b) { row.append(link(b.name, b.url, 'ghost-btn')); });
    box.append(row);
    return box;
  }

  function wikiItem(title, author, page) {
    var name = (page || title).replace(/ /g, '_');
    var q = encodeURIComponent(name);
    return {
      title: title, author: author, origin: 'Việt Nam', source: 'Wikisource', free: true,
      read: 'https://vi.wikisource.org/wiki/' + q,
      epub: 'https://ws-export.wmcloud.org/?lang=vi&format=epub&page=' + q,
      pdf: 'https://ws-export.wmcloud.org/?lang=vi&format=pdf&page=' + q
    };
  }
  function catalogItem(book) {
    if (book.page) return wikiItem(book.title, book.author, book.page === true ? book.title : book.page);
    if (book.read) return { title: book.title, author: book.author, note: book.note, source: book.source, free: true, read: book.read, epub: book.epub, pdf: book.pdf };
    return { title: book.title, author: book.author, origin: 'Việt Nam', free: false, note: book.note };
  }
  function olItem(doc) {
    return {
      key: doc.key,
      title: doc.title,
      author: (doc.author_name || [''])[0],
      year: doc.first_publish_year,
      cover: doc.cover_i ? 'https://covers.openlibrary.org/b/id/' + doc.cover_i + '-M.jpg' : '',
      ia: doc.ia || [],
      source: 'Open Library',
      free: doc.ebook_access === 'public'
    };
  }
  function olSearch(q, limit, popular) {
    var url = 'https://openlibrary.org/search.json?limit=' + limit + '&fields=' + OL_FIELDS + (popular ? '&sort=readinglog' : '') + '&q=' + encodeURIComponent(q);
    return getJson(url).then(function (body) { return body.docs.map(olItem); });
  }
  function wikiSearch(text) {
    var url = 'https://vi.wikisource.org/w/api.php?action=query&format=json&origin=*&list=search&srnamespace=0&srlimit=10&srsearch=' + encodeURIComponent(text);
    var wanted = fold(text);
    return getJson(url).then(function (body) {
      return body.query.search.filter(function (r) {
        return fold(r.title).indexOf(wanted) >= 0 && r.title.indexOf('/') < 0;
      }).map(function (r) {
        var m = r.title.match(/\(([^)]+)\)\s*$/);
        return wikiItem(r.title, m ? m[1] : '', r.title);
      });
    });
  }
  function allCatalog() {
    var list = [];
    cfg.vietnam.concat(cfg.comics).forEach(function (shelf) {
      shelf.items.forEach(function (b) {
        var item = catalogItem(b);
        item.originId = shelf.origin || 'vn';
        list.push(item);
      });
    });
    return list;
  }

  /* Tìm bản thật sự tải được: ưu tiên tiếng Việt, rồi tiếng Anh; bỏ bản chỉ cho mượn và sách nói */
  function resolveEdition(item) {
    return getJson('https://openlibrary.org' + item.key + '/editions.json?limit=100').then(function (body) {
      var rank = { vie: 0, eng: 1 };
      var seen = {};
      var list = body.entries.filter(function (e) { return e.ocaid && !/librivox/i.test(e.ocaid); }).map(function (e) {
        var lang = e.languages && e.languages[0] ? e.languages[0].key.replace('/languages/', '') : '';
        seen[e.ocaid] = true;
        return { id: e.ocaid, lang: lang, title: e.title, order: lang in rank ? rank[lang] : 2 };
      });
      item.ia.forEach(function (id) {
        if (!seen[id] && !/librivox/i.test(id)) list.push({ id: id, lang: '', title: item.title, order: 3 });
      });
      list.sort(function (a, b) { return a.order - b.order; });
      var candidates = list.slice(0, 8);
      return (function next(i) {
        if (i >= candidates.length) return null;
        return getJson('https://archive.org/metadata/' + encodeURIComponent(candidates[i].id) + '/metadata').then(function (meta) {
          var m = meta.result || {};
          var locked = m['access-restricted-item'] === 'true' || m['access-restricted-item'] === true;
          return !locked && m.mediatype === 'texts' ? candidates[i] : next(i + 1);
        }, function () { return next(i + 1); });
      })(0);
    });
  }

  var LANG_NAME = { vie: 'tiếng Việt', eng: 'tiếng Anh', fre: 'tiếng Pháp', ger: 'tiếng Đức', rus: 'tiếng Nga', spa: 'tiếng Tây Ban Nha', ita: 'tiếng Ý', jpn: 'tiếng Nhật', chi: 'tiếng Trung' };

  function openPanel(item) {
    var dialog = $('bookPanel');
    var body = $('bookPanelBody');
    var query = item.title + (item.author ? ' ' + item.author : '');
    function head() {
      return [el('h2', '', item.editionTitle || item.title), el('p', 'lib-author', [item.author, item.year].filter(Boolean).join(', '))];
    }
    function links(read, epub, pdf, source, extra) {
      var row = el('div', 'lib-links');
      row.append(link('Đọc online', read, 'play-btn'));
      if (epub) row.append(link('Tải EPUB', epub, 'ghost-btn'));
      if (pdf) row.append(link('Tải PDF', pdf, 'ghost-btn'));
      body.replaceChildren.apply(body, head().concat([el('p', 'lib-source', 'Nguồn: ' + source + (extra || '')), row]));
    }
    if (!item.free) {
      body.replaceChildren.apply(body, head().concat([sorry(query)]));
    } else if (item.read) {
      links(item.read, item.epub, item.pdf, item.source);
    } else {
      body.replaceChildren.apply(body, head().concat([el('p', 'lib-source', 'Đang tìm bản miễn phí...')]));
      var shown = item;
      dialog.dataset.item = shown.key;
      resolveEdition(item).then(function (edition) {
        if (dialog.dataset.item !== shown.key) return;
        if (!edition) { body.replaceChildren.apply(body, head().concat([sorry(query)])); return; }
        var id = encodeURIComponent(edition.id);
        var lang = LANG_NAME[edition.lang];
        item.editionTitle = edition.title;
        links('https://archive.org/details/' + id, 'https://archive.org/download/' + id + '/' + id + '.epub', 'https://archive.org/download/' + id + '/' + id + '.pdf', 'Internet Archive', lang ? ', bản ' + lang : '');
      }, function () {
        if (dialog.dataset.item !== shown.key) return;
        body.replaceChildren.apply(body, head().concat([el('p', 'lib-source', 'Không kết nối được thư viện. Thử lại sau.')]));
      });
    }
    if (!dialog.open) dialog.showModal();
  }

  function card(item) {
    var button = el('button', 'book-card');
    button.type = 'button';
    var cover = el('span', 'book-cover');
    var fallback = el('span', 'book-cover-text', item.title);
    let hue = 0;
    fold(item.title).split('').forEach(function (c) { hue = (hue * 31 + c.charCodeAt(0)) % 360; });
    cover.style.setProperty('--hue', hue);
    cover.append(fallback);
    if (item.cover) {
      var img = el('img');
      img.src = item.cover;
      img.alt = '';
      img.loading = 'lazy';
      img.addEventListener('error', function () { img.remove(); });
      cover.append(img);
    }
    var info = el('span', 'book-info');
    info.append(el('span', 'book-title', item.title), el('span', 'book-author', item.author || 'Khuyết danh'));
    if (item.note) info.append(el('span', 'book-note', item.note));
    info.append(el('span', item.free ? 'book-tag free' : 'book-tag', item.free ? 'Miễn phí' : 'Chưa có bản miễn phí'));
    button.append(cover, info);
    button.addEventListener('click', function () { openPanel(item); });
    return button;
  }
  function render(title, items) {
    $('libTitle').textContent = title;
    var grid = $('libResults');
    grid.replaceChildren();
    items.forEach(function (item) { grid.append(card(item)); });
  }
  function setStatus(node) {
    var box = $('libStatus');
    box.replaceChildren();
    if (node) box.append(node);
    box.hidden = !node;
  }
  function pressCase(button) {
    document.querySelectorAll('.bookcase').forEach(function (c) { c.setAttribute('aria-pressed', c === button ? 'true' : 'false'); });
  }
  function loading(title) {
    $('libTitle').textContent = title;
    $('libResults').replaceChildren();
    setStatus(el('p', 'lib-wait', 'Đang tìm trong thư viện...'));
  }
  function failed() {
    setStatus(el('p', 'lib-wait', 'Không kết nối được thư viện. Thử lại sau.'));
  }

  function openLocal(shelf, button) {
    token++;
    pressCase(button);
    setStatus(null);
    render(shelf.name, shelf.items.map(catalogItem));
  }
  function openRemote(shelf, button) {
    var mine = ++token;
    pressCase(button);
    loading(shelf.name);
    olSearch('subject:"' + shelf.subject + '" ebook_access:public language:eng', 18, true).then(function (items) {
      if (mine !== token) return;
      setStatus(null);
      render(shelf.name, items);
    }, function () { if (mine === token) failed(); });
  }

  function dedupe(items) {
    var seen = {};
    return items.filter(function (item) {
      var k = fold(item.title);
      if (seen[k]) return false;
      seen[k] = true;
      return true;
    });
  }
  function matchCatalog(text, field) {
    var wanted = fold(text);
    return allCatalog().filter(function (b) {
      return !wanted || fold(field === 'author' ? b.author : b.title).indexOf(wanted) >= 0;
    });
  }

  function search() {
    var text = $('libQuery').value.trim();
    var field = $('libField').value;
    var originId = $('libOrigin').value;
    var origin = cfg.origins.filter(function (o) { return o.id === originId; })[0];
    if (!text && !origin) {
      setStatus(el('p', 'lib-wait', 'Nhập tên sách, tên tác giả hoặc chọn xuất xứ.'));
      return;
    }
    var mine = ++token;
    pressCase(null);
    var label = text ? 'Kết quả cho "' + text + '"' : 'Sách xuất xứ ' + origin.name;
    if (text && origin) label += ', ' + origin.name;
    loading(label);

    var vietnamOnly = origin && origin.id === 'vn';
    var clause = text ? (field === 'author' ? 'author:"' : 'title:"') + text.replace(/"/g, '') + '" ' : '';
    var subject = origin && origin.subject ? 'subject:"' + origin.subject + '" ' : '';
    var tasks = [];
    var local = matchCatalog(text, field).filter(function (b) { return !origin || b.originId === origin.id; });
    if (vietnamOnly || !origin) tasks.push(text ? wikiSearch(text).catch(function () { return null; }) : Promise.resolve([]));
    else tasks.push(Promise.resolve([]));
    if (vietnamOnly) {
      tasks.push(Promise.resolve([]), Promise.resolve([]));
    } else {
      tasks.push(
        olSearch(clause + subject + 'ebook_access:public' + (text ? '' : ' language:eng'), 12, !text).catch(function () { return null; }),
        text ? olSearch(clause + subject + '-ebook_access:public', 6, false).catch(function () { return null; }) : Promise.resolve([])
      );
    }
    Promise.all(tasks).then(function (r) {
      if (mine !== token) return;
      if (r[0] === null && r[1] === null) { failed(); return; }
      var items = dedupe(local.filter(function (b) { return b.free; }).concat(r[0] || [], r[1] || [], local.filter(function (b) { return !b.free; }), r[2] || []));
      /* Có bản miễn phí thì xếp trước; chưa có bản nào thì hiện thông báo và link mua */
      setStatus(items.some(function (b) { return b.free; }) ? null : sorry(text || label));
      render(label, items);
    });
  }

  function bookcase(shelf, hue, onOpen) {
    var button = el('button', 'bookcase');
    button.type = 'button';
    button.setAttribute('aria-pressed', 'false');
    var art = el('span', 'case-art');
    art.style.setProperty('--hue', hue);
    for (var i = 0; i < 3; i++) art.append(el('i'));
    button.append(art, el('span', 'case-name', shelf.name));
    button.addEventListener('click', function () { onOpen(shelf, button); });
    return button;
  }

  function init() {
    $('libIntro').textContent = cfg.intro;
    var own = { name: 'Thức đang đọc', items: window.SITE.books.list };
    var first = null;
    var vn = $('caseVietnam');
    cfg.vietnam.forEach(function (shelf, i) {
      var b = bookcase(shelf, 28 + i * 22, openLocal);
      if (!first) first = { shelf: shelf, button: b };
      vn.append(b);
    });
    var ownButton = bookcase(own, 200, openLocal);
    vn.append(ownButton);
    var foreign = $('caseForeign');
    cfg.foreign.forEach(function (shelf, i) { foreign.append(bookcase(shelf, 190 + i * 24, openRemote)); });
    var comics = $('caseComics');
    cfg.comics.forEach(function (shelf, i) { comics.append(bookcase(shelf, 330 + i * 34, openLocal)); });

    cfg.origins.forEach(function (o) {
      var opt = el('option', '', o.name);
      opt.value = o.id;
      $('libOrigin').append(opt);
    });
    $('libForm').addEventListener('submit', function (e) { e.preventDefault(); search(); });
    $('bookPanelClose').addEventListener('click', function () { $('bookPanel').close(); });
    $('bookPanel').addEventListener('click', function (e) { if (e.target === $('bookPanel')) $('bookPanel').close(); });
    document.addEventListener('tp:pick-book', function () { openLocal(own, ownButton); });
    openLocal(first.shelf, first.button);
  }

  return { init: init };
})();
