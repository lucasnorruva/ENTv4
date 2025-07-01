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
 * It prioritizes connection methods in a specific order for robust local and production setup.
 */
function initializeAdminApp(): App {
  if (getApps().length > 0) {
    return getApp();
  }

  // Connection method priority:
  // 1. Emulators (via environment variables set by `emulators:exec` or `dev` server)
  // 2. Local service account file (for direct script execution)
  // 3. Production Default (via Application Default Credentials on a server)

  // 1. Check for `emulators:exec` (used by `npm run seed`)
  // `firebase emulators:exec` sets FIRESTORE_EMULATOR_HOST.
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    console.log(
      '✅ Admin SDK: `emulators:exec` environment detected. Initializing for emulators.',
    );
    return initializeApp({ projectId: 'passportflow-dev' });
  }

  // 2. Check for `npm run dev` environment.
  // The `dev` script runs a server, so we manually configure emulator hosts.
  if (process.env.NODE_ENV === 'development') {
    console.log(
      '✅ Admin SDK: Development server detected. Manually configuring for emulators.',
    );
    process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
    process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
    process.env.FIREBASE_STORAGE_EMULATOR_HOST = '127.0.0.1:9199';
    return initializeApp({ projectId: 'passportflow-dev' });
  }

  // 3. Check for local service account key file.
  const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');

  if (fs.existsSync(serviceAccountPath)) {
    console.log(
      `✅ Admin SDK: Found service account key at ${serviceAccountPath}. Initializing with file credentials.`,
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

  // 4. Fallback to production environment credentials (Application Default Credentials).
  console.log(
    '✅ Admin SDK: Production environment detected (no local key or emulator config). Initializing with default credentials.',
  );
  return initializeApp();
}

const adminApp = initializeAdminApp();

export const adminDb = getFirestore(adminApp);
export const adminStorage = getStorage(adminApp);
export const adminAuth = getAuth(adminApp);
export default admin;
