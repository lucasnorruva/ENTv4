// src/scripts/seed.ts
import * as dotenv from 'dotenv';
dotenv.config(); // Explicitly load .env file at the top

import admin, { adminDb } from '../lib/firebase-admin';
import { products as mockProducts } from '../lib/data';
import { users as mockUsers } from '../lib/user-data';
import { companies as mockCompanies } from '../lib/company-data';
import { compliancePaths as mockCompliancePaths } from '../lib/compliance-data';
import { serviceTickets as mockServiceTickets } from '../lib/service-ticket-data';
import { productionLines as mockProductionLines } from '../lib/manufacturing-data';
import { apiKeys as mockApiKeys } from '../lib/api-key-data';
import { apiSettings as mockApiSettings } from '../lib/api-settings-data';
import { auditLogs as mockAuditLogs } from '../lib/audit-log-data';
import { webhooks as mockWebhooks } from '../lib/webhook-data';
import { Collections } from '../lib/constants';

async function testFirestoreConnection() {
  console.log('Testing Firestore connection...');
  try {
    // Attempt a simple read operation. We don't care about the result,
    // only that the request doesn't throw a permissions error.
    await adminDb.collection('__test_connection__').limit(1).get();
    console.log('✅ Firestore connection successful.');
    return true;
  } catch (error) {
    console.error('❌ Firestore connection failed. Please check your service account key and emulator status.');
    console.error('Error details:', error);
    return false;
  }
}

async function seedAuth() {
  console.log('Seeding Firebase Authentication with mock users...');
  
  const userCreationPromises = mockUsers.map(user => {
    return admin.auth().createUser({
      uid: user.id,
      email: user.email,
      password: 'password123', // Standard password for all mock users
      displayName: user.fullName,
      emailVerified: true,
      disabled: false,
    }).catch(error => {
      if (error.code === 'auth/uid-already-exists' || error.code === 'auth/email-already-exists') {
        // This is not an error, just a sign that seeding has run before.
        // console.log(`User with ID/Email ${user.id}/${user.email} already exists. Skipping.`);
        return null; 
      }
      // For other errors, re-throw to fail the seeding process
      console.error(`Error creating user ${user.id}:`, error);
      throw error;
    });
  });

  try {
    await Promise.all(userCreationPromises);
    console.log(`✅ Auth seeding complete. ${mockUsers.length} users processed.`);
  } catch (error) {
    console.error('❌ A critical error occurred during Auth seeding. The script will terminate.');
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

  // Clear the dynamic rate limit collection
  await clearCollection(Collections.API_RATE_LIMITS);

  // Seeding a single document for settings
  console.log('Seeding API settings...');
  try {
    await adminDb.collection('settings').doc('api').set(mockApiSettings);
    console.log('✅ Successfully seeded API settings.');
  } catch (error) {
    console.error('❌ Error seeding API settings:', error);
  }

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
