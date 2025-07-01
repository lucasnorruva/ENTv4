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

  // When `npm run seed` is used, `firebase emulators:exec` sets this variable.
  // The Admin SDK will automatically connect to the emulators.
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    console.log(
      'Emulator environment detected (FIRESTORE_EMULATOR_HOST is set). Initializing Admin SDK for emulators.',
    );
    return initializeApp({ projectId: 'passportflow-dev' });
  }

  // For the `npm run dev` server, `FIRESTORE_EMULATOR_HOST` is not set by default.
  // This block enables server-side code (like Server Actions) to use the emulators.
  if (process.env.NODE_ENV === 'development') {
    console.log(
      'Development environment detected. Manually configuring Admin SDK for emulators.',
    );
    process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
    process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
    process.env.FIREBASE_STORAGE_EMULATOR_HOST = '127.0.0.1:9199';
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
