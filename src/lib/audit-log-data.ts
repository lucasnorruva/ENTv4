// src/lib/audit-log-data.ts
import type { AuditLog } from '@/types';

export let auditLogs: AuditLog[] = [
  {
    id: 'log-001',
    userId: 'user-supplier',
    action: 'product.created',
    entityId: 'pp-001',
    details: { name: 'Eco-Friendly Smart Watch' },
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'log-002',
    userId: 'user-supplier',
    action: 'passport.submitted',
    entityId: 'pp-001',
    details: {},
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 10000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 10000).toISOString(),
  },
  {
    id: 'log-003',
    userId: 'user-auditor',
    action: 'passport.approved',
    entityId: 'pp-001',
    details: { txHash: '0x123abc' },
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
   {
    id: 'log-004',
    userId: 'user-developer',
    action: 'webhook.delivery.success',
    entityId: 'wh-001',
    details: {
      event: 'product.published',
      statusCode: 200,
      productId: 'pp-001',
      url: 'https://api.example.com/v1/norruva-hooks',
    },
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 5000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 5000).toISOString(),
  },
  {
    id: 'log-005',
    userId: 'user-developer',
    action: 'webhook.delivery.failure',
    entityId: 'wh-002',
    details: {
      event: 'compliance.failed',
      statusCode: 503,
      error: 'Service Unavailable',
      productId: 'pp-004',
      url: 'https://alerts.example.com/dpp-compliance-failures',
    },
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
];
