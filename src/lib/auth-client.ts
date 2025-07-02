// src/lib/auth-client.ts
// This file contains client-side authentication helpers, particularly for getting the current user without a server roundtrip after initial load.
'use client';

import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import type { User } from '@/types';
import { Collections } from './constants';

let currentUserPromise: Promise<User | null> | null = null;

/**
 * Gets the current authenticated user's profile from Firestore.
 * This function is safe to call on the client-side and uses a promise to prevent multiple concurrent fetches.
 * @returns A promise that resolves to the User object or null if not authenticated.
 */
export function getCurrentUser(): Promise<User | null> {
  if (currentUserPromise) {
    return currentUserPromise;
  }

  currentUserPromise = new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        unsubscribe(); // Unsubscribe after the first auth state check
        if (firebaseUser) {
          const userDocRef = doc(db, Collections.USERS, firebaseUser.uid);
          try {
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
              const userData = {
                id: userDoc.id,
                ...userDoc.data(),
              } as User;
              resolve(userData);
            } else {
              // This case might happen if there's a delay or error in user document creation after signup.
              console.warn("Authenticated user document not found in Firestore.");
              resolve(null);
            }
          } catch (error) {
            console.error("Error fetching user document:", error);
            reject(error);
          }
        } else {
          resolve(null);
        }
      },
      (error) => {
        console.error("Auth state change error:", error);
        reject(error);
      }
    );
  });

  // Reset the promise if it rejects to allow retries
  currentUserPromise.catch(() => {
    currentUserPromise = null;
  });

  return currentUserPromise;
}
