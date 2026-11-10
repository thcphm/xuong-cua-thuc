/* Trợ lí T.O.M ở góc màn hình: nhìn theo chuột, nói chuyện, dẫn đường trong nhà. */
import * as THREE from 'three';
import { createMascot } from './mascot.js';

const KEY = 'nha-cua-tp.guide.v1';
let seen = { tour: false, rooms: {}, hidden: false };
try { seen = Object.assign(seen, JSON.parse(localStorage.getItem(KEY)) || {}); } catch (e) {}
const remember = () => { try { localStorage.setItem(KEY, JSON.stringify(seen)); } catch (e) {} };

const guide = document.getElementById('guide');
const bubble = document.getElementById('bubble');
const bubbleText = document.getElementById('bubbleText');
const bubbleActions = document.getElementById('bubbleActions');
const buddy = document.getElementById('buddy');
const callTP = document.getElementById('callTP');
/* Bấm vào đồ vật 3D thì mascot phản ứng */
document.addEventListener('tp:poke', () => { if (mascot.state() === 'idle') mascot.play('cheer', 0.9); });
const canvas = document.getElementById('buddyCanvas');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const Music = window.Music;

const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
renderer.setPixelRatio(Math.min(2, devicePixelRatio));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(24, 0.8, 0.1, 30);
camera.position.set(0, 1.28, 6.6);
camera.lookAt(0, 1.08, 0);
scene.add(new THREE.HemisphereLight('#dbe7ff', '#27345a', 0.5));
const key = new THREE.DirectionalLight('#ffffff', 1.5);
key.position.set(2.5, 5, 6);
key.castShadow = true;
key.shadow.mapSize.set(1024, 1024);
key.shadow.radius = 6;
key.shadow.bias = -0.0008;
key.shadow.normalBias = 0.02;
scene.add(key);
const rim = new THREE.DirectionalLight('#4fdcff', 2.6);
rim.position.set(-4, 2, -3);
scene.add(rim);

const mascot = createMascot(window.SITE.mascot, renderer);
scene.add(mascot.group);

function fit() {
  const box = canvas.getBoundingClientRect();
  if (!box.width || !box.height) return;
  renderer.setSize(box.width, box.height, false);
  camera.aspect = box.width / box.height;
  camera.updateProjectionMatrix();
}
fit();
addEventListener('resize', fit);

addEventListener('pointermove', (e) => {
  const box = canvas.getBoundingClientRect();
  const x = (e.clientX - (box.left + box.width / 2)) / innerWidth * 2.4;
  const y = (e.clientY - (box.top + box.height * 0.3)) / innerHeight * 2.4;
  mascot.look(Math.max(-1, Math.min(1, x)), Math.max(-1, Math.min(1, y)));
});

let last = performance.now();
(function loop(now) {
  requestAnimationFrame(loop);
  if (document.hidden || seen.hidden || !canvas.width || document.body.classList.contains('in-game')) { last = now; return; }
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  mascot.update(dt);
  renderer.render(scene, camera);
})(last);

/* Lời thoại */
let typing = 0, hideTimer = 0, spotted = null;
function spot(selector) {
  if (spotted) spotted.classList.remove('tp-spot');
  spotted = selector ? document.querySelector(selector) : null;
  if (spotted) spotted.classList.add('tp-spot');
}
function hush() {
  clearTimeout(hideTimer);
  clearInterval(typing);
  bubble.hidden = true;
  mascot.talk(false);
  spot(null);
}
/* Đã đăng nhập thì gọi bằng tên tài khoản thay cho "bạn" */
const person = window.Session.name;
const personal = (text) => (person ? text.replace(/(^|[^\p{L}])[Bb]ạn(?![\p{L}])/gu, '$1' + person) : text);
function say(rawText, { actions = [], anim = 'idle', target = null, hold = 7000 } = {}) {
  if (seen.hidden) return;
  const text = personal(rawText);
  clearTimeout(hideTimer);
  clearInterval(typing);
  bubble.hidden = false;
  bubbleActions.replaceChildren();
  spot(target);
  if (anim !== 'idle') mascot.play(anim, anim === 'wave' ? 1.8 : 2.6);
  actions.forEach((action, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = i === 0 ? 'b-main' : 'b-alt';
    b.textContent = action.label;
    b.addEventListener('click', action.run);
    bubbleActions.append(b);
  });
  if (reduceMotion) {
    bubbleText.textContent = text;
  } else {
    let n = 0;
    bubbleText.textContent = '';
    mascot.talk(true);
    typing = setInterval(() => {
      n += 2;
      bubbleText.textContent = text.slice(0, n);
      if (n >= text.length) { clearInterval(typing); mascot.talk(false); }
    }, 26);
  }
  if (!actions.length && hold) hideTimer = setTimeout(hush, hold);
}

const ROOM_NAMES = { nhac: 'Phòng Nhạc', sach: 'Phòng Sách', hoc: 'Phòng Học', game: 'Phòng Giải Trí', cong: 'Phòng Công Nghệ', garage: 'Garage AI', san: 'Sân Thượng', vuon: 'Sân Vườn', ham: 'Phòng Thực Nghiệm' };
const TIPS = {
  '': { text: 'Bấm vào một phòng, mình sẽ đi vào trước. Kéo chuột để xoay căn nhà.', target: '#roomList' },
  nhac: { text: 'Gõ tên bài, dán link YouTube hoặc chọn thể loại. Sang phòng khác nhạc vẫn chạy ở khung nhỏ.', target: '#ytForm', anim: 'point' },
  sach: { text: 'Bấm một tủ sách để xem sách tiêu biểu, hoặc tìm theo tên sách, tác giả, xuất xứ.', target: '#libForm', anim: 'point' },
  game: { text: matchMedia('(pointer: coarse)').matches ? 'Game này cần bàn phím. Mở xưởng trên máy tính để chơi nhé.' : 'Bấm vào máy arcade để chơi game Thức tự code. Muốn thoát thì bấm Ra khỏi game ở mép trái.', target: '#featuredGame .play-btn', anim: 'point' },
  hoc: { text: 'Kéo nút tròn trên đồng hồ để đặt số phút. Thanh dưới cùng bật thêm âm nền, ghi chú, flashcard. Xong một phiên được một sao.', target: '#toolbar', anim: 'point' },
  cong: { text: 'Chọn ngôn ngữ, rồi vào tab Thực hành để viết code ngay trên trang.', target: '#labLangs', anim: 'point' },
  garage: { text: 'Chọn một bàn bên trái. Lần đầu cần tải mô hình, sau đó chạy ngay trên máy bạn.', target: '#garageBenches', anim: 'point' },
  san: { text: 'Đây là bầu trời thật lúc này. Kéo để nhìn quanh, bấm vào một ngôi sao để xem nó là ai.', target: '#skyFind', anim: 'point' },
  ham: { text: 'Đây là tầng hầm, rộng bằng cả tầng chính. Kéo chuột để nhìn quanh phòng. Có bốn khu: tủ trưng bày, trạm của mình, bàn thí nghiệm và bảng lộ trình.', target: '#view-ham h1' },
  vuon: { text: 'Bấm vào một cây để xem thông tin. Cây nào khát thì tưới, nhưng đừng tưới quá tay.', target: '#gardenList', anim: 'point' }
};
const OPEN_ROOMS = Object.keys(ROOM_NAMES).filter((id) => !(window.SITE.lockedRooms || []).includes(id));
const room = () => document.body.dataset.room || '';
const go = (id) => () => { hush(); location.hash = id; };

function menu() {
  say('Mình giúp gì cho bạn?', {
    anim: 'wave',
    actions: [
      { label: 'Fact hôm nay', run: fact },
      { label: 'Thời tiết hôm nay', run: weatherMenu },
      { label: 'Đi tới phòng', run: rooms },
      { label: 'Mẹo ở đây', run: () => tip() },
      { label: 'Cất robot', run: stow }
    ]
  });
}
function rooms() {
  const here = room();
  const actions = OPEN_ROOMS.filter((id) => id !== here).map((id) => ({ label: ROOM_NAMES[id], run: go(id) }));
  actions.push({ label: 'Quay lại', run: menu });
  say('Bạn muốn đi đâu?', { actions, anim: 'point' });
}

/* Fact hôm nay: mỗi ngày một câu, cả ngày hỏi lại vẫn ra đúng câu đó */
function fact() {
  const list = window.FACTS || [];
  if (!list.length) { say('Hôm nay mình chưa có fact nào.', { anim: 'think' }); return; }
  const now = new Date();
  const day = Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86400000);
  say('Fact hôm nay: ' + list[day % list.length], { anim: 'think', actions: [{ label: 'Hay đó', run: hush }, { label: 'Quay lại', run: menu }] });
}

/* Thời tiết hôm nay, lấy từ Open-Meteo. Không gửi thông tin gì của người dùng, chỉ gửi toạ độ thành phố. */
const CITIES = [
  { name: 'TP. Hồ Chí Minh', lat: 10.82, lon: 106.63 },
  { name: 'Hà Nội', lat: 21.03, lon: 105.85 },
  { name: 'Đà Nẵng', lat: 16.05, lon: 108.21 }
];
const SKY = [
  [[0], 'trời quang'], [[1], 'trời ít mây'], [[2], 'trời có mây'], [[3], 'trời nhiều mây'],
  [[45, 48], 'có sương mù'], [[51, 53, 55, 56, 57], 'mưa phùn'], [[61, 80], 'mưa nhỏ'], [[63, 81], 'mưa vừa'],
  [[65, 82], 'mưa to'], [[66, 67], 'mưa lạnh'], [[71, 73, 75, 77, 85, 86], 'có tuyết'], [[95, 96, 99], 'có dông']
];
const skyText = (code) => { const hit = SKY.find(([codes]) => codes.includes(code)); return hit ? hit[1] : 'thời tiết khó đoán'; };
const weatherCache = {};
function weatherMenu() {
  const actions = CITIES.map((city) => ({ label: city.name, run: () => weather(city) }));
  actions.push({ label: 'Quay lại', run: menu });
  say('Bạn muốn xem thời tiết ở đâu?', { actions, anim: 'point' });
}
function weather(city) {
  const again = [{ label: 'Thành phố khác', run: weatherMenu }, { label: 'Xong', run: hush }];
  const tell = (d) => say(
    city.name + ' lúc này ' + Math.round(d.current.temperature_2m) + ' độ, ' + skyText(d.current.weather_code) +
    '. Hôm nay thấp nhất ' + Math.round(d.daily.temperature_2m_min[0]) + ' độ, cao nhất ' + Math.round(d.daily.temperature_2m_max[0]) +
    ' độ, khả năng mưa ' + Math.round(d.daily.precipitation_probability_max[0]) + '%. Nguồn: Open-Meteo.',
    { anim: 'think', actions: again }
  );
  const kept = weatherCache[city.name];
  if (kept && Date.now() - kept.at < 30 * 60000) { tell(kept.data); return; }
  say('Để mình xem thời tiết ở ' + city.name + '...', { anim: 'think', hold: 0 });
  const url = 'https://api.open-meteo.com/v1/forecast?latitude=' + city.lat + '&longitude=' + city.lon +
    '&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia%2FBangkok&forecast_days=1';
  fetch(url)
    .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then((data) => { weatherCache[city.name] = { at: Date.now(), data }; tell(data); })
    .catch(() => say('Mình chưa lấy được thời tiết. Kiểm tra mạng rồi thử lại nhé.', { anim: 'think', actions: [{ label: 'Thử lại', run: () => weather(city) }, { label: 'Thôi', run: hush }] }));
}
function tip() {
  const t = TIPS[room()];
  say(t.text, { target: t.target, anim: t.anim || 'think', hold: 11000 });
}
function stow() {
  hush();
  seen.hidden = true;
  remember();
  guide.hidden = true;
  callTP.hidden = false;
}
callTP.addEventListener('click', () => {
  seen.hidden = false;
  remember();
  guide.hidden = false;
  callTP.hidden = true;
  fit();
  say('Có mình đây.', { anim: 'cheer' });
});
buddy.addEventListener('click', () => { if (bubble.hidden) menu(); else hush(); });
buddy.addEventListener('pointerenter', () => { if (mascot.state() === 'idle') mascot.play('wave', 1.2); });

/* Tour lần đầu */
function tour() {
  const finish = () => { seen.tour = true; remember(); };
  const step3 = () => say('Bạn vào phòng nào trước?', {
    anim: 'cheer',
    target: '#roomList',
    actions: OPEN_ROOMS.map((id) => ({ label: ROOM_NAMES[id], run: () => { finish(); go(id)(); } }))
  });
  const step2 = () => say('Bấm vào một phòng, mình sẽ đi vào trước. Kéo chuột để xoay căn nhà.', {
    anim: 'point',
    actions: [{ label: 'Tiếp', run: step3 }, { label: 'Bỏ qua', run: () => { finish(); hush(); } }]
  });
  const account = () => say('Bạn có thể dùng ngay với tư cách khách, nhưng tiến độ sẽ không được lưu. Đăng ký hoặc đăng nhập để lưu lại và dùng trên mọi máy.', {
    anim: 'point',
    target: '.session-home',
    actions: [
      { label: 'Dùng như khách', run: step2 },
      { label: 'Đăng ký', run: () => { finish(); hush(); window.Session.open('new'); } },
      { label: 'Đăng nhập', run: () => { finish(); hush(); window.Session.open('login'); } }
    ]
  });
  say('Chào bạn, mình là T.O.M, viết tắt của Technical Operations Machine, trợ lí của Xưởng của Thức. Đây là căn nhà 3D của Thức: nghe nhạc, đọc sách, học code, thử AI, ngắm sao, chăm vườn và chơi game.', {
    anim: 'wave',
    actions: [{ label: 'Tiếp', run: person ? step2 : account }, { label: 'Tự đi', run: () => { finish(); hush(); } }]
  });
}

let previousRoom = null;
function roomChanged() {
  const id = room();
  if (id === previousRoom) return;
  previousRoom = id;
  hush();
  if (id && !seen.rooms[id]) {
    seen.rooms[id] = true;
    remember();
    setTimeout(() => { if (room() === id) tip(); }, 750);
  }
}
new MutationObserver(roomChanged).observe(document.body, { attributes: true, attributeFilter: ['data-room'] });

/* Phản ứng với việc bạn làm */
let wasPlaying = false;
Music.subscribe((state, track) => {
  if (state.playing && !wasPlaying) say('Đang phát ' + track.title + '.', { hold: 3500 });
  wasPlaying = state.playing;
  if (state.playing) mascot.play('dance', 0);
  else if (mascot.state() === 'dance') mascot.idle();
});
document.addEventListener('tp:lab-solved', (e) => say('Chuẩn rồi! Cộng ' + e.detail + ' điểm.', { anim: 'cheer', hold: 2600 }));
document.addEventListener('tp:ready', () => { if (window.Rooftop.dueCount()) setTimeout(() => say('Có thư bạn gửi cho chính mình đã đến hạn. Lên Sân Thượng đọc nhé.', { anim: 'wave', hold: 6000 }), 2500); });
document.addEventListener('tp:locked', () => say('Phòng này đang khóa. Thức chưa làm xong, quay lại sau nhé.', { anim: 'shake', hold: 3500 }));
document.addEventListener('tp:focus-done', () => say('Xong một phiên, thêm một sao. Nghỉ chút đi.', { anim: 'cheer', hold: 6000 }));
document.addEventListener('tp:lights', (e) => {
  mascot.face(e.detail ? 'surprised' : 'happy', 1.4);
  if (e.detail) say('Ơ, ai tắt đèn thế?', { hold: 2500 });
});
let idleTimer = 0;
const wake = () => {
  clearTimeout(idleTimer);
  if (mascot.state() === 'idle') mascot.face('neutral', 0.01);
  idleTimer = setTimeout(() => mascot.face('sleepy', 0), 30000);
};
['pointermove', 'keydown'].forEach((type) => addEventListener(type, wake, { passive: true }));
wake();

if (seen.hidden) {
  guide.hidden = true;
  callTP.hidden = false;
} else {
  guide.hidden = false;
  fit();
  previousRoom = room();
  setTimeout(() => {
    if (!seen.tour && room() === '') tour();
    else if (room() && !seen.rooms[room()]) { seen.rooms[room()] = true; remember(); tip(); }
    else if (person) say('Chào ' + person + '!', { anim: 'wave', hold: 4000 });
    else mascot.play('wave', 1.6);
  }, 1500);
}
