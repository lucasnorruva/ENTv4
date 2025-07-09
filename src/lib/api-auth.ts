// src/lib/api-auth.ts
import { headers } from 'next/headers';
import { getUserById, getApiKeyByRawToken, getCompanyById } from '@/lib/auth';
import type { User, ApiKey, Company } from '@/types';
import { PermissionError } from './permissions';

/**
 * Authenticates an API request using a Bearer token.
 * This function handles authentication and basic key validation but delegates
 * rate limiting to the calling endpoint.
 *
 * This function performs the following steps:
 * 1. Extracts the token from the Authorization header.
 * 2. Looks up the API key using the raw token (mock implementation).
 * 3. Checks if the key is active, not expired, and if the request IP is allowed.
 * 4. Finds the user associated with the key.
 * 5. Updates the `lastUsed` timestamp on the key.
 *
 * @throws {PermissionError} if authentication fails for any reason.
 * @returns {Promise<{ user: User; apiKey: ApiKey; company: Company; }>} A promise that resolves to the authenticated user, their API key, and company info.
 */
export async function authenticateApiRequest(): Promise<{
  user: User;
  apiKey: ApiKey;
  company: Company;
}> {
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

  // Check for expiration
  if (apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date()) {
    // Optionally update status to 'Revoked' here or have a cron job do it.
    throw new PermissionError('API key has expired.');
  }

  // Check IP restrictions
  // NOTE: In a real app, this should handle CIDR ranges properly.
  if (apiKey.ipRestrictions && apiKey.ipRestrictions.length > 0) {
    const requestIp = headers().get('x-forwarded-for')?.split(',')[0].trim();
    if (!requestIp || !apiKey.ipRestrictions.includes(requestIp)) {
      throw new PermissionError('Request IP address is not allowed.');
    }
  }

  const user = await getUserById(apiKey.userId);
  if (!user) {
    throw new PermissionError('API key is not associated with a valid user.');
  }

  const company = await getCompanyById(user.companyId);
  if (!company) {
    throw new PermissionError('User is not associated with a valid company.');
  }

  // Update lastUsed timestamp (fire-and-forget)
  apiKey.lastUsed = new Date().toISOString();

  return { user, apiKey, company };
}
