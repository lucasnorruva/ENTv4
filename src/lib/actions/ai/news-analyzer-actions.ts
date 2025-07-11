
// src/lib/actions/ai/news-analyzer-actions.ts
'use server';

import type { User } from '@/types';
import type { AnalyzeNewsOutput } from '@/types/ai-outputs';
import { getUserById } from '@/lib/auth';
import { checkPermission } from '@/lib/permissions';
import { analyzeNewsReports as analyzeNewsReportsFlow } from '@/ai/flows/analyze-news-reports';

export async function runNewsAnalysis(
  topic: string,
  userId: string,
): Promise<AnalyzeNewsOutput> {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');
  checkPermission(user, 'admin:manage_settings');

  // The 'articles' array is left empty because the Genkit flow is now responsible
  // for fetching or using mock data based on the topic.
  return analyzeNewsReportsFlow({ topic, articles: [] });
}
