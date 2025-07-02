
// src/lib/firebase-admin.ts
import * as admin from 'firebase-admin';
import { getApp, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

/**
 * Initializes the Firebase Admin SDK, ensuring it connects to emulators in development.
 */
function initializeAdminApp(): App {
  // The .env.local file should set the emulator host variables.
  // This check is the standard way to initialize, respecting both production and development environments.
  if (getApps().length > 0) {
    return getApp();
  }

  // When running locally, Next.js will load the .env.local file and set the process.env variables.
  // The Admin SDK automatically detects these and connects to the emulators.
  // In production, it would use the service account credentials from the environment.
  return initializeApp();
}

const adminApp = initializeAdminApp();

export const adminDb = getFirestore(adminApp);
export const adminStorage = getStorage(adminApp);
export const adminAuth = getAuth(adminApp);
export default admin;
