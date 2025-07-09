'use client';

import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getUserByEmail } from '@/lib/actions';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

import AuthLayout from '@/components/auth-layout';
import OnboardingWizard from '@/components/onboarding-wizard';
import type { User } from '@/types';

export default function OnboardingPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async firebaseUser => {
      if (firebaseUser?.email) {
        try {
          const appUser = await getUserByEmail(firebaseUser.email);
          if (appUser) {
            // If they have somehow already completed onboarding, send them to the dashboard.
            if (appUser.onboardingComplete) {
              router.replace('/dashboard');
              return;
            }
            setUser(appUser);
          } else {
            // This case shouldn't happen in the normal flow, but it's good to handle.
            router.replace('/signup');
          }
        } catch (error) {
          console.error("Failed to fetch user profile for onboarding:", error);
          router.replace('/login');
        } finally {
          setIsLoading(false);
        }
      } else {
        // No user logged in, redirect to login page.
        router.replace('/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  return (
    <AuthLayout
      title="Welcome to Norruva!"
      description="Let's get your account set up."
      footerText=""
      footerLinkText=""
      footerLinkHref=""
    >
      {isLoading ? (
        <div className="flex justify-center items-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <OnboardingWizard user={user} />
      )}
    </AuthLayout>
  );
}
