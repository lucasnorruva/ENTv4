// src/lib/company-data.ts
import type { Company } from '@/types';

const now = new Date();

export let companies: Company[] = [
  {
    id: 'comp-eco',
    name: 'Eco Innovate Ltd.',
    ownerId: 'user-supplier',
    industry: 'Electronics',
    createdAt: new Date(new Date(now).setMonth(now.getMonth() - 2)).toISOString(),
    updatedAt: new Date(new Date(now).setMonth(now.getMonth() - 2)).toISOString(),
    settings: {
      aiEnabled: true,
      apiAccess: true,
      brandingCustomization: false,
    },
  },
  {
    id: 'comp-thread',
    name: 'Sustainable Threads Inc.',
    ownerId: 'user-supplier', // Example, can be a different user
    industry: 'Fashion',
    createdAt: new Date(new Date(now).setMonth(now.getMonth() - 3)).toISOString(),
    updatedAt: new Date(new Date(now).setMonth(now.getMonth() - 3)).toISOString(),
    settings: {
      aiEnabled: true,
      apiAccess: false,
      brandingCustomization: true,
    },
  },
  {
    id: 'comp-norruva',
    name: 'Norruva Corp',
    ownerId: 'user-admin',
    industry: 'Technology',
    createdAt: new Date(new Date(now).setMonth(now.getMonth() - 6)).toISOString(),
    updatedAt: new Date(new Date(now).setMonth(now.getMonth() - 6)).toISOString(),
    settings: {
      aiEnabled: true,
      apiAccess: true,
      brandingCustomization: true,
    },
  },
];
