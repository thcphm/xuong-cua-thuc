(function () {
  var SITE = window.SITE;
  var Music = window.Music;
  var ROOMS = {
    nhac: { title: 'Phòng Nhạc', cx: 265, cy: 185 },
    sach: { title: 'Phòng Sách', cx: 765, cy: 120 },
    hoc: { title: 'Phòng Học', cx: 165, cy: 465 },
    game: { title: 'Phòng Giải Trí', cx: 765, cy: 495 },
    cong: { title: 'Phòng Công Nghệ', cx: 765, cy: 305 }
  };
  var LOCKED = SITE.lockedRooms || [];
  function isLocked(id) { return LOCKED.indexOf(id) >= 0; }
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (id) { return document.getElementById(id); };

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  /* Sảnh */
  var homeTitle = SITE.siteName;
  $('ownerTitle').textContent = homeTitle;
  $('tagline').textContent = SITE.tagline;
  var counts = {
    nhac: 'Nghe từ YouTube',
    sach: SITE.books.list.length + ' cuốn',
    game: SITE.games.list.length + ' game',
    hoc: 'Hẹn giờ, flashcard',
    cong: SITE.tech.projects.length + ' dự án'
  };
  window.Study.init();
  window.Walk.init();
  window.Tech.init();

  var planRooms = document.querySelectorAll('.plan .room');
  function planRoom(id) { return document.querySelector('.plan .room[data-room="' + id + '"]'); }

  Object.keys(ROOMS).forEach(function (id) {
    var li = el('li');
    var a = el('a');
    a.href = '#' + id;
    a.dataset.room = id;
    if (isLocked(id)) a.classList.add('rl-locked');
    a.append(el('span', 'rl-name', ROOMS[id].title), el('span', 'rl-count', isLocked(id) ? 'Đang khóa' : counts[id]));
    ['mouseenter', 'focus'].forEach(function (type) {
      a.addEventListener(type, function () {
        planRoom(id).classList.add('lit');
        document.dispatchEvent(new CustomEvent('tp:hover', { detail: id }));
      });
    });
    ['mouseleave', 'blur'].forEach(function (type) {
      a.addEventListener(type, function () {
        planRoom(id).classList.remove('lit');
        document.dispatchEvent(new CustomEvent('tp:hover', { detail: null }));
      });
    });
    li.append(a);
    $('roomList').append(li);
  });

  /* Sơ đồ nhỏ trên thanh điều hướng */
  var NS = 'http://www.w3.org/2000/svg';
  var mini = document.createElementNS(NS, 'svg');
  mini.setAttribute('viewBox', '30 20 940 580');
  [
    ['', 290, 340, 280, 250], ['', 490, 30, 80, 310],
    ['nhac', 40, 30, 450, 310], ['sach', 570, 30, 390, 180], ['cong', 570, 210, 390, 190], ['game', 570, 400, 390, 190], ['hoc', 40, 340, 250, 250]
  ].forEach(function (r) {
    var rect = document.createElementNS(NS, 'rect');
    rect.setAttribute('x', r[1]); rect.setAttribute('y', r[2]);
    rect.setAttribute('width', r[3]); rect.setAttribute('height', r[4]);
    rect.dataset.room = r[0];
    rect.addEventListener('click', function () { location.hash = r[0]; });
    mini.append(rect);
  });
  $('minimap').append(mini);
  LOCKED.forEach(function (id) {
    var link = document.querySelector('.roomnav a[data-room="' + id + '"]');
    if (link) link.hidden = true;
    var label = document.querySelector('.world-label[data-room="' + id + '"]');
    if (label) label.textContent += ' (đang khóa)';
  });

  /* Phòng Nhạc */
  var results = [], searchToken = 0;
  var dock = $('ytDock'), slot = $('playerSlot'), dockClosed = false;

  function note(text) {
    $('ytNote').hidden = !text;
    $('ytNote').textContent = text || '';
  }
  function markCurrent() {
    var t = Music.current();
    document.querySelectorAll('.track').forEach(function (node) {
      var on = !!t && node.dataset.id === t.id;
      node.classList.toggle('current', on);
      if (on) node.setAttribute('aria-current', 'true'); else node.removeAttribute('aria-current');
    });
  }
  function renderList(title, items) {
    results = items;
    $('listTitle').textContent = title;
    var list = $('trackList');
    list.replaceChildren();
    if (!items.length) { list.append(el('li', 'yt-empty', 'Không có kết quả. Thử tên khác hoặc chọn một thể loại.')); return; }
    items.forEach(function (item, i) {
      var li = el('li');
      var button = el('button', 'track');
      button.type = 'button';
      button.dataset.id = item.id;
      var thumb = el('img', 'track-thumb');
      thumb.src = 'https://i.ytimg.com/vi/' + item.id + '/mqdefault.jpg';
      thumb.alt = '';
      thumb.loading = 'lazy';
      thumb.width = 120;
      thumb.height = 68;
      var text = el('span', 'track-text');
      text.append(el('span', 'track-title', item.title), el('span', 'track-note', item.channel || ''));
      button.append(thumb, text);
      button.addEventListener('click', function () {
        var t = Music.current();
        if (t && t.id === item.id) Music.toggle(); else Music.playFrom(results, i);
      });
      li.append(button);
      list.append(li);
    });
    markCurrent();
  }
  function pressGenre(button) {
    document.querySelectorAll('.genre-row .chip').forEach(function (c) { c.setAttribute('aria-pressed', c === button ? 'true' : 'false'); });
  }
  var ERRORS = {
    quota: 'Hết lượt tìm kiếm hôm nay. Bạn vẫn chọn được thể loại hoặc dán link YouTube.',
    key: 'Tìm kiếm đang lỗi cấu hình. Bạn vẫn chọn được thể loại hoặc dán link YouTube.',
    network: 'Không kết nối được YouTube. Kiểm tra mạng rồi thử lại.'
  };
  function runSearch(query, title, fallback) {
    var token = ++searchToken;
    note('');
    $('listTitle').textContent = 'Đang tìm...';
    Music.search(query).then(function (result) {
      if (token !== searchToken) return;
      if (result.error) {
        note(ERRORS[result.error]);
        renderList(fallback ? title : 'Kết quả', fallback || []);
      } else {
        renderList(title, result.items);
      }
    });
  }
  function openGenre(genre, button) {
    pressGenre(button);
    note('');
    if (Music.canSearch()) runSearch(genre.query, 'Đề xuất: ' + genre.name, genre.seed);
    else { searchToken++; renderList('Đề xuất: ' + genre.name, genre.seed); }
  }
  SITE.music.genres.forEach(function (genre, i) {
    var chip = el('button', 'chip', genre.name);
    chip.type = 'button';
    chip.setAttribute('aria-pressed', 'false');
    chip.addEventListener('click', function () { openGenre(genre, chip); });
    $('genreRow').append(chip);
    if (i === 0) {
      pressGenre(chip);
      renderList('Đề xuất: ' + genre.name, genre.seed);
      Music.setDefault(genre.seed);
    }
  });
  $('ytForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var text = $('ytQuery').value.trim();
    if (!text) return note('Nhập tên bài hát hoặc dán link YouTube.');
    var id = Music.parseLink(text);
    if (id) {
      searchToken++;
      note('');
      pressGenre(null);
      var item = { id: id, title: 'Video YouTube', channel: '', auto: true };
      renderList('Từ link của bạn', [item]);
      Music.playFrom([item], 0);
      return;
    }
    if (!Music.canSearch()) return note('Tìm theo tên chưa bật. Chọn một thể loại hoặc dán link YouTube để phát.');
    pressGenre(null);
    runSearch(text, 'Kết quả cho "' + text + '"');
  });
  document.addEventListener('tp:yt-error', function (e) {
    note('"' + e.detail.title + '" không cho phát ngoài YouTube, đã chuyển bài tiếp.');
  });

  function placeDock() {
    var inRoom = document.body.dataset.room === 'nhac';
    var active = Music.state.index >= 0;
    var narrow = window.innerWidth <= 900;
    if (active && !inRoom && narrow) Music.pause();
    dock.classList.remove('off', 'in-room', 'docked');
    dock.style.cssText = '';
    if (active && inRoom) {
      var r = slot.getBoundingClientRect();
      dock.classList.add('in-room');
      dock.style.left = (r.left + window.scrollX) + 'px';
      dock.style.top = (r.top + window.scrollY) + 'px';
      dock.style.width = r.width + 'px';
      dock.style.height = r.height + 'px';
    } else if (active && !narrow && !dockClosed) {
      dock.classList.add('docked');
    } else {
      dock.classList.add('off');
    }
  }
  new ResizeObserver(placeDock).observe(slot);
  window.addEventListener('resize', placeDock);
  $('ytClose').addEventListener('click', function () {
    dockClosed = true;
    Music.pause();
    placeDock();
  });

  $('playToggle').addEventListener('click', Music.toggle);
  $('miniToggle').addEventListener('click', Music.toggle);
  $('nextTrack').addEventListener('click', Music.next);
  $('prevTrack').addEventListener('click', Music.prev);
  $('volume').addEventListener('input', function (e) { Music.setVolume(e.target.value / 100); });

  var placedFor = null;
  Music.subscribe(function (state, track) {
    document.body.classList.toggle('is-playing', state.playing);
    $('playText').textContent = state.playing ? 'Tạm dừng' : 'Phát';
    if (track) {
      $('nowTitle').textContent = track.title;
      $('nowChannel').textContent = track.channel || '';
      $('miniPlayer').hidden = false;
      $('miniTitle').textContent = track.title;
      $('ytOpen').hidden = false;
      $('ytOpen').href = 'https://www.youtube.com/watch?v=' + track.id;
      document.querySelectorAll('.track[data-id="' + track.id + '"] .track-title').forEach(function (n) { n.textContent = track.title; });
    }
    $('miniToggle').setAttribute('aria-label', state.playing ? 'Tạm dừng nhạc' : 'Phát nhạc');
    markCurrent();
    if (state.playing) dockClosed = false;
    if (placedFor !== state.index + ':' + dockClosed) { placedFor = state.index + ':' + dockClosed; placeDock(); }
  });

  /* Công tắc đèn của phòng */
  $('lightSwitch').addEventListener('click', function () {
    var off = document.body.classList.toggle('lights-out');
    this.setAttribute('aria-pressed', String(!off));
    window.Study.click();
    document.dispatchEvent(new CustomEvent('tp:lights', { detail: off }));
  });

  /* Phòng sách */
  $('sachIntro').textContent = SITE.books.intro;
  $('shelf').addEventListener('keydown', function (e) {
    var delta = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (!delta) return;
    var spines = Array.prototype.slice.call(document.querySelectorAll('.spine'));
    var next = spines[spines.indexOf(document.activeElement) + delta];
    if (next) { next.focus(); next.click(); }
  });
  function showBook(book, spine, fromWorld) {
    if (!fromWorld) document.dispatchEvent(new CustomEvent('tp:book', { detail: SITE.books.list.indexOf(book) }));
    document.querySelectorAll('.spine').forEach(function (node) {
      node.classList.remove('open');
      node.setAttribute('aria-pressed', 'false');
    });
    spine.classList.add('open');
    spine.setAttribute('aria-pressed', 'true');
    var note = $('bookNote');
    note.replaceChildren(el('h2', '', book.title), el('p', 'author', book.author), el('p', 'note', book.note || 'Chưa có ghi chú.'));
    if (!reduceMotion && note.animate) {
      note.animate(
        [{ transform: 'perspective(900px) rotateY(-24deg)', opacity: 0 }, { transform: 'none', opacity: 1 }],
        { duration: 300, easing: 'cubic-bezier(.2,.8,.2,1)' }
      );
    }
  }
  SITE.books.list.forEach(function (book, i) {
    var spine = el('button', 'spine');
    spine.type = 'button';
    spine.style.setProperty('--h', book.height + '%');
    spine.style.setProperty('--w', book.width + 'px');
    spine.style.setProperty('--c', book.color);
    spine.append(el('span', '', book.title));
    spine.addEventListener('click', function () { showBook(book, spine); });
    spine.dataset.index = i;
    $('shelf').append(spine);
    if (i === 0) showBook(book, spine);
  });
  for (var s = 0; s < SITE.books.emptySlots; s++) {
    var slot = el('div', 'slot');
    slot.setAttribute('aria-hidden', 'true');
    slot.style.setProperty('--h', (66 + (s * 37) % 26) + '%');
    slot.style.setProperty('--w', (42 + (s * 13) % 22) + 'px');
    $('shelf').append(slot);
  }

  document.addEventListener('tp:pick-book', function (e) {
    var spine = document.querySelector('.spine[data-index="' + e.detail + '"]');
    if (spine) showBook(SITE.books.list[e.detail], spine, true);
  });

  /* Phòng Giải Trí */
  $('gameIntro').textContent = SITE.games.intro;
  var overlay = $('gameOverlay');
  var coarse = window.matchMedia('(pointer: coarse)').matches;
  var lastTrigger = null;

  function openGame(src, trigger) {
    lastTrigger = trigger;
    Music.pause();
    var frame = document.createElement('iframe');
    frame.src = src;
    frame.title = 'Trò chơi';
    frame.allow = 'fullscreen';
    frame.addEventListener('load', function () { frame.focus(); });
    overlay.append(frame);
    overlay.hidden = false;
    document.body.classList.add('in-game');
  }
  function closeGame() {
    var frame = overlay.querySelector('iframe');
    if (frame) frame.remove();
    overlay.hidden = true;
    document.body.classList.remove('in-game');
    if (lastTrigger) lastTrigger.focus();
  }
  $('exitGame').addEventListener('click', closeGame);

  SITE.games.list.forEach(function (game) {
    if (game.play) {
      var box = $('featuredGame');
      var screen = el('div', 'screen');
      if (game.image) {
        var img = el('img');
        img.src = game.image;
        img.alt = 'Màn hình game ' + game.title;
        img.addEventListener('error', function () { img.remove(); });
        screen.append(img);
      }
      if (!reduceMotion && !coarse) {
        screen.addEventListener('pointermove', function (e) {
          var r = screen.getBoundingClientRect();
          var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
          screen.style.transform = 'perspective(1100px) rotateY(' + x * 7 + 'deg) rotateX(' + -y * 7 + 'deg)';
        });
        screen.addEventListener('pointerleave', function () { screen.style.transform = ''; });
      }
      var title = el('h2', '', game.title);
      var kind = el('p', 'kind', game.kind);
      var about = el('p', 'about', game.about);
      var actions = el('div', 'game-actions');
      if (coarse) {
        actions.append(el('p', 'needs-keyboard', 'Game này cần bàn phím. Mở trên máy tính để chơi.'));
      } else {
        var play = el('button', 'play-btn', 'Chơi ngay');
        play.type = 'button';
        play.addEventListener('click', function () { openGame(game.play, play); });
        document.addEventListener('tp:play', function () { openGame(game.play, play); });
        actions.append(play, el('p', 'keys', game.controls));
      }
      box.append(screen, title, kind, about, actions);
      return;
    }
    var li = el('li', 'game-row');
    var text = el('div');
    text.append(el('h3', '', game.title), el('p', 'kind', game.kind));
    if (game.about) text.append(el('p', 'about', game.about));
    li.append(text);
    if (game.download) {
      var link = el('a', 'ghost-btn', 'Tải bản Windows');
      link.href = game.download;
      li.append(link);
    } else {
      li.append(el('span', 'status', game.status));
    }
    $('gameList').append(li);
  });

  /* Đi giữa các phòng */
  var current = null;

  function applyRoom(id, moveFocus) {
    document.querySelectorAll('.view').forEach(function (v) { v.hidden = true; });
    var view = $('view-' + (id || 'sanh'));
    view.hidden = false;
    document.body.dataset.room = id;
    $('topbar').hidden = !id;
    window.pageTitle = id ? ROOMS[id].title + ', ' + homeTitle : homeTitle;
    window.Study.refreshTitle();
    if (id === 'hoc') window.Study.enter();
    if (id === 'nhac') { dockClosed = false; Music.prepare(); }
    placeDock();
    document.querySelectorAll('.roomnav a').forEach(function (a) {
      var active = (a.dataset.room || '') === id;
      if (active) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    mini.querySelectorAll('rect').forEach(function (r) { r.classList.toggle('here', r.dataset.room === id); });
    planRooms.forEach(function (r) { r.classList.remove('lit'); });
    window.scrollTo(0, 0);
    if (moveFocus) view.querySelector('h1').focus({ preventScroll: true });
  }

  function route() {
    var id = location.hash.slice(1);
    if (id && !ROOMS[id]) id = '';
    if (isLocked(id)) {
      history.replaceState(null, '', location.pathname + (current ? '#' + current : ''));
      document.dispatchEvent(new Event('tp:locked'));
      return;
    }
    if (id === current) return;
    var first = current === null;
    var fromHome = current === '';
    current = id;
    if (!overlay.hidden) closeGame();
    document.dispatchEvent(new CustomEvent('tp:go', { detail: id }));

    var plan = $('plan');
    if (fromHome && id && document.body.classList.contains('has-3d')) {
      window.Walk.to(id, function () {
        if (current !== id) return;
        setTimeout(function () { if (current === id) enter(id); }, 260);
      });
      return;
    }
    if (fromHome && id && !reduceMotion && plan.animate) {
      var room = ROOMS[id];
      planRoom(id).classList.add('lit');
      window.Walk.to(id, function () {
        if (current !== id) return;
        plan.style.transformOrigin = (room.cx / 10) + '% ' + (room.cy / 6.2) + '%';
        plan.animate(
          [{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(2.3)', opacity: 0 }],
          { duration: 380, easing: 'cubic-bezier(.5,0,.75,.4)' }
        ).onfinish = function () { if (current === id) enter(id); };
        document.querySelector('.intro').animate([{ opacity: 1 }, { opacity: 0 }], { duration: 240 });
      });
      return;
    }
    enter(id, first);
  }

  function enter(id, first) {
    applyRoom(id, !first);
    if (!reduceMotion && !first) {
      $('view-' + (id || 'sanh')).animate([{ opacity: 0 }, { opacity: 1 }], { duration: 320, easing: 'ease-out' });
    }
  }

  window.addEventListener('hashchange', route);
  route();
  if (current === '' && !reduceMotion) document.body.classList.add('lights-on');
  else document.body.classList.add('lights-set');
})();
