// src/components/dpp-qr-code-widget.tsx
'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { useEffect, useState, useCallback } from 'react';
import { Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function DppQrCodeWidget({ productId }: { productId: string }) {
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const { toast } = useToast();

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

  const handleDownload = useCallback(async () => {
    if (!qrCodeUrl) return;

    try {
      // Use fetch to get the image as a blob
      const response = await fetch(qrCodeUrl);
      if (!response.ok) {
        throw new Error('Network response was not ok.');
      }
      const blob = await response.blob();

      // Create a link element to trigger the download
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `norruva-dpp-${productId}.png`;

      // Append to the DOM, click, and then remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the object URL
      URL.revokeObjectURL(link.href);

      toast({
        title: 'Download Started',
        description: 'Your QR code is downloading.',
      });
    } catch (error) {
      console.error('Failed to download QR code:', error);
      toast({
        title: 'Download Failed',
        description: 'Could not download the QR code image.',
        variant: 'destructive',
      });
    }
  }, [qrCodeUrl, productId, toast]);

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
        <Button
          variant="outline"
          className="w-full"
          onClick={handleDownload}
          disabled={!qrCodeUrl}
        >
          <Download className="mr-2 h-4 w-4" />
          Download QR Code
        </Button>
      </CardFooter>
    </Card>
  );
}
