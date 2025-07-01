// src/lib/firebase-admin.ts
import * as admin from 'firebase-admin';
import { getApp, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

/**
 * Initializes the Firebase Admin SDK.
 * This function is designed to be robust for both local development (with emulators)
 * and production environments.
 */
function initializeAdminApp(): App {
  // If an app is already initialized, return it to prevent re-initialization errors.
  if (getApps().length > 0) {
    return getApp();
  }

  // When running in a local development environment (e.g., via `npm run dev`),
  // we explicitly configure the Admin SDK to connect to the local emulators.
  if (process.env.NODE_ENV === 'development') {
    console.log(
      '✅ Admin SDK: Development environment detected. Configuring to use emulators.',
    );
    // These environment variables are used by the Admin SDK to automatically
    // connect to the running emulators. They MUST be set before `initializeApp`.
    process.env['FIRESTORE_EMULATOR_HOST'] = '127.0.0.1:8080';
    process.env['FIREBASE_AUTH_EMULATOR_HOST'] = '127.0.0.1:9099';
    process.env['FIREBASE_STORAGE_EMULATOR_HOST'] = '127.0.0.1:9199';

    // Initialize the app with a project ID. It will automatically
    // discover and connect to the emulators via the env vars set above.
    return initializeApp({
      projectId:
        process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'passportflow-dev',
    });
  } else {
    // In a production environment (like a deployed Cloud Function or Cloud Run),
    // the SDK automatically uses the project's default service account credentials.
    console.log(
      '✅ Admin SDK: Production-like environment detected. Initializing with default credentials.',
    );
    return initializeApp();
  }
}

const adminApp = initializeAdminApp();

export const adminDb = getFirestore(adminApp);
export const adminStorage = getStorage(adminApp);
export const adminAuth = getAuth(adminApp);
export default admin;
