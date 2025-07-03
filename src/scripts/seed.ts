// src/scripts/seed.ts
import * as dotenv from 'dotenv';
dotenv.config(); // Explicitly load .env file at the top

import admin, { adminDb } from '../lib/firebase-admin';
import { serviceTickets as mockServiceTickets } from '../lib/service-ticket-data';
import { productionLines as mockProductionLines } from '../lib/manufacturing-data';
import { apiKeys as mockApiKeys } from '../lib/api-key-data';
import { webhooks as mockWebhooks } from '../lib/webhook-data';
import { auditLogs as mockAuditLogs } from '../lib/audit-log-data';
import { Collections, UserRoles } from '../lib/constants';
import type { Company, Product, User, CompliancePath } from '@/types';

// --- MOCK DATA DEFINITIONS (MOVED FROM DEPRECATED FILES) ---
const mockCompanies: Omit<Company, 'createdAt' | 'updatedAt'>[] = [
  { id: 'comp-eco', name: 'Eco Innovate Ltd.', ownerId: 'user-supplier' },
  {
    id: 'comp-thread',
    name: 'Sustainable Threads Inc.',
    ownerId: 'user-supplier',
  },
  { id: 'comp-norruva', name: 'Norruva Corp', ownerId: 'user-admin' },
];

const mockUsers: Omit<
  User,
  'createdAt' | 'updatedAt' | 'readNotificationIds'
>[] = [
  {
    id: 'user-admin',
    fullName: 'Admin User',
    email: 'admin@norruva.com',
    companyId: 'comp-norruva',
    roles: [UserRoles.ADMIN],
    onboardingComplete: true,
    isMfaEnabled: false,
  },
  {
    id: 'user-supplier',
    fullName: 'Supplier User',
    email: 'supplier@norruva.com',
    companyId: 'comp-eco',
    roles: [UserRoles.SUPPLIER],
    onboardingComplete: true,
    isMfaEnabled: false,
  },
  {
    id: 'user-auditor',
    fullName: 'Auditor User',
    email: 'auditor@norruva.com',
    companyId: 'comp-norruva',
    roles: [UserRoles.AUDITOR],
    onboardingComplete: true,
    isMfaEnabled: false,
  },
  {
    id: 'user-compliance',
    fullName: 'Compliance Manager',
    email: 'compliance@norruva.com',
    companyId: 'comp-norruva',
    roles: [UserRoles.COMPLIANCE_MANAGER],
    onboardingComplete: true,
    isMfaEnabled: false,
  },
  {
    id: 'user-manufacturer',
    fullName: 'Manufacturer User',
    email: 'manufacturer@norruva.com',
    companyId: 'comp-eco',
    roles: [UserRoles.MANUFACTURER],
    onboardingComplete: true,
    isMfaEnabled: false,
  },
  {
    id: 'user-service',
    fullName: 'Service Provider',
    email: 'service@norruva.com',
    companyId: 'comp-norruva',
    roles: [UserRoles.SERVICE_PROVIDER],
    onboardingComplete: true,
    isMfaEnabled: false,
  },
  {
    id: 'user-recycler',
    fullName: 'Recycler User',
    email: 'recycler@norruva.com',
    companyId: 'comp-norruva',
    roles: [UserRoles.RECYCLER],
    onboardingComplete: true,
    isMfaEnabled: false,
  },
  {
    id: 'user-retailer',
    fullName: 'Retailer User',
    email: 'retailer@norruva.com',
    companyId: 'comp-norruva',
    roles: [UserRoles.RETAILER],
    onboardingComplete: true,
    isMfaEnabled: false,
  },
  {
    id: 'user-developer',
    fullName: 'Developer User',
    email: 'developer@norruva.com',
    companyId: 'comp-norruva',
    roles: [UserRoles.DEVELOPER],
    onboardingComplete: true,
    isMfaEnabled: false,
  },
  {
    id: 'user-analyst',
    fullName: 'Business Analyst',
    email: 'analyst@norruva.com',
    companyId: 'comp-norruva',
    roles: [UserRoles.BUSINESS_ANALYST],
    onboardingComplete: true,
    isMfaEnabled: false,
  },
];

const now = new Date();
const mockProducts: Omit<Product, 'createdAt' | 'updatedAt' | 'lastUpdated'>[] =
  [
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
      manualUrl: 'https://example.com/manuals/smart-watch-s5.pdf',
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
      verificationStatus: 'Verified',
      lastVerificationDate: new Date(
        new Date(now).setDate(now.getDate() - 1),
      ).toISOString(),
      endOfLifeStatus: 'Active',
      isProcessing: false,
    },
  ];

const mockCompliancePaths: Omit<CompliancePath, 'createdAt' | 'updatedAt'>[] = [
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
  },
];
// --- END MOCK DATA ---

async function testFirestoreConnection() {
  console.log('Testing Firestore connection...');
  try {
    // Attempt a simple read operation. We don't care about the result,
    // only that the request doesn't throw a permissions error.
    await adminDb.collection('__test_connection__').limit(1).get();
    console.log('✅ Firestore connection successful.');
    return true;
  } catch (error) {
    console.error(
      '❌ Firestore connection failed. Please check your service account key and emulator status.',
    );
    console.error('Error details:', error);
    return false;
  }
}

async function seedAuth() {
  console.log('Seeding Firebase Authentication with mock users...');

  const userCreationPromises = mockUsers.map(user => {
    return admin
      .auth()
      .createUser({
        uid: user.id,
        email: user.email,
        password: 'password123', // Standard password for all mock users
        displayName: user.fullName,
        emailVerified: true,
        disabled: false,
      })
      .catch(error => {
        if (
          error.code === 'auth/uid-already-exists' ||
          error.code === 'auth/email-already-exists'
        ) {
          return null;
        }
        console.error(`Error creating user ${user.id}:`, error);
        throw error;
      });
  });

  try {
    await Promise.all(userCreationPromises);
    console.log(
      `✅ Auth seeding complete. ${mockUsers.length} users processed.`,
    );
  } catch (error) {
    console.error(
      '❌ A critical error occurred during Auth seeding. The script will terminate.',
    );
    throw error;
  }
}

async function clearCollection(collectionName: string) {
  console.log(`Clearing '${collectionName}' collection...`);
  const collectionRef = adminDb.collection(collectionName);
  const snapshot = await collectionRef.get();
  if (snapshot.empty) {
    console.log(`Collection '${collectionName}' is already empty.`);
    return;
  }
  const batch = adminDb.batch();
  snapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });
  await batch.commit();
  console.log(`✅ Cleared ${snapshot.size} documents from '${collectionName}'.`);
}

async function seedCollection(
  collectionName: string,
  data: any[],
  idField = 'id',
) {
  console.log(`Seeding '${collectionName}' collection...`);
  const collectionRef = adminDb.collection(collectionName);
  const batch = adminDb.batch();

  for (const item of data) {
    const { [idField]: id, ...itemData } = item;
    const docRef = collectionRef.doc(id);

    // Convert date strings to Firestore Timestamps if they exist
    const dataToSeed: { [key: string]: any } = {};
    for (const key in itemData) {
      if (Object.prototype.hasOwnProperty.call(itemData, key)) {
        const value = itemData[key];
        // A simple check to see if the string is a valid ISO date string
        if (
          typeof value === 'string' &&
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(value)
        ) {
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            dataToSeed[key] = admin.firestore.Timestamp.fromDate(date);
            continue;
          }
        }
        dataToSeed[key] = value;
      }
    }
    // Ensure core timestamps exist if they weren't in the mock
    if (!dataToSeed.createdAt)
      dataToSeed.createdAt = admin.firestore.Timestamp.now();
    if (!dataToSeed.updatedAt)
      dataToSeed.updatedAt = admin.firestore.Timestamp.now();
    if (!dataToSeed.lastUpdated)
      dataToSeed.lastUpdated = admin.firestore.Timestamp.now();

    batch.set(docRef, dataToSeed);
  }

  try {
    await batch.commit();
    console.log(
      `✅ Successfully seeded ${data.length} documents in '${collectionName}'.`,
    );
  } catch (error) {
    console.error(`❌ Error seeding '${collectionName}':`, error);
    throw error;
  }
}

async function seedDatabase() {
  console.log('Starting comprehensive database seeding...');

  const isConnected = await testFirestoreConnection();
  if (!isConnected) {
    console.log('Halting seed script due to connection failure.');
    return; // Stop the script if connection fails
  }

  // Seed Authentication first to ensure UIDs are consistent
  await seedAuth();

  // The order can be important if there are dependencies
  await seedCollection(Collections.COMPANIES, mockCompanies);
  await seedCollection(Collections.USERS, mockUsers);
  await seedCollection(Collections.PRODUCTS, mockProducts);
  await seedCollection(Collections.COMPLIANCE_PATHS, mockCompliancePaths);
  await seedCollection(Collections.SERVICE_TICKETS, mockServiceTickets);
  await seedCollection(Collections.PRODUCTION_LINES, mockProductionLines);
  await seedCollection(Collections.API_KEYS, mockApiKeys);
  await seedCollection(Collections.AUDIT_LOGS, mockAuditLogs);
  await seedCollection(Collections.WEBHOOKS, mockWebhooks);

  // Seed API Settings
  await adminDb.collection('settings').doc('api').set({
    isPublicApiEnabled: true,
    rateLimits: {
      free: 100,
      pro: 1000,
      enterprise: 10000,
    },
    isWebhookSigningEnabled: true,
  });
  console.log(`✅ Successfully seeded API settings.`);

  // Clear the dynamic rate limit collection
  await clearCollection(Collections.API_RATE_LIMITS);

  console.log('Database seeding completed successfully.');
}

seedDatabase()
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    console.error('Seeding script failed:', error);
    process.exit(1);
  });
