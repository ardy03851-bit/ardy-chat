import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut, updateProfile, signInAnonymously, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, onSnapshot, query, where, orderBy, limit, serverTimestamp, arrayUnion, arrayRemove, runTransaction, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL, connectStorageEmulator } from 'firebase/storage';

// Firebase web configuration identifies the public app; it is not an admin credential.
const firebaseConfig = {
  apiKey: "AIzaSyCe0SRnXJw5Fnjk57zSy2OOP1-XVjL2h24",
  authDomain: "ardy-chat.firebaseapp.com",
  projectId: "ardy-chat",
  storageBucket: "ardy-chat.firebasestorage.app",
  messagingSenderId: "918849102102",
  appId: "1:918849102102:web:ced5da217bdc207d55b037",
  measurementId: "G-TRJGHP68QP"
};
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const emulator = ['localhost', '127.0.0.1'].includes(location.hostname) && new URLSearchParams(location.search).get('emulator') === '1';
if (emulator) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  connectStorageEmulator(storage, '127.0.0.1', 9199);
}
export async function login() {
  if (emulator) return signInAnonymously(auth);
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  return signInWithPopup(auth, provider);
}
export { onAuthStateChanged, signOut, updateProfile, collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, onSnapshot, query, where, orderBy, limit, serverTimestamp, arrayUnion, arrayRemove, runTransaction, ref, uploadBytesResumable, getDownloadURL };
