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
import { suggestImprovements as suggestImprovementsFlow } from '@/ai/flows/enhance-passport-information';
import admin, { adminDb } from './firebase-admin';
import { Collections, UserRoles, type Role } from './constants';
import { getUserById, hasRole, getCompanyById } from './auth';

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

const docToCompany = (
  doc: admin.firestore.DocumentSnapshot<admin.firestore.DocumentData>,
): Company => {
  const data = doc.data() as Omit<Company, 'id'>;
  return {
    ...data,
    id: doc.id,
    createdAt: fromTimestamp(data.createdAt),
    updatedAt: fromTimestamp(data.updatedAt),
  };
};

const docToCompliancePath = (
  doc: admin.firestore.DocumentSnapshot<admin.firestore.DocumentData>,
): CompliancePath => {
  const data = doc.data() as Omit<CompliancePath, 'id'>;
  return {
    ...data,
    id: doc.id,
    createdAt: fromTimestamp(data.createdAt),
    updatedAt: fromTimestamp(data.updatedAt),
  };
};

const docToAuditLog = (
  doc: admin.firestore.DocumentSnapshot<admin.firestore.DocumentData>,
): AuditLog => {
  const data = doc.data() as Omit<AuditLog, 'id'>;
  return {
    ...data,
    id: doc.id,
    createdAt: fromTimestamp(data.createdAt),
    updatedAt: fromTimestamp(data.updatedAt),
  };
};

const docToApiKey = (
  doc: admin.firestore.DocumentSnapshot<admin.firestore.DocumentData>,
): ApiKey => {
  const data = doc.data() as Omit<ApiKey, 'id'>;
  return {
    ...data,
    id: doc.id,
    createdAt: fromTimestamp(data.createdAt),
    updatedAt: fromTimestamp(data.updatedAt),
    lastUsed: data.lastUsed ? fromTimestamp(data.lastUsed) : undefined,
  };
};

const docToServiceTicket = (
  doc: admin.firestore.DocumentSnapshot<admin.firestore.DocumentData>,
): ServiceTicket => {
  const data = doc.data() as Omit<ServiceTicket, 'id'>;
  return {
    ...data,
    id: doc.id,
    createdAt: fromTimestamp(data.createdAt),
    updatedAt: fromTimestamp(data.updatedAt),
  };
};

const docToProductionLine = (
  doc: admin.firestore.DocumentSnapshot<admin.firestore.DocumentData>,
): ProductionLine => {
  const data = doc.data() as Omit<ProductionLine, 'id'>;
  return {
    ...data,
    id: doc.id,
    createdAt: fromTimestamp(data.createdAt),
    updatedAt: fromTimestamp(data.updatedAt),
    lastMaintenance: fromTimestamp(data.lastMaintenance),
  };
};

// --- PRODUCT ACTIONS ---

export async function getProducts(userId?: string): Promise<Product[]> {
  const productsRef = adminDb.collection(Collections.PRODUCTS);
  let query: admin.firestore.Query = productsRef;

  if (userId) {
    const user = await getUserById(userId);
    if (!user) return [];
    if (!user.roles.includes(UserRoles.ADMIN) && !user.roles.includes(UserRoles.BUSINESS_ANALYST)) {
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

  // Define roles that have global read access to any product.
  const globalReadRoles: Role[] = [
    UserRoles.ADMIN,
    UserRoles.AUDITOR,
    UserRoles.COMPLIANCE_MANAGER,
    UserRoles.RECYCLER,
    UserRoles.SERVICE_PROVIDER,
    UserRoles.BUSINESS_ANALYST,
    UserRoles.DEVELOPER,
    UserRoles.MANUFACTURER,
  ];

  const hasGlobalReadAccess = globalReadRoles.some(role => hasRole(user, role));

  // Allow access if user has a global role, or if they belong to the product's company.
  if (hasGlobalReadAccess || user.companyId === product.companyId) {
    return product;
  }

  // Fallback for non-global, non-company users: only show published products.
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

    if (
      existingProduct.companyId !== user.companyId &&
      !hasRole(user, UserRoles.ADMIN)
    ) {
      throw new Error('Permission denied to edit this product.');
    }

    productData = {
      ...validatedData,
      lastUpdated: fromTimestamp(now),
      updatedAt: fromTimestamp(now),
      // If a product failed verification, reset its status so it can be re-submitted.
      verificationStatus:
        existingProduct.verificationStatus === 'Failed'
          ? 'Not Submitted'
          : existingProduct.verificationStatus,
      status:
        existingProduct.verificationStatus === 'Failed'
          ? 'Draft'
          : validatedData.status,
    };
    await productRef.update(productData);
    await logAuditEvent(
      'product.updated',
      productId,
      { changes: Object.keys(values) },
      userId,
    );
  } else {
    const company = await getCompanyById(user.companyId);
    if (!company) {
      throw new Error(`Company with ID ${user.companyId} not found.`);
    }

    productRef = adminDb.collection(Collections.PRODUCTS).doc();
    productData = {
      ...validatedData,
      companyId: user.companyId,
      supplier: company.name, // Use the company name as the supplier.
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

  revalidatePath('/dashboard/supplier/products');
  revalidatePath(`/products/${finalProduct.id}`);
  return finalProduct;
}

export async function deleteProduct(
  productId: string,
  userId: string,
): Promise<void> {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');

  const product = await getProductById(productId, userId);
  if (!product) throw new Error('Product not found or permission denied');

  if (product.companyId !== user.companyId && !hasRole(user, UserRoles.ADMIN)) {
    throw new Error('Permission denied to delete this product.');
  }

  await adminDb.collection(Collections.PRODUCTS).doc(productId).delete();
  await logAuditEvent('product.deleted', productId, {}, userId);
  revalidatePath('/dashboard/supplier/products');
}

export async function submitForReview(
  productId: string,
  userId: string,
): Promise<Product> {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');

  const product = await getProductById(productId, userId);
  if (!product) throw new Error('Product not found or permission denied');

  const productRef = adminDb.collection(Collections.PRODUCTS).doc(productId);
  await productRef.update({
    verificationStatus: 'Pending',
    lastUpdated: admin.firestore.Timestamp.now(),
  });
  await logAuditEvent('passport.submitted', productId, {}, userId);
  revalidatePath('/dashboard/supplier/products');
  return (await getProductById(productId, userId))!;
}

export async function recalculateScore(
  productId: string,
  userId: string,
): Promise<void> {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');

  const product = await getProductById(productId, userId);
  if (!product) throw new Error('Product not found or permission denied');

  const productRef = adminDb.collection(Collections.PRODUCTS).doc(productId);
  await productRef.update({
    'sustainability.score': -1, // Sentinel value to trigger the cloud function
    lastUpdated: admin.firestore.Timestamp.now(),
  });
  await logAuditEvent('product.recalculate_score', productId, {}, userId);
  revalidatePath('/dashboard/supplier/products');
}

export async function approvePassport(
  productId: string,
  userId: string,
): Promise<Product> {
  const user = await getUserById(userId);
  if (userId !== 'system' && !user) throw new Error('User not found');
  if (
    userId !== 'system' &&
    !hasRole(user!, UserRoles.AUDITOR) &&
    !hasRole(user!, UserRoles.ADMIN)
  ) {
    throw new Error(
      'Permission denied: Only Auditors or Admins can approve passports.',
    );
  }

  const product = await getProductById(productId, userId || 'user-admin');
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
      status: 'Published',
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
  revalidatePath('/dashboard/auditor/audit');
  revalidatePath('/dashboard/supplier/products');
  revalidatePath(`/products/${productId}`);
  return (await getProductById(productId, userId || 'user-admin'))!;
}

export async function rejectPassport(
  productId: string,
  reason: string,
  gaps: ComplianceGap[],
  userId: string,
): Promise<Product> {
  const user = await getUserById(userId);
  if (userId !== 'system' && !user) throw new Error('User not found');
  if (
    userId !== 'system' &&
    !hasRole(user!, UserRoles.AUDITOR) &&
    !hasRole(user!, UserRoles.ADMIN)
  ) {
    throw new Error(
      'Permission denied: Only Auditors or Admins can reject passports.',
    );
  }

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
  revalidatePath('/dashboard/auditor/audit');
  revalidatePath('/dashboard/supplier/products');
  revalidatePath(`/products/${productId}`);
  return (await getProductById(productId, userId || 'user-admin'))!;
}

export async function markAsRecycled(
  productId: string,
  userId: string,
): Promise<Product> {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');
  if (!hasRole(user, UserRoles.RECYCLER) && !hasRole(user, UserRoles.ADMIN)) {
    throw new Error(
      'Permission denied: Only Recyclers or Admins can perform this action.',
    );
  }

  const product = await getProductById(productId, userId);
  if (!product) throw new Error('Product not found or permission denied');

  await adminDb
    .collection(Collections.PRODUCTS)
    .doc(productId)
    .update({
      endOfLifeStatus: 'Recycled',
      lastUpdated: admin.firestore.Timestamp.now(),
    });
  await logAuditEvent('product.recycled', productId, {}, userId);
  revalidatePath('/dashboard/recycler/eol');
  return (await getProductById(productId, userId))!;
}

export async function resolveComplianceIssue(
  productId: string,
  userId: string,
): Promise<Product> {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');
  if (
    !hasRole(user, UserRoles.COMPLIANCE_MANAGER) &&
    !hasRole(user, UserRoles.ADMIN)
  ) {
    throw new Error(
      'Permission denied: Only Compliance Managers or Admins can perform this action.',
    );
  }

  await adminDb
    .collection(Collections.PRODUCTS)
    .doc(productId)
    .update({
      verificationStatus: 'Not Submitted',
      status: 'Draft',
      lastUpdated: admin.firestore.Timestamp.now(),
    });
  await logAuditEvent('compliance.resolved', productId, {}, userId);
  revalidatePath('/dashboard/compliance-manager/flagged');
  return (await getProductById(productId, userId))!;
}

export async function suggestImprovements(input: {
  productName: string;
  productDescription: string;
}) {
  return await suggestImprovementsFlow(input);
}

// --- ADMIN & GENERAL ACTIONS ---

export async function getCompanies(): Promise<Company[]> {
  const snapshot = await adminDb.collection(Collections.COMPANIES).get();
  if (snapshot.empty) return [];
  return snapshot.docs.map(docToCompany);
}

export async function saveCompany(
  values: CompanyFormValues,
  userId: string,
  companyId?: string,
): Promise<Company> {
  const user = await getUserById(userId);
  if (!user || !hasRole(user, UserRoles.ADMIN)) {
    throw new Error('Permission denied: Only Admins can manage companies.');
  }

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
  revalidatePath('/dashboard/admin/companies');
  const doc = await companyRef.get();
  return docToCompany(doc);
}

export async function deleteCompany(
  companyId: string,
  userId: string,
): Promise<void> {
  const user = await getUserById(userId);
  if (!user || !hasRole(user, UserRoles.ADMIN)) {
    throw new Error('Permission denied: Only Admins can delete companies.');
  }
  await adminDb.collection(Collections.COMPANIES).doc(companyId).delete();
  await logAuditEvent('company.deleted', companyId, {}, userId);
  revalidatePath('/dashboard/admin/companies');
}

export async function saveUser(
  values: UserFormValues,
  adminId: string,
  userId?: string,
): Promise<User> {
  const adminUser = await getUserById(adminId);
  if (!adminUser || !hasRole(adminUser, UserRoles.ADMIN)) {
    throw new Error('Permission denied: Only Admins can manage users.');
  }

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
  revalidatePath('/dashboard/admin/users');
  const doc = await userRef.get();
  return { id: doc.id, ...doc.data() } as User;
}

export async function deleteUser(
  userId: string,
  adminId: string,
): Promise<void> {
  const adminUser = await getUserById(adminId);
  if (!adminUser || !hasRole(adminUser, UserRoles.ADMIN)) {
    throw new Error('Permission denied: Only Admins can delete users.');
  }
  await adminDb.collection(Collections.USERS).doc(userId).delete();
  await logAuditEvent('user.deleted', userId, {}, adminId);
  revalidatePath('/dashboard/admin/users');
}

export async function getCompliancePaths(): Promise<CompliancePath[]> {
  const snapshot = await adminDb
    .collection(Collections.COMPLIANCE_PATHS)
    .get();
  if (snapshot.empty) return [];
  return snapshot.docs.map(docToCompliancePath);
}

export async function getCompliancePathById(
  id: string,
): Promise<CompliancePath | undefined> {
  const doc = await adminDb
    .collection(Collections.COMPLIANCE_PATHS)
    .doc(id)
    .get();
  if (!doc.exists) return undefined;
  return docToCompliancePath(doc);
}

export async function saveCompliancePath(
  values: CompliancePathFormValues,
  userId: string,
  pathId?: string,
): Promise<CompliancePath> {
  const user = await getUserById(userId);
  if (
    !user ||
    (!hasRole(user, UserRoles.ADMIN) &&
      !hasRole(user, UserRoles.AUDITOR) &&
      !hasRole(user, UserRoles.COMPLIANCE_MANAGER) &&
      userId !== 'system')
  ) {
    throw new Error('Permission denied to manage compliance paths.');
  }

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
  revalidatePath('/dashboard/admin/compliance');
  const doc = await pathRef.get();
  return docToCompliancePath(doc);
}

export async function deleteCompliancePath(
  pathId: string,
  userId: string,
): Promise<void> {
  const user = await getUserById(userId);
  if (
    !user ||
    (!hasRole(user, UserRoles.ADMIN) &&
      !hasRole(user, UserRoles.COMPLIANCE_MANAGER))
  ) {
    throw new Error('Permission denied to delete compliance paths.');
  }

  await adminDb.collection(Collections.COMPLIANCE_PATHS).doc(pathId).delete();
  await logAuditEvent('compliance_path.deleted', pathId, {}, userId);
  revalidatePath('/dashboard/admin/compliance');
  revalidatePath('/dashboard/auditor/compliance');
  revalidatePath('/dashboard/compliance-manager/compliance');
}

export async function getAuditLogs(): Promise<AuditLog[]> {
  const snapshot = await adminDb
    .collection(Collections.AUDIT_LOGS)
    .orderBy('createdAt', 'desc')
    .get();
  if (snapshot.empty) return [];
  return snapshot.docs.map(docToAuditLog);
}

export async function getAuditLogsForUser(userId: string): Promise<AuditLog[]> {
  const snapshot = await adminDb
    .collection(Collections.AUDIT_LOGS)
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .get();
  if (snapshot.empty) return [];
  return snapshot.docs.map(docToAuditLog);
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
  return snapshot.docs.map(docToApiKey);
}

export async function createApiKey(
  label: string,
  userId: string,
): Promise<{ key: ApiKey; rawToken: string }> {
  const user = await getUserById(userId);
  if (!user || !hasRole(user, UserRoles.DEVELOPER)) {
    throw new Error('Permission denied.');
  }

  const now = admin.firestore.Timestamp.now();
  const rawToken = `nor_prod_${[...Array(32)]
    .map(() => Math.floor(Math.random() * 16).toString(16))
    .join('')}`;
  const keyData: Omit<ApiKey, 'id'> = {
    label,
    token: `nor_prod_******************${rawToken.slice(-4)}`,
    status: 'Active',
    userId,
    createdAt: fromTimestamp(now),
    updatedAt: fromTimestamp(now),
  };
  const docRef = await adminDb.collection(Collections.API_KEYS).add(keyData);
  await logAuditEvent('api_key.created', docRef.id, { label }, userId);
  revalidatePath('/dashboard/developer/keys');
  return { key: { id: docRef.id, ...keyData }, rawToken };
}

export async function revokeApiKey(
  keyId: string,
  userId: string,
): Promise<ApiKey> {
  const keyRef = adminDb.collection(Collections.API_KEYS).doc(keyId);
  const keyDoc = await keyRef.get();
  if (!keyDoc.exists || keyDoc.data()?.userId !== userId) {
    throw new Error('API Key not found or permission denied.');
  }

  await keyRef.update({
    status: 'Revoked',
    updatedAt: admin.firestore.Timestamp.now(),
  });
  await logAuditEvent('api_key.revoked', keyId, {}, userId);
  revalidatePath('/dashboard/developer/keys');
  const doc = await keyRef.get();
  return docToApiKey(doc);
}

export async function deleteApiKey(
  keyId: string,
  userId: string,
): Promise<void> {
  const keyRef = adminDb.collection(Collections.API_KEYS).doc(keyId);
  const keyDoc = await keyRef.get();
  if (!keyDoc.exists || keyDoc.data()?.userId !== userId) {
    throw new Error('API Key not found or permission denied.');
  }

  await keyRef.delete();
  await logAuditEvent('api_key.deleted', keyId, {}, userId);
  revalidatePath('/dashboard/developer/keys');
}

export async function getApiSettings(): Promise<ApiSettings> {
  const doc = await adminDb.collection('settings').doc('api').get();
  if (!doc.exists) {
    // Return default settings if none exist
    return {
      isPublicApiEnabled: true,
      rateLimitPerMinute: 100,
      isWebhookSigningEnabled: true,
    };
  }
  return doc.data() as ApiSettings;
}

export async function saveApiSettings(
  values: ApiSettingsFormValues,
  userId: string,
): Promise<ApiSettings> {
  const user = await getUserById(userId);
  if (
    !user ||
    (!hasRole(user, UserRoles.ADMIN) && !hasRole(user, UserRoles.DEVELOPER))
  ) {
    throw new Error('Permission denied.');
  }

  const validatedData = apiSettingsSchema.parse(values);
  await adminDb.collection('settings').doc('api').set(validatedData);
  await logAuditEvent('settings.api.updated', 'global', { values }, userId);
  return validatedData;
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

export async function exportProducts(
  format: 'csv' | 'json',
): Promise<string> {
  const products = await getProducts(); // Fetches all products
  if (format === 'json') {
    return JSON.stringify(products, null, 2);
  }

  // CSV format
  if (products.length === 0) return '';
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

  return [headers, ...rows].join('\n');
}

export async function getServiceTickets(): Promise<ServiceTicket[]> {
  const snapshot = await adminDb
    .collection('serviceTickets')
    .orderBy('createdAt', 'desc')
    .get();
  if (snapshot.empty) return [];
  return snapshot.docs.map(docToServiceTicket);
}

export async function getProductionLines(): Promise<ProductionLine[]> {
  const snapshot = await adminDb
    .collection('productionLines')
    .orderBy('createdAt', 'desc')
    .get();
  if (snapshot.empty) return [];
  return snapshot.docs.map(docToProductionLine);
}
