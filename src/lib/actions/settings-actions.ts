// src/lib/actions/settings-actions.ts
'use server';

import type { ApiSettings, Company } from '@/types';
import {
  apiSettingsSchema,
  type ApiSettingsFormValues,
  companySettingsSchema,
  type CompanySettingsFormValues,
} from '@/lib/schemas';
import { getUserById, getCompanyById } from '@/lib/auth';
import { checkPermission } from '@/lib/permissions';
// Import the data directly for modification
import { apiSettings } from '@/lib/api-settings';
import { companies as mockCompanies } from '../company-data';
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

export async function saveCompanySettings(
  companyId: string,
  values: CompanySettingsFormValues,
  userId: string,
): Promise<Company> {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');
  checkPermission(user, 'admin:manage_settings');
  
  const validatedData = companySettingsSchema.parse(values);
  
  const companyIndex = mockCompanies.findIndex(c => c.id === companyId);
  if (companyIndex === -1) {
    throw new Error("Company not found");
  }

  mockCompanies[companyIndex].settings = validatedData;
  mockCompanies[companyIndex].updatedAt = new Date().toISOString();

  await logAuditEvent('settings.company.updated', companyId, { companyId, values }, userId);

  return Promise.resolve(mockCompanies[companyIndex]);
}
