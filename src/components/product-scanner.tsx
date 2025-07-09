// src/components/product-scanner.tsx
'use client';

import { useState, useTransition, useRef, useEffect, useCallback } from 'react';
import jsQR from 'jsqr';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Loader2,
  QrCode,
  Search,
  Recycle,
  Package,
  AlertTriangle,
  Camera,
} from 'lucide-react';
import { getProductById, markAsRecycled } from '@/lib/actions/product-actions';
import type { Product, User } from '@/types';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { Badge } from './ui/badge';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

interface ProductScannerProps {
  user: User;
}

export default function ProductScanner({ user }: ProductScannerProps) {
  const [productId, setProductId] = useState('');
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSearching, startSearchTransition] = useTransition();
  const [isRecycling, startRecycleTransition] = useTransition();
  const { toast } = useToast();

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<
    boolean | null
  >(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number>();

  const findProduct = useCallback(
    (id: string) => {
      if (!id) return;

      setError(null);
      setProduct(null);

      startSearchTransition(async () => {
        try {
          const foundProduct = await getProductById(id, user.id);
          if (foundProduct) {
            setProduct(foundProduct);
          } else {
            setError(
              'Product not found or you do not have permission to view it.',
            );
          }
        } catch (err) {
          setError('An error occurred while searching for the product.');
        }
      });
    },
    [user.id],
  );

  const handleRecycle = useCallback(() => {
    if (!product) return;
    startRecycleTransition(async () => {
      try {
        await markAsRecycled(product.id, user.id);
        toast({
          title: 'Success',
          description: `Product "${product.productName}" has been marked as recycled.`,
        });
        setProduct(prev =>
          prev ? { ...prev, endOfLifeStatus: 'Recycled' } : null,
        );
      } catch (err) {
        toast({
          title: 'Error',
          description: 'Failed to mark product as recycled.',
          variant: 'destructive',
        });
      }
    });
  }, [product, startRecycleTransition, toast, user.id]);

  const tick = useCallback(() => {
    if (
      videoRef.current &&
      videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA &&
      canvasRef.current
    ) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code && code.data) {
          try {
            const url = new URL(code.data);
            const pathParts = url.pathname.split('/').filter(Boolean); // Filter out empty strings
            const id = pathParts.pop();
            if (id) {
              setProductId(id);
              findProduct(id);
              setIsCameraOpen(false); // This will trigger cleanup
              return; // Stop the loop
            }
          } catch (e) {
            // Not a valid URL, ignore and continue scanning
          }
        }
      }
    }
    animationFrameId.current = requestAnimationFrame(tick);
  }, [findProduct]);

  useEffect(() => {
    if (isCameraOpen && hasCameraPermission) {
      animationFrameId.current = requestAnimationFrame(tick);
    }
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isCameraOpen, hasCameraPermission, tick]);

  useEffect(() => {
    let stream: MediaStream | null = null;
    const getCameraPermission = async () => {
      if (!isCameraOpen) return;

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description:
            'Please enable camera permissions in your browser settings to use this app.',
        });
        setIsCameraOpen(false);
      }
    };
    getCameraPermission();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isCameraOpen, toast]);

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode /> Product EOL Scanner
        </CardTitle>
        <CardDescription>
          Enter a product ID or scan a QR code to process items for recycling.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Enter Product ID (e.g., pp-001)"
            value={productId}
            onChange={e => setProductId(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && findProduct(productId)}
          />
          <Button onClick={() => findProduct(productId)} disabled={isSearching}>
            {isSearching ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Search className="mr-2 h-4 w-4" />
            )}
            Find
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsCameraOpen(prev => !prev)}
          >
            <Camera className="mr-2 h-4 w-4" />
            {isCameraOpen ? 'Close Camera' : 'Scan'}
          </Button>
        </div>

        {isCameraOpen && (
          <div className="space-y-2">
            <video
              ref={videoRef}
              className="w-full aspect-video rounded-md bg-muted"
              autoPlay
              muted
              playsInline
            />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            {hasCameraPermission === false && (
              <Alert variant="destructive">
                <AlertTitle>Camera Access Required</AlertTitle>
                <AlertDescription>
                  Please allow camera access to use this feature.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {error && (
          <div className="text-destructive text-sm p-4 bg-destructive/10 rounded-md flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            {error}
          </div>
        )}

        {product && (
          <Card>
            <CardHeader className="flex flex-row gap-4 items-start">
              <Image
                src={product.productImage}
                alt={product.productName}
                width={100}
                height={100}
                className="rounded-lg border object-cover"
                data-ai-hint="product photo"
              />
              <div className="flex-1">
                <CardTitle>{product.productName}</CardTitle>
                <CardDescription>by {product.supplier}</CardDescription>
                <Badge
                  variant={
                    product.endOfLifeStatus === 'Recycled'
                      ? 'default'
                      : 'secondary'
                  }
                  className="mt-2"
                >
                  {product.endOfLifeStatus ?? 'Active'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Package className="h-4 w-4" /> Material Composition
              </h4>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                {product.materials.map((mat, index) => (
                  <li key={index}>
                    {mat.name} ({mat.percentage ?? 'N/A'}%)
                  </li>
                ))}
                {product.materials.length === 0 && (
                  <li>No material data available.</li>
                )}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                onClick={handleRecycle}
                disabled={
                  isRecycling || product.endOfLifeStatus === 'Recycled'
                }
              >
                {isRecycling ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Recycle className="mr-2 h-4 w-4" />
                )}
                {product.endOfLifeStatus === 'Recycled'
                  ? 'Already Recycled'
                  : 'Mark as Recycled'}
              </Button>
            </CardFooter>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}
