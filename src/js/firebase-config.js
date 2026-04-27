// ============================================
// KUYUMCU PWA — Firebase Configuration
// ============================================
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get, onValue, update } from 'firebase/database';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ''
};

let app = null;
let db = null;
let auth = null;
let firebaseEnabled = false;

try {
  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    app = initializeApp(firebaseConfig);
    db = getDatabase(app);
    auth = getAuth(app);
    firebaseEnabled = true;
    console.log('🔥 Firebase bağlantısı başarılı');
  } else {
    console.log('📌 Firebase yapılandırması bulunamadı — yerel mod aktif');
  }
} catch (error) {
  console.warn('⚠️ Firebase başlatılamadı:', error.message);
}

// ─── Database Helpers ───
export async function dbSet(path, data) {
  if (!db) return false;
  try {
    await set(ref(db, path), data);
    return true;
  } catch (e) {
    console.warn('DB write error:', e.message);
    return false;
  }
}

export async function dbGet(path) {
  if (!db) return null;
  try {
    const snapshot = await get(ref(db, path));
    return snapshot.exists() ? snapshot.val() : null;
  } catch (e) {
    console.warn('DB read error:', e.message);
    return null;
  }
}

export async function dbUpdate(path, data) {
  if (!db) return false;
  try {
    await update(ref(db, path), data);
    return true;
  } catch (e) {
    console.warn('DB update error:', e.message);
    return false;
  }
}

export function dbListen(path, callback) {
  if (!db) return () => {};
  const unsubscribe = onValue(ref(db, path), (snapshot) => {
    callback(snapshot.exists() ? snapshot.val() : null);
  }, (error) => {
    console.warn('DB listen error:', error.message);
  });
  return unsubscribe;
}

// ─── Auth Helpers ───
export async function loginWithEmail(email, password) {
  if (!auth) throw new Error('Firebase Auth aktif değil');
  return signInWithEmailAndPassword(auth, email, password);
}

export async function registerWithEmail(email, password) {
  if (!auth) throw new Error('Firebase Auth aktif değil');
  return createUserWithEmailAndPassword(auth, email, password);
}

export async function logoutFirebase() {
  if (!auth) return;
  return signOut(auth);
}

export function onAuthChange(callback) {
  if (!auth) return () => {};
  return onAuthStateChanged(auth, callback);
}

export { app, db, auth, firebaseEnabled };
