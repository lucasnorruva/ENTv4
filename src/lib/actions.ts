// src/lib/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { products as mockProducts } from './data';
import type { Product, ComplianceGap } from './types';
import { productFormSchema, type ProductFormValues } from './schemas';
import {
  anchorToPolygon,
  generateEbsiCredential,
  hashProductData,
} from '@/services/blockchain';
import { suggestImprovements } from '@/ai/flows/enhance-passport-information';
import { calculateSustainability } from '@/ai/flows/calculate-sustainability';
import { summarizeComplianceGaps } from '@/ai/flows/summarize-compliance-gaps';
import { generateQRLabelText } from '@/ai/flows/generate-qr-label-text';
import { validateProductData } from '@/ai/flows/validate-product-data';
import type {
  SuggestImprovementsInput,
  SuggestImprovementsOutput,
  AiProduct,
} from '@/types/ai-outputs';
import { getCompliancePathById } from './compliance-data';
import { getCurrentUser } from './auth';

// --- PRODUCT ACTIONS ---

export async function getProducts(userId?: string): Promise<Product[]> {
  // In a real app, you'd fetch from Firestore and filter by companyId
  // For now, we return the mock data
  return mockProducts.sort(
    (a, b) =>
      new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime(),
  );
}

export async function getProductById(
  id: string,
  userId?: string,
): Promise<Product | undefined> {
  const product = mockProducts.find(p => p.id === id);

  if (!product) {
    return undefined;
  }

  // If no user is provided, only return published products
  if (!userId) {
    return product.status === 'Published' ? product : undefined;
  }

  // If a user is provided, check if they have access
  const user = await getCurrentUser(); // This is a mock, gets the default user
  if (user.companyId === product.companyId || user.roles.includes('Admin')) {
    return product;
  }

  return undefined;
}

export async function saveProduct(
  values: ProductFormValues,
  userId: string,
  productId?: string,
): Promise<Product> {
  // Validate data against the schema
  const validatedData = productFormSchema.parse(values);
  const now = new Date().toISOString();

  if (productId) {
    // Update existing product
    const index = mockProducts.findIndex(p => p.id === productId);
    if (index > -1) {
      const existingProduct = mockProducts[index];
      mockProducts[index] = {
        ...existingProduct,
        ...validatedData,
        lastUpdated: now,
        updatedAt: now,
        // Reset verification status if it failed, to allow resubmission
        verificationStatus:
          existingProduct.verificationStatus === 'Failed'
            ? 'Not Submitted'
            : existingProduct.verificationStatus,
      };
      revalidatePath('/dashboard', 'layout');
      return mockProducts[index];
    }
    throw new Error('Product not found');
  } else {
    // Create new product
    const newProduct: Product = {
      id: `pp-${Date.now().toString().slice(-6)}`,
      companyId: 'comp-01', // Mock company ID
      ...validatedData,
      supplier: 'GreenTech Supplies', // Mock supplier
      productImage:
        validatedData.productImage || 'https://placehold.co/400x400.png',
      createdAt: now,
      updatedAt: now,
      lastUpdated: now,
      endOfLifeStatus: 'Active',
      verificationStatus: 'Not Submitted',
    };
    mockProducts.unshift(newProduct);
    revalidatePath('/dashboard', 'layout');
    return newProduct;
  }
}

export async function deleteProduct(
  productId: string,
  userId: string,
): Promise<void> {
  const index = mockProducts.findIndex(p => p.id === productId);
  if (index > -1) {
    mockProducts.splice(index, 1);
    revalidatePath('/dashboard', 'layout');
  } else {
    throw new Error('Product not found');
  }
}

export async function recalculateScore(
  productId: string,
  userId: string,
): Promise<Product> {
  const product = mockProducts.find(p => p.id === productId);
  if (!product) throw new Error('Product not found');

  const {
    productName,
    productDescription,
    category,
    supplier,
    materials,
    manufacturing,
    certifications,
    verificationStatus,
    sustainability,
  } = product;

  const aiProductInput: AiProduct = {
    productName,
    productDescription,
    category,
    supplier,
    materials,
    manufacturing: manufacturing!,
    certifications: certifications!,
    verificationStatus,
    complianceSummary: sustainability?.complianceSummary,
  };

  const [esgResult, qrLabelResult, validationResult] = await Promise.all([
    calculateSustainability({ product: aiProductInput }),
    generateQRLabelText({ product: aiProductInput }),
    validateProductData({ product: aiProductInput }),
  ]);

  product.sustainability = { ...product.sustainability, ...esgResult };
  product.qrLabelText = qrLabelResult.qrLabelText;
  product.dataQualityWarnings = validationResult.warnings;
  product.lastUpdated = new Date().toISOString();

  revalidatePath('/dashboard', 'layout');
  return product;
}

export async function submitForReview(
  productId: string,
  userId: string,
): Promise<Product> {
  const product = mockProducts.find(p => p.id === productId);
  if (!product) throw new Error('Product not found');
  product.verificationStatus = 'Pending';
  product.lastUpdated = new Date().toISOString();
  revalidatePath('/dashboard', 'layout');
  return product;
}

export async function approvePassport(
  productId: string,
  userId: string,
): Promise<Product> {
  const product = mockProducts.find(p => p.id === productId);
  if (!product) throw new Error('Product not found');

  const productHash = await hashProductData(product);
  const [blockchainProof, ebsiVcId] = await Promise.all([
    anchorToPolygon(product.id, productHash),
    generateEbsiCredential(product.id),
  ]);

  product.verificationStatus = 'Verified';
  product.lastVerificationDate = new Date().toISOString();
  product.blockchainProof = blockchainProof;
  product.ebsiVcId = ebsiVcId;

  revalidatePath('/dashboard', 'layout');
  return product;
}

export async function rejectPassport(
  productId: string,
  reason: string,
  gaps: ComplianceGap[],
  userId: string,
): Promise<Product> {
  const product = mockProducts.find(p => p.id === productId);
  if (!product) throw new Error('Product not found');
  product.verificationStatus = 'Failed';
  product.lastVerificationDate = new Date().toISOString();
  if (!product.sustainability) {
    product.sustainability = {
      score: 0,
      environmental: 0,
      social: 0,
      governance: 0,
      summary: '',
      isCompliant: false,
      complianceSummary: '',
    };
  }
  product.sustainability.complianceSummary = reason;
  product.sustainability.gaps = gaps;

  revalidatePath('/dashboard', 'layout');
  return product;
}

export async function runSuggestImprovements(
  input: SuggestImprovementsInput,
): Promise<SuggestImprovementsOutput> {
  return suggestImprovements({
    productName: input.productName,
    productDescription: input.productDescription,
  });
}
