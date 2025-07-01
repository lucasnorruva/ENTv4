// src/lib/firebase-admin.ts
import * as dotenv from 'dotenv';
dotenv.config(); // Load environment variables from .env file

import * as admin from 'firebase-admin';
import { getApp, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

/**
 * Ensures a single initialization of the Firebase Admin App.
 *
 * This function handles three scenarios in order of priority:
 * 1.  **Development with Emulators:** If emulator host variables are set,
 *     it connects to the local emulators.
 * 2.  **Local Development against Live Project:** If local credentials are
 *     provided in a .env file, it uses them to connect.
 * 3.  **Production Environment:** In a deployed environment (like App Hosting),
 *     it uses the Application Default Credentials provided by the infrastructure.
 *
 * @returns The initialized Firebase Admin App.
 */
function getAdminApp(): App {
  if (getApps().length > 0) {
    return getApp();
  }

  // Priority 1: Connect to Emulators if host variables are set
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    console.log(
      'Emulator environment detected. Initializing Admin SDK for emulators.',
    );
    return initializeApp({ projectId: 'passportflow-dev' });
  }

  // Priority 2: Use local service account credentials if provided in .env
  if (
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  ) {
    console.log(
      'Local Firebase credentials found. Initializing Admin SDK for live project.',
    );
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Replace literal `\n` characters with actual newlines
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    };
    return initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }

  // Priority 3: Default to production environment credentials
  console.log(
    'Production environment detected. Initializing Admin SDK with default credentials.',
  );
  return initializeApp();
}

const app = getAdminApp();

// Explicitly use the initialized app to get the services. This is safer.
export const adminDb = getFirestore(app);
export const adminStorage = getStorage(app);
export const adminAuth = getAuth(app);
export default admin;
