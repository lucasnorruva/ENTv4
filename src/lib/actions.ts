
'use server';

import { revalidatePath } from 'next/cache';
import { randomBytes } from 'crypto';
import * as admin from 'firebase-admin';
import { adminDb } from './firebase-admin';
import { Collections, UserRoles } from './constants';
import {
  productFormSchema,
  type ProductFormValues,
  compliancePathFormSchema,
  type CompliancePathFormValues,
  userFormSchema,
  type UserFormValues,
  apiSettingsSchema,
  type ApiSettingsFormValues,
} from './schemas';
import { suggestImprovements } from '@/ai/flows/enhance-passport-information';
import { calculateSustainability } from '@/ai/flows/calculate-sustainability';
import { summarizeComplianceGaps } from '@/ai/flows/summarize-compliance-gaps';
import { generateQRLabelText } from '@/ai/flows/generate-qr-label-text';
import { classifyProduct } from '@/ai/flows/classify-product';
import { analyzeProductLifecycle } from '@/ai/flows/analyze-product-lifecycle';
import {
  anchorToPolygon,
  generateEbsiCredential,
  hashProductData,
} from '@/services/blockchain';
import { verifyProductAgainstPath } from '@/services/compliance';
import { getUserById, getCompanyById, hasRole } from './auth';

import type {
  Product,
  SustainabilityData,
  CompliancePath,
  User,
  AuditLog,
  ProductionLine,
  ServiceTicket,
  ApiKey,
  ComplianceGap,
  ApiSettings,
} from '@/types';
import type { AiProduct } from '@/ai/schemas';

// --- DATA CONVERSION HELPERS ---

const docToProduct = (
  doc: FirebaseFirestore.DocumentSnapshot,
): Product => {
  const data = doc.data() as any;
  return {
    id: doc.id,
    ...data,
    createdAt: data.createdAt?.toDate().toISOString(),
    updatedAt: data.updatedAt?.toDate().toISOString(),
    lastUpdated: data.lastUpdated?.toDate().toISOString(),
    lastVerificationDate: data.lastVerificationDate?.toDate().toISOString(),
  };
};

const docToAuditLog = (
  doc: FirebaseFirestore.DocumentSnapshot,
): AuditLog => {
  const data = doc.data() as any;
  return {
    id: doc.id,
    ...data,
    createdAt: data.createdAt?.toDate().toISOString(),
    updatedAt: data.updatedAt?.toDate().toISOString(),
  };
};

const docToCompliancePath = (
  doc: FirebaseFirestore.DocumentSnapshot,
): CompliancePath => {
  const data = doc.data() as any;
  return {
    id: doc.id,
    ...data,
    createdAt: data.createdAt?.toDate().toISOString(),
    updatedAt: data.updatedAt?.toDate().toISOString(),
  };
};

const docToApiKey = (doc: FirebaseFirestore.DocumentSnapshot): ApiKey => {
  const data = doc.data() as any;
  return {
    id: doc.id,
    ...data,
    createdAt: data.createdAt?.toDate().toISOString(),
    updatedAt: data.updatedAt?.toDate().toISOString(),
    lastUsed: data.lastUsed?.toDate().toISOString(),
  };
};

// --- OWNERSHIP & PERMISSION HELPERS ---

const checkProductOwnership = async (productId: string, userId: string) => {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found.');

  if (
    hasRole(user, UserRoles.ADMIN) ||
    hasRole(user, UserRoles.AUDITOR) ||
    hasRole(user, UserRoles.RECYCLER)
  ) {
    return true; // Admins, Auditors, and Recyclers can access any product
  }

  const productDoc = await adminDb
    .collection(Collections.PRODUCTS)
    .doc(productId)
    .get();
  if (!productDoc.exists) throw new Error('Product not found.');
  if (productDoc.data()?.companyId !== user.companyId) {
    throw new Error('Access denied. User does not own this product.');
  }
  return true;
};

// --- AUDIT LOGGING ---

export async function logAuditEvent(
  action: string,
  entityId: string,
  details: Record<string, any>,
  userId: string = 'system',
) {
  const logEntry = {
    userId,
    action,
    entityId,
    details,
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now(),
  };
  await adminDb.collection(Collections.AUDIT_LOGS).add(logEntry);
  revalidatePath('/dashboard/analytics');
  revalidatePath('/dashboard/history');
  revalidatePath('/dashboard/logs');
}

// --- AI FLOW ORCHESTRATION ---

const runAllAiFlows = async (
  productData: AiProduct,
): Promise<{ sustainability: SustainabilityData; qrLabelText: string }> => {
  const [
    esgResult,
    qrLabelResult,
    classificationResult,
    lifecycleAnalysisResult,
  ] = await Promise.all([
    calculateSustainability({ product: productData }),
    generateQRLabelText({ product: productData }),
    classifyProduct({ product: productData }),
    analyzeProductLifecycle({ product: productData }),
  ]);

  return {
    sustainability: {
      ...esgResult,
      classification: classificationResult,
      lifecycleAnalysis: lifecycleAnalysisResult,
      isCompliant: false,
      complianceSummary: 'Awaiting compliance analysis.',
    },
    qrLabelText: qrLabelResult.qrLabelText,
  };
};

// --- PRODUCT ACTIONS ---

export async function getProducts(userId?: string): Promise<Product[]> {
  const user = userId ? await getUserById(userId) : null;

  let query: FirebaseFirestore.Query = adminDb
    .collection(Collections.PRODUCTS)
    .orderBy('createdAt', 'desc');

  if (
    user &&
    !hasRole(user, UserRoles.ADMIN) &&
    !hasRole(user, UserRoles.AUDITOR) &&
    !hasRole(user, UserRoles.BUSINESS_ANALYST) &&
    !hasRole(user, UserRoles.RECYCLER)
  ) {
    query = query.where('companyId', '==', user.companyId);
  }

  const snapshot = await query.get();
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

  if (userId) {
    const user = await getUserById(userId);
    if (
      user &&
      (hasRole(user, UserRoles.ADMIN) ||
        hasRole(user, UserRoles.AUDITOR) ||
        hasRole(user, UserRoles.RECYCLER) ||
        product.companyId === user.companyId)
    ) {
      return product;
    }
    return undefined;
  }

  if (product.status === 'Published') {
    return product;
  }

  return undefined;
}

export async function saveProduct(
  productData: ProductFormValues,
  userId: string,
  productId?: string,
): Promise<Product> {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found for saving product.');
  const company = await getCompanyById(user.companyId);
  if (!company) throw new Error('Company not found for user.');

  const validatedData = productFormSchema.parse(productData);
  const now = admin.firestore.Timestamp.now();

  const aiProductInput: AiProduct = { ...validatedData, supplier: company.name };
  const { sustainability, qrLabelText } = await runAllAiFlows(aiProductInput);

  if (validatedData.compliancePathId) {
    const path = await getCompliancePathById(validatedData.compliancePathId);
    if (path) {
      const complianceResult = await summarizeComplianceGaps({
        product: aiProductInput,
        compliancePath: path,
      });
      sustainability.isCompliant = complianceResult.isCompliant;
      sustainability.complianceSummary = complianceResult.complianceSummary;
      sustainability.gaps = complianceResult.gaps;
    }
  }

  const dataToSave = {
    ...validatedData,
    supplier: company.name,
    sustainability,
    qrLabelText,
    updatedAt: now,
    lastUpdated: now,
  };

  if (productId) {
    await checkProductOwnership(productId, userId);
    const docRef = adminDb.collection(Collections.PRODUCTS).doc(productId);
    await docRef.update(dataToSave);
    await logAuditEvent(
      'product.updated',
      productId,
      { fields: Object.keys(validatedData) },
      userId,
    );
    revalidatePath('/dashboard/products');
    revalidatePath(`/products/${productId}`);
    const updatedDoc = await docRef.get();
    return docToProduct(updatedDoc);
  } else {
    const docRef = adminDb.collection(Collections.PRODUCTS).doc();
    const newProductData = {
      ...dataToSave,
      id: docRef.id,
      companyId: user.companyId,
      verificationStatus: 'Not Submitted',
      endOfLifeStatus: 'Active',
      createdAt: now,
    };
    await docRef.set(newProductData);
    await logAuditEvent(
      'product.created',
      docRef.id,
      { productName: newProductData.productName },
      userId,
    );
    revalidatePath('/dashboard/products');
    return docToProduct(await docRef.get());
  }
}

export async function deleteProduct(
  id: string,
  userId: string,
): Promise<{ success: boolean }> {
  await checkProductOwnership(id, userId);
  const docRef = adminDb.collection(Collections.PRODUCTS).doc(id);
  const doc = await docRef.get();
  if (doc.exists) {
    await logAuditEvent(
      'product.deleted',
      id,
      { productName: doc.data()?.productName },
      userId,
    );
    await docRef.delete();
  }
  revalidatePath('/dashboard/products');
  return { success: true };
}

export async function submitForReview(
  productId: string,
  userId: string,
): Promise<Product> {
  await checkProductOwnership(productId, userId);
  const docRef = adminDb.collection(Collections.PRODUCTS).doc(productId);
  await docRef.update({
    verificationStatus: 'Pending',
    updatedAt: admin.firestore.Timestamp.now(),
  });
  await logAuditEvent(
    'passport.submitted',
    productId,
    { status: 'Pending' },
    userId,
  );
  revalidatePath('/dashboard/products');
  revalidatePath('/dashboard/audit');
  revalidatePath(`/products/${productId}`);
  return docToProduct(await docRef.get());
}

export async function approvePassport(
  productId: string,
  userId: string,
): Promise<Product> {
  await checkProductOwnership(productId, userId);
  const product = await getProductById(productId, userId);
  if (!product) throw new Error('Product not found or access denied.');

  const compliancePath = product.compliancePathId
    ? await getCompliancePathById(product.compliancePathId)
    : null;
  if (!compliancePath) {
    throw new Error('Compliance path not configured for this product.');
  }

  const { isCompliant, gaps } = await verifyProductAgainstPath(
    product,
    compliancePath,
  );
  if (!isCompliant) {
    const summary = `Product failed final verification with ${gaps.length} issue(s).`;
    await rejectPassport(product.id, summary, gaps, 'system:gatekeeper');
    throw new Error(
      `Cannot approve: Product is not compliant. Issues found: ${gaps
        .map(g => g.issue)
        .join(', ')}`,
    );
  }

  const dataHash = await hashProductData(product);
  const [blockchainProof, ebsiVcId] = await Promise.all([
    anchorToPolygon(productId, dataHash),
    generateEbsiCredential(productId),
  ]);

  const docRef = adminDb.collection(Collections.PRODUCTS).doc(productId);
  await docRef.update({
    verificationStatus: 'Verified',
    lastVerificationDate: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now(),
    blockchainProof,
    ebsiVcId,
  });

  await logAuditEvent(
    'passport.approved',
    productId,
    { txHash: blockchainProof.txHash },
    userId,
  );
  revalidatePath('/dashboard/audit');
  revalidatePath('/dashboard/products');
  revalidatePath(`/products/${productId}`);
  return docToProduct(await docRef.get());
}

export async function rejectPassport(
  productId: string,
  summary: string,
  gaps: ComplianceGap[],
  userId: string,
): Promise<Product> {
  await checkProductOwnership(productId, userId);
  const docRef = adminDb.collection(Collections.PRODUCTS).doc(productId);
  await docRef.set(
    {
      verificationStatus: 'Failed',
      lastVerificationDate: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
      sustainability: {
        isCompliant: false,
        complianceSummary: summary,
        gaps,
      },
    },
    { merge: true },
  );

  await logAuditEvent(
    'passport.rejected',
    productId,
    { reason: summary, gaps },
    userId,
  );
  revalidatePath('/dashboard/audit');
  revalidatePath('/dashboard/products');
  revalidatePath('/dashboard/flagged');
  revalidatePath(`/products/${productId}`);
  return docToProduct(await docRef.get());
}

export async function runSuggestImprovements(
  data: ProductFormValues,
): Promise<any> {
  const aiProductInput: AiProduct = {
    ...data,
    supplier: 'Mock Company Name',
  };
  return suggestImprovements({ product: aiProductInput });
}

export async function recalculateScore(
  productId: string,
  userId: string,
): Promise<Product> {
  await checkProductOwnership(productId, userId);
  const product = await getProductById(productId, userId);
  if (!product) throw new Error('Product not found or access denied.');

  const { sustainability, qrLabelText } = await runAllAiFlows(product);

  const docRef = adminDb.collection(Collections.PRODUCTS).doc(productId);
  await docRef.update({
    sustainability,
    qrLabelText,
    updatedAt: admin.firestore.Timestamp.now(),
  });

  await logAuditEvent(
    'product.recalculate_score',
    productId,
    { newScore: sustainability.score },
    userId,
  );
  revalidatePath('/dashboard/products');
  revalidatePath(`/products/${productId}`);
  return docToProduct(await docRef.get());
}

export async function markAsRecycled(
  productId: string,
  userId: string,
): Promise<Product> {
  await checkProductOwnership(productId, userId);
  const docRef = adminDb.collection(Collections.PRODUCTS).doc(productId);
  await docRef.update({
    endOfLifeStatus: 'Recycled',
    updatedAt: admin.firestore.Timestamp.now(),
  });
  await logAuditEvent('product.recycled', productId, {}, userId);
  revalidatePath('/dashboard/eol');
  revalidatePath(`/products/${productId}`);
  return docToProduct(await docRef.get());
}

// --- AUDIT LOG ACTIONS ---

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

// --- COMPLIANCE PATH ACTIONS ---

export async function getCompliancePaths(): Promise<CompliancePath[]> {
  const snapshot = await adminDb
    .collection(Collections.COMPLIANCE_PATHS)
    .get();
  if (snapshot.empty) return [];
  return snapshot.docs.map(docToCompliancePath);
}

export async function getCompliancePathById(
  id: string,
): Promise<CompliancePath | null> {
  const doc = await adminDb
    .collection(Collections.COMPLIANCE_PATHS)
    .doc(id)
    .get();
  return doc.exists ? docToCompliancePath(doc) : null;
}

export async function saveCompliancePath(
  pathData: CompliancePathFormValues,
  userId: string,
  pathId?: string,
): Promise<CompliancePath> {
  const validatedData = compliancePathFormSchema.parse(pathData);
  const now = admin.firestore.Timestamp.now();

  const dataToSave = {
    name: validatedData.name,
    description: validatedData.description,
    category: validatedData.category,
    regulations: validatedData.regulations
      .split(',')
      .map(s => s.trim())
      .filter(Boolean),
    rules: {
      minSustainabilityScore: validatedData.minSustainabilityScore,
      requiredKeywords:
        validatedData.requiredKeywords
          ?.split(',')
          .map(s => s.trim())
          .filter(Boolean) || [],
      bannedKeywords:
        validatedData.bannedKeywords
          ?.split(',')
          .map(s => s.trim())
          .filter(Boolean) || [],
    },
    updatedAt: now,
  };

  if (pathId) {
    const docRef = adminDb.collection(Collections.COMPLIANCE_PATHS).doc(pathId);
    await docRef.update(dataToSave);
    await logAuditEvent(
      'compliance_path.updated',
      pathId,
      { name: dataToSave.name },
      userId,
    );
    revalidatePath('/dashboard/compliance');
    return docToCompliancePath(await docRef.get());
  } else {
    const docRef = adminDb.collection(Collections.COMPLIANCE_PATHS).doc();
    const newPath = {
      ...dataToSave,
      id: docRef.id,
      createdAt: now,
    };
    await docRef.set(newPath);
    await logAuditEvent(
      'compliance_path.created',
      docRef.id,
      { name: newPath.name },
      userId,
    );
    revalidatePath('/dashboard/compliance');
    return docToCompliancePath(await docRef.get());
  }
}

// --- USER ACTIONS ---

export async function getUsers(): Promise<User[]> {
  return await require('./auth').getUsers();
}

export async function saveUser(
  userData: UserFormValues,
  adminUserId: string,
  userId?: string,
): Promise<User> {
  const validatedData = userFormSchema.parse(userData);
  const now = admin.firestore.Timestamp.now();
  const dataToSave = {
    fullName: validatedData.fullName,
    email: validatedData.email,
    companyId: validatedData.companyId,
    roles: [validatedData.role],
    updatedAt: now,
  };

  if (userId) {
    const docRef = adminDb.collection(Collections.USERS).doc(userId);
    await docRef.update(dataToSave);
    await logAuditEvent(
      'user.updated',
      userId,
      { email: validatedData.email },
      adminUserId,
    );
    revalidatePath('/dashboard/users');
    return (await getUserById(userId))!;
  } else {
    const docRef = adminDb.collection(Collections.USERS).doc();
    const newUser = {
      ...dataToSave,
      id: docRef.id,
      createdAt: now,
    };
    await docRef.set(newUser);
    await logAuditEvent(
      'user.created',
      docRef.id,
      { email: newUser.email },
      adminUserId,
    );
    revalidatePath('/dashboard/users');
    return (await getUserById(docRef.id))!;
  }
}

export async function deleteUser(
  userId: string,
  adminUserId: string,
): Promise<{ success: boolean }> {
  const docRef = adminDb.collection(Collections.USERS).doc(userId);
  const doc = await docRef.get();
  if (doc.exists) {
    await logAuditEvent(
      'user.deleted',
      userId,
      { email: doc.data()?.email },
      adminUserId,
    );
    await docRef.delete();
  }
  revalidatePath('/dashboard/users');
  return { success: true };
}

// --- SETTINGS ACTIONS ---

export async function updateUserProfile(
  userId: string,
  fullName: string,
): Promise<User> {
  const docRef = adminDb.collection(Collections.USERS).doc(userId);
  await docRef.update({
    fullName,
    updatedAt: admin.firestore.Timestamp.now(),
  });
  await logAuditEvent('user.profile.updated', userId, { fullName }, userId);
  revalidatePath('/dashboard/settings');
  revalidatePath('/dashboard/layout');
  return (await getUserById(userId))!;
}

export async function updateUserPassword(
  userId: string,
  current: string,
  newPass: string,
): Promise<{ success: boolean }> {
  if (current !== 'password123') {
    throw new Error('Current password does not match.');
  }
  await logAuditEvent('user.password.updated', userId, {}, userId);
  return { success: true };
}

export async function saveNotificationPreferences(
  userId: string,
  prefs: Record<string, boolean>,
): Promise<{ success: boolean }> {
  await logAuditEvent(
    'user.notifications.updated',
    userId,
    { preferences: prefs },
    userId,
  );
  return { success: true };
}

// --- API KEY ACTIONS ---

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
): Promise<{ rawToken: string; apiKey: ApiKey }> {
  const now = admin.firestore.Timestamp.now();
  const rawToken = `nor_live_${randomBytes(16).toString('hex')}`;
  const storedToken = `${rawToken.slice(0, 10)}******************${rawToken.slice(-4)}`;

  const newApiKeyData = {
    label,
    token: storedToken,
    status: 'Active' as const,
    userId,
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await adminDb
    .collection(Collections.API_KEYS)
    .add(newApiKeyData);
  await logAuditEvent('api_key.created', docRef.id, { label }, userId);
  revalidatePath('/dashboard/keys');
  revalidatePath('/dashboard');

  const apiKey = docToApiKey(await docRef.get());
  return { rawToken, apiKey };
}

export async function revokeApiKey(id: string, userId: string): Promise<ApiKey> {
  const docRef = adminDb.collection(Collections.API_KEYS).doc(id);
  const doc = await docRef.get();
  if (!doc.exists || doc.data()?.userId !== userId) {
    throw new Error('API Key not found or access denied.');
  }
  await docRef.update({
    status: 'Revoked',
    updatedAt: admin.firestore.Timestamp.now(),
  });
  await logAuditEvent(
    'api_key.revoked',
    id,
    { label: doc.data()?.label },
    userId,
  );
  revalidatePath('/dashboard/keys');
  revalidatePath('/dashboard');
  return docToApiKey(await docRef.get());
}

export async function deleteApiKey(
  id: string,
  userId: string,
): Promise<{ success: true }> {
  const docRef = adminDb.collection(Collections.API_KEYS).doc(id);
  const doc = await docRef.get();
  if (!doc.exists || doc.data()?.userId !== userId) {
    throw new Error('API Key not found or access denied.');
  }
  await logAuditEvent(
    'api_key.deleted',
    id,
    { label: doc.data()?.label },
    userId,
  );
  await docRef.delete();
  revalidatePath('/dashboard/keys');
  revalidatePath('/dashboard');
  return { success: true };
}

// --- API SETTINGS ACTIONS ---

export async function getApiSettings(): Promise<ApiSettings> {
  const doc = await adminDb.collection(Collections.API_SETTINGS).doc('global').get();
  if (!doc.exists) {
    // Return a default if not set
    return {
      isPublicApiEnabled: true,
      rateLimitPerMinute: 100,
      isWebhookSigningEnabled: true,
    };
  }
  return doc.data() as ApiSettings;
}

export async function saveApiSettings(
  settings: ApiSettingsFormValues,
  adminUserId: string,
): Promise<ApiSettings> {
  const validatedData = apiSettingsSchema.parse(settings);
  await adminDb
    .collection(Collections.API_SETTINGS)
    .doc('global')
    .set(validatedData, { merge: true });
  await logAuditEvent(
    'settings.api.updated',
    'global',
    { settings: validatedData },
    adminUserId,
  );
  revalidatePath('/dashboard/api-settings');
  return validatedData;
}

// --- OTHER MOCK DATA ACTIONS (now fetching from Firestore) ---

export async function getProductionLines(): Promise<ProductionLine[]> {
  const doc = await adminDb
    .collection(Collections.COMPANIES)
    .doc('mock-manufacturing-data')
    .get();
  return doc.exists ? (doc.data()?.productionLines as ProductionLine[]) : [];
}

export async function getServiceTickets(): Promise<ServiceTicket[]> {
  const doc = await adminDb
    .collection(Collections.COMPANIES)
    .doc('mock-service-ticket-data')
    .get();
  return doc.exists ? (doc.data()?.serviceTickets as ServiceTicket[]) : [];
}

export async function resolveComplianceIssue(
  productId: string,
  userId: string,
): Promise<Product> {
  await checkProductOwnership(productId, userId);
  const docRef = adminDb.collection(Collections.PRODUCTS).doc(productId);
  await docRef.update({
    verificationStatus: 'Draft',
    updatedAt: admin.firestore.Timestamp.now(),
  });
  await logAuditEvent(
    'compliance.resolved',
    productId,
    { newStatus: 'Draft' },
    userId,
  );
  revalidatePath('/dashboard/flagged');
  revalidatePath('/dashboard/products');
  return docToProduct(await docRef.get());
}
