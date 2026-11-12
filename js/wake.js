/* Trang X.M.A.S: nền đen, X.M.A.S đang ngủ. Gọi tên thì thức dậy, nghe và trả lời bằng tiếng Việt.
   Nghe: SpeechRecognition của trình duyệt (vi-VN). Nói: SpeechSynthesis với giọng tiếng Việt có sẵn trên máy. */
import * as THREE from 'three';
import { createMascot } from './mascot.js';

const HOME = 'https://thcphm.github.io/xuong-cua-thuc/';
const stageEl = document.getElementById('stage');
const touch = document.getElementById('touch');
const sayEl = document.getElementById('say');
const heardEl = document.getElementById('heard');
const hintEl = document.getElementById('hint');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Hình ---------- */
const renderer = new THREE.WebGLRenderer({ canvas: stageEl, antialias: true });
renderer.setPixelRatio(Math.min(2, devicePixelRatio));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.setClearColor('#000000', 1);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(24, 1, 0.1, 30);
scene.add(new THREE.HemisphereLight('#dbe7ff', '#27345a', 0.5));
const key = new THREE.DirectionalLight('#ffffff', 1.5);
key.position.set(2.5, 5, 6);
scene.add(key);
const rim = new THREE.DirectionalLight((window.SITE.mascot && window.SITE.mascot.glow) || '#5cffb0', 2.6);
rim.position.set(-4, 2, -3);
scene.add(rim);
const mascot = createMascot(window.SITE.mascot, renderer);
scene.add(mascot.group);

function fit() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  /* Màn hình dọc thì lùi máy quay để robot không tràn hai bên */
  const dist = Math.max(9, 5.2 / Math.max(0.4, w / h));
  camera.position.set(0, 1.2, dist);
  camera.lookAt(0, 1, 0);
  camera.updateProjectionMatrix();
}
fit();
addEventListener('resize', fit);

/* Ngủ thì tối, thức thì sáng dần */
const DIM = 0.32, BRIGHT = 1.1;
let exposure = DIM, exposureGoal = DIM;
let last = performance.now();
(function loop(now) {
  requestAnimationFrame(loop);
  if (document.hidden) { last = now; return; }
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  exposure += (exposureGoal - exposure) * (reduceMotion ? 1 : 1 - Math.exp(-dt * 3));
  renderer.toneMappingExposure = exposure;
  mascot.update(dt);
  renderer.render(scene, camera);
})(last);

/* ---------- Nói ---------- */
const synth = window.speechSynthesis || null;
let voice = null;
function pickVoice() {
  if (!synth) return;
  const list = synth.getVoices().filter((v) => /^vi(-|_|$)/i.test(v.lang));
  /* Ưu tiên giọng chạy ngay trên máy, sau đó tới giọng trực tuyến */
  voice = list.find((v) => v.localService) || list[0] || null;
}
pickVoice();
if (synth && synth.addEventListener) synth.addEventListener('voiceschanged', pickVoice);

/* Tiếng bíp điện tử trước mỗi câu, cho ra chất robot */
let audio = null;
function beep(freqs) {
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    freqs.forEach((f, i) => {
      const osc = audio.createOscillator(), gain = audio.createGain();
      const t = audio.currentTime + i * 0.09;
      osc.type = 'square';
      osc.frequency.value = f;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.05, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
      osc.connect(gain).connect(audio.destination);
      osc.start(t);
      osc.stop(t + 0.09);
    });
  } catch (e) {}
}

let speaking = false, turn = 0;
function speak(text, done) {
  sayEl.textContent = text;
  /* Mỗi câu một số thứ tự: hẹn giờ của câu cũ không được cắt ngang câu mới */
  const mine = ++turn;
  const finish = () => {
    if (!speaking || mine !== turn) return;
    speaking = false;
    mascot.talk(false);
    if (done) done();
    listen();
  };
  speaking = true;
  stopListening();
  mascot.talk(true);
  beep([880, 1320]);
  if (!synth) { setTimeout(finish, 1200 + text.length * 45); return; }
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'vi-VN';
  if (voice) u.voice = voice;
  /* Trầm và đều hơn giọng người một chút để nghe giống máy, nhưng vẫn rõ dấu tiếng Việt */
  u.pitch = 0.72;
  u.rate = 0.96;
  u.onend = finish;
  u.onerror = finish;
  synth.speak(u);
  /* Có máy không bao giờ báo đã nói xong: tự kết thúc sau một khoảng đủ dài */
  setTimeout(finish, 4000 + text.length * 110);
}

/* ---------- Nghe ---------- */
const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition || null;
let rec = null, wantListen = false, micOn = false, armed = false;
function listen() {
  if (!rec || !micOn || speaking) return;
  wantListen = true;
  try { rec.start(); } catch (e) {}
}
function stopListening() {
  wantListen = false;
  if (rec) { try { rec.abort(); } catch (e) {} }
}
function setupRecognition() {
  if (!Recognition) return false;
  rec = new Recognition();
  rec.lang = 'vi-VN';
  rec.continuous = true;
  rec.interimResults = false;
  rec.maxAlternatives = 3;
  rec.onresult = (e) => {
    const result = e.results[e.results.length - 1];
    if (!result.isFinal) return;
    const options = Array.from(result).map((alt) => alt.transcript.trim()).filter(Boolean);
    if (options.length) hear(options);
  };
  rec.onerror = (e) => {
    if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
      micOn = false;
      wantListen = false;
      hint('Micro đang bị chặn. Cho phép micro trong trình duyệt rồi chạm lại.');
    }
  };
  /* Trình duyệt tự ngắt sau một lúc im lặng: bật lại */
  rec.onend = () => { if (wantListen && !speaking) setTimeout(() => { if (wantListen && !speaking) { try { rec.start(); } catch (err) {} } }, 250); };
  return true;
}

function hint(text) {
  hintEl.textContent = text;
  hintEl.classList.toggle('quiet', !text);
}

/* ---------- Hiểu ---------- */
/* Bỏ dấu và viết thường để so khớp, vì máy nhận dạng viết mỗi lần một kiểu */
const plain = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
const has = (text, words) => words.some((w) => (' ' + text + ' ').includes(' ' + w + ' '));
/* Tên X.M.A.S qua máy nhận dạng tiếng Việt ra nhiều dạng khác nhau */
/* Bỏ dấu rồi thì "ích mát", "ích mạt" đều thành "ich mat"; "ích mợt", "ích một" thành "ich mot" */
const NAME = /\b(x m a s|xmax|(x|ex|ich|ic|ech|ec|et|is|it) ?(mas|mat|mot|mac|mut)|christmas|giang sinh|noel)\b/;
const WAKE = ['day di', 'thuc day', 'day thoi', 'day nao', 'day ngay'];

let awake = false, offered = false, sleepTimer = 0;
function restAfter(ms) {
  clearTimeout(sleepTimer);
  sleepTimer = setTimeout(() => { if (awake && !speaking) sleep(false); else if (awake) restAfter(ms); }, ms);
}
function greeting() {
  const h = new Date().getHours();
  return h < 11 ? 'Chào buổi sáng' : h < 14 ? 'Chào buổi trưa' : h < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';
}
function wake() {
  if (awake) return;
  awake = true;
  offered = false;
  exposureGoal = BRIGHT;
  mascot.idle();
  mascot.play('wave', 2.4);
  beep([660, 880, 1320]);
  hint('');
  speak(greeting() + ', Thức. Ngày hôm nay của bạn thế nào?');
  restAfter(60000);
}
function sleep(sayBye) {
  awake = false;
  offered = false;
  clearTimeout(sleepTimer);
  const down = () => { exposureGoal = DIM; mascot.play('sleep', 0); sayEl.textContent = ''; heardEl.textContent = ''; hint(micOn ? 'Gọi "X.M.A.S ơi" để đánh thức.' : 'Chạm vào màn hình để đánh thức.'); };
  if (sayBye) speak('Mình ngủ đây. Cần thì gọi mình nhé.', down); else down();
}
function goHome() {
  mascot.play('point', 3);
  speak('Được, mình đưa bạn tới Xưởng ngay.', () => { stopListening(); micOn = false; location.href = HOME; });
}

function hear(options) {
  heardEl.textContent = 'Nghe được: ' + options[0];
  const texts = options.map(plain);
  const any = (test) => texts.some(test);
  if (!awake) {
    if (any((t) => NAME.test(t) || has(t, WAKE))) wake();
    return;
  }
  restAfter(60000);
  /* "xuống" bỏ dấu cũng thành "xuong", nên cần thêm một từ chỉ việc dẫn đường */
  if (any((t) => /\bxuong\b/.test(t) && has(t, ['dan', 'den', 'toi', 'vao', 'mo', 've', 'dua', 'sang', 'qua']))) { goHome(); return; }
  const t = texts[0];
  if (has(t, ['ngu di', 'ngu ngon', 'tam biet', 'di ngu', 'nghi di'])) { sleep(true); return; }
  /* Lời mời chỉ có hiệu lực cho câu trả lời ngay sau đó, và chỉ nhận câu ngắn kiểu "có", "đi thôi" */
  const invited = offered && t.split(' ').length <= 4;
  offered = false;
  if (invited && has(t, ['co', 'u', 'um', 'ok', 'duoc', 'di', 'di thoi', 'dong y', 'muon'])) { goHome(); return; }
  if (invited && has(t, ['khong', 'thoi', 'chua', 'de sau'])) { mascot.play('think', 2); speak('Được. Mình ở đây, cần gì cứ gọi.'); return; }
  if (has(t, ['may gio', 'gio roi'])) {
    const d = new Date();
    speak('Bây giờ là ' + d.getHours() + ' giờ ' + (d.getMinutes() ? d.getMinutes() + ' phút.' : 'đúng.'));
    return;
  }
  if (has(t, ['cam on', 'cam on nhe', 'thank'])) { mascot.play('cheer', 1.2); speak('Không có gì. Mình luôn sẵn sàng.'); return; }
  if (has(t, ['ban la ai', 'la ai', 'ten gi'])) { speak('Mình là X.M.A.S, trợ lí tổng của Xưởng của Thức.'); return; }
  const good = has(t, ['vui', 'tot', 'tuyet', 'on', 'khoe', 'hanh phuc', 'thich', 'suon se', 'thuan loi']);
  const bad = has(t, ['met', 'buon', 'chan', 'te', 'stress', 'ap luc', 'kho', 'lo', 'duoi', 'nan', 'that vong']);
  const neutral = has(t, ['binh thuong', 'tam on', 'tam duoc', 'cung duoc', 'nhu moi ngay']);
  const negated = has(t, ['khong', 'chang', 'chua']);
  if (bad || (good && negated)) {
    offered = true;
    mascot.play('think', 2.5);
    speak('Vất vả cho bạn rồi. Nghỉ một chút nhé. Bạn có muốn mình dẫn tới Xưởng nghe nhạc không?');
    return;
  }
  if (good) {
    offered = true;
    mascot.play('cheer', 1.4);
    speak('Nghe vui quá. Mừng cho bạn. Bạn có muốn mình dẫn tới Xưởng không?');
    return;
  }
  if (neutral) {
    offered = true;
    speak('Một ngày bình yên cũng tốt. Bạn có muốn mình dẫn tới Xưởng không?');
    return;
  }
  mascot.play('think', 2);
  speak('Mình nghe rồi. Mình mới học được vài câu thôi. Bạn thử nói: dẫn tôi đến Xưởng.');
}

/* ---------- Bắt đầu ---------- */
mascot.play('sleep', 0);
touch.addEventListener('click', () => {
  if (!armed || (rec && !micOn && !awake)) {
    /* Lần chạm đầu (hoặc sau khi micro bị chặn): xin quyền micro và mở khóa âm thanh */
    armed = true;
    beep([440]);
    if (rec || setupRecognition()) {
      micOn = true;
      listen();
      touch.setAttribute('aria-label', 'Đánh thức X.M.A.S');
      hint('Gọi "X.M.A.S ơi" để đánh thức. Giọng nói được trình duyệt gửi đi để nhận dạng.');
      if (synth && !voice) heardEl.textContent = 'Máy này chưa có giọng đọc tiếng Việt, X.M.A.S có thể đọc không rõ dấu.';
      return;
    }
    hint('Trình duyệt này chưa nghe được giọng nói. Hãy mở bằng Chrome. Chạm lần nữa để đánh thức.');
    return;
  }
  if (!awake) wake();
});

/* Cho kiểm thử tự động */
window.__xmas = { state: () => ({ awake, micOn, speaking, offered, face: mascot.state() }), hear };
