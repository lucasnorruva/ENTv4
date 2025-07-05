// src/lib/actions/api-actions.ts
'use server';

import type { ApiKey, ApiSettings, Product, Webhook } from '@/types';
import {
  apiSettingsSchema,
  type ApiSettingsFormValues,
  webhookFormSchema,
  type WebhookFormValues,
  apiKeyFormSchema,
  type ApiKeyFormValues,
} from '@/lib/schemas';
import { getUserById } from '@/lib/auth';
import { hasRole } from '@/lib/auth-utils';
import { UserRoles } from '@/lib/constants';
import { checkPermission, PermissionError } from '@/lib/permissions';
import { apiKeys as mockApiKeys } from '@/lib/api-key-data';
import { apiSettings as mockApiSettings } from '@/lib/api-settings-data';
import { webhooks as mockWebhooks } from '@/lib/webhook-data';
import { getAuditLogById, logAuditEvent } from './audit-actions';
import { getProductById } from './product-actions';
import { sendWebhook } from '@/services/webhooks';
import { newId } from './utils';

export async function getWebhooks(userId?: string): Promise<Webhook[]> {
  if (userId) {
    const user = await getUserById(userId);
    if (!user || !hasRole(user, UserRoles.DEVELOPER)) return [];
    return Promise.resolve(mockWebhooks.filter(w => w.userId === userId));
  }
  return Promise.resolve(mockWebhooks);
}

export async function getWebhookById(
  id: string,
  userId: string,
): Promise<Webhook | undefined> {
  const user = await getUserById(userId);
  if (!user || !hasRole(user, UserRoles.DEVELOPER)) return undefined;

  const webhook = mockWebhooks.find(w => w.id === id);
  return Promise.resolve(webhook?.userId === userId ? webhook : undefined);
}

export async function saveWebhook(
  values: WebhookFormValues,
  userId: string,
  webhookId?: string,
): Promise<Webhook> {
  const validatedData = webhookFormSchema.parse(values);
  const user = await getUserById(userId);
  if (!user) throw new PermissionError('User not found.');
  checkPermission(user, 'developer:manage_api');

  const now = new Date().toISOString();
  let savedWebhook: Webhook;

  if (webhookId) {
    const webhookIndex = mockWebhooks.findIndex(wh => wh.id === webhookId);
    if (webhookIndex === -1) throw new Error('Webhook not found.');
    savedWebhook = {
      ...mockWebhooks[webhookIndex],
      ...validatedData,
      updatedAt: now,
    };
    mockWebhooks[webhookIndex] = savedWebhook;
    await logAuditEvent(
      'webhook.updated',
      webhookId,
      { changes: Object.keys(values) },
      userId,
    );
  } else {
    savedWebhook = {
      id: newId('wh'),
      ...validatedData,
      userId,
      createdAt: now,
      updatedAt: now,
    };
    mockWebhooks.push(savedWebhook);
    await logAuditEvent(
      'webhook.created',
      savedWebhook.id,
      { url: validatedData.url },
      userId,
    );
  }
  return Promise.resolve(savedWebhook);
}

export async function deleteWebhook(
  webhookId: string,
  userId: string,
): Promise<void> {
  const user = await getUserById(userId);
  if (!user) throw new PermissionError('User not found.');
  checkPermission(user, 'developer:manage_api');

  const index = mockWebhooks.findIndex(
    wh => wh.id === webhookId && wh.userId === userId,
  );
  if (index > -1) {
    mockWebhooks.splice(index, 1);
    await logAuditEvent('webhook.deleted', webhookId, {}, userId);
  }
  return Promise.resolve();
}

export async function replayWebhook(
  logId: string,
  userId: string,
): Promise<void> {
  const user = await getUserById(userId);
  if (!user) throw new PermissionError('User not found.');
  checkPermission(user, 'developer:manage_api');

  const log = await getAuditLogById(logId);
  if (!log || !log.action.includes('webhook.delivery.failure')) {
    throw new Error('Log not found or not a failed delivery.');
  }

  const webhook = await getWebhookById(log.entityId, user.id);
  const webhookBodyString = log.details.payload;

  if (!webhook || !webhookBodyString) {
    throw new Error('Could not find original webhook or payload for replay.');
  }

  const webhookBody = JSON.parse(webhookBodyString);
  const productPayload: Product = webhookBody.payload;

  sendWebhook(webhook, log.details.event, productPayload);

  await logAuditEvent(
    'webhook.replay.initiated',
    log.entityId,
    { originalLogId: logId },
    userId,
  );
}

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

export async function getApiSettings(): Promise<ApiSettings> {
  return Promise.resolve(mockApiSettings);
}

export async function saveApiSettings(
  values: ApiSettingsFormValues,
  userId: string,
): Promise<ApiSettings> {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');
  checkPermission(user, 'admin:manage_settings');

  const validatedData = apiSettingsSchema.parse(values);
  Object.assign(mockApiSettings, validatedData);
  await logAuditEvent('settings.api.updated', 'global', { values }, userId);
  return Promise.resolve(mockApiSettings);
}
