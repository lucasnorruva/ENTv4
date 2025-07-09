
import TestGeneratorClient from '@/components/test-generator-client';
import { getCurrentUser } from '@/lib/auth';
import { UserRoles } from '@/lib/constants';
import { redirect } from 'next/navigation';
import { hasRole } from '@/lib/auth-utils';

export default async function TestGeneratorPage() {
  const user = await getCurrentUser(UserRoles.DEVELOPER);

  if (!hasRole(user, UserRoles.DEVELOPER)) {
      redirect('/dashboard');
  }

  return <TestGeneratorClient user={user} />;
}
