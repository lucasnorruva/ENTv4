import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Attempt to parse the full config from environment variables
let firebaseConfig: { projectId?: string } = {};
const firebaseConfigString = process.env.NEXT_PUBLIC_FIREBASE_CONFIG;

if (firebaseConfigString) {
  try {
    firebaseConfig = JSON.parse(firebaseConfigString);
  } catch (e) {
    console.error(
      "Could not parse NEXT_PUBLIC_FIREBASE_CONFIG. It's not a valid JSON string.",
    );
    firebaseConfig = {}; // Reset on parse error
  }
}

// If the config from environment is missing a projectId, or if there was no config,
// provide a default. This is a robust way to ensure the app works in a dev environment.
if (!firebaseConfig.projectId) {
  console.warn(
    "Firebase projectId not found. Using default projectId 'norruva-studio'.",
  );
  firebaseConfig.projectId = "norruva-studio";
}

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { db };
