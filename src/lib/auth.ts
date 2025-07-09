

// src/lib/auth.ts
import { users } from './user-data';
import { companies } from './company-data';
import { UserRoles, type Role } from './constants';
import type { User, Company, ApiKey } from '@/types';
import { apiKeys } from './api-key-data';

/**
 * Fetches all users from the mock database.
 * @returns A promise that resolves to an array of all users.
 */
export async function getUsers(): Promise<User[]> {
  return Promise.resolve([...users]);
}


/**
 * Fetches all companies from the mock database.
 * @returns A promise that resolves to an array of all companies.
 */
export async function getCompanies(): Promise<Company[]> {
  return Promise.resolve(companies);
}

/**
 * Fetches users by their company ID from the mock database.
 * @param companyId The ID of the company.
 * @returns A promise that resolves to an array of users in that company.
 */
export async function getUsersByCompanyId(companyId: string): Promise<User[]> {
  return Promise.resolve(users.filter(u => u.companyId === companyId));
}

/**
 * Fetches a user by their ID from the mock database.
 * @param id The ID of the user to fetch.
 * @returns A promise that resolves to the user or undefined if not found.
 */
export async function getUserById(id: string): Promise<User | undefined> {
  return Promise.resolve(users.find(user => user.id === id));
}

/**
 * Fetches an API key by its raw token string.
 * NOTE: This is for mock purposes only. In production, tokens would be hashed.
 * @param token The raw API token.
 * @returns A promise that resolves to the ApiKey object or undefined.
 */
export async function getApiKeyByRawToken(
  token: string,
): Promise<ApiKey | undefined> {
  // The type assertion is a bit of a hack for the mock scenario.
  return Promise.resolve(apiKeys.find(key => key.rawToken === token));
}

/**
 * Fetches a company by its ID from the mock database.
 * @param id The ID of the company to fetch.
 * @returns A promise that resolves to the company or undefined if not found.
 */
export async function getCompanyById(id: string): Promise<Company | undefined> {
  return Promise.resolve(companies.find(c => c.id === id));
}


/**
 * Simulates fetching the current user based on a role.
 * This is a mock function for demonstration purposes. In a real app, this would be
 * derived from the authenticated session.
 * @param role The role to simulate being logged in as.
 * @returns A user object.
 */
export async function getCurrentUser(role?: Role): Promise<User> {
  const targetRole = role || UserRoles.ADMIN;
  
  const user = users.find(u => u.roles.includes(targetRole));

  if (!user) {
    console.warn(`No mock user found with role '${targetRole}'. Defaulting to first user.`);
    return users[0];
  }

  return user;
}
