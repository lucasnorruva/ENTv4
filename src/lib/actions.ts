
'use server';

import { revalidatePath } from 'next/cache';
import { products as mockProducts } from '@/lib/data';
import type { Product, SustainabilityData } from '@/types';
import type { ProductFormValues } from '@/components/product-form';
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

// Note: In a real app, this would be a database. For this mock, we mutate
// a `let` variable. `products` is imported from data.ts and reassigned here.
let products = [...mockProducts];

// Helper to simulate database latency
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function getProducts(): Promise<Product[]> {
  await sleep(50);
  // Return a deep copy to prevent direct mutation of the mock data from client components.
  return JSON.parse(JSON.stringify(products.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())));
}

export async function getProductById(id: string): Promise<Product | undefined> {
  await sleep(50);
  const product = products.find(p => p.id === id);
  return product ? JSON.parse(JSON.stringify(product)) : undefined;
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
  await sleep(500);

  const { sustainability, qrLabelText } = await runAllAiFlows(productData);

  if (productId) {
    const productIndex = products.findIndex(p => p.id === productId);
    if (productIndex === -1) {
      throw new Error('Product not found');
    }
    const updatedProduct = {
      ...products[productIndex],
      ...productData,
      sustainability,
      qrLabelText,
      lastUpdated: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    products[productIndex] = updatedProduct;
    await logAuditEvent(
      'product.updated',
      productId,
      { fields: Object.keys(productData) },
      userId,
    );
    revalidatePath('/dashboard');
    revalidatePath(`/products/${productId}`);
    return JSON.parse(JSON.stringify(updatedProduct));
  } else {
    const newProduct: Product = {
      id: `pp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      ...productData,
      productImage: 'https://placehold.co/100x100.png',
      sustainability,
      qrLabelText,
      verificationStatus: 'Not Submitted',
      endOfLifeStatus: 'Active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    };
    products.unshift(newProduct);
    await logAuditEvent(
      'product.created',
      newProduct.id,
      { productName: newProduct.productName },
      userId,
    );
    revalidatePath('/dashboard');
    return JSON.parse(JSON.stringify(newProduct));
  }
}

export async function deleteProduct(
  id: string,
  userId: string,
): Promise<{ success: boolean }> {
  await sleep(200);
  const productToDelete = products.find(p => p.id === id);
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
  await sleep(200);
  const productIndex = products.findIndex(p => p.id === productId);
  if (productIndex === -1) throw new Error('Product not found');

  products[productIndex].verificationStatus = 'Pending';
  products[productIndex].updatedAt = new Date().toISOString();
  await logAuditEvent(
    'passport.submitted',
    productId,
    { status: 'Pending' },
    userId,
  );
  revalidatePath('/dashboard');
  revalidatePath(`/products/${productId}`);
  return JSON.parse(JSON.stringify(products[productIndex]));
}

export async function approvePassport(
  productId: string,
  userId: string,
): Promise<Product> {
  await sleep(1000);
  const productIndex = products.findIndex(p => p.id === productId);
  if (productIndex === -1) throw new Error('Product not found');

  const product = products[productIndex];
  const dataHash = await hashProductData(product);
  const [blockchainProof, ebsiVcId] = await Promise.all([
    anchorToPolygon(productId, dataHash),
    generateEbsiCredential(productId),
  ]);

  product.verificationStatus = 'Verified';
  product.lastVerificationDate = new Date().toISOString();
  product.updatedAt = new Date().toISOString();
  product.blockchainProof = blockchainProof;
  product.ebsiVcId = ebsiVcId;

  await logAuditEvent(
    'passport.approved',
    productId,
    { txHash: blockchainProof.txHash },
    userId,
  );
  revalidatePath('/dashboard');
  revalidatePath(`/products/${productId}`);
  return JSON.parse(JSON.stringify(product));
}

export async function rejectPassport(
  productId: string,
  reason: string,
  userId: string,
): Promise<Product> {
  await sleep(200);
  const productIndex = products.findIndex(p => p.id === productId);
  if (productIndex === -1) throw new Error('Product not found');
  const product = products[productIndex];

  product.verificationStatus = 'Failed';
  product.lastVerificationDate = new Date().toISOString();
  if (product.sustainability) {
    product.sustainability.isCompliant = false;
    product.sustainability.complianceSummary = `Rejected: ${reason}`;
  }
  product.updatedAt = new Date().toISOString();

  await logAuditEvent('passport.rejected', productId, { reason }, userId);
  revalidatePath('/dashboard');
  revalidatePath(`/products/${productId}`);
  return JSON.parse(JSON.stringify(product));
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
  await sleep(1500);
  const productIndex = products.findIndex(p => p.id === productId);
  if (productIndex === -1) throw new Error('Product not found');
  const product = products[productIndex];

  // Cast the full product to the form values shape for the AI flow
  const formValues: ProductFormValues = {
    productName: product.productName,
    productDescription: product.productDescription,
    productImage: product.productImage,
    category: product.category,
    supplier: product.supplier,
    status: product.status,
    compliancePathId: product.compliancePathId,
    materials: product.materials,
    manufacturing: product.manufacturing,
    certifications: product.certifications,
    packaging: product.packaging,
  };

  const { sustainability, qrLabelText } = await runAllAiFlows(formValues);

  product.sustainability = sustainability;
  product.qrLabelText = qrLabelText;
  product.updatedAt = new Date().toISOString();

  await logAuditEvent(
    'product.recalculate_score',
    productId,
    { newScore: sustainability.score },
    userId,
  );
  revalidatePath('/dashboard');
  revalidatePath(`/products/${productId}`);
  return JSON.parse(JSON.stringify(product));
}

export async function markAsRecycled(
  productId: string,
  userId: string,
): Promise<Product> {
  await sleep(200);
  const productIndex = products.findIndex(p => p.id === productId);
  if (productIndex === -1) throw new Error('Product not found');
  const product = products[productIndex];

  product.endOfLifeStatus = 'Recycled';
  product.updatedAt = new Date().toISOString();
  await logAuditEvent('product.recycled', productId, {}, userId);
  revalidatePath('/dashboard');
  revalidatePath(`/products/${productId}`);
  return JSON.parse(JSON.stringify(product));
}

export async function logAuditEvent(
  action: string,
  entityId: string,
  details: Record<string, any>,
  userId: string = 'system',
): Promise<void> {
  await sleep(20);
  console.log('AUDIT LOG:', {
    userId,
    action,
    entityId,
    details,
    timestamp: new Date().toISOString(),
  });
}
