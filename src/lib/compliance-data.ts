// src/lib/compliance-data.ts
import type { CompliancePath } from '@/types';

export const compliancePaths: CompliancePath[] = [
  {
    id: 'cp-electronics-01',
    name: 'EU Electronics Sustainability Standard (ESPR, RoHS)',
    description:
      'Requires electronics to have a sustainability score above 60, be easily repairable, and comply with RoHS substance restrictions.',
    regulations: ['ESPR', 'RoHS'],
    category: 'Electronics',
    rules: {
      minSustainabilityScore: 60,
      bannedKeywords: ['Lead', 'Mercury', 'Cadmium', 'Hexavalent Chromium'],
    },
    createdAt: '2024-07-01T00:00:00Z',
    updatedAt: '2024-07-01T00:00:00Z',
  },
  {
    id: 'cp-fashion-01',
    name: 'Global Organic Textile Standard',
    description:
      'Ensures organic status of textiles, from harvesting of raw materials, through environmentally and socially responsible manufacturing.',
    regulations: ['GOTS'],
    category: 'Fashion',
    rules: {
      minSustainabilityScore: 75,
      requiredKeywords: ['Organic Cotton'],
      bannedKeywords: ['Polyester'],
    },
    createdAt: '2024-07-01T00:00:00Z',
    updatedAt: '2024-07-01T00:00:00Z',
  },
  {
    id: 'cp-fashion-02',
    name: 'EU Leather Goods Standard (EUDR, REACH)',
    description:
      'Requires leather goods to comply with EU Deforestation-Free Regulation and REACH substance safety.',
    regulations: ['EUDR', 'REACH'],
    category: 'Fashion',
    rules: {
      minSustainabilityScore: 50,
      requiredKeywords: ['Leather'],
    },
    createdAt: '2024-07-23T00:00:00Z',
    updatedAt: '2024-07-23T00:00:00Z',
  },
  {
    id: 'cp-homegoods-01',
    name: 'General Product Safety Regulation',
    description:
      'Baseline safety requirements for all consumer goods sold in the EU.',
    regulations: ['GPSR'],
    category: 'Home Goods',
    rules: {
      minSustainabilityScore: 40,
    },
    createdAt: '2024-07-01T00:00:00Z',
    updatedAt: '2024-07-01T00:00:00Z',
  },
];
