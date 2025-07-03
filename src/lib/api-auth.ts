// src/lib/api-auth.ts
import { headers } from 'next/headers';
import { getCurrentUser } from '@/lib/auth';
import { UserRoles } from '@/lib/constants';
import type { User } from '@/types';
import { PermissionError } from './permissions';

/**
 * Mocks API key authentication for server-side API routes.
 *
 * In a real application, this function would:
 * 1. Extract the API key from the Authorization header.
 * 2. Look up the key in the database.
 * 3. Validate the key (e.g., check expiry, status, scopes).
 * 4. Return the user associated with the key.
 *
 * For this mock, it simply checks for the presence of any "Bearer" token
 * and returns a hardcoded 'Developer' user.
 *
 * @throws {PermissionError} if the Authorization header is missing or malformed.
 * @returns {Promise<User>} A promise that resolves to the authenticated user.
 */
export async function authenticateApiRequest(): Promise<User> {
  const authorization = headers().get('Authorization');

  if (!authorization || !authorization.startsWith('Bearer ')) {
    throw new PermissionError('Missing or malformed Authorization header.');
  }

  // In this mock, we don't validate the token itself. We just assume if it's
  // present, the user is the generic 'Developer' user.
  const user = await getCurrentUser(UserRoles.DEVELOPER);
  if (!user) {
    throw new PermissionError('Authenticated user could not be found.');
  }

  return user;
}
