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
    id: 'cp-us-electronics-01',
    name: 'US Electronics & Conflict Minerals Standard',
    description: 'Compliance for consumer electronics sold in the USA, covering FCC, CPSC safety, and Dodd-Frank conflict mineral reporting.',
    regulations: ['FCC', 'CPSC', 'Conflict Minerals (Dodd-Frank)'],
    category: 'Electronics',
    rules: {
      minSustainabilityScore: 50,
    },
    createdAt: new Date(new Date(now).setMonth(now.getMonth() - 1)).toISOString(),
    updatedAt: new Date(new Date(now).setMonth(now.getMonth() - 1)).toISOString(),
  },
  {
    id: 'cp-eu-packaging-01',
    name: 'EU Circular Economy - Packaging',
    description: 'Focuses on compliance with the EU Packaging Directive and Extended Producer Responsibility (EPR) schemes.',
    regulations: ['Packaging Directive (EU 94/62/EC)', 'EPR'],
    category: 'Home Goods',
    rules: {
      requiredKeywords: ['Recyclable'],
    },
    createdAt: new Date(new Date(now).setMonth(now.getMonth() - 2)).toISOString(),
    updatedAt: new Date(new Date(now).setMonth(now.getMonth() - 2)).toISOString(),
  },
  {
    id: 'cp-global-food-contact-01',
    name: 'Global Food Contact Materials (EU & US)',
    description: 'Requirements for materials intended to come into contact with food, covering key EU and US FDA regulations.',
    regulations: ['Food Contact (EU 10/2011)', 'FDA Food Contact'],
    category: 'Home Goods',
    rules: {
      requiredKeywords: ['Food Grade'],
      bannedKeywords: ['BPA', 'Bisphenol A'],
    },
    createdAt: new Date(new Date(now).setMonth(now.getMonth() - 3)).toISOString(),
    updatedAt: new Date(new Date(now).setMonth(now.getMonth() - 3)).toISOString(),
  },
  {
    id: 'cp-uk-general-01',
    name: 'UKCA General Product Safety',
    description: 'General product safety requirements for goods placed on the market in Great Britain (England, Scotland, Wales).',
    regulations: ['UKCA', 'UK RoHS'],
    category: 'Electronics',
    rules: {
      requiredKeywords: ['UKCA Declaration'],
    },
    createdAt: new Date(new Date(now).setMonth(now.getMonth() - 4)).toISOString(),
    updatedAt: new Date(new Date(now).setMonth(now.getMonth() - 4)).toISOString(),
  },
  {
    id: 'cp-auto-eu-01',
    name: 'Automotive Components (EU - ELV, ISO 26262)',
    description: 'Compliance for automotive components sold in the EU, covering End-of-Life Vehicles Directive and functional safety standards.',
    regulations: ['ELV Directive', 'ISO 26262', 'REACH'],
    category: 'Electronics',
    rules: {
      minSustainabilityScore: 65,
    },
    createdAt: new Date(new Date(now).setMonth(now.getMonth() - 5)).toISOString(),
    updatedAt: new Date(new Date(now).setMonth(now.getMonth() - 5)).toISOString(),
  },
  {
    id: 'cp-north-america-01',
    name: 'North America Consumer Goods (CPSC & CCME EPR)',
    description: 'General compliance for consumer goods in the US & Canada, covering CPSC safety standards and Canadian EPR.',
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
