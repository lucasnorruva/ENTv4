// src/lib/firebase-admin.ts
import * as dotenv from 'dotenv';
dotenv.config(); // Load environment variables from .env file

import * as admin from 'firebase-admin';
import { getApp, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

/**
 * Initializes and returns the Firebase Admin App instance, ensuring it's a singleton.
 * It prioritizes connection methods: Emulators > Local .env Credentials > Production Default.
 */
function initializeAdminApp(): App {
  // Return existing app if already initialized
  if (getApps().length > 0) {
    return getApp();
  }

  // 1. Connect to Emulators if host variables are set
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    console.log(
      'Emulator environment detected. Initializing Admin SDK for emulators.',
    );
    return initializeApp({ projectId: 'passportflow-dev' });
  }

  // 2. Use local service account credentials from .env if provided
  const {
    FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY,
  } = process.env;

  if (FIREBASE_PROJECT_ID && FIREBASE_CLIENT_EMAIL && FIREBASE_PRIVATE_KEY) {
    console.log(
      'Local Firebase credentials found. Initializing Admin SDK for live project.',
    );
    const serviceAccount = {
      projectId: FIREBASE_PROJECT_ID,
      clientEmail: FIREBASE_CLIENT_EMAIL,
      // The private key must have newlines correctly formatted.
      privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    };

    try {
      return initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } catch (error: any) {
      throw new Error(
        `Failed to parse service account credentials. Please ensure FIREBASE_PRIVATE_KEY in your .env file is correctly formatted. Original error: ${error.message}`,
      );
    }
  }

  // 3. Fallback to production environment credentials (Application Default Credentials)
  console.log(
    'Production environment detected. Initializing Admin SDK with default credentials.',
  );
  return initializeApp();
}

const adminApp = initializeAdminApp();

export const adminDb = getFirestore(adminApp);
export const adminStorage = getStorage(adminApp);
export const adminAuth = getAuth(adminApp);
export default admin;
