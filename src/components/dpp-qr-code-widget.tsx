// src/components/dpp-qr-code-widget.tsx
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { useEffect, useState } from 'react';

export default function DppQrCodeWidget({ productId }: { productId: string }) {
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const productUrl = `${window.location.origin}/products/${productId}`;
      setQrCodeUrl(
        `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
          productUrl,
        )}`,
      );
    }
  }, [productId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>DPP Access QR Code</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center">
        {qrCodeUrl ? (
          <Image
            src={qrCodeUrl}
            alt="QR Code"
            width={150}
            height={150}
            className="rounded-md border p-1"
            data-ai-hint="qr code"
          />
        ) : (
          <div className="h-[150px] w-[150px] bg-muted rounded-md flex items-center justify-center">
            <p className="text-xs text-muted-foreground">Generating QR...</p>
          </div>
        )}
        <p className="text-sm text-muted-foreground mt-2 text-center">
          Scan this QR code to view the public Digital Product Passport.
        </p>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full">
          Download QR Code
        </Button>
      </CardFooter>
    </Card>
  );
}
