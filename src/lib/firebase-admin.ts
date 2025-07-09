// src/lib/firebase-admin.ts

// This file provides a MOCK implementation of the Firebase Admin SDK
// for local development and testing purposes. It allows the application
// to run without a live Firebase connection or service account credentials.

// Mock of the auth().createCustomToken() function.
// In a real app, this would be a cryptographic operation. Here, we just
// return a string that looks like a token for the client to use.
const createCustomToken = async (uid: string): Promise<string> => {
  console.log(
    `[MOCK ADMIN SDK] Generating mock custom token for UID: ${uid}`,
  );
  return `mock-token-for-${uid}`;
};

// Mock adminAuth object that mimics the real Firebase Admin Auth interface.
export const adminAuth = {
  createCustomToken,
  // Add other admin auth methods here if needed for future tests.
  // e.g., getUserByEmail: async (email: string) => { ... },
};

// Mock adminDb object. Currently not needed but kept for structural consistency.
export const adminDb = {};
