
'use server';

import { revalidatePath } from 'next/cache';
import { randomBytes } from 'crypto';
import * as admin from 'firebase-admin';
import { adminDb } from './firebase-admin';
import { Collections } from './constants';
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

// --- DATA CONVERSION HELPERS ---

// Generic converter to handle Firestore Timestamps
const fromFirestore = <T extends { createdAt?: any; updatedAt?: any }>(
  doc: admin.firestore.DocumentSnapshot,
): T => {
  const data = doc.data() as any;
  return {
    id: doc.id,
    ...data,
    ...(data.createdAt && {
      createdAt: data.createdAt.toDate().toISOString(),
    }),
    ...(data.updatedAt && {
      updatedAt: data.updatedAt.toDate().toISOString(),
    }),
    // Handle other potential date fields
    ...(data.lastUpdated && {
      lastUpdated: data.lastUpdated.toDate().toISOString(),
    }),
    ...(data.lastVerificationDate && {
      lastVerificationDate: data.lastVerificationDate.toDate().toISOString(),
    }),
  } as T;
};

// --- AUDIT LOGGING ---

const logAuditEvent = async (
  action: string,
  entityId: string,
  details: Record<string, any>,
  userId: string = 'system',
) => {
  const logEntry = {
    userId,
    action,
    entityId,
    details,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  await adminDb.collection(Collections.AUDIT_LOGS).add(logEntry);
  revalidatePath('/dashboard/analytics');
  revalidatePath('/dashboard/history');
  revalidatePath('/dashboard/logs');
};

// --- AI FLOW ORCHESTRATION ---

const runAllAiFlows = async (
  productData: ProductFormValues,
): Promise<{ sustainability: SustainabilityData; qrLabelText: string }> => {
  const compliancePath = productData.compliancePathId
    ? await getCompliancePathById(productData.compliancePathId)
    : null;

  const [
    esgResult,
    complianceResult,
    qrLabelResult,
    classificationResult,
    lifecycleAnalysisResult,
  ] = await Promise.all([
    calculateSustainability({
      productName: productData.productName,
      productDescription: productData.productDescription,
      category: productData.category,
      materials: productData.materials,
      manufacturing: productData.manufacturing,
      certifications: productData.certifications,
    }),
    summarizeComplianceGaps({
      productName: productData.productName,
      category: productData.category,
      materials: productData.materials,
      compliancePathName: compliancePath?.name ?? 'Default Compliance',
      complianceRules: compliancePath ? JSON.stringify(compliancePath.rules) : '{}',
    }),
    generateQRLabelText({
      productName: productData.productName,
      supplier: productData.supplier,
      materials: productData.materials,
    }),
    classifyProduct({
      productName: productData.productName,
      productDescription: productData.productDescription,
      category: productData.category,
    }),
    analyzeProductLifecycle({
      productName: productData.productName,
      productDescription: productData.productDescription,
      category: productData.category,
      materials: productData.materials,
      manufacturing: productData.manufacturing,
    }),
  ]);

  return {
    sustainability: {
      ...esgResult,
      ...complianceResult,
      classification: classificationResult,
      lifecycleAnalysis: lifecycleAnalysisResult,
    },
    qrLabelText: qrLabelResult.qrLabelText,
  };
};

// --- PRODUCT ACTIONS ---

export async function getProducts(): Promise<Product[]> {
  const snapshot = await adminDb
    .collection(Collections.PRODUCTS)
    .orderBy('createdAt', 'desc')
    .get();
  if (snapshot.empty) return [];
  return snapshot.docs.map(doc => fromFirestore<Product>(doc));
}

export async function getProductById(
  id: string,
): Promise<Product | undefined> {
  const doc = await adminDb.collection(Collections.PRODUCTS).doc(id).get();
  if (!doc.exists) return undefined;
  return fromFirestore<Product>(doc);
}

export async function saveProduct(
  productData: ProductFormValues,
  userId: string,
  productId?: string,
): Promise<Product> {
  const validatedData = productFormSchema.parse(productData);
  const { sustainability, qrLabelText } = await runAllAiFlows(validatedData);

  const now = admin.firestore.FieldValue.serverTimestamp();

  if (productId) {
    const docRef = adminDb.collection(Collections.PRODUCTS).doc(productId);
    const dataToUpdate = {
      ...validatedData,
      sustainability,
      qrLabelText,
      updatedAt: now,
      lastUpdated: now,
    };
    await docRef.update(dataToUpdate);
    await logAuditEvent('product.updated', productId, { fields: Object.keys(validatedData) }, userId);
    revalidatePath('/dashboard/products');
    revalidatePath(`/products/${productId}`);
    const updatedDoc = await docRef.get();
    return fromFirestore<Product>(updatedDoc);
  } else {
    const newDocRef = adminDb.collection(Collections.PRODUCTS).doc();
    const newProduct: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'lastUpdated'> = {
      ...validatedData,
      sustainability,
      qrLabelText,
      verificationStatus: 'Not Submitted',
      endOfLifeStatus: 'Active',
    };
    const finalProductData = {
      ...newProduct,
      createdAt: now,
      updatedAt: now,
      lastUpdated: now,
    };
    await newDocRef.set(finalProductData);
    await logAuditEvent('product.created', newDocRef.id, { productName: newProduct.productName }, userId);
    revalidatePath('/dashboard/products');
    const createdDoc = await newDocRef.get();
    return fromFirestore<Product>(createdDoc);
  }
}

export async function deleteProduct(
  id: string,
  userId: string,
): Promise<{ success: boolean }> {
  const docRef = adminDb.collection(Collections.PRODUCTS).doc(id);
  const doc = await docRef.get();
  if (doc.exists) {
    const productName = doc.data()?.productName;
    await logAuditEvent('product.deleted', id, { productName }, userId);
    await docRef.delete();
  }
  revalidatePath('/dashboard/products');
  return { success: true };
}

export async function submitForReview(productId: string, userId: string): Promise<Product> {
  const docRef = adminDb.collection(Collections.PRODUCTS).doc(productId);
  await docRef.update({
    verificationStatus: 'Pending',
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  await logAuditEvent('passport.submitted', productId, { status: 'Pending' }, userId);
  revalidatePath('/dashboard/products');
  revalidatePath('/dashboard/audit');
  revalidatePath(`/products/${productId}`);
  const updatedDoc = await docRef.get();
  return fromFirestore<Product>(updatedDoc);
}

export async function approvePassport(productId: string, userId: string): Promise<Product> {
  const docRef = adminDb.collection(Collections.PRODUCTS).doc(productId);
  const productDoc = await docRef.get();
  if (!productDoc.exists) throw new Error('Product not found');
  const product = fromFirestore<Product>(productDoc);

  const compliancePath = product.compliancePathId
    ? await getCompliancePathById(product.compliancePathId)
    : null;
  if (!compliancePath) {
    throw new Error('Compliance path not configured for this product.');
  }

  const { isCompliant, gaps } = await verifyProductAgainstPath(product, compliancePath);
  if (!isCompliant) {
    const summary = `Product failed final verification with ${gaps.length} issue(s).`;
    await rejectPassport(product.id, summary, gaps, 'system:gatekeeper');
    throw new Error(`Cannot approve: Product is not compliant. Issues found: ${gaps.map(g => g.issue).join(', ')}`);
  }

  const dataHash = await hashProductData(product);
  const [blockchainProof, ebsiVcId] = await Promise.all([
    anchorToPolygon(productId, dataHash),
    generateEbsiCredential(productId),
  ]);

  await docRef.update({
    verificationStatus: 'Verified',
    lastVerificationDate: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    blockchainProof,
    ebsiVcId,
  });

  await logAuditEvent('passport.approved', productId, { txHash: blockchainProof.txHash }, userId);
  revalidatePath('/dashboard/audit');
  revalidatePath('/dashboard/products');
  revalidatePath(`/products/${productId}`);
  const updatedDoc = await docRef.get();
  return fromFirestore<Product>(updatedDoc);
}

export async function rejectPassport(
  productId: string,
  summary: string,
  gaps: ComplianceGap[],
  userId: string,
): Promise<Product> {
  const docRef = adminDb.collection(Collections.PRODUCTS).doc(productId);
  await docRef.set(
    {
      verificationStatus: 'Failed',
      lastVerificationDate: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      'sustainability.isCompliant': false,
      'sustainability.complianceSummary': summary,
      'sustainability.gaps': gaps,
    },
    { merge: true },
  );

  await logAuditEvent('passport.rejected', productId, { reason: summary, gaps }, userId);
  revalidatePath('/dashboard/audit');
  revalidatePath('/dashboard/products');
  revalidatePath('/dashboard/flagged');
  revalidatePath(`/products/${productId}`);
  const updatedDoc = await docRef.get();
  return fromFirestore<Product>(updatedDoc);
}

export async function resolveComplianceIssue(productId: string, userId: string): Promise<Product> {
  const docRef = adminDb.collection(Collections.PRODUCTS).doc(productId);
  await docRef.update({
    status: 'Draft',
    verificationStatus: 'Not Submitted',
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  await logAuditEvent('compliance.resolved', productId, { newStatus: 'Draft' }, userId);
  revalidatePath('/dashboard/flagged');
  revalidatePath('/dashboard/products');
  revalidatePath(`/products/${productId}`);
  const updatedDoc = await docRef.get();
  return fromFirestore<Product>(updatedDoc);
}

export async function runSuggestImprovements(data: ProductFormValues): Promise<any> {
  return suggestImprovements(data);
}

export async function recalculateScore(productId: string, userId: string): Promise<Product> {
  const product = await getProductById(productId);
  if (!product) throw new Error('Product not found');

  const { sustainability, qrLabelText } = await runAllAiFlows(product);
  await adminDb.collection(Collections.PRODUCTS).doc(productId).update({
    sustainability,
    qrLabelText,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await logAuditEvent('product.recalculate_score', productId, { newScore: sustainability.score }, userId);
  revalidatePath('/dashboard/products');
  revalidatePath(`/products/${productId}`);
  const updatedDoc = await adminDb.collection(Collections.PRODUCTS).doc(productId).get();
  return fromFirestore<Product>(updatedDoc);
}

export async function markAsRecycled(productId: string, userId: string): Promise<Product> {
  const docRef = adminDb.collection(Collections.PRODUCTS).doc(productId);
  await docRef.update({
    endOfLifeStatus: 'Recycled',
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  await logAuditEvent('product.recycled', productId, {}, userId);
  revalidatePath('/dashboard/eol');
  revalidatePath(`/products/${productId}`);
  const updatedDoc = await docRef.get();
  return fromFirestore<Product>(updatedDoc);
}

// --- AUDIT LOG ACTIONS ---

export async function getAuditLogs(): Promise<AuditLog[]> {
  const snapshot = await adminDb.collection(Collections.AUDIT_LOGS).orderBy('createdAt', 'desc').get();
  if (snapshot.empty) return [];
  return snapshot.docs.map(doc => fromFirestore<AuditLog>(doc));
}

export async function getAuditLogsForUser(userId: string): Promise<AuditLog[]> {
  const snapshot = await adminDb.collection(Collections.AUDIT_LOGS).where('userId', '==', userId).orderBy('createdAt', 'desc').get();
  if (snapshot.empty) return [];
  return snapshot.docs.map(doc => fromFirestore<AuditLog>(doc));
}

// --- COMPLIANCE PATH ACTIONS ---

export async function getCompliancePaths(): Promise<CompliancePath[]> {
  const snapshot = await adminDb.collection(Collections.COMPLIANCE_PATHS).get();
  if (snapshot.empty) return [];
  return snapshot.docs.map(doc => fromFirestore<CompliancePath>(doc));
}

async function getCompliancePathById(id: string): Promise<CompliancePath | null> {
    const doc = await adminDb.collection(Collections.COMPLIANCE_PATHS).doc(id).get();
    if (!doc.exists) return null;
    return fromFirestore<CompliancePath>(doc);
}

export async function saveCompliancePath(
  pathData: CompliancePathFormValues,
  userId: string,
  pathId?: string,
): Promise<CompliancePath> {
  const validatedData = compliancePathFormSchema.parse(pathData);
  const now = admin.firestore.FieldValue.serverTimestamp();
  const dataToSave = {
    name: validatedData.name,
    description: validatedData.description,
    category: validatedData.category,
    regulations: validatedData.regulations.split(',').map(s => s.trim()).filter(Boolean),
    rules: {
      minSustainabilityScore: validatedData.minSustainabilityScore,
      requiredKeywords: validatedData.requiredKeywords?.split(',').map(s => s.trim()).filter(Boolean) || [],
      bannedKeywords: validatedData.bannedKeywords?.split(',').map(s => s.trim()).filter(Boolean) || [],
    },
    updatedAt: now,
  };

  if (pathId) {
    const docRef = adminDb.collection(Collections.COMPLIANCE_PATHS).doc(pathId);
    await docRef.update(dataToSave);
    await logAuditEvent('compliance_path.updated', pathId, { name: dataToSave.name }, userId);
    revalidatePath('/dashboard/compliance');
    const updatedDoc = await docRef.get();
    return fromFirestore<CompliancePath>(updatedDoc);
  } else {
    const newDocRef = adminDb.collection(Collections.COMPLIANCE_PATHS).doc();
    const newPath = { ...dataToSave, createdAt: now };
    await newDocRef.set(newPath);
    await logAuditEvent('compliance_path.created', newDocRef.id, { name: newPath.name }, userId);
    revalidatePath('/dashboard/compliance');
    const createdDoc = await newDocRef.get();
    return fromFirestore<CompliancePath>(createdDoc);
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
  const now = admin.firestore.FieldValue.serverTimestamp();
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
    await logAuditEvent('user.updated', userId, { email: validatedData.email }, adminUserId);
    revalidatePath('/dashboard/users');
    const updatedDoc = await docRef.get();
    return fromFirestore<User>(updatedDoc);
  } else {
    // In a real app, you'd create the user in Firebase Auth first, then create the Firestore doc with that UID.
    const newDocRef = adminDb.collection(Collections.USERS).doc();
    const newUser = { ...dataToSave, createdAt: now };
    await newDocRef.set(newUser);
    await logAuditEvent('user.created', newDocRef.id, { email: newUser.email }, adminUserId);
    revalidatePath('/dashboard/users');
    const createdDoc = await newDocRef.get();
    return fromFirestore<User>(createdDoc);
  }
}

export async function deleteUser(userId: string, adminUserId: string): Promise<{ success: boolean }> {
  const docRef = adminDb.collection(Collections.USERS).doc(userId);
  const doc = await docRef.get();
  if (doc.exists) {
    await logAuditEvent('user.deleted', userId, { email: doc.data()?.email }, adminUserId);
    await docRef.delete();
  }
  revalidatePath('/dashboard/users');
  return { success: true };
}

// --- SETTINGS ACTIONS ---

export async function updateUserProfile(userId: string, fullName: string): Promise<User> {
  const docRef = adminDb.collection(Collections.USERS).doc(userId);
  await docRef.update({ fullName, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
  await logAuditEvent('user.profile.updated', userId, { fullName }, userId);
  revalidatePath('/dashboard/settings');
  revalidatePath('/dashboard/layout');
  const updatedDoc = await docRef.get();
  return fromFirestore<User>(updatedDoc);
}

export async function updateUserPassword(userId: string, current: string, newPass: string): Promise<{ success: boolean }> {
  if (current !== 'password123') {
    throw new Error("Current password does not match.");
  }
  await logAuditEvent('user.password.updated', userId, {}, userId);
  return { success: true };
}

export async function saveNotificationPreferences(userId: string, prefs: Record<string, boolean>): Promise<{ success: boolean }> {
  await logAuditEvent('user.notifications.updated', userId, { preferences: prefs }, userId);
  return { success: true };
}

// --- API KEY ACTIONS ---

export async function getApiKeys(userId: string): Promise<ApiKey[]> {
  const snapshot = await adminDb.collection(Collections.API_KEYS).where('userId', '==', userId).get();
  if (snapshot.empty) return [];
  return snapshot.docs.map(doc => fromFirestore<ApiKey>(doc));
}

export async function createApiKey(label: string, userId: string): Promise<{ rawToken: string; apiKey: ApiKey }> {
  const now = admin.firestore.FieldValue.serverTimestamp();
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

  const docRef = await adminDb.collection(Collections.API_KEYS).add(newApiKeyData);
  await logAuditEvent('api_key.created', docRef.id, { label }, userId);
  revalidatePath('/dashboard/keys');
  revalidatePath('/dashboard');
  
  const createdDoc = await docRef.get();
  return { rawToken, apiKey: fromFirestore<ApiKey>(createdDoc) };
}

export async function revokeApiKey(id: string, userId: string): Promise<ApiKey> {
  const docRef = adminDb.collection(Collections.API_KEYS).doc(id);
  const doc = await docRef.get();
  if (!doc.exists || doc.data()?.userId !== userId) {
    throw new Error('API Key not found or access denied.');
  }
  await docRef.update({ status: 'Revoked', updatedAt: admin.firestore.FieldValue.serverTimestamp() });
  await logAuditEvent('api_key.revoked', id, { label: doc.data()?.label }, userId);
  revalidatePath('/dashboard/keys');
  revalidatePath('/dashboard');
  const updatedDoc = await docRef.get();
  return fromFirestore<ApiKey>(updatedDoc);
}

export async function deleteApiKey(id: string, userId: string): Promise<{ success: true }> {
  const docRef = adminDb.collection(Collections.API_KEYS).doc(id);
  const doc = await docRef.get();
  if (!doc.exists || doc.data()?.userId !== userId) {
    throw new Error('API Key not found or access denied.');
  }
  await logAuditEvent('api_key.deleted', id, { label: doc.data()?.label }, userId);
  await docRef.delete();
  revalidatePath('/dashboard/keys');
  revalidatePath('/dashboard');
  return { success: true };
}

// --- API SETTINGS ACTIONS ---

export async function getApiSettings(): Promise<ApiSettings> {
  const doc = await adminDb.collection(Collections.API_SETTINGS).doc('global').get();
  if (!doc.exists) throw new Error('API settings not found.');
  return doc.data() as ApiSettings;
}

export async function saveApiSettings(settings: ApiSettingsFormValues, adminUserId: string): Promise<ApiSettings> {
  const validatedData = apiSettingsSchema.parse(settings);
  const docRef = adminDb.collection(Collections.API_SETTINGS).doc('global');
  await docRef.set(validatedData, { merge: true });
  await logAuditEvent('settings.api.updated', 'global', { settings: validatedData }, adminUserId);
  revalidatePath('/dashboard/api-settings');
  const updatedDoc = await docRef.get();
  return updatedDoc.data() as ApiSettings;
}

// --- OTHER MOCK DATA ACTIONS (now using Firestore) ---

export async function getProductionLines(): Promise<ProductionLine[]> {
  const snapshot = await adminDb.collection(Collections.COMPANIES).doc('mock-manufacturing-data').get();
  const data = snapshot.data();
  return data?.productionLines || [];
}

export async function getServiceTickets(): Promise<ServiceTicket[]> {
    const snapshot = await adminDb.collection(Collections.COMPANIES).doc('mock-service-ticket-data').get();
    const data = snapshot.data();
    return data?.serviceTickets || [];
}
