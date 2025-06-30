
'use server';

import { revalidatePath } from 'next/cache';
import { randomBytes } from 'crypto';

// --- MOCK DATA IMPORTS ---
import { products } from './data';
import { compliancePaths } from './compliance-data';
import { users } from './user-data';
import { auditLogs } from './audit-log-data';
import { apiKeys } from './api-key-data';
import { apiSettings } from './api-settings-data';
import { productionLines } from './manufacturing-data';
import { serviceTickets } from './service-ticket-data';
import { companies } from './company-data';

import {
  productFormSchema,
  type ProductFormValues,
  compliancePathFormSchema,
  type CompliancePathFormValues,
  userFormSchema,
  type UserFormValues,
  apiSettingsSchema,
  type ApiSettingsFormValues,
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
import { getUserById, getCompanyById, hasRole } from './auth';

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
  ApiSettings,
} from '@/types';
import { UserRoles } from './constants';
import type { AiProduct } from '@/ai/schemas';

// --- OWNERSHIP & PERMISSION HELPERS ---

const checkProductOwnership = async (productId: string, userId: string) => {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found.');

  if (
    hasRole(user, UserRoles.ADMIN) ||
    hasRole(user, UserRoles.AUDITOR) ||
    hasRole(user, UserRoles.RECYCLER)
  ) {
    return true; // Admins, Auditors, and Recyclers can access any product
  }

  const product = products.find(p => p.id === productId);
  if (!product) throw new Error('Product not found.');
  if (product.companyId !== user.companyId) {
    throw new Error('Access denied. User does not own this product.');
  }
  return true;
};

// --- AUDIT LOGGING ---

const logAuditEvent = async (
  action: string,
  entityId: string,
  details: Record<string, any>,
  userId: string = 'system',
) => {
  const logEntry: AuditLog = {
    id: `log-${Math.random().toString(36).substring(2, 9)}`,
    userId,
    action,
    entityId,
    details,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  auditLogs.unshift(logEntry); // Add to beginning of array
  revalidatePath('/dashboard/analytics');
  revalidatePath('/dashboard/history');
  revalidatePath('/dashboard/logs');
};

// --- AI FLOW ORCHESTRATION ---

const runAllAiFlows = async (
  productData: AiProduct,
): Promise<{ sustainability: SustainabilityData; qrLabelText: string }> => {
  // This version of the function no longer needs to fetch the compliance path,
  // as it will be passed into the summarizeComplianceGaps flow directly
  // when it's called.

  const [
    esgResult,
    // complianceResult is now handled separately where compliance path is known
    qrLabelResult,
    classificationResult,
    lifecycleAnalysisResult,
  ] = await Promise.all([
    calculateSustainability({ product: productData }),
    generateQRLabelText({ product: productData }),
    classifyProduct({ product: productData }),
    analyzeProductLifecycle({ product: productData }),
  ]);

  return {
    sustainability: {
      ...esgResult,
      classification: classificationResult,
      lifecycleAnalysis: lifecycleAnalysisResult,
      // Compliance fields will be added later
      isCompliant: false,
      complianceSummary: 'Awaiting compliance analysis.',
    },
    qrLabelText: qrLabelResult.qrLabelText,
  };
};

// --- PRODUCT ACTIONS ---

export async function getProducts(userId?: string): Promise<Product[]> {
  if (!userId) {
    return products;
  }
  const user = await getUserById(userId);
  if (!user) {
    throw new Error('User not found.');
  }
  // Admins, Auditors, Analysts, and Recyclers can see all products
  if (
    hasRole(user, UserRoles.ADMIN) ||
    hasRole(user, UserRoles.AUDITOR) ||
    hasRole(user, UserRoles.BUSINESS_ANALYST) ||
    hasRole(user, UserRoles.RECYCLER)
  ) {
    return products;
  }
  // Other roles only see products from their company
  return products.filter(p => p.companyId === user.companyId);
}

export async function getProductById(
  id: string,
  userId?: string,
): Promise<Product | undefined> {
  const product = products.find(p => p.id === id);
  if (!product) {
    return undefined;
  }

  // If a userId is provided, check for ownership or special roles.
  if (userId) {
    const user = await getUserById(userId);
    if (
      user &&
      (hasRole(user, UserRoles.ADMIN) ||
        hasRole(user, UserRoles.AUDITOR) ||
        hasRole(user, UserRoles.RECYCLER) ||
        product.companyId === user.companyId)
    ) {
      return product;
    }
    // If user is provided but doesn't have access, return undefined.
    // This check is important for dashboard pages.
    return undefined;
  }

  // For public access, only return published products.
  if (product.status === 'Published') {
    return product;
  }

  return undefined;
}

export async function saveProduct(
  productData: ProductFormValues,
  userId: string,
  productId?: string,
): Promise<Product> {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found for saving product.');
  const company = await getCompanyById(user.companyId);
  if (!company) throw new Error('Company not found for user.');

  const validatedData = productFormSchema.parse(productData);
  const now = new Date().toISOString();

  // The AI flows now expect a consistent product object.
  const aiProductInput: AiProduct = {
    ...validatedData,
    supplier: company.name,
  };

  // Run the general AI flows first, which initializes the sustainability object.
  const { sustainability, qrLabelText } = await runAllAiFlows(aiProductInput);

  // If a compliance path is selected, run the gap analysis flow.
  if (validatedData.compliancePathId) {
    const path = await getCompliancePathById(validatedData.compliancePathId);
    if (path) {
      const complianceResult = await summarizeComplianceGaps({
        product: aiProductInput,
        compliancePath: path,
      });
      // Merge the specific compliance results into the sustainability object
      sustainability.isCompliant = complianceResult.isCompliant;
      sustainability.complianceSummary = complianceResult.complianceSummary;
      sustainability.gaps = complianceResult.gaps;
    }
  }

  if (productId) {
    await checkProductOwnership(productId, userId);
    const productIndex = products.findIndex(p => p.id === productId);
    if (productIndex === -1) {
      throw new Error('Product not found');
    }
    const existingProduct = products[productIndex];
    const updatedProduct: Product = {
      ...existingProduct,
      ...validatedData,
      supplier: company.name,
      sustainability, // This now contains the merged data
      qrLabelText,
      updatedAt: now,
      lastUpdated: now,
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
    return updatedProduct;
  } else {
    const newId = `pp-${randomBytes(4).toString('hex')}`;
    const newProduct: Product = {
      id: newId,
      ...validatedData,
      companyId: user.companyId,
      supplier: company.name,
      sustainability, // This now contains the merged data
      qrLabelText,
      verificationStatus: 'Not Submitted',
      endOfLifeStatus: 'Active',
      createdAt: now,
      updatedAt: now,
      lastUpdated: now,
    };
    products.unshift(newProduct);
    await logAuditEvent(
      'product.created',
      newId,
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
  await checkProductOwnership(id, userId);
  const productIndex = products.findIndex(p => p.id === id);
  if (productIndex !== -1) {
    const deletedProduct = products.splice(productIndex, 1)[0];
    await logAuditEvent(
      'product.deleted',
      id,
      { productName: deletedProduct.productName },
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
  await checkProductOwnership(productId, userId);
  const product = await getProductById(productId, userId);
  if (!product) throw new Error('Product not found or access denied.');
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
  await checkProductOwnership(productId, userId);
  const product = await getProductById(productId, userId);
  if (!product) throw new Error('Product not found or access denied.');

  const compliancePath = product.compliancePathId
    ? await getCompliancePathById(product.compliancePathId)
    : null;
  if (!compliancePath) {
    throw new Error('Compliance path not configured for this product.');
  }

  const { isCompliant, gaps } = await verifyProductAgainstPath(
    product,
    compliancePath,
  );
  if (!isCompliant) {
    const summary = `Product failed final verification with ${gaps.length} issue(s).`;
    await rejectPassport(product.id, summary, gaps, 'system:gatekeeper');
    throw new Error(
      `Cannot approve: Product is not compliant. Issues found: ${gaps
        .map(g => g.issue)
        .join(', ')}`,
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
  await checkProductOwnership(productId, userId);
  const product = await getProductById(productId, userId);
  if (!product) throw new Error('Product not found or access denied.');

  product.verificationStatus = 'Failed';
  product.lastVerificationDate = new Date().toISOString();
  product.updatedAt = new Date().toISOString();
  if (!product.sustainability) {
    product.sustainability = {
      score: 0,
      environmental: 0,
      social: 0,
      governance: 0,
      isCompliant: false,
      complianceSummary: 'Analysis not performed.',
    };
  }
  product.sustainability.isCompliant = false;
  product.sustainability.complianceSummary = summary;
  product.sustainability.gaps = gaps;

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

export async function runSuggestImprovements(
  data: ProductFormValues,
): Promise<any> {
  // This needs fixing. The form doesn't have the user/company context directly.
  // For now, let's use a mock supplier name.
  const aiProductInput: AiProduct = {
    ...data,
    supplier: 'Mock Company Name', // Temporary fix
  };
  return suggestImprovements({ product: aiProductInput });
}

export async function recalculateScore(
  productId: string,
  userId: string,
): Promise<Product> {
  await checkProductOwnership(productId, userId);
  const product = await getProductById(productId, userId);
  if (!product) throw new Error('Product not found or access denied.');

  const { sustainability, qrLabelText } = await runAllAiFlows(product);
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
  await checkProductOwnership(productId, userId);
  const product = await getProductById(productId, userId);
  if (!product) throw new Error('Product not found or access denied.');

  product.endOfLifeStatus = 'Recycled';
  product.updatedAt = new Date().toISOString();

  await logAuditEvent('product.recycled', productId, {}, userId);
  revalidatePath('/dashboard/eol');
  revalidatePath(`/products/${productId}`);
  return product;
}

// --- AUDIT LOG ACTIONS ---

export async function getAuditLogs(): Promise<AuditLog[]> {
  return auditLogs;
}

export async function getAuditLogsForUser(userId: string): Promise<AuditLog[]> {
  return auditLogs.filter(log => log.userId === userId);
}

// --- COMPLIANCE PATH ACTIONS ---

export async function getCompliancePaths(): Promise<CompliancePath[]> {
  return compliancePaths;
}

export async function getCompliancePathById(
  id: string,
): Promise<CompliancePath | null> {
  const path = compliancePaths.find(p => p.id === id);
  return path || null;
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
    updatedAt: now,
  };

  if (pathId) {
    const pathIndex = compliancePaths.findIndex(p => p.id === pathId);
    if (pathIndex === -1) throw new Error('Compliance path not found.');
    const existingPath = compliancePaths[pathIndex];
    const updatedPath = { ...existingPath, ...dataToSave };
    compliancePaths[pathIndex] = updatedPath;
    await logAuditEvent(
      'compliance_path.updated',
      pathId,
      { name: dataToSave.name },
      userId,
    );
    revalidatePath('/dashboard/compliance');
    return updatedPath;
  } else {
    const newId = `cp-${randomBytes(4).toString('hex')}`;
    const newPath: CompliancePath = {
      id: newId,
      ...dataToSave,
      createdAt: now,
    };
    compliancePaths.push(newPath);
    await logAuditEvent(
      'compliance_path.created',
      newId,
      { name: newPath.name },
      userId,
    );
    revalidatePath('/dashboard/compliance');
    return newPath;
  }
}

// --- USER ACTIONS ---

export async function getUsers(): Promise<User[]> {
  return users;
}

export async function saveUser(
  userData: UserFormValues,
  adminUserId: string,
  userId?: string,
): Promise<User> {
  const validatedData = userFormSchema.parse(userData);
  const now = new Date().toISOString();
  const dataToSave = {
    fullName: validatedData.fullName,
    email: validatedData.email,
    companyId: validatedData.companyId,
    roles: [validatedData.role],
    updatedAt: now,
  };

  if (userId) {
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) throw new Error('User not found.');
    const existingUser = users[userIndex];
    const updatedUser = { ...existingUser, ...dataToSave };
    users[userIndex] = updatedUser;
    await logAuditEvent(
      'user.updated',
      userId,
      { email: validatedData.email },
      adminUserId,
    );
    revalidatePath('/dashboard/users');
    return updatedUser;
  } else {
    const newId = `user-${randomBytes(4).toString('hex')}`;
    const newUser: User = {
      id: newId,
      ...dataToSave,
      createdAt: now,
    };
    users.push(newUser);
    await logAuditEvent(
      'user.created',
      newId,
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
  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex !== -1) {
    const deletedUser = users.splice(userIndex, 1)[0];
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

// --- SETTINGS ACTIONS ---

export async function updateUserProfile(
  userId: string,
  fullName: string,
): Promise<User> {
  const user = users.find(u => u.id === userId);
  if (!user) throw new Error('User not found.');
  user.fullName = fullName;
  user.updatedAt = new Date().toISOString();
  await logAuditEvent('user.profile.updated', userId, { fullName }, userId);
  revalidatePath('/dashboard/settings');
  revalidatePath('/dashboard/layout');
  return user;
}

export async function updateUserPassword(
  userId: string,
  current: string,
  newPass: string,
): Promise<{ success: boolean }> {
  if (current !== 'password123') {
    throw new Error('Current password does not match.');
  }
  await logAuditEvent('user.password.updated', userId, {}, userId);
  return { success: true };
}

export async function saveNotificationPreferences(
  userId: string,
  prefs: Record<string, boolean>,
): Promise<{ success: boolean }> {
  await logAuditEvent(
    'user.notifications.updated',
    userId,
    { preferences: prefs },
    userId,
  );
  return { success: true };
}

// --- API KEY ACTIONS ---

export async function getApiKeys(userId: string): Promise<ApiKey[]> {
  return apiKeys.filter(key => key.userId === userId);
}

export async function createApiKey(
  label: string,
  userId: string,
): Promise<{ rawToken: string; apiKey: ApiKey }> {
  const now = new Date().toISOString();
  const rawToken = `nor_live_${randomBytes(16).toString('hex')}`;
  const storedToken = `${rawToken.slice(0, 10)}******************${rawToken.slice(-4)}`;

  const newApiKey: ApiKey = {
    id: `key-${randomBytes(4).toString('hex')}`,
    label,
    token: storedToken,
    status: 'Active' as const,
    userId,
    createdAt: now,
    updatedAt: now,
  };

  apiKeys.push(newApiKey);
  await logAuditEvent('api_key.created', newApiKey.id, { label }, userId);
  revalidatePath('/dashboard/keys');
  revalidatePath('/dashboard');

  return { rawToken, apiKey: newApiKey };
}

export async function revokeApiKey(id: string, userId: string): Promise<ApiKey> {
  const key = apiKeys.find(k => k.id === id);
  if (!key || key.userId !== userId) {
    throw new Error('API Key not found or access denied.');
  }
  key.status = 'Revoked';
  key.updatedAt = new Date().toISOString();
  await logAuditEvent('api_key.revoked', id, { label: key.label }, userId);
  revalidatePath('/dashboard/keys');
  revalidatePath('/dashboard');
  return key;
}

export async function deleteApiKey(
  id: string,
  userId: string,
): Promise<{ success: true }> {
  const keyIndex = apiKeys.findIndex(k => k.id === id);
  if (keyIndex === -1 || apiKeys[keyIndex].userId !== userId) {
    throw new Error('API Key not found or access denied.');
  }
  const deletedKey = apiKeys.splice(keyIndex, 1)[0];
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

// --- API SETTINGS ACTIONS ---

export async function getApiSettings(): Promise<ApiSettings> {
  return apiSettings;
}

export async function saveApiSettings(
  settings: ApiSettingsFormValues,
  adminUserId: string,
): Promise<ApiSettings> {
  const validatedData = apiSettingsSchema.parse(settings);
  Object.assign(apiSettings, validatedData);
  await logAuditEvent(
    'settings.api.updated',
    'global',
    { settings: validatedData },
    adminUserId,
  );
  revalidatePath('/dashboard/api-settings');
  return apiSettings;
}

// --- OTHER MOCK DATA ACTIONS ---

export async function getProductionLines(): Promise<ProductionLine[]> {
  return productionLines;
}

export async function getServiceTickets(): Promise<ServiceTicket[]> {
  return serviceTickets;
}

export async function resolveComplianceIssue(
  productId: string,
  userId: string,
): Promise<Product> {
  await checkProductOwnership(productId, userId);
  const product = await getProductById(productId, userId);
  if (!product) throw new Error('Product not found or access denied.');

  product.verificationStatus = 'Draft';
  product.updatedAt = new Date().toISOString();

  await logAuditEvent(
    'compliance.resolved',
    productId,
    { newStatus: 'Draft' },
    userId,
  );
  revalidatePath('/dashboard/flagged');
  revalidatePath('/dashboard/products');
  return product;
}
