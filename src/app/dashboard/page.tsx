// src/app/dashboard/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getUserByEmail } from '@/lib/actions';
import { Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async firebaseUser => {
      if (firebaseUser?.email) {
        try {
          const user = await getUserByEmail(firebaseUser.email);
          if (user && user.roles.length > 0) {
            // NEW: Check if onboarding is complete
            if (!user.onboardingComplete) {
              router.replace('/onboarding');
              return;
            }
            const roleSlug = user.roles[0].toLowerCase().replace(/ /g, '-');
            router.replace(`/dashboard/${roleSlug}`);
          } else {
            // Fallback if user is in Firebase Auth but not our DB.
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
        // No user logged in.
        router.replace('/login');
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      <p className="ml-4 text-muted-foreground">Authenticating...</p>
    </div>
  );
}
