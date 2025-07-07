// src/types/transit.ts
import type { AnalyzeSimulatedRouteOutput as SimulatedRoute } from "./ai-outputs";

export type { SimulatedRoute };

export interface TransitInfo {
  stage: string;
  eta: string; // ISO 8601 format
  transport: 'Ship' | 'Plane' | 'Truck';
  origin: string;
  destination: string;
  departureDate: string; // ISO 8601 format
}

export interface CustomsAlert {
  id: string;
  productId: string;
  message: string;
  severity: 'High' | 'Medium' | 'Low';
  timestamp: string; // Can be a relative string or ISO date
  regulation?: string;
  location: string;
  lat: number;
  lng: number;
}

export interface CustomsStatus {
  status: 'Cleared' | 'Detained' | 'Rejected';
  authority: string;
  location: string;
  date: string; // ISO 8601 format
  notes?: string;
  history?: Omit<CustomsStatus, 'history'>[];
}

export interface GreenClaim {
  claim: string;
  substantiation: string;
}

export interface RegulationSource {
  id: string;
  name: string;
  type: 'API' | 'Feed' | 'Manual';
  status: 'Operational' | 'Degraded Performance' | 'Offline' | 'Not Implemented';
  version?: string;
  lastSync: string;
  checklist: {
    id: string;
    description: string;
    status: boolean;
  }[];
}
