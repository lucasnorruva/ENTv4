// src/lib/auth.ts
import { UserRoles, type Role, Collections } from './constants';
import type { User, Company } from '@/types';

// MOCK DATA IMPORTS
import { users as mockUsers } from './user-data';
import { companies as mockCompanies } from './company-data';

/**
 * Simulates fetching all users from mock data.
 * @returns A promise that resolves to an array of all users.
 */
export async function getUsers(): Promise<User[]> {
  return Promise.resolve(mockUsers);
}

/**
 * Fetches a user by their ID from mock data.
 * @param id The ID of the user to fetch.
 * @returns A promise that resolves to the user or undefined if not found.
 */
export async function getUserById(id: string): Promise<User | undefined> {
  const user = mockUsers.find(u => u.id === id);
  return Promise.resolve(user);
}

/**
 * Fetches a user by their email address from mock data.
 * @param email The email of the user to fetch.
 * @returns A promise that resolves to the user or undefined if not found.
 */
export async function getUserByEmail(email: string): Promise<User | undefined> {
  const user = mockUsers.find(u => u.email === email);
  return Promise.resolve(user);
}

/**
 * Fetches a company by its ID from mock data.
 * @param id The ID of the company to fetch.
 * @returns A promise that resolves to the company or undefined if not found.
 */
export async function getCompanyById(id: string): Promise<Company | undefined> {
  const company = mockCompanies.find(c => c.id === id);
  return Promise.resolve(company);
}

/**
 * Simulates fetching the current user based on a role from mock data.
 * @param role The role to simulate being logged in as.
 * @returns A mock user object.
 */
export async function getCurrentUser(role: Role): Promise<User> {
  const user = mockUsers.find(u => u.roles.includes(role));
  if (user) {
    return Promise.resolve(user);
  }

  // Fallback to the first user if no specific role is found.
  if (mockUsers.length > 0) {
    return Promise.resolve(mockUsers[0]);
  }

  throw new Error(
    "No users found in the mock data file (src/lib/user-data.ts).",
  );
}
