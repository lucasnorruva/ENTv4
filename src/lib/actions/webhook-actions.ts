// src/lib/actions/webhook-actions.ts
'use server';

import type { Webhook, Product } from '@/types';
import { webhookFormSchema, type WebhookFormValues } from '@/lib/schemas';
import { getUserById } from '@/lib/auth';
import { hasRole } from '@/lib/auth-utils';
import { UserRoles } from '@/lib/constants';
import { checkPermission, PermissionError } from '@/lib/permissions';
import { webhooks as mockWebhooks } from '@/lib/webhook-data';
import { getAuditLogById, logAuditEvent } from './audit-actions';
import { sendWebhook } from '@/services/webhooks';
import { newId } from './utils';
import { getApiSettingsData } from '@/lib/api-settings';

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

  // Fetch settings to pass to sendWebhook
  const settings = await getApiSettingsData();

  sendWebhook(webhook, log.details.event, productPayload, settings);

  await logAuditEvent(
    'webhook.replay.initiated',
    log.entityId,
    { originalLogId: logId },
    userId,
  );
}
