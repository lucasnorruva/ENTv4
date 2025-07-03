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
  SupportTicket,
  ServiceRecord,
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
  onboardingFormSchema,
  OnboardingFormValues,
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
  getCompanies,
} from './auth';
import { hasRole } from './auth-utils';
import { sendWebhook } from '@/services/webhooks';
import type { AiProduct } from './ai/schemas';
import { checkPermission, PermissionError } from './permissions';
import { createProductFromImage as createProductFromImageFlow } from '@/ai/flows/create-product-from-image';
import { adminDb, adminAuth } from './firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

// Helper for converting Firestore timestamps
function convertTimestamps<T>(obj: any): T {
  const newObj: { [key: string]: any } = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      if (value instanceof Timestamp) {
        newObj[key] = value.toDate().toISOString();
      } else if (value && typeof value === 'object' && !Array.isArray(value)) {
        newObj[key] = convertTimestamps(value);
      } else {
        newObj[key] = value;
      }
    }
  }
  return newObj as T;
}

// --- WEBHOOK ACTIONS ---

export async function getWebhooks(userId: string): Promise<Webhook[]> {
  const user = await getUserById(userId);
  if (!user || !hasRole(user, UserRoles.DEVELOPER)) return [];

  const snapshot = await adminDb
    .collection(Collections.WEBHOOKS)
    .where('userId', '==', userId)
    .get();

  return snapshot.docs.map(doc => convertTimestamps<Webhook>({ id: doc.id, ...doc.data() }));
}

export async function getWebhookById(
  id: string,
  userId: string,
): Promise<Webhook | undefined> {
  const user = await getUserById(userId);
  if (!user || !hasRole(user, UserRoles.DEVELOPER)) return undefined;

  const doc = await adminDb.collection(Collections.WEBHOOKS).doc(id).get();
  const webhook = doc.data() as Webhook | undefined;

  if (!webhook || webhook.userId !== userId) {
    return undefined;
  }
  return convertTimestamps<Webhook>({ id: doc.id, ...webhook });
}

export async function saveWebhook(
  values: WebhookFormValues,
  userId: string,
  webhookId?: string,
): Promise<Webhook> {
  const validatedData = webhookFormSchema.parse(values);
  const user = await getUserById(userId);
  if (!user || !hasRole(user, UserRoles.DEVELOPER)) {
    throw new PermissionError('Permission denied.');
  }

  const now = Timestamp.now();
  let savedWebhook: Webhook;
  let docRef;

  if (webhookId) {
    docRef = adminDb.collection(Collections.WEBHOOKS).doc(webhookId);
    await docRef.update({ ...validatedData, updatedAt: now });
    await logAuditEvent(
      'webhook.updated',
      webhookId,
      { changes: Object.keys(values) },
      userId,
    );
  } else {
    docRef = adminDb.collection(Collections.WEBHOOKS).doc();
    const newWebhook = {
      ...validatedData,
      id: docRef.id,
      userId,
      createdAt: now,
      updatedAt: now,
    };
    await docRef.set(newWebhook);
    await logAuditEvent('webhook.created', docRef.id, { url: validatedData.url }, userId);
  }
  const docSnap = await docRef.get();
  savedWebhook = convertTimestamps<Webhook>({ id: docSnap.id, ...docSnap.data() });
  return savedWebhook;
}

export async function deleteWebhook(
  webhookId: string,
  userId: string,
): Promise<void> {
  const user = await getUserById(userId);
  if (!user || !hasRole(user, UserRoles.DEVELOPER)) {
    throw new PermissionError('Permission denied.');
  }

  const docRef = adminDb.collection(Collections.WEBHOOKS).doc(webhookId);
  const doc = await docRef.get();
  if (doc.exists && doc.data()?.userId === userId) {
    await docRef.delete();
    await logAuditEvent('webhook.deleted', webhookId, {}, userId);
  }
}

// --- PRODUCT ACTIONS ---

export async function getProducts(
  userId?: string,
  filters?: { searchQuery?: string },
): Promise<Product[]> {
  let user: User | undefined;
  if (userId) {
    user = await getUserById(userId);
    if (!user) return [];
  }

  let productsQuery: admin.firestore.Query<admin.firestore.DocumentData> =
    adminDb.collection(Collections.PRODUCTS);

  if (!userId) {
    productsQuery = productsQuery.where('status', '==', 'Published');
  } else {
    const globalReadRoles: Role[] = [
      UserRoles.ADMIN,
      UserRoles.AUDITOR,
      UserRoles.BUSINESS_ANALYST,
      UserRoles.COMPLIANCE_MANAGER,
      UserRoles.DEVELOPER,
      UserRoles.MANUFACTURER,
      UserRoles.RECYCLER,
      UserRoles.SERVICE_PROVIDER,
      UserRoles.RETAILER,
    ];

    const hasGlobalRead = globalReadRoles.some(role => hasRole(user!, role));
    if (!hasGlobalRead) {
      productsQuery = productsQuery.where('companyId', '==', user!.companyId);
    }
  }

  const snapshot = await productsQuery.orderBy('lastUpdated', 'desc').get();
  if (snapshot.empty) return [];
  
  let products = snapshot.docs.map(doc => convertTimestamps<Product>({ id: doc.id, ...doc.data() }));

  if (filters?.searchQuery) {
    const query = filters.searchQuery.toLowerCase();
    products = products.filter(
      p =>
        p.productName.toLowerCase().includes(query) ||
        p.supplier.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query) ||
        p.gtin?.toLowerCase().includes(query),
    );
  }

  return products;
}

export async function getProductById(
  id: string,
  userId?: string,
): Promise<Product | undefined> {
  const docSnap = await adminDb.collection(Collections.PRODUCTS).doc(id).get();
  if (!docSnap.exists) return undefined;

  const product = convertTimestamps<Product>({ id: docSnap.id, ...docSnap.data() });

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

  const now = Timestamp.now();
  let savedProduct: Product;
  let docRef;

  if (productId) {
    docRef = adminDb.collection(Collections.PRODUCTS).doc(productId);
    const existingProduct = await getProductById(productId, user.id);
    if (!existingProduct) throw new Error('Product not found');

    checkPermission(user, 'product:edit', existingProduct);
    
    if (validatedData.status === 'Archived' && existingProduct.status !== 'Archived') {
        checkPermission(user, 'product:archive', existingProduct);
    }
    
    const updateData = {
      ...validatedData,
      lastUpdated: now,
      updatedAt: now,
      isProcessing: true,
    };
    await docRef.update(updateData);
    await logAuditEvent('product.updated', productId, { changes: Object.keys(values) }, userId);
  } else {
    checkPermission(user, 'product:create');
    const company = await getCompanyById(user.companyId);
    if (!company) throw new Error(`Company with ID ${user.companyId} not found.`);

    docRef = adminDb.collection(Collections.PRODUCTS).doc();
    const newProduct = {
      id: docRef.id,
      ...validatedData,
      companyId: user.companyId,
      supplier: company.name,
      productImage: validatedData.productImage || 'https://placehold.co/400x400.png',
      createdAt: now,
      updatedAt: now,
      lastUpdated: now,
      endOfLifeStatus: 'Active' as const,
      verificationStatus: 'Not Submitted' as const,
      materials: validatedData.materials || [],
      isProcessing: true,
    };
    await docRef.set(newProduct);
    await logAuditEvent('product.created', newProduct.id, {}, userId);
  }

  const finalDoc = await docRef.get();
  savedProduct = convertTimestamps<Product>({ id: finalDoc.id, ...finalDoc.data() });

  return savedProduct;
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
    lastUpdated: Timestamp.now(),
  });
  await logAuditEvent('passport.submitted', productId, {}, userId);
  const updatedDoc = await docRef.get();
  return convertTimestamps<Product>({ id: updatedDoc.id, ...updatedDoc.data() });
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
  
  const docRef = adminDb.collection(Collections.PRODUCTS).doc(productId);
  await docRef.update({
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
  if (!productName || !productDescription) {
    throw new Error('Product name and description are required to generate an image.');
  }

  const { imageUrl } = await generateProductImage({
    productName,
    productDescription,
    contextImageDataUri,
  });

  const docRef = adminDb.collection(Collections.PRODUCTS).doc(productId);
  await docRef.update({
    productImage: imageUrl,
    lastUpdated: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  await logAuditEvent('product.image.generated', productId, {}, userId);

  const updatedDoc = await docRef.get();
  return convertTimestamps<Product>({ id: updatedDoc.id, ...updatedDoc.data() });
}

export async function approvePassport(
  productId: string,
  userId: string,
): Promise<Product> {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');
  
  checkPermission(user, 'product:approve');
  
  const product = await getProductById(productId, userId);
  if (!product) throw new Error('Product not found');
  
  const productHash = await hashProductData(product);
  const blockchainProof = await anchorToPolygon(product.id, productHash);
  const ebsiVcId = await generateEbsiCredential(product.id);

  const docRef = adminDb.collection(Collections.PRODUCTS).doc(productId);
  await docRef.update({
    verificationStatus: 'Verified',
    status: 'Published',
    lastVerificationDate: Timestamp.now(),
    blockchainProof,
    ebsiVcId,
  });

  const updatedProduct = (await docRef.get()).data() as Product;
  await logAuditEvent('passport.approved', productId, { txHash: blockchainProof.txHash }, userId);

  const webhooksSnapshot = await adminDb.collection(Collections.WEBHOOKS).where('status', '==', 'active').get();
  webhooksSnapshot.docs.forEach(doc => {
    const webhook = doc.data() as Webhook;
    if (webhook.events.includes('product.published')) {
      sendWebhook(webhook, 'product.published', updatedProduct);
    }
  });

  return convertTimestamps<Product>({ id: docRef.id, ...updatedProduct });
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
    lastVerificationDate: Timestamp.now(),
    'sustainability.complianceSummary': reason,
    'sustainability.gaps': gaps,
  });
  
  await logAuditEvent('passport.rejected', productId, { reason }, userId);
  const updatedDoc = await docRef.get();
  return convertTimestamps<Product>({ id: updatedDoc.id, ...updatedDoc.data() });
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
    lastUpdated: Timestamp.now(),
  });
  await logAuditEvent('product.recycled', productId, {}, userId);
  const updatedDoc = await docRef.get();
  return convertTimestamps<Product>({ id: updatedDoc.id, ...updatedDoc.data() });
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
    lastUpdated: Timestamp.now(),
  });

  await logAuditEvent('compliance.resolved', productId, {}, userId);
  const updatedDoc = await docRef.get();
  return convertTimestamps<Product>({ id: updatedDoc.id, ...updatedDoc.data() });
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

export async function bulkCreateProducts(
  productsToImport: any[],
  userId: string,
): Promise<{ createdCount: number }> {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');
  checkPermission(user, 'product:create');

  const company = await getCompanyById(user.companyId);
  if (!company) throw new Error('Company not found');

  const batch = adminDb.batch();
  productsToImport.forEach(p => {
    const docRef = adminDb.collection(Collections.PRODUCTS).doc();
    const now = Timestamp.now();
    const newProduct: Omit<Product, 'id'> = {
      ...p,
      companyId: user.companyId,
      supplier: company.name,
      status: 'Draft',
      verificationStatus: 'Not Submitted',
      createdAt: now.toDate().toISOString(),
      updatedAt: now.toDate().toISOString(),
      lastUpdated: now.toDate().toISOString(),
      isProcessing: true,
    };
    batch.set(docRef, newProduct);
  });

  await batch.commit();
  await logAuditEvent('product.bulk_import', user.companyId, { count: productsToImport.length }, userId);

  return Promise.resolve({ createdCount: productsToImport.length });
}

export async function createProductFromImage(
  imageDataUri: string,
  userId: string,
): Promise<any> {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');
  checkPermission(user, 'product:create');

  return createProductFromImageFlow({ imageDataUri });
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

export async function addServiceRecord(
  productId: string,
  notes: string,
  userId: string,
): Promise<Product> {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');

  const product = await getProductById(productId, userId);
  if (!product) throw new Error('Product not found');
  
  checkPermission(user, 'product:add_service_record');
  
  const docRef = adminDb.collection(Collections.PRODUCTS).doc(productId);
  const now = Timestamp.now();
  const newRecord: ServiceRecord = {
    id: adminDb.collection('id').doc().id, // Generate a random ID
    providerName: user.fullName,
    notes,
    createdAt: now.toDate().toISOString(),
    updatedAt: now.toDate().toISOString(),
  };

  await docRef.update({
    serviceHistory: admin.firestore.FieldValue.arrayUnion(newRecord),
    lastUpdated: now,
  });

  await logAuditEvent('product.serviced', productId, { notes }, userId);
  
  const updatedDoc = await docRef.get();
  return convertTimestamps<Product>({ id: updatedDoc.id, ...updatedDoc.data() });
}


// --- ADMIN & GENERAL ACTIONS ---

export async function getCompliancePaths(): Promise<CompliancePath[]> {
    const snapshot = await adminDb.collection(Collections.COMPLIANCE_PATHS).get();
    if (snapshot.empty) return [];
    return snapshot.docs.map(doc => convertTimestamps<CompliancePath>({ id: doc.id, ...doc.data() }));
}

export async function getCompliancePathById(
  id: string,
): Promise<CompliancePath | undefined> {
    const doc = await adminDb.collection(Collections.COMPLIANCE_PATHS).doc(id).get();
    if (!doc.exists) return undefined;
    return convertTimestamps<CompliancePath>({ id: doc.id, ...doc.data() });
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
  
  const now = Timestamp.now();
  let docRef;

  if (companyId) {
    docRef = adminDb.collection(Collections.COMPANIES).doc(companyId);
    await docRef.update({ ...validatedData, updatedAt: now });
    await logAuditEvent('company.updated', companyId, {}, userId);
  } else {
    docRef = adminDb.collection(Collections.COMPANIES).doc();
    const newCompany = { id: docRef.id, ...validatedData, createdAt: now, updatedAt: now };
    await docRef.set(newCompany);
    await logAuditEvent('company.created', newCompany.id, {}, userId);
  }
  const docSnap = await docRef.get();
  return convertTimestamps<Company>({ id: docSnap.id, ...docSnap.data() });
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

  const now = Timestamp.now();
  let docRef;

  const userData = {
    fullName: validatedData.fullName,
    email: validatedData.email,
    companyId: validatedData.companyId,
    roles: [validatedData.role as Role],
    updatedAt: now,
  };

  if (userId) {
    docRef = adminDb.collection(Collections.USERS).doc(userId);
    await docRef.update(userData);
    await logAuditEvent('user.updated', userId, {}, adminId);
  } else {
    docRef = adminDb.collection(Collections.USERS).doc();
    const newUser = {
      id: docRef.id,
      ...userData,
      createdAt: now,
      onboardingComplete: true,
      isMfaEnabled: false,
      readNotificationIds: [],
    };
    await docRef.set(newUser);
    await logAuditEvent('user.created', newUser.id, {}, adminId);
  }
  const docSnap = await docRef.get();
  return convertTimestamps<User>({ id: docSnap.id, ...docSnap.data() });
}

export async function deleteUser(userId: string, adminId: string): Promise<void> {
  const adminUser = await getUserById(adminId);
  if (!adminUser) throw new Error('Admin user not found');
  checkPermission(adminUser, 'user:manage');

  await adminDb.collection(Collections.USERS).doc(userId).delete();
  await logAuditEvent('user.deleted', userId, {}, adminId);
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
  const now = Timestamp.now();
  let docRef;

  const pathData = {
    name: validatedData.name,
    description: validatedData.description,
    category: validatedData.category,
    regulations: validatedData.regulations
      .split(',')
      .map(s => s.trim())
      .filter(Boolean),
    rules: {
      minSustainabilityScore: validatedData.minSustainabilityScore,
      requiredKeywords: validatedData.requiredKeywords
        ?.split(',')
        .map(s => s.trim())
        .filter(Boolean),
      bannedKeywords: validatedData.bannedKeywords
        ?.split(',')
        .map(s => s.trim())
        .filter(Boolean),
    },
    updatedAt: now,
  };

  if (pathId) {
    docRef = adminDb.collection(Collections.COMPLIANCE_PATHS).doc(pathId);
    await docRef.update(pathData);
    await logAuditEvent('compliance_path.updated', pathId, {}, userId);
  } else {
    docRef = adminDb.collection(Collections.COMPLIANCE_PATHS).doc();
    const newPath = { id: docRef.id, ...pathData, createdAt: now };
    await docRef.set(newPath);
    await logAuditEvent('compliance_path.created', newPath.id, {}, userId);
  }

  const docSnap = await docRef.get();
  return convertTimestamps<CompliancePath>({ id: docSnap.id, ...docSnap.data() });
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
  entityId?: string;
  userId?: string;
}): Promise<AuditLog[]> {
  let query: admin.firestore.Query<admin.firestore.DocumentData> = adminDb.collection(Collections.AUDIT_LOGS);

  if (filters?.entityId) {
    query = query.where('entityId', '==', filters.entityId);
  }
  if (filters?.userId) {
    query = query.where('userId', '==', filters.userId);
  }
  
  let logs = (await query.orderBy('createdAt', 'desc').get()).docs.map(doc => convertTimestamps<AuditLog>({ id: doc.id, ...doc.data() }));

  if (filters?.companyId) {
    const companyUsers = await getUsersByCompanyId(filters.companyId);
    const userIds = new Set(companyUsers.map(u => u.id));
    logs = logs.filter(log => userIds.has(log.userId));
  }
  
  return logs;
}

export async function getAuditLogsForUser(userId: string): Promise<AuditLog[]> {
  return getAuditLogs({ userId });
}

export async function getAuditLogsForEntity(
  entityId: string,
): Promise<AuditLog[]> {
  return getAuditLogs({ entityId });
}

export async function getAuditLogById(id: string): Promise<AuditLog | undefined> {
  const doc = await adminDb.collection(Collections.AUDIT_LOGS).doc(id).get();
  if (!doc.exists) return undefined;
  return convertTimestamps<AuditLog>({ id: doc.id, ...doc.data() });
}

export async function logAuditEvent(
  action: string,
  entityId: string,
  details: Record<string, any>,
  userId: string,
): Promise<AuditLog> {
  const now = Timestamp.now();
  const docRef = adminDb.collection(Collections.AUDIT_LOGS).doc();
  const log = {
    id: docRef.id,
    userId,
    action,
    entityId,
    details,
    createdAt: now,
    updatedAt: now,
  };
  await docRef.set(log);
  return convertTimestamps<AuditLog>(log);
}

export async function saveApiKey(
  values: ApiKeyFormValues,
  userId: string,
  keyId?: string,
): Promise<{ key: ApiKey; rawToken?: string }> {
  const validatedData = apiKeyFormSchema.parse(values);
  const user = await getUserById(userId);
  if (!user || !hasRole(user, UserRoles.DEVELOPER)) throw new PermissionError('Permission denied.');

  const now = Timestamp.now();
  let docRef;
  let rawToken: string | undefined = undefined;

  if (keyId) {
    docRef = adminDb.collection(Collections.API_KEYS).doc(keyId);
    await docRef.update({ ...validatedData, updatedAt: now });
    await logAuditEvent('api_key.updated', keyId, { changes: ['label', 'scopes'] }, userId);
  } else {
    rawToken = `nor_mock_${Buffer.from(docRef.id).toString('hex')}`;
    docRef = adminDb.collection(Collections.API_KEYS).doc();
    const newKey = {
      id: docRef.id,
      ...validatedData,
      token: `nor_mock_******************${rawToken.slice(-4)}`,
      status: 'Active' as const,
      userId,
      createdAt: now,
      updatedAt: now,
    };
    await docRef.set(newKey);
    await logAuditEvent('api_key.created', newKey.id, { label: newKey.label }, userId);
  }

  const docSnap = await docRef.get();
  const savedKey = convertTimestamps<ApiKey>({ id: docSnap.id, ...docSnap.data() });
  return { key: savedKey, rawToken };
}

export async function revokeApiKey(
  keyId: string,
  userId: string,
): Promise<ApiKey> {
  const user = await getUserById(userId);
  if (!user || !hasRole(user, UserRoles.DEVELOPER)) {
    throw new PermissionError('You do not have permission to revoke API keys.');
  }
  const docRef = adminDb.collection(Collections.API_KEYS).doc(keyId);
  await docRef.update({ status: 'Revoked', updatedAt: Timestamp.now() });
  await logAuditEvent('api_key.revoked', keyId, {}, userId);
  const docSnap = await docRef.get();
  return convertTimestamps<ApiKey>({ id: docSnap.id, ...docSnap.data() });
}

export async function deleteApiKey(
  keyId: string,
  userId: string,
): Promise<void> {
  const user = await getUserById(userId);
  if (!user || !hasRole(user, UserRoles.DEVELOPER)) {
    throw new PermissionError('You do not have permission to delete API keys.');
  }
  await adminDb.collection(Collections.API_KEYS).doc(keyId).delete();
  await logAuditEvent('api_key.deleted', keyId, {}, userId);
}

export async function getApiSettings(): Promise<ApiSettings> {
  const doc = await adminDb.collection('settings').doc('api').get();
  if (!doc.exists) throw new Error("API settings not found");
  return doc.data() as ApiSettings;
}

export async function saveApiSettings(
  values: ApiSettingsFormValues,
  userId: string,
): Promise<ApiSettings> {
  const validatedData = apiSettingsSchema.parse(values);
  await adminDb.collection('settings').doc('api').set(validatedData);
  await logAuditEvent('settings.api.updated', 'global', { values }, userId);
  return validatedData;
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');
  const logsSnapshot = await adminDb.collection(Collections.AUDIT_LOGS).get();
  const allLogIds = logsSnapshot.docs.map(doc => doc.id);
  
  await adminDb.collection(Collections.USERS).doc(userId).update({
    readNotificationIds: allLogIds
  });
}

export async function createUserAndCompany(
  name: string,
  email: string,
  userId: string,
) {
  const now = Timestamp.now();
  
  const companyRef = adminDb.collection(Collections.COMPANIES).doc();
  const newCompany = {
    id: companyRef.id,
    name: `${name}'s Company`,
    ownerId: userId,
    industry: '',
    createdAt: now,
    updatedAt: now,
  };
  await companyRef.set(newCompany);

  const userRef = adminDb.collection(Collections.USERS).doc(userId);
  const newUser = {
    id: userId,
    fullName: name,
    email: email,
    companyId: companyRef.id,
    roles: [UserRoles.SUPPLIER],
    createdAt: now,
    updatedAt: now,
    onboardingComplete: false,
    isMfaEnabled: false,
    readNotificationIds: [],
  };
  await userRef.set(newUser);
}

export async function completeOnboarding(
  values: OnboardingFormValues,
  userId: string,
) {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');

  const now = Timestamp.now();
  const userRef = adminDb.collection(Collections.USERS).doc(userId);
  const companyRef = adminDb.collection(Collections.COMPANIES).doc(user.companyId);

  await adminDb.runTransaction(async (transaction) => {
    transaction.update(companyRef, { name: values.companyName, industry: values.industry, updatedAt: now });
    transaction.update(userRef, { onboardingComplete: true, updatedAt: now });
  });

  await logAuditEvent('user.onboarded', userId, { companyId: user.companyId }, userId);
}

export async function updateUserProfile(
  userId: string,
  fullName: string,
  actorId: string,
) {
  const userRef = adminDb.collection(Collections.USERS).doc(userId);
  await userRef.update({ fullName, updatedAt: Timestamp.now() });
  await logAuditEvent('user.profile.updated', userId, { fields: ['fullName'] }, actorId);
}

export async function updateUserPassword(
  userId: string,
  current: string,
  newPass: string,
  actorId: string,
) {
  if (current !== 'password123') throw new Error('Incorrect current password.');
  // In a real app, you'd use the Firebase Admin SDK to update the user's password in Auth.
  // This is a mock action.
  console.log(`Password for user ${userId} has been updated in mock environment.`);
  await logAuditEvent('user.password.updated', userId, {}, actorId);
}

export async function setMfaStatus(
  userId: string,
  enabled: boolean,
  actorId: string,
) {
  await adminDb.collection(Collections.USERS).doc(userId).update({ isMfaEnabled: enabled });
  await logAuditEvent('user.mfa.updated', userId, { enabled }, actorId);
}

export async function saveNotificationPreferences(
  userId: string,
  prefs: any,
  actorId: string,
) {
  // This is a mock action. In a real app, you would save this to the user's document.
  console.log(`Saving notification preferences for ${userId}`, prefs);
  await logAuditEvent('user.notifications.updated', userId, { prefs }, actorId);
}

export async function getServiceTickets(): Promise<ServiceTicket[]> {
  const snapshot = await adminDb.collection(Collections.SERVICE_TICKETS).orderBy('createdAt', 'desc').get();
  return snapshot.docs.map(doc => convertTimestamps<ServiceTicket>({ id: doc.id, ...doc.data() }));
}

export async function saveServiceTicket(
  values: ServiceTicketFormValues,
  userId: string,
  ticketId?: string,
): Promise<ServiceTicket> {
  const validatedData = serviceTicketFormSchema.parse(values);
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');
  checkPermission(user, 'ticket:create');
  
  const now = Timestamp.now();
  let docRef;

  if (ticketId) {
    docRef = adminDb.collection(Collections.SERVICE_TICKETS).doc(ticketId);
    await docRef.update({ ...validatedData, updatedAt: now });
    await logAuditEvent('ticket.updated', ticketId, {}, userId);
  } else {
    docRef = adminDb.collection(Collections.SERVICE_TICKETS).doc();
    const newTicket = { id: docRef.id, ...validatedData, userId, createdAt: now, updatedAt: now };
    await docRef.set(newTicket);
    await logAuditEvent('ticket.created', newTicket.id, {}, userId);
  }
  const docSnap = await docRef.get();
  return convertTimestamps<ServiceTicket>({ id: docSnap.id, ...docSnap.data() });
}

export async function saveSupportTicket(
  values: SupportTicketFormValues,
  userId?: string,
): Promise<SupportTicket> {
  const validatedData = supportTicketFormSchema.parse(values);
  const now = Timestamp.now();
  const docRef = adminDb.collection(Collections.SUPPORT_TICKETS).doc();
  const newTicket = {
    id: docRef.id,
    ...validatedData,
    userId,
    status: 'Open' as const,
    createdAt: now,
    updatedAt: now,
  };
  await docRef.set(newTicket);
  await logAuditEvent('support_ticket.created', newTicket.id, {}, userId || 'guest');
  return convertTimestamps<SupportTicket>(newTicket);
}

export async function updateServiceTicketStatus(
  ticketId: string,
  status: 'Open' | 'In Progress' | 'Closed',
  userId: string,
): Promise<ServiceTicket> {
  const docRef = adminDb.collection(Collections.SERVICE_TICKETS).doc(ticketId);
  await docRef.update({ status, updatedAt: Timestamp.now() });
  await logAuditEvent('ticket.status.updated', ticketId, { status }, userId);
  const docSnap = await docRef.get();
  return convertTimestamps<ServiceTicket>({ id: docSnap.id, ...docSnap.data() });
}

export async function getProductionLines(): Promise<ProductionLine[]> {
  const snapshot = await adminDb.collection(Collections.PRODUCTION_LINES).orderBy('createdAt', 'desc').get();
  return snapshot.docs.map(doc => convertTimestamps<ProductionLine>({ id: doc.id, ...doc.data() }));
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
  const now = Timestamp.now();
  let docRef;

  const lineData = {
    ...validatedData,
    outputPerHour: Number(validatedData.outputPerHour),
    updatedAt: now,
  };

  if (lineId) {
    docRef = adminDb.collection(Collections.PRODUCTION_LINES).doc(lineId);
    await docRef.update(lineData);
    await logAuditEvent('production_line.updated', lineId, {}, userId);
  } else {
    docRef = adminDb.collection(Collections.PRODUCTION_LINES).doc();
    const newLine = { id: docRef.id, ...lineData, lastMaintenance: now, createdAt: now };
    await docRef.set(newLine);
    await logAuditEvent('production_line.created', newLine.id, {}, userId);
  }
  const docSnap = await docRef.get();
  return convertTimestamps<ProductionLine>({ id: docSnap.id, ...docSnap.data() });
}

export async function deleteProductionLine(
  lineId: string,
  userId: string,
): Promise<void> {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');
  checkPermission(user, 'manufacturer:manage_lines');

  await adminDb.collection(Collections.PRODUCTION_LINES).doc(lineId).delete();
  await logAuditEvent('production_line.deleted', lineId, {}, userId);
}
