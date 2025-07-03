// src/lib/actions/manufacturing-actions.ts
'use server';

import type { ProductionLine } from '@/types';
import {
  productionLineFormSchema,
  type ProductionLineFormValues,
} from '@/lib/schemas';
import { productionLines as mockProductionLines } from '@/lib/manufacturing-data';
import { getUserById } from '@/lib/auth';
import { checkPermission } from '@/lib/permissions';
import { logAuditEvent } from './audit-actions';
import { getProductById } from './product-actions';
import { newId } from './utils';

export async function getProductionLines(): Promise<ProductionLine[]> {
  return Promise.resolve(mockProductionLines);
}

export async function saveProductionLine(
  values: ProductionLineFormValues,
  userId: string,
  lineId?: string,
): Promise<ProductionLine> {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');
  checkPermission(user, 'manufacturer:manage_lines');

  const validatedData = productionLineFormSchema.parse(values);
  const now = new Date().toISOString();
  let savedLine: ProductionLine;

  const product = validatedData.productId
    ? await getProductById(validatedData.productId, user.id)
    : null;

  const lineData = {
    name: validatedData.name,
    location: validatedData.location,
    status: validatedData.status,
    outputPerHour: Number(validatedData.outputPerHour),
    productId: validatedData.productId,
    currentProduct: product ? product.productName : 'None',
    updatedAt: now,
  };

  if (lineId) {
    const lineIndex = mockProductionLines.findIndex(l => l.id === lineId);
    if (lineIndex === -1) throw new Error('Line not found');
    savedLine = {
      ...mockProductionLines[lineIndex],
      ...lineData,
    };
    mockProductionLines[lineIndex] = savedLine;
    await logAuditEvent('production_line.updated', lineId, {}, userId);
  } else {
    savedLine = {
      id: newId('line'),
      ...lineData,
      lastMaintenance: now,
      createdAt: now,
    };
    mockProductionLines.push(savedLine);
    await logAuditEvent('production_line.created', savedLine.id, {}, userId);
  }
  return Promise.resolve(savedLine);
}

export async function deleteProductionLine(
  lineId: string,
  userId: string,
): Promise<void> {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');
  checkPermission(user, 'manufacturer:manage_lines');

  const index = mockProductionLines.findIndex(l => l.id === lineId);
  if (index > -1) {
    mockProductionLines.splice(index, 1);
    await logAuditEvent('production_line.deleted', lineId, {}, userId);
  }
  return Promise.resolve();
}
