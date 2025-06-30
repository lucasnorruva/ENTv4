'use server';

import { revalidatePath } from 'next/cache';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
  DocumentSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Collections } from '@/lib/constants';

import { compliancePaths } from './compliance-data';
import type { Product } from '@/types';
import {
  suggestImprovements,
  type SuggestImprovementsInput,
  type SuggestImprovementsOutput,
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

// Helper function to convert Firestore doc to a client-side friendly Product object.
// It handles Firestore Timestamps and ensures all necessary fields are present.
function toProduct(docSnap: DocumentSnapshot): Product {
  const data = docSnap.data();
  if (!data) {
    throw new Error('Document data is empty');
  }

  // Helper to safely convert a Timestamp to an ISO string
  const toISOString = (timestamp: any): string | undefined => {
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate().toISOString();
    }
    return timestamp; // It might already be a string
  };

  const toDateString = (timestamp: any): string | undefined => {
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate().toISOString().split('T')[0];
    }
    return timestamp;
  };

  return {
    id: docSnap.id,
    productName: data.productName,
    productDescription: data.productDescription,
    productImage: data.productImage,
    category: data.category,
    supplier: data.supplier,
    complianceLevel: data.complianceLevel,
    currentInformation: data.currentInformation,
    status: data.status,
    lastUpdated: toDateString(data.lastUpdated)!,
    createdAt: toISOString(data.createdAt)!,
    updatedAt: toISOString(data.updatedAt)!,
    classification: data.classification,
    qrLabelText: data.qrLabelText,
    esg: data.esg,
    lifecycleAnalysis: data.lifecycleAnalysis,
    lastVerificationDate: toISOString(data.lastVerificationDate),
    verificationStatus: data.verificationStatus,
    complianceSummary: data.complianceSummary,
    complianceGaps: data.complianceGaps,
    endOfLifeStatus: data.endOfLifeStatus,
    blockchainProof: data.blockchainProof,
    ebsiVcId: data.ebsiVcId,
  };
}

export async function getProducts(): Promise<Product[]> {
  const productsRef = collection(db, Collections.PRODUCTS);
  const q = query(productsRef, orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(toProduct);
}

export async function getProductById(id: string): Promise<Product | undefined> {
  const docRef = doc(db, Collections.PRODUCTS, id);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return toProduct(docSnap);
  } else {
    return undefined;
  }
}

export async function saveProduct(
  data: Omit<
    Product,
    | 'id'
    | 'createdAt'
    | 'updatedAt'
    | 'lastUpdated'
    | 'esg'
    | 'blockchainProof'
    | 'verificationStatus'
    | 'lastVerificationDate'
    | 'complianceSummary'
    | 'complianceGaps'
    | 'endOfLifeStatus'
    | 'qrLabelText'
    | 'classification'
    | 'lifecycleAnalysis'
  > & { id?: string },
  userId: string,
): Promise<Product> {
  // AI enrichments running in parallel
  const [
    esgResult,
    complianceResult,
    qrLabelResult,
    classificationResult,
    lifecycleAnalysisResult,
  ] = await Promise.all([
    calculateSustainability({
      productName: data.productName,
      productDescription: data.productDescription,
      category: data.category,
      currentInformation: data.currentInformation,
    }).catch(e => {
      console.error('AI sustainability calculation failed:', e);
      return undefined;
    }),
    summarizeComplianceGaps({
      productName: data.productName,
      productInformation: data.currentInformation,
      compliancePathName:
        compliancePaths.find(p => p.category === data.category)?.name || '',
      complianceRules: JSON.stringify(
        compliancePaths.find(p => p.category === data.category)?.rules || {},
      ),
    }).catch(e => {
      console.error('AI compliance check failed:', e);
      return undefined;
    }),
    generateQRLabelText({
      productName: data.productName,
      supplier: data.supplier,
      currentInformation: data.currentInformation,
    }).catch(e => {
      console.error('AI QR label text generation failed:', e);
      return undefined;
    }),
    classifyProduct({
      productName: data.productName,
      productDescription: data.productDescription,
      category: data.category,
      currentInformation: data.currentInformation,
    }).catch(e => {
      console.error('AI product classification failed:', e);
      return undefined;
    }),
    analyzeProductLifecycle({
      productName: data.productName,
      productDescription: data.productDescription,
      currentInformation: data.currentInformation,
    }).catch(e => {
      console.error('AI lifecycle analysis failed:', e);
      return undefined;
    }),
  ]);

  if (data.id) {
    // Update existing product
    const docRef = doc(db, Collections.PRODUCTS, data.id);
    const productData = {
      ...data,
      updatedAt: Timestamp.now(),
      lastUpdated: Timestamp.now(),
      ...(esgResult && { esg: esgResult }),
      ...(complianceResult && {
        complianceSummary: complianceResult.complianceSummary,
        complianceGaps: complianceResult.gaps,
      }),
      ...(qrLabelResult && { qrLabelText: qrLabelResult.qrLabelText }),
      ...(classificationResult && { classification: classificationResult }),
      ...(lifecycleAnalysisResult && {
        lifecycleAnalysis: lifecycleAnalysisResult,
      }),
    };

    await setDoc(docRef, productData, { merge: true });
    const updatedProduct = await getProductById(data.id);
    if (!updatedProduct)
      throw new Error('Failed to retrieve product after update.');

    await logAuditEvent(
      'product.updated',
      updatedProduct.id,
      { fields: Object.keys(data) },
      userId,
    );

    revalidatePath('/dashboard');
    revalidatePath(`/products/${updatedProduct.id}`);
    return updatedProduct;
  } else {
    // Create new product
    const newProductData = {
      ...data,
      esg: esgResult,
      complianceSummary: complianceResult?.complianceSummary,
      complianceGaps: complianceResult?.gaps,
      classification: classificationResult,
      qrLabelText: qrLabelResult?.qrLabelText,
      lifecycleAnalysis: lifecycleAnalysisResult,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      lastUpdated: Timestamp.now(),
      verificationStatus: 'Pending' as const, // Start as pending auto-verification
      endOfLifeStatus: 'Active' as const,
    };
    const docRef = await addDoc(
      collection(db, Collections.PRODUCTS),
      newProductData,
    );

    await logAuditEvent(
      'product.created',
      docRef.id,
      { productName: newProductData.productName },
      userId,
    );

    const newProduct = await getProductById(docRef.id);
    if (!newProduct)
      throw new Error('Failed to retrieve product after creation.');

    revalidatePath('/dashboard');
    return newProduct;
  }
}

export async function deleteProduct(
  id: string,
  userId: string,
): Promise<{ success: boolean }> {
  const productToDelete = await getProductById(id);
  if (productToDelete) {
    await logAuditEvent(
      'product.deleted',
      id,
      { productName: productToDelete.productName },
      userId,
    );
  }
  await deleteDoc(doc(db, Collections.PRODUCTS, id));
  revalidatePath('/dashboard');
  return { success: true };
}

export async function submitForReview(
  productId: string,
  userId: string,
): Promise<Product> {
  const docRef = doc(db, Collections.PRODUCTS, productId);
  await setDoc(
    docRef,
    {
      verificationStatus: 'Pending',
      updatedAt: Timestamp.now(),
    },
    { merge: true },
  );

  await logAuditEvent(
    'passport.submitted',
    productId,
    { status: 'Pending' },
    userId,
  );

  const updatedProduct = await getProductById(productId);
  if (!updatedProduct)
    throw new Error('Failed to find product after submitting for review.');

  revalidatePath('/dashboard');
  revalidatePath(`/products/${productId}`);
  return updatedProduct;
}

export async function runSuggestImprovements(
  data: SuggestImprovementsInput,
): Promise<SuggestImprovementsOutput> {
  try {
    const result = await suggestImprovements(data);
    return result;
  } catch (error) {
    console.error('AI Suggestion Error:', error);
    throw new Error('Could not get suggestion from AI. Please try again.');
  }
}

export async function recalculateScore(
  productId: string,
  userId: string,
): Promise<Product> {
  const product = await getProductById(productId);
  if (!product) {
    throw new Error('Product not found');
  }

  const [esgResult, lifecycleAnalysisResult] = await Promise.all([
    calculateSustainability({
      productName: product.productName,
      productDescription: product.productDescription,
      category: product.category,
      currentInformation: product.currentInformation,
    }),
    analyzeProductLifecycle({
      productName: product.productName,
      productDescription: product.productDescription,
      currentInformation: product.currentInformation,
    }),
  ]).catch(e => {
    console.error('AI recalculation failed:', e);
    throw new Error('Failed to recalculate score or lifecycle.');
  });

  const docRef = doc(db, Collections.PRODUCTS, productId);
  await setDoc(
    docRef,
    {
      esg: esgResult,
      lifecycleAnalysis: lifecycleAnalysisResult,
      updatedAt: Timestamp.now(),
    },
    { merge: true },
  );

  await logAuditEvent(
    'product.recalculate_score',
    productId,
    { newScore: esgResult?.score },
    userId,
  );

  const updatedProduct = await getProductById(productId);
  if (!updatedProduct)
    throw new Error('Failed to find product after recalculating score.');

  revalidatePath('/dashboard');
  revalidatePath(`/products/${productId}`);
  return updatedProduct;
}

export async function logAuditEvent(
  action: string,
  entityId: string,
  details: Record<string, any>,
  userId: string = 'system',
): Promise<void> {
  // This will be implemented properly in a future task.
  console.log('AUDIT EVENT:', {
    userId,
    action,
    entityId,
    details,
    timestamp: new Date().toISOString(),
  });
  return Promise.resolve();
}

export async function approvePassport(
  productId: string,
  userId: string,
): Promise<Product> {
  const product = await getProductById(productId);
  if (!product) {
    throw new Error('Product not found');
  }

  const productDataHash = await hashProductData(product.currentInformation);
  const blockchainProof = await anchorToPolygon(product.id, productDataHash);
  const ebsiVcId = await generateEbsiCredential(product.id);

  const docRef = doc(db, Collections.PRODUCTS, productId);
  await setDoc(
    docRef,
    {
      verificationStatus: 'Verified',
      lastVerificationDate: Timestamp.now(),
      blockchainProof,
      ebsiVcId,
      updatedAt: Timestamp.now(),
    },
    { merge: true },
  );

  await logAuditEvent(
    'passport.verified',
    productId,
    { status: 'Verified', auditorId: userId, blockchainProof },
    userId,
  );

  const updatedProduct = await getProductById(productId);
  if (!updatedProduct)
    throw new Error('Failed to find product after approval.');

  revalidatePath('/dashboard');
  revalidatePath(`/products/${productId}`);
  return updatedProduct;
}

export async function rejectPassport(
  productId: string,
  feedback: string,
  userId: string,
): Promise<Product> {
  const docRef = doc(db, Collections.PRODUCTS, productId);
  const product = await getProductById(productId);
  if (!product) {
    throw new Error('Product not found');
  }

  const updatedData = {
    verificationStatus: 'Failed' as const,
    lastVerificationDate: Timestamp.now(),
    complianceSummary: feedback,
    updatedAt: Timestamp.now(),
  };

  await setDoc(docRef, updatedData, { merge: true });

  await logAuditEvent(
    'passport.rejected',
    productId,
    { status: 'Failed', auditorId: userId, feedback },
    userId,
  );

  const updatedProduct = await getProductById(productId);
  if (!updatedProduct)
    throw new Error('Failed to find product after rejection.');

  revalidatePath('/dashboard');
  revalidatePath(`/products/${productId}`);
  return updatedProduct;
}
