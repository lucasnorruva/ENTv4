// src/lib/auth.ts
import { UserRoles, type Role, Collections } from './constants';
import type { User, Company } from '@/types';
import { adminDb } from './firebase-admin';

/**
 * Simulates fetching all users from Firestore.
 * @returns A promise that resolves to an array of all users.
 */
export async function getUsers(): Promise<User[]> {
  const snapshot = await adminDb.collection(Collections.USERS).get();
  if (snapshot.empty) return [];
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...(doc.data() as Omit<User, 'id'>),
  }));
}

/**
 * Fetches a user by their ID from Firestore.
 * @param id The ID of the user to fetch.
 * @returns A promise that resolves to the user or undefined if not found.
 */
export async function getUserById(id: string): Promise<User | undefined> {
  const doc = await adminDb.collection(Collections.USERS).doc(id).get();
  if (!doc.exists) return undefined;
  return { id: doc.id, ...(doc.data() as Omit<User, 'id'>) };
}

/**
 * Fetches a user by their email address from Firestore.
 * @param email The email of the user to fetch.
 * @returns A promise that resolves to the user or undefined if not found.
 */
export async function getUserByEmail(email: string): Promise<User | undefined> {
  const snapshot = await adminDb
    .collection(Collections.USERS)
    .where('email', '==', email)
    .limit(1)
    .get();
  if (snapshot.empty) return undefined;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...(doc.data() as Omit<User, 'id'>) };
}

/**
 * Fetches a company by its ID from Firestore.
 * @param id The ID of the company to fetch.
 * @returns A promise that resolves to the company or undefined if not found.
 */
export async function getCompanyById(id: string): Promise<Company | undefined> {
  const doc = await adminDb.collection(Collections.COMPANIES).doc(id).get();
  if (!doc.exists) return undefined;
  return { id: doc.id, ...(doc.data() as Omit<Company, 'id'>) };
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
 * Simulates fetching the current user based on a role.
 * In a real application, this would involve validating a session token.
 * For this mock, we find the first user that has the requested role.
 * @param role The role to simulate being logged in as.
 * @returns A mock user object.
 */
export async function getCurrentUser(role: Role): Promise<User> {
  const snapshot = await adminDb
    .collection(Collections.USERS)
    .where('roles', 'array-contains', role)
    .limit(1)
    .get();

  if (!snapshot.empty) {
    const doc = snapshot.docs[0];
    return { id: doc.id, ...(doc.data() as Omit<User, 'id'>) };
  }

  // Fallback to the first admin user if no specific role match is found
  const adminSnapshot = await adminDb
    .collection(Collections.USERS)
    .where('roles', 'array-contains', UserRoles.ADMIN)
    .limit(1)
    .get();
  
  if(!adminSnapshot.empty) {
    const doc = adminSnapshot.docs[0];
    return { id: doc.id, ...(doc.data() as Omit<User, 'id'>) };
  }
  
  throw new Error("No suitable user found for the given role and no admin fallback available.");
}
