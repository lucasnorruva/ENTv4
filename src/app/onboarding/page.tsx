import AuthLayout from '@/components/auth-layout';
import OnboardingWizard from '@/components/onboarding-wizard';
import { getCurrentUser } from '@/lib/auth';
import { UserRoles } from '@/lib/constants';

export default async function OnboardingPage() {
  // We need the user to pass to the client component.
  // Using a default role that a new user would have.
  const user = await getCurrentUser(UserRoles.SUPPLIER).catch(() => null);

  return (
    <AuthLayout
      title="Welcome to Norruva!"
      description="Let's get your account set up."
      footerText=""
      footerLinkText=""
      footerLinkHref=""
    >
      <OnboardingWizard user={user} />
    </AuthLayout>
  );
}
