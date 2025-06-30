
'use server';

import { revalidatePath } from 'next/cache';
import { products as mockProducts } from './data';
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

// Type for the data coming from the form, before it becomes a full Product
type ProductFormData = Omit<
  Product,
  'id' | 'createdAt' | 'updatedAt' | 'lastUpdated'
>;

async function runAllAiFlows(
  productData: ProductFormData,
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
  productData: ProductFormData,
  userId: string,
  productId?: string,
): Promise<Product> {
  const { sustainability, qrLabelText } = await runAllAiFlows(productData);

  if (productId) {
    const updatedProduct = findAndUpdateProduct(productId, {
      ...productData,
      sustainability,
      qrLabelText,
      lastUpdated: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    await logAuditEvent(
      'product.updated',
      productId,
      { fields: Object.keys(productData) },
      userId,
    );
    revalidatePath('/dashboard');
    revalidatePath(`/products/${productId}`);
    return updatedProduct;
  } else {
    const newId = `pp-mock-${Date.now()}`;
    const newProduct: Product = {
      id: newId,
      ...productData,
      sustainability,
      qrLabelText,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      verificationStatus: 'Not Submitted',
      endOfLifeStatus: 'Active',
    };
    products.unshift(newProduct);
    await logAuditEvent(
      'product.created',
      newId,
      { productName: newProduct.productName },
      userId,
    );
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
  const updatedProduct = findAndUpdateProduct(productId, {
    verificationStatus: 'Pending',
    updatedAt: new Date().toISOString(),
  });
  await logAuditEvent(
    'passport.submitted',
    productId,
    { status: 'Pending' },
    userId,
  );
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

  const dataHash = await hashProductData(product);
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

  await logAuditEvent(
    'passport.approved',
    productId,
    { txHash: blockchainProof.txHash },
    userId,
  );
  revalidatePath('/dashboard');
  revalidatePath(`/products/${productId}`);
  return updatedProduct;
}

export async function rejectPassport(
  productId: string,
  reason: string,
  userId: string,
): Promise<Product> {
  const product = findProduct(productId);
  if (!product) throw new Error('Product not found for rejection.');

  const updatedProduct = findAndUpdateProduct(productId, {
    verificationStatus: 'Failed',
    lastVerificationDate: new Date().toISOString(),
    sustainability: {
      ...(product.sustainability ?? {}),
      isCompliant: false,
      complianceSummary: `Rejected: ${reason}`,
    },
    updatedAt: new Date().toISOString(),
  });

  await logAuditEvent('passport.rejected', productId, { reason }, userId);
  revalidatePath('/dashboard');
  revalidatePath(`/products/${productId}`);
  return updatedProduct;
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
  const product = findProduct(productId);
  if (!product) throw new Error('Product not found');

  const { sustainability, qrLabelText } = await runAllAiFlows(product);

  const updatedProduct = findAndUpdateProduct(productId, {
    sustainability,
    qrLabelText,
    updatedAt: new Date().toISOString(),
  });

  await logAuditEvent(
    'product.recalculate_score',
    productId,
    { newScore: sustainability.score },
    userId,
  );
  revalidatePath('/dashboard');
  revalidatePath(`/products/${productId}`);
  return updatedProduct;
}

export async function markAsRecycled(
  productId: string,
  userId: string,
): Promise<Product> {
  const product = findProduct(productId);
  if (!product) throw new Error('Product not found');

  const updatedProduct = findAndUpdateProduct(productId, {
    endOfLifeStatus: 'Recycled',
    updatedAt: new Date().toISOString(),
  });

  await logAuditEvent('product.recycled', productId, {}, userId);
  revalidatePath('/dashboard');
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
  console.log(
    `[AUDIT LOG] User: ${userId}, Action: ${action}, Entity: ${entityId}`,
    details,
  );
  await Promise.resolve();
}
