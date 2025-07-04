// src/lib/actions/integration-actions.ts
'use server';

import type { Integration } from '@/types';
import { integrations as mockIntegrations } from '../integration-data';
import { getUserById } from '../auth';
import { checkPermission } from '../permissions';
import { logAuditEvent } from './audit-actions';

export async function getIntegrations(userId: string): Promise<Integration[]> {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');
  checkPermission(user, 'admin:manage_settings');
  return Promise.resolve(mockIntegrations);
}

export async function updateIntegrationStatus(
  integrationId: string,
  enabled: boolean,
  userId: string,
): Promise<Integration> {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');
  checkPermission(user, 'admin:manage_settings');

  const integrationIndex = mockIntegrations.findIndex(i => i.id === integrationId);
  if (integrationIndex === -1) {
    throw new Error('Integration not found');
  }

  mockIntegrations[integrationIndex].enabled = enabled;
  mockIntegrations[integrationIndex].updatedAt = new Date().toISOString();

  await logAuditEvent(
    'integration.status.updated',
    integrationId,
    { enabled },
    userId,
  );

  return Promise.resolve(mockIntegrations[integrationIndex]);
}
