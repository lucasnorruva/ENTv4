// src/types/transit.ts
// Note: TransitProduct is obsolete as its properties are now merged into the main Product type.

export interface CustomsAlert {
  id: string;
  productId: string;
  message: string;
  severity: 'High' | 'Medium' | 'Low';
  timestamp: string; // Human-readable e.g., "2 hours ago"
  regulation?: string;
}
