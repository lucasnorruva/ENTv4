// src/lib/auth.ts
import { Collections, UserRoles, type Role } from './constants';
import type { User, Company } from '@/types';
import { adminDb } from './firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * Helper to convert a Firestore document snapshot into our typed object.
 * @param doc The Firestore document snapshot.
 * @returns The typed object.
 */
function docToType<T>(doc: FirebaseFirestore.DocumentSnapshot): T {
  const data = doc.data() as any;
  if (!data) return { id: doc.id } as T; // Handle case where doc exists but data is empty
  // Convert Firestore Timestamps to ISO strings for server actions
  Object.keys(data).forEach(key => {
    if (data[key] instanceof Timestamp) {
      data[key] = data[key].toDate().toISOString();
    }
  });
  return { id: doc.id, ...data } as T;
}

/**
 * Fetches all users from the Firestore 'users' collection.
 * @returns A promise that resolves to an array of all users.
 */
export async function getUsers(): Promise<User[]> {
  const snapshot = await adminDb.collection(Collections.USERS).get();
  return snapshot.docs.map(doc => docToType<User>(doc));
}

/**
 * Fetches all companies from the Firestore 'companies' collection.
 * @returns A promise that resolves to an array of all companies.
 */
export async function getCompanies(): Promise<Company[]> {
  const snapshot = await adminDb.collection(Collections.COMPANIES).get();
  return snapshot.docs.map(doc => docToType<Company>(doc));
}

/**
 * Fetches users by their company ID from Firestore.
 * @param companyId The ID of the company.
 * @returns A promise that resolves to an array of users in that company.
 */
export async function getUsersByCompanyId(companyId: string): Promise<User[]> {
  const snapshot = await adminDb
    .collection(Collections.USERS)
    .where('companyId', '==', companyId)
    .get();
  return snapshot.docs.map(doc => docToType<User>(doc));
}

/**
 * Fetches a user by their ID from Firestore.
 * @param id The ID of the user to fetch.
 * @returns A promise that resolves to the user or undefined if not found.
 */
export async function getUserById(id: string): Promise<User | undefined> {
  const doc = await adminDb.collection(Collections.USERS).doc(id).get();
  return doc.exists ? docToType<User>(doc) : undefined;
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
  if (snapshot.empty) {
    return undefined;
  }
  return docToType<User>(snapshot.docs[0]);
}

/**
 * Fetches a company by its ID from Firestore.
 * @param id The ID of the company to fetch.
 * @returns A promise that resolves to the company or undefined if not found.
 */
export async function getCompanyById(id: string): Promise<Company | undefined> {
  const doc = await adminDb.collection(Collections.COMPANIES).doc(id).get();
  return doc.exists ? docToType<Company>(doc) : undefined;
}

/**
 * Simulates fetching the current user based on a role.
 * This function fetches from Firestore. In a real app, this would be
 * derived from the authenticated session. It now robustly handles an
 * empty database or missing roles.
 * @param role The role to simulate being logged in as.
 * @returns A user object.
 */
export async function getCurrentUser(role?: Role): Promise<User> {
  const targetRole = role || UserRoles.ADMIN;

  const allUsers = await getUsers();

  if (allUsers.length === 0) {
    throw new Error(
      `No users found in the database. Please run 'npm run seed' to populate it.`,
    );
  }

  // Find a user with the desired role.
  const userWithRole = allUsers.find(u => u.roles.includes(targetRole));
  if (userWithRole) {
    return userWithRole;
  }

  // As a fallback for the demo, return the first user.
  console.warn(
    `No user found with role '${targetRole}'. Returning the first available user as a fallback.`,
  );
  return allUsers[0];
}
