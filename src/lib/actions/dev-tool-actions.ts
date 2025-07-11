// src/lib/actions/dev-tool-actions.ts
'use server';

import { getUserById } from '../auth';
import { checkPermission, PermissionError } from '../permissions';
import { generateComponentTests as generateComponentTestsFlow } from '@/ai/flows/generate-component-tests';
import type { GenerateComponentTestsOutput } from '@/types/ai-outputs';
import { logAuditEvent } from './audit-actions';

export async function generateComponentTest(
  componentName: string,
  componentCode: string,
  userId: string,
): Promise<GenerateComponentTestsOutput> {
  const user = await getUserById(userId);
  if (!user) {
    throw new PermissionError('User not found.');
  }
  // Allow developers to use this tool
  checkPermission(user, 'developer:generate_tests');

  if (!componentName || !componentCode) {
    throw new Error('Component name and code are required.');
  }

  await logAuditEvent(
    'devtool.test.generated',
    componentName,
    { componentName },
    userId,
  );

  return generateComponentTestsFlow({ componentName, componentCode });
}
