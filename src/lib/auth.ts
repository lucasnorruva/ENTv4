// src/lib/auth.ts
import { users } from './user-data';
import { companies } from './company-data';
import { Collections, UserRoles, type Role } from './constants';
import type { User, Company } from '@/types';

/**
 * Fetches all users from the mock data.
 * @returns A promise that resolves to an array of all users.
 */
export async function getUsers(): Promise<User[]> {
  return users;
}

/**
 * Fetches a user by their ID.
 * @param id The ID of the user to fetch.
 * @returns A promise that resolves to the user or undefined if not found.
 */
export async function getUserById(id: string): Promise<User | undefined> {
  return users.find(u => u.id === id);
}

/**
 * Fetches a company by its ID.
 * @param id The ID of the company to fetch.
 * @returns A promise that resolves to the company or undefined if not found.
 */
export async function getCompanyById(id: string): Promise<Company | undefined> {
  return companies.find(c => c.id === id);
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
 * Fetches the current user based on a role from the mock data.
 * In a real application, this would involve validating a session token.
 * For this mock, we just find the first user with the requested role.
 * @param role The role to simulate being logged in as.
 * @returns A mock user object.
 */
export async function getCurrentUser(role: Role): Promise<User> {
  // Find a user that has the requested role.
  const user = users.find(u => u.roles.includes(role));
  if (user) return user;

  // Fallback to the first admin user if the role is not found
  const adminUser = users.find(u => u.roles.includes(UserRoles.ADMIN));
  if (adminUser) return adminUser;

  // Fallback to the very first user if no admin is found
  if (users.length > 0) return users[0];

  throw new Error(
    'No users found in the mock database. Please ensure src/lib/user-data.ts is populated.',
  );
}

/**
 * Simulates fetching mock users for display purposes in client components.
 * This is different from `getUsers` as it's intended for scenarios
 * where we just need a list of users without authentication context.
 */
export async function getMockUsers(): Promise<User[]> {
  return users;
}
