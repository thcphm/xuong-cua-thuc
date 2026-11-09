/* Nối phiên đăng nhập với Firebase: tài khoản, đồng bộ tiến độ, quản trị.
   Chỉ tải khi cần đăng nhập, nên khách không tốn thêm dữ liệu. */
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc, updateDoc, deleteDoc, getDocs, collection } from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js';

const app = initializeApp(window.FIREBASE_CONFIG);
const auth = getAuth(app);
const db = getFirestore(app);
await auth.authStateReady();

/* Tên tài khoản đổi thành địa chỉ nội bộ, vì Firebase cần dạng email. Không có thư nào được gửi đi. */
export async function emailOf(key) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(key));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 40) + '@xuong.example.com';
}
const progressRef = (uid, key) => doc(db, 'users', uid, 'progress', key);

export const currentUid = () => (auth.currentUser ? auth.currentUser.uid : '');
export async function signUp(key, name, password) {
  const cred = await createUserWithEmailAndPassword(auth, await emailOf(key), password);
  await setDoc(doc(db, 'profiles', cred.user.uid), { name, blocked: false, at: Date.now() });
  return { uid: cred.user.uid, name };
}
export async function signIn(key, password) {
  const cred = await signInWithEmailAndPassword(auth, await emailOf(key), password);
  const snap = await getDoc(doc(db, 'profiles', cred.user.uid));
  if (snap.exists() && snap.data().blocked === true) {
    await signOut(auth);
    const err = new Error('blocked');
    err.code = 'tp/blocked';
    throw err;
  }
  return { uid: cred.user.uid, name: snap.exists() ? snap.data().name : key };
}
export const logOut = () => signOut(auth);
export function watch(fn) { return onAuthStateChanged(auth, fn); }
export async function isBlocked(uid) {
  const snap = await getDoc(doc(db, 'profiles', uid));
  return snap.exists() && snap.data().blocked === true;
}
export async function readAll(uid) {
  const list = await getDocs(collection(db, 'users', uid, 'progress'));
  const out = {};
  list.forEach((d) => { out[d.id] = d.data(); });
  return out;
}
export const writeOne = (uid, key, v, at) => setDoc(progressRef(uid, key), { v, at });

/* Quản trị: luật Firestore mới là nơi chặn người không phải admin */
export async function listUsers() {
  const profiles = await getDocs(collection(db, 'profiles'));
  const rows = [];
  for (const p of profiles.docs) {
    const items = await readAll(p.id);
    rows.push({ uid: p.id, name: p.data().name, blocked: p.data().blocked === true, size: Object.values(items).reduce((n, x) => n + x.v.length, 0) });
  }
  return rows;
}
export async function eraseProgress(uid) {
  const list = await getDocs(collection(db, 'users', uid, 'progress'));
  await Promise.all(list.docs.map((d) => deleteDoc(d.ref)));
}
export const setBlocked = (uid, blocked) => updateDoc(doc(db, 'profiles', uid), { blocked });
