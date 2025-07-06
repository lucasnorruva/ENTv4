// src/lib/actions/product-workflow-actions.ts
'use server';

import type { Product, User, ComplianceGap, ServiceRecord, CustomsStatus, BlockchainProof } from '@/types';
import { products as mockProducts } from '@/lib/data';
import { users as mockUsers } from '@/lib/user-data';
import { getWebhooks, getProductById } from '@/lib/actions/index';
import { logAuditEvent } from './audit-actions';
import { getUserById } from '../auth';
import { checkPermission, PermissionError } from '../permissions';
import { newId } from './utils';
import { sendWebhook } from '@/services/webhooks';
import {
  hashProductData,
  anchorToPolygon,
} from '@/services/blockchain';
import { createVerifiableCredential } from '@/services/credential';
import { customsInspectionFormSchema, type CustomsInspectionFormValues } from '../schemas';
import { runSubmissionValidation, isChecklistComplete } from '@/services/validation';

// --- Workflow Actions ---

export async function submitForReview(
  productId: string,
  userId: string,
): Promise<Product> {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');

  const product = await getProductById(productId, user.id);
  if (!product) throw new Error('Product not found');

  checkPermission(user, 'product:submit', product);

  const checklist = await runSubmissionValidation(product);
  if (!(await isChecklistComplete(checklist))) {
    throw new Error('Submission checklist is not complete. Please fill in all required fields.');
  }

  const productIndex = mockProducts.findIndex(p => p.id === productId);
  if (productIndex === -1) throw new Error('Product not found');

  mockProducts[productIndex].verificationStatus = 'Pending';
  mockProducts[productIndex].lastUpdated = new Date().toISOString();
  await logAuditEvent('passport.submitted', productId, {}, userId);

  return Promise.resolve(mockProducts[productIndex]);
}

export async function approvePassport(
  productId: string,
  userId: string,
): Promise<Product> {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');

  checkPermission(user, 'product:approve');

  const productIndex = mockProducts.findIndex(p => p.id === productId);
  if (productIndex === -1) throw new Error('Product not found');

  const product = mockProducts[productIndex];
  const productHash = await hashProductData(product);
  // For now, we treat the single hash as the Merkle root of a batch of one.
  const anchorResult = await anchorToPolygon(productHash);
  const verifiableCredential = await createVerifiableCredential(product, user);

  const blockchainProof: BlockchainProof = {
    type: 'SINGLE_HASH',
    ...anchorResult,
    merkleRoot: productHash,
  };

  const updatedProduct = {
    ...product,
    verificationStatus: 'Verified' as const,
    status: 'Published' as const,
    lastVerificationDate: new Date().toISOString(),
    blockchainProof,
    verifiableCredential: JSON.stringify(verifiableCredential, null, 2),
    ebsiVcId: verifiableCredential.id,
  };

  mockProducts[productIndex] = updatedProduct;

  await logAuditEvent(
    'passport.approved',
    productId,
    { txHash: blockchainProof.txHash, vcId: verifiableCredential.id },
    userId,
  );

  const allWebhooks = await getWebhooks();
  const subscribedWebhooks = allWebhooks.filter(
    wh => wh.status === 'active' && wh.events.includes('product.published'),
  );

  if (subscribedWebhooks.length > 0) {
    console.log(
      `Found ${subscribedWebhooks.length} webhook(s) for product.published event.`,
    );
    for (const webhook of subscribedWebhooks) {
      sendWebhook(webhook, 'product.published', updatedProduct);
    }
  }

  return Promise.resolve(updatedProduct);
}

export async function rejectPassport(
  productId: string,
  reason: string,
  gaps: ComplianceGap[],
  userId: string,
): Promise<Product> {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');

  checkPermission(user, 'product:reject');

  const productIndex = mockProducts.findIndex(p => p.id === productId);
  if (productIndex === -1) throw new Error('Product not found');

  mockProducts[productIndex] = {
    ...mockProducts[productIndex],
    verificationStatus: 'Failed',
    lastVerificationDate: new Date().toISOString(),
    sustainability: {
      ...mockProducts[productIndex].sustainability!,
      complianceSummary: reason,
      gaps,
    },
  };

  await logAuditEvent('passport.rejected', productId, { reason }, userId);
  return Promise.resolve(mockProducts[productIndex]);
}

export async function overrideVerification(
    productId: string,
    reason: string,
    userId: string,
  ): Promise<Product> {
    const user = await getUserById(userId);
    if (!user) throw new PermissionError('User not found.');
    checkPermission(user, 'product:override_verification');
  
    const productIndex = mockProducts.findIndex(p => p.id === productId);
    if (productIndex === -1) throw new Error('Product not found');
  
    const now = new Date().toISOString();
  
    const overrideDetails = {
      reason,
      userId,
      date: now,
    };
  
    mockProducts[productIndex] = {
      ...mockProducts[productIndex],
      verificationStatus: 'Verified',
      status: 'Published',
      lastUpdated: now,
      lastVerificationDate: now,
      verificationOverride: overrideDetails,
    };
  
    await logAuditEvent(
      'product.verification.overridden',
      productId,
      { reason },
      userId,
    );
  
    return Promise.resolve(mockProducts[productIndex]);
  }

export async function markAsRecycled(
  productId: string,
  userId: string,
): Promise<Product> {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');

  const product = await getProductById(productId, user.id);
  if (!product) throw new Error('Product not found');

  checkPermission(user, 'product:recycle', product);

  const productIndex = mockProducts.findIndex(p => p.id === productId);
  if (productIndex === -1) throw new Error('Product not found in mock data');

  mockProducts[productIndex].endOfLifeStatus = 'Recycled';
  mockProducts[productIndex].lastUpdated = new Date().toISOString();
  await logAuditEvent('product.recycled', productId, {}, userId);
  
  // Grant circularity credits
  const userIndex = mockUsers.findIndex(u => u.id === userId);
  if(userIndex > -1) {
    const creditsToGrant = 10;
    mockUsers[userIndex].circularityCredits = (mockUsers[userIndex].circularityCredits || 0) + creditsToGrant;
    await logAuditEvent('credits.minted', productId, { amount: creditsToGrant, newBalance: mockUsers[userIndex].circularityCredits, recipient: userId }, 'system');
  }

  return Promise.resolve(mockProducts[productIndex]);
}

export async function resolveComplianceIssue(
  productId: string,
  userId: string,
): Promise<Product> {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');
  checkPermission(user, 'product:resolve');

  const productIndex = mockProducts.findIndex(p => p.id === productId);
  if (productIndex === -1) throw new Error('Product not found');

  mockProducts[productIndex].verificationStatus = 'Not Submitted';
  mockProducts[productIndex].status = 'Draft';
  mockProducts[productIndex].lastUpdated = new Date().toISOString();
  await logAuditEvent('compliance.resolved', productId, {}, userId);

  return Promise.resolve(mockProducts[productIndex]);
}

export async function addServiceRecord(
  productId: string,
  notes: string,
  userId: string,
): Promise<Product> {
  const user = await getUserById(userId);
  if (!user) throw new PermissionError('User not found.');
  checkPermission(user, 'product:add_service_record');

  const productIndex = mockProducts.findIndex(p => p.id === productId);
  if (productIndex === -1) throw new Error('Product not found.');

  const product = mockProducts[productIndex];

  const now = new Date().toISOString();
  const newRecord: ServiceRecord = {
    id: newId('serv'),
    providerId: user.id,
    providerName: user.fullName,
    notes,
    createdAt: now,
    updatedAt: now,
  };

  if (!product.serviceHistory) {
    product.serviceHistory = [];
  }
  product.serviceHistory.push(newRecord);
  product.lastUpdated = now;

  mockProducts[productIndex] = product;

  await logAuditEvent('product.serviced', productId, { notes }, userId);

  return Promise.resolve(product);
}

export async function performCustomsInspection(
  productId: string,
  values: CustomsInspectionFormValues,
  userId: string
): Promise<Product> {
  const user = await getUserById(userId);
  if (!user) throw new PermissionError('User not found.');
  checkPermission(user, 'product:customs_inspect');

  const validatedData = customsInspectionFormSchema.parse(values);

  const productIndex = mockProducts.findIndex(p => p.id === productId);
  if (productIndex === -1) throw new Error('Product not found.');
  const product = mockProducts[productIndex];

  const now = new Date().toISOString();
  const newCustomsEvent: Omit<CustomsStatus, 'history'> = {
    ...validatedData,
    date: now,
  };

  const currentHistory = product.customs?.history || [];
  if (product.customs && product.customs.date) {
    // Add the previous 'latest' event to the history log.
    const previousEvent = { ...product.customs, history: undefined };
    currentHistory.push(previousEvent);
  }

  // Set the new event as the latest status
  product.customs = { ...newCustomsEvent, history: currentHistory };
  product.lastUpdated = now;

  // Update transit stage based on customs status
  if (product.transit) {
    switch (validatedData.status) {
        case 'Cleared':
            product.transit.stage = `Cleared - Inland Transit (${validatedData.location})`;
            break;
        case 'Detained':
            product.transit.stage = `Detained at Customs (${validatedData.location})`;
            break;
        case 'Rejected':
            product.transit.stage = `Shipment Rejected at (${validatedData.location})`;
            break;
    }
  }

  mockProducts[productIndex] = product;

  await logAuditEvent('customs.inspected', productId, { ...newCustomsEvent }, userId);

  return Promise.resolve(mockProducts[productIndex]);
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
    const product = await getProductById(productId, user.id);
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
  const user = await getUserById(userId);
  if (!user) throw new PermissionError('User not found.');

  const submittedIds: string[] = [];
  for (const productId of productIds) {
    try {
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

export async function bulkCreateProducts(
  productsToImport: any[],
  userId: string,
): Promise<{ createdCount: number }> {
  // This function is complex and would require the full saveProduct logic,
  // including company creation, etc. For this mock, we will just log it.
  // The actual implementation is in user-actions.ts for user import.
  const createdCount = productsToImport.length;
  await logAuditEvent(
    'product.bulk_import',
    'multiple',
    { count: createdCount },
    userId,
  );
  return Promise.resolve({ createdCount });
}

export async function bulkArchiveProducts(
  productIds: string[],
  userId: string,
): Promise<void> {
  const user = await getUserById(userId);
  if (!user) throw new PermissionError('User not found.');

  const archivedIds: string[] = [];
  for (const productId of productIds) {
    const product = await getProductById(productId, userId);
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
