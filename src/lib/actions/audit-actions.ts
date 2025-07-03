// src/lib/actions/audit-actions.ts
'use server';

import type { AuditLog } from '@/types';
import { auditLogs as mockAuditLogs } from '@/lib/audit-log-data';
import { getUserById } from '@/lib/auth';
import { newId } from './utils';

export async function logAuditEvent(
  action: string,
  entityId: string,
  details: Record<string, any>,
  userId: string,
): Promise<void> {
  // Allow 'system' and 'guest' users to log events without being in the user table.
  if (userId !== 'system' && userId !== 'guest') {
    const user = await getUserById(userId);
    if (!user) {
      console.warn(`Audit log attempt for non-existent user: ${userId}`);
      return;
    }
  }

  const now = new Date().toISOString();
  const newLog: AuditLog = {
    id: newId('log'),
    userId,
    action,
    entityId,
    details,
    createdAt: now,
    updatedAt: now,
  };
  mockAuditLogs.unshift(newLog);
  return Promise.resolve();
}

export async function getAuditLogs(filters?: {
  companyId?: string;
}): Promise<AuditLog[]> {
  // Mock data doesn't have companyId, so we ignore the filter for now
  // In a real app, you'd filter by companyId if provided
  return Promise.resolve(
    [...mockAuditLogs].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    ),
  );
}

export async function getAuditLogsForEntity(
  entityId: string,
): Promise<AuditLog[]> {
  return Promise.resolve(
    [...mockAuditLogs]
      .filter(log => log.entityId === entityId)
      .sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
  );
}

export async function getAuditLogsForUser(userId: string): Promise<AuditLog[]> {
    return Promise.resolve(
      [...mockAuditLogs]
        .filter(log => log.userId === userId)
        .sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
    );
  }

export async function getAuditLogById(
  logId: string,
): Promise<AuditLog | undefined> {
  return Promise.resolve(mockAuditLogs.find(log => log.id === logId));
}
