// src/lib/compliance-data.ts
import type { CompliancePath } from '@/types';

const now = new Date();

export let compliancePaths: CompliancePath[] = [
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
    createdAt: new Date(new Date(now).setMonth(now.getMonth() - 1)).toISOString(),
    updatedAt: new Date(new Date(now).setMonth(now.getMonth() - 1)).toISOString(),
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
    createdAt: new Date(new Date(now).setMonth(now.getMonth() - 2)).toISOString(),
    updatedAt: new Date(new Date(now).setMonth(now.getMonth() - 2)).toISOString(),
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
    createdAt: new Date(new Date(now).setMonth(now.getMonth() - 3)).toISOString(),
    updatedAt: new Date(new Date(now).setMonth(now.getMonth() - 3)).toISOString(),
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
    createdAt: new Date(new Date(now).setMonth(now.getMonth() - 4)).toISOString(),
    updatedAt: new Date(new Date(now).setMonth(now.getMonth() - 4)).toISOString(),
  },
];
