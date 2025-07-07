// src/lib/compliance-data.ts
import type { CompliancePath } from '@/types';

const now = new Date();

export let compliancePaths: CompliancePath[] = [
  {
    id: 'cp-electronics-01',
    name: 'EU Electronics Sustainability Standard (ESPR, RoHS, WEEE, Battery)',
    description:
      'Requires electronics to have a sustainability score above 60, be easily repairable, and comply with RoHS substance restrictions, WEEE registration, and EU Battery regulations.',
    regulations: [
      'ESPR',
      'RoHS',
      'WEEE',
      'EU Battery Regulation',
      'PFAS',
      'Conflict Minerals',
    ],
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
  {
    id: 'cp-construction-eu-01',
    name: 'EU Construction Products Regulation (CPR & ESPR)',
    description: 'Compliance path for construction materials sold in the EU, covering CPR and future ESPR requirements. Focuses on safety, performance, and environmental impact.',
    regulations: ['CPR', 'ESPR', 'REACH'],
    category: 'Construction',
    rules: {
      minSustainabilityScore: 55,
      bannedKeywords: ['Asbestos', 'Lead Paint'],
    },
    createdAt: new Date(new Date(now).setMonth(now.getMonth() - 1)).toISOString(),
    updatedAt: new Date(new Date(now).setMonth(now.getMonth() - 1)).toISOString(),
  },
  {
    id: 'cp-north-america-01',
    name: 'North America Consumer Goods (CPSC & CCME EPR)',
    description: 'General compliance for consumer products in the US & Canada, covering CPSC safety standards and Canadian EPR.',
    regulations: ['CPSC', 'CCME EPR', 'Prop 65'],
    category: 'Home Goods',
    rules: {
      requiredKeywords: ['Safety Data Sheet'],
      bannedKeywords: ['Phthalates'],
    },
    createdAt: new Date(new Date(now).setMonth(now.getMonth() - 1)).toISOString(),
    updatedAt: new Date(new Date(now).setMonth(now.getMonth() - 1)).toISOString(),
  },
  {
    id: 'cp-apac-electronics-01',
    name: 'APAC Electronics Compliance (China RoHS, Japan Recycling)',
    description: 'General compliance framework for electronics sold in key APAC markets, including substance restrictions and e-waste laws.',
    regulations: ['China RoHS', 'Japan E-Waste', 'India E-Waste Rules'],
    category: 'Electronics',
    rules: {},
    createdAt: new Date(new Date(now).setMonth(now.getMonth() - 1)).toISOString(),
    updatedAt: new Date(new Date(now).setMonth(now.getMonth() - 1)).toISOString(),
  },
];
