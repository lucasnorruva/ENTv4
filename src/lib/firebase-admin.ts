// src/lib/firebase-admin.ts
import * as admin from 'firebase-admin';
import { getApp, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

/**
 * Initializes the Firebase Admin SDK.
 */
function initializeAdminApp(): App {
  if (getApps().length > 0) {
    return getApp();
  }

  // When running locally via `npm run dev`, the `genkit:start` command
  // automatically sets these environment variables, allowing the Admin SDK
  // to connect to the local emulators.
  if (process.env.FIREBASE_AUTH_EMULATOR_HOST) {
    console.log('✅ Admin SDK: Detected emulator environment. Connecting...');
    return initializeApp({
      projectId: 'passportflow-dev', // Use a consistent dev project ID for emulators
    });
  } else {
    // In a real production deployment (e.g., Cloud Run, Firebase Functions),
    // the SDK would automatically use the default credentials of the environment.
    console.warn(
      '⚠️ Admin SDK: Emulator environment variables not set. Assuming production-like environment (will fail without credentials).',
    );
    return initializeApp();
  }
}

const adminApp = initializeAdminApp();

export const adminDb = getFirestore(adminApp);
export const adminStorage = getStorage(adminApp);
export const adminAuth = getAuth(adminApp);
export default admin;
