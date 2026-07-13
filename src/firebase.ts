import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';

const firebaseConfig = {
  // @ts-ignore
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBgDxs2jQVWmuIvasQoIVOgkfThwMSGlh8",
  // @ts-ignore
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "vidnova-c1465.firebaseapp.com",
  // @ts-ignore
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "vidnova-c1465",
  // @ts-ignore
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "vidnova-c1465.firebasestorage.app",
  // @ts-ignore
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "132032576895",
  // @ts-ignore
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:132032576895:web:a952b50c204ea8d846ae4a",
  // @ts-ignore
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-BWTZ0YVW7H"
};

const isFirebaseConfigured = !!firebaseConfig.apiKey;

export const app = isFirebaseConfigured 
  ? (getApps().length === 0 ? initializeApp(firebaseConfig) : getApp())
  : null;

export const auth = isFirebaseConfigured ? getAuth(app!) : null;
export const db = isFirebaseConfigured ? initializeFirestore(app!, { experimentalForceLongPolling: true }) : null;
