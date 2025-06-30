// src/lib/firebase-admin.ts

import * as admin from 'firebase-admin';
import { getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

/**
 * This function ensures that we initialize the Firebase Admin App only once.
 * It's a common pattern for Next.js server environments.
 * @returns The initialized Firebase Admin App.
 */
function getAdminApp() {
  if (getApps().length > 0) {
    return getApp();
  }

  // When running in development mode (e.g., `npm run dev`), we connect to the emulators.
  if (process.env.NODE_ENV === 'development') {
    console.log(
      'Development environment detected. Initializing Admin SDK to connect to Firebase Emulators.',
    );
    // Setting these environment variables tells the Admin SDK to use the emulators.
    // This is a robust way to ensure connection during local development.
    process.env['FIRESTORE_EMULATOR_HOST'] = 'localhost:8080';
    process.env['FIREBASE_AUTH_EMULATOR_HOST'] = 'localhost:9099';
    process.env['FIREBASE_STORAGE_EMULATOR_HOST'] = 'localhost:9199';

    return initializeApp({
      projectId: 'passportflow-dev', // A dummy project ID is fine for emulators
    });
  }

  // For production, the SDK will use the default credentials of the environment (e.g., Cloud Run).
  console.log('Production environment detected. Initializing Firebase Admin SDK...');
  return initializeApp();
}

const app = getAdminApp();

export const adminDb = getFirestore(app);
export const adminStorage = getStorage(app);
export const adminAuth = getAuth(app);
export default admin;
