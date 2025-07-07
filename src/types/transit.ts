// src/types/transit.ts

export interface Waypoint {
  location: string;
  lat: number;
  lng: number;
  eta: string; // ISO 8601 format
}

export interface TransitInfo {
  stage: string;
  eta: string; // Final ETA, ISO 8601 format
  transport: 'Ship' | 'Plane' | 'Truck';
  origin: string;
  destination: string;
  waypoints: Waypoint[];
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
