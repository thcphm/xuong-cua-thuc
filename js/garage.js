/* Garage AI: năm bàn thử mô hình, tất cả chạy ngay trong trình duyệt. */
window.Garage = (function () {
  'use strict';
  const SAMPLES = 'https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/';
  const READY_KEY = 'tp-garage-ready';
  const $ = (id) => document.getElementById(id);
  function h(tag, props, ...kids) {
    const n = document.createElement(tag);
    Object.entries(props || {}).forEach(([k, v]) => {
      if (v == null || v === false) return;
      if (k === 'class') n.className = v;
      else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
      else if (k in n && k !== 'list') n[k] = v;
      else n.setAttribute(k, v);
    });
    n.append(...kids.flat().filter((x) => x != null && x !== false));
    return n;
  }
  let ready = {};
  try { ready = JSON.parse(localStorage.getItem(READY_KEY) || '{}'); } catch (e) { /* bỏ qua */ }
  const markReady = (m) => { ready[m] = 1; try { localStorage.setItem(READY_KEY, JSON.stringify(ready)); } catch (e) { /* bỏ qua */ } };

  const COCO = { person: 'người', bicycle: 'xe đạp', car: 'ô tô', motorcycle: 'xe máy', airplane: 'máy bay', bus: 'xe buýt', train: 'tàu hỏa', truck: 'xe tải', boat: 'thuyền', 'traffic light': 'đèn giao thông', 'fire hydrant': 'trụ cứu hỏa', 'stop sign': 'biển dừng', 'parking meter': 'đồng hồ đỗ xe', bench: 'ghế dài', bird: 'chim', cat: 'mèo', dog: 'chó', horse: 'ngựa', sheep: 'cừu', cow: 'bò', elephant: 'voi', bear: 'gấu', zebra: 'ngựa vằn', giraffe: 'hươu cao cổ', backpack: 'ba lô', umbrella: 'ô', handbag: 'túi xách', tie: 'cà vạt', suitcase: 'va li', frisbee: 'đĩa bay', skis: 'ván trượt tuyết', snowboard: 'ván tuyết', 'sports ball': 'quả bóng', kite: 'diều', 'baseball bat': 'gậy bóng chày', 'baseball glove': 'găng bóng chày', skateboard: 'ván trượt', surfboard: 'ván lướt sóng', 'tennis racket': 'vợt tennis', bottle: 'chai', 'wine glass': 'ly rượu', cup: 'cốc', fork: 'nĩa', knife: 'dao', spoon: 'thìa', bowl: 'bát', banana: 'chuối', apple: 'táo', sandwich: 'bánh mì kẹp', orange: 'cam', broccoli: 'súp lơ xanh', carrot: 'cà rốt', 'hot dog': 'xúc xích', pizza: 'pizza', donut: 'bánh vòng', cake: 'bánh ngọt', chair: 'ghế', couch: 'ghế sofa', 'potted plant': 'chậu cây', bed: 'giường', 'dining table': 'bàn ăn', toilet: 'bồn cầu', tv: 'ti vi', laptop: 'máy tính xách tay', mouse: 'chuột máy tính', remote: 'điều khiển', keyboard: 'bàn phím', 'cell phone': 'điện thoại', microwave: 'lò vi sóng', oven: 'lò nướng', toaster: 'máy nướng bánh', sink: 'bồn rửa', refrigerator: 'tủ lạnh', book: 'sách', clock: 'đồng hồ', vase: 'bình hoa', scissors: 'kéo', 'teddy bear': 'gấu bông', 'hair drier': 'máy sấy tóc', toothbrush: 'bàn chải' };

  /* Luồng chạy mô hình */
  let worker = null, jobId = 0;
  const handlers = new Map();
  function spawn() {
    worker = new Worker('js/ai-worker.js?v=20261110j', { type: 'module' });
    worker.onmessage = (e) => { const m = e.data, cb = handlers.get(m.id); if (m.type === 'progress') handlers.forEach((c) => c.progress && c.progress(m)); else if (cb) cb.on(m); };
    worker.onerror = (e) => { handlers.forEach((c) => c.on({ type: 'error', message: e.message || 'Không khởi động được trình chạy AI.' })); };
  }
  function stopWorker() {
    if (worker) worker.terminate();
    worker = null;
    handlers.forEach((c) => c.on({ type: 'stopped' }));
    handlers.clear();
  }
  function run(job, payload, transfer, ui) {
    if (!worker) spawn();
    const id = ++jobId;
    return new Promise((resolve, reject) => {
      handlers.set(id, {
        progress: ui.progress,
        on(m) {
          if (m.type === 'ready') ui.ready && ui.ready();
          else if (m.type === 'partial') ui.partial && ui.partial(m.text);
          else if (m.type === 'done') { handlers.delete(id); resolve(m.result); }
          else if (m.type === 'stopped') { handlers.delete(id); reject(new Error('stopped')); }
          else if (m.type === 'error') { handlers.delete(id); reject(new Error(m.message)); }
        }
      });
      worker.postMessage(Object.assign({ id, job }, payload), transfer || []);
    });
  }
  /* Khung trạng thái: thanh tải và nút dừng */
  function statusBar() {
    const bar = h('i'), text = h('span');
    const stop = h('button', { type: 'button', class: 'lab-reset', onclick: () => stopWorker() }, 'Dừng');
    const box = h('div', { class: 'ai-status', role: 'status', hidden: true }, h('div', { class: 'ai-bar' }, bar), h('div', { class: 'ai-line' }, text, stop));
    const files = new Map();
    return {
      node: box,
      start(msg) { files.clear(); box.hidden = false; bar.style.width = '0'; bar.parentElement.classList.remove('busy'); text.textContent = msg; },
      progress(m) {
        const d = m.data;
        if (d.status === 'progress' && d.total) files.set(d.file, [d.loaded, d.total]);
        let a = 0, b = 0;
        files.forEach(([l, t]) => { a += l; b += t; });
        if (b) { bar.style.width = Math.round(a / b * 100) + '%'; text.textContent = 'Đang tải mô hình ' + Math.round(a / 1e6) + ' / ' + Math.round(b / 1e6) + ' MB'; }
      },
      thinking(msg) { bar.parentElement.classList.add('busy'); bar.style.width = '100%'; text.textContent = msg; },
      end() { box.hidden = true; }
    };
  }
  function errorText(e) {
    if (e.message === 'stopped') return 'Đã dừng.';
    if (/memory|allocation/i.test(e.message)) return 'Máy không đủ bộ nhớ cho mô hình này. Đóng bớt tab rồi thử lại, hoặc dùng mô hình nhỏ hơn.';
    if (/fetch|network|load/i.test(e.message)) return 'Không tải được mô hình. Kiểm tra mạng rồi thử lại.';
    return 'Mô hình gặp lỗi: ' + e.message;
  }
  const actionLabel = (model, size, word) => (ready[model] ? word : 'Tải ' + size + ' MB và ' + word.toLowerCase());
  function workflow(btn, model, size, word, busy) {
    const status = statusBar();
    const paint = () => { btn.textContent = actionLabel(model, size, word); };
    paint();
    return {
      status,
      paint,
      async go(job, payload, transfer, extra) {
        btn.disabled = true;
        status.start(ready[model] ? 'Đang mở mô hình' : 'Đang chuẩn bị tải mô hình');
        try {
          return await run(job, payload, transfer, Object.assign({ progress: status.progress, ready: () => { markReady(model); paint(); status.thinking(busy); } }, extra));
        } finally { btn.disabled = false; status.end(); }
      }
    };
  }
  function pickerRow(accept, label, onFile, sampleLabel, onSample) {
    const file = h('input', { type: 'file', accept, hidden: true, onchange: () => { if (file.files[0]) onFile(file.files[0]); } });
    return h('div', { class: 'ai-pick' }, h('button', { type: 'button', class: 'ghost-btn', onclick: () => file.click() }, label), h('button', { type: 'button', class: 'ghost-btn', onclick: onSample }, sampleLabel), file);
  }

  const BENCHES = [
    { id: 'translate', name: 'Dịch Anh, Việt', about: 'Dịch câu chữ, không gửi lên máy chủ nào.', view: translateBench },
    { id: 'speech', name: 'Nghe thành chữ', about: 'Đổi giọng nói trong tệp ghi âm hoặc micro thành văn bản.', view: speechBench },
    { id: 'detect', name: 'Soi vật thể', about: 'Tìm và khoanh 80 loại đồ vật quen thuộc trong ảnh.', view: detectBench },
    { id: 'cutout', name: 'Tách nền chân dung', about: 'Giữ lại người, xóa nền, tải về ảnh PNG.', view: cutoutBench },
    { id: 'chat', name: 'Trò chuyện', about: 'Mô hình ngôn ngữ nhỏ chạy ngay trên máy bạn.', view: chatBench }
  ];

  function translateBench() {
    const DIRS = { en: { model: 'Xenova/opus-mt-en-vi', from: 'Tiếng Anh', to: 'Tiếng Việt' }, vi: { model: 'Xenova/opus-mt-vi-en', from: 'Tiếng Việt', to: 'Tiếng Anh' } };
    let dir = 'en', flow;
    const input = h('textarea', { class: 'ai-text', rows: 5, value: 'The stars are beautiful tonight. I want to learn how to build my own house.', 'aria-label': 'Văn bản cần dịch', maxLength: 2000 });
    const output = h('div', { class: 'ai-result', 'aria-live': 'polite' });
    const go = h('button', { type: 'button', class: 'play-btn' });
    const label = h('span', { class: 'ai-dir' });
    const swap = h('button', { type: 'button', class: 'ghost-btn', onclick: () => { dir = dir === 'en' ? 'vi' : 'en'; build(); } }, 'Đổi chiều');
    function build() { label.textContent = DIRS[dir].from + ' sang ' + DIRS[dir].to; flow = workflow(go, DIRS[dir].model, 101, 'Dịch', 'Đang dịch'); holder.replaceChildren(flow.status.node); }
    const holder = h('div');
    go.addEventListener('click', async () => {
      const text = input.value.trim();
      if (!text) { output.textContent = 'Nhập nội dung cần dịch.'; return; }
      output.textContent = '';
      try { output.textContent = await flow.go('translate', { model: DIRS[dir].model, text }, null, { partial: (t) => { output.textContent = t; } }); }
      catch (e) { output.textContent = errorText(e); }
    });
    build();
    return [h('div', { class: 'ai-row' }, label, swap), input, h('div', { class: 'ai-row' }, go), holder, output];
  }
  function decode(buffer) {
    const ctx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
    return ctx.decodeAudioData(buffer).then((a) => {
      ctx.close();
      if (a.numberOfChannels < 2) return a.getChannelData(0).slice();
      const l = a.getChannelData(0), r = a.getChannelData(1), m = new Float32Array(l.length);
      for (let i = 0; i < l.length; i++) m[i] = (l[i] + r[i]) / 2;
      return m;
    });
  }
  function speechBench() {
    const MODEL = 'Xenova/whisper-base';
    let audio = null;
    const lang = h('select', { 'aria-label': 'Ngôn ngữ' }, [['vi', 'Tiếng Việt'], ['en', 'Tiếng Anh'], ['auto', 'Tự nhận biết']].map(([v, t]) => h('option', { value: v }, t)));
    const player = h('audio', { controls: true, hidden: true });
    const info = h('p', { class: 'ai-dim', role: 'status' }, 'Chọn tệp ghi âm, thu từ micro hoặc dùng mẫu.');
    const output = h('div', { class: 'ai-result', 'aria-live': 'polite' });
    const go = h('button', { type: 'button', class: 'play-btn', disabled: true });
    const flow = workflow(go, MODEL, 77, 'Chép lời', 'Đang nghe và chép lời');
    async function take(buffer, name, blob) {
      info.textContent = 'Đang đọc âm thanh';
      try {
        audio = await decode(buffer);
        player.src = URL.createObjectURL(blob);
        player.hidden = false;
        info.textContent = name + ', dài ' + Math.round(audio.length / 16000) + ' giây.';
        go.disabled = false;
      } catch (e) { info.textContent = 'Không đọc được tệp âm thanh này.'; }
    }
    const rec = { media: null };
    const mic = h('button', { type: 'button', class: 'ghost-btn', onclick: async () => {
      if (rec.media) { rec.media.stop(); return; }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const chunks = [], media = new MediaRecorder(stream);
        rec.media = media;
        media.ondataavailable = (e) => chunks.push(e.data);
        media.onstop = async () => {
          stream.getTracks().forEach((t) => t.stop());
          rec.media = null; mic.textContent = 'Thu từ micro';
          const blob = new Blob(chunks, { type: media.mimeType });
          take(await blob.arrayBuffer(), 'Bản ghi vừa thu', blob);
        };
        media.start();
        mic.textContent = 'Dừng thu';
        info.textContent = 'Đang thu, nói xong bấm Dừng thu.';
      } catch (e) { info.textContent = 'Trình duyệt chưa được phép dùng micro.'; }
    } }, 'Thu từ micro');
    const picker = pickerRow('audio/*', 'Chọn tệp ghi âm', async (f) => take(await f.arrayBuffer(), f.name, f), 'Dùng mẫu tiếng Anh', async () => {
      info.textContent = 'Đang tải mẫu';
      try { const blob = await (await fetch(SAMPLES + 'jfk.wav')).blob(); lang.value = 'en'; take(await blob.arrayBuffer(), 'Mẫu bài phát biểu', blob); }
      catch (e) { info.textContent = 'Không tải được mẫu.'; }
    });
    picker.append(mic);
    go.addEventListener('click', async () => {
      output.textContent = '';
      const copy = audio.slice();
      try { output.textContent = (await flow.go('speech', { model: MODEL, audio: copy, language: lang.value }, [copy.buffer])) || 'Không nghe được lời nói nào.'; }
      catch (e) { output.textContent = errorText(e); }
    });
    return [picker, h('div', { class: 'ai-row' }, lang), player, info, h('div', { class: 'ai-row' }, go), flow.status.node, output];
  }
  function imageStage() {
    const img = h('img', { alt: 'Ảnh đã chọn', crossOrigin: 'anonymous' });
    const stage = h('div', { class: 'ai-stage', hidden: true }, img);
    return { img, stage };
  }
  function detectBench() {
    const MODEL = 'Xenova/yolos-tiny';
    let url = null;
    const { img, stage } = imageStage();
    const output = h('div', { class: 'ai-result', 'aria-live': 'polite' });
    const go = h('button', { type: 'button', class: 'play-btn', disabled: true });
    const flow = workflow(go, MODEL, 10, 'Soi ảnh', 'Đang tìm vật thể');
    const clear = () => stage.querySelectorAll('.ai-box').forEach((b) => b.remove());
    const take = (src) => { url = src; img.src = src; stage.hidden = false; clear(); output.textContent = ''; go.disabled = false; };
    const picker = pickerRow('image/*', 'Chọn ảnh', (f) => take(URL.createObjectURL(f)), 'Dùng ảnh mẫu', () => take(SAMPLES + 'cats.jpg'));
    go.addEventListener('click', async () => {
      clear(); output.textContent = '';
      try {
        const found = await flow.go('detect', { model: MODEL, url });
        found.sort((a, b) => b.score - a.score).forEach((o) => {
          const W = img.naturalWidth, H = img.naturalHeight, b = o.box;
          stage.append(h('div', { class: 'ai-box', style: 'left:' + b.xmin / W * 100 + '%;top:' + b.ymin / H * 100 + '%;width:' + (b.xmax - b.xmin) / W * 100 + '%;height:' + (b.ymax - b.ymin) / H * 100 + '%' }, h('span', null, (COCO[o.label] || o.label) + ' ' + Math.round(o.score * 100) + '%')));
        });
        output.textContent = found.length ? 'Tìm thấy ' + found.length + ' vật thể. Mô hình nhỏ này đôi khi nhận nhầm.' : 'Không tìm thấy vật thể nào đủ chắc chắn.';
      } catch (e) { output.textContent = errorText(e); }
    });
    return [picker, stage, h('div', { class: 'ai-row' }, go), flow.status.node, output];
  }
  function cutoutBench() {
    const MODEL = 'Xenova/modnet';
    let url = null;
    const { img, stage } = imageStage();
    const canvas = h('canvas', { class: 'ai-cut', hidden: true });
    const output = h('div', { class: 'ai-result', 'aria-live': 'polite' });
    const go = h('button', { type: 'button', class: 'play-btn', disabled: true });
    const save = h('a', { class: 'ghost-btn', download: 'tach-nen.png', hidden: true }, 'Tải ảnh PNG');
    const flow = workflow(go, MODEL, 7, 'Tách nền', 'Đang tách nền');
    const take = (src) => { url = src; img.src = src; stage.hidden = false; canvas.hidden = true; save.hidden = true; output.textContent = ''; go.disabled = false; };
    const picker = pickerRow('image/*', 'Chọn ảnh chân dung', (f) => take(URL.createObjectURL(f)), 'Dùng ảnh mẫu', () => take(SAMPLES + 'portrait-of-woman_small.jpg'));
    go.addEventListener('click', async () => {
      output.textContent = '';
      try {
        const mask = await flow.go('cutout', { model: MODEL, url });
        await img.decode();
        canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
        const g = canvas.getContext('2d');
        g.drawImage(img, 0, 0);
        const scratch = h('canvas', { width: mask.width, height: mask.height }), sg = scratch.getContext('2d'), data = sg.createImageData(mask.width, mask.height);
        for (let i = 0; i < mask.width * mask.height; i++) { data.data[i * 4 + 3] = mask.data[i * mask.channels]; }
        sg.putImageData(data, 0, 0);
        g.globalCompositeOperation = 'destination-in';
        g.drawImage(scratch, 0, 0, canvas.width, canvas.height);
        g.globalCompositeOperation = 'source-over';
        stage.hidden = true; canvas.hidden = false;
        canvas.toBlob((b) => { save.href = URL.createObjectURL(b); save.hidden = false; });
      } catch (e) { output.textContent = errorText(e); }
    });
    return [picker, stage, canvas, h('div', { class: 'ai-row' }, go, save), flow.status.node, output];
  }
  function chatBench() {
    const MODELS = {
      small: { id: 'HuggingFaceTB/SmolLM2-135M-Instruct', label: 'SmolLM2, nhỏ và nhanh, chủ yếu tiếng Anh', gpu: ['q4f16', 118], cpu: ['q8', 137] },
      big: { id: 'onnx-community/Qwen2.5-0.5B-Instruct', label: 'Qwen2.5 0.5B, hiểu tiếng Việt khá hơn, rất nặng', gpu: ['q4f16', 483], cpu: ['q8', 512] }
    };
    let key = 'small', flow, device = 'wasm', history = [];
    const gpuCheck = (async () => { try { const a = navigator.gpu && await navigator.gpu.requestAdapter(); if (a) device = 'webgpu'; } catch (e) { /* dùng CPU */ } })();
    const pick = h('select', { 'aria-label': 'Chọn mô hình', onchange: () => { key = pick.value; history = []; log.replaceChildren(); paint(); } }, Object.entries(MODELS).map(([v, m]) => h('option', { value: v }, m.label)));
    const log = h('div', { class: 'ai-chat', 'aria-live': 'polite' });
    const input = h('textarea', { class: 'ai-text', rows: 2, placeholder: 'Hỏi điều gì đó...', 'aria-label': 'Câu hỏi', maxLength: 800 });
    const go = h('button', { type: 'submit', class: 'play-btn' });
    const holder = h('div');
    const note = h('p', { class: 'ai-dim' });
    function paint() {
      const m = MODELS[key], [, size] = device === 'webgpu' ? m.gpu : m.cpu;
      flow = workflow(go, m.id, size, 'Gửi', 'Đang nghĩ');
      holder.replaceChildren(flow.status.node);
      note.textContent = (device === 'webgpu' ? 'Đang dùng card đồ họa qua WebGPU. ' : 'Máy không có WebGPU nên chạy bằng CPU, sẽ khá chậm. ') + 'Mô hình nhỏ dễ trả lời sai, đừng tin như nguồn tham khảo.';
    }
    gpuCheck.then(paint);
    const form = h('form', { class: 'ai-chat-form', onsubmit: async (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text || go.disabled) return;
      await gpuCheck;
      input.value = '';
      log.append(h('p', { class: 'ai-you' }, text));
      const reply = h('p', { class: 'ai-bot' });
      log.append(reply);
      history.push({ role: 'user', content: text });
      const m = MODELS[key], [dtype] = device === 'webgpu' ? m.gpu : m.cpu;
      try {
        const answer = await flow.go('chat', { model: m.id, messages: history.slice(-6), device, dtype }, null, { partial: (t) => { reply.textContent = t; log.scrollTop = log.scrollHeight; } });
        reply.textContent = answer;
        history.push({ role: 'assistant', content: answer });
      } catch (x) { reply.textContent = errorText(x); history.pop(); }
    } }, input, go);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); } });
    paint();
    return [h('div', { class: 'ai-row' }, pick), note, log, form, holder];
  }

  let current = 'translate';
  const views = {};
  function render() {
    $('garageBenches').replaceChildren(...BENCHES.map((b) => h('button', { type: 'button', class: 'ai-bench' + (b.id === current ? ' on' : ''), 'aria-pressed': String(b.id === current), onclick: () => { current = b.id; render(); } }, h('b', null, b.name), h('span', null, b.about))));
    const bench = BENCHES.find((b) => b.id === current);
    if (!views[current]) views[current] = h('div', { class: 'ai-panel' }, h('h2', null, bench.name), bench.view());
    $('garageBody').replaceChildren(views[current]);
  }
  return {
    init() {
      render();
      $('garageClear').addEventListener('click', async () => {
        if (!confirm('Xóa mọi mô hình đã tải khỏi trình duyệt? Lần sau dùng phải tải lại.')) return;
        stopWorker();
        await caches.delete('transformers-cache');
        ready = {};
        try { localStorage.removeItem(READY_KEY); } catch (e) { /* bỏ qua */ }
        Object.keys(views).forEach((k) => delete views[k]);
        render();
      });
    }
  };
})();
