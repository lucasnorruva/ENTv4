'use server';

import { revalidatePath } from 'next/cache';
import { products as mockProducts } from '@/lib/data';
import type {
  AuditLog,
  Product,
  ProductionLine,
  SustainabilityData,
  CompliancePath,
} from '@/types';
import {
  productFormSchema,
  type ProductFormValues,
  compliancePathFormSchema,
  type CompliancePathFormValues,
} from '@/lib/schemas';
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
import { compliancePaths as mockCompliancePaths } from './compliance-data';
import { productionLines } from './manufacturing-data';
import { auditLogs as mockAuditLogs } from './audit-log-data';
import { getMockUsers } from './auth';

// Note: In a real app, this would be a database. For this mock, we mutate
// a `let` variable. `products` is imported from data.ts and reassigned here.
let products = [...mockProducts];
let auditLogs = [...mockAuditLogs];
let compliancePaths = [...mockCompliancePaths];

// Helper to simulate database latency
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function getProducts(): Promise<Product[]> {
  await sleep(50);
  // Return a deep copy to prevent direct mutation of the mock data from client components.
  return JSON.parse(
    JSON.stringify(
      products.sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      ),
    ),
  );
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

  const validatedData = productFormSchema.parse(productData);

  const { sustainability, qrLabelText } = await runAllAiFlows(validatedData);

  if (productId) {
    const productIndex = products.findIndex(p => p.id === productId);
    if (productIndex === -1) {
      throw new Error('Product not found');
    }
    const updatedProduct = {
      ...products[productIndex],
      ...validatedData,
      sustainability,
      qrLabelText,
      lastUpdated: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    products[productIndex] = updatedProduct;
    await logAuditEvent(
      'product.updated',
      productId,
      { fields: Object.keys(validatedData) },
      userId,
    );
    revalidatePath('/dashboard/products');
    revalidatePath(`/products/${productId}`);
    return JSON.parse(JSON.stringify(updatedProduct));
  } else {
    const newProduct: Product = {
      id: `pp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      ...validatedData,
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
    revalidatePath('/dashboard/products');
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
  revalidatePath('/dashboard/products');
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
  revalidatePath('/dashboard/products');
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
  revalidatePath('/dashboard/products');
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
  revalidatePath('/dashboard/products');
  revalidatePath(`/products/${productId}`);
  return JSON.parse(JSON.stringify(product));
}

export async function runSuggestImprovements(data: SuggestImprovementsInput) {
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
  revalidatePath('/dashboard/products');
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
  revalidatePath('/dashboard/products');
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
  const logEntry: AuditLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    userId,
    action,
    entityId,
    details,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  auditLogs.unshift(logEntry);
  console.log('AUDIT LOG:', logEntry);
}

export async function getProductionLines(): Promise<ProductionLine[]> {
  await sleep(50);
  return JSON.parse(JSON.stringify(productionLines));
}

export async function getAuditLogs(userId?: string): Promise<AuditLog[]> {
  await sleep(50);
  const allLogs = [...auditLogs].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  if (userId) {
    const userLogs = allLogs.filter(log => log.userId === userId);
    return JSON.parse(JSON.stringify(userLogs));
  }
  return JSON.parse(JSON.stringify(allLogs));
}

export async function getAuditLogsForUser(userId: string): Promise<AuditLog[]> {
  return getAuditLogs(userId);
}

export async function getAllAuditLogs(): Promise<AuditLog[]> {
  return getAuditLogs();
}

export async function getMockUsersForAdmin(): Promise<
  { id: string; fullName: string; email: string; role: string }[]
> {
  const users = await getMockUsers();
  return users.map(user => ({
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.roles[0],
  }));
}

// Compliance Path Actions
export async function getCompliancePaths(): Promise<CompliancePath[]> {
  await sleep(50);
  return JSON.parse(JSON.stringify(compliancePaths));
}

export async function saveCompliancePath(
  pathData: CompliancePathFormValues,
  userId: string,
  pathId?: string,
): Promise<CompliancePath> {
  await sleep(500);

  const validatedData = compliancePathFormSchema.parse(pathData);

  const dataToSave = {
    ...validatedData,
    regulations: validatedData.regulations
      .split(',')
      .map(s => s.trim())
      .filter(Boolean),
    rules: {
      minSustainabilityScore: validatedData.minSustainabilityScore,
      requiredKeywords: validatedData.requiredKeywords
        .split(',')
        .map(s => s.trim())
        .filter(Boolean),
      bannedKeywords: validatedData.bannedKeywords
        .split(',')
        .map(s => s.trim())
        .filter(Boolean),
    },
  };

  if (pathId) {
    const pathIndex = compliancePaths.findIndex(p => p.id === pathId);
    if (pathIndex === -1) throw new Error('Compliance path not found');
    const updatedPath = {
      ...compliancePaths[pathIndex],
      ...dataToSave,
      updatedAt: new Date().toISOString(),
    };
    compliancePaths[pathIndex] = updatedPath;
    await logAuditEvent(
      'compliance_path.updated',
      pathId,
      { name: updatedPath.name },
      userId,
    );
    revalidatePath('/dashboard/compliance');
    return JSON.parse(JSON.stringify(updatedPath));
  } else {
    const newPath: CompliancePath = {
      id: `cp-${Date.now()}`,
      ...dataToSave,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    compliancePaths.push(newPath);
    await logAuditEvent(
      'compliance_path.created',
      newPath.id,
      { name: newPath.name },
      userId,
    );
    revalidatePath('/dashboard/compliance');
    return JSON.parse(JSON.stringify(newPath));
  }
}
