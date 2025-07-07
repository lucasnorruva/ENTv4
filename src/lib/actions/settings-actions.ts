// src/lib/actions/settings-actions.ts
'use server';

import type { ApiSettings } from '@/types';
import {
  apiSettingsSchema,
  type ApiSettingsFormValues,
} from '@/lib/schemas';
import { getUserById } from '@/lib/auth';
import { checkPermission } from '@/lib/permissions';
// Import the data directly for modification
import { apiSettings } from '@/lib/api-settings';
import { logAuditEvent } from './audit-actions';

// The getApiSettingsData function is fetched by server components directly from /lib/api-settings.ts
// This file only needs to export the server action for saving.

export async function saveApiSettings(
  values: ApiSettingsFormValues,
  userId: string,
): Promise<ApiSettings> {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');
  checkPermission(user, 'admin:manage_settings');

  const validatedData = apiSettingsSchema.parse(values);
  
  // Directly modify the imported mock data object
  Object.assign(apiSettings, validatedData);

  await logAuditEvent('settings.api.updated', 'global', { values }, userId);
  return Promise.resolve(apiSettings);
}
