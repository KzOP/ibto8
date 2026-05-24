// PUT FIREBASE CONFIG HERE
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyART2Z-YgdVDokfdgMFnW9V9Ct9zzmWobQ",
  authDomain: "ibiaathi.firebaseapp.com",
  projectId: "ibiaathi",
  storageBucket: "ibiaathi.firebasestorage.app",
  messagingSenderId: "717948378912",
  appId: "1:717948378912:web:727a4e64af5ba2b642c145",
  measurementId: "G-Q5DRDVB8SF",
};

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
