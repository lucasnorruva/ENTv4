
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// This is the client-side configuration for your Firebase project.
// It's used by the browser part of your application.
const firebaseConfig = {
  apiKey: "AIzaSyDOMz6BLB7pxOO1vnEIjNpcrAseTllmL_c",
  authDomain: "passportflow.firebaseapp.com",
  projectId: "passportflow",
  storageBucket: "passportflow.firebasestorage.app",
  messagingSenderId: "518086621909",
  appId: "1:518086621909:web:2028fe5fd0d0447647405c"
};

console.log(
  `✅ Initializing connection to Firebase project: "${firebaseConfig.projectId}"`,
);

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { db, app, auth, storage };
