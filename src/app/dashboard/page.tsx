import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { UserRoles } from '@/lib/constants';

// The root dashboard page redirects to the user's primary role-based dashboard.
export default async function DashboardPage() {
  // In a real app, we'd get the user from the session. Here we get the default supplier.
  const user = await getCurrentUser(UserRoles.SUPPLIER);
  const roleSlug = user.roles[0].toLowerCase().replace(/ /g, '-');
  redirect(`/dashboard/${roleSlug}`);
}
