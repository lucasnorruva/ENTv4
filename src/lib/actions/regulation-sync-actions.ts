
// src/lib/actions/regulation-sync-actions.ts
'use server';

import type { CompliancePath, RegulationSource, User } from '@/types';
import { regulationSyncData } from '../regulation-sync-data';
import { getUserById } from '../auth';
import { checkPermission } from '../permissions';
import { logAuditEvent } from './audit-actions';
import { getCompliancePaths, saveCompliancePath } from './compliance-actions';
import { analyzeNewsReports as analyzeNewsReportsFlow } from '@/ai/flows/analyze-news-reports';
import { predictRegulationChange } from '@/ai/flows/predict-regulation-change';
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

// This function simulates an automated daily job.
export async function runDailyReferenceDataSync(): Promise<{
  syncedItems: number;
  updatedRegulations: string[];
  details: string;
}> {
  console.log('Running scheduled AI-powered regulatory prediction...');
  await logAuditEvent(
    'cron.prediction_engine.start',
    'dailyRegulatoryPrediction',
    {},
    'system',
  );

  // This mock simulates deriving signals from internal data, not external news.
  const internalSignals = [
    'Increased number of products failing RoHS compliance in the last month.',
    'High number of service tickets related to battery degradation.',
  ];

  const prediction = await predictRegulationChange({
    signals: internalSignals,
    targetIndustry: 'Electronics',
  });
  console.log('AI regulatory prediction:', prediction);

  const allPaths = await getCompliancePaths();
  const pathToUpdate = allPaths.find(
    p =>
      prediction.impactedRegulations.some(reg =>
        p.regulations.includes(reg),
      ) && p.category === 'Electronics',
  );

  if (!pathToUpdate) {
    const details =
      'AI made a prediction, but no matching compliance path was found to update.';
    console.log(details);
    await logAuditEvent(
      'cron.prediction_engine.end',
      'dailyRegulatoryPrediction',
      { details },
      'system',
    );
    return { syncedItems: 0, updatedRegulations: [], details };
  }

  const oldScore = pathToUpdate.rules.minSustainabilityScore || 0;
  const newScore = Math.min(100, oldScore + 1);

  const updatedValues = {
    name: pathToUpdate.name,
    description: `${pathToUpdate.description} [Auto-updated based on AI prediction: ${prediction.prediction}]`,
    category: pathToUpdate.category,
    jurisdiction: pathToUpdate.jurisdiction,
    regulations: pathToUpdate.regulations.map(r => ({ value: r })),
    minSustainabilityScore: newScore,
    requiredKeywords:
      pathToUpdate.rules.requiredKeywords?.map(r => ({ value: r })) || [],
    bannedKeywords:
      pathToUpdate.rules.bannedKeywords?.map(r => ({ value: r })) || [],
  };

  await saveCompliancePath(
    updatedValues,
    'system:prediction_engine',
    pathToUpdate.id,
  );

  const details = `Acted on prediction: "${prediction.prediction}". Updated path '${pathToUpdate.name}': minSustainabilityScore changed from ${oldScore} to ${newScore}.`;

  await logAuditEvent(
    'system.sync.prediction_update',
    pathToUpdate.id,
    {
      change: details,
      prediction,
    },
    'system',
  );

  console.log(`Regulatory prediction sync complete. ${details}`);

  return {
    syncedItems: 1,
    updatedRegulations: [pathToUpdate.name],
    details,
  };
}

export async function runNewsAnalysis(
  topic: string,
  userId: string,
): Promise<AnalyzeNewsOutput> {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');
  checkPermission(user, 'admin:manage_settings');

  return analyzeNewsReportsFlow({ topic, articles: [] }); // Articles are now fetched inside the flow
}
