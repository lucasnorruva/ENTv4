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
}

export function ProductTrackerSelector({
  products,
  selectedProductId,
  onProductSelect,
  className,
}: ProductTrackerSelectorProps) {
  const [open, setOpen] = React.useState(false);

  // This handler is now tied to the Command's onValueChange
  const handleValueChange = (currentValue: string) => {
    // The value is the product.id or 'clear-selection'
    if (currentValue === 'clear-selection') {
      onProductSelect(null);
    } else {
      onProductSelect(currentValue);
    }
    setOpen(false); // Close the popover on selection
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
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
        <Command onValueChange={handleValueChange}>
          <CommandInput placeholder="Search product..." />
          <CommandList>
            <CommandEmpty>No product found.</CommandEmpty>
            <CommandGroup>
              <CommandItem value="clear-selection">
                Clear Selection
              </CommandItem>
              {products.map(product => (
                <CommandItem
                  key={product.id}
                  value={product.id} // Use unique ID for the value
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
