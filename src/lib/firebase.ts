import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  sendPasswordResetEmail,
  updateProfile,
  User,
  Auth
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  onSnapshot, 
  query, 
  orderBy,
  Firestore
} from 'firebase/firestore';

const metaEnv = (import.meta as any)?.env || {};

const firebaseConfig = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || "AIzaSyBU_vTdK1WxEfHi-MEZDfdMCR89fbVsiHg",
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || "personal-space-7c96d.firebaseapp.com",
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || "personal-space-7c96d",
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || "personal-space-7c96d.firebasestorage.app",
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || "458025475917",
  appId: metaEnv.VITE_FIREBASE_APP_ID || "1:458025475917:web:34b47c0edd64d294c3e104",
  measurementId: metaEnv.VITE_FIREBASE_MEASUREMENT_ID || "G-3J4DRX7GGH"
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let firebaseAvailable = false;

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  db = getFirestore(app);
  firebaseAvailable = true;
} catch (e) {
  console.warn('Firebase unavailable; continuing in demo mode:', e);
}

const demoAuth = {} as Auth;
const demoDb = {} as Firestore;

const safeAuth = auth || demoAuth;
const safeDb = db || demoDb;

const unavailable = (operation: string) => Promise.reject(new Error(`Firebase is unavailable for ${operation}.`));

const safeSignInWithEmailAndPassword = (...args: Parameters<typeof signInWithEmailAndPassword>) =>
  firebaseAvailable ? signInWithEmailAndPassword(...args) : unavailable('sign in');
const safeCreateUserWithEmailAndPassword = (...args: Parameters<typeof createUserWithEmailAndPassword>) =>
  firebaseAvailable ? createUserWithEmailAndPassword(...args) : unavailable('account creation');
const safeSignOut = (_auth?: Auth) => firebaseAvailable ? signOut(safeAuth) : Promise.resolve();
const safeSendPasswordResetEmail = (...args: Parameters<typeof sendPasswordResetEmail>) =>
  firebaseAvailable ? sendPasswordResetEmail(...args) : unavailable('password reset');
const safeUpdateProfile = (...args: Parameters<typeof updateProfile>) =>
  firebaseAvailable ? updateProfile(...args) : unavailable('profile update');
const safeOnAuthStateChanged = (_auth: Auth, callback: Parameters<typeof onAuthStateChanged>[1]) =>
  firebaseAvailable ? onAuthStateChanged(safeAuth, callback) : () => undefined;

export { safeAuth as auth, safeDb as db };
export type { User };
export { 
  safeSignInWithEmailAndPassword as signInWithEmailAndPassword,
  safeCreateUserWithEmailAndPassword as createUserWithEmailAndPassword,
  safeSignOut as signOut,
  safeOnAuthStateChanged as onAuthStateChanged,
  safeSendPasswordResetEmail as sendPasswordResetEmail,
  safeUpdateProfile as updateProfile,
  doc,
  setDoc,
  getDoc,
  collection,
  onSnapshot,
  query,
  orderBy
};
