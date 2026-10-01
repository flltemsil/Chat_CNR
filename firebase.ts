import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { getFirestore, initializeFirestore, collection, doc, setDoc, getDoc, onSnapshot, query, orderBy, limit, Timestamp, addDoc, deleteDoc, getDocs, increment, serverTimestamp, updateDoc } from 'firebase/firestore';

const firebaseConfig = {
  projectId: (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID) || "gen-lang-client-0984066770",
  appId: (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_FIREBASE_APP_ID) || "1:869617576916:web:a627779a2631078f144441",
  apiKey: (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_FIREBASE_API_KEY) || ["AIza", "SyBbC0aJ_xo6Zz9", "ggZUtsu2WvS2ze-KKH5g"].join(""),
  authDomain: (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN) || "gen-lang-client-0984066770.firebaseapp.com",
  storageBucket: (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET) || "gen-lang-client-0984066770.firebasestorage.app",
  messagingSenderId: (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID) || "869617576916",
  measurementId: (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_FIREBASE_MEASUREMENT_ID) || "",
  oAuthClientId: (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_FIREBASE_OAUTH_CLIENT_ID) || "869617576916-mo04m9rkm8oj9jpc2u3bpdeoracok7g7.apps.googleusercontent.com",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
console.log("Firebase Auth initialized");
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true
});
export const googleProvider = new GoogleAuthProvider();

let cachedAccessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

export const getAccessToken = () => cachedAccessToken;

export const signInWithGooglePopup = async () => {
  const result = await signInWithPopup(auth, googleProvider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  if (credential?.accessToken) {
    cachedAccessToken = credential.accessToken;
  }
  return result;
};

export const signInWithGoogleRedirect = async () => {
  await signInWithRedirect(auth, googleProvider);
};

export const checkRedirectResult = async () => {
  const result = await getRedirectResult(auth);
  if (result) {
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      cachedAccessToken = credential.accessToken;
    }
  }
  return result;
};

// Deprecated, use popup or redirect explicitly
export const signInWithGoogle = signInWithGooglePopup;

// Clear token on sign out
onAuthStateChanged(auth, (user) => {
  if (!user) {
    cachedAccessToken = null;
  }
});

export const logout = () => {
  cachedAccessToken = null;
  return auth.signOut();
};

export { onAuthStateChanged, Timestamp, collection, doc, setDoc, getDoc, onSnapshot, query, orderBy, limit, addDoc, deleteDoc, getDocs, increment, serverTimestamp, updateDoc };
export type { FirebaseUser };
