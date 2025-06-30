
'use server';

import { revalidatePath } from 'next/cache';
import { adminDb, adminStorageBucket } from '@/lib/firebase-admin';
import { Timestamp, type DocumentSnapshot } from 'firebase-admin/firestore';
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
  const productsRef = adminDb.collection(Collections.PRODUCTS);
  const q = productsRef.orderBy('createdAt', 'desc');
  const querySnapshot = await q.get();
  return querySnapshot.docs.map(toProduct);
}

export async function getProductById(id: string): Promise<Product | undefined> {
  const docRef = adminDb.collection(Collections.PRODUCTS).doc(id);
  const docSnap = await docRef.get();

  if (docSnap.exists) {
    return toProduct(docSnap);
  } else {
    return undefined;
  }
}

export async function saveProduct(
  formData: FormData,
  userId: string,
): Promise<Product> {
  const id = formData.get('id') as string | null;
  const imageFile = formData.get('productImageFile') as File | null;

  const dataToSave: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> = {
    productName: formData.get('productName') as string,
    productDescription: formData.get('productDescription') as string,
    category: formData.get('category') as string,
    supplier: formData.get('supplier') as string,
    complianceLevel: formData.get('complianceLevel') as 'High' | 'Medium' | 'Low',
    currentInformation: formData.get('currentInformation') as string,
    status: formData.get('status') as 'Published' | 'Draft' | 'Archived',
    productImage: formData.get('productImage') as string, // Existing URL if present
    lastUpdated: new Date().toISOString(),
  };

  if (imageFile && imageFile.size > 0) {
    const buffer = Buffer.from(await imageFile.arrayBuffer());
    const fileName = `product_images/${Date.now()}_${imageFile.name}`;
    const file = adminStorageBucket.file(fileName);
    await file.save(buffer, {
      metadata: {
        contentType: imageFile.type,
      },
    });
    // Make the file public to generate a public URL.
    await file.makePublic();
    dataToSave.productImage = file.publicUrl();
  } else if (!id && !dataToSave.productImage) {
    // If it's a new product with no image, use a placeholder.
    dataToSave.productImage = 'https://placehold.co/100x100.png';
  }


  // AI enrichments running in parallel
  const [
    esgResult,
    complianceResult,
    qrLabelResult,
    classificationResult,
    lifecycleAnalysisResult,
  ] = await Promise.all([
    calculateSustainability({
      productName: dataToSave.productName,
      productDescription: dataToSave.productDescription,
      category: dataToSave.category,
      currentInformation: dataToSave.currentInformation,
    }).catch(e => {
      console.error('AI sustainability calculation failed:', e);
      return undefined;
    }),
    summarizeComplianceGaps({
      productName: dataToSave.productName,
      productInformation: dataToSave.currentInformation,
      compliancePathName:
        compliancePaths.find(p => p.category === dataToSave.category)?.name || '',
      complianceRules: JSON.stringify(
        compliancePaths.find(p => p.category === dataToSave.category)?.rules || {},
      ),
    }).catch(e => {
      console.error('AI compliance check failed:', e);
      return undefined;
    }),
    generateQRLabelText({
      productName: dataToSave.productName,
      supplier: dataToSave.supplier,
      currentInformation: dataToSave.currentInformation,
    }).catch(e => {
      console.error('AI QR label text generation failed:', e);
      return undefined;
    }),
    classifyProduct({
      productName: dataToSave.productName,
      productDescription: dataToSave.productDescription,
      category: dataToSave.category,
      currentInformation: dataToSave.currentInformation,
    }).catch(e => {
      console.error('AI product classification failed:', e);
      return undefined;
    }),
    analyzeProductLifecycle({
      productName: dataToSave.productName,
      productDescription: dataToSave.productDescription,
      currentInformation: dataToSave.currentInformation,
    }).catch(e => {
      console.error('AI lifecycle analysis failed:', e);
      return undefined;
    }),
  ]);

  if (id) {
    // Update existing product
    const docRef = adminDb.collection(Collections.PRODUCTS).doc(id);
    const productData = {
      ...dataToSave,
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

    await docRef.set(productData, { merge: true });
    const updatedProduct = await getProductById(id);
    if (!updatedProduct)
      throw new Error('Failed to retrieve product after update.');

    await logAuditEvent(
      'product.updated',
      updatedProduct.id,
      { fields: Object.keys(dataToSave) },
      userId,
    );

    revalidatePath('/dashboard');
    revalidatePath(`/products/${updatedProduct.id}`);
    return updatedProduct;
  } else {
    // Create new product
    const newProductData = {
      ...dataToSave,
      esg: esgResult,
      complianceSummary: complianceResult?.complianceSummary,
      complianceGaps: complianceResult?.gaps,
      classification: classificationResult,
      qrLabelText: qrLabelResult?.qrLabelText,
      lifecycleAnalysis: lifecycleAnalysisResult,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      lastUpdated: Timestamp.now(),
      verificationStatus: 'Pending' as const,
      endOfLifeStatus: 'Active' as const,
    };
    const docRef = await adminDb.collection(Collections.PRODUCTS).add(newProductData);

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

  if (productToDelete?.productImage) {
    try {
      // Don't delete placeholder images
      if (!productToDelete.productImage.includes('placehold.co')) {
        const bucketName = adminStorageBucket.name;
        const prefix = `https://storage.googleapis.com/${bucketName}/`;
        if (productToDelete.productImage.startsWith(prefix)) {
            const filePath = productToDelete.productImage.substring(prefix.length);
            await adminStorageBucket.file(decodeURIComponent(filePath)).delete();
        }
      }
    } catch (error: any) {
      if (error.code === 404) { // GCS returns 404 for object not found
        console.warn(
          `Image not found in storage for product ${id}, but proceeding with deletion.`,
        );
      } else {
        console.error(`Failed to delete image for product ${id}:`, error);
        // Do not throw; proceed with deleting the Firestore document.
      }
    }
  }

  if (productToDelete) {
    await logAuditEvent(
      'product.deleted',
      id,
      { productName: productToDelete.productName },
      userId,
    );
  }

  await adminDb.collection(Collections.PRODUCTS).doc(id).delete();
  revalidatePath('/dashboard');
  return { success: true };
}

export async function submitForReview(
  productId: string,
  userId: string,
): Promise<Product> {
  const docRef = adminDb.collection(Collections.PRODUCTS).doc(productId);
  await docRef.set(
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

export async function approvePassport(
  productId: string,
  userId: string,
): Promise<Product> {
  const docRef = adminDb.collection(Collections.PRODUCTS).doc(productId);
  const product = await getProductById(productId);

  if (!product) {
    throw new Error('Product not found for approval.');
  }

  // Core business logic for approval: Hash, Anchor, and Credentialize
  const dataHash = await hashProductData(product.currentInformation);
  const [blockchainProof, ebsiVcId] = await Promise.all([
    anchorToPolygon(productId, dataHash),
    generateEbsiCredential(productId),
  ]);

  await docRef.set(
    {
      verificationStatus: 'Verified',
      lastVerificationDate: Timestamp.now(),
      updatedAt: Timestamp.now(),
      blockchainProof: { ...blockchainProof, dataHash },
      ebsiVcId: ebsiVcId,
    },
    { merge: true },
  );

  await logAuditEvent(
    'passport.approved',
    productId,
    { txHash: blockchainProof.txHash },
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
  reason: string,
  userId: string,
): Promise<Product> {
  const docRef = adminDb.collection(Collections.PRODUCTS).doc(productId);
  await docRef.set(
    {
      verificationStatus: 'Failed',
      lastVerificationDate: Timestamp.now(),
      complianceSummary: `Rejected: ${reason}`, // Storing reason in summary
      updatedAt: Timestamp.now(),
    },
    { merge: true },
  );

  await logAuditEvent(
    'passport.rejected',
    productId,
    { reason },
    userId,
  );

  const updatedProduct = await getProductById(productId);
  if (!updatedProduct)
    throw new Error('Failed to find product after rejection.');

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

  const docRef = adminDb.collection(Collections.PRODUCTS).doc(productId);
  await docRef.set(
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
  try {
    const logData = {
      userId,
      action,
      entityId,
      details,
      timestamp: Timestamp.now(),
    };
    await adminDb.collection(Collections.AUDIT_LOGS).add(logData);
  } catch(error) {
    console.error("Failed to log audit event:", error)
  }
}
