// src/lib/integration-data.ts
import type { Integration } from '@/types';

const now = new Date();

export let integrations: Integration[] = [
  {
    id: 'int-sap',
    name: 'SAP S/4HANA',
    type: 'ERP',
    logo: 'https://placehold.co/40x40.png',
    dataAiHint: 'sap logo',
    description: 'Sync product data, bill of materials, and supply chain information.',
    enabled: true,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  },
  {
    id: 'int-oracle',
    name: 'Oracle NetSuite',
    type: 'ERP',
    logo: 'https://placehold.co/40x40.png',
    dataAiHint: 'oracle logo',
    description: 'Automate DPP creation from NetSuite item records.',
    enabled: false,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  },
  {
    id: 'int-dynamics',
    name: 'Microsoft Dynamics 365',
    type: 'ERP',
    logo: 'https://placehold.co/40x40.png',
    dataAiHint: 'microsoft logo',
    description: 'Connect your business data from the Dynamics 365 ecosystem.',
    enabled: true,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  },
  {
    id: 'int-siemens',
    name: 'Siemens Teamcenter',
    type: 'PLM',
    logo: 'https://placehold.co/40x40.png',
    dataAiHint: 'siemens logo',
    description: 'Link engineering and design data from Teamcenter.',
    enabled: false,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  },
  {
    id: 'int-shopify',
    name: 'Shopify',
    type: 'E-commerce',
    logo: 'https://placehold.co/40x40.png',
    dataAiHint: 'shopify logo',
    description: 'Embed DPP QR codes on your Shopify product pages.',
    enabled: true,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  },
];
