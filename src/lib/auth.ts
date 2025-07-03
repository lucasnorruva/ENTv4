// src/lib/auth.ts
import { users as mockUsers } from './user-data';
import { companies as mockCompanies } from './company-data';
import { UserRoles, type Role } from './constants';
import type { User, Company } from '@/types';

/**
 * Fetches all users from the mock data.
 * @returns A promise that resolves to an array of all users.
 */
export async function getUsers(): Promise<User[]> {
  return Promise.resolve(mockUsers);
}

/**
 * Fetches all companies from the mock data.
 * @returns A promise that resolves to an array of all companies.
 */
export async function getCompanies(): Promise<Company[]> {
  return Promise.resolve(mockCompanies);
}

/**
 * Fetches users by their company ID from mock data.
 * @param companyId The ID of the company.
 * @returns A promise that resolves to an array of users in that company.
 */
export async function getUsersByCompanyId(companyId: string): Promise<User[]> {
  return Promise.resolve(mockUsers.filter(u => u.companyId === companyId));
}

/**
 * Fetches a user by their ID from mock data.
 * @param id The ID of the user to fetch.
 * @returns A promise that resolves to the user or undefined if not found.
 */
export async function getUserById(id: string): Promise<User | undefined> {
  return Promise.resolve(mockUsers.find(user => user.id === id));
}

/**
 * Fetches a user by their email address from mock data.
 * @param email The email of the user to fetch.
 * @returns A promise that resolves to the user or undefined if not found.
 */
export async function getUserByEmail(email: string): Promise<User | undefined> {
  return Promise.resolve(mockUsers.find(user => user.email === email));
}

/**
 * Fetches a company by its ID from mock data.
 * @param id The ID of the company to fetch.
 * @returns A promise that resolves to the company or undefined if not found.
 */
export async function getCompanyById(id: string): Promise<Company | undefined> {
  return Promise.resolve(mockCompanies.find(company => company.id === id));
}

/**
 * Simulates fetching the current user based on a role.
 * This function fetches from mock data. In a real app, this would be
 * derived from the authenticated session. It now robustly handles an
 * empty database or missing roles.
 * @param role The role to simulate being logged in as.
 * @returns A user object.
 */
export async function getCurrentUser(role?: Role): Promise<User> {
  const targetRole = role || UserRoles.ADMIN;

  if (mockUsers.length === 0) {
    throw new Error(
      `No users found in mock data. This indicates a problem with the mock data files.`,
    );
  }

  // Find a user with the desired role.
  const userWithRole = mockUsers.find(u => u.roles.includes(targetRole));
  if (userWithRole) {
    return userWithRole;
  }

  // As a fallback for the demo, return the first user.
  console.warn(
    `No user found with role '${targetRole}'. Returning the first available user as a fallback.`,
  );
  return mockUsers[0];
}
