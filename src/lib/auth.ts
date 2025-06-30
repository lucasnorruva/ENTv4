// src/lib/auth.ts
import type { User, Role } from '@/types';
import { UserRoles } from './constants';
import { users as mockUsers } from './user-data';

const roleToUserMap = mockUsers.reduce(
  (acc, user) => {
    const role = user.roles[0];
    if (role) {
      acc[role] = user;
    }
    return acc;
  },
  {} as Record<Role, User>,
);

/**
 * Mocks fetching all users in the system.
 * @returns A promise that resolves to an array of all mock users.
 */
export async function getMockUsers(): Promise<User[]> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 50));
  return JSON.parse(JSON.stringify(mockUsers));
}

/**
 * Mocks fetching the current user based on a role.
 * In a real application, this would involve validating a session token
 * and fetching user data from Firestore.
 * @param role The role to simulate being logged in as.
 * @returns A mock user object.
 */
export async function getCurrentUser(role: Role): Promise<User> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 100));
  return roleToUserMap[role] || roleToUserMap[UserRoles.SUPPLIER];
}
