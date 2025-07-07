// src/components/product-tracker-selector.tsx
'use client';

import * as React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import type { Product } from '@/types';

interface ProductTrackerSelectorProps {
  products: Product[];
  selectedProductId: string | null;
  onProductSelect: (productId: string | null) => void;
  className?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductTrackerSelector({
  products,
  selectedProductId,
  onProductSelect,
  className,
  open,
  onOpenChange,
}: ProductTrackerSelectorProps) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full sm:w-[250px] justify-between', className)}
        >
          {selectedProductId
            ? products.find(p => p.id === selectedProductId)?.productName
            : 'Select a Product...'}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Search product..." />
          <CommandList>
            <CommandEmpty>No product found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="clear-selection"
                onSelect={() => {
                  onProductSelect(null);
                  onOpenChange(false);
                }}
              >
                Clear Selection
              </CommandItem>
              {products.map(product => (
                <CommandItem
                  key={product.id}
                  value={product.id}
                  onSelect={currentValue => {
                    onProductSelect(
                      currentValue === selectedProductId ? null : currentValue,
                    );
                    onOpenChange(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      selectedProductId === product.id
                        ? 'opacity-100'
                        : 'opacity-0',
                    )}
                  />
                  {product.productName}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
