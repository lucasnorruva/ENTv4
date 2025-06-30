// scripts/seed.ts
import * as dotenv from 'dotenv';
dotenv.config(); // Explicitly load .env file at the top

import * as admin from 'firebase-admin';
import { products as mockProducts } from '../src/lib/data';
import { compliancePaths as mockCompliancePaths } from '../src/lib/compliance-data';
import { auditLogs as mockAuditLogs } from '../src/lib/audit-log-data';
import { Collections } from '../src/lib/constants';

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

async function seedCollection(
  collectionName: string,
  data: any[],
  idField?: string,
) {
  console.log(`Starting to seed collection '${collectionName}'...`);
  const collectionRef = db.collection(collectionName);
  const existingDocs = await collectionRef.get();
  if (!existingDocs.empty) {
    console.log(
      `Collection '${collectionName}' is not empty. Deleting existing documents...`,
    );
    const deleteBatch = db.batch();
    existingDocs.docs.forEach(doc => deleteBatch.delete(doc.ref));
    await deleteBatch.commit();
    console.log(`Deleted ${existingDocs.size} documents.`);
  }

  console.log(`This will write ${data.length} documents to '${collectionName}'.`);

  const batch = db.batch();

  for (const item of data) {
    const docRef = idField
      ? collectionRef.doc(item[idField])
      : collectionRef.doc();
    const { id, ...itemData } = item;

    // Convert date strings to Firestore Timestamps for proper querying
    const dataToSeed = {
      ...itemData,
      createdAt: itemData.createdAt
        ? admin.firestore.Timestamp.fromDate(new Date(itemData.createdAt))
        : admin.firestore.Timestamp.now(),
      updatedAt: itemData.updatedAt
        ? admin.firestore.Timestamp.fromDate(new Date(itemData.updatedAt))
        : admin.firestore.Timestamp.now(),
      ...(itemData.lastUpdated && {
        lastUpdated: admin.firestore.Timestamp.fromDate(
          new Date(itemData.lastUpdated),
        ),
      }),
      ...(itemData.lastVerificationDate && {
        lastVerificationDate: admin.firestore.Timestamp.fromDate(
          new Date(itemData.lastVerificationDate),
        ),
      }),
    };
    batch.set(docRef, dataToSeed);
  }

  try {
    await batch.commit();
    console.log(
      `✅ Successfully seeded ${data.length} documents to '${collectionName}'.`,
    );
  } catch (error) {
    console.error(`❌ Error seeding collection '${collectionName}':`, error);
    throw error;
  }
}

async function seedDatabase() {
  await seedCollection(Collections.PRODUCTS, mockProducts, 'id');
  await seedCollection(
    Collections.COMPLIANCE_PATHS,
    mockCompliancePaths,
    'id',
  );
  await seedCollection(Collections.AUDIT_LOGS, mockAuditLogs, 'id');
}

seedDatabase()
  .then(() => {
    console.log('Database seeding completed successfully.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Seeding script failed:', error);
    process.exit(1);
  });
