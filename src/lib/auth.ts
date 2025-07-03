// src/lib/auth.ts
import { adminDb } from './firebase-admin';
import { Collections, UserRoles, type Role } from './constants';
import type { User, Company } from '@/types';
import { Timestamp } from 'firebase-admin/firestore';

function docToUser(doc: admin.firestore.DocumentSnapshot): User {
  const data = doc.data()!;
  return {
    id: doc.id,
    ...data,
    createdAt: (data.createdAt as Timestamp)?.toDate().toISOString(),
    updatedAt: (data.updatedAt as Timestamp)?.toDate().toISOString(),
  } as User;
}

function docToCompany(doc: admin.firestore.DocumentSnapshot): Company {
  const data = doc.data()!;
  return {
    id: doc.id,
    ...data,
    createdAt: (data.createdAt as Timestamp)?.toDate().toISOString(),
    updatedAt: (data.updatedAt as Timestamp)?.toDate().toISOString(),
  } as Company;
}

/**
 * Fetches all users from the database.
 * @returns A promise that resolves to an array of all users.
 */
export async function getUsers(): Promise<User[]> {
  const snapshot = await adminDb.collection(Collections.USERS).get();
  if (snapshot.empty) return [];
  return snapshot.docs.map(docToUser);
}

/**
 * Fetches all companies from the database.
 * @returns A promise that resolves to an array of all companies.
 */
export async function getCompanies(): Promise<Company[]> {
  const snapshot = await adminDb.collection(Collections.COMPANIES).get();
  if (snapshot.empty) return [];
  return snapshot.docs.map(docToCompany);
}

/**
 * Fetches users by their company ID from the database.
 * @param companyId The ID of the company.
 * @returns A promise that resolves to an array of users in that company.
 */
export async function getUsersByCompanyId(companyId: string): Promise<User[]> {
  const snapshot = await adminDb
    .collection(Collections.USERS)
    .where('companyId', '==', companyId)
    .get();
  if (snapshot.empty) return [];
  return snapshot.docs.map(docToUser);
}

/**
 * Fetches a user by their ID from the database.
 * @param id The ID of the user to fetch.
 * @returns A promise that resolves to the user or undefined if not found.
 */
export async function getUserById(id: string): Promise<User | undefined> {
  const doc = await adminDb.collection(Collections.USERS).doc(id).get();
  if (!doc.exists) return undefined;
  return docToUser(doc);
}

/**
 * Fetches a user by their email address from the database.
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
  return docToUser(snapshot.docs[0]);
}

/**
 * Fetches a company by its ID from the database.
 * @param id The ID of the company to fetch.
 * @returns A promise that resolves to the company or undefined if not found.
 */
export async function getCompanyById(id: string): Promise<Company | undefined> {
  const doc = await adminDb.collection(Collections.COMPANIES).doc(id).get();
  if (!doc.exists) return undefined;
  return docToCompany(doc);
}

/**
 * Simulates fetching the current user based on a role.
 * This function fetches from the database. In a real app, this would be
 * derived from the authenticated session. It now robustly handles an
 * empty database or missing roles.
 * @param role The role to simulate being logged in as.
 * @returns A user object.
 */
export async function getCurrentUser(role?: Role): Promise<User> {
  const targetRole = role || UserRoles.ADMIN;

  const usersSnapshot = await adminDb.collection(Collections.USERS).get();
  if (usersSnapshot.empty) {
    throw new Error(
      `No users found in the database. Please run 'npm run seed' to populate it.`,
    );
  }

  const allUsers = usersSnapshot.docs.map(docToUser);

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
