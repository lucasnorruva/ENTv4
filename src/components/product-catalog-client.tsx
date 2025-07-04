// src/components/product-catalog-client.tsx
'use client';

import { useState, useEffect } from 'react';
import type { Product, User } from '@/types';
import { getProducts } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Loader2, Search, ShoppingBag, Sparkles } from 'lucide-react';
import ProductCard from './product-card';
import { useSearchParams } from 'next/navigation';
import { Separator } from './ui/separator';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';

// Debounce hook to delay fetching data while user is typing
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

interface ProductCatalogClientProps {
  user: User;
}

const getRoleSlug = (role: string) => role.toLowerCase().replace(/ /g, '-');

export default function ProductCatalogClient({
  user,
}: ProductCatalogClientProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500); // 500ms delay
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const roleSlug = getRoleSlug(user.roles[0]);

  useEffect(() => {
    const initialQuery = searchParams.get('q');
    if (initialQuery) {
      setSearchTerm(initialQuery);
    }
  }, [searchParams]);

  useEffect(() => {
    setIsLoading(true);
    getProducts(user.id, { searchQuery: debouncedSearchTerm })
      .then(data => {
        setProducts(data.filter(p => p.status === 'Published'));
      })
      .catch(() => {
        toast({
          title: 'Error',
          description: 'Failed to load product catalog.',
          variant: 'destructive',
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [user.id, debouncedSearchTerm, toast]);

  const recentProducts = [...products]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 10);

  const otherProducts = products.slice(10);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by product name, supplier, GTIN, or category..."
            className="w-full pl-10"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
        </div>
      ) : products.length > 0 ? (
        <div className="space-y-8">
          {recentProducts.length > 0 && debouncedSearchTerm.length === 0 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Recently Added
              </h2>
              <Carousel
                opts={{
                  align: 'start',
                  loop: true,
                }}
                className="w-full"
              >
                <CarouselContent>
                  {recentProducts.map(product => (
                    <CarouselItem
                      key={product.id}
                      className="md:basis-1/2 lg:basis-1/3 xl:basis-1/4"
                    >
                      <div className="p-1">
                        <ProductCard product={product} roleSlug={roleSlug} />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>
              <Separator className="my-8" />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {debouncedSearchTerm.length > 0
              ? products.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    roleSlug={roleSlug}
                  />
                ))
              : otherProducts.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    roleSlug={roleSlug}
                  />
                ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground bg-muted rounded-lg">
          <ShoppingBag className="mx-auto h-12 w-12" />
          <h3 className="mt-4 text-lg font-semibold">No Products Found</h3>
          <p className="text-sm">
            No products matched your search term. Try a different search.
          </p>
        </div>
      )}
    </div>
  );
}
