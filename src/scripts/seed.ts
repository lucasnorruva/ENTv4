// src/scripts/seed.ts
import { products } from '../lib/data';
import { users } from '../lib/user-data';
import { companies } from '../lib/company-data';
import { compliancePaths } from '../lib/compliance-data';
import { serviceTickets } from '../lib/service-ticket-data';
import { webhooks } from '../lib/webhook-data';
import { apiKeys } from '../lib/api-key-data';
import { Collections } from '../lib/constants';
import { productionLines } from '../lib/manufacturing-data';

// A map of collection names to their data arrays
const collectionsToSeed = {
  [Collections.PRODUCTS]: products,
  [Collections.USERS]: users,
  [Collections.COMPANIES]: companies,
  [Collections.COMPLIANCE_PATHS]: compliancePaths,
  [Collections.SERVICE_TICKETS]: serviceTickets,
  [Collections.WEBHOOKS]: webhooks,
  [Collections.API_KEYS]: apiKeys,
  [Collections.PRODUCTION_LINES]: productionLines,
};

// In a real Firebase project, you'd use the Admin SDK. For this mock,
// we just log that we would be seeding the data.
async function seedDatabase() {
  console.log('Starting database seed...');

  for (const [collectionName, data] of Object.entries(collectionsToSeed)) {
    console.log(`Seeding ${data.length} documents into ${collectionName}...`);
    // In a real script:
    // const collectionRef = adminDb.collection(collectionName);
    // for (const item of data) {
    //   await collectionRef.doc(item.id).set(item);
    // }
  }

  console.log('Database seeding complete!');
}

seedDatabase().catch(e => {
  console.error(e);
  process.exit(1);
});
