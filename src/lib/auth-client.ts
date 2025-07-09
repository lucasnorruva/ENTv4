// src/lib/auth-client.ts
'use client';

import { auth } from '@/lib/firebase';
import * as firebaseAuth from 'firebase/auth';

/**
 * A client-side helper to sign the user out.
 * It abstracts the Firebase `auth` object away from components.
 */
export function signOut() {
  return firebaseAuth.signOut(auth);
}
