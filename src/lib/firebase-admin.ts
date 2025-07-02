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

  // In a local development environment, the server-side Node.js process
  // started by `next dev` does not automatically pick up the emulator
  // environment variables.
  // To ensure a reliable connection, we will forcefully set them here.
  // This is a robust solution for the specific dev setup of this project.
  console.log('✅ Admin SDK: Forcing connection to Firebase Emulators for local development...');
  process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
  process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
  process.env.FIREBASE_STORAGE_EMULATOR_HOST = '127.0.0.1:9199';
  
  return initializeApp({
    projectId: 'passportflow-dev', // Use a consistent dev project ID for emulators
  });
}

const adminApp = initializeAdminApp();

export const adminDb = getFirestore(adminApp);
export const adminStorage = getStorage(adminApp);
export const adminAuth = getAuth(adminApp);
export default admin;
