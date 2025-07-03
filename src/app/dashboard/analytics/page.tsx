// src/app/dashboard/analytics/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function AnalyticsRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    // This page is deprecated. Redirect to the main dashboard, which will route to the correct role.
    router.replace('/dashboard');
  }, [router]);
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      <p className="ml-4 text-muted-foreground">Redirecting...</p>
    </div>
  );
}
