// src/lib/supplier-data.ts
import type { Product } from '@/types';
import { products } from './data';

interface Supplier {
  id: string;
  name: string;
  location: string;
}

const uniqueSuppliers = new Map<string, Supplier>();
products.forEach((p, index) => {
  if (!uniqueSuppliers.has(p.supplier)) {
    uniqueSuppliers.set(p.supplier, {
      id: `sup-${index}`,
      name: p.supplier,
      location: p.manufacturing?.country || 'Unknown',
    });
  }
});

export const MOCK_SUPPLIERS = Array.from(uniqueSuppliers.values());
