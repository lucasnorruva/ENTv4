import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfigString = process.env.NEXT_PUBLIC_FIREBASE_CONFIG;
let firebaseConfig = {};

if (firebaseConfigString) {
  try {
    firebaseConfig = JSON.parse(firebaseConfigString);
  } catch (error) {
    console.error(
      'Failed to parse NEXT_PUBLIC_FIREBASE_CONFIG, please ensure it is a valid JSON string.',
      error
    );
  }
} else {
  // This warning helps in debugging if the .env file is missing or the variable is not named correctly.
  console.warn("Firebase configuration environment variable 'NEXT_PUBLIC_FIREBASE_CONFIG' not found.");
}


const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { db };