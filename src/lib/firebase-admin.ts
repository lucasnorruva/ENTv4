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
  // If an app is already initialized, return it to prevent re-initialization errors.
  if (getApps().length > 0) {
    return getApp();
  }

  // For this project, we are assuming a local development environment using emulators.
  // In a real production environment, you would use a different mechanism (e.g., checking
  // for a production environment variable) to initialize with default credentials.
  console.log(
    '✅ Admin SDK: Configuring to use emulators for local development.',
  );
  process.env['FIRESTORE_EMULATOR_HOST'] = '127.0.0.1:8080';
  process.env['FIREBASE_AUTH_EMULATOR_HOST'] = '127.0.0.1:9099';
  process.env['FIREBASE_STORAGE_EMULATOR_HOST'] = '127.0.0.1:9199';

  return initializeApp({
    projectId:
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'passportflow-dev',
  });
}

const adminApp = initializeAdminApp();

export const adminDb = getFirestore(adminApp);
export const adminStorage = getStorage(adminApp);
export const adminAuth = getAuth(adminApp);
export default admin;
