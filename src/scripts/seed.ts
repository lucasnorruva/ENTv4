// src/scripts/seed.ts
import { adminDb } from '../lib/firebase-admin';
import { products } from '../lib/data';
import { users } from '../lib/user-data';
import { companies } from '../lib/company-data';
import { compliancePaths } from '../lib/compliance-data';
import { serviceTickets } from '../lib/service-ticket-data';
import { webhooks } from '../lib/webhook-data';
import { apiKeys } from '../lib/api-key-data';
import { Collections } from '../lib/constants';

// A map of collection names to their data arrays
const collectionsToSeed = {
  [Collections.PRODUCTS]: products,
  [Collections.USERS]: users,
  [Collections.COMPANIES]: companies,
  [Collections.COMPLIANCE_PATHS]: compliancePaths,
  [Collections.SERVICE_TICKETS]: serviceTickets,
  [Collections.WEBHOOKS]: webhooks,
  [Collections.API_KEYS]: apiKeys,
};

/**
 * Deletes all documents in a collection.
 * @param collectionName The name of the collection to clear.
 */
async function clearCollection(collectionName: string) {
  const collectionRef = adminDb.collection(collectionName);
  const snapshot = await collectionRef.limit(500).get();

  if (snapshot.empty) {
    console.log(`Collection ${collectionName} is already empty.`);
    return;
  }

  const batch = adminDb.batch();
  snapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });

  await batch.commit();

  // Recurse if there are more documents to delete
  if (snapshot.size > 0) {
    await clearCollection(collectionName);
  }
}

/**
 * Seeds a single collection in Firestore from a data array.
 * @param collectionName The name of the collection to seed.
 * @param data The array of data objects to seed.
 */
async function seedCollection(collectionName: string, data: any[]) {
  console.log(`Seeding ${collectionName}...`);
  const collectionRef = adminDb.collection(collectionName);

  for (const item of data) {
    const docRef = collectionRef.doc(item.id);
    await docRef.set(item);
  }
  console.log(`Seeded ${data.length} documents into ${collectionName}.`);
}

/**
 * Main seeding function. Clears all collections and then seeds them.
 */
async function main() {
  console.log('Starting database seed...');

  for (const collectionName of Object.keys(collectionsToSeed)) {
    console.log(`\nClearing existing data in ${collectionName}...`);
    await clearCollection(collectionName);
  }

  console.log('\nAll collections cleared. Starting seeding...');

  for (const [collectionName, data] of Object.entries(collectionsToSeed)) {
    await seedCollection(collectionName, data);
  }

  console.log('\nDatabase seeding complete!');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
