// src/lib/actions/api-key-actions.ts
'use server';

import type { ApiKey } from '@/types';
import { apiKeyFormSchema, type ApiKeyFormValues } from '@/lib/schemas';
import { getUserById } from '@/lib/auth';
import { hasRole } from '@/lib/auth-utils';
import { UserRoles } from '@/lib/constants';
import { checkPermission, PermissionError } from '@/lib/permissions';
import { apiKeys as mockApiKeys } from '@/lib/api-key-data';
import { logAuditEvent } from './audit-actions';
import { newId } from './utils';

export async function getApiKeys(userId: string): Promise<ApiKey[]> {
  const user = await getUserById(userId);
  if (!user || !hasRole(user, UserRoles.DEVELOPER)) return [];
  return Promise.resolve(mockApiKeys.filter(k => k.userId === userId));
}

export async function saveApiKey(
  values: ApiKeyFormValues,
  userId: string,
  keyId?: string,
): Promise<{ key: ApiKey; rawToken?: string }> {
  const validatedData = apiKeyFormSchema.parse(values);
  const user = await getUserById(userId);
  if (!user) throw new PermissionError('User not found.');
  checkPermission(user, 'developer:manage_api');

  const now = new Date().toISOString();
  let savedKey: ApiKey;
  let rawToken: string | undefined = undefined;

  if (keyId) {
    const keyIndex = mockApiKeys.findIndex(
      k => k.id === keyId && k.userId === userId,
    );
    if (keyIndex === -1) throw new Error('API Key not found');
    savedKey = {
      ...mockApiKeys[keyIndex],
      label: validatedData.label,
      scopes: validatedData.scopes,
      updatedAt: now,
    };
    mockApiKeys[keyIndex] = savedKey;
    await logAuditEvent(
      'api_key.updated',
      keyId,
      { changes: ['label', 'scopes'] },
      userId,
    );
    return { key: savedKey };
  } else {
    rawToken = `nor_mock_${[...Array(32)]
      .map(() => Math.floor(Math.random() * 16).toString(16))
      .join('')}`;

    savedKey = {
      id: newId('key'),
      label: validatedData.label,
      scopes: validatedData.scopes,
      token: `nor_mock_******************${rawToken.slice(-4)}`,
      rawToken: rawToken, // Store the full token for mock auth
      status: 'Active',
      userId,
      createdAt: now,
      updatedAt: now,
      lastUsed: undefined,
    };
    mockApiKeys.push(savedKey);
    await logAuditEvent(
      'api_key.created',
      savedKey.id,
      { label: savedKey.label },
      userId,
    );
    return { key: savedKey, rawToken };
  }
}

export async function revokeApiKey(
  keyId: string,
  userId: string,
): Promise<ApiKey> {
  const user = await getUserById(userId);
  if (!user) throw new PermissionError('User not found.');
  checkPermission(user, 'developer:manage_api');

  const keyIndex = mockApiKeys.findIndex(
    k => k.id === keyId && k.userId === userId,
  );
  if (keyIndex === -1)
    throw new Error('API Key not found or permission denied.');
  mockApiKeys[keyIndex].status = 'Revoked';
  mockApiKeys[keyIndex].updatedAt = new Date().toISOString();
  await logAuditEvent('api_key.revoked', keyId, {}, userId);
  return Promise.resolve(mockApiKeys[keyIndex]);
}

export async function deleteApiKey(
  keyId: string,
  userId: string,
): Promise<void> {
  const user = await getUserById(userId);
  if (!user) throw new PermissionError('User not found.');
  checkPermission(user, 'developer:manage_api');

  const index = mockApiKeys.findIndex(
    k => k.id === keyId && k.userId === userId,
  );
  if (index > -1) {
    mockApiKeys.splice(index, 1);
    await logAuditEvent('api_key.deleted', keyId, {}, userId);
  }
  return Promise.resolve();
}
