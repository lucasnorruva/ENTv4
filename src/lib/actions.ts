
'use server';

import { revalidatePath } from 'next/cache';
import { products as mockProducts } from './data';
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

// In-memory data store for mock implementation
let products = [...mockProducts];

// Helper to find a product by ID in the mock data
function findProduct(id: string) {
  return products.find(p => p.id === id);
}

// Helper to find and update a product
function findAndUpdateProduct(id: string, updates: Partial<Product>): Product {
  const productIndex = products.findIndex(p => p.id === id);
  if (productIndex === -1) {
    throw new Error(`Product with id ${id} not found.`);
  }
  const updatedProduct = { ...products[productIndex], ...updates };
  products[productIndex] = updatedProduct;
  return updatedProduct;
}

export async function getProducts(): Promise<Product[]> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 100));
  return JSON.parse(JSON.stringify(products));
}

export async function getProductById(id: string): Promise<Product | undefined> {
  await new Promise(resolve => setTimeout(resolve, 50));
  const product = findProduct(id);
  return product ? JSON.parse(JSON.stringify(product)) : undefined;
}

export async function saveProduct(
  formData: FormData,
  userId: string,
): Promise<Product> {
  const id = formData.get('id') as string | null;
  
  const dataToSave = {
    productName: formData.get('productName') as string,
    productDescription: formData.get('productDescription') as string,
    category: formData.get('category') as string,
    supplier: formData.get('supplier') as string,
    complianceLevel: formData.get('complianceLevel') as 'High' | 'Medium' | 'Low',
    currentInformation: formData.get('currentInformation') as string,
    status: formData.get('status') as 'Published' | 'Draft' | 'Archived',
    productImage: (formData.get('productImage') as string) || 'https://placehold.co/100x100.png',
  };

  const imageFile = formData.get('productImageFile') as File | null;
  if (imageFile && imageFile.size > 0) {
      // In a real app, this would upload to storage. Here, we just acknowledge it.
      // We don't have a way to display a local file path, so we'll stick to a placeholder.
      console.log(`Mock upload of ${imageFile.name}`);
      // For mock purposes, we'll assign a new placeholder if an image is uploaded.
      dataToSave.productImage = 'https://placehold.co/100x100.png';
  }

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
    }),
    summarizeComplianceGaps({
      productName: dataToSave.productName,
      productInformation: dataToSave.currentInformation,
      compliancePathName: 'Mock Compliance Path',
      complianceRules: JSON.stringify({}),
    }),
    generateQRLabelText({
      productName: dataToSave.productName,
      supplier: dataToSave.supplier,
      currentInformation: dataToSave.currentInformation,
    }),
    classifyProduct({
      productName: dataToSave.productName,
      productDescription: dataToSave.productDescription,
      category: dataToSave.category,
      currentInformation: dataToSave.currentInformation,
    }),
    analyzeProductLifecycle({
      productName: dataToSave.productName,
      productDescription: dataToSave.productDescription,
      currentInformation: dataToSave.currentInformation,
    }),
  ]);

  if (id) {
    const updatedProduct = findAndUpdateProduct(id, {
      ...dataToSave,
      lastUpdated: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      esg: esgResult,
      complianceSummary: complianceResult.complianceSummary,
      complianceGaps: complianceResult.gaps,
      classification: classificationResult,
      qrLabelText: qrLabelResult.qrLabelText,
      lifecycleAnalysis: lifecycleAnalysisResult,
    });
    await logAuditEvent('product.updated', id, { fields: Object.keys(dataToSave) }, userId);
    revalidatePath('/dashboard');
    revalidatePath(`/products/${id}`);
    return updatedProduct;
  } else {
    const newId = `pp-mock-${Date.now()}`;
    const newProduct: Product = {
      id: newId,
      ...dataToSave,
      esg: esgResult,
      complianceSummary: complianceResult.complianceSummary,
      complianceGaps: complianceResult.gaps,
      classification: classificationResult,
      qrLabelText: qrLabelResult.qrLabelText,
      lifecycleAnalysis: lifecycleAnalysisResult,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      verificationStatus: 'Pending',
      endOfLifeStatus: 'Active',
    };
    products.unshift(newProduct);
    await logAuditEvent('product.created', newId, { productName: newProduct.productName }, userId);
    revalidatePath('/dashboard');
    return newProduct;
  }
}

export async function deleteProduct(
  id: string,
  userId: string,
): Promise<{ success: boolean }> {
  const productToDelete = findProduct(id);
  products = products.filter(p => p.id !== id);
  if (productToDelete) {
      await logAuditEvent('product.deleted', id, { productName: productToDelete.productName }, userId);
  }
  revalidatePath('/dashboard');
  return { success: true };
}

export async function submitForReview(
  productId: string,
  userId: string,
): Promise<Product> {
  const updatedProduct = findAndUpdateProduct(productId, {
    verificationStatus: 'Pending',
    updatedAt: new Date().toISOString(),
  });
  await logAuditEvent('passport.submitted', productId, { status: 'Pending' }, userId);
  revalidatePath('/dashboard');
  revalidatePath(`/products/${productId}`);
  return updatedProduct;
}

export async function approvePassport(
  productId: string,
  userId: string,
): Promise<Product> {
  const product = findProduct(productId);
  if (!product) throw new Error('Product not found for approval.');
  
  const dataHash = await hashProductData(product.currentInformation);
  const [blockchainProof, ebsiVcId] = await Promise.all([
    anchorToPolygon(productId, dataHash),
    generateEbsiCredential(productId),
  ]);

  const updatedProduct = findAndUpdateProduct(productId, {
    verificationStatus: 'Verified',
    lastVerificationDate: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    blockchainProof: blockchainProof,
    ebsiVcId: ebsiVcId,
  });

  await logAuditEvent('passport.approved', productId, { txHash: blockchainProof.txHash }, userId);
  revalidatePath('/dashboard');
  revalidatePath(`/products/${productId}`);
  return updatedProduct;
}

export async function rejectPassport(
  productId: string,
  reason: string,
  userId: string,
): Promise<Product> {
  const updatedProduct = findAndUpdateProduct(productId, {
    verificationStatus: 'Failed',
    lastVerificationDate: new Date().toISOString(),
    complianceSummary: `Rejected: ${reason}`,
    updatedAt: new Date().toISOString(),
  });
  await logAuditEvent('passport.rejected', productId, { reason }, userId);
  revalidatePath('/dashboard');
  revalidatePath(`/products/${productId}`);
  return updatedProduct;
}


export async function runSuggestImprovements(
  data: SuggestImprovementsInput,
): Promise<SuggestImprovementsOutput> {
  return suggestImprovements(data);
}

export async function recalculateScore(
  productId: string,
  userId: string,
): Promise<Product> {
  const product = findProduct(productId);
  if (!product) throw new Error('Product not found');

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
  ]);
  
  const updatedProduct = findAndUpdateProduct(productId, {
      esg: esgResult,
      lifecycleAnalysis: lifecycleAnalysisResult,
      updatedAt: new Date().toISOString(),
  });

  await logAuditEvent('product.recalculate_score', productId, { newScore: esgResult?.score }, userId);
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
  // This is a mock implementation. In a real app, this would write to a
  // secure, append-only log in Firestore or another logging service.
  console.log(`[AUDIT LOG] User: ${userId}, Action: ${action}, Entity: ${entityId}`, details);
  await Promise.resolve();
}
