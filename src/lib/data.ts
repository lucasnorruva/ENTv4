// src/lib/data.ts
import type { Product } from '@/types';

const now = new Date();
export let products: Product[] = [
  {
    id: 'pp-001',
    companyId: 'comp-eco',
    gtin: '09501101530003',
    productName: 'Eco-Friendly Smart Watch Series 5',
    productDescription:
      'A state-of-the-art smart watch made from 100% recycled aluminum and ethically sourced components. Features advanced health tracking and a 3-day battery life.',
    productImage: 'https://placehold.co/600x400.png',
    category: 'Electronics',
    supplier: 'Eco Innovate Ltd.',
    status: 'Published',
    compliancePathId: 'cp-electronics-01',
    manualUrl: 'https://example.com/manual.pdf',
    createdAt: new Date(new Date(now).setDate(now.getDate() - 2)).toISOString(),
    updatedAt: new Date(new Date(now).setDate(now.getDate() - 1)).toISOString(),
    lastUpdated: new Date(
      new Date(now).setDate(now.getDate() - 1),
    ).toISOString(),
    materials: [
      {
        name: 'Recycled Aluminum',
        percentage: 60,
        recycledContent: 100,
        origin: 'Germany',
      },
      {
        name: 'Gorilla Glass',
        percentage: 15,
        recycledContent: 0,
        origin: 'USA',
      },
      {
        name: 'Silicone',
        percentage: 25,
        recycledContent: 50,
        origin: 'South Korea',
      },
    ],
    manufacturing: {
      facility: 'Eco-Factory 1',
      country: 'Germany',
      emissionsKgCo2e: 15.5,
    },
    certifications: [
      { name: 'CE', issuer: 'TÜV SÜD' },
      { name: 'FCC', issuer: 'FCC' },
      { name: 'ISO 14001', issuer: 'BSI' },
    ],
    packaging: { type: 'Recycled Cardboard', recyclable: true },
    lifecycle: {
      carbonFootprint: 25.5,
      repairabilityScore: 8,
      expectedLifespan: 5,
      energyEfficiencyClass: 'A',
    },
    battery: {
      type: 'Lithium-ion',
      capacityMah: 3110,
      voltage: 3.83,
      isRemovable: false,
    },
    compliance: {
      rohs: { compliant: true },
      ce: { marked: true },
      weee: { registered: true, registrationNumber: 'DE 12345678' },
    },
    sustainability: {
      score: 85,
      environmental: 90,
      social: 80,
      governance: 85,
      summary:
        'Excellent use of recycled materials and strong compliance record. Repairability score is high, contributing positively.',
      isCompliant: true,
    },
    verificationStatus: 'Verified',
    lastVerificationDate: new Date(
      new Date(now).setDate(now.getDate() - 1),
    ).toISOString(),
    endOfLifeStatus: 'Active',
    blockchainProof: {
      txHash: '0x123abcde1234567890abcdef1234567890',
      explorerUrl: 'https://www.oklink.com/amoy/tx/0x123abcde1234567890abcdef1234567890',
      blockHeight: 123456,
    },
    ebsiVcId: 'did:ebsi:z123456789abcdef',
    isProcessing: false,
  },
  {
    id: 'pp-002',
    companyId: 'comp-eco',
    productName: 'Recycled Plastic Drone Casing',
    productDescription:
      'A lightweight and durable drone casing made from 95% post-consumer recycled plastic. Perfect for DIY drone enthusiasts.',
    productImage: 'https://placehold.co/600x400.png',
    category: 'Electronics',
    supplier: 'Eco Innovate Ltd.',
    status: 'Draft',
    materials: [
      { name: 'Recycled ABS Plastic', percentage: 95, recycledContent: 95 },
      { name: 'Steel Screws', percentage: 5, recycledContent: 10 },
    ],
    createdAt: new Date(new Date(now).setDate(now.getDate() - 5)).toISOString(),
    updatedAt: new Date(new Date(now).setDate(now.getDate() - 3)).toISOString(),
    lastUpdated: new Date(
      new Date(now).setDate(now.getDate() - 3),
    ).toISOString(),
    verificationStatus: 'Not Submitted',
    endOfLifeStatus: 'Active',
    dataQualityWarnings: [
      {
        field: 'manufacturing.country',
        warning: 'Country of manufacture is not specified.',
      },
    ],
    isProcessing: false,
  },
  {
    id: 'pp-003',
    companyId: 'comp-thread',
    productName: 'Organic Cotton T-Shirt',
    productDescription:
      'A soft and comfortable t-shirt made from 100% GOTS-certified organic cotton. Fair-trade certified.',
    productImage: 'https://placehold.co/600x400.png',
    category: 'Fashion',
    supplier: 'Sustainable Threads Inc.',
    status: 'Published',
    compliancePathId: 'cp-fashion-01',
    materials: [
      {
        name: 'Organic Cotton',
        percentage: 100,
        recycledContent: 0,
        origin: 'India',
      },
    ],
    certifications: [
      { name: 'GOTS', issuer: 'Control Union' },
      { name: 'Fair Trade', issuer: 'Fairtrade International' },
    ],
    sustainability: {
      score: 92,
      environmental: 95,
      social: 98,
      governance: 82,
      summary:
        'Excellent sustainability profile due to GOTS and Fair Trade certifications. Material is fully biodegradable.',
      isCompliant: true,
    },
    createdAt: new Date(
      new Date(now).setDate(now.getDate() - 10),
    ).toISOString(),
    updatedAt: new Date(new Date(now).setDate(now.getDate() - 4)).toISOString(),
    lastUpdated: new Date(
      new Date(now).setDate(now.getDate() - 4),
    ).toISOString(),
    verificationStatus: 'Verified',
    endOfLifeStatus: 'Active',
    isProcessing: false,
  },
  {
    id: 'pp-004',
    companyId: 'comp-thread',
    productName: 'Leather Handbag',
    productDescription:
      'A stylish handbag made from Italian leather. Contains lead-based dyes which are non-compliant.',
    productImage: 'https://placehold.co/600x400.png',
    category: 'Fashion',
    supplier: 'Sustainable Threads Inc.',
    status: 'Draft',
    compliancePathId: 'cp-fashion-02',
    materials: [
      { name: 'Leather', origin: 'Brazil' },
      { name: 'Lead-based dye' },
    ],
    compliance: { eudr: { compliant: false }, reach: { svhcDeclared: false } },
    createdAt: new Date(
      new Date(now).setDate(now.getDate() - 15),
    ).toISOString(),
    updatedAt: new Date(new Date(now).setDate(now.getDate() - 5)).toISOString(),
    lastUpdated: new Date(
      new Date(now).setDate(now.getDate() - 5),
    ).toISOString(),
    verificationStatus: 'Failed',
    lastVerificationDate: new Date(
      new Date(now).setDate(now.getDate() - 2),
    ).toISOString(),
    endOfLifeStatus: 'Active',
    sustainability: {
      score: 30,
      environmental: 20,
      social: 50,
      governance: 40,
      isCompliant: false,
      summary: 'Product contains lead, which is a banned substance.',
      gaps: [
        {
          regulation: 'EU Leather Goods Standard',
          issue: 'Contains banned substance: Lead-based dye',
        },
      ],
    },
    isProcessing: false,
  },
  {
    id: 'pp-005',
    companyId: 'comp-eco',
    productName: 'Pro-Grade 4K Drone',
    productDescription:
      'A professional-grade quadcopter with a 4K camera and 30-minute flight time. Submitted for review.',
    productImage: 'https://placehold.co/600x400.png',
    category: 'Electronics',
    supplier: 'Eco Innovate Ltd.',
    status: 'Draft',
    materials: [
      { name: 'Carbon Fiber' },
      { name: 'Plastic' },
      { name: 'Lithium Battery' },
    ],
    createdAt: new Date(new Date(now).setDate(now.getDate() - 8)).toISOString(),
    updatedAt: new Date(
      new Date(now).setHours(now.getHours() - 12),
    ).toISOString(),
    lastUpdated: new Date(
      new Date(now).setHours(now.getHours() - 12),
    ).toISOString(),
    verificationStatus: 'Pending',
    endOfLifeStatus: 'Active',
    isProcessing: false,
  },
  {
    id: 'pp-006',
    companyId: 'comp-eco',
    productName: 'Non-Compliant Power Bank',
    productDescription:
      'A portable power bank with missing compliance data for key EU regulations.',
    productImage: 'https://placehold.co/600x400.png',
    category: 'Electronics',
    supplier: 'Eco Innovate Ltd.',
    status: 'Draft',
    compliancePathId: 'cp-electronics-01',
    materials: [{ name: 'Lithium Battery' }, { name: 'Plastic Casing' }],
    compliance: { rohs: { compliant: false }, weee: { registered: false } },
    createdAt: new Date(
      new Date(now).setDate(now.getDate() - 1),
    ).toISOString(),
    updatedAt: new Date(
      new Date(now).setHours(now.getHours() - 1),
    ).toISOString(),
    lastUpdated: new Date(
      new Date(now).setHours(now.getHours() - 1),
    ).toISOString(),
    verificationStatus: 'Failed',
    lastVerificationDate: new Date().toISOString(),
    endOfLifeStatus: 'Active',
    isProcessing: false,
    sustainability: {
      score: 40,
      environmental: 35,
      social: 50,
      governance: 55,
      summary: 'Product has multiple compliance failures.',
      isCompliant: false,
      gaps: [],
    },
  },
];
