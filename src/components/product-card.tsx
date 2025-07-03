// src/components/product-card.tsx
import Link from 'next/link';
import Image from 'next/image';
import type { Product } from '@/types';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle, ShieldAlert } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  roleSlug: string;
}

export default function ProductCard({ product, roleSlug }: ProductCardProps) {
  const getVerificationVariant = (status?: Product['verificationStatus']) => {
    switch (status) {
      case 'Verified':
        return 'default';
      case 'Pending':
        return 'secondary';
      case 'Failed':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <div className="relative aspect-[4/3] w-full mb-4">
          <Image
            src={product.productImage}
            alt={product.productName}
            fill
            className="rounded-lg object-cover"
            data-ai-hint="product photo"
          />
        </div>
        <CardTitle className="text-base font-semibold leading-snug line-clamp-2 h-10">
          {product.productName}
        </CardTitle>
        <p className="text-sm text-muted-foreground">by {product.supplier}</p>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{product.category}</Badge>
          <Badge variant={getVerificationVariant(product.verificationStatus)}>
            {product.verificationStatus === 'Verified' ? (
              <CheckCircle className="mr-1 h-3 w-3" />
            ) : (
              <ShieldAlert className="mr-1 h-3 w-3" />
            )}
            {product.verificationStatus || 'Not Submitted'}
          </Badge>
          {product.sustainability?.score && (
            <Badge variant="outline">
              ESG: {product.sustainability.score}
            </Badge>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild size="sm" className="w-full">
          <Link href={`/dashboard/${roleSlug}/products/${product.id}`}>
            View Details <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
