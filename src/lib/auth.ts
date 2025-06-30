// src/lib/auth.ts
import { adminDb } from './firebase-admin';
import { Collections, UserRoles, type Role } from './constants';
import type { User, Company } from '@/types';

// Helper to convert Firestore doc to User type
const userFromDoc = (doc: FirebaseFirestore.DocumentSnapshot): User => {
  const data = doc.data() as any;
  return {
    id: doc.id,
    ...data,
    createdAt: data.createdAt?.toDate().toISOString(),
    updatedAt: data.updatedAt?.toDate().toISOString(),
  };
};

// Helper to convert Firestore doc to Company type
const companyFromDoc = (doc: FirebaseFirestore.DocumentSnapshot): Company => {
  const data = doc.data() as any;
  return {
    id: doc.id,
    ...data,
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
  return snapshot.docs.map(userFromDoc);
}

/**
 * Fetches a user by their ID from Firestore.
 * @param id The ID of the user to fetch.
 * @returns A promise that resolves to the user or undefined if not found.
 */
export async function getUserById(id: string): Promise<User | undefined> {
  const doc = await adminDb.collection(Collections.USERS).doc(id).get();
  if (!doc.exists) {
    return undefined;
  }
  return userFromDoc(doc);
}

/**
 * Fetches a company by its ID from Firestore.
 * @param id The ID of the company to fetch.
 * @returns A promise that resolves to the company or undefined if not found.
 */
export async function getCompanyById(id: string): Promise<Company | undefined> {
  const doc = await adminDb.collection(Collections.COMPANIES).doc(id).get();
  if (!doc.exists) {
    return undefined;
  }
  return companyFromDoc(doc);
}

/**
 * Checks if a user has a specific role.
 * @param user The user object.
 * @param role The role to check for.
 * @returns True if the user has the role, false otherwise.
 */
export function hasRole(user: User, role: Role): boolean {
  return user.roles.includes(role);
}

/**
 * Fetches the current user based on a role from Firestore.
 * In a real application, this would involve validating a session token.
 * For this mock, we just find the first user with the requested role.
 * @param role The role to simulate being logged in as.
 * @returns A mock user object.
 */
export async function getCurrentUser(role: Role): Promise<User> {
  // Find a user that has the requested role.
  const snapshot = await adminDb
    .collection(Collections.USERS)
    .where('roles', 'array-contains', role)
    .limit(1)
    .get();

  if (!snapshot.empty) {
    return userFromDoc(snapshot.docs[0]);
  }

  // Fallback to the first admin user if the role is not found
  const adminSnapshot = await adminDb
    .collection(Collections.USERS)
    .where('roles', 'array-contains', UserRoles.ADMIN)
    .limit(1)
    .get();

  if (!adminSnapshot.empty) {
    return userFromDoc(adminSnapshot.docs[0]);
  }

  // Fallback to the very first user if no admin is found
  const anyUserSnapshot = await adminDb
    .collection(Collections.USERS)
    .limit(1)
    .get();
  if (!anyUserSnapshot.empty) {
    return userFromDoc(anyUserSnapshot.docs[0]);
  }

  throw new Error(
    'No users found in the database. Please run the seed script.',
  );
}

/**
 * Simulates fetching mock users for display purposes in client components.
 * This is different from `getUsers` as it's intended for scenarios
 * where we just need a list of users without authentication context.
 */
export async function getMockUsers(): Promise<User[]> {
  // In the Firestore world, this is the same as getUsers
  return getUsers();
}
