
// src/lib/mockCustomsAlerts.ts
import type { CustomsAlert } from '@/types';

export const MOCK_CUSTOMS_ALERTS: CustomsAlert[] = [
  {
    id: 'ALERT001',
    productId: 'pp-004',
    message:
      'Flagged at CDG Airport - Potential counterfeit. Physical inspection scheduled.',
    severity: 'High',
    timestamp: '2 hours ago',
    regulation: 'Anti-Counterfeiting',
    location: 'Paris, France',
    lat: 48.8566,
    lng: 2.3522,
  },
  {
    id: 'ALERT002',
    productId: 'pp-003',
    message:
      'Awaiting CBAM declaration for textile import. Shipment delayed at Rotterdam.',
    severity: 'Medium',
    timestamp: '1 day ago',
    regulation: 'CBAM / Textile Import',
    location: 'Rotterdam, Netherlands',
    lat: 51.9225,
    lng: 4.47917,
  },
  {
    id: 'ALERT003',
    productId: 'pp-002',
    message:
      'Random spot check selected for agricultural products. Expected delay: 48h.',
    severity: 'Low',
    timestamp: '3 days ago',
    regulation: 'SPS Measures',
    location: 'Los Angeles, USA',
    lat: 34.0522,
    lng: -118.2437,
  },
  {
    id: 'ALERT004',
    productId: 'pp-006',
    message:
      'Incomplete safety certification for machinery parts. Documentation required.',
    severity: 'Medium',
    timestamp: '5 hours ago',
    regulation: 'Machinery Directive',
    location: 'Bremerhaven, Germany',
    lat: 53.5425,
    lng: 8.5819,
  },
  {
    id: 'ALERT005',
    productId: 'pp-001',
    message:
      'EORI number mismatch for importer. Awaiting clarification. Shipment on hold.',
    severity: 'Medium',
    timestamp: '1 hour ago',
    regulation: 'Customs Union Tariff',
    location: 'Port of Gdansk, Poland',
    lat: 54.401,
    lng: 18.675,
  },
  {
    id: 'ALERT006',
    productId: 'pp-005',
    message:
      'High-value battery shipment. Requires additional safety & transport documentation verification.',
    severity: 'Medium',
    timestamp: 'Pending Arrival',
    regulation: 'ADR / Battery Safety',
    location: 'Antwerp, Belgium',
    lat: 51.2213,
    lng: 4.4051,
  },
  {
    id: 'ALERT007',
    productId: 'pp-007',
    message:
      'Possible dual-use technology classification. Export license under review.',
    severity: 'High',
    timestamp: '15 hours ago',
    regulation: 'Wassenaar Arrangement',
    location: 'Austin, USA',
    lat: 30.2672,
    lng: -97.7431,
  },
  {
    id: 'ALERT008',
    productId: 'pp-009',
    message:
      'Incorrect commodity code declared for food product. Re-classification required.',
    severity: 'Low',
    timestamp: '2 days ago',
    regulation: 'Harmonized System (HS) Codes',
    location: 'New York, USA',
    lat: 40.7128,
    lng: -74.0060,
  }
];
