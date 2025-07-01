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

export default function DppQrCodeWidget() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>DPP Access QR Code</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center">
        <Image
          src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://example.com"
          alt="QR Code"
          width={150}
          height={150}
          className="rounded-md border p-1"
          data-ai-hint="qr code"
        />
        <p className="text-sm text-muted-foreground mt-2 text-center">
          Scan this QR code to view the public Digital Product Passport.
        </p>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full">
          Manage Digital QR Code
        </Button>
      </CardFooter>
    </Card>
  );
}
