
// src/components/global-search-button.tsx
'use client';

import React, { useState, useEffect, useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useDebounce } from 'use-debounce';
import {
  FileQuestion,
  BookCopy,
  Users,
  Loader2,
  Search,
} from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { globalSearch } from '@/lib/actions';
import type { Product, User, CompliancePath } from '@/lib/types';
import { cn } from '@/lib/utils';
import { UserRoles } from '@/lib/constants';
import { hasRole } from '@/lib/auth-utils';
import { getCurrentUser } from '@/lib/auth-client';

interface GlobalSearchResult {
  products: Product[];
  users: User[];
  compliancePaths: CompliancePath[];
}

interface GlobalSearchButtonProps {
  userId: string;
  className?: string;
}

export default function GlobalSearchButton({
  userId,
  className,
}: GlobalSearchButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [debouncedQuery] = useDebounce(query, 300);
  const [data, setData] = useState<GlobalSearchResult | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    // This is a simplified way to get the current user on the client.
    // In a real app, you might use a more robust state management solution.
    getCurrentUser().then(setUser);
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || e.key === '/') {
        e.preventDefault();
        setIsOpen(open => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  useEffect(() => {
    if (debouncedQuery.length > 1) {
      startTransition(async () => {
        const result = await globalSearch(debouncedQuery, userId);
        setData(result);
      });
    } else {
      setData(null);
    }
  }, [debouncedQuery, userId]);

  const handleSelect = useCallback(
    (path: string) => {
      setIsOpen(false);
      setQuery('');
      router.push(path);
    },
    [router],
  );

  const isAdmin = user && hasRole(user, UserRoles.ADMIN);
  
  return (
    <>
      <Button
        variant="outline"
        className={cn(
          'relative h-8 w-full justify-start rounded-[0.5rem] bg-background text-sm font-normal text-muted-foreground shadow-none sm:pr-12 md:w-40 lg:w-64',
          className,
        )}
        onClick={() => setIsOpen(true)}
      >
        <Search className="h-4 w-4 mr-2" />
        <span className="hidden lg:inline-flex">Search...</span>
        <span className="inline-flex lg:hidden">Search...</span>
        <kbd className="pointer-events-none absolute right-[0.3rem] top-[0.3rem] hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      <CommandDialog open={isOpen} onOpenChange={setIsOpen}>
        <CommandInput
          placeholder="Search for products, users, or compliance paths..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {isPending && (
            <div className="p-4 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
          {!isPending && query.length > 1 && !data?.products.length && !data?.users.length && !data?.compliancePaths.length && (
            <CommandEmpty>No results found for "{query}".</CommandEmpty>
        )}

          {data?.products && data.products.length > 0 && (
            <CommandGroup heading="Products">
              {data.products.map(product => (
                <CommandItem
                  key={product.id}
                  onSelect={() => handleSelect(`/dashboard/${isAdmin ? 'admin' : 'supplier'}/products/${product.id}`)}
                  value={`product-${product.id}`}
                >
                  <BookCopy className="mr-2 h-4 w-4" />
                  <span>{product.productName}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {isAdmin && data?.users && data.users.length > 0 && (
            <CommandGroup heading="Users">
              {data.users.map(user => (
                <CommandItem
                  key={user.id}
                  onSelect={() => handleSelect('/dashboard/admin/users')}
                  value={`user-${user.id}`}
                >
                  <Users className="mr-2 h-4 w-4" />
                  <span>{user.fullName}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {isAdmin && data?.compliancePaths && data.compliancePaths.length > 0 && (
            <CommandGroup heading="Compliance Paths">
              {data.compliancePaths.map(path => (
                <CommandItem
                  key={path.id}
                  onSelect={() => handleSelect('/dashboard/admin/compliance')}
                  value={`path-${path.id}`}
                >
                  <FileQuestion className="mr-2 h-4 w-4" />
                  <span>{path.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          
        </CommandList>
      </CommandDialog>
    </>
  );
}
