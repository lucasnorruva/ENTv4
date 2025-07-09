
// src/components/product-catalog-client.tsx
'use client';

import { useState, useEffect } from 'react';
import type { Product, User } from '@/types';
import { getProducts } from '@/lib/actions/product-actions';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Loader2, Search, ShoppingBag } from 'lucide-react';
import ProductCard from './product-card';
import { useSearchParams } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
  const [category, setCategory] = useState('');
  const [verificationStatus, setVerificationStatus] = useState('');

  const debouncedSearchTerm = useDebounce(searchTerm, 500);
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
    getProducts(user.id, {
      searchQuery: debouncedSearchTerm,
      category: category === 'all' ? undefined : category,
      verificationStatus:
        verificationStatus === 'all' ? undefined : verificationStatus,
    })
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
  }, [
    user.id,
    debouncedSearchTerm,
    category,
    verificationStatus,
    toast,
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row gap-2">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by name, supplier, GTIN..."
            className="w-full pl-10"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="Electronics">Electronics</SelectItem>
            <SelectItem value="Fashion">Fashion</SelectItem>
            <SelectItem value="Home Goods">Home Goods</SelectItem>
            <SelectItem value="Construction">Construction</SelectItem>
            <SelectItem value="Food & Beverage">Food &amp; Beverage</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={verificationStatus}
          onValueChange={setVerificationStatus}
        >
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="All Verification" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Verified">Verified</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Failed">Failed</SelectItem>
            <SelectItem value="Not Submitted">Not Submitted</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              roleSlug={roleSlug}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground bg-muted rounded-lg">
          <ShoppingBag className="mx-auto h-12 w-12" />
          <h3 className="mt-4 text-lg font-semibold">
            No Products Found
          </h3>
          <p className="text-sm">
            No products matched your search. Try different keywords or
            filters.
          </p>
        </div>
      )}
    </div>
  );
}
