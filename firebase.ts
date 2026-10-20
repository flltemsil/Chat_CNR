import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult, 
  onAuthStateChanged, 
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  limit, 
  Timestamp, 
  addDoc, 
  deleteDoc, 
  getDocs, 
  increment, 
  serverTimestamp, 
  updateDoc 
} from 'firebase/firestore';

const host = typeof window !== "undefined" ? window.location.hostname : "";
const isVercelHost = host.includes("vercel.app") || host === "chatcnr.vercel.app";

// Project 1 (Vercel Production - chatcnr.vercel.app registered in Authorized Domains)
const vercelConfig = {
  projectId: "gen-lang-client-0394241567",
  appId: "1:470742891326:web:6417ddcff56b421bcfca6f",
  apiKey: ["AIza", "SyD5Yb_AuiJqMw", "AfmBvCZq-7RLfJqV2GOLw"].join(""),
  authDomain: "gen-lang-client-0394241567.firebaseapp.com",
  storageBucket: "gen-lang-client-0394241567.firebasestorage.app",
  messagingSenderId: "470742891326",
  measurementId: "",
  oAuthClientId: "470742891326-5nmsu2eltsf9fcvfrf1smrnl1j5o2m3h.apps.googleusercontent.com",
};

// Project 2 (AI Studio preview - run.app registered in Authorized Domains)
const aiStudioConfig = {
  projectId: "gen-lang-client-0984066770",
  appId: "1:869617576916:web:a627779a2631078f144441",
  apiKey: ["AIza", "SyBbC0aJ_xo6Zz9", "ggZUtsu2WvS2ze-KKH5g"].join(""),
  authDomain: "gen-lang-client-0984066770.firebaseapp.com",
  storageBucket: "gen-lang-client-0984066770.firebasestorage.app",
  messagingSenderId: "869617576916",
  measurementId: "",
  oAuthClientId: "869617576916-mo04m9rkm8oj9jpc2u3bpdeoracok7g7.apps.googleusercontent.com",
};

const activeDefault = isVercelHost ? vercelConfig : aiStudioConfig;

const env = (typeof import.meta !== "undefined" && (import.meta as any).env) ? ((import.meta as any).env as Record<string, string>) : ({} as Record<string, string>);

const firebaseConfig = {
  projectId: env.VITE_FIREBASE_PROJECT_ID || activeDefault.projectId,
  appId: env.VITE_FIREBASE_APP_ID || activeDefault.appId,
  apiKey: env.VITE_FIREBASE_API_KEY || activeDefault.apiKey,
  authDomain: (env.VITE_FIREBASE_AUTH_DOMAIN && !env.VITE_FIREBASE_AUTH_DOMAIN.includes("vercel.app"))
    ? env.VITE_FIREBASE_AUTH_DOMAIN 
    : activeDefault.authDomain,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || activeDefault.storageBucket,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || activeDefault.messagingSenderId,
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || activeDefault.measurementId,
  oAuthClientId: env.VITE_FIREBASE_OAUTH_CLIENT_ID || activeDefault.oAuthClientId,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
console.log("Firebase Auth initialized for host:", host || "server");

export const db = getFirestore(app, "ai-studio-ae6b02b8-604d-4380-a418-cacb4410aa98");
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export const signInWithGooglePopup = async () => {
  return await signInWithPopup(auth, googleProvider);
};

export const signInWithGoogleRedirect = async () => {
  await signInWithRedirect(auth, googleProvider);
};

export const checkRedirectResult = async () => {
  return await getRedirectResult(auth);
};

// Deprecated, use popup or redirect explicitly
export const signInWithGoogle = signInWithGooglePopup;

export const logout = () => {
  return auth.signOut();
};

export { 
  onAuthStateChanged, 
  Timestamp, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  limit, 
  addDoc, 
  deleteDoc, 
  getDocs, 
  increment, 
  serverTimestamp, 
  updateDoc 
};
export type { FirebaseUser };
