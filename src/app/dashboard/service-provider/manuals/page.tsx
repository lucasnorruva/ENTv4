// src/app/dashboard/service-provider/manuals/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function ManualsRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    // This page is deprecated. Redirect to the new products page.
    router.replace('/dashboard/service-provider/products');
  }, [router]);
  return (
    <div className="flex h-full items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      <p className="ml-4 text-muted-foreground">Redirecting to Products page...</p>
    </div>
  );
}
