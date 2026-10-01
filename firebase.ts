import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { getFirestore, initializeFirestore, collection, doc, setDoc, getDoc, onSnapshot, query, orderBy, limit, Timestamp, addDoc, deleteDoc, getDocs, increment, serverTimestamp, updateDoc } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
console.log("Firebase Auth initialized");
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true
});
export const googleProvider = new GoogleAuthProvider();

export const signInWithGooglePopup = () => signInWithPopup(auth, googleProvider);
export const signInWithGoogleRedirect = () => signInWithRedirect(auth, googleProvider);
export const checkRedirectResult = () => getRedirectResult(auth);
export const signInWithGoogle = signInWithGooglePopup;
export const logout = () => auth.signOut();

export { onAuthStateChanged, Timestamp, collection, doc, setDoc, getDoc, onSnapshot, query, orderBy, limit, addDoc, deleteDoc, getDocs, increment, serverTimestamp, updateDoc };
export type { FirebaseUser };
