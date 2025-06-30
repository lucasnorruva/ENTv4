import * as admin from 'firebase-admin';

// This ensures we only initialize the app once.
if (!admin.apps.length) {
  try {
    // When deployed, Firebase automatically provides credentials.
    // For local development, it relies on the GOOGLE_APPLICATION_CREDENTIALS
    // environment variable pointing to your service-account.json file.
    admin.initializeApp();
  } catch (error: any) {
    console.error(
      '❌ Firebase Admin SDK initialization failed. This usually means your service account key is missing or has incorrect permissions.',
    );
    // Re-throwing the error to stop execution if initialization fails.
    throw error;
  }
}

export const adminDb = admin.firestore();
export const adminStorage = admin.storage();
// Get the default bucket. Assumes the default bucket is correctly configured in your Firebase project.
export const adminStorageBucket = adminStorage.bucket();
export default admin;
