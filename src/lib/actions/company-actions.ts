// src/lib/actions/company-actions.ts
'use server';

import type { Company } from '@/types';
import {
  companyFormSchema,
  type CompanyFormValues,
  companySettingsSchema,
  type CompanySettingsFormValues,
} from '../schemas';
import { companies as mockCompanies } from '../company-data';
import { getUserById } from '../auth';
import { checkPermission } from '../permissions';
import { logAuditEvent } from './audit-actions';
import { newId } from './utils';

export async function saveCompany(
  values: CompanyFormValues,
  userId: string,
  companyId?: string,
): Promise<Company> {
  const validatedData = companyFormSchema.parse(values);
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');
  checkPermission(user, 'company:manage');

  const now = new Date().toISOString();
  let savedCompany: Company;

  if (companyId) {
    const companyIndex = mockCompanies.findIndex(c => c.id === companyId);
    if (companyIndex === -1) throw new Error('Company not found');
    savedCompany = {
      ...mockCompanies[companyIndex],
      ...validatedData,
      updatedAt: now,
    };
    mockCompanies[companyIndex] = savedCompany;
    await logAuditEvent('company.updated', companyId, {}, userId);
  } else {
    savedCompany = {
      id: newId('comp'),
      ...validatedData,
      createdAt: now,
      updatedAt: now,
      settings: {
        aiEnabled: true,
        apiAccess: false,
        brandingCustomization: false,
      },
    };
    mockCompanies.push(savedCompany);
    await logAuditEvent('company.created', savedCompany.id, {}, userId);
  }
  return Promise.resolve(savedCompany);
}

export async function deleteCompany(
  companyId: string,
  userId: string,
): Promise<void> {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');
  checkPermission(user, 'company:manage');

  const index = mockCompanies.findIndex(c => c.id === companyId);
  if (index > -1) {
    mockCompanies.splice(index, 1);
    await logAuditEvent('company.deleted', companyId, {}, userId);
  }
  return Promise.resolve();
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
  if (companyIndex === -1) throw new Error('Company not found');

  mockCompanies[companyIndex].settings = {
    ...mockCompanies[companyIndex].settings,
    ...validatedData,
  };
  mockCompanies[companyIndex].updatedAt = new Date().toISOString();

  await logAuditEvent(
    'company.settings.updated',
    companyId,
    { settings: Object.keys(values) },
    userId,
  );

  return Promise.resolve(mockCompanies[companyIndex]);
}
