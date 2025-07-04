// src/types/transit.ts
import type { Product } from '@/types/index';

export interface TransitProduct {
  id: string;
  name: string;
  stage: string;
  eta: string; // ISO date string
  dppStatus: Product['verificationStatus'];
  transport: 'Ship' | 'Truck' | 'Plane';
  origin: string; // e.g., "City, Country" or just "Country"
  destination: string; // e.g., "City, Country"
}

export interface CustomsAlert {
  id: string;
  productId: string;
  message: string;
  severity: 'High' | 'Medium' | 'Low';
  timestamp: string; // Human-readable e.g., "2 hours ago"
  regulation?: string;
}

export interface InspectionEvent {
  id: string;
  icon: React.ElementType;
  title: string;
  timestamp: string; // ISO Date string or human-readable
  description: string;
  status:
    | 'Completed'
    | 'Action Required'
    | 'Upcoming'
    | 'In Progress'
    | 'Delayed'
    | 'Cancelled';
  badgeVariant?:
    | 'outline'
    | 'default'
    | 'destructive'
    | 'secondary'
    | null
    | undefined;
}
