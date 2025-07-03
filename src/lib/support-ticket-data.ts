// src/lib/support-ticket-data.ts
import type { SupportTicket } from '@/types';

const now = new Date();

export let supportTickets: SupportTicket[] = [
  {
    id: 'spt-001',
    name: 'Supplier User',
    email: 'supplier@norruva.com',
    subject: 'Question about RoHS compliance',
    message:
      'I am having trouble finding where to upload my RoHS declaration of conformity. Can you please point me in the right direction?',
    status: 'Open',
    userId: 'user-supplier',
    createdAt: new Date(
      new Date(now).setDate(now.getDate() - 1),
    ).toISOString(),
    updatedAt: new Date(
      new Date(now).setDate(now.getDate() - 1),
    ).toISOString(),
  },
  {
    id: 'spt-002',
    name: 'Developer User',
    email: 'developer@norruva.com',
    subject: 'API Rate Limit Question',
    message: 'What are the current rate limits for the Pro plan? The documentation seems to be out of date. Thanks!',
    status: 'Closed',
    userId: 'user-developer',
    createdAt: new Date(
      new Date(now).setDate(now.getDate() - 3),
    ).toISOString(),
    updatedAt: new Date(
      new Date(now).setDate(now.getDate() - 2),
    ).toISOString(),
  },
];
