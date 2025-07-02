// src/lib/company-data.ts
import type { Company } from '@/types';

export let companies: Company[] = [
  {
    id: 'comp-01',
    name: 'Norruva Corp',
    ownerId: 'user-admin',
    industry: 'Technology',
    createdAt: '2024-07-01T10:00:00Z',
    updatedAt: '2024-07-20T10:00:00Z',
  },
  {
    id: 'comp-02',
    name: 'GreenTech Supplies',
    ownerId: 'user-supplier',
    industry: 'Electronics',
    createdAt: '2024-07-02T11:00:00Z',
    updatedAt: '2024-07-19T11:00:00Z',
  },
  {
    id: 'comp-03',
    name: 'AeroDynamics Inc.',
    ownerId: 'user-manufacturer',
    industry: 'Manufacturing',
    createdAt: '2024-07-05T14:00:00Z',
    updatedAt: '2024-07-16T14:00:00Z',
  },
  {
    id: 'comp-04',
    name: 'Global Repair Services',
    ownerId: 'user-service',
    industry: 'Services',
    createdAt: '2024-07-06T15:00:00Z',
    updatedAt: '2024-07-15T15:00:00Z',
  },
  {
    id: 'comp-05',
    name: 'Circular Economy Recyclers',
    ownerId: 'user-recycler',
    industry: 'Waste Management',
    createdAt: '2024-07-07T16:00:00Z',
    updatedAt: '2024-07-14T16:00:00Z',
  },
];
