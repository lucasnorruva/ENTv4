// src/lib/actions/compliance-actions.ts
'use server';

import type { CompliancePath } from '@/types';
import {
  compliancePathFormSchema,
  type CompliancePathFormValues,
} from '@/schemas';
import { compliancePaths as mockCompliancePaths } from '@/compliance-data';
import { getUserById } from '@/auth';
import { checkPermission, PermissionError } from '@/permissions';
import { logAuditEvent } from './audit-actions';
import { newId } from './utils';
import { generateComplianceRules as generateComplianceRulesFlow } from '@/ai/flows/generate-compliance-rules';

export async function getCompliancePaths(): Promise<CompliancePath[]> {
  return Promise.resolve(mockCompliancePaths);
}

export async function getCompliancePathById(
  id: string,
): Promise<CompliancePath | undefined> {
  return Promise.resolve(mockCompliancePaths.find(p => p.id === id));
}

export async function saveCompliancePath(
  values: CompliancePathFormValues,
  userId: string,
  pathId?: string,
): Promise<CompliancePath> {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');
  checkPermission(user, 'compliance:manage');

  const validatedData = compliancePathFormSchema.parse(values);
  const now = new Date().toISOString();
  let savedPath: CompliancePath;

  const pathData = {
    name: validatedData.name,
    description: validatedData.description,
    category: validatedData.category,
    regulations: validatedData.regulations
      .map(item => item.value)
      .filter(Boolean),
    rules: {
      minSustainabilityScore: validatedData.minSustainabilityScore,
      requiredKeywords: validatedData.requiredKeywords
        ?.map(item => item.value)
        .filter(Boolean),
      bannedKeywords: validatedData.bannedKeywords
        ?.map(item => item.value)
        .filter(Boolean),
    },
    updatedAt: now,
  };

  if (pathId) {
    const pathIndex = mockCompliancePaths.findIndex(p => p.id === pathId);
    if (pathIndex === -1) throw new Error('Path not found');
    savedPath = {
      ...mockCompliancePaths[pathIndex],
      ...pathData,
      createdAt: mockCompliancePaths[pathIndex].createdAt,
      id: pathId,
    };
    mockCompliancePaths[pathIndex] = savedPath;
    await logAuditEvent('compliance_path.updated', pathId, {}, userId);
  } else {
    savedPath = { id: newId('cp'), ...pathData, createdAt: now };
    mockCompliancePaths.push(savedPath);
    await logAuditEvent('compliance_path.created', savedPath.id, {}, userId);
  }
  return Promise.resolve(savedPath);
}

export async function deleteCompliancePath(
  pathId: string,
  userId: string,
): Promise<void> {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');
  checkPermission(user, 'compliance:manage');

  const index = mockCompliancePaths.findIndex(p => p.id === pathId);
  if (index > -1) {
    mockCompliancePaths.splice(index, 1);
    await logAuditEvent('compliance_path.deleted', pathId, {}, userId);
  }
  return Promise.resolve();
}

export async function generateComplianceRules(
  name: string,
  regulations: string[],
  userId: string,
) {
  const user = await getUserById(userId);
  if (!user) throw new PermissionError('User not found.');
  checkPermission(user, 'compliance:manage');

  if (!name || regulations.length === 0) {
    throw new Error('Path name and at least one regulation are required.');
  }

  return await generateComplianceRulesFlow({ name, regulations });
}
