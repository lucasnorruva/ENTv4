'use server';

import * as admin from 'firebase-admin';
import { revalidatePath } from 'next/cache';
import { randomBytes } from 'crypto';

import { adminDb } from '@/lib/firebase-admin';
import { Collections } from '@/lib/constants';
import type {
  AuditLog,
  Product,
  ProductionLine,
  ServiceTicket,
  SustainabilityData,
  CompliancePath,
  ApiKey,
} from '@/types';
import {
  productFormSchema,
  type ProductFormValues,
  compliancePathFormSchema,
  type CompliancePathFormValues,
} from '@/lib/schemas';
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
import { getMockUsers } from './auth';
import { serviceTickets as mockServiceTickets } from './service-ticket-data';
import { productionLines as mockProductionLines } from './manufacturing-data';

// --- HELPERS ---

/**
 * Recursively converts Firestore Timestamps in an object to ISO strings.
 * This is crucial for passing data from Server Components to Client Components.
 * @param data The object to convert.
 */
const convertTimestamps = (data: any): any => {
  if (!data) return data;
  const newData = { ...data };
  for (const key in newData) {
    if (Object.prototype.hasOwnProperty.call(newData, key)) {
      const value = newData[key];
      if (value instanceof admin.firestore.Timestamp) {
        newData[key] = value.toDate().toISOString();
      } else if (
        value &&
        typeof value === 'object' &&
        !Array.isArray(value)
      ) {
        newData[key] = convertTimestamps(value);
      } else if (Array.isArray(value)) {
        newData[key] = value.map(item => convertTimestamps(item));
      }
    }
  }
  return newData;
};

/**
 * Formats a Firestore document snapshot into a client-friendly object.
 * @param doc The Firestore document snapshot.
 */
const formatDoc = <T>(doc: admin.firestore.DocumentSnapshot): T => {
  const data = doc.data();
  return convertTimestamps({ id: doc.id, ...data }) as T;
};

// --- PRODUCT ACTIONS ---

export async function getProducts(): Promise<Product[]> {
  const snapshot = await adminDb
    .collection(Collections.PRODUCTS)
    .orderBy('updatedAt', 'desc')
    .get();
  if (snapshot.empty) return [];
  return snapshot.docs.map(doc => formatDoc<Product>(doc));
}

export async function getProductById(id: string): Promise<Product | undefined> {
  const docRef = adminDb.collection(Collections.PRODUCTS).doc(id);
  const docSnap = await docRef.get();
  if (!docSnap.exists) return undefined;
  return formatDoc<Product>(docSnap);
}

async function runAllAiFlows(
  productData: ProductFormValues,
): Promise<{ sustainability: SustainabilityData; qrLabelText: string }> {
  const paths = await getCompliancePaths();
  const selectedCompliancePath = paths.find(
    p => p.id === productData.compliancePathId,
  );

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
      compliancePathName: selectedCompliancePath?.name ?? 'Default Compliance',
      complianceRules: selectedCompliancePath
        ? JSON.stringify(selectedCompliancePath.rules)
        : '{}',
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
}

export async function saveProduct(
  productData: ProductFormValues,
  userId: string,
  productId?: string,
): Promise<Product> {
  const validatedData = productFormSchema.parse(productData);
  const { sustainability, qrLabelText } = await runAllAiFlows(validatedData);

  const dataToSave = {
    ...validatedData,
    sustainability,
    qrLabelText,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
  };

  const productPath = '/dashboard/products';
  const passportPath = `/products/${productId}`;

  if (productId) {
    const docRef = adminDb.collection(Collections.PRODUCTS).doc(productId);
    await docRef.update(dataToSave);
    await logAuditEvent(
      'product.updated',
      productId,
      { fields: Object.keys(validatedData) },
      userId,
    );
    const updatedDoc = await docRef.get();
    revalidatePath(productPath);
    revalidatePath(passportPath);
    return formatDoc<Product>(updatedDoc);
  } else {
    const newProductData = {
      ...dataToSave,
      verificationStatus: 'Not Submitted' as const,
      endOfLifeStatus: 'Active' as const,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    const docRef = await adminDb
      .collection(Collections.PRODUCTS)
      .add(newProductData);
    await logAuditEvent(
      'product.created',
      docRef.id,
      { productName: newProductData.productName },
      userId,
    );
    const newDoc = await docRef.get();
    revalidatePath(productPath);
    return formatDoc<Product>(newDoc);
  }
}

export async function deleteProduct(
  id: string,
  userId: string,
): Promise<{ success: boolean }> {
  const docRef = adminDb.collection(Collections.PRODUCTS).doc(id);
  const docSnap = await docRef.get();
  if (docSnap.exists) {
    await logAuditEvent(
      'product.deleted',
      id,
      { productName: docSnap.data()?.productName },
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
  const docRef = adminDb.collection(Collections.PRODUCTS).doc(productId);
  await docRef.update({
    verificationStatus: 'Pending',
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
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
  const updatedDoc = await docRef.get();
  return formatDoc<Product>(updatedDoc);
}

export async function approvePassport(
  productId: string,
  userId: string,
): Promise<Product> {
  const docRef = adminDb.collection(Collections.PRODUCTS).doc(productId);
  const productSnap = await docRef.get();
  if (!productSnap.exists) throw new Error('Product not found');

  const product = formatDoc<Product>(productSnap);
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

  await logAuditEvent(
    'passport.approved',
    productId,
    { txHash: blockchainProof.txHash },
    userId,
  );
  revalidatePath('/dashboard/audit');
  revalidatePath('/dashboard/products');
  revalidatePath(`/products/${productId}`);
  const updatedDoc = await docRef.get();
  return formatDoc<Product>(updatedDoc);
}

export async function rejectPassport(
  productId: string,
  reason: string,
  userId: string,
): Promise<Product> {
  const docRef = adminDb.collection(Collections.PRODUCTS).doc(productId);
  await docRef.update({
    verificationStatus: 'Failed',
    lastVerificationDate: admin.firestore.FieldValue.serverTimestamp(),
    'sustainability.isCompliant': false,
    'sustainability.complianceSummary': `Rejected: ${reason}`,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  await logAuditEvent('passport.rejected', productId, { reason }, userId);
  revalidatePath('/dashboard/audit');
  revalidatePath('/dashboard/products');
  revalidatePath('/dashboard/flagged');
  revalidatePath(`/products/${productId}`);
  const updatedDoc = await docRef.get();
  return formatDoc<Product>(updatedDoc);
}

export async function resolveComplianceIssue(
  productId: string,
  userId: string,
): Promise<Product> {
  const docRef = adminDb.collection(Collections.PRODUCTS).doc(productId);
  await docRef.update({
    status: 'Draft',
    verificationStatus: 'Not Submitted',
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  await logAuditEvent(
    'compliance.resolved',
    productId,
    { newStatus: 'Draft' },
    userId,
  );
  revalidatePath('/dashboard/flagged');
  revalidatePath('/dashboard/products');
  revalidatePath(`/products/${productId}`);
  const updatedDoc = await docRef.get();
  return formatDoc<Product>(updatedDoc);
}

export async function runSuggestImprovements(
  data: ProductFormValues,
): Promise<any> {
  return suggestImprovements(data);
}

export async function recalculateScore(
  productId: string,
  userId: string,
): Promise<Product> {
  const docRef = adminDb.collection(Collections.PRODUCTS).doc(productId);
  const productSnap = await docRef.get();
  if (!productSnap.exists) throw new Error('Product not found');
  const product = formatDoc<Product>(productSnap);

  const formValues: ProductFormValues = product;
  const { sustainability, qrLabelText } = await runAllAiFlows(formValues);

  await docRef.update({
    sustainability,
    qrLabelText,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await logAuditEvent(
    'product.recalculate_score',
    productId,
    { newScore: sustainability.score },
    userId,
  );
  revalidatePath('/dashboard/products');
  revalidatePath(`/products/${productId}`);
  const updatedDoc = await docRef.get();
  return formatDoc<Product>(updatedDoc);
}

export async function markAsRecycled(
  productId: string,
  userId: string,
): Promise<Product> {
  const docRef = adminDb.collection(Collections.PRODUCTS).doc(productId);
  await docRef.update({
    endOfLifeStatus: 'Recycled',
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  await logAuditEvent('product.recycled', productId, {}, userId);
  revalidatePath('/dashboard/eol');
  revalidatePath(`/products/${productId}`);
  const updatedDoc = await docRef.get();
  return formatDoc<Product>(updatedDoc);
}

// --- AUDIT LOG ACTIONS ---

export async function logAuditEvent(
  action: string,
  entityId: string,
  details: Record<string, any>,
  userId: string = 'system',
): Promise<void> {
  const logEntry = {
    userId,
    action,
    entityId,
    details,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  await adminDb.collection(Collections.AUDIT_LOGS).add(logEntry);
  revalidatePath('/dashboard/analytics');
  revalidatePath('/dashboard/history');
}

export async function getAuditLogs(): Promise<AuditLog[]> {
  const snapshot = await adminDb
    .collection(Collections.AUDIT_LOGS)
    .orderBy('createdAt', 'desc')
    .get();
  if (snapshot.empty) return [];
  return snapshot.docs.map(doc => formatDoc<AuditLog>(doc));
}

export async function getAuditLogsForUser(userId: string): Promise<AuditLog[]> {
  const snapshot = await adminDb
    .collection(Collections.AUDIT_LOGS)
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .get();
  if (snapshot.empty) return [];
  return snapshot.docs.map(doc => formatDoc<AuditLog>(doc));
}


// --- COMPLIANCE PATH ACTIONS ---

export async function getCompliancePaths(): Promise<CompliancePath[]> {
  const snapshot = await adminDb
    .collection(Collections.COMPLIANCE_PATHS)
    .orderBy('name', 'asc')
    .get();
  if (snapshot.empty) return [];
  return snapshot.docs.map(doc => formatDoc<CompliancePath>(doc));
}

export async function saveCompliancePath(
  pathData: CompliancePathFormValues,
  userId: string,
  pathId?: string,
): Promise<CompliancePath> {
  const validatedData = compliancePathFormSchema.parse(pathData);
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
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  const compliancePath = '/dashboard/compliance';

  if (pathId) {
    const docRef = adminDb.collection(Collections.COMPLIANCE_PATHS).doc(pathId);
    await docRef.update(dataToSave);
    await logAuditEvent(
      'compliance_path.updated',
      pathId,
      { name: dataToSave.name },
      userId,
    );
    const updatedDoc = await docRef.get();
    revalidatePath(compliancePath);
    return formatDoc<CompliancePath>(updatedDoc);
  } else {
    const newPathData = {
      ...dataToSave,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    const docRef = await adminDb
      .collection(Collections.COMPLIANCE_PATHS)
      .add(newPathData);
    await logAuditEvent(
      'compliance_path.created',
      docRef.id,
      { name: newPathData.name },
      userId,
    );
    const newDoc = await docRef.get();
    revalidatePath(compliancePath);
    return formatDoc<CompliancePath>(newDoc);
  }
}

// --- API KEY ACTIONS ---

export async function getApiKeysForUser(userId: string): Promise<ApiKey[]> {
  const snapshot = await adminDb
    .collection(Collections.API_KEYS)
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .get();
  if (snapshot.empty) return [];
  return snapshot.docs.map(doc => formatDoc<ApiKey>(doc));
}

export async function createApiKey(
  label: string,
  userId: string,
): Promise<{ key: ApiKey; rawToken: string }> {
  const rawToken = `sk_live_${randomBytes(24).toString('hex')}`;
  // In a real production app, you would HASH the token before storing it.
  // For this prototype, we store it directly for simplicity.
  const keyData = {
    label,
    userId,
    token: rawToken,
    status: 'Active' as const,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  const docRef = await adminDb.collection(Collections.API_KEYS).add(keyData);
  await logAuditEvent('api_key.created', docRef.id, { label }, userId);

  const newKey = await docRef.get();
  revalidatePath('/dashboard/keys');
  return { key: formatDoc<ApiKey>(newKey), rawToken };
}

export async function revokeApiKey(keyId: string, userId: string): Promise<ApiKey> {
  const docRef = adminDb.collection(Collections.API_KEYS).doc(keyId);
  const docSnap = await docRef.get();
  if (!docSnap.exists || docSnap.data()?.userId !== userId) {
    throw new Error('API Key not found or permission denied.');
  }
  await docRef.update({
    status: 'Revoked',
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  await logAuditEvent('api_key.revoked', keyId, {}, userId);
  revalidatePath('/dashboard/keys');
  const updatedDoc = await docRef.get();
  return formatDoc<ApiKey>(updatedDoc);
}

export async function deleteApiKey(keyId: string, userId: string): Promise<void> {
  const docRef = adminDb.collection(Collections.API_KEYS).doc(keyId);
  const docSnap = await docRef.get();
  if (!docSnap.exists || docSnap.data()?.userId !== userId) {
    throw new Error('API Key not found or permission denied.');
  }
  await docRef.delete();
  await logAuditEvent('api_key.deleted', keyId, {}, userId);
  revalidatePath('/dashboard/keys');
}


// --- MOCK DATA ACTIONS (to be replaced later) ---

export async function getProductionLines(): Promise<ProductionLine[]> {
  // In a real app, this would fetch from a 'productionLines' collection in Firestore.
  return Promise.resolve(JSON.parse(JSON.stringify(mockProductionLines)));
}

export async function getServiceTickets(): Promise<ServiceTicket[]> {
  // In a real app, this would fetch from a 'serviceTickets' collection in Firestore.
  return Promise.resolve(JSON.parse(JSON.stringify(mockServiceTickets)));
}
