
// src/lib/company-data.ts
import type { Company } from '@/types';

const now = new Date();

export let companies: Company[] = [
  {
    id: 'comp-eco',
    name: 'Eco Innovate Ltd.',
    ownerId: 'user-supplier',
    industry: 'Electronics',
    tier: 'pro',
    isTrustedIssuer: true,
    revocationListUrl: 'https://api.norruva.com/vc/status/eco-innovate/1',
    createdAt: new Date(new Date(now).setMonth(now.getMonth() - 2)).toISOString(),
    updatedAt: new Date(new Date(now).setMonth(now.getMonth() - 2)).toISOString(),
    settings: {
      aiEnabled: true,
      apiAccess: true,
      brandingCustomization: true,
      theme: {
        light: {
          primary: '25 95% 53%', // Orange
          accent: '45 93% 91%',
        },
        dark: {
          primary: '25 95% 60%', // Lighter Orange
          accent: '45 93% 20%',
        },
      },
      customFields: [
        { id: 'internal_sku', label: 'Internal SKU', type: 'text' },
        { id: 'is_fragile', label: 'Fragile Shipment', type: 'boolean' },
      ],
    },
  },
  {
    id: 'comp-thread',
    name: 'Sustainable Threads Inc.',
    ownerId: 'user-supplier', // Example, can be a different user
    industry: 'Fashion',
    tier: 'free',
    isTrustedIssuer: false,
    createdAt: new Date(new Date(now).setMonth(now.getMonth() - 3)).toISOString(),
    updatedAt: new Date(new Date(now).setMonth(now.getMonth() - 3)).toISOString(),
    settings: {
      aiEnabled: true,
      apiAccess: false,
      brandingCustomization: false,
      theme: {
        light: { primary: '', accent: '' },
        dark: { primary: '', accent: '' },
      },
      customFields: [],
    },
  },
  {
    id: 'comp-norruva',
    name: 'Norruva Corp',
    ownerId: 'user-admin',
    industry: 'Technology',
    tier: 'enterprise',
    isTrustedIssuer: true,
    createdAt: new Date(new Date(now).setMonth(now.getMonth() - 6)).toISOString(),
    updatedAt: new Date(new Date(now).setMonth(now.getMonth() - 6)).toISOString(),
    settings: {
      aiEnabled: true,
      apiAccess: true,
      brandingCustomization: true,
      theme: {
        light: { primary: '', accent: '' },
        dark: { primary: '', accent: '' },
      },
      customFields: [],
    },
  },
];
