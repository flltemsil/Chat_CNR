import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDoc, onSnapshot, query, orderBy, limit, Timestamp, addDoc, deleteDoc, getDocs, increment, serverTimestamp } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();

// Auth Helpers
export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
export const logout = () => auth.signOut();

export { onAuthStateChanged, Timestamp, collection, doc, setDoc, getDoc, onSnapshot, query, orderBy, limit, addDoc, deleteDoc, getDocs, increment, serverTimestamp };
export type { FirebaseUser };
