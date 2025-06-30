// src/lib/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
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
} from './schemas';
import {
  anchorToPolygon,
  generateEbsiCredential,
  hashProductData,
} from '@/services/blockchain';
import { suggestImprovements } from '@/ai/flows/enhance-passport-information';
import { calculateSustainability } from '@/ai/flows/calculate-sustainability';
import { summarizeComplianceGaps } from '@/ai/flows/summarize-compliance-gaps';
import { generateQRLabelText } from '@/ai/flows/generate-qr-label-text';
import { validateProductData } from '@/ai/flows/validate-product-data';
import type {
  SuggestImprovementsInput,
  SuggestImprovementsOutput,
} from '@/types/ai-outputs';
import { AiProduct } from '@/ai/schemas';

import admin, { adminDb } from './firebase-admin';
import { Collections, UserRoles } from './constants';
import { getUserById } from './auth';

// Helper to convert Firestore Timestamps to ISO strings
const fromTimestamp = (
  timestamp: admin.firestore.Timestamp | string | undefined,
): string => {
  if (timestamp instanceof admin.firestore.Timestamp) {
    return timestamp.toDate().toISOString();
  }
  return timestamp || new Date().toISOString();
};

const docToProduct = (
  doc: admin.firestore.DocumentSnapshot<admin.firestore.DocumentData>,
): Product => {
  const data = doc.data() as Omit<Product, 'id'>;
  return {
    ...data,
    id: doc.id,
    createdAt: fromTimestamp(data.createdAt),
    updatedAt: fromTimestamp(data.updatedAt),
    lastUpdated: fromTimestamp(data.lastUpdated),
    lastVerificationDate: data.lastVerificationDate
      ? fromTimestamp(data.lastVerificationDate)
      : undefined,
  };
};

// --- PRODUCT ACTIONS ---

export async function getProducts(userId?: string): Promise<Product[]> {
  const productsRef = adminDb.collection(Collections.PRODUCTS);
  let query: admin.firestore.Query = productsRef;

  if (userId) {
    const user = await getUserById(userId);
    if (!user) return [];
    if (!user.roles.includes(UserRoles.ADMIN)) {
      query = query.where('companyId', '==', user.companyId);
    }
  }

  const snapshot = await query.orderBy('lastUpdated', 'desc').get();
  if (snapshot.empty) return [];

  return snapshot.docs.map(docToProduct);
}

export async function getProductById(
  id: string,
  userId?: string,
): Promise<Product | undefined> {
  const doc = await adminDb.collection(Collections.PRODUCTS).doc(id).get();
  if (!doc.exists) return undefined;

  const product = docToProduct(doc);

  if (!userId) {
    return product.status === 'Published' ? product : undefined;
  }
  const user = await getUserById(userId);
  if (!user) return undefined;

  if (
    user.roles.includes(UserRoles.ADMIN) ||
    user.companyId === product.companyId
  ) {
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

  const now = admin.firestore.Timestamp.now();
  let productRef: admin.firestore.DocumentReference;
  let productData: Partial<Product>;

  if (productId) {
    productRef = adminDb.collection(Collections.PRODUCTS).doc(productId);
    const doc = await productRef.get();
    if (!doc.exists) throw new Error('Product not found');
    const existingProduct = docToProduct(doc);
    productData = {
      ...validatedData,
      lastUpdated: fromTimestamp(now),
      updatedAt: fromTimestamp(now),
      verificationStatus:
        existingProduct.verificationStatus === 'Failed'
          ? 'Not Submitted'
          : existingProduct.verificationStatus,
    };
    await productRef.update(productData);
    await logAuditEvent('product.updated', productId, { changes: Object.keys(values) }, userId);
  } else {
    productRef = adminDb.collection(Collections.PRODUCTS).doc();
    productData = {
      ...validatedData,
      companyId: user.companyId,
      supplier: 'GreenTech Supplies', // Placeholder
      productImage:
        validatedData.productImage || 'https://placehold.co/400x400.png',
      createdAt: fromTimestamp(now),
      updatedAt: fromTimestamp(now),
      lastUpdated: fromTimestamp(now),
      endOfLifeStatus: 'Active',
      verificationStatus: 'Not Submitted',
      materials: validatedData.materials || [],
    };
    await productRef.set(productData);
    await logAuditEvent('product.created', productRef.id, {}, userId);
  }

  const finalProduct = await getProductById(productRef.id, userId);
  if (!finalProduct) throw new Error('Failed to retrieve saved product');

  return finalProduct;
}

export async function deleteProduct(
  productId: string,
  userId: string,
): Promise<void> {
  await adminDb.collection(Collections.PRODUCTS).doc(productId).delete();
  await logAuditEvent('product.deleted', productId, {}, userId);
}

export async function submitForReview(
  productId: string,
  userId: string,
): Promise<Product> {
  const productRef = adminDb.collection(Collections.PRODUCTS).doc(productId);
  await productRef.update({
    verificationStatus: 'Pending',
    lastUpdated: admin.firestore.Timestamp.now(),
  });
  await logAuditEvent('passport.submitted', productId, {}, userId);
  return (await getProductById(productId, userId))!;
}

export async function recalculateScore(
  productId: string,
  userId: string,
): Promise<Product> {
  const product = await getProductById(productId, userId);
  if (!product) throw new Error('Product not found');

  const {
    productName,
    productDescription,
    category,
    supplier,
    materials,
    manufacturing,
    certifications,
    verificationStatus,
    sustainability,
  } = product;

  const aiProductInput: AiProduct = {
    productName,
    productDescription,
    category,
    supplier,
    materials,
    manufacturing: manufacturing!,
    certifications: certifications!,
    verificationStatus,
    complianceSummary: sustainability?.complianceSummary,
  };

  const [esgResult, qrLabelResult, validationResult] = await Promise.all([
    calculateSustainability({ product: aiProductInput }),
    generateQRLabelText({ product: aiProductInput }),
    validateProductData({ product: aiProductInput }),
  ]);

  await adminDb
    .collection(Collections.PRODUCTS)
    .doc(productId)
    .update({
      'sustainability.score': esgResult.score,
      'sustainability.environmental': esgResult.environmental,
      'sustainability.social': esgResult.social,
      'sustainability.governance': esgResult.governance,
      'sustainability.summary': esgResult.summary,
      qrLabelText: qrLabelResult.qrLabelText,
      dataQualityWarnings: validationResult.warnings,
      lastUpdated: admin.firestore.Timestamp.now(),
    });

  await logAuditEvent('product.recalculate_score', productId, {}, userId);
  return (await getProductById(productId, userId))!;
}

export async function approvePassport(
  productId: string,
  userId: string,
): Promise<Product> {
  const product = await getProductById(productId, userId);
  if (!product) throw new Error('Product not found');

  const productHash = await hashProductData(product);
  const [blockchainProof, ebsiVcId] = await Promise.all([
    anchorToPolygon(product.id, productHash),
    generateEbsiCredential(product.id),
  ]);

  await adminDb
    .collection(Collections.PRODUCTS)
    .doc(productId)
    .update({
      verificationStatus: 'Verified',
      lastVerificationDate: admin.firestore.Timestamp.now(),
      blockchainProof: blockchainProof,
      ebsiVcId: ebsiVcId,
    });

  await logAuditEvent(
    'passport.approved',
    productId,
    { txHash: blockchainProof.txHash },
    userId,
  );
  return (await getProductById(productId, userId))!;
}

export async function rejectPassport(
  productId: string,
  reason: string,
  gaps: ComplianceGap[],
  userId: string,
): Promise<Product> {
  await adminDb
    .collection(Collections.PRODUCTS)
    .doc(productId)
    .update({
      verificationStatus: 'Failed',
      lastVerificationDate: admin.firestore.Timestamp.now(),
      'sustainability.complianceSummary': reason,
      'sustainability.gaps': gaps,
    });

  await logAuditEvent('passport.rejected', productId, { reason }, userId);
  return (await getProductById(productId, userId))!;
}

export async function markAsRecycled(
  productId: string,
  userId: string,
): Promise<Product> {
  await adminDb
    .collection(Collections.PRODUCTS)
    .doc(productId)
    .update({
      endOfLifeStatus: 'Recycled',
      lastUpdated: admin.firestore.Timestamp.now(),
    });
  await logAuditEvent('product.recycled', productId, {}, userId);
  return (await getProductById(productId, userId))!;
}

export async function resolveComplianceIssue(
  productId: string,
  userId: string,
): Promise<Product> {
  await adminDb
    .collection(Collections.PRODUCTS)
    .doc(productId)
    .update({
      verificationStatus: 'Not Submitted',
      lastUpdated: admin.firestore.Timestamp.now(),
    });
  await logAuditEvent('compliance.resolved', productId, {}, userId);
  return (await getProductById(productId, userId))!;
}

export async function exportProducts(
  format: 'csv' | 'json',
): Promise<string> {
  const products = await getProducts();
  if (format === 'json') {
    return JSON.stringify(products, null, 2);
  }
  const headers = Object.keys(products[0]).join(',');
  const rows = products.map(product => {
    return Object.values(product)
      .map(value => {
        if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`;
        if (typeof value === 'object' && value !== null)
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        return value;
      })
      .join(',');
  });
  return `${headers}\n${rows.join('\n')}`;
}

// --- ADMIN & GENERAL ACTIONS ---

export async function getCompanies(): Promise<Company[]> {
  const snapshot = await adminDb.collection(Collections.COMPANIES).get();
  if (snapshot.empty) return [];
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...(doc.data() as Omit<Company, 'id'>),
    createdAt: fromTimestamp(doc.data().createdAt),
    updatedAt: fromTimestamp(doc.data().updatedAt),
  }));
}

export async function saveCompany(
  values: CompanyFormValues,
  userId: string,
  companyId?: string,
): Promise<Company> {
  const validatedData = companyFormSchema.parse(values);
  const now = admin.firestore.Timestamp.now();
  let companyRef: admin.firestore.DocumentReference;

  if (companyId) {
    companyRef = adminDb.collection(Collections.COMPANIES).doc(companyId);
    await companyRef.update({ ...validatedData, updatedAt: now });
    await logAuditEvent('company.updated', companyId, {}, userId);
  } else {
    companyRef = adminDb.collection(Collections.COMPANIES).doc();
    await companyRef.set({
      ...validatedData,
      createdAt: now,
      updatedAt: now,
    });
    await logAuditEvent('company.created', companyRef.id, {}, userId);
  }
  const doc = await companyRef.get();
  return { id: doc.id, ...doc.data() } as Company;
}

export async function deleteCompany(
  companyId: string,
  userId: string,
): Promise<void> {
  await adminDb.collection(Collections.COMPANIES).doc(companyId).delete();
  await logAuditEvent('company.deleted', companyId, {}, userId);
}

export async function saveUser(
  values: UserFormValues,
  adminId: string,
  userId?: string,
): Promise<User> {
  const validatedData = userFormSchema.parse(values);
  const now = admin.firestore.Timestamp.now();
  const userData = {
    fullName: validatedData.fullName,
    email: validatedData.email,
    companyId: validatedData.companyId,
    roles: [validatedData.role],
    updatedAt: now,
  };
  let userRef: admin.firestore.DocumentReference;

  if (userId) {
    userRef = adminDb.collection(Collections.USERS).doc(userId);
    await userRef.update(userData);
    await logAuditEvent('user.updated', userId, {}, adminId);
  } else {
    // In a real app, this would be tied to Firebase Auth UID.
    // For mock, we'll create a new doc.
    userRef = adminDb.collection(Collections.USERS).doc();
    await userRef.set({ ...userData, createdAt: now });
    await logAuditEvent('user.created', userRef.id, {}, adminId);
  }
  const doc = await userRef.get();
  return { id: doc.id, ...doc.data() } as User;
}

export async function deleteUser(
  userId: string,
  adminId: string,
): Promise<void> {
  await adminDb.collection(Collections.USERS).doc(userId).delete();
  await logAuditEvent('user.deleted', userId, {}, adminId);
}

export async function getCompliancePaths(): Promise<CompliancePath[]> {
  const snapshot = await adminDb
    .collection(Collections.COMPLIANCE_PATHS)
    .get();
  if (snapshot.empty) return [];
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...(doc.data() as Omit<CompliancePath, 'id'>),
    createdAt: fromTimestamp(doc.data().createdAt),
    updatedAt: fromTimestamp(doc.data().updatedAt),
  }));
}

export async function getCompliancePathById(
  id: string,
): Promise<CompliancePath | undefined> {
  const doc = await adminDb
    .collection(Collections.COMPLIANCE_PATHS)
    .doc(id)
    .get();
  if (!doc.exists) return undefined;
  return { id: doc.id, ...doc.data() } as CompliancePath;
}

export async function saveCompliancePath(
  values: CompliancePathFormValues,
  userId: string,
  pathId?: string,
): Promise<CompliancePath> {
  const validatedData = compliancePathFormSchema.parse(values);
  const now = admin.firestore.Timestamp.now();
  let pathRef: admin.firestore.DocumentReference;
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
    pathRef = adminDb.collection(Collections.COMPLIANCE_PATHS).doc(pathId);
    await pathRef.update(pathData);
    await logAuditEvent('compliance_path.updated', pathId, {}, userId);
  } else {
    pathRef = adminDb.collection(Collections.COMPLIANCE_PATHS).doc();
    await pathRef.set({ ...pathData, createdAt: now });
    await logAuditEvent('compliance_path.created', pathRef.id, {}, userId);
  }
  const doc = await pathRef.get();
  return { id: doc.id, ...doc.data() } as CompliancePath;
}

export async function getAuditLogs(): Promise<AuditLog[]> {
  const snapshot = await adminDb
    .collection(Collections.AUDIT_LOGS)
    .orderBy('createdAt', 'desc')
    .get();
  if (snapshot.empty) return [];
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...(doc.data() as Omit<AuditLog, 'id'>),
    createdAt: fromTimestamp(doc.data().createdAt),
    updatedAt: fromTimestamp(doc.data().updatedAt),
  }));
}

export async function getAuditLogsForUser(userId: string): Promise<AuditLog[]> {
  const snapshot = await adminDb
    .collection(Collections.AUDIT_LOGS)
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .get();
  if (snapshot.empty) return [];
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...(doc.data() as Omit<AuditLog, 'id'>),
    createdAt: fromTimestamp(doc.data().createdAt),
    updatedAt: fromTimestamp(doc.data().updatedAt),
  }));
}

export async function logAuditEvent(
  action: string,
  entityId: string,
  details: Record<string, any>,
  userId: string,
): Promise<AuditLog> {
  const now = admin.firestore.Timestamp.now();
  const log: Omit<AuditLog, 'id'> = {
    userId,
    action,
    entityId,
    details,
    createdAt: fromTimestamp(now),
    updatedAt: fromTimestamp(now),
  };
  const docRef = await adminDb.collection(Collections.AUDIT_LOGS).add(log);
  return { id: docRef.id, ...log };
}

export async function getApiKeys(userId: string): Promise<ApiKey[]> {
  const snapshot = await adminDb
    .collection(Collections.API_KEYS)
    .where('userId', '==', userId)
    .get();
  if (snapshot.empty) return [];
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...(doc.data() as Omit<ApiKey, 'id'>),
    createdAt: fromTimestamp(doc.data().createdAt),
    updatedAt: fromTimestamp(doc.data().updatedAt),
    lastUsed: fromTimestamp(doc.data().lastUsed),
  }));
}

export async function createApiKey(
  label: string,
  userId: string,
): Promise<{ key: ApiKey; rawToken: string }> {
  const now = admin.firestore.Timestamp.now();
  const rawToken = `nor_prod_${[...Array(32)].map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`;
  const keyData: Omit<ApiKey, 'id'> = {
    label,
    token: `nor_prod_******************${rawToken.slice(-4)}`,
    status: 'Active',
    userId,
    createdAt: fromTimestamp(now),
    updatedAt: fromTimestamp(now),
    lastUsed: fromTimestamp(admin.firestore.Timestamp.fromMillis(now.toMillis() - 86400000)),
  };

  const docRef = await adminDb.collection(Collections.API_KEYS).add(keyData);
  await logAuditEvent('api_key.created', docRef.id, { label }, userId);
  return { key: { id: docRef.id, ...keyData }, rawToken };
}

export async function revokeApiKey(
  keyId: string,
  userId: string,
): Promise<ApiKey> {
  const keyRef = adminDb.collection(Collections.API_KEYS).doc(keyId);
  // In a real app, add a where clause for userId to ensure ownership
  await keyRef.update({
    status: 'Revoked',
    updatedAt: admin.firestore.Timestamp.now(),
  });
  await logAuditEvent('api_key.revoked', keyId, {}, userId);
  const doc = await keyRef.get();
  return { id: doc.id, ...doc.data() } as ApiKey;
}

export async function deleteApiKey(
  keyId: string,
  userId: string,
): Promise<void> {
  // In a real app, check for ownership before deleting
  await adminDb.collection(Collections.API_KEYS).doc(keyId).delete();
  await logAuditEvent('api_key.deleted', keyId, {}, userId);
}

export async function getApiSettings(): Promise<ApiSettings> {
  const doc = await adminDb.collection('settings').doc('api').get();
  if (!doc.exists) {
    // Return default settings if none exist
    const defaultSettings: ApiSettings = {
        isPublicApiEnabled: true,
        rateLimitPerMinute: 100,
        isWebhookSigningEnabled: true,
    };
    await adminDb.collection('settings').doc('api').set(defaultSettings);
    return defaultSettings;
  }
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

export async function getServiceTickets(): Promise<ServiceTicket[]> {
  const snapshot = await adminDb.collection('serviceTickets').get();
  if (snapshot.empty) return [];
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...(doc.data() as Omit<ServiceTicket, 'id'>),
    createdAt: fromTimestamp(doc.data().createdAt),
    updatedAt: fromTimestamp(doc.data().updatedAt),
  }));
}

export async function getProductionLines(): Promise<ProductionLine[]> {
  const snapshot = await adminDb.collection('productionLines').get();
  if (snapshot.empty) return [];
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...(doc.data() as Omit<ProductionLine, 'id'>),
    createdAt: fromTimestamp(doc.data().createdAt),
    updatedAt: fromTimestamp(doc.data().updatedAt),
    lastMaintenance: fromTimestamp(doc.data().lastMaintenance),
  }));
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  const userRef = adminDb.collection(Collections.USERS).doc(userId);
  const userDoc = await userRef.get();
  if (!userDoc.exists) throw new Error('User not found');

  const logsSnapshot = await adminDb.collection(Collections.AUDIT_LOGS).get();
  const allLogIds = logsSnapshot.docs.map(doc => doc.id);
  const existingIds = userDoc.data()?.readNotificationIds || [];
  const updatedIds = [...new Set([...existingIds, ...allLogIds])];

  await userRef.update({ readNotificationIds: updatedIds });
}

export async function createUserAndCompany(
  name: string,
  email: string,
  userId: string,
) {
  const now = admin.firestore.Timestamp.now();
  const companyRef = adminDb.collection(Collections.COMPANIES).doc();
  const userRef = adminDb.collection(Collections.USERS).doc(userId);

  const batch = adminDb.batch();

  batch.set(companyRef, {
    name: `${name}'s Company`,
    ownerId: userId,
    createdAt: now,
    updatedAt: now,
  });

  batch.set(userRef, {
    fullName: name,
    email: email,
    companyId: companyRef.id,
    roles: [UserRoles.SUPPLIER],
    createdAt: now,
    updatedAt: now,
  });

  await batch.commit();
}

export async function updateUserProfile(userId: string, fullName: string) {
  const userRef = adminDb.collection(Collections.USERS).doc(userId);
  await userRef.update({
    fullName,
    updatedAt: admin.firestore.Timestamp.now(),
  });
}

export async function updateUserPassword(
  userId: string,
  current: string,
  newPass: string,
) {
  // This is a mock. In a real app, you'd use Firebase Auth admin SDK
  // to re-authenticate and update the password.
  console.log(`Updating password for ${userId}. Mock action successful.`);
  if (current !== 'password123') throw new Error('Incorrect current password.');
  await new Promise(res => setTimeout(res, 500));
}

export async function saveNotificationPreferences(userId: string, prefs: any) {
  // This is a mock for now.
  console.log(`Saving notification preferences for ${userId}`, prefs);
  await new Promise(res => setTimeout(res, 500));
}
