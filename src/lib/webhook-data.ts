// src/lib/webhook-data.ts
import type { Webhook } from '@/types';

const now = new Date();

export let webhooks: Webhook[] = [
  {
    id: 'wh-001',
    url: 'https://api.example.com/v1/norruva-hooks',
    events: ['product.published', 'product.updated'],
    status: 'active',
    userId: 'user-developer',
    createdAt: new Date(new Date(now).setDate(now.getDate() - 5)).toISOString(),
    updatedAt: new Date(new Date(now).setDate(now.getDate() - 5)).toISOString(),
  },
  {
    id: 'wh-002',
    url: 'https://alerts.example.com/dpp-compliance-failures',
    events: ['compliance.failed'],
    status: 'inactive',
    userId: 'user-developer',
    createdAt: new Date(
      new Date(now).setDate(now.getDate() - 10),
    ).toISOString(),
    updatedAt: new Date(new Date(now).setDate(now.getDate() - 2)).toISOString(),
  },
];
