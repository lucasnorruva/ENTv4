'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { signInWithMockUser } from '@/lib/actions';
import {
  Loader2,
  UserCog,
  PackageCheck,
  UserCheck,
  ClipboardCheck,
  HardHat,
  Store,
  Wrench,
  Code,
  Recycle,
  BarChart3,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Logo from '@/components/logo';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserRoles } from '@/lib/constants';

const demoUsers = [
  {
    role: UserRoles.ADMIN,
    email: 'admin@norruva.com',
    description:
      'Oversee the platform, manage users, and configure system settings.',
    icon: UserCog,
  },
  {
    role: UserRoles.SUPPLIER,
    email: 'supplier@norruva.com',
    description:
      'Create, manage, and submit product passports for verification.',
    icon: PackageCheck,
  },
  {
    role: UserRoles.AUDITOR,
    email: 'auditor@norruva.com',
    description:
      'Review submitted passports, verify data, and approve or reject them.',
    icon: UserCheck,
  },
  {
    role: UserRoles.COMPLIANCE_MANAGER,
    email: 'compliance@norruva.com',
    description:
      'Monitor flagged products and oversee compliance resolution workflows.',
    icon: ClipboardCheck,
  },
  {
    role: UserRoles.MANUFACTURER,
    email: 'manufacturer@norruva.com',
    description:
      'View product data, manage production lines, and track material composition.',
    icon: HardHat,
  },
  {
    role: UserRoles.RETAILER,
    email: 'retailer@norruva.com',
    description:
      'Browse the product catalog and analyze supplier sustainability.',
    icon: Store,
  },
  {
    role: UserRoles.SERVICE_PROVIDER,
    email: 'service@norruva.com',
    description: 'Access repair manuals and manage product service tickets.',
    icon: Wrench,
  },
  {
    role: UserRoles.RECYCLER,
    email: 'recycler@norruva.com',
    description: 'Process end-of-life products and track recycling data.',
    icon: Recycle,
  },
  {
    role: UserRoles.BUSINESS_ANALYST,
    email: 'analyst@norruva.com',
    description:
      'Analyze platform-wide trends and export data for external reporting.',
    icon: BarChart3,
  },
  {
    role: UserRoles.DEVELOPER,
    email: 'developer@norruva.com',
    description: 'Manage API keys, webhooks, and system integrations.',
    icon: Code,
  },
];

export default function DemoPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loadingRole, setLoadingRole] = useState<string | null>(null);

  async function handleDemoLogin(role: string, email: string) {
    setLoadingRole(role);
    const result = await signInWithMockUser(email, 'password123');

    if (result.success && result.token) {
      try {
        await signInWithCustomToken(auth, result.token);
        router.push('/dashboard');
      } catch (error) {
        console.error('Demo login failed:', error);
        toast({
          title: 'Login Failed',
          description: 'Could not sign in with the demo user token.',
          variant: 'destructive',
        });
        setLoadingRole(null);
      }
    } else {
      console.error('Could not get demo user token:', result.error);
      toast({
        title: 'Login Failed',
        description: 'Could not retrieve a token for the demo user.',
        variant: 'destructive',
      });
      setLoadingRole(null);
    }
  }

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-muted/40 p-4 sm:p-6">
      <div className="absolute top-6 left-6">
        <Logo />
      </div>
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold tracking-tight">Explore Norruva</h1>
        <p className="text-lg text-muted-foreground mt-2 max-w-2xl">
          Select a role below to experience a tailored dashboard view. Each
          dashboard is designed for a specific user persona in the product
          lifecycle.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 max-w-7xl w-full">
        {demoUsers.map(({ role, email, description, icon: Icon }) => (
          <Card key={role} className="flex flex-col text-center">
            <CardHeader className="items-center">
              <div className="bg-primary/10 p-3 rounded-full mb-2">
                <Icon className="h-8 w-8 text-primary" />
              </div>
              <CardTitle>{role}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              <CardDescription>{description}</CardDescription>
            </CardContent>
            <CardFooter className="mt-auto">
              <Button
                className="w-full"
                onClick={() => handleDemoLogin(role, email)}
                disabled={!!loadingRole}
              >
                {loadingRole === role ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Login as ' + role
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
