// src/lib/auth.ts
import { users as mockUsers } from './user-data';
import { companies as mockCompanies } from './company-data';
import { UserRoles, type Role } from './constants';
import type { User, Company } from '@/types';

/**
 * Simulates fetching all users.
 * @returns A promise that resolves to an array of all mock users.
 */
export async function getUsers(): Promise<User[]> {
  return mockUsers;
}

/**
 * Simulates fetching a user by their ID.
 * @param id The ID of the user to fetch.
 * @returns A promise that resolves to the user or undefined if not found.
 */
export async function getUserById(id: string): Promise<User | undefined> {
  return mockUsers.find(user => user.id === id);
}

/**
 * Simulates fetching a user by their email address.
 * @param email The email of the user to fetch.
 * @returns A promise that resolves to the user or undefined if not found.
 */
export async function getUserByEmail(email: string): Promise<User | undefined> {
  return mockUsers.find(user => user.email === email);
}

/**
 * Simulates fetching a company by its ID.
 * @param id The ID of the company to fetch.
 * @returns A promise that resolves to the company or undefined if not found.
 */
export async function getCompanyById(id: string): Promise<Company | undefined> {
  return mockCompanies.find(company => company.id === id);
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
  const user = mockUsers.find(u => u.roles.includes(role));
  if (!user) {
    // Fallback to the first user if no specific role match is found
    return mockUsers[0];
  }
  return user;
}
