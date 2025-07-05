// src/types/transit.ts
export interface TransitInfo {
  stage: string;
  eta: string;
  transport: 'Ship' | 'Plane' | 'Truck';
  origin: string;
  destination: string;
}

export interface CustomsAlert {
  id: string;
  productId: string;
  message: string;
  severity: 'High' | 'Medium' | 'Low';
  timestamp: string; // Human-readable e.g., "2 hours ago"
  regulation?: string;
}
