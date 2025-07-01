
// src/lib/firebase-admin.ts
import * as admin from 'firebase-admin';
import { getApp, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import fs from 'fs';
import path from 'path';

function initializeAdminApp(): App {
  // If an app is already initialized, return it.
  if (getApps().length > 0) {
    return getApp();
  }

  // Check if emulators are running (this env var is set by `firebase emulators:exec`)
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    console.log('✅ Admin SDK: Emulator environment detected. Connecting to emulators.');
    return initializeApp({
      projectId: 'passportflow-dev',
    });
  }

  // Fallback for development server (`npm run dev`) where the above env var might not be set.
  if (process.env.NODE_ENV === 'development') {
    console.log('✅ Admin SDK: Development mode detected. Manually configuring for emulators.');
    // Set emulator hosts for other services if they are not already set
    process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
    process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
    process.env.FIREBASE_STORAGE_EMULATOR_HOST = '127.0.0.1:9199';
    
    return initializeApp({
      projectId: 'passportflow-dev',
    });
  }

  // For production or when no emulator is detected, use service account credentials.
  const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');
  
  if (!fs.existsSync(serviceAccountPath)) {
    throw new Error(
      `Service account key not found at ${serviceAccountPath}. This file is required for production. If developing, ensure emulators are running or the file exists.`
    );
  }

  console.log(`✅ Admin SDK: Production environment detected. Initializing with service account key: ${serviceAccountPath}`);
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
