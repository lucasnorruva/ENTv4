
'use server';

import { revalidatePath } from 'next/cache';
import * as admin from 'firebase-admin';
import { adminDb } from '@/lib/firebase-admin';
import { Collections } from '@/lib/constants';
import { type ProductFormValues } from '@/lib/schemas';
import type { Product, SustainabilityData } from '@/types';
import {
  suggestImprovements,
  type SuggestImprovementsInput,
} from '@/ai/flows/enhance-passport-information';
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
import { compliancePaths } from './compliance-data';

/**
 * Converts a Firestore document snapshot into a client-side Product object.
 * @param doc The Firestore document snapshot.
 * @returns A Product object with timestamps converted to ISO strings.
 */
function docToProduct(doc: admin.firestore.DocumentSnapshot): Product {
  const data = doc.data()!;
  // Create a base product object with the document ID and data.
  const product: Product = {
    id: doc.id,
    ...(data as Omit<Product, 'id'>), // Cast the data to the expected type
  };

  // Safely convert all Timestamp fields to ISO strings for client-side consumption.
  for (const key of Object.keys(product)) {
    const value = product[key as keyof Product];
    if (value instanceof admin.firestore.Timestamp) {
      // @ts-ignore - We are intentionally converting Timestamp to string
      product[key as keyof Product] = value.toDate().toISOString();
    }
  }

  return product;
}

export async function getProducts(): Promise<Product[]> {
  const productsSnapshot = await adminDb
    .collection(Collections.PRODUCTS)
    .orderBy('updatedAt', 'desc')
    .get();
  return productsSnapshot.docs.map(docToProduct);
}

export async function getProductById(id: string): Promise<Product | undefined> {
  const productDoc = await adminDb.collection(Collections.PRODUCTS).doc(id).get();
  if (!productDoc.exists) {
    return undefined;
  }
  return docToProduct(productDoc);
}

async function runAllAiFlows(
  productData: ProductFormValues,
): Promise<{ sustainability: SustainabilityData; qrLabelText: string }> {
  const selectedCompliancePath = compliancePaths.find(
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
  const { sustainability, qrLabelText } = await runAllAiFlows(productData);

  if (productId) {
    const productRef = adminDb.collection(Collections.PRODUCTS).doc(productId);
    const updates = {
      ...productData,
      sustainability,
      qrLabelText,
      lastUpdated: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
    };
    await productRef.update(updates);
    await logAuditEvent(
      'product.updated',
      productId,
      { fields: Object.keys(productData) },
      userId,
    );
    const updatedProduct = await getProductById(productId);
    revalidatePath('/dashboard');
    revalidatePath(`/products/${productId}`);
    return updatedProduct!;
  } else {
    const newProductRef = adminDb.collection(Collections.PRODUCTS).doc();
    const newProductData = {
      ...productData,
      sustainability,
      qrLabelText,
      verificationStatus: 'Not Submitted',
      endOfLifeStatus: 'Active',
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
      lastUpdated: admin.firestore.Timestamp.now(),
    };
    await newProductRef.set(newProductData);
    await logAuditEvent(
      'product.created',
      newProductRef.id,
      { productName: newProductData.productName },
      userId,
    );
    const savedProduct = await getProductById(newProductRef.id);
    revalidatePath('/dashboard');
    return savedProduct!;
  }
}

export async function deleteProduct(
  id: string,
  userId: string,
): Promise<{ success: boolean }> {
  const productToDelete = await getProductById(id);
  if (productToDelete) {
    await adminDb.collection(Collections.PRODUCTS).doc(id).delete();
    await logAuditEvent(
      'product.deleted',
      id,
      { productName: productToDelete.productName },
      userId,
    );
  }
  revalidatePath('/dashboard');
  return { success: true };
}

export async function submitForReview(
  productId: string,
  userId: string,
): Promise<Product> {
  const productRef = adminDb.collection(Collections.PRODUCTS).doc(productId);
  await productRef.update({
    verificationStatus: 'Pending',
    updatedAt: admin.firestore.Timestamp.now(),
  });
  await logAuditEvent(
    'passport.submitted',
    productId,
    { status: 'Pending' },
    userId,
  );
  const updatedProduct = await getProductById(productId);
  revalidatePath('/dashboard');
  revalidatePath(`/products/${productId}`);
  return updatedProduct!;
}

export async function approvePassport(
  productId: string,
  userId: string,
): Promise<Product> {
  const product = await getProductById(productId);
  if (!product) throw new Error('Product not found for approval.');

  const dataHash = await hashProductData(product);
  const [blockchainProof, ebsiVcId] = await Promise.all([
    anchorToPolygon(productId, dataHash),
    generateEbsiCredential(productId),
  ]);

  const productRef = adminDb.collection(Collections.PRODUCTS).doc(productId);
  await productRef.update({
    verificationStatus: 'Verified',
    lastVerificationDate: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now(),
    blockchainProof: blockchainProof,
    ebsiVcId: ebsiVcId,
  });

  await logAuditEvent(
    'passport.approved',
    productId,
    { txHash: blockchainProof.txHash },
    userId,
  );
  const updatedProduct = await getProductById(productId);
  revalidatePath('/dashboard');
  revalidatePath(`/products/${productId}`);
  return updatedProduct!;
}

export async function rejectPassport(
  productId: string,
  reason: string,
  userId: string,
): Promise<Product> {
  const product = await getProductById(productId);
  if (!product) throw new Error('Product not found for rejection.');

  const productRef = adminDb.collection(Collections.PRODUCTS).doc(productId);
  await productRef.update({
    verificationStatus: 'Failed',
    lastVerificationDate: admin.firestore.Timestamp.now(),
    'sustainability.isCompliant': false,
    'sustainability.complianceSummary': `Rejected: ${reason}`,
    updatedAt: admin.firestore.Timestamp.now(),
  });

  await logAuditEvent('passport.rejected', productId, { reason }, userId);
  const updatedProduct = await getProductById(productId);
  revalidatePath('/dashboard');
  revalidatePath(`/products/${productId}`);
  return updatedProduct!;
}

export async function runSuggestImprovements(
  data: SuggestImprovementsInput,
) {
  return suggestImprovements(data);
}

export async function recalculateScore(
  productId: string,
  userId: string,
): Promise<Product> {
  const product = await getProductById(productId);
  if (!product) throw new Error('Product not found');

  const { sustainability, qrLabelText } = await runAllAiFlows(product);

  const productRef = adminDb.collection(Collections.PRODUCTS).doc(productId);
  await productRef.update({
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
  const updatedProduct = await getProductById(productId);
  revalidatePath('/dashboard');
  revalidatePath(`/products/${productId}`);
  return updatedProduct!;
}

export async function markAsRecycled(
  productId: string,
  userId: string,
): Promise<Product> {
  const productRef = adminDb.collection(Collections.PRODUCTS).doc(productId);
  await productRef.update({
    endOfLifeStatus: 'Recycled',
    updatedAt: admin.firestore.Timestamp.now(),
  });

  await logAuditEvent('product.recycled', productId, {}, userId);
  const updatedProduct = await getProductById(productId);
  revalidatePath('/dashboard');
  revalidatePath(`/products/${productId}`);
  return updatedProduct!;
}

export async function logAuditEvent(
  action: string,
  entityId: string,
  details: Record<string, any>,
  userId: string = 'system',
): Promise<void> {
  const logData = {
    userId,
    action,
    entityId,
    details,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  };
  await adminDb.collection(Collections.AUDIT_LOGS).add(logData);
}
