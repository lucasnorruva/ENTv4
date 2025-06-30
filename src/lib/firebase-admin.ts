// src/lib/firebase-admin.ts

import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    // When running on Firebase servers, the config is automatically provided.
    // When running locally, you need to set the GOOGLE_APPLICATION_CREDENTIALS
    // environment variable to point to your service account key file.
    admin.initializeApp();
    console.log('Firebase Admin SDK initialized successfully.');
  } catch (error) {
    console.error(
      'Firebase Admin SDK initialization failed. Ensure GOOGLE_APPLICATION_CREDENTIALS is set for local development.',
      error,
    );
  }
}

export const adminDb = admin.firestore();
export const adminStorage = admin.storage();
export const adminAuth = admin.auth();
export default admin;
