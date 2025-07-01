// src/lib/firebase-admin.ts
import * as admin from 'firebase-admin';
import { getApp, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import fs from 'fs';
import path from 'path';

function initializeAdminApp(): App {
  if (getApps().length > 0) {
    return getApp();
  }

  // When running via `firebase emulators:exec`, this variable will be set.
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    console.log(
      '✅ Admin SDK: Emulator environment detected. Connecting to emulators.',
    );
    // A project ID is required, but it can be a dummy one for emulator use.
    return initializeApp({ projectId: 'passportflow-dev' });
  }

  // Otherwise, connect using the service account key for live environments
  // or scripts run outside the emulator context.
  const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');
  if (!fs.existsSync(serviceAccountPath)) {
    throw new Error(
      `Service account key not found at ${serviceAccountPath}. This file is required to connect to the live Firebase project. If you are developing locally, please ensure you are running this script via 'npm run seed' or have the emulators running.`,
    );
  }

  console.log(
    `✅ Admin SDK: Initializing with service account key: ${serviceAccountPath}`,
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
      `Failed to parse service account key file. Please ensure it is valid JSON. Original error: ${error.message}`,
    );
  }
}

const adminApp = initializeAdminApp();

export const adminDb = getFirestore(adminApp);
export const adminStorage = getStorage(adminApp);
export const adminAuth = getAuth(adminApp);
export default admin;
