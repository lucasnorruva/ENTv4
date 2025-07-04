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
  },
  {
    id: 'ALERT002',
    productId: 'pp-003',
    message:
      'Awaiting CBAM declaration for textile import. Shipment delayed at Rotterdam.',
    severity: 'Medium',
    timestamp: '1 day ago',
    regulation: 'CBAM / Textile Import',
  },
  {
    id: 'ALERT003',
    productId: 'pp-002',
    message:
      'Random spot check selected for agricultural products. Expected delay: 48h.',
    severity: 'Low',
    timestamp: '3 days ago',
    regulation: 'SPS Measures',
  },
  {
    id: 'ALERT004',
    productId: 'pp-006',
    message:
      'Incomplete safety certification for machinery parts. Documentation required.',
    severity: 'Medium',
    timestamp: '5 hours ago',
    regulation: 'Machinery Directive',
  },
  {
    id: 'ALERT005',
    productId: 'pp-001',
    message:
      'EORI number mismatch for importer. Awaiting clarification. Shipment on hold.',
    severity: 'Medium',
    timestamp: '1 hour ago',
    regulation: 'Customs Union Tariff',
  },
  {
    id: 'ALERT006',
    productId: 'pp-005',
    message:
      'High-value battery shipment. Requires additional safety & transport documentation verification.',
    severity: 'Medium',
    timestamp: 'Pending Arrival',
    regulation: 'ADR / Battery Safety',
  },
];
