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
import { validateProductData } from '@/ai/flows/validate-product-data';
import { summarizeComplianceGaps } from '@/ai/flows/summarize-compliance-gaps';
import { adminDb } from './firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

// Helper for mock data manipulation
const newId = (prefix: string) =>
  `${prefix}-${Math.random().toString(36).substring(2, 9)}`;

// --- WEBHOOK ACTIONS ---

export async function getWebhooks(userId: string): Promise<Webhook[]> {
  const user = await getUserById(userId);
  if (!user || !hasRole(user, UserRoles.DEVELOPER)) return [];

  const snapshot = await adminDb
    .collection(Collections.WEBHOOKS)
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .get();

  if (snapshot.empty) {
    return [];
  }
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Webhook);
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

  let query: admin.firestore.Query = adminDb.collection(Collections.PRODUCTS);

  if (!userId) {
    // Public access: only published products
    query = query.where('status', '==', 'Published');
  } else {
    // Authenticated access
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
      query = query.where('companyId', '==', user!.companyId);
    }
  }

  query = query.orderBy('lastUpdated', 'desc');
  const snapshot = await query.get();

  if (snapshot.empty) {
    return [];
  }

  let results = snapshot.docs.map(
    doc => ({ id: doc.id, ...doc.data() }) as Product,
  );

  // Apply search filter if provided (client-side for simplicity, consider server-side for scale)
  if (filters?.searchQuery) {
    const term = filters.searchQuery.toLowerCase();
    results = results.filter(
      p =>
        p.productName.toLowerCase().includes(term) ||
        p.supplier.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term) ||
        p.gtin?.toLowerCase().includes(term),
    );
  }

  return results;
}

export async function getProductById(
  id: string,
  userId?: string,
): Promise<Product | undefined> {
  const docRef = adminDb.collection(Collections.PRODUCTS).doc(id);
  const docSnap = await docRef.get();

  if (!docSnap.exists) {
    return undefined;
  }

  const product = { id: docSnap.id, ...docSnap.data() } as Product;

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

  const now = new Date().toISOString();
  let savedProductData;
  const docRef = productId
    ? adminDb.collection(Collections.PRODUCTS).doc(productId)
    : adminDb.collection(Collections.PRODUCTS).doc();

  if (productId) {
    const existingProduct = await getProductById(productId, user.id);
    if (!existingProduct) throw new Error('Product not found');

    checkPermission(user, 'product:edit', existingProduct);

    if (
      validatedData.status === 'Archived' &&
      existingProduct.status !== 'Archived'
    ) {
      checkPermission(user, 'product:archive', existingProduct);
    }

    savedProductData = {
      ...existingProduct,
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
    await docRef.set(savedProductData, { merge: true });
    await logAuditEvent(
      'product.updated',
      productId,
      { changes: Object.keys(values) },
      userId,
    );
  } else {
    checkPermission(user, 'product:create');
    const company = await getCompanyById(user.companyId);
    if (!company)
      throw new Error(`Company with ID ${user.companyId} not found.`);

    savedProductData = {
      id: docRef.id,
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
    await docRef.set(savedProductData);
    await logAuditEvent('product.created', savedProductData.id, {}, userId);
  }

  return savedProductData as Product;
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
    lastUpdated: new Date().toISOString(),
  });

  await logAuditEvent('passport.submitted', productId, {}, userId);
  const updatedDoc = await docRef.get();
  return { id: updatedDoc.id, ...updatedDoc.data() } as Product;
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
    'sustainability.score': -1, // Sentinel value
    isProcessing: true,
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
    lastUpdated: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  await logAuditEvent('product.image.generated', productId, {}, userId);
  const updatedDoc = await docRef.get();
  return { id: updatedDoc.id, ...updatedDoc.data() } as Product;
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

  const updatedData = {
    verificationStatus: 'Verified' as const,
    status: 'Published' as const,
    lastVerificationDate: new Date().toISOString(),
    blockchainProof,
    ebsiVcId,
  };

  const docRef = adminDb.collection(Collections.PRODUCTS).doc(productId);
  await docRef.update(updatedData);

  const updatedProduct = { ...product, ...updatedData };

  await logAuditEvent(
    'passport.approved',
    productId,
    { txHash: blockchainProof.txHash },
    userId,
  );

  const allWebhooks = await getWebhooks(userId);
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
  const updatedData = {
    verificationStatus: 'Failed',
    lastVerificationDate: new Date().toISOString(),
    'sustainability.complianceSummary': reason,
    'sustainability.gaps': gaps,
  };
  await docRef.update(updatedData);

  await logAuditEvent('passport.rejected', productId, { reason }, userId);
  const updatedDoc = await docRef.get();
  return { id: updatedDoc.id, ...updatedDoc.data() } as Product;
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
    lastUpdated: new Date().toISOString(),
  });

  await logAuditEvent('product.recycled', productId, {}, userId);
  const updatedDoc = await docRef.get();
  return { id: updatedDoc.id, ...updatedDoc.data() } as Product;
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
    lastUpdated: new Date().toISOString(),
  });
  await logAuditEvent('compliance.resolved', productId, {}, userId);
  const updatedDoc = await docRef.get();
  return { id: updatedDoc.id, ...updatedDoc.data() } as Product;
}

export async function suggestImprovements(input: {
  productName: string;
  productDescription: string;
}) {
  return await suggestImprovementsFlow({ product: { ...input } as any });
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
        res[propName] = JSON.stringify(value);
      } else {
        res[propName] = value;
      }
    }
  }
  return res;
};

export async function exportProducts(format: 'csv' | 'json'): Promise<string> {
  const allProducts = await getProducts();
  if (format === 'json') {
    return JSON.stringify(allProducts, null, 2);
  }

  if (allProducts.length === 0) {
    return '';
  }

  const flatProducts = allProducts.map(flattenObject);
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
  const allProducts = await getProducts();
  if (format !== 'csv') {
    throw new Error('Unsupported format for compliance report.');
  }

  if (allProducts.length === 0) {
    return '';
  }

  const complianceData = allProducts.map(p => ({
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

  const now = new Date().toISOString();
  const newRecord: ServiceRecord = {
    id: newId('srv'),
    providerName: user.fullName,
    notes,
    createdAt: now,
    updatedAt: now,
  };

  const docRef = adminDb.collection(Collections.PRODUCTS).doc(productId);
  await docRef.update({
    serviceHistory: FieldValue.arrayUnion(newRecord),
    lastUpdated: now,
  });

  await logAuditEvent('product.serviced', productId, { notes }, userId);

  const updatedDoc = await docRef.get();
  return { id: updatedDoc.id, ...updatedDoc.data() } as Product;
}

// --- ADMIN & GENERAL ACTIONS ---

export async function getCompliancePaths(): Promise<CompliancePath[]> {
  const snapshot = await adminDb
    .collection(Collections.COMPLIANCE_PATHS)
    .get();
  if (snapshot.empty) return [];
  return snapshot.docs.map(
    doc => ({ id: doc.id, ...doc.data() }) as CompliancePath,
  );
}

export async function getCompliancePathById(
  id: string,
): Promise<CompliancePath | undefined> {
  const docSnap = await adminDb
    .collection(Collections.COMPLIANCE_PATHS)
    .doc(id)
    .get();
  return docSnap.exists
    ? ({ id: docSnap.id, ...docSnap.data() } as CompliancePath)
    : undefined;
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

  const now = new Date().toISOString();
  let savedCompany: Company;
  const docRef = companyId
    ? adminDb.collection(Collections.COMPANIES).doc(companyId)
    : adminDb.collection(Collections.COMPANIES).doc();

  if (companyId) {
    savedCompany = {
      id: companyId,
      ...validatedData,
      updatedAt: now,
      createdAt: (await docRef.get()).data()?.createdAt || now,
    };
    await docRef.update({ ...validatedData, updatedAt: now });
    await logAuditEvent('company.updated', companyId, {}, userId);
  } else {
    savedCompany = {
      id: docRef.id,
      ...validatedData,
      createdAt: now,
      updatedAt: now,
    };
    await docRef.set(savedCompany);
    await logAuditEvent('company.created', savedCompany.id, {}, userId);
  }
  return savedCompany;
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

  const now = new Date().toISOString();
  let savedUser: User;
  const docRef = userId
    ? adminDb.collection(Collections.USERS).doc(userId)
    : adminDb.collection(Collections.USERS).doc();

  const userData = {
    fullName: validatedData.fullName,
    email: validatedData.email,
    companyId: validatedData.companyId,
    roles: [validatedData.role as Role],
    updatedAt: now,
  };

  if (userId) {
    savedUser = {
      ...(await getUserById(userId))!,
      ...userData,
    };
    await docRef.update(userData);
    await logAuditEvent('user.updated', userId, {}, adminId);
  } else {
    savedUser = {
      id: docRef.id,
      ...userData,
      createdAt: now,
      onboardingComplete: true,
      isMfaEnabled: false,
    };
    await docRef.set(savedUser);
    await logAuditEvent('user.created', savedUser.id, {}, adminId);
  }
  return savedUser;
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
  const now = new Date().toISOString();

  const docRef = pathId
    ? adminDb.collection(Collections.COMPLIANCE_PATHS).doc(pathId)
    : adminDb.collection(Collections.COMPLIANCE_PATHS).doc();

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

  let savedPath: CompliancePath;
  if (pathId) {
    await docRef.update(pathData);
    savedPath = { id: pathId, createdAt: now, ...pathData };
    await logAuditEvent('compliance_path.updated', pathId, {}, userId);
  } else {
    savedPath = {
      id: docRef.id,
      createdAt: now,
      ...pathData,
    };
    await docRef.set({ createdAt: now, ...pathData });
    await logAuditEvent('compliance_path.created', savedPath.id, {}, userId);
  }
  return savedPath;
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
  let query: admin.firestore.Query = adminDb.collection(Collections.AUDIT_LOGS);

  if (filters?.companyId) {
    const companyUsers = await getUsersByCompanyId(filters.companyId);
    const userIds = companyUsers.map(u => u.id);
    if (userIds.length > 0) {
      query = query.where('userId', 'in', userIds);
    } else {
      return []; // No users in company means no logs.
    }
  }
  if (filters?.entityId) {
    query = query.where('entityId', '==', filters.entityId);
  }
  if (filters?.userId) {
    query = query.where('userId', '==', filters.userId);
  }

  const snapshot = await query.orderBy('createdAt', 'desc').get();
  if (snapshot.empty) return [];
  return snapshot.docs.map(
    doc => ({ id: doc.id, ...doc.data() }) as AuditLog,
  );
}

export async function getAuditLogsForUser(userId: string): Promise<AuditLog[]> {
  return getAuditLogs({ userId });
}

export async function getAuditLogsForEntity(
  entityId: string,
): Promise<AuditLog[]> {
  return getAuditLogs({ entityId });
}

export async function getAuditLogById(
  id: string,
): Promise<AuditLog | undefined> {
  const doc = await adminDb.collection(Collections.AUDIT_LOGS).doc(id).get();
  return doc.exists ? ({ id: doc.id, ...doc.data() } as AuditLog) : undefined;
}

export async function logAuditEvent(
  action: string,
  entityId: string,
  details: Record<string, any>,
  userId: string,
): Promise<AuditLog> {
  const now = new Date().toISOString();
  const log: Omit<AuditLog, 'id'> = {
    userId,
    action,
    entityId,
    details,
    createdAt: now,
    updatedAt: now,
  };
  const docRef = await adminDb.collection(Collections.AUDIT_LOGS).add(log);
  return { id: docRef.id, ...log };
}

export async function saveApiKey(
  values: ApiKeyFormValues,
  userId: string,
  keyId?: string,
): Promise<{ key: ApiKey; rawToken?: string }> {
  const validatedData = apiKeyFormSchema.parse(values);
  const user = await getUserById(userId);
  if (!user) throw new Error('Permission denied.');
  checkPermission(user, 'developer:manage_api');

  const now = new Date().toISOString();
  let savedKey: ApiKey;
  let rawToken: string | undefined = undefined;

  const docRef = keyId
    ? adminDb.collection(Collections.API_KEYS).doc(keyId)
    : adminDb.collection(Collections.API_KEYS).doc();

  if (keyId) {
    const keyData = {
      label: validatedData.label,
      scopes: validatedData.scopes,
      updatedAt: now,
    };
    await docRef.update(keyData);
    savedKey = (await docRef.get()).data() as ApiKey;
    await logAuditEvent('api_key.updated', keyId, { changes: Object.keys(keyData) }, userId);
  } else {
    rawToken = `nor_live_${[...Array(32)].map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`;
    savedKey = {
      id: docRef.id,
      label: validatedData.label,
      scopes: validatedData.scopes,
      token: `nor_live_******************${rawToken.slice(-4)}`,
      status: 'Active',
      userId,
      createdAt: now,
      updatedAt: now,
    };
    await docRef.set(savedKey);
    await logAuditEvent('api_key.created', savedKey.id, { label: savedKey.label }, userId);
  }
  return { key: savedKey, rawToken };
}

export async function revokeApiKey(
  keyId: string,
  userId: string,
): Promise<ApiKey> {
  const user = await getUserById(userId);
  if (!user) {
    throw new PermissionError('You do not have permission to revoke API keys.');
  }
  checkPermission(user, 'developer:manage_api');

  const docRef = adminDb.collection(Collections.API_KEYS).doc(keyId);
  await docRef.update({ status: 'Revoked', updatedAt: new Date().toISOString() });
  await logAuditEvent('api_key.revoked', keyId, {}, userId);
  return (await docRef.get()).data() as ApiKey;
}

export async function deleteApiKey(
  keyId: string,
  userId: string,
): Promise<void> {
  const user = await getUserById(userId);
  if (!user) {
    throw new PermissionError('You do not have permission to delete API keys.');
  }
  checkPermission(user, 'developer:manage_api');
  await adminDb.collection(Collections.API_KEYS).doc(keyId).delete();
  await logAuditEvent('api_key.deleted', keyId, {}, userId);
}

export async function getApiSettings(): Promise<ApiSettings> {
  const docRef = adminDb.collection('settings').doc('api');
  const doc = await docRef.get();
  if (!doc.exists) {
    throw new Error('API settings not found in database.');
  }
  return doc.data() as ApiSettings;
}

export async function saveApiSettings(
  values: ApiSettingsFormValues,
  userId: string,
): Promise<ApiSettings> {
  const user = await getUserById(userId);
  if (!user) throw new Error('Permission denied');
  checkPermission(user, 'admin:manage_settings');

  const validatedData = apiSettingsSchema.parse(values);
  await adminDb.collection('settings').doc('api').set(validatedData);
  await logAuditEvent('settings.api.updated', 'global', { values }, userId);
  return validatedData;
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');
  const logs = await getAuditLogs({ companyId: user.companyId });
  const logIds = logs.map(log => log.id);
  await adminDb.collection(Collections.USERS).doc(userId).update({
    readNotificationIds: logIds,
  });
}

export async function createUserAndCompany(
  name: string,
  email: string,
  userId: string,
) {
  const now = new Date().toISOString();
  const companyRef = adminDb.collection(Collections.COMPANIES).doc();
  const newCompany: Omit<Company, 'id'> = {
    name: `${name}'s Company`,
    ownerId: userId,
    industry: '',
    createdAt: now,
    updatedAt: now,
  };
  await companyRef.set(newCompany);

  const userRef = adminDb.collection(Collections.USERS).doc(userId);
  const newUser: Omit<User, 'id'> = {
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
  const userRef = adminDb.collection(Collections.USERS).doc(userId);
  const userSnap = await userRef.get();
  if (!userSnap.exists) throw new Error('User not found for onboarding');
  const user = userSnap.data() as User;

  const companyRef = adminDb
    .collection(Collections.COMPANIES)
    .doc(user.companyId);

  await companyRef.update({
    name: values.companyName,
    industry: values.industry,
    updatedAt: new Date().toISOString(),
  });

  await userRef.update({
    onboardingComplete: true,
    updatedAt: new Date().toISOString(),
  });

  await logAuditEvent(
    'user.onboarded',
    userId,
    { companyId: user.companyId },
    userId,
  );
}

export async function updateUserProfile(
  userId: string,
  fullName: string,
  actorId: string,
) {
  const userRef = adminDb.collection(Collections.USERS).doc(userId);
  await userRef.update({
    fullName: fullName,
    updatedAt: new Date().toISOString(),
  });
  await logAuditEvent(
    'user.profile.updated',
    userId,
    { fields: ['fullName'] },
    actorId,
  );
}

export async function updateUserPassword(
  userId: string,
  current: string,
  newPass: string,
  actorId: string,
) {
  if (current !== 'password123') throw new Error('Incorrect current password.');
  // In a real app, you would use the Admin SDK to update the user's password in Firebase Auth.
  console.log(
    `Password for user ${userId} has been updated in mock environment.`,
  );
  await logAuditEvent('user.password.updated', userId, {}, actorId);
}

export async function setMfaStatus(
  userId: string,
  enabled: boolean,
  actorId: string,
) {
  await adminDb.collection(Collections.USERS).doc(userId).update({
    isMfaEnabled: enabled,
    updatedAt: new Date().toISOString(),
  });
  await logAuditEvent(
    'user.mfa.updated',
    userId,
    { enabled },
    actorId,
  );
}

export async function saveNotificationPreferences(
  userId: string,
  prefs: any,
  actorId: string,
) {
  console.log(`Saving notification preferences for ${userId}`, prefs);
  await logAuditEvent(
    'user.notifications.updated',
    userId,
    { prefs },
    actorId,
  );
}

export async function getServiceTickets(): Promise<ServiceTicket[]> {
  const snapshot = await adminDb
    .collection(Collections.SERVICE_TICKETS)
    .orderBy('createdAt', 'desc')
    .get();
  if (snapshot.empty) return [];
  return snapshot.docs.map(
    doc => ({ id: doc.id, ...doc.data() }) as ServiceTicket,
  );
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

  const now = new Date().toISOString();
  const docRef = ticketId
    ? adminDb.collection(Collections.SERVICE_TICKETS).doc(ticketId)
    : adminDb.collection(Collections.SERVICE_TICKETS).doc();

  let savedTicket: ServiceTicket;

  if (ticketId) {
    const ticketData = {
      ...validatedData,
      updatedAt: now,
    };
    await docRef.update(ticketData);
    savedTicket = (await docRef.get()).data() as ServiceTicket;
    await logAuditEvent('ticket.updated', ticketId, {}, userId);
  } else {
    savedTicket = {
      id: docRef.id,
      ...validatedData,
      userId,
      createdAt: now,
      updatedAt: now,
    };
    await docRef.set(savedTicket);
    await logAuditEvent('ticket.created', savedTicket.id, {}, userId);
  }
  return savedTicket;
}

export async function saveSupportTicket(
  values: SupportTicketFormValues,
  userId?: string,
): Promise<SupportTicket> {
  const validatedData = supportTicketFormSchema.parse(values);
  const now = new Date().toISOString();
  const newTicket: Omit<SupportTicket, 'id'> = {
    ...validatedData,
    userId,
    status: 'Open',
    createdAt: now,
    updatedAt: now,
  };
  const docRef = await adminDb
    .collection(Collections.SUPPORT_TICKETS)
    .add(newTicket);
  await logAuditEvent(
    'support_ticket.created',
    docRef.id,
    {},
    userId || 'guest',
  );
  return { id: docRef.id, ...newTicket };
}

export async function updateServiceTicketStatus(
  ticketId: string,
  status: 'Open' | 'In Progress' | 'Closed',
  userId: string,
): Promise<ServiceTicket> {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');
  checkPermission(user, 'ticket:update');
  
  const docRef = adminDb.collection(Collections.SERVICE_TICKETS).doc(ticketId);
  await docRef.update({
    status,
    updatedAt: new Date().toISOString(),
  });
  await logAuditEvent('ticket.status.updated', ticketId, { status }, userId);
  const updatedDoc = await docRef.get();
  return { id: updatedDoc.id, ...updatedDoc.data() } as ServiceTicket;
}

export async function getProductionLines(): Promise<ProductionLine[]> {
  const snapshot = await adminDb
    .collection(Collections.PRODUCTION_LINES)
    .orderBy('name', 'asc')
    .get();
  if (snapshot.empty) return [];
  return snapshot.docs.map(
    doc => ({ id: doc.id, ...doc.data() }) as ProductionLine,
  );
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
  const docRef = lineId
    ? adminDb.collection(Collections.PRODUCTION_LINES).doc(lineId)
    : adminDb.collection(Collections.PRODUCTION_LINES).doc();

  const lineData = {
    ...validatedData,
    updatedAt: now,
  };

  if (lineId) {
    await docRef.update(lineData);
    savedLine = (await docRef.get()).data() as ProductionLine;
    await logAuditEvent('production_line.updated', lineId, {}, userId);
  } else {
    savedLine = {
      id: docRef.id,
      ...lineData,
      lastMaintenance: now,
      createdAt: now,
    };
    await docRef.set(savedLine);
    await logAuditEvent('production_line.created', savedLine.id, {}, userId);
  }
  return savedLine;
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

export async function getUserByEmail(
  email: string,
): Promise<User | undefined> {
  return authGetUserByEmail(email);
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
  const productsCollection = adminDb.collection(Collections.PRODUCTS);

  productsToImport.forEach(p => {
    const docRef = productsCollection.doc();
    const now = new Date().toISOString();
    const newProduct = {
      ...p,
      id: docRef.id,
      companyId: user.companyId,
      supplier: company.name,
      status: 'Draft',
      verificationStatus: 'Not Submitted',
      createdAt: now,
      updatedAt: now,
      lastUpdated: now,
      isProcessing: true,
    };
    batch.set(docRef, newProduct);
  });

  await batch.commit();

  await logAuditEvent(
    'product.bulk_import',
    user.companyId,
    { count: productsToImport.length },
    userId,
  );

  return { createdCount: productsToImport.length };
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

export async function runDataValidationCheck(
  productId: string,
  userId: string,
) {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');

  const product = await getProductById(productId, userId);
  if (!product) throw new Error('Product not found');
  checkPermission(user, 'product:validate_data', product);

  const { warnings } = await validateProductData({ product: product as any });
  const docRef = adminDb.collection(Collections.PRODUCTS).doc(productId);
  await docRef.update({
    dataQualityWarnings: warnings,
    lastUpdated: new Date().toISOString(),
  });

  await logAuditEvent(
    'product.validation.run',
    productId,
    { warningsCount: warnings.length },
    userId,
  );
}

export async function runComplianceCheck(productId: string, userId: string) {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');
  const product = await getProductById(productId, userId);
  if (!product) throw new Error('Product not found');
  checkPermission(user, 'product:run_compliance');

  const compliancePathId = product.compliancePathId;
  if (!compliancePathId)
    throw new Error('No compliance path set for product.');

  const compliancePath = await getCompliancePathById(compliancePathId);
  if (!compliancePath) throw new Error('Compliance path not found.');

  const result = await summarizeComplianceGaps({
    product: product as any,
    compliancePath,
  });

  await adminDb
    .collection(Collections.PRODUCTS)
    .doc(productId)
    .update({
      'sustainability.isCompliant': result.isCompliant,
      'sustainability.complianceSummary': result.complianceSummary,
      'sustainability.gaps': result.gaps,
      lastUpdated: new Date().toISOString(),
      lastVerificationDate: new Date().toISOString(),
    });

  await logAuditEvent(
    'product.compliance.run',
    productId,
    { result: result.isCompliant },
    userId,
  );
}

export async function replayWebhook(logId: string, userId: string): Promise<void> {
  const user = await getUserById(userId);
  if (!user) throw new Error("Permission denied.");
  checkPermission(user, "developer:manage_api");

  const log = await getAuditLogById(logId);
  if (!log || log.action !== 'webhook.delivery.failure') {
    throw new Error("Cannot replay this log event.");
  }
  
  const webhookSnapshot = await adminDb.collection(Collections.WEBHOOKS).where('url', '==', log.details.url).limit(1).get();
  if(webhookSnapshot.empty) {
    throw new Error(`Webhook with URL ${log.details.url} not found.`);
  }
  const webhook = {id: webhookSnapshot.docs[0].id, ...webhookSnapshot.docs[0].data()} as Webhook;

  const product = await getProductById(log.details.productId, userId);
  if(!product) {
    throw new Error(`Product ${log.details.productId} not found.`);
  }

  await logAuditEvent('webhook.replay.initiated', webhook.id, {originalLogId: logId}, userId);

  // Re-send the webhook
  await sendWebhook(webhook, log.details.event, product);
}
