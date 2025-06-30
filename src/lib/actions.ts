'use server';

import { revalidatePath } from 'next/cache';
import { products as mockProductsData } from './data';
import { compliancePaths } from './compliance-data';
import type { Product } from '@/types';
import {
  suggestImprovements,
  type SuggestImprovementsInput,
  type SuggestImprovementsOutput,
} from '@/ai/flows/enhance-passport-information';
import { calculateSustainability } from '@/ai/flows/calculate-sustainability';
import { summarizeComplianceGaps } from '@/ai/flows/summarize-compliance-gaps';
import {
  anchorToPolygon,
  generateEbsiCredential,
  hashProductData,
} from '@/services/blockchain';

// Use an in-memory array for mock data to simulate database operations
let mockProducts = [...mockProductsData];

export async function getProducts(): Promise<Product[]> {
  // Return mock data directly to avoid Firestore permission issues in dev
  return Promise.resolve(mockProducts);
}

export async function getProductById(id: string): Promise<Product | undefined> {
  return Promise.resolve(mockProducts.find(p => p.id === id));
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
  > & { id?: string },
  userId: string
): Promise<Product> {
  const now = new Date();
  const nowISO = now.toISOString();

  // AI enrichment for sustainability score
  let esgResult;
  try {
    esgResult = await calculateSustainability({
      productName: data.productName,
      productDescription: data.productDescription,
      category: data.category,
      currentInformation: data.currentInformation,
    });
  } catch (e) {
    console.error('AI sustainability calculation failed:', e);
  }

  // AI compliance check for immediate feedback
  let complianceResult;
  const compliancePath = compliancePaths.find(p => p.category === data.category);
  if (compliancePath) {
    try {
      complianceResult = await summarizeComplianceGaps({
        productName: data.productName,
        productInformation: data.currentInformation,
        compliancePathName: compliancePath.name,
        complianceRules: JSON.stringify(compliancePath.rules),
      });
    } catch (e) {
      console.error('AI compliance check failed:', e);
    }
  }

  if (data.id) {
    // Update existing product
    const existingProduct = mockProducts.find(p => p.id === data.id);
    if (!existingProduct) {
      throw new Error('Product not found');
    }

    const updatedProduct: Product = {
      ...existingProduct,
      ...data,
      esg: esgResult || existingProduct.esg, // Keep old ESG if new one fails
      complianceSummary:
        complianceResult?.complianceSummary || existingProduct.complianceSummary,
      complianceGaps: complianceResult?.gaps || existingProduct.complianceGaps,
      // Note: Blockchain proof is NOT updated here. It's updated upon verification.
      blockchainProof: existingProduct.blockchainProof,
      updatedAt: nowISO,
      lastUpdated: now.toISOString().split('T')[0],
    };
    mockProducts = mockProducts.map(p =>
      p.id === data.id ? updatedProduct : p
    );

    await logAuditEvent(
      'product.updated',
      updatedProduct.id,
      { fields: Object.keys(data) },
      userId
    );

    revalidatePath('/dashboard');
    revalidatePath(`/products/${updatedProduct.id}`);
    return updatedProduct;
  } else {
    // Create new product
    const newProduct: Product = {
      ...data,
      esg: esgResult,
      complianceSummary: complianceResult?.complianceSummary,
      complianceGaps: complianceResult?.gaps,
      id: `pp-mock-${Date.now()}`,
      createdAt: nowISO,
      updatedAt: nowISO,
      lastUpdated: now.toISOString().split('T')[0],
      endOfLifeStatus: 'Active' as const,
    };
    mockProducts.unshift(newProduct);

    // Fire 'product.created' event
    await logAuditEvent(
      'product.created',
      newProduct.id,
      { productName: newProduct.productName },
      userId
    );

    revalidatePath('/dashboard');
    return newProduct;
  }
}

export async function deleteProduct(
  id: string,
  userId: string
): Promise<{ success: boolean }> {
  const productToDelete = mockProducts.find(p => p.id === id);
  if (productToDelete) {
    await logAuditEvent(
      'product.deleted',
      id,
      { productName: productToDelete.productName },
      userId
    );
  }
  mockProducts = mockProducts.filter(p => p.id !== id);
  revalidatePath('/dashboard');
  return { success: true };
}

export async function submitForReview(
  productId: string,
  userId: string
): Promise<Product> {
  const productIndex = mockProducts.findIndex(p => p.id === productId);
  if (productIndex === -1) {
    throw new Error('Product not found');
  }

  const product = mockProducts[productIndex];

  const updatedProduct: Product = {
    ...product,
    verificationStatus: 'Pending',
    updatedAt: new Date().toISOString(),
  };

  mockProducts[productIndex] = updatedProduct;

  await logAuditEvent(
    'passport.submitted',
    productId,
    { status: 'Pending' },
    userId
  );

  revalidatePath('/dashboard');
  revalidatePath(`/products/${productId}`);
  return updatedProduct;
}

export async function runSuggestImprovements(
  data: SuggestImprovementsInput
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
  userId: string
): Promise<Product> {
  const productIndex = mockProducts.findIndex(p => p.id === productId);
  if (productIndex === -1) {
    throw new Error('Product not found');
  }
  const product = mockProducts[productIndex];

  let esgResult;
  try {
    const aiInput = {
      productName: product.productName,
      productDescription: product.productDescription,
      category: product.category,
      currentInformation: product.currentInformation,
    };
    esgResult = await calculateSustainability(aiInput);
  } catch (e) {
    console.error('AI sustainability re-calculation failed:', e);
    // We can decide to throw or return the product as-is
    throw new Error('Failed to recalculate sustainability score.');
  }

  const updatedProduct: Product = {
    ...product,
    esg: esgResult,
    updatedAt: new Date().toISOString(),
  };

  mockProducts[productIndex] = updatedProduct;

  await logAuditEvent(
    'product.recalculate_score',
    productId,
    { newScore: updatedProduct.esg?.score },
    userId
  );

  revalidatePath('/dashboard');
  revalidatePath(`/products/${productId}`);
  return updatedProduct;
}

export async function logAuditEvent(
  action: string,
  entityId: string,
  details: Record<string, any>,
  userId: string = 'system'
): Promise<void> {
  console.log('AUDIT EVENT (mock mode):', {
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
  userId: string
): Promise<Product> {
  const productIndex = mockProducts.findIndex(p => p.id === productId);
  if (productIndex === -1) {
    throw new Error('Product not found');
  }
  const product = mockProducts[productIndex];

  // Hash and anchor data to blockchain
  const productDataHash = await hashProductData(product.currentInformation);
  const blockchainProof = await anchorToPolygon(product.id, productDataHash);
  const ebsiVcId = await generateEbsiCredential(product.id);

  const updatedProduct: Product = {
    ...product,
    verificationStatus: 'Verified',
    lastVerificationDate: new Date().toISOString(),
    blockchainProof,
    ebsiVcId,
  };
  mockProducts[productIndex] = updatedProduct;

  await logAuditEvent(
    'passport.verified',
    productId,
    { status: 'Verified', auditorId: userId, blockchainProof },
    userId
  );

  revalidatePath('/dashboard');
  revalidatePath(`/products/${productId}`);
  return updatedProduct;
}

export async function rejectPassport(
  productId: string,
  feedback: string,
  userId: string
): Promise<Product> {
  const productIndex = mockProducts.findIndex(p => p.id === productId);
  if (productIndex === -1) {
    throw new Error('Product not found');
  }
  const product = mockProducts[productIndex];

  const updatedProduct: Product = {
    ...product,
    verificationStatus: 'Failed', // Or maybe 'NeedsRevision'
    lastVerificationDate: new Date().toISOString(),
    // We could add a field for audit feedback
  };
  mockProducts[productIndex] = updatedProduct;

  await logAuditEvent(
    'passport.rejected',
    productId,
    { status: 'Failed', auditorId: userId, feedback },
    userId
  );

  revalidatePath('/dashboard');
  revalidatePath(`/products/${productId}`);
  return updatedProduct;
}
