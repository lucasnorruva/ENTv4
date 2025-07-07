// src/lib/api-key-data.ts
import type { ApiKey } from '@/types';

const now = new Date();

export let apiKeys: ApiKey[] = [
  {
    id: 'key-001',
    label: 'My Production Server',
    rawToken: 'nor_prod_1234567890_abcdefghijkl', // Added for mock auth
    token: 'nor_prod_******************hijk',
    status: 'Active',
    userId: 'user-developer',
    scopes: ['product:read', 'product:write', 'compliance:read'],
    ipRestrictions: ['203.0.113.0/24'],
    lastUsed: new Date(new Date(now).setDate(now.getDate() - 1)).toISOString(),
    createdAt: new Date(new Date(now).setMonth(now.getMonth() - 1)).toISOString(),
    updatedAt: new Date(new Date(now).setMonth(now.getMonth() - 1)).toISOString(),
  },
  {
    id: 'key-002',
    label: 'Old Integration (Revoked)',
    rawToken: 'nor_rev_0987654321_zyxwvu', // MOCK ONLY
    token: 'nor_rev_******************5678',
    status: 'Revoked',
    userId: 'user-developer',
    scopes: ['product:read'],
    createdAt: new Date(new Date(now).setMonth(now.getMonth() - 2)).toISOString(),
    updatedAt: new Date(new Date(now).setMonth(now.getMonth() - 1)).toISOString(),
  },
  {
    id: 'key-003',
    label: 'Analytics Partner (Expired)',
    rawToken: 'nor_exp_5555555555_qwerty',
    token: 'nor_exp_******************erty',
    status: 'Active', // A cron job would mark this as revoked
    userId: 'user-developer',
    scopes: ['product:read'],
    expiresAt: new Date(new Date(now).setDate(now.getDate() - 7)).toISOString(),
    createdAt: new Date(new Date(now).setMonth(now.getMonth() - 3)).toISOString(),
    updatedAt: new Date(new Date(now).setMonth(now.getMonth() - 3)).toISOString(),
  },
];
