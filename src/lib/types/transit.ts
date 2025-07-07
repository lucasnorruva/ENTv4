// src/types/transit.ts

export interface TransitInfo {
  stage: string;
  eta: string; // ISO 8601 format
  transport: 'Ship' | 'Plane' | 'Truck';
  origin: string;
  destination: string;
  departureDate: string; // ISO 8601 format
}
