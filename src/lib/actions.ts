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
  type CompliancePathFormValues,
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
  OnboardingFormValues,
  onboardingFormSchema,
  supportTicketFormSchema,
  SupportTicketFormValues,
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
import { UserRoles, type Role, Collections } from './constants';
import {
  getUserById,
  getCompanyById,
  getUsersByCompanyId,
  getUserByEmail as authGetUserByEmail,
} from './auth';
import { hasRole } from './auth-utils';
import { sendWebhook } from '@/services/webhooks';
import type { AiProduct } from './ai/schemas';
import { checkPermission, PermissionError } from './permissions';
import { adminAuth, adminDb } from './firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { createProductFromImage as createProductFromImageFlow } from '@/ai/flows/create-product-from-image';

// MOCK DATA IMPORTS (To be removed or refactored)
import { serviceTickets as mockServiceTickets } from './service-ticket-data';
import { productionLines as mockProductionLines } from './manufacturing-data';

// Helper for mock data manipulation
const newId = (prefix: string) =>
  `${prefix}-${Math.random().toString(36).substring(2, 9)}`;

function docToType<T>(doc: FirebaseFirestore.DocumentSnapshot): T {
  const data = doc.data() as any;
  if (!data) return { id: doc.id } as T; // Handle case where doc exists but data is empty
  // Convert Firestore Timestamps to ISO strings for server actions
  Object.keys(data).forEach(key => {
    if (data[key] instanceof Timestamp) {
      data[key] = data[key].toDate().toISOString();
    }
  });
  return { id: doc.id, ...data } as T;
}

// --- WEBHOOK ACTIONS ---

export async function getWebhooks(userId?: string): Promise<Webhook[]> {
  if (!userId) return []; // Should not be called without a user
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');
  checkPermission(user, 'developer:manage_api');

  const snapshot = await adminDb
    .collection(Collections.WEBHOOKS)
    .where('userId', '==', userId)
    .get();
  return snapshot.docs.map(doc => docToType<Webhook>(doc));
}

export async function getWebhookById(
  id: string,
  userId: string,
): Promise<Webhook | undefined> {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');
  checkPermission(user, 'developer:manage_api');

  const doc = await adminDb.collection(Collections.WEBHOOKS).doc(id).get();
  if (!doc.exists || doc.data()?.userId !== userId) {
    return undefined;
  }
  return docToType<Webhook>(doc);
}

export async function saveWebhook(
  values: WebhookFormValues,
  userId: string,
  webhookId?: string,
): Promise<Webhook> {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');
  checkPermission(user, 'developer:manage_api');

  const validatedData = webhookFormSchema.parse(values);

  if (webhookId) {
    const docRef = adminDb.collection(Collections.WEBHOOKS).doc(webhookId);
    // Ensure the user owns this webhook
    const existing = await docRef.get();
    if (!existing.exists || existing.data()?.userId !== userId) {
      throw new PermissionError('Webhook not found or permission denied.');
    }

    await docRef.update({
      ...validatedData,
      updatedAt: FieldValue.serverTimestamp(),
    });
    await logAuditEvent('webhook.updated', webhookId, {}, userId);
    const updatedDoc = await docRef.get();
    return docToType<Webhook>(updatedDoc);
  } else {
    const docRef = adminDb.collection(Collections.WEBHOOKS).doc();
    const newWebhook = {
      ...validatedData,
      userId,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };
    await docRef.set(newWebhook);
    await logAuditEvent('webhook.created', docRef.id, {}, userId);
    const newDoc = await docRef.get();
    return docToType<Webhook>(newDoc);
  }
}

export async function deleteWebhook(
  webhookId: string,
  userId: string,
): Promise<void> {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');
  checkPermission(user, 'developer:manage_api');

  const docRef = adminDb.collection(Collections.WEBHOOKS).doc(webhookId);
  const existing = await docRef.get();
  if (!existing.exists || existing.data()?.userId !== userId) {
    throw new PermissionError('Webhook not found or permission denied.');
  }

  await docRef.delete();
  await logAuditEvent('webhook.deleted', webhookId, {}, userId);
}

export async function replayWebhook(
  logId: string,
  userId: string,
): Promise<void> {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');
  checkPermission(user, 'developer:manage_api');

  const log = await getAuditLogById(logId);
  if (
    !log ||
    log.action !== 'webhook.delivery.failure' ||
    !log.details.productId
  ) {
    throw new Error('Invalid or non-replayable event log.');
  }

  const webhook = await getWebhookById(log.entityId, userId);
  const product = await getProductById(log.details.productId, userId);

  if (!webhook || !product) {
    throw new Error('Associated webhook or product not found.');
  }

  await logAuditEvent(
    'webhook.replay.initiated',
    webhook.id,
    { originalLogId: logId, productId: product.id },
    userId,
  );

  // Intentionally not awaiting this to avoid blocking the main action
  sendWebhook(webhook, log.details.event, product);
}

// --- PRODUCT ACTIONS ---

export async function getProducts(
  userId?: string,
  filters?: { searchQuery?: string },
): Promise<Product[]> {
  const user = userId ? await getUserById(userId) : undefined;

  let productsQuery: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> =
    adminDb.collection(Collections.PRODUCTS);

  if (!user) {
    // Public access: only published products are visible
    productsQuery = productsQuery.where('status', '==', 'Published');
  } else {
    // Authenticated access
    const globalReadRoles: Role[] = [
      UserRoles.ADMIN,
      UserRoles.BUSINESS_ANALYST,
      UserRoles.RETAILER,
      UserRoles.SERVICE_PROVIDER,
      UserRoles.AUDITOR,
      UserRoles.COMPLIANCE_MANAGER,
      UserRoles.RECYCLER,
      UserRoles.DEVELOPER,
    ];
    const hasGlobalRead = globalReadRoles.some(role => hasRole(user!, role));

    if (!hasGlobalRead && hasRole(user, UserRoles.MANUFACTURER)) {
      productsQuery = productsQuery.where('supplier', '==', user.companyId);
    } else if (!hasGlobalRead) {
      productsQuery = productsQuery.where('companyId', '==', user.companyId);
    }
  }

  const snapshot = await productsQuery.orderBy('lastUpdated', 'desc').get();
  let results = snapshot.docs.map(doc => docToType<Product>(doc));

  // Apply search filter if provided (client-side filtering for simplicity)
  if (filters?.searchQuery) {
    const query = filters.searchQuery.toLowerCase();
    results = results.filter(
      p =>
        p.productName.toLowerCase().includes(query) ||
        p.supplier.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query) ||
        p.gtin?.toLowerCase().includes(query),
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

  if (!userId) {
    return product.status === 'Published' ? product : undefined;
  }

  const user = await getUserById(userId);
  if (!user) return undefined;

  const globalReadRoles: Role[] = [
    UserRoles.ADMIN,
    UserRoles.AUDITOR,
    UserRoles.COMPLIANCE_MANAGER,
    UserRoles.RECYCLER,
    UserRoles.SERVICE_PROVIDER,
    UserRoles.BUSINESS_ANALYST,
    UserRoles.DEVELOPER,
    UserRoles.MANUFACTURER,
    UserRoles.RETAILER,
  ];

  const hasGlobalReadAccess = globalReadRoles.some(role =>
    hasRole(user, role),
  );

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
    const docRef = adminDb.collection(Collections.PRODUCTS).doc(productId);
    const existingProduct = await getProductById(productId, user.id);
    if (!existingProduct) throw new Error('Product not found');

    checkPermission(user, 'product:edit', existingProduct);

    if (
      validatedData.status === 'Archived' &&
      existingProduct.status !== 'Archived'
    ) {
      checkPermission(user, 'product:archive', existingProduct);
    }

    const updateData: Partial<Product> & {
      lastUpdated: FieldValue;
      updatedAt: FieldValue;
    } = {
      ...validatedData,
      lastUpdated: now,
      updatedAt: now,
      verificationStatus:
        existingProduct.verificationStatus === 'Failed'
          ? 'Not Submitted'
          : existingProduct.verificationStatus,
      status:
        existingProduct.verificationStatus === 'Failed'
          ? 'Draft'
          : validatedData.status,
      isProcessing: true,
    };

    await docRef.update(updateData);
    await logAuditEvent(
      'product.updated',
      productId,
      { changes: Object.keys(values) },
      userId,
    );

    const updatedDoc = await docRef.get();
    return docToType<Product>(updatedDoc);
  } else {
    checkPermission(user, 'product:create');
    const company = await getCompanyById(user.companyId);
    if (!company)
      throw new Error(`Company with ID ${user.companyId} not found.`);

    const newProductRef = adminDb.collection(Collections.PRODUCTS).doc();

    const newProductData = {
      ...validatedData,
      companyId: user.companyId,
      supplier: company.name,
      productImage:
        validatedData.productImage || 'https://placehold.co/400x400.png',
      createdAt: now,
      updatedAt: now,
      lastUpdated: now,
      endOfLifeStatus: 'Active' as const,
      verificationStatus: 'Not Submitted' as const,
      materials: validatedData.materials || [],
      isProcessing: true,
    };

    await newProductRef.set(newProductData);
    await logAuditEvent('product.created', newProductRef.id, {}, userId);

    const newDoc = await newProductRef.get();
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

  const product = await getProductById(productId, user.id);
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

  const product = await getProductById(productId, user.id);
  if (!product) throw new Error('Product not found');

  checkPermission(user, 'product:recalculate', product);

  await adminDb.collection(Collections.PRODUCTS).doc(productId).update({
    isProcessing: true,
    'sustainability.score': -1,
  });

  await logAuditEvent('product.recalculate_score', productId, {}, userId);
  console.log(`Product ${productId} marked for score recalculation.`);
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
  if (!productName || !productDescription) {
    throw new Error(
      'Product name and description are required to generate an image.',
    );
  }

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

export async function generateAndSaveConformityDeclaration(
  productId: string,
  userId: string,
): Promise<void> {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');

  const product = await getProductById(productId, userId);
  if (!product) throw new Error('Product not found or permission denied.');

  checkPermission(user, 'product:edit', product);

  const company = await getCompanyById(product.companyId);
  if (!company) throw new Error('Company not found for product.');

  const aiProductInput: AiProduct = {
    productName: product.productName,
    productDescription: product.productDescription,
    category: product.category,
    supplier: product.supplier,
    materials: product.materials,
    gtin: product.gtin,
    manufacturing: product.manufacturing,
    certifications: product.certifications,
    packaging: product.packaging,
    lifecycle: product.lifecycle,
    battery: product.battery,
    compliance: product.compliance,
    verificationStatus: product.verificationStatus ?? 'Not Submitted',
    complianceSummary: product.sustainability?.complianceSummary,
  };

  const { declarationText } = await generateConformityDeclarationFlow({
    product: aiProductInput,
    companyName: company.name,
  });

  const docRef = adminDb.collection(Collections.PRODUCTS).doc(productId);
  await docRef.update({
    declarationOfConformity: declarationText,
    lastUpdated: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  await logAuditEvent(
    'doc.generated',
    productId,
    { docType: 'Declaration of Conformity' },
    userId,
  );
}

export async function approvePassport(
  productId: string,
  userId: string,
): Promise<Product> {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');

  checkPermission(user, 'product:approve');

  const product = await getProductById(productId, user.id);
  if (!product) throw new Error('Product not found');

  const productHash = await hashProductData(product);
  const blockchainProof = await anchorToPolygon(product.id, productHash);
  const ebsiVcId = await generateEbsiCredential(product.id);

  const docRef = adminDb.collection(Collections.PRODUCTS).doc(productId);
  await docRef.update({
    verificationStatus: 'Verified',
    status: 'Published',
    lastVerificationDate: FieldValue.serverTimestamp(),
    blockchainProof,
    ebsiVcId,
  });

  await logAuditEvent(
    'passport.approved',
    productId,
    { txHash: blockchainProof.txHash },
    userId,
  );

  const updatedDoc = await docRef.get();
  const updatedProduct = docToType<Product>(updatedDoc);

  const allWebhooks = await getWebhooks();
  const subscribedWebhooks = allWebhooks.filter(
    wh => wh.status === 'active' && wh.events.includes('product.published'),
  );

  if (subscribedWebhooks.length > 0) {
    for (const webhook of subscribedWebhooks) {
      sendWebhook(webhook, 'product.published', updatedProduct);
    }
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

  const product = await getProductById(productId, user.id);
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

  const aiProductInput: AiProduct = {
    productName: product.productName,
    productDescription: product.productDescription,
    category: product.category,
    supplier: product.supplier,
    materials: product.materials,
    gtin: product.gtin,
    manufacturing: product.manufacturing,
    certifications: product.certifications,
    packaging: product.packaging,
    lifecycle: product.lifecycle,
    battery: product.battery,
    compliance: product.compliance,
    verificationStatus: product.verificationStatus ?? 'Not Submitted',
    complianceSummary: product.sustainability?.complianceSummary,
  };

  const { declarationText } = await generateConformityDeclarationFlow({
    product: aiProductInput,
    companyName: company.name,
  });

  await logAuditEvent('doc.generated', productId, {}, userId);
  return declarationText;
}

export async function analyzeBillOfMaterials(bomText: string) {
  return await analyzeBillOfMaterialsFlow({ bomText });
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
        !Array.isArray(value)
      ) {
        flattenObject(value, propName, res);
      } else if (Array.isArray(value)) {
        // Stringify arrays of objects for CSV.
        res[propName] = JSON.stringify(value);
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

  // Handle CSV conversion
  if (products.length === 0) {
    return '';
  }

  const flatProducts = products.map(flattenObject);

  // Get a comprehensive list of all possible headers from all products
  const allHeaders = Array.from(
    flatProducts.reduce((acc, product) => {
      Object.keys(product).forEach(key => acc.add(key));
      return acc;
    }, new Set<string>()),
  ).sort();

  const csvRows = [allHeaders.join(',')];

  for (const product of flatProducts) {
    const values = allHeaders.map(header => {
      const value = product[header];

      if (value === undefined || value === null) {
        return '';
      }

      let stringValue =
        typeof value === 'object' ? JSON.stringify(value) : String(value);

      // Escape quotes by doubling them and wrap the whole string in quotes if it contains commas, quotes, or newlines.
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
  if (format !== 'csv') {
    throw new Error('Unsupported format for compliance report.');
  }

  if (products.length === 0) {
    return '';
  }

  const complianceData = products.map(p => ({
    productId: p.id,
    productName: p.productName,
    supplier: p.supplier,
    verificationStatus: p.verificationStatus,
    isCompliant: p.sustainability?.isCompliant,
    complianceSummary: p.sustainability?.complianceSummary,
    gaps: p.sustainability?.gaps ? JSON.stringify(p.sustainability.gaps) : '[]',
  }));

  const headers = Object.keys(complianceData[0]).join(',');
  const csvRows = [headers];

  for (const item of complianceData) {
    const values = Object.values(item).map(value => {
      if (value === undefined || value === null) {
        return '';
      }
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

  if (companyId) {
    const docRef = adminDb.collection(Collections.COMPANIES).doc(companyId);
    await docRef.update({
      ...validatedData,
      updatedAt: FieldValue.serverTimestamp(),
    });
    await logAuditEvent('company.updated', companyId, {}, userId);
    const updatedDoc = await docRef.get();
    return docToType<Company>(updatedDoc);
  } else {
    const docRef = adminDb.collection(Collections.COMPANIES).doc();
    const newCompanyData = {
      ...validatedData,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };
    await docRef.set(newCompanyData);
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

  const userData = {
    fullName: validatedData.fullName,
    email: validatedData.email,
    companyId: validatedData.companyId,
    roles: [validatedData.role as Role],
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (userId) {
    const docRef = adminDb.collection(Collections.USERS).doc(userId);
    await docRef.update(userData);
    await adminAuth.updateUser(userId, {
      email: userData.email,
      displayName: userData.fullName,
    });
    await logAuditEvent('user.updated', userId, {}, adminId);
    const updatedDoc = await docRef.get();
    return docToType<User>(updatedDoc);
  } else {
    // Creating a new user via invite
    const newUserRecord = await adminAuth.createUser({
      email: userData.email,
      displayName: userData.fullName,
      password: `password${Math.random().toString(36).slice(2, 10)}`, // temporary password
    });

    const docRef = adminDb.collection(Collections.USERS).doc(newUserRecord.uid);
    const newUserDbData = {
      fullName: userData.fullName,
      email: userData.email,
      companyId: userData.companyId,
      roles: userData.roles,
      onboardingComplete: false,
      isMfaEnabled: false,
      readNotificationIds: [],
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };
    await docRef.set(newUserDbData);

    await logAuditEvent('user.created', newUserRecord.uid, {}, adminId);
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
  await adminAuth
    .deleteUser(userId)
    .catch(e =>
      console.error(`Auth user ${userId} not found, could not delete.`, e),
    );
  await logAuditEvent('user.deleted', userId, {}, adminId);
}

export async function getCompliancePaths(): Promise<CompliancePath[]> {
  const snapshot = await adminDb.collection(Collections.COMPLIANCE_PATHS).get();
  return snapshot.docs.map(doc => docToType<CompliancePath>(doc));
}

export async function getCompliancePathById(
  id: string,
): Promise<CompliancePath | undefined> {
  const doc = await adminDb
    .collection(Collections.COMPLIANCE_PATHS)
    .doc(id)
    .get();
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
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (pathId) {
    const docRef = adminDb.collection(Collections.COMPLIANCE_PATHS).doc(pathId);
    await docRef.update(pathData);
    await logAuditEvent('compliance_path.updated', pathId, {}, userId);
    const updatedDoc = await docRef.get();
    return docToType<CompliancePath>(updatedDoc);
  } else {
    const docRef = adminDb.collection(Collections.COMPLIANCE_PATHS).doc();
    const newPathData = {
      ...pathData,
      createdAt: FieldValue.serverTimestamp(),
    };
    await docRef.set(newPathData);
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
      return []; // No users in company, so no logs
    }
  }

  const snapshot = await query.orderBy('createdAt', 'desc').limit(50).get();
  return snapshot.docs.map(doc => docToType<AuditLog>(doc));
}

export async function getAuditLogById(
  id: string,
): Promise<AuditLog | undefined> {
  const doc = await adminDb.collection(Collections.AUDIT_LOGS).doc(id).get();
  return doc.exists ? docToType<AuditLog>(doc) : undefined;
}

export async function getAuditLogsForUser(userId: string): Promise<AuditLog[]> {
  const snapshot = await adminDb
    .collection(Collections.AUDIT_LOGS)
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .limit(50)
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
    .limit(50)
    .get();
  return snapshot.docs.map(doc => docToType<AuditLog>(doc));
}

export async function logAuditEvent(
  action: string,
  entityId: string,
  details: Record<string, any>,
  userId: string,
): Promise<AuditLog> {
  const docRef = adminDb.collection(Collections.AUDIT_LOGS).doc();
  const log: Omit<AuditLog, 'id'> = {
    userId,
    action,
    entityId,
    details,
    createdAt: FieldValue.serverTimestamp() as any, // Cast for type compatibility
    updatedAt: FieldValue.serverTimestamp() as any,
  };
  await docRef.set(log);
  const newDoc = await docRef.get();
  return docToType<AuditLog>(newDoc);
}

export async function getApiKeys(userId: string): Promise<ApiKey[]> {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');
  checkPermission(user, 'developer:manage_api');

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
  if (!user) throw new Error('User not found');
  checkPermission(user, 'developer:manage_api');

  if (keyId) {
    const docRef = adminDb.collection(Collections.API_KEYS).doc(keyId);
    const existingKey = await docRef.get();
    if (!existingKey.exists || existingKey.data()?.userId !== userId)
      throw new Error('API Key not found or permission denied');

    await docRef.update({
      label: validatedData.label,
      scopes: validatedData.scopes,
      updatedAt: FieldValue.serverTimestamp(),
    });
    await logAuditEvent(
      'api_key.updated',
      keyId,
      { changes: ['label', 'scopes'] },
      userId,
    );
    const updatedDoc = await docRef.get();
    return { key: docToType<ApiKey>(updatedDoc) };
  } else {
    const rawToken = `nor_mock_${[...Array(32)]
      .map(() => Math.floor(Math.random() * 16).toString(16))
      .join('')}`;
    const docRef = adminDb.collection(Collections.API_KEYS).doc();
    const newKey = {
      label: validatedData.label,
      scopes: validatedData.scopes,
      token: `nor_mock_******************${rawToken.slice(-4)}`,
      status: 'Active' as const,
      userId,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };
    await docRef.set(newKey);
    await logAuditEvent(
      'api_key.created',
      docRef.id,
      { label: newKey.label },
      userId,
    );
    const newDoc = await docRef.get();
    return { key: docToType<ApiKey>(newDoc), rawToken };
  }
}

export async function revokeApiKey(
  keyId: string,
  userId: string,
): Promise<ApiKey> {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');
  checkPermission(user, 'developer:manage_api');

  const docRef = adminDb.collection(Collections.API_KEYS).doc(keyId);
  const existingKey = await docRef.get();
  if (!existingKey.exists || existingKey.data()?.userId !== userId)
    throw new Error('API Key not found or permission denied');

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
  if (!user) throw new Error('User not found');
  checkPermission(user, 'developer:manage_api');

  const docRef = adminDb.collection(Collections.API_KEYS).doc(keyId);
  const existingKey = await docRef.get();
  if (!existingKey.exists || existingKey.data()?.userId !== userId)
    throw new Error('API Key not found or permission denied');

  await docRef.delete();
  await logAuditEvent('api_key.deleted', keyId, {}, userId);
}

export async function getApiSettings(): Promise<ApiSettings> {
  const doc = await adminDb.collection('settings').doc('api').get();
  if (doc.exists) {
    return doc.data() as ApiSettings;
  }
  // Return default settings if the document doesn't exist
  return {
    isPublicApiEnabled: true,
    rateLimits: { free: 100, pro: 1000, enterprise: 10000 },
    isWebhookSigningEnabled: true,
  };
}

export async function saveApiSettings(
  values: ApiSettingsFormValues,
  userId: string,
): Promise<ApiSettings> {
  const user = await getUserById(userId);
  if (!user) throw new PermissionError('User not found.');
  checkPermission(user, 'admin:manage_settings');

  const validatedData = apiSettingsSchema.parse(values);
  await adminDb
    .collection('settings')
    .doc('api')
    .set(validatedData, { merge: true });
  await logAuditEvent('settings.api.updated', 'global', { values }, userId);
  return validatedData;
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');

  const allLogIds = (await getAuditLogs({ companyId: user.companyId })).map(
    l => l.id,
  );

  await adminDb.collection(Collections.USERS).doc(userId).update({
    readNotificationIds: allLogIds,
  });
}

export async function completeOnboarding(
  values: OnboardingFormValues,
  userId: string,
) {
  const userRef = adminDb.collection(Collections.USERS).doc(userId);
  const companyRef = adminDb.collection(Collections.COMPANIES).doc(); // New company

  const companyData = {
    name: values.companyName,
    industry: values.industry,
    ownerId: userId,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  await adminDb.runTransaction(async transaction => {
    // Create the company
    transaction.set(companyRef, companyData);
    // Update the user
    transaction.update(userRef, {
      companyId: companyRef.id,
      onboardingComplete: true,
      updatedAt: FieldValue.serverTimestamp(),
    });
  });

  await logAuditEvent(
    'user.onboarded',
    userId,
    { companyId: companyRef.id },
    userId,
  );
}

export async function updateUserProfile(
  userId: string,
  fullName: string,
  editorId: string,
) {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');

  const editor = await getUserById(editorId);
  if (!editor) throw new Error('Editor not found');

  checkPermission(editor, 'user:edit', user);

  await adminDb.collection(Collections.USERS).doc(userId).update({
    fullName: fullName,
    updatedAt: FieldValue.serverTimestamp(),
  });
  await adminAuth.updateUser(userId, { displayName: fullName });
  await logAuditEvent(
    'user.profile.updated',
    userId,
    { fields: ['fullName'] },
    editorId,
  );
}

export async function updateUserPassword(
  userId: string,
  newPass: string,
  editorId: string,
) {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');

  const editor = await getUserById(editorId);
  if (!editor) throw new Error('Editor not found');

  checkPermission(editor, 'user:change_password', user);

  await adminAuth.updateUser(userId, { password: newPass });
  await logAuditEvent('user.password.updated', userId, {}, editorId);
}

export async function saveNotificationPreferences(
  userId: string,
  prefs: any,
  editorId: string,
) {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');

  const editor = await getUserById(editorId);
  if (!editor) throw new Error('Editor not found');

  checkPermission(editor, 'user:edit', user);

  // This is a mock implementation. A real one would save to user's doc.
  console.log(`Saving notification preferences for ${userId}`, prefs);
  await logAuditEvent(
    'user.notifications.updated',
    userId,
    { prefs },
    editorId,
  );
  return Promise.resolve();
}

export async function setMfaStatus(
  userId: string,
  status: boolean,
  editorId: string,
) {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');

  const editor = await getUserById(editorId);
  if (!editor) throw new Error('Editor not found');

  checkPermission(editor, 'user:edit', user);

  await adminDb.collection(Collections.USERS).doc(userId).update({
    isMfaEnabled: status,
    updatedAt: FieldValue.serverTimestamp(),
  });
  await logAuditEvent(
    `user.mfa.${status ? 'enabled' : 'disabled'}`,
    userId,
    {},
    editorId,
  );
}

export async function saveSupportTicket(
  values: SupportTicketFormValues,
  userId?: string,
) {
  const validatedData = supportTicketFormSchema.parse(values);
  const docRef = adminDb.collection('supportTickets').doc();
  await docRef.set({
    ...validatedData,
    userId: userId || null,
    status: 'Open',
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  if (userId) {
    await logAuditEvent('support.ticket.created', docRef.id, {}, userId);
  }
}

export async function getServiceTickets(): Promise<ServiceTicket[]> {
  return Promise.resolve(mockServiceTickets);
}

export async function saveServiceTicket(
  values: ServiceTicketFormValues,
  userId: string,
  ticketId?: string,
): Promise<ServiceTicket> {
  const validatedData = serviceTicketFormSchema.parse(values);
  const now = new Date().toISOString();
  let savedTicket: ServiceTicket;

  if (ticketId) {
    const ticketIndex = mockServiceTickets.findIndex(t => t.id === ticketId);
    if (ticketIndex === -1) throw new Error('Ticket not found');
    savedTicket = {
      ...mockServiceTickets[ticketIndex],
      ...validatedData,
      updatedAt: now,
    };
    mockServiceTickets[ticketIndex] = savedTicket;
    await logAuditEvent('ticket.updated', ticketId, {}, userId);
  } else {
    savedTicket = {
      id: newId('tkt'),
      ...validatedData,
      userId,
      createdAt: now,
      updatedAt: now,
    };
    mockServiceTickets.unshift(savedTicket);
    await logAuditEvent('ticket.created', savedTicket.id, {}, userId);
  }
  return Promise.resolve(savedTicket);
}

export async function updateServiceTicketStatus(
  ticketId: string,
  status: 'Open' | 'In Progress' | 'Closed',
  userId: string,
): Promise<ServiceTicket> {
  const ticketIndex = mockServiceTickets.findIndex(t => t.id === ticketId);
  if (ticketIndex === -1) throw new Error('Ticket not found');
  mockServiceTickets[ticketIndex].status = status;
  mockServiceTickets[ticketIndex].updatedAt = new Date().toISOString();
  await logAuditEvent('ticket.status.updated', ticketId, { status }, userId);
  return Promise.resolve(mockServiceTickets[ticketIndex]);
}

export async function getProductionLines(): Promise<ProductionLine[]> {
  return Promise.resolve(mockProductionLines);
}

export async function saveProductionLine(
  values: ProductionLineFormValues,
  userId: string,
  lineId?: string,
): Promise<ProductionLine> {
  const validatedData = productionLineFormSchema.parse(values);
  const now = new Date().toISOString();
  let savedLine: ProductionLine;

  const lineData = {
    ...validatedData,
    outputPerHour: Number(validatedData.outputPerHour),
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
  const index = mockProductionLines.findIndex(l => l.id === lineId);
  if (index > -1) {
    mockProductionLines.splice(index, 1);
    await logAuditEvent('production_line.deleted', lineId, {}, userId);
  }
  return Promise.resolve();
}

export async function getUserByEmail(
  email: string,
): Promise<User | undefined> {
  return authGetUserByEmail(email);
}

export async function signInWithMockUser(
  email: string,
  password: string,
): Promise<{ success: boolean; token?: string; error?: string }> {
  const user = await getUserByEmail(email);

  if (!user) {
    return { success: false, error: 'User not found.' };
  }

  // For mock users, the password is 'password123'
  if (password !== 'password123') {
    return { success: false, error: 'Invalid password for mock user.' };
  }

  // If user is found and password is correct, get custom token.
  try {
    const customToken = await adminAuth.createCustomToken(user.id);
    return { success: true, token: customToken };
  } catch (e: any) {
    console.error('Error during mock sign in flow:', e);
    return { success: false, error: 'Server error during sign in.' };
  }
}

export async function bulkCreateProducts(
  products: any[],
  userId: string,
): Promise<{ createdCount: number }> {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');
  checkPermission(user, 'product:create');

  const company = await getCompanyById(user.companyId);
  if (!company) throw new Error(`Company with ID ${user.companyId} not found.`);

  const batch = adminDb.batch();
  const now = FieldValue.serverTimestamp();

  products.forEach(productData => {
    const docRef = adminDb.collection(Collections.PRODUCTS).doc();
    const newProduct = {
      ...productData,
      companyId: user.companyId,
      supplier: company.name,
      productImage:
        productData.productImage || 'https://placehold.co/400x400.png',
      status: 'Draft',
      lastUpdated: now,
      createdAt: now,
      updatedAt: now,
      endOfLifeStatus: 'Active',
      verificationStatus: 'Not Submitted',
      isProcessing: true,
    };
    batch.set(docRef, newProduct);
  });

  await batch.commit();
  await logAuditEvent(
    'product.bulk_import',
    user.companyId,
    { count: products.length },
    userId,
  );

  return { createdCount: products.length };
}

export async function createProductFromImage(
  imageDataUri: string,
  userId: string,
): Promise<any> {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');
  checkPermission(user, 'product:create');

  return await createProductFromImageFlow({ imageDataUri });
}

export async function runDataValidationCheck(
  productId: string,
  userId: string,
): Promise<void> {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found.');

  const product = await getProductById(productId, user.id);
  if (!product) throw new Error('Product not found or permission denied.');

  checkPermission(user, 'product:validate_data', product);

  // Convert product to the AI schema
  const aiProductInput: AiProduct = {
    productName: product.productName,
    productDescription: product.productDescription,
    category: product.category,
    supplier: product.supplier,
    materials: product.materials,
    gtin: product.gtin,
    manufacturing: product.manufacturing,
    certifications: product.certifications,
    packaging: product.packaging,
    lifecycle: product.lifecycle,
    battery: product.battery,
    compliance: product.compliance,
    verificationStatus: product.verificationStatus ?? 'Not Submitted',
    complianceSummary: product.sustainability?.complianceSummary,
  };

  const { warnings } = await validateProductData({ product: aiProductInput });

  await adminDb.collection(Collections.PRODUCTS).doc(productId).update({
    dataQualityWarnings: warnings,
    lastUpdated: FieldValue.serverTimestamp(),
  });

  await logAuditEvent(
    'product.data.validated',
    productId,
    { warningCount: warnings.length },
    userId,
  );
}

export async function runComplianceCheck(
  productId: string,
  userId: string,
): Promise<void> {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found.');

  const product = await getProductById(productId, user.id);
  if (!product) throw new Error('Product not found or permission denied.');
  if (!product.compliancePathId)
    throw new Error('No compliance path is assigned to this product.');

  checkPermission(user, 'product:run_compliance', product);

  const compliancePath = await getCompliancePathById(product.compliancePathId);
  if (!compliancePath)
    throw new Error(
      `Compliance path ${product.compliancePathId} could not be found.`,
    );

  const aiProductInput: AiProduct = {
    productName: product.productName,
    productDescription: product.productDescription,
    category: product.category,
    supplier: product.supplier,
    materials: product.materials,
    gtin: product.gtin,
    manufacturing: product.manufacturing,
    certifications: product.certifications,
    packaging: product.packaging,
    lifecycle: product.lifecycle,
    battery: product.battery,
    compliance: product.compliance,
    verificationStatus: product.verificationStatus ?? 'Not Submitted',
    complianceSummary: product.sustainability?.complianceSummary,
  };

  const complianceResult = await summarizeComplianceGaps({
    product: aiProductInput,
    compliancePath,
  });

  await adminDb
    .collection(Collections.PRODUCTS)
    .doc(productId)
    .update({
      'sustainability.isCompliant': complianceResult.isCompliant,
      'sustainability.complianceSummary': complianceResult.complianceSummary,
      'sustainability.gaps': complianceResult.gaps ?? [],
      lastUpdated: FieldValue.serverTimestamp(),
      lastVerificationDate: FieldValue.serverTimestamp(),
    });

  await logAuditEvent(
    'product.compliance.checked',
    productId,
    {
      compliant: complianceResult.isCompliant,
      gaps: complianceResult.gaps?.length ?? 0,
    },
    userId,
  );
}
