// src/lib/actions/product-actions.ts
'use server';

import type {
  Product,
  User,
  ComplianceGap,
  ProductFormValues,
  CustodyStepFormValues,
  OwnershipTransferFormValues,
  BulkProductImportValues,
  ServiceRecord,
  CustomsInspectionFormValues,
} from '@/types';
import { productFormSchema } from '@/lib/schemas';
import { getUserById } from '@/lib/auth';
import { checkPermission, PermissionError } from '@/lib/permissions';
import { logAuditEvent } from './audit-actions';
import { products as mockProducts } from '@/lib/data';
import { users as mockUsers } from '@/lib/user-data';
import { newId } from './utils';
import { createVerifiableCredential } from '@/services/credential';
import { getCompanyById } from '../auth';
import {
  generateComplianceProof,
  verifyComplianceProof,
} from '@/services/zkp-service';
import { anchorToPolygon } from '@/services/blockchain';

// --- Data Access Functions ---

export async function getProducts(
  userId?: string,
  filters?: {
    searchQuery?: string;
    category?: string;
    verificationStatus?: string;
  },
): Promise<Product[]> {
  let user: User | undefined;
  if (userId) {
    user = await getUserById(userId);
  }

  let results = [...mockProducts];

  if (
    !user ||
    (!user.roles.includes('Admin') && !user.roles.includes('Auditor') && !user.roles.includes('Compliance Manager') && !user.roles.includes('Retailer'))
  ) {
    const userCompanyId = user?.companyId;
    results = results.filter(
      p => p.status === 'Published' || p.companyId === userCompanyId,
    );
  }

  if (filters) {
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      results = results.filter(
        p =>
          p.productName.toLowerCase().includes(q) ||
          p.supplier.toLowerCase().includes(q) ||
          p.gtin?.toLowerCase().includes(q),
      );
    }
    if (filters.category) {
      results = results.filter(p => p.category === filters.category);
    }
    if (filters.verificationStatus) {
      results = results.filter(
        p =>
          (p.verificationStatus || 'Not Submitted') ===
          filters.verificationStatus,
      );
    }
  }
  return Promise.resolve(results);
}

export async function getProductById(
  id: string,
  userId?: string,
): Promise<Product | undefined> {
  const product = mockProducts.find(p => p.id === id);
  if (!product) return undefined;

  // Allow access if product is published
  if (product.status === 'Published') {
    return product;
  }
  
  // For non-published products, require authentication and authorization
  if (userId) {
    const user = await getUserById(userId);
    if (!user) return undefined;
    // Admins and users from the same company can view non-published products
    if (user.roles.includes('Admin') || user.companyId === product.companyId) {
      return product;
    }
  }
  
  // Deny access by default if not published and no valid user session
  return undefined;
}

export async function getProductByGtin(
  gtin: string,
  userId?: string,
): Promise<Product | undefined> {
  return mockProducts.find(p => p.gtin === gtin);
}

// --- Workflow Actions ---

export async function processProductAi(
  product: Product,
): Promise<
  Pick<Product, 'sustainability' | 'qrLabelText' | 'dataQualityWarnings'> // KEEP THIS TYPE FOR NOW
> {
  // This function is currently not called due to architectural refactoring to fix build issues.
  // In a real implementation with background functions, this would be safe to call.
  // For now, we return mock/empty data to allow the rest of the app to function.
  console.warn(
    'AI processing is currently disabled in this mock environment to prevent build hangs.',
  );
  return {
    sustainability: product.sustainability,
    qrLabelText: product.qrLabelText,
    dataQualityWarnings: product.dataQualityWarnings,
  };
}

export async function saveProduct(
  values: ProductFormValues,
  userId: string,
  productId?: string,
): Promise<Product> {
  const validatedData = productFormSchema.parse(values);
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');

  const now = new Date().toISOString();
  let savedProduct: Product;
  const oldProductData = productId
    ? mockProducts.find(p => p.id === productId)
    : null;

  if (productId) {
    if (!oldProductData) throw new Error('Product not found');
    checkPermission(user, 'product:edit', oldProductData);
    const productIndex = mockProducts.findIndex(p => p.id === productId);
    savedProduct = {
      ...mockProducts[productIndex],
      ...validatedData,
      companyId: user.companyId,
      supplier: (await getCompanyById(user.companyId))?.name || 'Unknown',
      lastUpdated: now,
      updatedAt: now,
    };
    mockProducts[productIndex] = savedProduct;
    await logAuditEvent('product.updated', productId, {}, userId);
  } else {
    checkPermission(user, 'product:create');
    savedProduct = {
      id: newId('pp'),
      ...validatedData,
      companyId: user.companyId,
      supplier: (await getCompanyById(user.companyId))?.name || 'Unknown',
      createdAt: now,
      updatedAt: now,
      lastUpdated: now,
      materials: validatedData.materials || [],
      verificationStatus: 'Not Submitted',
      endOfLifeStatus: 'Active',
    };
    mockProducts.unshift(savedProduct);
    await logAuditEvent('product.created', savedProduct.id, {}, userId);
  }

  // NOTE: The call to the onProductChange trigger has been removed
  // to break a circular dependency that was causing the build to fail.
  // This functionality can be restored later using a more robust architecture,
  // like a pub/sub event queue or by refactoring the action dependencies.

  return Promise.resolve(savedProduct);
}

export async function deleteProduct(
  productId: string,
  userId: string,
): Promise<void> {
  const user = await getUserById(userId);
  if (!user) throw new PermissionError('User not found.');

  const productIndex = mockProducts.findIndex(p => p.id === productId);
  if (productIndex === -1) throw new Error('Product not found.');

  checkPermission(user, 'product:delete', mockProducts[productIndex]);

  mockProducts.splice(productIndex, 1);
  await logAuditEvent('product.deleted', productId, {}, userId);
  return Promise.resolve();
}

export async function submitForReview(
  productId: string,
  userId: string,
): Promise<Product> {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');
  const productIndex = mockProducts.findIndex(p => p.id === productId);
  if (productIndex === -1) throw new Error('Product not found');

  const product = mockProducts[productIndex];
  checkPermission(user, 'product:submit', product);

  product.verificationStatus = 'Pending';
  product.updatedAt = new Date().toISOString();
  product.lastUpdated = new Date().toISOString();
  await logAuditEvent('passport.submitted', productId, {}, userId);
  return product;
}

export async function approvePassport(
  productId: string,
  userId: string,
): Promise<Product> {
  const user =
    await getUserById(userId);
  if (!user && userId !== 'system' && !userId.startsWith('system:'))
    throw new Error('User not found');
  if (user) checkPermission(user, 'product:approve');

  const productIndex = mockProducts.findIndex(p => p.id === productId);
  if (productIndex === -1) throw new Error('Product not found');

  const product = mockProducts[productIndex];

  // Set isMinting to true before starting the async anchoring process
  product.isMinting = true;
  await logAuditEvent('passport.approved', productId, {}, userId);

  // Don't wait for this to finish, let it run in the background
  anchorProductOnChain(productId, userId).catch(console.error);

  return product;
}

export async function anchorProductOnChain(
  productId: string,
  userId: string,
): Promise<Product> {
  const productIndex = mockProducts.findIndex(p => p.id === productId);
  if (productIndex === -1) throw new Error('Product not found');

  const product = mockProducts[productIndex];
  const company = await getCompanyById(product.companyId);
  if (!company) throw new Error('Company not found');

  const now = new Date().toISOString();

  // Create the VC first
  const vc = await createVerifiableCredential(product, company);
  const vcString = JSON.stringify(vc);

  // Hash the VC string
  const hash = await hashData(vcString);

  // Anchor the hash
  const blockchainProof = await anchorToPolygon(hash);

  // Update the product document
  product.verifiableCredential = vcString;
  product.verificationStatus = 'Verified';
  product.lastVerificationDate = now;
  product.lastUpdated = now;
  product.blockchainProof = {
    type: 'SINGLE_HASH',
    chain: 'Polygon',
    ...blockchainProof,
  };
  product.status = 'Published';
  product.isMinting = false;

  await logAuditEvent(
    'product.anchored',
    productId,
    { txHash: blockchainProof.txHash },
    userId,
  );
  return product;
}

export async function bulkAnchorProducts(
  productIds: string[],
  userId: string,
): Promise<void> {
  const user = await getUserById(userId);
  if (!user) throw new PermissionError('User not found.');

  checkPermission(user, 'product:approve'); // Use approve permission for bulk minting

  await logAuditEvent(
    'product.bulk_anchor.started',
    'multiple',
    { count: productIds.length },
    userId,
  );

  // Set isMinting for all selected products immediately
  productIds.forEach(productId => {
    const productIndex = mockProducts.findIndex(p => p.id === productId);
    if (productIndex !== -1) {
      mockProducts[productIndex].isMinting = true;
    }
  });

  // We are not waiting for the result, just firing off the requests
  for (const productId of productIds) {
    anchorProductOnChain(productId, userId).catch(error => {
      console.error(`Failed to anchor product ${productId}:`, error);
      logAuditEvent(
        'product.bulk_anchor.failed_item',
        productId,
        { error: (error as Error).message },
        userId,
      );
    });
  }
}

export async function rejectPassport(
  productId: string,
  reason: string,
  gaps: ComplianceGap[],
  userId: string,
): Promise<Product> {
  const user =
    await getUserById(userId);
  if (!user && userId !== 'system' && !userId.startsWith('system:'))
    throw new Error('User not found');
  if (user) checkPermission(user, 'product:reject');

  const productIndex = mockProducts.findIndex(p => p.id === productId);
  if (productIndex === -1) throw new Error('Product not found');
  const product = mockProducts[productIndex];

  const now = new Date().toISOString();
  product.verificationStatus = 'Failed';
  product.lastVerificationDate = now;
  product.lastUpdated = now;
  if (product.sustainability) {
    product.sustainability.complianceSummary = reason;
    product.sustainability.gaps = gaps;
  }
  await logAuditEvent('passport.rejected', productId, { reason, gaps }, userId);
  return product;
}

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
  await logAuditEvent(
    'product.custody.updated',
    productId,
    { newStep },
    userId,
  );
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

export async function generateZkProofForProduct(
  productId: string,
  userId: string,
): Promise<Product> {
  const user = await getUserById(userId);
  if (!user) throw new PermissionError('User not found.');
  const product = await getProductById(productId, user.id);
  if (!product) throw new Error('Product not found');
  checkPermission(user, 'product:generate_zkp');

  const proof = await generateComplianceProof(product);
  const productIndex = mockProducts.findIndex(p => p.id === productId);
  if (productIndex === -1) throw new Error('Product not found in mock data');
  mockProducts[productIndex].zkProof = proof;

  await logAuditEvent('product.zkp.generated', productId, {}, userId);
  return mockProducts[productIndex];
}

export async function verifyZkProofForProduct(
  productId: string,
  userId: string,
): Promise<Product> {
  const user = await getUserById(userId);
  if (!user) throw new PermissionError('User not found.');
  const product = await getProductById(productId, user.id);
  if (!product || !product.zkProof)
    throw new Error('Product or ZK Proof not found');
  checkPermission(user, 'product:generate_zkp'); // Same permission for verify

  const isVerified = await verifyComplianceProof(product.zkProof);
  if (!isVerified) {
    throw new Error('ZKP verification failed.');
  }

  const productIndex = mockProducts.findIndex(p => p.id === productId);
  if (productIndex === -1) throw new Error('Product not found in mock data');
  mockProducts[productIndex].zkProof!.isVerified = true;
  mockProducts[productIndex].zkProof!.verifiedAt = new Date().toISOString();

  await logAuditEvent('product.zkp.verified', productId, {}, userId);
  return mockProducts[productIndex];
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

export async function markAsRecycled(
  productId: string,
  userId: string,
): Promise<Product> {
  const userIndex = mockUsers.findIndex(u => u.id === userId);
  if (userIndex === -1) throw new PermissionError('User not found.');
  const user = mockUsers[userIndex];

  const productIndex = mockProducts.findIndex(p => p.id === productId);
  if (productIndex === -1) throw new Error('Product not found.');
  const product = mockProducts[productIndex];

  checkPermission(user, 'product:recycle', product);

  product.endOfLifeStatus = 'Recycled';
  product.lastUpdated = new Date().toISOString();

  // Award credits
  const creditsAwarded = 10;
  user.circularityCredits = (user.circularityCredits || 0) + creditsAwarded;

  await logAuditEvent('product.recycled', productId, {}, userId);
  await logAuditEvent(
    'credits.minted',
    productId,
    { amount: creditsAwarded, recipient: userId },
    userId,
  );

  return product;
}

export async function resolveComplianceIssue(
  productId: string,
  userId: string,
): Promise<Product> {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');
  const productIndex = mockProducts.findIndex(p => p.id === productId);
  if (productIndex === -1) throw new Error('Product not found');
  const product = mockProducts[productIndex];
  checkPermission(user, 'product:resolve', product);

  product.verificationStatus = 'Not Submitted';
  product.status = 'Draft';
  product.lastUpdated = new Date().toISOString();
  await logAuditEvent('compliance.resolved', productId, {}, userId);
  return product;
}

export async function overrideVerification(
  productId: string,
  reason: string,
  userId: string,
): Promise<Product> {
  const user = await getUserById(userId);
  if (!user) throw new PermissionError('User not found.');
  const productIndex = mockProducts.findIndex(p => p.id === productId);
  if (productIndex === -1) throw new Error('Product not found');

  const product = mockProducts[productIndex];
  checkPermission(user, 'product:override_verification', product);

  product.verificationStatus = 'Verified';
  product.verificationOverride = {
    userId,
    reason,
    date: new Date().toISOString(),
  };
  product.lastUpdated = new Date().toISOString();

  await logAuditEvent(
    'product.verification.overridden',
    productId,
    { reason },
    userId,
  );
  return product;
}

export async function performCustomsInspection(
  productId: string,
  values: CustomsInspectionFormValues,
  userId: string,
): Promise<Product> {
  const user = await getUserById(userId);
  if (!user) throw new PermissionError('User not found.');
  const productIndex = mockProducts.findIndex(p => p.id === productId);
  if (productIndex === -1) throw new Error('Product not found.');

  const product = mockProducts[productIndex];
  checkPermission(user, 'product:customs_inspect', product);

  const newEvent = { ...values, date: new Date().toISOString() };

  if (!product.customs) {
    product.customs = { ...newEvent, history: [] };
  } else {
    product.customs = {
      ...newEvent,
      history: [...(product.customs.history || []), newEvent],
    };
  }

  await logAuditEvent(
    'customs.inspected',
    productId,
    { status: values.status, location: values.location },
    userId,
  );

  return product;
}

export async function bulkCreateProducts(
  productsToImport: BulkProductImportValues[],
  userId: string,
): Promise<{ createdCount: number }> {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');
  checkPermission(user, 'product:create');

  let createdCount = 0;
  for (const productData of productsToImport) {
    const values: ProductFormValues = {
      ...productData,
      status: 'Draft',
    };
    await saveProduct(values, userId);
    createdCount++;
  }

  await logAuditEvent(
    'product.bulk_import',
    'multiple',
    { count: createdCount },
    userId,
  );

  return { createdCount };
}

export async function addServiceRecord(
  productId: string,
  notes: string,
  userId: string,
): Promise<Product> {
  const user = await getUserById(userId);
  if (!user) throw new PermissionError('User not found.');

  const productIndex = mockProducts.findIndex(p => p.id === productId);
  if (productIndex === -1) throw new Error('Product not found.');

  const product = mockProducts[productIndex];
  checkPermission(user, 'product:add_service_record', product);

  const newRecord: ServiceRecord = {
    id: newId('serv'),
    providerId: userId,
    providerName: user.fullName,
    notes,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (!product.serviceHistory) {
    product.serviceHistory = [];
  }
  product.serviceHistory.push(newRecord);
  product.lastUpdated = new Date().toISOString();

  mockProducts[productIndex] = product;

  await logAuditEvent('product.serviced', productId, { notes }, userId);

  return Promise.resolve(product);
}

// Internal helper for hashing
async function hashData(data: object | string): Promise<string> {
  const dataString = typeof data === 'string' ? data : JSON.stringify(data, Object.keys(data).sort());
  return createHash('sha256').update(dataString).digest('hex');
}
