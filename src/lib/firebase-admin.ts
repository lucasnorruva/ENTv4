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

  // When running locally with emulators, the FIRESTORE_EMULATOR_HOST env var will be set.
  // In this case, we don't need to provide any credentials.
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    console.log(
      'Firebase Emulators detected. Initializing Admin SDK for local development.',
    );
    return initializeApp({
      // Using a mock projectId for emulator environment is a good practice.
      projectId: 'passportflow-dev',
    });
  }

  try {
    // When running on Firebase servers or with GOOGLE_APPLICATION_CREDENTIALS
    // set locally, this will initialize the default app for production.
    console.log('Initializing Firebase Admin SDK for production...');
    return initializeApp();
  } catch (error: any) {
    console.error(
      'Firebase Admin SDK initialization failed. Ensure GOOGLE_APPLICATION_CREDENTIALS is set for local development when not using emulators.',
      error,
    );
    // Throw a more specific error to prevent the application from proceeding
    // with an uninitialized SDK, which would lead to cryptic errors downstream.
    throw new Error(
      'Could not initialize Firebase Admin SDK. See server logs for more details.',
    );
  }
}

const app = getAdminApp();

// Explicitly use the initialized app to get the services. This is safer.
export const adminDb = getFirestore(app);
export const adminStorage = getStorage(app);
export const adminAuth = getAuth(app);
export default admin;
