// src/lib/actions/product-actions.ts
'use server';

import type {
  Product,
  User,
  SustainabilityData,
  ServiceRecord,
  ZkProof,
} from '@/types';
import {
  type ProductFormValues,
  type CustodyStepFormValues,
  type OwnershipTransferFormValues,
} from '@/lib/schemas';
import { getUserById } from '@/lib/auth';
import { checkPermission, PermissionError } from '@/lib/permissions';
import { logAuditEvent } from './audit-actions';
import { products as mockProducts } from '@/lib/data';
import { generateZkProof } from '@/services/zkp-service';

// --- Re-export workflow actions ---
export * from './product-workflow-actions';

// --- Single Product Actions ---

export async function addCustodyStep(
  productId: string,
  values: CustodyStepFormValues,
  userId: string,
): Promise<Product> {
  const user = await getUserById(userId);
  if (!user) throw new PermissionError('User not found.');
  checkPermission(user, 'product:edit'); // Generic edit permission for this mock

  const productIndex = mockProducts.findIndex(p => p.id === productId);
  if (productIndex === -1) throw new Error('Product not found');

  const product = mockProducts[productIndex];
  if (!product.chainOfCustody) {
    product.chainOfCustody = [];
  }
  const newStep = { ...values, date: new Date().toISOString() };
  product.chainOfCustody.unshift(newStep);
  await logAuditEvent('product.custody.updated', productId, { newStep }, userId);
  return product;
}

export async function transferOwnership(
  productId: string,
  values: OwnershipTransferFormValues,
  userId: string,
): Promise<Product> {
  const user = await getUserById(userId);
  if (!user) throw new PermissionError('User not found.');
  checkPermission(user, 'product:edit');

  const productIndex = mockProducts.findIndex(p => p.id === productId);
  if (productIndex === -1) throw new Error('Product not found');

  const product = mockProducts[productIndex];
  if (!product.ownershipNft)
    throw new Error('Product does not have an ownership NFT.');
  
  product.ownershipNft.ownerAddress = values.newOwnerAddress;
  await logAuditEvent(
    'product.ownership.transferred',
    productId,
    { newOwner: values.newOwnerAddress },
    userId,
  );
  return product;
}

// --- Bulk Actions ---

export async function bulkDeleteProducts(
  productIds: string[],
  userId: string,
): Promise<void> {
  const user = await getUserById(userId);
  if (!user) throw new PermissionError('User not found.');

  const deletedIds: string[] = [];
  for (const productId of productIds) {
    const product = mockProducts.find(p => p.id === productId);
    if (!product) continue;

    try {
      checkPermission(user, 'product:delete', product);
      const index = mockProducts.findIndex(p => p.id === productId);
      if (index > -1) {
        mockProducts.splice(index, 1);
        deletedIds.push(productId);
      }
    } catch (error) {
      console.warn(
        `Could not delete product ${productId}: ${(error as Error).message}`,
      );
    }
  }

  if (deletedIds.length > 0) {
    await logAuditEvent(
      'product.bulk_delete',
      'multiple',
      { count: deletedIds.length, productIds: deletedIds },
      userId,
    );
  }
}

export async function bulkSubmitForReview(
  productIds: string[],
  userId: string,
): Promise<void> {
  const { submitForReview } = await import('./product-workflow-actions');
  const user = await getUserById(userId);
  if (!user) throw new PermissionError('User not found.');

  const submittedIds: string[] = [];
  for (const productId of productIds) {
    try {
      // Re-uses the single-submit logic and its permission checks
      await submitForReview(productId, userId);
      submittedIds.push(productId);
    } catch (error) {
      console.warn(
        `Could not submit product ${productId} for review: ${
          (error as Error).message
        }`,
      );
    }
  }

  if (submittedIds.length > 0) {
    await logAuditEvent(
      'product.bulk_submit',
      'multiple',
      { count: submittedIds.length, productIds: submittedIds },
      userId,
    );
  }
}

export async function bulkArchiveProducts(
  productIds: string[],
  userId: string,
): Promise<void> {
  const user = await getUserById(userId);
  if (!user) throw new PermissionError('User not found.');

  const archivedIds: string[] = [];
  for (const productId of productIds) {
    const product = mockProducts.find(p => p.id === productId);
    if (!product) continue;

    try {
      checkPermission(user, 'product:archive', product);
      const index = mockProducts.findIndex(p => p.id === productId);
      if (index > -1) {
        mockProducts[index].status = 'Archived';
        mockProducts[index].lastUpdated = new Date().toISOString();
        archivedIds.push(productId);
      }
    } catch (error) {
      console.warn(
        `Could not archive product ${productId}: ${(error as Error).message}`,
      );
    }
  }

  if (archivedIds.length > 0) {
    await logAuditEvent(
      'product.bulk_archive',
      'multiple',
      { count: archivedIds.length, productIds: archivedIds },
      userId,
    );
  }
}
