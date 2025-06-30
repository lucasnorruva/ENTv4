// scripts/seed.ts
import { config } from 'dotenv';
config(); // Load .env file to get Firebase config

import { db } from '../src/lib/firebase';
import { products as mockProducts } from '../src/lib/data';
import { collection, writeBatch, doc, Timestamp } from 'firebase/firestore';
import { Collections } from '../src/lib/constants';

async function seedDatabase() {
  console.log('Starting to seed database...');
  console.log(
    `This will write ${mockProducts.length} documents to the '${Collections.PRODUCTS}' collection.`,
  );

  // Using a batch for atomic writes is more efficient
  const batch = writeBatch(db);

  for (const product of mockProducts) {
    // We'll use the mock product's ID for consistency with existing relationships/URLs
    const docRef = doc(db, Collections.PRODUCTS, product.id);

    // Create a new object without the 'id' property for seeding
    const { id, ...productData } = product;

    // Convert date strings to Firestore Timestamps for proper querying
    const dataToSeed = {
      ...productData,
      lastUpdated: Timestamp.fromDate(new Date(productData.lastUpdated)),
      createdAt: productData.createdAt
        ? Timestamp.fromDate(new Date(productData.createdAt))
        : Timestamp.now(),
      updatedAt: productData.updatedAt
        ? Timestamp.fromDate(new Date(productData.updatedAt))
        : Timestamp.now(),
      ...(productData.lastVerificationDate && {
        lastVerificationDate: Timestamp.fromDate(
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
    throw error; // Rethrow to fail the script
  }
}

seedDatabase()
  .then(() => {
    console.log('Database seeding completed successfully.');
  })
  .catch(error => {
    console.error('Seeding script failed:', error);
    process.exit(1);
  });
