// src/lib/auth-client.ts
// This file contains client-side authentication helpers, particularly for getting the current user without a server roundtrip after initial load.
'use client';

import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from './firebase';
import type { User } from '@/types';
import { Collections } from './constants';

let currentUserPromise: Promise<User | null> | null = null;
let userCache: User | null = null;

/**
 * Gets the current authenticated user's profile from Firestore.
 * This function is safe to call on the client-side and uses a promise to prevent multiple concurrent fetches on initial load.
 * It also caches the user object for subsequent synchronous calls.
 * @returns A promise that resolves to the User object or null if not authenticated.
 */
export function getCurrentUser(): Promise<User | null> {
  if (userCache) {
    return Promise.resolve(userCache);
  }
  
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
              userCache = userData;
              resolve(userData);
            } else {
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

  // Reset the promise if it fails to allow retries, and clear cache
  currentUserPromise.catch(() => {
    currentUserPromise = null;
    userCache = null;
  });

  return currentUserPromise;
}

/**
 * Sets up a real-time listener for the current user's document.
 * @param callback The function to call with the user data whenever it changes.
 * @returns An unsubscribe function to detach the listener.
 */
export function onCurrentUserUpdate(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, (firebaseUser) => {
        if(firebaseUser) {
            const userDocRef = doc(db, Collections.USERS, firebaseUser.uid);
            return onSnapshot(userDocRef, (doc) => {
                if (doc.exists()) {
                    const userData = { id: doc.id, ...doc.data() } as User;
                    userCache = userData;
                    callback(userData);
                } else {
                    userCache = null;
                    callback(null);
                }
            });
        } else {
            userCache = null;
            callback(null);
        }
    });
}
