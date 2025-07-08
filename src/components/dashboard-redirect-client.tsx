// src/components/dashboard-redirect-client.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getUserByEmail } from '@/lib/actions';
import { Loader2 } from 'lucide-react';
import type { Role } from '@/lib/constants';

const getRoleSlug = (role: Role) => role.toLowerCase().replace(/ /g, '-');

export default function DashboardRedirectClient() {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async firebaseUser => {
      if (firebaseUser?.email) {
        try {
          const user = await getUserByEmail(firebaseUser.email);
          if (user && user.roles.length > 0) {
            if (!user.onboardingComplete) {
              router.replace('/onboarding');
              return;
            }
            const roleSlug = getRoleSlug(user.roles[0]);
            router.replace(`/dashboard/${roleSlug}`);
          } else {
            console.warn(
              `User ${firebaseUser.email} not found in application database.`,
            );
            router.replace('/login');
          }
        } catch (error) {
          console.error(
            'Error fetching user profile, redirecting to login',
            error,
          );
          router.replace('/login');
        }
      } else {
        router.replace('/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      <p className="ml-4 text-muted-foreground">Authenticating...</p>
    </div>
  );
}
