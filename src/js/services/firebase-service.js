// ============================================
// NOVENTRA PWA — Firebase Integration Service
// ============================================
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBwX8vsNizgBsJxJjXaPOzQO4a5bKHlv5s",
  authDomain: "kuyumcu-app-86d30.firebaseapp.com",
  databaseURL: "https://kuyumcu-app-86d30-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "kuyumcu-app-86d30",
  storageBucket: "kuyumcu-app-86d30.firebasestorage.app",
  messagingSenderId: "973335402698",
  appId: "1:973335402698:web:1ec68d7506eee0004c3c33"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let currentUser = null;

/** Cihaza özel anonim giriş yapar */
export async function initFirebaseAuth() {
  return new Promise((resolve) => {
    // Safety timeout: If Firebase takes too long, continue in offline mode
    const timeout = setTimeout(() => {
      console.warn("Firebase Auth zaman aşımı: Offline modda devam ediliyor.");
      resolve(null);
    }, 5000);

    onAuthStateChanged(auth, async (user) => {
      clearTimeout(timeout);
      if (user) {
        currentUser = user;
        console.log("Firebase Auth: Giriş yapıldı", user.uid);
        resolve(user);
      } else {
        try {
          // If signInAnonymously is restricted or fails, we must still resolve
          const result = await signInAnonymously(auth);
          currentUser = result.user;
          resolve(result.user);
        } catch (error) {
          console.warn("⚠️ Firebase Auth (Anonim) kısıtlanmış veya kapalı. Offline modda devam ediliyor.");
          resolve(null);
        }
      }
    });
  });
}

/** Veriyi Firestore'a kaydeder */
export async function saveData(colName, data) {
  if (!currentUser) return;
  try {
    const docRef = doc(db, colName, currentUser.uid);
    await setDoc(docRef, data);
  } catch (error) {
    console.error(`Firestore Kayıt Hatası (${colName}):`, error);
  }
}

/** Veriyi Firestore'dan çeker */
export async function loadData(colName) {
  if (!currentUser) return null;
  try {
    const docRef = doc(db, colName, currentUser.uid);
    const snap = await getDoc(docRef);
    return snap.exists() ? snap.data() : null;
  } catch (error) {
    console.error(`Firestore Yükleme Hatası (${colName}):`, error);
    return null;
  }
}

/** GENEL (Paylaşılan) veriyi Firestore'a kaydeder (Ürünler, Fiyatlar vb.) */
export async function saveGlobalData(docName, data) {
  try {
    const docRef = doc(db, 'global_config', docName);
    await setDoc(docRef, data);
  } catch (error) {
    console.error(`Firestore Global Kayıt Hatası (${docName}):`, error);
  }
}

/** GENEL (Paylaşılan) veriyi Firestore'an çeker */
export async function loadGlobalData(docName) {
  try {
    const docRef = doc(db, 'global_config', docName);
    const snap = await getDoc(docRef);
    return snap.exists() ? snap.data() : null;
  } catch (error) {
    console.error(`Firestore Global Yükleme Hatası (${docName}):`, error);
    return null;
  }
}

/** Yeni bir doküman ekler (Siparişler gibi listeler için) */
export async function addDocument(colName, data) {
  if (!currentUser) return;
  try {
    const colRef = collection(db, colName);
    await addDoc(colRef, { ...data, userId: currentUser.uid, createdAt: new Date() });
  } catch (error) {
    console.error(`Firestore Ekleme Hatası (${colName}):`, error);
  }
}

/** Kullanıcıya ait dokümanları listeler */
export async function getDocuments(colName) {
  if (!currentUser) return [];
  try {
    const q = query(collection(db, colName), where("userId", "==", currentUser.uid));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error(`Firestore Listeleme Hatası (${colName}):`, error);
    return [];
  }
}
