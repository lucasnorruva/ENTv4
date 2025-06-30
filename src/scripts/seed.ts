// src/scripts/seed.ts
import * as dotenv from 'dotenv';
dotenv.config(); // Explicitly load .env file at the top

import admin, { adminDb } from '../lib/firebase-admin';
import { products as mockProducts } from '../lib/data';
import { Collections } from '../lib/constants';

async function seedDatabase() {
  console.log('Starting to seed database...');
  const collectionRef = adminDb.collection(Collections.PRODUCTS);
  console.log(
    `This will write ${mockProducts.length} documents to the '${Collections.PRODUCTS}' collection.`,
  );

  const batch = adminDb.batch();

  for (const product of mockProducts) {
    const { id, ...productData } = product;
    const docRef = collectionRef.doc(id);

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
