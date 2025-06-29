import PassportDashboard from '@/components/passport-dashboard';
import { getPassports } from '@/lib/actions';

export default async function Home() {
  const initialPassports = await getPassports();

  return <PassportDashboard initialPassports={initialPassports} />;
}
