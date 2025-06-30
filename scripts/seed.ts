// scripts/seed.ts
import * as admin from 'firebase-admin';
import { products as mockProducts } from '../src/lib/data';
import { Collections } from '../src/lib/constants';

// The Admin SDK is automatically initialized by firebase-functions.
// For local scripts, it uses the GOOGLE_APPLICATION_CREDENTIALS env var.
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

async function seedDatabase() {
  console.log('Starting to seed database with Admin SDK...');
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
