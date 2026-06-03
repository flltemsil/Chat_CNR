import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { getFirestore, initializeFirestore, collection, doc, setDoc, getDoc, onSnapshot, query, orderBy, limit, Timestamp, addDoc, deleteDoc, getDocs, increment, serverTimestamp, updateDoc } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
console.log("Firebase Auth initialized");
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true
}, firebaseConfig.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();

// Add Workspace scopes explicitly

// Auth Helpers
let cachedAccessToken: string | null = null;

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

export const getAccessToken = () => cachedAccessToken;

export const logout = () => {
  cachedAccessToken = null;
  return auth.signOut();
};

export { onAuthStateChanged, Timestamp, collection, doc, setDoc, getDoc, onSnapshot, query, orderBy, limit, addDoc, deleteDoc, getDocs, increment, serverTimestamp, updateDoc };
export type { FirebaseUser };
