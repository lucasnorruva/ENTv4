import { redirect } from 'next/navigation';
import { UserRoles } from '@/lib/constants';

export default function DashboardRedirectPage() {
  // Redirect the base /dashboard route to the default role's dashboard.
  const defaultRoleSlug = UserRoles.SUPPLIER.toLowerCase().replace(/ /g, '-');
  redirect(`/dashboard/${defaultRoleSlug}`);
}
