// src/lib/service-ticket-data.ts
import type { ServiceTicket } from '@/types';

const now = new Date();

export let serviceTickets: ServiceTicket[] = [
  {
    id: 'tkt-001',
    productId: 'pp-001',
    userId: 'user-service',
    customerName: 'John Customer',
    issue: 'The watch screen is flickering after the latest update. Resetting did not solve the issue.',
    status: 'Open',
    imageUrl: 'https://placehold.co/600x400.png',
    createdAt: new Date(new Date(now).setDate(now.getDate() - 1)).toISOString(),
    updatedAt: new Date(new Date(now).setDate(now.getDate() - 1)).toISOString(),
  },
  {
    id: 'tkt-002',
    productId: 'pp-002',
    userId: 'user-service',
    customerName: 'Jane Smith',
    issue: 'One of the drone propellers seems to be unbalanced, causing unstable flight.',
    status: 'In Progress',
    createdAt: new Date(new Date(now).setDate(now.getDate() - 3)).toISOString(),
    updatedAt: new Date(new Date(now).setDate(now.getDate() - 2)).toISOString(),
  },
  {
    id: 'tkt-003',
    productId: 'pp-005',
    userId: 'user-service',
    customerName: 'Bob Johnson',
    issue: 'A screw was missing from the shelving unit assembly kit.',
    status: 'Closed',
    createdAt: new Date(new Date(now).setDate(now.getDate() - 10)).toISOString(),
    updatedAt: new Date(new Date(now).setDate(now.getDate() - 8)).toISOString(),
  },
];
