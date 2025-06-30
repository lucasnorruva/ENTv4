// src/lib/auth.ts
import { adminDb } from './firebase-admin';
import { Collections, UserRoles, type Role } from './constants';
import type { User } from '@/types';

// Helper to convert Firestore doc to User, handling Timestamps
const toUser = (doc: FirebaseFirestore.DocumentSnapshot): User => {
  const data = doc.data() as any;
  if (!data) throw new Error('User document data is missing.');
  return {
    id: doc.id,
    fullName: data.fullName,
    email: data.email,
    companyId: data.companyId,
    roles: data.roles,
    createdAt: data.createdAt?.toDate().toISOString(),
    updatedAt: data.updatedAt?.toDate().toISOString(),
  };
};

/**
 * Fetches all users from Firestore.
 * @returns A promise that resolves to an array of all users.
 */
export async function getUsers(): Promise<User[]> {
  const snapshot = await adminDb.collection(Collections.USERS).get();
  if (snapshot.empty) {
    return [];
  }
  return snapshot.docs.map(toUser);
}

/**
 * Fetches the current user based on a role by querying Firestore.
 * In a real application, this would involve validating a session token.
 * For this mock, we just find the first user with the requested role.
 * @param role The role to simulate being logged in as.
 * @returns A mock user object.
 */
export async function getCurrentUser(role: Role): Promise<User> {
  const userSnapshot = await adminDb
    .collection(Collections.USERS)
    .where('roles', 'array-contains', role)
    .limit(1)
    .get();

  if (!userSnapshot.empty) {
    return toUser(userSnapshot.docs[0]);
  }

  // Fallback to the first admin user if the role is not found
  const adminSnapshot = await adminDb
    .collection(Collections.USERS)
    .where('roles', 'array-contains', UserRoles.ADMIN)
    .limit(1)
    .get();

  if (!adminSnapshot.empty) {
    return toUser(adminSnapshot.docs[0]);
  }

  throw new Error(
    'No suitable user found in the database. Please seed the database first.',
  );
}
