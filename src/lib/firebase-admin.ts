// src/lib/firebase-admin.ts
import * as dotenv from 'dotenv';
dotenv.config(); // Load environment variables from .env file

import * as admin from 'firebase-admin';
import { getApp, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import fs from 'fs';
import path from 'path';

/**
 * Initializes and returns the Firebase Admin App instance, ensuring it's a singleton.
 * It prioritizes connection methods: Emulators > service account file > Production Default.
 */
function initializeAdminApp(): App {
  if (getApps().length > 0) {
    return getApp();
  }

  // When running locally for development (e.g., `next dev`), connect to emulators.
  // The `FIRESTORE_EMULATOR_HOST` env var is set automatically by `firebase emulators:exec` (for seeding),
  // but not by `next dev`. We manually set it here for the dev server.
  if (
    process.env.NODE_ENV === 'development' &&
    !process.env.FIRESTORE_EMULATOR_HOST
  ) {
    console.log('Development mode detected, setting emulator hosts for Admin SDK.');
    process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
    process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
    process.env.FIREBASE_STORAGE_EMULATOR_HOST = '127.0.0.1:9199';
  }

  // 1. Connect to Emulators if host variables are set
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    console.log(
      'Emulator environment detected. Initializing Admin SDK for emulators.',
    );
    return initializeApp({ projectId: 'passportflow-dev' });
  }

  // 2. Use local service account key file if it exists.
  const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');

  if (fs.existsSync(serviceAccountPath)) {
    console.log(
      `Found service account key at ${serviceAccountPath}. Initializing Admin SDK with file credentials.`,
    );
    try {
      const serviceAccount = JSON.parse(
        fs.readFileSync(serviceAccountPath, 'utf8'),
      );
      return initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } catch (error: any) {
      throw new Error(
        `Failed to parse service account key file. Please ensure it is a valid JSON file. Original error: ${error.message}`,
      );
    }
  }

  // 3. Fallback to production environment credentials (Application Default Credentials)
  console.log(
    'Production environment detected (no local key file found). Initializing Admin SDK with default credentials.',
  );
  return initializeApp();
}

const adminApp = initializeAdminApp();

export const adminDb = getFirestore(adminApp);
export const adminStorage = getStorage(adminApp);
export const adminAuth = getAuth(adminApp);
export default admin;
