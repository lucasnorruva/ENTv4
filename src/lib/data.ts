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
    lastUpdated: new Date(
      new Date(now).setHours(now.getHours() - 1),
    ).toISOString(),
    compliancePathId: 'cp-electronics-01',
    manualUrl: 'https://example.com/manuals/smart-watch-s5.pdf',
    declarationOfConformity:
      'This is a mock declaration of conformity for the Eco-Friendly Smart Watch. It adheres to all relevant EU standards.',
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
    compliance: { rohsCompliant: true, ceMarked: true },
    sustainability: {
      score: 85,
      environmental: 90,
      social: 80,
      governance: 85,
      summary:
        'Excellent use of recycled materials and strong compliance record. Repairability score is high, contributing positively.',
      isCompliant: true,
    },
    qrLabelText:
      'Verified for sustainability and made with 100% recycled aluminum.',
    verificationStatus: 'Verified',
    lastVerificationDate: new Date(
      new Date(now).setDate(now.getDate() - 1),
    ).toISOString(),
    endOfLifeStatus: 'Active',
    blockchainProof: {
      txHash:
        '0x123abc456def7890123abc456def7890123abc456def7890123abc456def7890',
      explorerUrl: '#',
      blockHeight: 123456,
    },
    ebsiVcId: 'did:ebsi:z275n1SroveT5U3nNnJg9aM',
    serviceHistory: [
      {
        id: 'srv-001',
        providerName: 'Official Repair Co.',
        notes:
          'Replaced battery and updated firmware. Device passed all diagnostics.',
        createdAt: new Date(
          new Date(now).setMonth(now.getMonth() - 6),
        ).toISOString(),
        updatedAt: new Date(
          new Date(now).setMonth(now.getMonth() - 6),
        ).toISOString(),
      },
    ],
    createdAt: new Date(new Date(now).setDate(now.getDate() - 10)).toISOString(),
    updatedAt: new Date(
      new Date(now).setHours(now.getHours() - 1),
    ).toISOString(),
    isProcessing: false,
  },
];
