// src/lib/user-data.ts
import type { User } from '@/types';
import { UserRoles } from './constants';

// This file now contains only mock data for development and testing.
// In production, this data would come from your authentication provider and Firestore.
export let users: User[] = [
  {
    id: 'user-admin',
    fullName: 'Admin User',
    email: 'admin@norruva.com',
    companyId: 'comp-01',
    roles: [UserRoles.ADMIN],
    createdAt: '2024-07-01T10:00:00Z',
    updatedAt: '2024-07-20T10:00:00Z',
    readNotificationIds: ['log-api-001', 'log-api-002', 'log-003'],
  },
  {
    id: 'user-supplier',
    fullName: 'Supplier User',
    email: 'supplier@norruva.com',
    companyId: 'comp-02',
    roles: [UserRoles.SUPPLIER],
    createdAt: '2024-07-02T11:00:00Z',
    updatedAt: '2024-07-19T11:00:00Z',
    readNotificationIds: [],
  },
  {
    id: 'user-auditor',
    fullName: 'Auditor User',
    email: 'auditor@norruva.com',
    companyId: 'comp-01',
    roles: [UserRoles.AUDITOR],
    createdAt: '2024-07-03T12:00:00Z',
    updatedAt: '2024-07-18T12:00:00Z',
    readNotificationIds: [],
  },
  {
    id: 'user-compliance',
    fullName: 'Compliance Manager',
    email: 'compliance@norruva.com',
    companyId: 'comp-01',
    roles: [UserRoles.COMPLIANCE_MANAGER],
    createdAt: '2024-07-04T13:00:00Z',
    updatedAt: '2024-07-17T13:00:00Z',
    readNotificationIds: [],
  },
  {
    id: 'user-manufacturer',
    fullName: 'Manufacturer User',
    email: 'manufacturer@norruva.com',
    companyId: 'comp-03',
    roles: [UserRoles.MANUFACTURER],
    createdAt: '2024-07-05T14:00:00Z',
    updatedAt: '2024-07-16T14:00:00Z',
    readNotificationIds: [],
  },
  {
    id: 'user-service',
    fullName: 'Service Provider',
    email: 'service@norruva.com',
    companyId: 'comp-04',
    roles: [UserRoles.SERVICE_PROVIDER],
    createdAt: '2024-07-06T15:00:00Z',
    updatedAt: '2024-07-15T15:00:00Z',
    readNotificationIds: [],
  },
  {
    id: 'user-recycler',
    fullName: 'Recycler User',
    email: 'recycler@norruva.com',
    companyId: 'comp-05',
    roles: [UserRoles.RECYCLER],
    createdAt: '2024-07-07T16:00:00Z',
    updatedAt: '2024-07-14T16:00:00Z',
    readNotificationIds: [],
  },
  {
    id: 'user-developer',
    fullName: 'Developer User',
    email: 'developer@norruva.com',
    companyId: 'comp-01',
    roles: [UserRoles.DEVELOPER],
    createdAt: '2024-07-08T17:00:00Z',
    updatedAt: '2024-07-13T17:00:00Z',
    readNotificationIds: [],
  },
  {
    id: 'user-analyst',
    fullName: 'Business Analyst',
    email: 'analyst@norruva.com',
    companyId: 'comp-01',
    roles: [UserRoles.BUSINESS_ANALYST],
    createdAt: '2024-07-09T18:00:00Z',
    updatedAt: '2024-07-12T18:00:00Z',
    readNotificationIds: [],
  },
];
// Rename this to data-seed.ts and use it in a seeding script
// instead of importing it directly into the application.
// This ensures that the application uses a real database in production.
//
// For example:
//
// // scripts/seed.ts
// import { db } from '@/lib/firebase-admin';
// import { products } from '@/lib/data-seed';
//
// async function seedDatabase() {
//   const collectionRef = db.collection('products');
//   for (const product of products) {
//     await collectionRef.doc(product.id).set(product);
//   }
//   console.log('Database seeded successfully!');
// }
//
// seedDatabase();
