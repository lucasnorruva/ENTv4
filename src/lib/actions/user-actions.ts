// src/lib/actions/user-actions.ts
'use server';

import type { Company, User } from '@/types';
import { UserRoles, type Role } from '@/lib/constants';
import {
  userFormSchema,
  type UserFormValues,
  companyFormSchema,
  type CompanyFormValues,
  onboardingFormSchema,
  type OnboardingFormValues,
} from '@/lib/schemas';
import { getUserById, getCompanyById } from '@/lib/auth';
import { checkPermission } from '@/lib/permissions';
import { users as mockUsers } from '@/lib/user-data';
import { companies as mockCompanies } from '@/lib/company-data';
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

export async function saveUser(
  values: UserFormValues,
  adminId: string,
  userId?: string,
): Promise<User> {
  const validatedData = userFormSchema.parse(values);
  const adminUser = await getUserById(adminId);
  if (!adminUser) throw new Error('Admin user not found');
  checkPermission(adminUser, 'user:manage');

  const now = new Date().toISOString();
  let savedUser: User;

  const userData = {
    fullName: validatedData.fullName,
    email: validatedData.email,
    companyId: validatedData.companyId,
    roles: [validatedData.role as Role],
    updatedAt: now,
  };

  if (userId) {
    const userIndex = mockUsers.findIndex(u => u.id === userId);
    if (userIndex === -1) throw new Error('User not found');
    savedUser = {
      ...mockUsers[userIndex],
      ...userData,
      onboardingComplete: mockUsers[userIndex].onboardingComplete,
      isMfaEnabled: mockUsers[userIndex].isMfaEnabled,
      readNotificationIds: mockUsers[userIndex].readNotificationIds,
      createdAt: mockUsers[userIndex].createdAt,
    };
    mockUsers[userIndex] = savedUser;
    await logAuditEvent('user.updated', userId, {}, adminId);
  } else {
    savedUser = {
      id: newId('user'),
      ...userData,
      createdAt: now,
      onboardingComplete: true, 
      isMfaEnabled: false,
      readNotificationIds: [],
    };
    mockUsers.push(savedUser);
    await logAuditEvent('user.created', savedUser.id, {}, adminId);
  }
  return Promise.resolve(savedUser);
}


export async function deleteUser(
  userId: string,
  adminId: string,
): Promise<void> {
  const adminUser = await getUserById(adminId);
  if (!adminUser) throw new Error('Admin user not found');
  checkPermission(adminUser, 'user:manage');

  const index = mockUsers.findIndex(u => u.id === userId);
  if (index > -1) {
    mockUsers.splice(index, 1);
    await logAuditEvent('user.deleted', userId, {}, adminId);
  }
  return Promise.resolve();
}


export async function createUserAndCompany(
  name: string,
  email: string,
  userId: string,
) {
  const now = new Date().toISOString();
  const newCompany: Company = {
    id: newId('comp'),
    name: `${name}'s Company`,
    ownerId: userId,
    industry: '',
    createdAt: now,
    updatedAt: now,
  };
  mockCompanies.push(newCompany);

  const newUser: User = {
    id: userId,
    fullName: name,
    email: email,
    companyId: newCompany.id,
    roles: [UserRoles.SUPPLIER],
    createdAt: now,
    updatedAt: now,
    onboardingComplete: false,
    isMfaEnabled: false,
    readNotificationIds: [],
  };
  mockUsers.push(newUser);
  return Promise.resolve();
}

export async function completeOnboarding(
  values: OnboardingFormValues,
  userId: string,
) {
  const userIndex = mockUsers.findIndex(u => u.id === userId);
  if (userIndex === -1) throw new Error('User not found');

  const companyIndex = mockCompanies.findIndex(
    c => c.id === mockUsers[userIndex].companyId,
  );
  if (companyIndex === -1) throw new Error('Company not found');

  mockUsers[userIndex].onboardingComplete = true;
  mockUsers[userIndex].updatedAt = new Date().toISOString();

  mockCompanies[companyIndex].name = values.companyName;
  mockCompanies[companyIndex].industry = values.industry;
  mockCompanies[companyIndex].updatedAt = new Date().toISOString();

  await logAuditEvent(
    'user.onboarded',
    userId,
    { companyId: mockUsers[userIndex].companyId },
    userId,
  );
  return Promise.resolve();
}


export async function updateUserProfile(
  userId: string,
  fullName: string,
  actorId: string,
) {
  const userIndex = mockUsers.findIndex(u => u.id === userId);
  if (userIndex > -1) {
    mockUsers[userIndex].fullName = fullName;
    mockUsers[userIndex].updatedAt = new Date().toISOString();
    await logAuditEvent(
      'user.profile.updated',
      userId,
      { fields: ['fullName'] },
      actorId,
    );
  }
  return Promise.resolve();
}

export async function updateUserPassword(
  userId: string,
  current: string,
  newPass: string,
  actorId: string,
) {
  if (current !== 'password123')
    throw new Error('Incorrect current password.');
  console.log(
    `Password for user ${userId} has been updated in mock environment.`,
  );
  await logAuditEvent('user.password.updated', userId, {}, actorId);
  return Promise.resolve();
}


export async function setMfaStatus(
  userId: string,
  enabled: boolean,
  actorId: string,
) {
  const userIndex = mockUsers.findIndex(u => u.id === userId);
  if (userIndex > -1) {
    mockUsers[userIndex].isMfaEnabled = enabled;
    await logAuditEvent('user.mfa.updated', userId, { enabled }, actorId);
  }
}

export async function saveNotificationPreferences(
  userId: string,
  prefs: any,
  actorId: string,
) {
  console.log(`Saving notification preferences for ${userId}`, prefs);
  await logAuditEvent('user.notifications.updated', userId, { prefs }, actorId);
  return Promise.resolve();
}


export async function markAllNotificationsAsRead(userId: string): Promise<void> {
    const user = mockUsers.find(u => u.id === userId);
    if (!user) throw new Error('User not found');
    const { auditLogs: mockAuditLogs } = await import('@/lib/audit-log-data');
    user.readNotificationIds = mockAuditLogs.map(log => log.id);
    return Promise.resolve();
  }
