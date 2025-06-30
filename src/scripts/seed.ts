
// scripts/seed.ts
import * as dotenv from 'dotenv';
dotenv.config(); // Explicitly load .env file at the top

import * as admin from 'firebase-admin';
import { Collections } from '../lib/constants';

// Import mock data
import { products as mockProducts } from '../lib/data';
import { compliancePaths as mockCompliancePaths } from '../lib/compliance-data';
import { users as mockUsers } from '../lib/user-data';
import { auditLogs as mockAuditLogs } from '../lib/audit-log-data';
import { apiKeys as mockApiKeys } from '../lib/api-key-data';
import { productionLines as mockProductionLines } from '../lib/manufacturing-data';
import { serviceTickets as mockServiceTickets } from '../lib/service-ticket-data';
import { apiSettings as mockApiSettings } from '../lib/api-settings-data';

// This script uses the Firebase Admin SDK, which requires a service account
// for privileged access. It does NOT use the client-side config from firebase.ts.
if (!admin.apps.length) {
  try {
    console.log('Initializing Firebase Admin SDK...');
    // initializeApp() will automatically use the GOOGLE_APPLICATION_CREDENTIALS
    // environment variable pointing to your service-account.json file.
    admin.initializeApp();
    console.log('Firebase Admin SDK initialized successfully.');
  } catch (error: any) {
    console.error(
      '❌ Firebase Admin SDK initialization failed. This usually means your service account key is missing or has incorrect permissions.',
    );
    console.error(
      'Please ensure you have a valid `service-account.json` file in your project root, and that the `GOOGLE_APPLICATION_CREDENTIALS` variable in your `.env` file points to it (e.g., GOOGLE_APPLICATION_CREDENTIALS=./service-account.json).',
    );
    console.error(
      'You can generate a new key from your Firebase project settings under "Service accounts".',
    );
    process.exit(1);
  }
}

const db = admin.firestore();

// Helper to convert date strings to Firestore Timestamps
const convertToTimestamps = (data: any, dateFields: string[]) => {
  const convertedData = { ...data };
  for (const field of dateFields) {
    if (convertedData[field] && typeof convertedData[field] === 'string') {
      convertedData[field] = admin.firestore.Timestamp.fromDate(
        new Date(convertedData[field]),
      );
    }
  }
  return convertedData;
};

async function seedCollection(
  collectionName: string,
  data: any[],
  dateFields: string[] = ['createdAt', 'updatedAt'],
) {
  console.log(`Seeding collection: ${collectionName}...`);
  const collectionRef = db.collection(collectionName);
  const batch = db.batch();

  for (const item of data) {
    const { id, ...itemData } = item;
    const docRef = collectionRef.doc(id);
    const dataWithTimestamps = convertToTimestamps(itemData, dateFields);
    batch.set(docRef, dataWithTimestamps);
  }

  await batch.commit();
  console.log(`✅ Successfully seeded ${data.length} documents in ${collectionName}.`);
}

async function seedSingleDoc(
  collectionName: string,
  docId: string,
  data: any,
) {
  console.log(`Seeding single document: ${collectionName}/${docId}...`);
  await db.collection(collectionName).doc(docId).set(data);
  console.log(`✅ Successfully seeded ${collectionName}/${docId}.`);
}

async function seedDatabase() {
  try {
    console.log('Starting to seed database...');

    await seedCollection(Collections.PRODUCTS, mockProducts, [
      'createdAt',
      'updatedAt',
      'lastUpdated',
      'lastVerificationDate',
    ]);
    await seedCollection(
      Collections.COMPLIANCE_PATHS,
      mockCompliancePaths,
    );
    await seedCollection(Collections.USERS, mockUsers);
    await seedCollection(Collections.AUDIT_LOGS, mockAuditLogs);
    await seedCollection(Collections.API_KEYS, mockApiKeys, [
      'createdAt',
      'updatedAt',
      'lastUsed',
    ]);

    // For data that isn't a collection of identifiable documents, store as a single doc.
    await seedSingleDoc(Collections.COMPANIES, 'mock-manufacturing-data', {
      productionLines: mockProductionLines,
    });
    await seedSingleDoc(Collections.COMPANIES, 'mock-service-ticket-data', {
      serviceTickets: mockServiceTickets,
    });
    await seedSingleDoc(Collections.API_SETTINGS, 'global', mockApiSettings);

    console.log('Database seeding completed successfully.');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

seedDatabase()
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    console.error('Seeding script failed:', error);
    process.exit(1);
  });
