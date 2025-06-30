
// scripts/seed.ts
import * as dotenv from 'dotenv';
dotenv.config(); // Explicitly load .env file at the top

import * as admin from 'firebase-admin';
import { products as mockProducts } from '../src/lib/data';
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

async function seedDatabase() {
  console.log('Starting to seed database...');
  const collectionRef = db.collection(Collections.PRODUCTS);
  console.log(
    `This will write ${mockProducts.length} documents to the '${Collections.PRODUCTS}' collection.`,
  );

  const batch = db.batch();

  for (const product of mockProducts) {
    const docRef = collectionRef.doc(product.id);
    const { id, ...productData } = product;

    // Convert date strings to Firestore Timestamps for proper querying
    const dataToSeed = {
      ...productData,
      lastUpdated: admin.firestore.Timestamp.fromDate(
        new Date(productData.lastUpdated),
      ),
      createdAt: productData.createdAt
        ? admin.firestore.Timestamp.fromDate(new Date(productData.createdAt))
        : admin.firestore.Timestamp.now(),
      updatedAt: productData.updatedAt
        ? admin.firestore.Timestamp.fromDate(new Date(productData.updatedAt))
        : admin.firestore.Timestamp.now(),
      ...(productData.lastVerificationDate && {
        lastVerificationDate: admin.firestore.Timestamp.fromDate(
          new Date(productData.lastVerificationDate),
        ),
      }),
    };
    batch.set(docRef, dataToSeed);
  }

  try {
    await batch.commit();
    console.log(`✅ Successfully seeded ${mockProducts.length} products.`);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
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
