// src/lib/service-ticket-data.ts
import type { ServiceTicket } from '@/types';

const now = new Date();

export let serviceTickets: ServiceTicket[] = [
  {
    id: 'tkt-001',
    productId: 'pp-001',
    userId: 'user-service',
    customerName: 'John Customer',
    issue:
      'The watch screen is flickering after the latest update. Resetting did not solve the issue.',
    status: 'Open',
    imageUrl: 'https://placehold.co/600x400.png',
    createdAt: new Date(new Date(now).setHours(now.getHours() - 5)).toISOString(),
    updatedAt: new Date(new Date(now).setHours(now.getHours() - 5)).toISOString(),
  },
  {
    id: 'tkt-002',
    productId: 'pp-003',
    userId: 'user-service',
    customerName: 'Jane Smith',
    issue: 'The stitching on the handbag strap is coming loose after one week of use.',
    status: 'In Progress',
    createdAt: new Date(new Date(now).setDate(now.getDate() - 2)).toISOString(),
    updatedAt: new Date(new Date(now).setDate(now.getDate() - 1)).toISOString(),
  },
  {
    id: 'tkt-003',
    productionLineId: 'line-002',
    userId: 'user-admin',
    customerName: 'Factory Floor Manager',
    issue: 'The conveyor belt on Assembly Line Delta is making a loud grinding noise and needs immediate inspection.',
    status: 'Open',
    createdAt: new Date(new Date(now).setHours(now.getHours() - 1)).toISOString(),
    updatedAt: new Date(new Date(now).setHours(now.getHours() - 1)).toISOString(),
  },
  {
    id: 'tkt-004',
    productId: 'pp-008',
    userId: 'user-service',
    customerName: 'Construction Site Lead',
    issue: 'Eco-Crete mix is not setting as expected in humid conditions. Requesting technical support.',
    status: 'Closed',
    createdAt: new Date(new Date(now).setDate(now.getDate() - 10)).toISOString(),
    updatedAt: new Date(new Date(now).setDate(now.getDate() - 8)).toISOString(),
  },
];
