/* Trình phát của Phòng Nhạc: phát bằng YouTube IFrame Player API,
   tìm kiếm bằng YouTube Data API v3 khi đã có API key trong data/site.js. */
window.Music = (function () {
  var cfg = window.SITE.music;
  var state = { index: -1, playing: false, volume: 0.7 };
  var queue = [], listeners = [];
  var player = null, ready = false, loading = false, pending = false, autoplayCheck = 0;
  var CACHE_KEY = 'xuong-cua-thuc.youtube.', CACHE_MS = 12 * 3600 * 1000;

  function current() { return queue[state.index]; }
  function emit() { listeners.forEach(function (fn) { fn(state, current()); }); }

  function onReady() {
    ready = true;
    player.setVolume(Math.round(state.volume * 100));
    if (pending) { pending = false; start(); }
  }
  function onStateChange(e) {
    var t = current();
    if (e.data === 1) {
      state.playing = true;
      clearTimeout(autoplayCheck);
      if (t && t.auto) {
        var info = player.getVideoData();
        if (info.title) { t.title = info.title; t.channel = info.author; t.auto = false; }
      }
      emit();
    } else if (e.data === 2) {
      state.playing = false;
      emit();
    } else if (e.data === 0) {
      next();
    }
  }
  function onError() {
    var t = current();
    if (t) {
      t.blocked = true;
      document.dispatchEvent(new CustomEvent('tp:yt-error', { detail: t }));
    }
    if (queue.some(function (x) { return !x.blocked; })) next();
    else { state.playing = false; emit(); }
  }

  function createPlayer() {
    if (player) return;
    player = new window.YT.Player('ytPlayer', {
      host: 'https://www.youtube-nocookie.com',
      width: '100%',
      height: '100%',
      playerVars: { playsinline: 1, rel: 0, origin: location.origin },
      events: { onReady: onReady, onStateChange: onStateChange, onError: onError }
    });
  }
  function prepare() {
    if (player || loading) return;
    if (window.YT && window.YT.Player) return createPlayer();
    loading = true;
    window.onYouTubeIframeAPIReady = createPlayer;
    var script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    document.head.append(script);
  }

  function start() {
    var t = current();
    if (!t) return;
    if (!ready) { pending = true; prepare(); return; }
    player.loadVideoById(t.id);
    clearTimeout(autoplayCheck);
    /* Trình duyệt có thể chặn tự phát: trả nút về Phát để người xem bấm lại */
    autoplayCheck = setTimeout(function () {
      var s = player.getPlayerState();
      if (s !== 1 && s !== 3) { state.playing = false; emit(); }
    }, 4000);
  }
  function play(i) {
    if (!queue[i]) return;
    state.index = i;
    state.playing = true;
    start();
    emit();
  }
  function step(by) {
    if (!queue.length) return;
    var i = state.index;
    for (var n = 0; n < queue.length; n++) {
      i = (i + by + queue.length) % queue.length;
      if (!queue[i].blocked) return play(i);
    }
  }
  function next() { step(1); }
  function pause() {
    if (!state.playing) return;
    state.playing = false;
    clearTimeout(autoplayCheck);
    if (ready) player.pauseVideo();
    pending = false;
    emit();
  }
  function resume() {
    if (state.index < 0) return play(0);
    if (state.playing) return;
    state.playing = true;
    if (ready) player.playVideo(); else start();
    emit();
  }

  function decode(text) {
    return new DOMParser().parseFromString(text, 'text/html').documentElement.textContent;
  }
  function readCache(q) {
    try {
      var saved = JSON.parse(localStorage.getItem(CACHE_KEY + q));
      if (saved && Date.now() - saved.at < CACHE_MS) return saved.items;
    } catch (e) {}
    return null;
  }
  function writeCache(q, items) {
    try { localStorage.setItem(CACHE_KEY + q, JSON.stringify({ at: Date.now(), items: items })); } catch (e) {}
  }

  /* Trả về { items } hoặc { error: 'quota' | 'key' | 'network' } */
  function request(url, cacheKey, toItems) {
    var cached = readCache(cacheKey);
    if (cached) return Promise.resolve({ items: cached });
    return fetch(url + '&key=' + encodeURIComponent(cfg.apiKey)).then(function (res) {
      return res.json().then(function (body) {
        if (!res.ok) {
          var reason = body.error && body.error.errors && body.error.errors[0] ? body.error.errors[0].reason : '';
          return { error: /quota|dailyLimit|rateLimit/i.test(reason) ? 'quota' : res.status === 400 || res.status === 403 ? 'key' : 'network' };
        }
        var items = toItems(body.items || []);
        writeCache(cacheKey, items);
        return { items: items };
      });
    }).catch(function () { return { error: 'network' }; });
  }
  function search(query) {
    var url = 'https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoEmbeddable=true&videoCategoryId=10&maxResults=15'
      + '&regionCode=' + encodeURIComponent(cfg.region) + '&q=' + encodeURIComponent(query);
    return request(url, query.toLowerCase(), function (list) {
      return list.map(function (it) {
        return { id: it.id.videoId, title: decode(it.snippet.title), channel: decode(it.snippet.channelTitle) };
      });
    });
  }
  /* Bảng video nhạc phổ biến theo quốc gia; tốn ít hạn mức hơn tìm kiếm */
  function trending() {
    var url = 'https://www.googleapis.com/youtube/v3/videos?part=snippet,status&chart=mostPopular&videoCategoryId=10&maxResults=25'
      + '&regionCode=' + encodeURIComponent(cfg.region);
    return request(url, 'chart:' + cfg.region, function (list) {
      return list.filter(function (it) { return it.status.embeddable; }).slice(0, 15).map(function (it) {
        return { id: it.id, title: it.snippet.title, channel: it.snippet.channelTitle };
      });
    });
  }

  function parseLink(text) {
    var m = text.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/);
    return m ? m[1] : null;
  }

  return {
    state: state,
    prepare: prepare,
    canSearch: function () { return !!cfg.apiKey; },
    search: search,
    trending: trending,
    parseLink: parseLink,
    current: current,
    /* Bản sao để đánh dấu video bị chặn không làm hỏng danh sách đề xuất */
    playFrom: function (list, i) {
      queue = list.map(function (x) { return Object.assign({}, x); });
      play(i);
    },
    setDefault: function (list) {
      if (state.index < 0) queue = list.map(function (x) { return Object.assign({}, x); });
    },
    pause: pause,
    resume: resume,
    toggle: function () { if (state.playing) pause(); else resume(); },
    next: next,
    prev: function () { step(-1); },
    setVolume: function (value) {
      state.volume = value;
      if (ready) player.setVolume(Math.round(value * 100));
    },
    subscribe: function (fn) { listeners.push(fn); },
    /* YouTube không cho đọc dữ liệu âm thanh, nên nhịp loa 3D là nhịp mô phỏng */
    levels: function (out) {
      var v = Math.pow(Math.max(0, Math.sin(performance.now() / 1000 * Math.PI * 4)), 2) * 200;
      out[3] = out[6] = out[10] = v;
      return true;
    }
  };
})();
