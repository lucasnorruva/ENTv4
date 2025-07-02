// src/lib/actions.ts
'use server';

import type {
  Product,
  ComplianceGap,
  Company,
  AuditLog,
  User,
  ApiKey,
  ApiSettings,
  CompliancePath,
  ServiceTicket,
  ProductionLine,
  Webhook,
} from './types';
import {
  productFormSchema,
  type ProductFormValues,
  userFormSchema,
  UserFormValues,
  companyFormSchema,
  CompanyFormValues,
  compliancePathFormSchema,
  CompliancePathFormValues,
  apiSettingsSchema,
  ApiSettingsFormValues,
  serviceTicketFormSchema,
  ServiceTicketFormValues,
  webhookFormSchema,
  WebhookFormValues,
  productionLineFormSchema,
  ProductionLineFormValues,
  apiKeyFormSchema,
  ApiKeyFormValues,
  bulkProductImportSchema,
  type BulkProductImportValues,
  onboardingFormSchema,
  type OnboardingFormValues,
} from './schemas';
import {
  anchorToPolygon,
  generateEbsiCredential,
  hashProductData,
} from '@/services/blockchain';
import { suggestImprovements as suggestImprovementsFlow } from '@/ai/flows/enhance-passport-information';
import { generateProductImage } from '@/ai/flows/generate-product-image';
import { generateConformityDeclaration as generateConformityDeclarationFlow } from '@/ai/flows/generate-conformity-declaration';
import { analyzeBillOfMaterials as analyzeBillOfMaterialsFlow } from '@/ai/flows/analyze-bom';
import { Collections, UserRoles, type Role } from './constants';
import {
  getUserById,
  getCompanyById,
  getUsers,
  getUsersByCompanyId,
  getUserByEmail as authGetUserByEmail,
} from './auth';
import { hasRole } from './auth-utils';
import { sendWebhook } from '@/services/webhooks';
import type { AiProduct } from './ai/schemas';
import { checkPermission, PermissionError } from './permissions';
import { adminAuth, adminDb } from './firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

/**
 * Helper to convert a Firestore document snapshot into our typed object.
 * @param doc The Firestore document snapshot.
 * @returns The typed object.
 */
function docToType<T>(doc: FirebaseFirestore.DocumentSnapshot): T {
  const data = doc.data();
  // Convert Firestore Timestamps to ISO strings
  const convertedData = Object.fromEntries(
    Object.entries(data!).map(([key, value]) =>
      value instanceof Timestamp
        ? [key, value.toDate().toISOString()]
        : [key, value],
    ),
  );
  return { id: doc.id, ...convertedData } as T;
}

// --- GLOBAL SEARCH ---
export interface GlobalSearchResult {
  products: Product[];
  users: User[];
  compliancePaths: CompliancePath[];
}

export async function globalSearch(
  query: string,
  userId: string,
): Promise<GlobalSearchResult> {
  if (!query) {
    return { products: [], users: [], compliancePaths: [] };
  }

  const user = await getUserById(userId);
  if (!user) {
    throw new PermissionError('User not found.');
  }

  const lowerCaseQuery = query.toLowerCase();

  const [allProducts, allUsers, allPaths] = await Promise.all([
    getProducts(userId),
    getUsers(),
    getCompliancePaths(),
  ]);

  const products = allProducts
    .filter(
      p =>
        p.productName.toLowerCase().includes(lowerCaseQuery) ||
        p.category.toLowerCase().includes(lowerCaseQuery) ||
        p.supplier.toLowerCase().includes(lowerCaseQuery) ||
        p.gtin?.includes(lowerCaseQuery),
    )
    .slice(0, 5);

  const users = hasRole(user, UserRoles.ADMIN)
    ? allUsers
        .filter(
          u =>
            u.fullName.toLowerCase().includes(lowerCaseQuery) ||
            u.email.toLowerCase().includes(lowerCaseQuery),
        )
        .slice(0, 5)
    : [];

  const compliancePaths = allPaths
    .filter(
      p =>
        p.name.toLowerCase().includes(lowerCaseQuery) ||
        p.description.toLowerCase().includes(lowerCaseQuery),
    )
    .slice(0, 5);

  return { products, users, compliancePaths };
}

// --- WEBHOOK ACTIONS ---

export async function getWebhooks(userId?: string): Promise<Webhook[]> {
  const collectionRef = adminDb.collection(Collections.WEBHOOKS);
  let snapshot;
  if (userId) {
    const user = await getUserById(userId);
    if (!user || !hasRole(user, UserRoles.DEVELOPER)) return [];
    snapshot = await collectionRef.where('userId', '==', userId).get();
  } else {
    snapshot = await collectionRef.get();
  }
  return snapshot.docs.map(doc => docToType<Webhook>(doc));
}

export async function getWebhookById(
  id: string,
  userId: string,
): Promise<Webhook | undefined> {
  const user = await getUserById(userId);
  if (!user || !hasRole(user, UserRoles.DEVELOPER)) return undefined;

  const doc = await adminDb.collection(Collections.WEBHOOKS).doc(id).get();
  if (!doc.exists || doc.data()!.userId !== userId) return undefined;

  return docToType<Webhook>(doc);
}

export async function saveWebhook(
  values: WebhookFormValues,
  userId: string,
  webhookId?: string,
): Promise<Webhook> {
  const validatedData = webhookFormSchema.parse(values);
  const user = await getUserById(userId);
  if (!user || !hasRole(user, UserRoles.DEVELOPER))
    throw new PermissionError('Permission denied.');

  const now = FieldValue.serverTimestamp();

  if (webhookId) {
    const docRef = adminDb.collection(Collections.WEBHOOKS).doc(webhookId);
    await docRef.update({ ...validatedData, updatedAt: now });
    await logAuditEvent('webhook.updated', webhookId, {}, userId);
    const updatedDoc = await docRef.get();
    return docToType<Webhook>(updatedDoc);
  } else {
    const docRef = await adminDb.collection(Collections.WEBHOOKS).add({
      ...validatedData,
      userId,
      createdAt: now,
      updatedAt: now,
    });
    await logAuditEvent('webhook.created', docRef.id, {}, userId);
    const newDoc = await docRef.get();
    return docToType<Webhook>(newDoc);
  }
}

export async function deleteWebhook(
  webhookId: string,
  userId: string,
): Promise<void> {
  const webhookDoc = await adminDb
    .collection(Collections.WEBHOOKS)
    .doc(webhookId)
    .get();
  if (!webhookDoc.exists || webhookDoc.data()?.userId !== userId) {
    throw new PermissionError('Cannot delete this webhook.');
  }
  await adminDb.collection(Collections.WEBHOOKS).doc(webhookId).delete();
  await logAuditEvent('webhook.deleted', webhookId, {}, userId);
}

export async function replayWebhook(
  logId: string,
  userId: string,
): Promise<void> {
  const user = await getUserById(userId);
  if (!user || !hasRole(user, UserRoles.DEVELOPER)) {
    throw new PermissionError('Permission denied.');
  }

  const logDoc = await adminDb
    .collection(Collections.AUDIT_LOGS)
    .doc(logId)
    .get();
  const log = logDoc.exists ? docToType<AuditLog>(logDoc) : undefined;
  if (!log || !log.action.startsWith('webhook.delivery.failure')) {
    throw new Error('Invalid or non-failed webhook log ID.');
  }

  const webhookDoc = await adminDb
    .collection(Collections.WEBHOOKS)
    .doc(log.entityId)
    .get();
  const webhook = webhookDoc.exists
    ? docToType<Webhook>(webhookDoc)
    : undefined;

  if (!webhook || webhook.userId !== userId) {
    throw new PermissionError(
      'Original webhook not found or permission denied.',
    );
  }

  const productDoc = await adminDb
    .collection(Collections.PRODUCTS)
    .doc(log.details.productId)
    .get();
  const product = productDoc.exists
    ? docToType<Product>(productDoc)
    : undefined;
  if (!product) {
    throw new Error('Original product payload not found.');
  }

  await logAuditEvent('webhook.replay.initiated', webhook.id, { logId }, userId);
  sendWebhook(webhook, log.details.event, product);
}

// --- PRODUCT ACTIONS ---

export async function getProducts(
  userId?: string,
  filters?: { searchQuery?: string },
): Promise<Product[]> {
  const user = userId ? await getUserById(userId) : undefined;
  let query: FirebaseFirestore.Query = adminDb.collection(Collections.PRODUCTS);

  const globalReadRoles: Role[] = [
    UserRoles.ADMIN,
    UserRoles.BUSINESS_ANALYST,
    UserRoles.RETAILER,
    UserRoles.SERVICE_PROVIDER,
  ];

  const hasGlobalRead =
    user && globalReadRoles.some(role => hasRole(user, role));

  if (user && !hasGlobalRead) {
    query = query.where('companyId', '==', user.companyId);
  } else if (!user) {
    query = query.where('status', '==', 'Published');
  }

  const snapshot = await query.orderBy('lastUpdated', 'desc').get();
  let results = snapshot.docs.map(doc => docToType<Product>(doc));

  if (filters?.searchQuery) {
    const lowerCaseQuery = filters.searchQuery.toLowerCase();
    results = results.filter(
      p =>
        p.productName.toLowerCase().includes(lowerCaseQuery) ||
        p.supplier.toLowerCase().includes(lowerCaseQuery) ||
        p.category.toLowerCase().includes(lowerCaseQuery) ||
        p.gtin?.toLowerCase().includes(lowerCaseQuery),
    );
  }

  return results;
}

export async function getProductById(
  id: string,
  userId?: string,
): Promise<Product | undefined> {
  const doc = await adminDb.collection(Collections.PRODUCTS).doc(id).get();
  if (!doc.exists) return undefined;

  const product = docToType<Product>(doc);
  const user = userId ? await getUserById(userId) : undefined;

  if (!user) {
    return product.status === 'Published' ? product : undefined;
  }

  const hasGlobalReadAccess = [
    UserRoles.ADMIN,
    UserRoles.AUDITOR,
    UserRoles.COMPLIANCE_MANAGER,
    UserRoles.RECYCLER,
    UserRoles.SERVICE_PROVIDER,
    UserRoles.BUSINESS_ANALYST,
    UserRoles.DEVELOPER,
    UserRoles.MANUFACTURER,
    UserRoles.RETAILER,
  ].some(role => hasRole(user, role));

  if (hasGlobalReadAccess || user.companyId === product.companyId) {
    return product;
  }

  return product.status === 'Published' ? product : undefined;
}

export async function saveProduct(
  values: ProductFormValues,
  userId: string,
  productId?: string,
): Promise<Product> {
  const validatedData = productFormSchema.parse(values);
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');

  const now = FieldValue.serverTimestamp();

  if (productId) {
    const productRef = adminDb.collection(Collections.PRODUCTS).doc(productId);
    const existingProductDoc = await productRef.get();
    const existingProduct = existingProductDoc.exists
      ? docToType<Product>(existingProductDoc)
      : undefined;
    if (!existingProduct) throw new Error('Product not found');

    checkPermission(user, 'product:edit', existingProduct);
    if (
      validatedData.status === 'Archived' &&
      existingProduct.status !== 'Archived'
    ) {
      checkPermission(user, 'product:archive', existingProduct);
    }

    const dataToUpdate = {
      ...validatedData,
      lastUpdated: now,
      updatedAt: now,
      isProcessing: true,
      verificationStatus:
        existingProduct.verificationStatus === 'Failed'
          ? 'Not Submitted'
          : existingProduct.verificationStatus,
      status:
        existingProduct.verificationStatus === 'Failed'
          ? 'Draft'
          : validatedData.status,
    };
    await productRef.update(dataToUpdate);
    await logAuditEvent(
      'product.updated',
      productId,
      { changes: Object.keys(values) },
      userId,
    );
    const updatedDoc = await productRef.get();
    return docToType<Product>(updatedDoc);
  } else {
    checkPermission(user, 'product:create');
    const company = await getCompanyById(user.companyId);
    if (!company)
      throw new Error(`Company with ID ${user.companyId} not found.`);

    const newProductData = {
      ...validatedData,
      companyId: user.companyId,
      supplier: company.name,
      productImage:
        validatedData.productImage || 'https://placehold.co/400x400.png',
      createdAt: now,
      updatedAt: now,
      lastUpdated: now,
      endOfLifeStatus: 'Active',
      verificationStatus: 'Not Submitted',
      materials: validatedData.materials || [],
      isProcessing: true,
    };
    const docRef = await adminDb
      .collection(Collections.PRODUCTS)
      .add(newProductData);
    await logAuditEvent('product.created', docRef.id, {}, userId);
    const newDoc = await docRef.get();
    return docToType<Product>(newDoc);
  }
}

export async function deleteProduct(
  productId: string,
  userId: string,
): Promise<void> {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');
  const product = await getProductById(productId, userId);
  if (!product) throw new Error('Product not found');
  checkPermission(user, 'product:delete', product);

  await adminDb.collection(Collections.PRODUCTS).doc(productId).delete();
  await logAuditEvent('product.deleted', productId, {}, userId);
}

export async function submitForReview(
  productId: string,
  userId: string,
): Promise<Product> {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');
  const product = await getProductById(productId, userId);
  if (!product) throw new Error('Product not found');
  checkPermission(user, 'product:submit', product);

  const docRef = adminDb.collection(Collections.PRODUCTS).doc(productId);
  await docRef.update({
    verificationStatus: 'Pending',
    lastUpdated: FieldValue.serverTimestamp(),
  });
  await logAuditEvent('passport.submitted', productId, {}, userId);
  const updatedDoc = await docRef.get();
  return docToType<Product>(updatedDoc);
}

export async function recalculateScore(
  productId: string,
  userId: string,
): Promise<void> {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');
  const product = await getProductById(productId, userId);
  if (!product) throw new Error('Product not found');
  checkPermission(user, 'product:recalculate', product);

  await adminDb.collection(Collections.PRODUCTS).doc(productId).update({
    isProcessing: true,
    'sustainability.score': -1,
  });
  await logAuditEvent('product.recalculate_score', productId, {}, userId);
}

export async function generateAndSaveProductImage(
  productId: string,
  userId: string,
  contextImageDataUri?: string,
): Promise<Product> {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');
  const product = await getProductById(productId, userId);
  if (!product) throw new Error('Product not found or permission denied');
  checkPermission(user, 'product:edit', product);

  const { productName, productDescription } = product;
  const { imageUrl } = await generateProductImage({
    productName,
    productDescription,
    contextImageDataUri,
  });

  const docRef = adminDb.collection(Collections.PRODUCTS).doc(productId);
  await docRef.update({
    productImage: imageUrl,
    lastUpdated: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  await logAuditEvent('product.image.generated', productId, {}, userId);
  const updatedDoc = await docRef.get();
  return docToType<Product>(updatedDoc);
}

export async function approvePassport(
  productId: string,
  userId: string,
): Promise<Product> {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');
  checkPermission(user, 'product:approve');

  const productRef = adminDb.collection(Collections.PRODUCTS).doc(productId);
  const productDoc = await productRef.get();
  if (!productDoc.exists) throw new Error('Product not found');

  const product = docToType<Product>(productDoc);
  const productHash = await hashProductData(product);
  const blockchainProof = await anchorToPolygon(product.id, productHash);
  const ebsiVcId = await generateEbsiCredential(product.id);

  const updatedData = {
    verificationStatus: 'Verified' as const,
    status: 'Published' as const,
    lastVerificationDate: FieldValue.serverTimestamp(),
    blockchainProof,
    ebsiVcId,
  };
  await productRef.update(updatedData);
  await logAuditEvent(
    'passport.approved',
    productId,
    { txHash: blockchainProof.txHash },
    userId,
  );

  const updatedProduct = docToType<Product>(await productRef.get());
  const allWebhooks = await getWebhooks();
  const subscribedWebhooks = allWebhooks.filter(
    wh => wh.status === 'active' && wh.events.includes('product.published'),
  );

  for (const webhook of subscribedWebhooks) {
    sendWebhook(webhook, 'product.published', updatedProduct);
  }

  return updatedProduct;
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

  const docRef = adminDb.collection(Collections.PRODUCTS).doc(productId);
  await docRef.update({
    verificationStatus: 'Failed',
    lastVerificationDate: FieldValue.serverTimestamp(),
    'sustainability.complianceSummary': reason,
    'sustainability.gaps': gaps,
  });
  await logAuditEvent('passport.rejected', productId, { reason }, userId);
  const updatedDoc = await docRef.get();
  return docToType<Product>(updatedDoc);
}

export async function markAsRecycled(
  productId: string,
  userId: string,
): Promise<Product> {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');
  const product = await getProductById(productId, userId);
  if (!product) throw new Error('Product not found');
  checkPermission(user, 'product:recycle', product);

  const docRef = adminDb.collection(Collections.PRODUCTS).doc(productId);
  await docRef.update({
    endOfLifeStatus: 'Recycled',
    lastUpdated: FieldValue.serverTimestamp(),
  });
  await logAuditEvent('product.recycled', productId, {}, userId);
  const updatedDoc = await docRef.get();
  return docToType<Product>(updatedDoc);
}

export async function resolveComplianceIssue(
  productId: string,
  userId: string,
): Promise<Product> {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');
  checkPermission(user, 'product:resolve');

  const docRef = adminDb.collection(Collections.PRODUCTS).doc(productId);
  await docRef.update({
    verificationStatus: 'Not Submitted',
    status: 'Draft',
    lastUpdated: FieldValue.serverTimestamp(),
  });
  await logAuditEvent('compliance.resolved', productId, {}, userId);
  const updatedDoc = await docRef.get();
  return docToType<Product>(updatedDoc);
}

export async function suggestImprovements(input: {
  productName: string;
  productDescription: string;
}) {
  return await suggestImprovementsFlow(input);
}

export async function generateConformityDeclarationText(
  productId: string,
  userId: string,
): Promise<string> {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');
  const product = await getProductById(productId, userId);
  if (!product) throw new Error('Product not found or permission denied.');
  checkPermission(user, 'product:edit', product);

  const company = await getCompanyById(product.companyId);
  if (!company) throw new Error('Company not found for product.');

  const { declarationText } = await generateConformityDeclarationFlow({
    product: product as AiProduct,
    companyName: company.name,
  });

  await logAuditEvent('doc.generated', productId, {}, userId);
  return declarationText;
}

export async function analyzeBillOfMaterials(bomText: string) {
  return await analyzeBillOfMaterialsFlow({ bomText });
}

export async function bulkCreateProducts(
  products: BulkProductImportValues[],
  userId: string,
): Promise<{ createdCount: number }> {
  const user = await getUserById(userId);
  if (!user) throw new PermissionError('User not found');
  checkPermission(user, 'product:create');

  const company = await getCompanyById(user.companyId);
  if (!company) throw new Error('User company not found');

  const now = FieldValue.serverTimestamp();
  const batch = adminDb.batch();

  products.forEach(productData => {
    const docRef = adminDb.collection(Collections.PRODUCTS).doc();
    const newProduct: Omit<
      Product,
      'id' | 'createdAt' | 'updatedAt' | 'lastUpdated'
    > = {
      ...productData,
      companyId: user.companyId,
      supplier: company.name,
      status: 'Draft',
      productImage:
        productData.productImage || 'https://placehold.co/400x400.png',
      materials: productData.materials || [],
      endOfLifeStatus: 'Active',
      verificationStatus: 'Not Submitted',
      isProcessing: true, // Trigger AI flows
    };
    batch.set(docRef, {
      ...newProduct,
      createdAt: now,
      updatedAt: now,
      lastUpdated: now,
    });
    logAuditEvent('product.created', docRef.id, { source: 'bulk_import' }, userId);
  });

  await batch.commit();

  return { createdCount: products.length };
}

// Helper function to recursively flatten a nested object for CSV export.
const flattenObject = (
  obj: any,
  parentKey = '',
  res: Record<string, any> = {},
) => {
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const propName = parentKey ? `${parentKey}_${key}` : key;
      const value = obj[key];
      if (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value) &&
        !(value instanceof Timestamp)
      ) {
        flattenObject(value, propName, res);
      } else if (Array.isArray(value)) {
        res[propName] = JSON.stringify(value);
      } else if (value instanceof Timestamp) {
        res[propName] = value.toDate().toISOString();
      } else {
        res[propName] = value;
      }
    }
  }
  return res;
};

export async function exportProducts(format: 'csv' | 'json'): Promise<string> {
  const products = await getProducts();
  if (format === 'json') {
    return JSON.stringify(products, null, 2);
  }
  if (products.length === 0) return '';
  const flatProducts = products.map(flattenObject);
  const allHeaders = Array.from(
    flatProducts.reduce(
      (acc, p) => (Object.keys(p).forEach(key => acc.add(key)), acc),
      new Set<string>(),
    ),
  ).sort();
  const csvRows = [allHeaders.join(',')];
  for (const product of flatProducts) {
    const values = allHeaders.map(header => {
      const value = product[header];
      if (value === undefined || value === null) return '';
      let stringValue = String(value);
      if (/[",\n]/.test(stringValue)) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    });
    csvRows.push(values.join(','));
  }
  return csvRows.join('\n');
}

export async function exportComplianceReport(format: 'csv'): Promise<string> {
  const products = await getProducts();
  if (format !== 'csv') throw new Error('Unsupported format');
  if (products.length === 0) return '';

  const complianceData = products.map(p => ({
    productId: p.id,
    productName: p.productName,
    supplier: p.supplier,
    verificationStatus: p.verificationStatus,
    isCompliant: p.sustainability?.isCompliant,
    complianceSummary: p.sustainability?.complianceSummary,
    gaps: p.sustainability?.gaps
      ? JSON.stringify(p.sustainability.gaps)
      : '[]',
  }));

  const headers = Object.keys(complianceData[0]).join(',');
  const csvRows = [headers];

  for (const item of complianceData) {
    const values = Object.values(item).map(value => {
      if (value === undefined || value === null) return '';
      let stringValue = String(value);
      if (/[",\n]/.test(stringValue)) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    });
    csvRows.push(values.join(','));
  }
  return csvRows.join('\n');
}

// --- ADMIN & GENERAL ACTIONS ---

export async function getCompanies(): Promise<Company[]> {
  const snapshot = await adminDb.collection(Collections.COMPANIES).get();
  return snapshot.docs.map(doc => docToType<Company>(doc));
}

export async function saveCompany(
  values: CompanyFormValues,
  userId: string,
  companyId?: string,
): Promise<Company> {
  const validatedData = companyFormSchema.parse(values);
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');
  checkPermission(user, 'company:manage');

  const now = FieldValue.serverTimestamp();

  if (companyId) {
    const docRef = adminDb.collection(Collections.COMPANIES).doc(companyId);
    await docRef.update({ ...validatedData, updatedAt: now });
    await logAuditEvent('company.updated', companyId, {}, userId);
    const updatedDoc = await docRef.get();
    return docToType<Company>(updatedDoc);
  } else {
    const docRef = await adminDb
      .collection(Collections.COMPANIES)
      .add({ ...validatedData, createdAt: now, updatedAt: now });
    await logAuditEvent('company.created', docRef.id, {}, userId);
    const newDoc = await docRef.get();
    return docToType<Company>(newDoc);
  }
}

export async function deleteCompany(
  companyId: string,
  userId: string,
): Promise<void> {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');
  checkPermission(user, 'company:manage');
  await adminDb.collection(Collections.COMPANIES).doc(companyId).delete();
  await logAuditEvent('company.deleted', companyId, {}, userId);
}

export async function saveUser(
  values: UserFormValues,
  adminId: string,
  userId?: string,
): Promise<User> {
  const validatedData = userFormSchema.parse(values);
  const adminUser = await getUserById(adminId);
  if (!adminUser) throw new Error('Admin user not found');
  checkPermission(adminUser, 'user:manage');

  const now = FieldValue.serverTimestamp();
  const userData = {
    fullName: validatedData.fullName,
    email: validatedData.email,
    companyId: validatedData.companyId,
    roles: [validatedData.role as Role],
    updatedAt: now,
  };

  if (userId) {
    const docRef = adminDb.collection(Collections.USERS).doc(userId);
    await docRef.update(userData);
    await logAuditEvent('user.updated', userId, {}, adminId);
    const updatedDoc = await docRef.get();
    return docToType<User>(updatedDoc);
  } else {
    // Note: Creating a user document without creating an Auth user is not ideal.
    // This is simplified for the mock. A real app would use a Cloud Function
    // triggered by Auth user creation.
    const docRef = await adminDb
      .collection(Collections.USERS)
      .add({ ...userData, createdAt: now });
    await logAuditEvent('user.created', docRef.id, {}, adminId);
    const newDoc = await docRef.get();
    return docToType<User>(newDoc);
  }
}

export async function deleteUser(
  userId: string,
  adminId: string,
): Promise<void> {
  const adminUser = await getUserById(adminId);
  if (!adminUser) throw new Error('Admin user not found');
  checkPermission(adminUser, 'user:manage');
  await adminDb.collection(Collections.USERS).doc(userId).delete();
  // Also delete from Firebase Auth
  await adminAuth.deleteUser(userId).catch(e => console.error("Failed to delete user from Auth", e));
  await logAuditEvent('user.deleted', userId, {}, adminId);
}

export async function getCompliancePaths(): Promise<CompliancePath[]> {
  const snapshot = await adminDb.collection(Collections.COMPLIANCE_PATHS).get();
  return snapshot.docs.map(doc => docToType<CompliancePath>(doc));
}

export async function getCompliancePathById(
  id: string,
): Promise<CompliancePath | undefined> {
  const doc = await adminDb.collection(Collections.COMPLIANCE_PATHS).doc(id).get();
  return doc.exists ? docToType<CompliancePath>(doc) : undefined;
}

export async function saveCompliancePath(
  values: CompliancePathFormValues,
  userId: string,
  pathId?: string,
): Promise<CompliancePath> {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');
  checkPermission(user, 'compliance:manage');

  const validatedData = compliancePathFormSchema.parse(values);
  const now = FieldValue.serverTimestamp();

  const pathData = {
    name: validatedData.name,
    description: validatedData.description,
    category: validatedData.category,
    regulations: validatedData.regulations.map(r => r.value),
    rules: {
      minSustainabilityScore: validatedData.minSustainabilityScore,
      requiredKeywords: validatedData.requiredKeywords?.map(k => k.value),
      bannedKeywords: validatedData.bannedKeywords?.map(k => k.value),
    },
    updatedAt: now,
  };

  if (pathId) {
    const docRef = adminDb
      .collection(Collections.COMPLIANCE_PATHS)
      .doc(pathId);
    await docRef.update(pathData);
    await logAuditEvent('compliance_path.updated', pathId, {}, userId);
    const updatedDoc = await docRef.get();
    return docToType<CompliancePath>(updatedDoc);
  } else {
    const docRef = await adminDb
      .collection(Collections.COMPLIANCE_PATHS)
      .add({ ...pathData, createdAt: now });
    await logAuditEvent('compliance_path.created', docRef.id, {}, userId);
    const newDoc = await docRef.get();
    return docToType<CompliancePath>(newDoc);
  }
}

export async function deleteCompliancePath(
  pathId: string,
  userId: string,
): Promise<void> {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');
  checkPermission(user, 'compliance:manage');
  await adminDb.collection(Collections.COMPLIANCE_PATHS).doc(pathId).delete();
  await logAuditEvent('compliance_path.deleted', pathId, {}, userId);
}

export async function getAuditLogs(filters?: {
  companyId?: string;
}): Promise<AuditLog[]> {
  let query: FirebaseFirestore.Query = adminDb.collection(
    Collections.AUDIT_LOGS,
  );
  if (filters?.companyId) {
    const companyUsers = await getUsersByCompanyId(filters.companyId);
    const userIds = companyUsers.map(u => u.id);
    if (userIds.length > 0) {
      query = query.where('userId', 'in', userIds);
    } else {
      return []; // No users in company, so no logs.
    }
  }
  const snapshot = await query.orderBy('createdAt', 'desc').get();
  return snapshot.docs.map(doc => docToType<AuditLog>(doc));
}

export async function getAuditLogsForUser(userId: string): Promise<AuditLog[]> {
  const snapshot = await adminDb
    .collection(Collections.AUDIT_LOGS)
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .get();
  return snapshot.docs.map(doc => docToType<AuditLog>(doc));
}

export async function getAuditLogsForEntity(
  entityId: string,
): Promise<AuditLog[]> {
  const snapshot = await adminDb
    .collection(Collections.AUDIT_LOGS)
    .where('entityId', '==', entityId)
    .orderBy('createdAt', 'desc')
    .get();
  return snapshot.docs.map(doc => docToType<AuditLog>(doc));
}

export async function logAuditEvent(
  action: string,
  entityId: string,
  details: Record<string, any>,
  userId: string,
): Promise<AuditLog> {
  const logData = {
    userId,
    action,
    entityId,
    details,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
  const docRef = await adminDb.collection(Collections.AUDIT_LOGS).add(logData);
  const newDoc = await docRef.get();
  return docToType<AuditLog>(newDoc);
}

export async function getApiKeys(userId: string): Promise<ApiKey[]> {
  const user = await getUserById(userId);
  if (!user || !hasRole(user, UserRoles.DEVELOPER)) return [];
  const snapshot = await adminDb
    .collection(Collections.API_KEYS)
    .where('userId', '==', userId)
    .get();
  return snapshot.docs.map(doc => docToType<ApiKey>(doc));
}

export async function saveApiKey(
  values: ApiKeyFormValues,
  userId: string,
  keyId?: string,
): Promise<{ key: ApiKey; rawToken?: string }> {
  const validatedData = apiKeyFormSchema.parse(values);
  const user = await getUserById(userId);
  if (!user || !hasRole(user, UserRoles.DEVELOPER))
    throw new PermissionError('Permission denied.');

  const now = FieldValue.serverTimestamp();

  if (keyId) {
    const docRef = adminDb.collection(Collections.API_KEYS).doc(keyId);
    await docRef.update({ ...validatedData, updatedAt: now });
    await logAuditEvent('api_key.updated', keyId, {}, userId);
    const updatedDoc = await docRef.get();
    return { key: docToType<ApiKey>(updatedDoc) };
  } else {
    const rawToken = `nor_mock_${[...Array(32)]
      .map(() => Math.floor(Math.random() * 16).toString(16))
      .join('')}`;
    const newKeyData = {
      ...validatedData,
      token: `nor_mock_******************${rawToken.slice(-4)}`,
      status: 'Active',
      userId,
      createdAt: now,
      updatedAt: now,
    };
    const docRef = await adminDb.collection(Collections.API_KEYS).add(newKeyData);
    await logAuditEvent('api_key.created', docRef.id, {}, userId);
    const newDoc = await docRef.get();
    return { key: docToType<ApiKey>(newDoc), rawToken };
  }
}

export async function revokeApiKey(
  keyId: string,
  userId: string,
): Promise<ApiKey> {
  const user = await getUserById(userId);
  if (!user || !hasRole(user, UserRoles.DEVELOPER))
    throw new PermissionError('Permission denied.');

  const docRef = adminDb.collection(Collections.API_KEYS).doc(keyId);
  const doc = await docRef.get();
  if (!doc.exists || doc.data()!.userId !== userId)
    throw new Error('Key not found or permission denied');

  await docRef.update({
    status: 'Revoked',
    updatedAt: FieldValue.serverTimestamp(),
  });
  await logAuditEvent('api_key.revoked', keyId, {}, userId);
  const updatedDoc = await docRef.get();
  return docToType<ApiKey>(updatedDoc);
}

export async function deleteApiKey(
  keyId: string,
  userId: string,
): Promise<void> {
  const user = await getUserById(userId);
  if (!user || !hasRole(user, UserRoles.DEVELOPER))
    throw new PermissionError('Permission denied.');

  const docRef = adminDb.collection(Collections.API_KEYS).doc(keyId);
  const doc = await docRef.get();
  if (!doc.exists || doc.data()!.userId !== userId)
    throw new Error('Key not found or permission denied');

  await docRef.delete();
  await logAuditEvent('api_key.deleted', keyId, {}, userId);
}

export async function getApiSettings(): Promise<ApiSettings> {
  const doc = await adminDb.collection('settings').doc('api').get();
  return doc.exists
    ? (doc.data() as ApiSettings)
    : {
        isPublicApiEnabled: true,
        rateLimits: { free: 100, pro: 1000, enterprise: 10000 },
        isWebhookSigningEnabled: true,
      };
}

export async function saveApiSettings(
  values: ApiSettingsFormValues,
  userId: string,
): Promise<ApiSettings> {
  const validatedData = apiSettingsSchema.parse(values);
  await adminDb.collection('settings').doc('api').set(validatedData, { merge: true });
  await logAuditEvent('settings.api.updated', 'global', { values }, userId);
  return validatedData;
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');

  const logsSnapshot = await adminDb
    .collection(Collections.AUDIT_LOGS)
    .where('userId', '==', userId)
    .get();
  const logIds = logsSnapshot.docs.map(doc => doc.id);

  await adminDb
    .collection(Collections.USERS)
    .doc(userId)
    .update({
      readNotificationIds: logIds,
    });
}

export async function createUserAndCompany(
  name: string,
  email: string,
  userId: string,
) {
  const now = FieldValue.serverTimestamp();

  const companyRef = await adminDb.collection(Collections.COMPANIES).add({
    name: `${name}'s Company`,
    ownerId: userId,
    createdAt: now,
    updatedAt: now,
  });

  await adminDb.collection(Collections.USERS).doc(userId).set({
    fullName: name,
    email: email,
    companyId: companyRef.id,
    roles: [UserRoles.SUPPLIER],
    createdAt: now,
    updatedAt: now,
    readNotificationIds: [],
    onboardingComplete: false,
    isMfaEnabled: false,
  });
}

export async function setMfaStatus(userId: string, isEnabled: boolean): Promise<void> {
    const user = await getUserById(userId);
    if (!user) {
        throw new Error('User not found.');
    }

    await adminDb.collection(Collections.USERS).doc(userId).update({
        isMfaEnabled: isEnabled,
        updatedAt: FieldValue.serverTimestamp()
    });

    await logAuditEvent(
        isEnabled ? 'user.mfa.enabled' : 'user.mfa.disabled',
        userId,
        {},
        userId
    );
}

export async function completeOnboarding(
  values: OnboardingFormValues,
  userId: string,
): Promise<{ user: User; company: Company }> {
  const validatedData = onboardingFormSchema.parse(values);
  const user = await getUserById(userId);
  if (!user) {
    throw new PermissionError('User not found.');
  }

  const userRef = adminDb.collection(Collections.USERS).doc(userId);
  const companyRef = adminDb
    .collection(Collections.COMPANIES)
    .doc(user.companyId);

  const batch = adminDb.batch();

  batch.update(userRef, { onboardingComplete: true });
  batch.update(companyRef, {
    name: validatedData.companyName,
    industry: validatedData.industry,
  });

  await batch.commit();

  const updatedUser = docToType<User>(await userRef.get());
  const updatedCompany = docToType<Company>(await companyRef.get());

  return { user: updatedUser, company: updatedCompany };
}

export async function updateUserProfile(userId: string, fullName: string) {
  await adminDb
    .collection(Collections.USERS)
    .doc(userId)
    .update({
      fullName,
      updatedAt: FieldValue.serverTimestamp(),
    });
  await logAuditEvent(
    'user.profile.updated',
    userId,
    { fields: ['fullName'] },
    userId,
  );
}

export async function updateUserPassword(
  userId: string,
  current: string,
  newPass: string,
) {
  // This is a complex operation involving re-authentication that can't be safely
  // done from a server action without the user's current password, which we don't want to handle.
  // In a real app, this flow would be handled entirely on the client-side using the Firebase JS SDK.
  // For the mock, we simulate success.
  if (current !== 'password123') throw new Error('Incorrect current password.');
  await adminAuth.updateUser(userId, { password: newPass });
  console.log(`Password for user ${userId} has been updated.`);
  await logAuditEvent('user.password.updated', userId, {}, userId);
}

export async function saveNotificationPreferences(userId: string, prefs: any) {
  // This would update a user's notification settings in Firestore.
  console.log(`Saving notification preferences for ${userId}`, prefs);
  await logAuditEvent('user.notifications.updated', userId, { prefs }, userId);
}

export async function getServiceTickets(): Promise<ServiceTicket[]> {
  const snapshot = await adminDb.collection(Collections.SERVICE_TICKETS).get();
  return snapshot.docs.map(doc => docToType<ServiceTicket>(doc));
}

export async function saveServiceTicket(
  values: ServiceTicketFormValues,
  userId: string,
  ticketId?: string,
): Promise<ServiceTicket> {
  const validatedData = serviceTicketFormSchema.parse(values);
  const now = FieldValue.serverTimestamp();

  if (ticketId) {
    const docRef = adminDb
      .collection(Collections.SERVICE_TICKETS)
      .doc(ticketId);
    await docRef.update({ ...validatedData, updatedAt: now });
    await logAuditEvent('ticket.updated', ticketId, {}, userId);
    const updatedDoc = await docRef.get();
    return docToType<ServiceTicket>(updatedDoc);
  } else {
    const docRef = await adminDb
      .collection(Collections.SERVICE_TICKETS)
      .add({ ...validatedData, userId, createdAt: now, updatedAt: now });
    await logAuditEvent('ticket.created', docRef.id, {}, userId);
    const newDoc = await docRef.get();
    return docToType<ServiceTicket>(newDoc);
  }
}

export async function updateServiceTicketStatus(
  ticketId: string,
  status: 'Open' | 'In Progress' | 'Closed',
  userId: string,
): Promise<ServiceTicket> {
  const docRef = adminDb.collection(Collections.SERVICE_TICKETS).doc(ticketId);
  await docRef.update({ status, updatedAt: FieldValue.serverTimestamp() });
  await logAuditEvent('ticket.status.updated', ticketId, { status }, userId);
  const updatedDoc = await docRef.get();
  return docToType<ServiceTicket>(updatedDoc);
}

export async function getProductionLines(): Promise<ProductionLine[]> {
  const snapshot = await adminDb.collection(Collections.PRODUCTION_LINES).get();
  return snapshot.docs.map(doc => docToType<ProductionLine>(doc));
}

export async function saveProductionLine(
  values: ProductionLineFormValues,
  userId: string,
  lineId?: string,
): Promise<ProductionLine> {
  const validatedData = productionLineFormSchema.parse(values);
  const now = FieldValue.serverTimestamp();

  if (lineId) {
    const docRef = adminDb
      .collection(Collections.PRODUCTION_LINES)
      .doc(lineId);
    await docRef.update({ ...validatedData, updatedAt: now });
    await logAuditEvent('production_line.updated', lineId, {}, userId);
    const updatedDoc = await docRef.get();
    return docToType<ProductionLine>(updatedDoc);
  } else {
    const docRef = await adminDb
      .collection(Collections.PRODUCTION_LINES)
      .add({ ...validatedData, createdAt: now, updatedAt: now, lastMaintenance: now });
    await logAuditEvent('production_line.created', docRef.id, {}, userId);
    const newDoc = await docRef.get();
    return docToType<ProductionLine>(newDoc);
  }
}

export async function deleteProductionLine(
  lineId: string,
  userId: string,
): Promise<void> {
  await adminDb.collection(Collections.PRODUCTION_LINES).doc(lineId).delete();
  await logAuditEvent('production_line.deleted', lineId, {}, userId);
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  return authGetUserByEmail(email);
}

export async function signInWithMockUser(
  email: string,
  password: string,
): Promise<{ success: boolean; token?: string; error?: string }> {
  try {
    const userRecord = await adminAuth.getUserByEmail(email);
    // In emulator, we can't verify password directly. We just trust it for mock users.
    // A real login flow would use client-side SDK. This is just for seeding/dev.
    if (password !== 'password123') {
      return { success: false, error: 'Invalid password for mock user.' };
    }
    const customToken = await adminAuth.createCustomToken(userRecord.uid);
    return { success: true, token: customToken };
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      return { success: false, error: 'User not found.' };
    }
    console.error('Error during mock sign in flow:', error);
    return { success: false, error: 'Server error during sign in.' };
  }
}
