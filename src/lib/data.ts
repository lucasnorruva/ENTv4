// src/lib/data.ts
import type { Product, BlockchainProof } from '@/types';

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
    model3dUrl: '/watch-v1.glb',
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
      { name: 'CE', issuer: 'TÜV SÜD', documentUrl: '#', validUntil: '2028-12-31' },
      { name: 'FCC', issuer: 'FCC', documentUrl: '#', validUntil: '2029-01-01' },
      { name: 'ISO 14001', issuer: 'BSI', documentUrl: '#', validUntil: '2026-05-20' },
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
    transit: {
      stage: 'Cleared - Inland Transit (DE)',
      departureDate: new Date(new Date(now).setDate(now.getDate() - 2)).toISOString(),
      eta: '2024-08-02T12:00:00Z',
      transport: 'Truck',
      origin: 'Port of Gdansk, Poland',
      destination: 'Berlin, Germany',
    },
    customs: {
      status: 'Cleared',
      authority: 'German Customs (Zoll)',
      location: 'Frankfurt (Oder)',
      date: new Date(new Date(now).setDate(now.getDate() - 3)).toISOString(),
      notes: 'Standard spot check passed.',
      history: [
        { status: 'Detained', authority: 'Polish Customs', location: 'Port of Gdansk', date: new Date(new Date(now).setDate(now.getDate() - 5)).toISOString(), notes: "Awaiting final paperwork from exporter."},
      ]
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
      complianceSummary: 'This product is fully compliant with the assigned EU Electronics path.',
      gaps: [],
    },
    customData: {
      internal_sku: 'ECO-SW-S5-BLK',
      is_fragile: true,
    },
    verificationStatus: 'Verified',
    lastVerificationDate: new Date(
      new Date(now).setDate(now.getDate() - 1),
    ).toISOString(),
    endOfLifeStatus: 'Active',
    blockchainProof: {
      type: 'SINGLE_HASH',
      txHash: '0x123abcde1234567890abcdef1234567890',
      explorerUrl: 'https://www.oklink.com/amoy/tx/0x123abcde1234567890abcdef1234567890',
      blockHeight: 123456,
      merkleRoot: 'mock-merkle-root-for-pp-001',
    },
    ebsiDetails: {
      status: 'Verified',
      conformanceResultUrl: 'https://api.ebsi.eu/conformance/v4/results/12345',
    },
    verifiableCredentials: [
      { id: 'vc-dpp-001', type: 'DPP', issuer: 'Norruva Platform', issueDate: new Date().toISOString() },
      { id: 'vc-mat-001', type: 'Material Passport', issuer: 'German Components GmbH', issueDate: new Date().toISOString() }
    ],
    chainOfCustody: [
      { event: 'Manufactured', actor: 'Eco-Factory 1', location: 'Germany', date: new Date(new Date(now).setDate(now.getDate() - 7)).toISOString() },
      { event: 'Shipped from Factory', actor: 'DHL', location: 'Germany', date: new Date(new Date(now).setDate(now.getDate() - 6)).toISOString() }
    ],
    ownershipNft: {
      tokenId: '54321',
      contractAddress: '0xNFT_CONTRACT_ADDRESS',
      ownerAddress: '0xOWNER_WALLET_ADDRESS'
    },
    zkProof: {
      proofData: 'zk_proof_data_string_for_product_001...',
      isVerified: true,
      verifiedAt: new Date().toISOString(),
    },
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
    status: 'Published',
    materials: [
      { name: 'Recycled ABS Plastic', percentage: 95, recycledContent: 95, origin: 'China' },
      { name: 'Steel Screws', percentage: 5, recycledContent: 10, origin: 'Japan' },
    ],
    manufacturing: { facility: 'Shenzhen Plant', country: 'China' },
    compliance: {},
    createdAt: new Date(new Date(now).setDate(now.getDate() - 5)).toISOString(),
    updatedAt: new Date(new Date(now).setDate(now.getDate() - 3)).toISOString(),
    lastUpdated: new Date(
      new Date(now).setDate(now.getDate() - 3),
    ).toISOString(),
    transit: {
        stage: 'Awaiting Port Departure',
        departureDate: new Date(new Date(now).setDate(now.getDate() - 1)).toISOString(),
        eta: '2024-08-20T12:00:00Z',
        transport: 'Ship',
        origin: 'Shenzhen, China',
        destination: 'Los Angeles, USA',
    },
    customs: {
        status: 'Detained',
        authority: 'US Customs & Border Protection',
        location: 'Port of Long Beach',
        date: new Date(new Date(now).setDate(now.getDate() - 1)).toISOString(),
        notes: 'Random container inspection underway.'
    },
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
    manufacturing: { facility: 'Mumbai Textiles', country: 'India' },
    certifications: [
      { name: 'GOTS', issuer: 'Control Union' },
      { name: 'Fair Trade', issuer: 'Fairtrade International' },
    ],
    compliance: {},
    sustainability: {
      score: 92,
      environmental: 95,
      social: 98,
      governance: 82,
      summary:
        'Excellent sustainability profile due to GOTS and Fair Trade certifications. Material is fully biodegradable.',
      isCompliant: true,
      complianceSummary: '',
    },
    transit: {
        stage: 'At Customs (Rotterdam, NL)',
        departureDate: new Date(new Date(now).setDate(now.getDate() - 12)).toISOString(),
        eta: '2024-08-05T12:00:00Z',
        transport: 'Ship',
        origin: 'Mumbai, India',
        destination: 'Paris, France',
    },
    createdAt: new Date(
      new Date(now).setDate(now.getDate() - 10),
    ).toISOString(),
    updatedAt: new Date(new Date(now).setDate(now.getDate() - 4)).toISOString(),
    lastUpdated: new Date(
      new Date(now).setDate(now.getDate() - 4),
    ).toISOString(),
    verificationStatus: 'Pending',
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
    status: 'Published',
    compliancePathId: 'cp-fashion-02',
    materials: [
      { name: 'Leather', origin: 'Brazil' },
      { name: 'Lead-based dye' },
    ],
    manufacturing: { facility: 'Milan Leathers', country: 'Italy' },
    transit: {
        stage: 'Airborne - Approaching EU',
        departureDate: new Date(new Date(now).setDate(now.getDate() - 1)).toISOString(),
        eta: '2024-08-08T12:00:00Z',
        transport: 'Plane',
        origin: 'Shenzhen, China',
        destination: 'Frankfurt, Germany',
    },
    customs: {
      status: 'Rejected',
      authority: 'German Customs (Zoll)',
      location: 'Frankfurt Airport',
      date: new Date(new Date(now).setDate(now.getDate() - 1)).toISOString(),
      notes: 'Rejected due to non-compliant materials (lead) found during inspection.'
    },
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
      complianceSummary: 'Product contains a banned material: \'Lead-based dye\'.',
      gaps: [
        {
          regulation: 'Global Organic Textile Standard',
          issue: "Product contains a banned material: 'Lead-based dye'",
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
    status: 'Published',
    materials: [
      { name: 'Carbon Fiber', origin: 'Japan' },
      { name: 'Plastic', origin: 'South Korea' },
      { name: 'Lithium Battery', origin: 'China' },
    ],
    manufacturing: { facility: 'Aero Plant 1', country: 'USA' },
    compliance: {},
    transit: {
        stage: 'Awaiting Customs Clearance (Antwerp, BE)',
        departureDate: new Date(new Date(now).setDate(now.getDate() - 10)).toISOString(),
        eta: '2024-08-01T12:00:00Z',
        transport: 'Ship',
        origin: 'Ho Chi Minh City, Vietnam',
        destination: 'Lyon, France',
    },
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
    status: 'Published',
    compliancePathId: 'cp-electronics-01',
    materials: [{ name: 'Lithium Battery', origin: 'USA' }, { name: 'Plastic Casing', origin: 'USA' }],
    manufacturing: { facility: 'Newark Electronics', country: 'USA' },
    transit: {
        stage: 'Pre-Arrival Notification Submitted (Bremerhaven, DE)',
        departureDate: new Date(new Date(now).setDate(now.getDate() - 3)).toISOString(),
        eta: '2024-08-15T12:00:00Z',
        transport: 'Ship',
        origin: 'Newark, USA',
        destination: 'Stuttgart, Germany',
    },
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
      complianceSummary: 'Product has multiple compliance failures.',
      isCompliant: false,
      gaps: [],
    },
  },
];
