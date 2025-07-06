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
];
