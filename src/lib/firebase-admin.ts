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

  // When running in development, we forcefully connect to the emulators.
  // This avoids issues where environment variables from one process (genkit)
  // don't propagate to another (next dev).
  if (process.env.NODE_ENV === 'development') {
    console.log('✅ Admin SDK (Development Mode): Forcing connection to Firebase Emulators...');
    // Setting these environment variables programmatically ensures the Admin SDK connects.
    process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
    process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
    process.env.FIREBASE_STORAGE_EMULATOR_HOST = '127.0.0.1:9199';
    
    return initializeApp({
      projectId: 'passportflow-dev', // Use a consistent dev project ID for emulators
    });
  } else {
    // In a real production deployment (e.g., Cloud Run, Firebase Functions),
    // the SDK would automatically use the default credentials of the environment.
    console.log(
      'Admin SDK: Assuming production-like environment.',
    );
    return initializeApp();
  }
}

const adminApp = initializeAdminApp();

export const adminDb = getFirestore(adminApp);
export const adminStorage = getStorage(adminApp);
export const adminAuth = getAuth(adminApp);
export default admin;
