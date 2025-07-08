
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getStorage, connectStorageEmulator } from "firebase/storage";

// This is the client-side configuration for your Firebase project.
// It's used by the browser part of your application.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "mock-api-key",
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "norruva.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "norruva",
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "norruva.appspot.com",
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "mock-sender-id",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "mock-app-id",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// In development mode, connect to the emulators if the flag is set.
// The `typeof window` check ensures this only runs on the client.
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined' && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
  try {
    // Use a flag to ensure we only connect once.
    if (!(window as any).__firebase_emulators_connected) {
      console.log("✅ Client SDK: Connecting to Firebase Emulators...");
      connectFirestoreEmulator(db, "localhost", 8080);
      connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
      connectStorageEmulator(storage, "localhost", 9199);
      console.log("✅ Client SDK: Connected to emulators successfully.");
      (window as any).__firebase_emulators_connected = true;
    }
  } catch(e) {
      console.error("❌ Client SDK: Error connecting to emulators:", e);
  }
}


export { db, app, auth, storage };
