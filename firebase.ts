import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDoc, onSnapshot, query, orderBy, limit, Timestamp, addDoc, deleteDoc, getDocs, increment, serverTimestamp, updateDoc } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
console.log("Firebase Auth initialized");
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Add Workspace scopes explicitly

// Auth Helpers
let cachedAccessToken: string | null = null;

export const signInWithGoogle = async () => {
  const result = await signInWithPopup(auth, googleProvider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  if (credential?.accessToken) {
    cachedAccessToken = credential.accessToken;
  }
  return result;
};
export const getAccessToken = () => cachedAccessToken;

export const logout = () => {
  cachedAccessToken = null;
  return auth.signOut();
};

export { onAuthStateChanged, Timestamp, collection, doc, setDoc, getDoc, onSnapshot, query, orderBy, limit, addDoc, deleteDoc, getDocs, increment, serverTimestamp, updateDoc };
export type { FirebaseUser };
