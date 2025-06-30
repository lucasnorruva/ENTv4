import * as admin from 'firebase-admin';

// This ensures we only initialize the app once.
if (!admin.apps.length) {
  try {
    // When deployed to a Google Cloud environment, Firebase automatically provides credentials.
    // For local development, it relies on the GOOGLE_APPLICATION_CREDENTIALS
    // environment variable pointing to your service-account.json file.
    admin.initializeApp();
  } catch (error: any) {
    // This custom error provides clear, actionable steps for the developer if credentials are missing.
    if (error.code === 'app/invalid-credential') {
      throw new Error(
        'FATAL: Firebase Admin SDK initialization failed. The `service-account.json` file is missing or could not be read. Please take the following steps:\n1. Go to your Firebase project settings > "Service accounts" tab.\n2. Click "Generate new private key" to download your service account file.\n3. Place the downloaded file in the root directory of this project and rename it to `service-account.json`.\n4. Ensure your `.env` file has the line: `GOOGLE_APPLICATION_CREDENTIALS=./service-account.json`\nThis file is sensitive and is already listed in .gitignore to prevent it from being committed.',
      );
    }
    // Re-throw any other unexpected errors.
    throw error;
  }
}

export const adminDb = admin.firestore();
export const adminStorage = admin.storage();
// Get the default bucket. Assumes the default bucket is correctly configured in your Firebase project.
export const adminStorageBucket = adminStorage.bucket();
export default admin;
