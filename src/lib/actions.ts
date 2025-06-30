
'use server';

import { revalidatePath } from 'next/cache';
import { randomBytes } from 'crypto';
import { products as mockProducts } from './data';
import { compliancePaths as mockCompliancePaths } from './compliance-data';
import { users as mockUsers } from './user-data';
import { auditLogs as mockAuditLogs } from './audit-log-data';
import { apiKeys as mockApiKeys } from './api-key-data';
import { productionLines as mockProductionLines } from './manufacturing-data';
import { serviceTickets as mockServiceTickets } from './service-ticket-data';
import {
  productFormSchema,
  type ProductFormValues,
  compliancePathFormSchema,
  type CompliancePathFormValues,
  userFormSchema,
  type UserFormValues,
} from './schemas';
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
import { verifyProductAgainstPath } from '@/services/compliance';

import type {
  Product,
  SustainabilityData,
  CompliancePath,
  User,
  AuditLog,
  ProductionLine,
  ServiceTicket,
  ApiKey,
  ComplianceGap,
} from '@/types';
import { UserRoles } from './constants';

// --- HELPERS ---

const logAuditEvent = async (
  action: string,
  entityId: string,
  details: Record<string, any>,
  userId: string = 'system',
) => {
  const logEntry: AuditLog = {
    id: `log-${Date.now()}-${Math.random()}`,
    userId,
    action,
    entityId,
    details,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  mockAuditLogs.unshift(logEntry);
  revalidatePath('/dashboard/analytics');
  revalidatePath('/dashboard/history');
};

const runAllAiFlows = async (
  productData: ProductFormValues,
): Promise<{ sustainability: SustainabilityData; qrLabelText: string }> => {
  const selectedCompliancePath = mockCompliancePaths.find(
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
};

// --- PRODUCT ACTIONS ---

export async function getProducts(): Promise<Product[]> {
  return JSON.parse(JSON.stringify(mockProducts));
}

export async function getProductById(
  id: string,
): Promise<Product | undefined> {
  const product = mockProducts.find(p => p.id === id);
  return product ? JSON.parse(JSON.stringify(product)) : undefined;
}

export async function saveProduct(
  productData: ProductFormValues,
  userId: string,
  productId?: string,
): Promise<Product> {
  const validatedData = productFormSchema.parse(productData);
  const { sustainability, qrLabelText } = await runAllAiFlows(validatedData);

  const now = new Date().toISOString();

  if (productId) {
    const productIndex = mockProducts.findIndex(p => p.id === productId);
    if (productIndex === -1) throw new Error('Product not found');
    const updatedProduct = {
      ...mockProducts[productIndex],
      ...validatedData,
      sustainability,
      qrLabelText,
      updatedAt: now,
      lastUpdated: now,
    };
    mockProducts[productIndex] = updatedProduct;
    await logAuditEvent(
      'product.updated',
      productId,
      { fields: Object.keys(validatedData) },
      userId,
    );
    revalidatePath('/dashboard/products');
    revalidatePath(`/products/${productId}`);
    return updatedProduct;
  } else {
    const newProduct: Product = {
      id: `pp-${Date.now()}`,
      ...validatedData,
      sustainability,
      qrLabelText,
      verificationStatus: 'Not Submitted',
      endOfLifeStatus: 'Active',
      createdAt: now,
      updatedAt: now,
      lastUpdated: now,
    };
    mockProducts.unshift(newProduct);
    await logAuditEvent(
      'product.created',
      newProduct.id,
      { productName: newProduct.productName },
      userId,
    );
    revalidatePath('/dashboard/products');
    return newProduct;
  }
}

export async function deleteProduct(
  id: string,
  userId: string,
): Promise<{ success: boolean }> {
  const productIndex = mockProducts.findIndex(p => p.id === id);
  if (productIndex > -1) {
    await logAuditEvent(
      'product.deleted',
      id,
      { productName: mockProducts[productIndex].productName },
      userId,
    );
    mockProducts.splice(productIndex, 1);
  }
  revalidatePath('/dashboard/products');
  return { success: true };
}

export async function submitForReview(
  productId: string,
  userId: string,
): Promise<Product> {
  const product = mockProducts.find(p => p.id === productId);
  if (!product) throw new Error('Product not found');
  product.verificationStatus = 'Pending';
  product.updatedAt = new Date().toISOString();
  await logAuditEvent(
    'passport.submitted',
    productId,
    { status: 'Pending' },
    userId,
  );
  revalidatePath('/dashboard/products');
  revalidatePath('/dashboard/audit');
  revalidatePath(`/products/${productId}`);
  return product;
}

export async function approvePassport(
  productId: string,
  userId: string,
): Promise<Product> {
  const product = mockProducts.find(p => p.id === productId);
  if (!product) throw new Error('Product not found');

  // Final compliance gatekeeper check
  const compliancePath = mockCompliancePaths.find(
    p => p.id === product.compliancePathId,
  );
  if (!compliancePath) {
    throw new Error('Compliance path not configured for this product.');
  }

  const { isCompliant, gaps } = await verifyProductAgainstPath(
    product,
    compliancePath,
  );
  if (!isCompliant) {
    // If it fails the final check, reject it automatically and throw an error.
    const summary = `Product failed final verification with ${gaps.length} issue(s).`;
    await rejectPassport(product.id, summary, gaps, 'system:gatekeeper');
    throw new Error(
      `Cannot approve: Product is not compliant. Issues found: ${gaps.map(g => g.issue).join(', ')}`,
    );
  }

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
  revalidatePath('/dashboard/audit');
  revalidatePath('/dashboard/products');
  revalidatePath(`/products/${productId}`);
  return product;
}

export async function rejectPassport(
  productId: string,
  summary: string,
  gaps: ComplianceGap[],
  userId: string,
): Promise<Product> {
  const product = mockProducts.find(p => p.id === productId);
  if (!product) throw new Error('Product not found');

  product.verificationStatus = 'Failed';
  product.lastVerificationDate = new Date().toISOString();
  if (!product.sustainability) product.sustainability = {} as SustainabilityData;
  product.sustainability.isCompliant = false;
  product.sustainability.complianceSummary = summary;
  product.sustainability.gaps = gaps;
  product.updatedAt = new Date().toISOString();

  await logAuditEvent(
    'passport.rejected',
    productId,
    { reason: summary, gaps },
    userId,
  );
  revalidatePath('/dashboard/audit');
  revalidatePath('/dashboard/products');
  revalidatePath('/dashboard/flagged');
  revalidatePath(`/products/${productId}`);
  return product;
}

export async function resolveComplianceIssue(
  productId: string,
  userId: string,
): Promise<Product> {
  const product = mockProducts.find(p => p.id === productId);
  if (!product) throw new Error('Product not found');

  product.status = 'Draft';
  product.verificationStatus = 'Not Submitted';
  product.updatedAt = new Date().toISOString();

  await logAuditEvent(
    'compliance.resolved',
    productId,
    { newStatus: 'Draft' },
    userId,
  );
  revalidatePath('/dashboard/flagged');
  revalidatePath('/dashboard/products');
  revalidatePath(`/products/${productId}`);
  return product;
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
  const product = mockProducts.find(p => p.id === productId);
  if (!product) throw new Error('Product not found');

  const formValues: ProductFormValues = product;
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
  return product;
}

export async function markAsRecycled(
  productId: string,
  userId: string,
): Promise<Product> {
  const product = mockProducts.find(p => p.id === productId);
  if (!product) throw new Error('Product not found');

  product.endOfLifeStatus = 'Recycled';
  product.updatedAt = new Date().toISOString();

  await logAuditEvent('product.recycled', productId, {}, userId);
  revalidatePath('/dashboard/eol');
  revalidatePath(`/products/${productId}`);
  return product;
}

// --- AUDIT LOG ACTIONS ---

export async function getAuditLogs(): Promise<AuditLog[]> {
  const logs = mockAuditLogs;
  return JSON.parse(JSON.stringify(logs));
}

export async function getAuditLogsForUser(userId: string): Promise<AuditLog[]> {
  const userLogs = mockAuditLogs.filter(log => log.userId === userId);
  return JSON.parse(JSON.stringify(userLogs));
}

// --- COMPLIANCE PATH ACTIONS ---

export async function getCompliancePaths(): Promise<CompliancePath[]> {
  return JSON.parse(JSON.stringify(mockCompliancePaths));
}

export async function saveCompliancePath(
  pathData: CompliancePathFormValues,
  userId: string,
  pathId?: string,
): Promise<CompliancePath> {
  const validatedData = compliancePathFormSchema.parse(pathData);
  const now = new Date().toISOString();

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
  };

  if (pathId) {
    const pathIndex = mockCompliancePaths.findIndex(p => p.id === pathId);
    if (pathIndex === -1) throw new Error('Compliance path not found.');
    const updatedPath = {
      ...mockCompliancePaths[pathIndex],
      ...dataToSave,
      updatedAt: now,
    };
    mockCompliancePaths[pathIndex] = updatedPath;
    await logAuditEvent(
      'compliance_path.updated',
      pathId,
      { name: dataToSave.name },
      userId,
    );
    revalidatePath('/dashboard/compliance');
    return updatedPath;
  } else {
    const newPath: CompliancePath = {
      id: `cp-${Date.now()}`,
      ...dataToSave,
      createdAt: now,
      updatedAt: now,
    };
    mockCompliancePaths.push(newPath);
    await logAuditEvent(
      'compliance_path.created',
      newPath.id,
      { name: newPath.name },
      userId,
    );
    revalidatePath('/dashboard/compliance');
    return newPath;
  }
}

// --- USER ACTIONS ---

export async function getUsers(): Promise<User[]> {
  return JSON.parse(JSON.stringify(mockUsers));
}

export async function saveUser(
  userData: UserFormValues,
  adminUserId: string,
  userId?: string,
): Promise<User> {
  const validatedData = userFormSchema.parse(userData);
  const now = new Date().toISOString();

  if (userId) {
    const userIndex = mockUsers.findIndex(u => u.id === userId);
    if (userIndex === -1) throw new Error('User not found.');
    const updatedUser = {
      ...mockUsers[userIndex],
      fullName: validatedData.fullName,
      email: validatedData.email,
      companyId: validatedData.companyId,
      roles: [validatedData.role as UserRoles],
      updatedAt: now,
    };
    mockUsers[userIndex] = updatedUser;
    await logAuditEvent(
      'user.updated',
      userId,
      { email: validatedData.email },
      adminUserId,
    );
    revalidatePath('/dashboard/users');
    return updatedUser;
  } else {
    const newUser: User = {
      id: `user-${Date.now()}`,
      fullName: validatedData.fullName,
      email: validatedData.email,
      companyId: validatedData.companyId,
      roles: [validatedData.role as UserRoles],
      createdAt: now,
      updatedAt: now,
    };
    mockUsers.push(newUser);
    await logAuditEvent(
      'user.created',
      newUser.id,
      { email: newUser.email },
      adminUserId,
    );
    revalidatePath('/dashboard/users');
    return newUser;
  }
}

export async function deleteUser(
  userId: string,
  adminUserId: string,
): Promise<{ success: boolean }> {
  const userIndex = mockUsers.findIndex(u => u.id === userId);
  if (userIndex > -1) {
    const deletedUser = mockUsers[userIndex];
    mockUsers.splice(userIndex, 1);
    await logAuditEvent(
      'user.deleted',
      userId,
      { email: deletedUser.email },
      adminUserId,
    );
  }
  revalidatePath('/dashboard/users');
  return { success: true };
}

// --- API KEY ACTIONS ---

export async function getApiKeys(userId: string): Promise<ApiKey[]> {
  const userKeys = mockApiKeys.filter(key => key.userId === userId);
  return JSON.parse(JSON.stringify(userKeys));
}

export async function createApiKey(
  label: string,
  userId: string,
): Promise<{ rawToken: string; apiKey: ApiKey }> {
  const now = new Date().toISOString();
  // Generate a secure random token for the user to see once.
  const rawToken = `nor_live_${randomBytes(16).toString('hex')}`;
  // In a real app, you would SHA-256 hash this token before storing.
  // For this mock, we'll just store a redacted-looking version.
  const storedToken = `${rawToken.slice(0, 10)}******************${rawToken.slice(
    -4,
  )}`;

  const newApiKey: ApiKey = {
    id: `key-${Date.now()}`,
    label,
    token: storedToken,
    status: 'Active',
    userId,
    createdAt: now,
    updatedAt: now,
  };
  mockApiKeys.push(newApiKey);
  await logAuditEvent('api_key.created', newApiKey.id, { label }, userId);
  revalidatePath('/dashboard/keys');
  revalidatePath('/dashboard');
  return { rawToken, apiKey: newApiKey };
}

export async function revokeApiKey(
  id: string,
  userId: string,
): Promise<ApiKey> {
  const key = mockApiKeys.find(k => k.id === id && k.userId === userId);
  if (!key) throw new Error('API Key not found or access denied.');
  key.status = 'Revoked';
  key.updatedAt = new Date().toISOString();
  await logAuditEvent('api_key.revoked', id, { label: key.label }, userId);
  revalidatePath('/dashboard/keys');
  return key;
}

export async function deleteApiKey(
  id: string,
  userId: string,
): Promise<{ success: true }> {
  const keyIndex = mockApiKeys.findIndex(
    k => k.id === id && k.userId === userId,
  );
  if (keyIndex === -1) throw new Error('API Key not found or access denied.');
  const deletedKey = mockApiKeys[keyIndex];
  mockApiKeys.splice(keyIndex, 1);
  await logAuditEvent(
    'api_key.deleted',
    id,
    { label: deletedKey.label },
    userId,
  );
  revalidatePath('/dashboard/keys');
  revalidatePath('/dashboard');
  return { success: true };
}

// --- OTHER MOCK DATA ACTIONS ---

export async function getProductionLines(): Promise<ProductionLine[]> {
  return Promise.resolve(JSON.parse(JSON.stringify(mockProductionLines)));
}

export async function getServiceTickets(): Promise<ServiceTicket[]> {
  return Promise.resolve(JSON.parse(JSON.stringify(mockServiceTickets)));
}
