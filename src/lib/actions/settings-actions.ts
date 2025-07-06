// src/lib/actions/settings-actions.ts
'use server';

import type { ApiSettings } from '@/types';
import {
  apiSettingsSchema,
  type ApiSettingsFormValues,
} from '@/lib/schemas';
import { getUserById } from '@/lib/auth';
import { checkPermission } from '@/lib/permissions';
import { apiSettings as mockApiSettings } from '@/lib/api-settings-data';
import { logAuditEvent } from './audit-actions';

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
