
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getStorage, connectStorageEmulator } from "firebase/storage";

// This is the client-side configuration for your Firebase project.
// It's used by the browser part of your application.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

console.log(
  `✅ Initializing connection to Firebase project: "${firebaseConfig.projectId}"`,
);

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// In development mode, connect to the emulators.
// The `typeof window` check ensures this only runs on the client.
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  try {
    console.log("Connecting client SDK to Firebase Emulators...");
    connectFirestoreEmulator(db, "127.0.0.1", 8080);
    connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
    connectStorageEmulator(storage, "127.0.0.1", 9199);
    console.log("Client SDK connected to emulators successfully.");
  } catch(e) {
      console.error("Error connecting client SDK to emulators:", e);
  }
}

export { db, app, auth, storage };
