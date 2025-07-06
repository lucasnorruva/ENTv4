// src/lib/api-auth.ts
import { headers } from 'next/headers';
import { getUserById, getApiKeyByRawToken } from '@/lib/auth';
import type { User, ApiKey } from '@/types';
import { PermissionError } from './permissions';
import { checkRateLimit, RateLimitError } from '@/services/rate-limiter';

/**
 * Authenticates an API request using a Bearer token.
 *
 * This function performs the following steps:
 * 1. Extracts the token from the Authorization header.
 * 2. Looks up the API key using the raw token (mock implementation).
 * 3. Checks if the key is active.
 * 4. Finds the user associated with the key.
 * 5. Checks the rate limit for the API key.
 * 6. Updates the `lastUsed` timestamp on the key.
 *
 * @throws {PermissionError} if authentication fails for any reason.
 * @throws {RateLimitError} if the rate limit is exceeded.
 * @returns {Promise<User>} A promise that resolves to the authenticated user.
 */
export async function authenticateApiRequest(): Promise<User> {
  const authorization = headers().get('Authorization');

  if (!authorization || !authorization.startsWith('Bearer ')) {
    throw new PermissionError('Missing or malformed Authorization header.');
  }

  const token = authorization.split(' ')[1];
  if (!token) {
    throw new PermissionError('API token is missing.');
  }

  const apiKey = await getApiKeyByRawToken(token);

  if (!apiKey || apiKey.status !== 'Active') {
    throw new PermissionError('Invalid or revoked API key.');
  }

  const user = await getUserById(apiKey.userId);
  if (!user) {
    throw new PermissionError('API key is not associated with a valid user.');
  }

  // Perform rate limiting check
  // For mock purposes, we'll assume a 'pro' tier for the developer user.
  // A real implementation might store the tier on the ApiKey or User object.
  await checkRateLimit(apiKey.id, 'pro');

  // Update lastUsed timestamp (fire-and-forget)
  apiKey.lastUsed = new Date().toISOString();

  return user;
}
