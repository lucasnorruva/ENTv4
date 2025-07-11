// src/lib/actions/regulation-sync-actions.ts
'use server';

import type { Product, RegulationSource } from '@/types';
import { regulationSyncData } from '../regulation-sync-data';
import { getUserById } from '../auth';
import { checkPermission } from '../permissions';
import { logAuditEvent } from './audit-actions';
import { getProductById } from './product-actions';
import { getCompliancePathById } from './compliance-actions';
import { verifyProductAgainstPath } from '@/services/compliance';

// In a real app, this would trigger external API calls.
// Here, we just mock the data fetching and status updates.

export async function getRegulationSources(
  userId: string,
): Promise<RegulationSource[]> {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');
  checkPermission(user, 'admin:manage_settings');
  return Promise.resolve(regulationSyncData);
}

export async function runHealthCheck(
  sourceId: string,
  userId: string,
): Promise<RegulationSource> {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');
  checkPermission(user, 'admin:manage_settings');

  await logAuditEvent('regulation_sync.health_check', sourceId, {}, userId);

  const source = regulationSyncData.find(s => s.id === sourceId);
  if (!source) throw new Error('Source not found');

  // Simulate a health check
  await new Promise(resolve => setTimeout(resolve, 1000));
  source.status = 'Operational'; // Assume it passes for the mock
  source.lastSync = new Date().toISOString();

  return Promise.resolve(source);
}

export async function runSync(
  sourceId: string,
  userId: string,
): Promise<RegulationSource> {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');
  checkPermission(user, 'admin:manage_settings');

  await logAuditEvent('regulation_sync.manual_sync', sourceId, {}, userId);

  const source = regulationSyncData.find(s => s.id === sourceId);
  if (!source) throw new Error('Source not found');

  // Simulate a sync process
  await new Promise(resolve => setTimeout(resolve, 2500));
  source.lastSync = new Date().toISOString();

  // Randomly mark a checklist item as complete
  const incompleteItem = source.checklist.find(item => !item.status);
  if (incompleteItem) {
    incompleteItem.status = true;
  }

  return Promise.resolve(source);
}

export async function runTemporalComplianceCheck(
  productId: string,
  scenario: 'past' | 'present' | 'future',
  userId: string,
) {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');
  const product = await getProductById(productId, userId);
  if (!product || !product.compliancePathId) throw new Error('Product or compliance path not found.');

  const baseCompliancePath = await getCompliancePathById(product.compliancePathId);
  if (!baseCompliancePath) throw new Error('Compliance path not found.');

  let modifiedPath = JSON.parse(JSON.stringify(baseCompliancePath));
  
  // Modify the path based on the scenario
  switch(scenario) {
    case 'past':
      // Looser rules for the past
      modifiedPath.rules.minSustainabilityScore = (modifiedPath.rules.minSustainabilityScore || 20) - 20;
      modifiedPath.rules.bannedKeywords = []; // No bans in the past
      break;
    case 'future':
      // Stricter rules for the future
      modifiedPath.rules.minSustainabilityScore = (modifiedPath.rules.minSustainabilityScore || 60) + 10;
      modifiedPath.rules.bannedKeywords = [...(modifiedPath.rules.bannedKeywords || []), 'PFAS'];
      break;
    case 'present':
      // Use current rules
      break;
  }

  const { isCompliant, gaps } = await verifyProductAgainstPath(product, modifiedPath);
  
  await logAuditEvent('regulation.temporal_check', productId, { scenario, isCompliant, gaps }, userId);
  
  return {
    scenario,
    isCompliant,
    gaps,
  };
}