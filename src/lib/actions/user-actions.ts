// src/lib/actions/user-actions.ts
'use server';

import type { User, Company } from '@/types';
import { UserRoles, type Role } from '@/lib/constants';
import {
  userFormSchema,
  type UserFormValues,
  onboardingFormSchema,
  type OnboardingFormValues,
  type BulkUserImportValues,
  type ProfileFormValues,
  type PasswordFormValues,
  type NotificationsFormValues,
} from '@/lib/schemas';
import { getUserById } from '@/lib/auth';
import { checkPermission } from '@/lib/permissions';
import { users as mockUsers } from '@/lib/user-data';
import { logAuditEvent } from './audit-actions';
import { newId } from './utils';
import { adminAuth } from '@/lib/firebase-admin';
import { saveCompany } from './company-actions';

/**
 * Fetches a user by their email address from the mock database.
 * This is a Server Action and can be called from client components.
 * @param email The email of the user to fetch.
 * @returns A promise that resolves to the user or undefined if not found.
 */
export async function getUserByEmail(email: string): Promise<User | undefined> {
  return Promise.resolve(mockUsers.find(user => user.email === email));
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
    roles: validatedData.roles as Role[],
    updatedAt: now,
  };

  if (userId) {
    const userIndex = mockUsers.findIndex(u => u.id === userId);
    if (userIndex === -1) throw new Error('User not found');
    savedUser = {
      ...mockUsers[userIndex],
      ...userData,
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
): Promise<boolean> {
  const adminUser = await getUserById(adminId);
  if (!adminUser) throw new Error('Admin user not found');
  checkPermission(adminUser, 'user:manage');

  const index = mockUsers.findIndex(u => u.id === userId);
  if (index > -1) {
    mockUsers.splice(index, 1);
    await logAuditEvent('user.deleted', userId, {}, adminId);
    return true;
  }
  return false;
}

export async function createUserAndCompany(
  name: string,
  email: string,
  userId: string,
) {
  const newCompany = await saveCompany(
    {
      name: `${name}'s Company`,
      ownerId: userId,
      industry: '',
    },
    'system',
  );

  const newUser: User = {
    id: userId,
    fullName: name,
    email: email,
    avatarUrl: `https://i.pravatar.cc/150?u=${userId}`,
    companyId: newCompany.id,
    roles: [UserRoles.SUPPLIER],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    onboardingComplete: false,
    isMfaEnabled: false,
    readNotificationIds: [],
    notificationPreferences: {
      productUpdates: true,
      complianceAlerts: true,
      platformNews: false,
    },
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

  // Update company with onboarding data
  await saveCompany(
    {
      name: values.companyName,
      ownerId: userId,
      industry: values.industry,
    },
    'system',
    mockUsers[userIndex].companyId,
  );

  mockUsers[userIndex].onboardingComplete = true;
  mockUsers[userIndex].updatedAt = new Date().toISOString();

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
  values: { fullName?: string; avatarUrl?: string },
  actorId: string,
) {
  const userIndex = mockUsers.findIndex(u => u.id === userId);
  if (userIndex > -1) {
    if (values.fullName) {
      mockUsers[userIndex].fullName = values.fullName;
    }
    if (values.avatarUrl) {
      mockUsers[userIndex].avatarUrl = values.avatarUrl;
    }
    mockUsers[userIndex].updatedAt = new Date().toISOString();
    await logAuditEvent(
      'user.profile.updated',
      userId,
      { fields: Object.keys(values) },
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
  prefs: NotificationsFormValues,
  actorId: string,
) {
  const userIndex = mockUsers.findIndex(u => u.id === userId);
  if (userIndex > -1) {
    mockUsers[userIndex].notificationPreferences = prefs;
    mockUsers[userIndex].updatedAt = new Date().toISOString();
    await logAuditEvent('user.notifications.updated', userId, { prefs }, actorId);
  }
  return Promise.resolve();
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  const user = mockUsers.find(u => u.id === userId);
  if (!user) throw new Error('User not found');
  const { auditLogs: mockAuditLogs } = await import('@/lib/audit-log-data');
  user.readNotificationIds = mockAuditLogs.map(log => log.id);
  return Promise.resolve();
}

export async function signInWithMockUser(email: string, pass: string) {
  if (pass !== 'password123') {
    return { success: false, error: 'Invalid credentials' };
  }
  const user = mockUsers.find(user => user.email === email);
  if (user) {
    try {
      const customToken = await adminAuth.createCustomToken(user.id);
      return { success: true, token: customToken };
    } catch (error: any) {
      console.error('Error creating custom token:', error);
      return { success: false, error: error.message };
    }
  }
  return { success: false, error: 'User not found' };
}

export async function bulkCreateUsers(
  usersToImport: BulkUserImportValues[],
  adminId: string,
): Promise<{ createdCount: number }> {
  const adminUser = await getUserById(adminId);
  if (!adminUser) throw new Error('Admin user not found.');
  checkPermission(adminUser, 'user:manage');

  let createdCount = 0;
  for (const userData of usersToImport) {
    try {
      // Simulate creating a user in Firebase Auth
      const mockUserId = newId('user');

      // Create company and user profile in our mock DB
      const newCompany = await saveCompany(
        {
          name: `${userData.fullName}'s Company`,
          ownerId: mockUserId,
          industry: '',
        },
        'system',
      );

      const newUser: User = {
        id: mockUserId,
        fullName: userData.fullName,
        email: userData.email,
        companyId: newCompany.id,
        roles: userData.roles,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        onboardingComplete: true,
        isMfaEnabled: false,
        readNotificationIds: [],
      };
      mockUsers.push(newUser);
      createdCount++;
    } catch (error) {
      console.error(`Failed to import user ${userData.email}:`, error);
      // Continue with the next user
    }
  }

  await logAuditEvent(
    'user.bulk_import',
    'multiple',
    { count: createdCount, attempted: usersToImport.length },
    adminId,
  );

  return { createdCount };
}

export async function deleteOwnAccount(userId: string): Promise<void> {
    const userIndex = mockUsers.findIndex(u => u.id === userId);
    if (userIndex === -1) {
        throw new Error("User not found.");
    }
    // In a real app, you would also delete the Firebase Auth user.
    mockUsers.splice(userIndex, 1);
    await logAuditEvent('user.deleted.self', userId, {}, userId);
    return Promise.resolve();
}
