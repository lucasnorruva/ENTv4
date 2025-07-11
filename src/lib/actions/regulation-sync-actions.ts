
// src/lib/actions/regulation-sync-actions.ts
'use server';

import type { CompliancePath, ComplianceGap, RegulationSource, User, Product } from '@/types';
import { regulationSyncData } from '../regulation-sync-data';
import { getUserById } from '../auth';
import { checkPermission } from '../permissions';
import { logAuditEvent } from './audit-actions';
import { getProductById } from './product-actions';
import { getCompliancePathById } from './compliance-actions';
import { verifyProductAgainstPath } from '@/services/compliance';
import { analyzeNewsReports } from '@/ai/flows/analyze-news-reports';
import type { AnalyzeNewsOutput } from '@/types/ai-outputs';

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
): Promise<{ isCompliant: boolean; gaps: ComplianceGap[], scenario: string }> {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');
  checkPermission(user, 'admin:manage_settings');

  const product = await getProductById(productId, user.id);
  if (!product) throw new Error('Product not found');
  if (!product.compliancePathId) throw new Error('Product has no compliance path assigned.');

  const compliancePath = await getCompliancePathById(product.compliancePathId);
  if (!compliancePath) throw new Error('Compliance path not found.');

  // Create a modified copy of the path for the simulation
  let simulatedPath = JSON.parse(JSON.stringify(compliancePath)) as CompliancePath;

  switch (scenario) {
    case 'past':
      // Looser rules for the past
      if (simulatedPath.rules.minSustainabilityScore) {
        simulatedPath.rules.minSustainabilityScore -= 10;
      }
      simulatedPath.regulations = simulatedPath.regulations.filter(r => r === 'RoHS' || r === 'REACH'); // Only older regulations
      break;
    case 'future':
      // Stricter rules for the future
      if (simulatedPath.rules.minSustainabilityScore) {
        simulatedPath.rules.minSustainabilityScore += 15;
      }
      simulatedPath.rules.bannedKeywords = [...(simulatedPath.rules.bannedKeywords || []), 'PVC'];
      break;
    case 'present':
    default:
      // Use current rules
      break;
  }
  
  const { isCompliant, gaps } = await verifyProductAgainstPath(product, simulatedPath);

  await logAuditEvent('regulation.time_machine.run', productId, { scenario, isCompliant, gapCount: gaps.length }, userId);
  
  return { isCompliant, gaps, scenario };
}

export async function runNewsAnalysis(
  newsText: string,
  userId: string,
): Promise<AnalyzeNewsOutput> {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');
  checkPermission(user, 'admin:manage_settings');

  // Split the text into "articles" for the mock flow.
  const articles = newsText.split(/[\n\r]+/).filter(Boolean).map(content => ({ headline: content.substring(0, 50) + "...", content }));

  return analyzeNewsReports({ articles });
}
