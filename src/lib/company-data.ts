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
      logoUrl: 'https://placehold.co/120x40.png',
      logoFileName: 'eco-innovate-logo.png',
      theme: {
        light: { primary: '174 80% 30%', accent: '174 80% 92%' },
        dark: { primary: '174 70% 50%', accent: '174 100% 15%' },
      },
      customFields: [],
    },
  },
  {
    id: 'comp-thread',
    name: 'Sustainable Threads Inc.',
    ownerId: 'user-supplier-fashion',
    industry: 'Fashion',
    tier: 'free',
    isTrustedIssuer: false,
    revocationListUrl: '',
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
    revocationListUrl: 'https://api.norruva.com/vc/status/norruva/1',
    createdAt: new Date(new Date(now).setMonth(now.getMonth() - 6)).toISOString(),
    updatedAt: new Date(new Date(now).setMonth(now.getMonth() - 6)).toISOString(),
    settings: {
      aiEnabled: true,
      apiAccess: true,
      brandingCustomization: true,
      theme: {
        light: { primary: '262.1 83.3% 57.8%', accent: '262.1 83.3% 95%' },
        dark: { primary: '262.1 83.3% 67.8%', accent: '262.1 83.3% 20%' },
      },
      customFields: [
        { id: 'internal_sku', label: 'Internal SKU', type: 'text' },
        { id: 'is_fragile', label: 'Is Fragile?', type: 'boolean' },
      ],
    },
  },
  {
    id: 'comp-buildright',
    name: 'BuildRight Inc.',
    ownerId: 'user-construction',
    industry: 'Construction',
    tier: 'pro',
    isTrustedIssuer: false,
    revocationListUrl: '',
    createdAt: new Date(new Date(now).setMonth(now.getMonth() - 1)).toISOString(),
    updatedAt: new Date(new Date(now).setMonth(now.getMonth() - 1)).toISOString(),
    settings: {
      aiEnabled: true,
      apiAccess: true,
      brandingCustomization: false,
      theme: {
        light: { primary: '', accent: '' },
        dark: { primary: '', accent: '' },
      },
      customFields: [],
    },
  },
  {
    id: 'comp-freshfoods',
    name: 'FreshFoods Co.',
    ownerId: 'user-food',
    industry: 'Food & Beverage',
    tier: 'enterprise',
    isTrustedIssuer: true,
    revocationListUrl: 'https://api.norruva.com/vc/status/freshfoods/1',
    createdAt: new Date(new Date(now).setMonth(now.getMonth() - 5)).toISOString(),
    updatedAt: new Date(new Date(now).setMonth(now.getMonth() - 5)).toISOString(),
    settings: {
      aiEnabled: true,
      apiAccess: true,
      brandingCustomization: false,
      theme: {
        light: { primary: '', accent: '' },
        dark: { primary: '', accent: '' },
      },
      customFields: [],
    },
  },
];
