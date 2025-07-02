'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { signInWithMockUser } from '@/lib/actions';
import { Loader2 } from 'lucide-react';

export default function DemoPage() {
  const router = useRouter();

  useEffect(() => {
    async function signInDemoUser() {
      const demoEmail = 'analyst@norruva.com';
      const demoPassword = 'password123';

      const result = await signInWithMockUser(demoEmail, demoPassword);

      if (result.success && result.token) {
        try {
          await signInWithCustomToken(auth, result.token);
          router.replace('/dashboard');
        } catch (error) {
          console.error("Demo login failed:", error);
          router.replace('/login');
        }
      } else {
        console.error("Could not get demo user token:", result.error);
        router.replace('/login');
      }
    }

    signInDemoUser();
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      <p className="ml-4 text-muted-foreground">Loading Demo Dashboard...</p>
    </div>
  );
}
