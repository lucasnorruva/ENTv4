// src/lib/manufacturing-data.ts
import type { ProductionLine } from '@/types';

const now = new Date();

export let productionLines: ProductionLine[] = [
  {
    id: 'line-001',
    companyId: 'comp-eco',
    name: 'Assembly Line Alpha',
    location: 'Eco-Factory 1, Germany',
    status: 'Active',
    outputPerHour: 100,
    currentProduct: 'Eco-Friendly Smart Watch Series 5',
    productId: 'pp-001',
    lastMaintenance: new Date(new Date(now).setDate(now.getDate() - 15)).toISOString(),
    createdAt: new Date(new Date(now).setMonth(now.getMonth() - 6)).toISOString(),
    updatedAt: new Date(new Date(now).setHours(now.getHours() - 2)).toISOString(),
  },
  {
    id: 'line-002',
    companyId: 'comp-eco',
    name: 'Drone Assembly Delta',
    location: 'Aero Plant 1, USA',
    status: 'Maintenance',
    outputPerHour: 50,
    currentProduct: 'Pro-Grade 4K Drone',
    productId: 'pp-005',
    lastMaintenance: new Date(new Date(now).setDate(now.getDate() - 1)).toISOString(),
    createdAt: new Date(new Date(now).setMonth(now.getMonth() - 4)).toISOString(),
    updatedAt: new Date(new Date(now).setDate(now.getDate() - 1)).toISOString(),
  },
  {
    id: 'line-003',
    companyId: 'comp-thread',
    name: 'Textile Line Gamma',
    location: 'Sustainable Threads Mill, India',
    status: 'Idle',
    outputPerHour: 500,
    currentProduct: 'Organic Cotton T-Shirt',
    productId: 'pp-003',
    lastMaintenance: new Date(new Date(now).setDate(now.getDate() - 45)).toISOString(),
    createdAt: new Date(new Date(now).setMonth(now.getMonth() - 2)).toISOString(),
    updatedAt: new Date(new Date(now).setHours(now.getHours() - 12)).toISOString(),
  },
  {
    id: 'line-004',
    companyId: 'comp-buildright',
    name: 'Concrete Mixer 1',
    location: 'Heidelberg Plant, Germany',
    status: 'Active',
    outputPerHour: 1000,
    currentProduct: 'Eco-Crete Concrete Mix',
    productId: 'pp-008',
    lastMaintenance: new Date(new Date(now).setDate(now.getDate() - 5)).toISOString(),
    createdAt: new Date(new Date(now).setMonth(now.getMonth() - 8)).toISOString(),
    updatedAt: new Date(new Date(now).setHours(now.getHours() - 8)).toISOString(),
  },
];
