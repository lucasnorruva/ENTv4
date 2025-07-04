// src/lib/actions/product-actions.ts
'use server';

import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import type { Product, User } from '@/types';
import { productFormSchema, type ProductFormValues } from '@/lib/schemas';
import { adminDb } from '@/lib/firebase-admin';
import { getUserById, getCompanyById } from '@/lib/auth';
import { checkPermission } from '@/lib/permissions';
import { UserRoles, type Role } from '@/lib/constants';
import { hasRole } from '@/lib/auth-utils';
import { logAuditEvent } from './audit-actions';
import { newId } from './utils';
import { processProductAi } from './product-ai-actions';

const productsCollection = adminDb.collection('products');

// --- Core CRUD Actions ---

export async function getProducts(
  userId?: string,
  filters?: {
    searchQuery?: string;
    category?: string;
    verificationStatus?: string;
  },
): Promise<Product[]> {
  let user: User | undefined;
  if (userId) {
    user = await getUserById(userId);
    if (!user) return [];
  }

  let query: FirebaseFirestore.Query<Product> =
    productsCollection as FirebaseFirestore.Query<Product>;

  if (!userId) {
    // Public access: only published products
    query = query.where('status', '==', 'Published');
  } else {
    const globalReadRoles: Role[] = [
      UserRoles.ADMIN,
      UserRoles.AUDITOR,
      UserRoles.BUSINESS_ANALYST,
      UserRoles.RETAILER,
      UserRoles.SERVICE_PROVIDER,
      UserRoles.COMPLIANCE_MANAGER,
      UserRoles.DEVELOPER,
      UserRoles.MANUFACTURER,
      UserRoles.RECYCLER,
    ];
    const hasGlobalRead = globalReadRoles.some(role => hasRole(user!, role));
    if (!hasGlobalRead) {
      query = query.where('companyId', '==', user.companyId);
    }
  }

  const snapshot = await query.orderBy('lastUpdated', 'desc').get();
  let results = snapshot.docs.map(doc => doc.data());

  // In-memory filtering after fetching
  if (filters?.searchQuery) {
    const q = filters.searchQuery.toLowerCase();
    results = results.filter(
      p =>
        p.productName.toLowerCase().includes(q) ||
        p.supplier.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.gtin?.toLowerCase().includes(q),
    );
  }
  if (filters?.category) {
    results = results.filter(p => p.category === filters.category);
  }
  if (filters?.verificationStatus) {
    results = results.filter(
      p => (p.verificationStatus ?? 'Not Submitted') === filters.verificationStatus,
    );
  }

  return results;
}

export async function getProductById(
  id: string,
  userId?: string,
): Promise<Product | undefined> {
  const doc = await productsCollection.doc(id).get();
  if (!doc.exists) return undefined;

  const product = doc.data() as Product;

  if (!userId) {
    return product.status === 'Published' ? product : undefined;
  }
  const user = await getUserById(userId);
  if (!user) return undefined;

  const globalReadRoles: Role[] = [
    UserRoles.ADMIN,
    UserRoles.AUDITOR,
    UserRoles.COMPLIANCE_MANAGER,
    UserRoles.RECYCLER,
    UserRoles.SERVICE_PROVIDER,
    UserRoles.BUSINESS_ANALYST,
    UserRoles.DEVELOPER,
    UserRoles.MANUFACTURER,
    UserRoles.RETAILER,
  ];

  const hasGlobalReadAccess = globalReadRoles.some(role =>
    hasRole(user, role),
  );

  if (hasGlobalReadAccess || user.companyId === product.companyId) {
    return product;
  }

  return product.status === 'Published' ? product : undefined;
}

export async function getProductByGtin(
  gtin: string,
  userId: string,
): Promise<Product | undefined> {
  const user = await getUserById(userId);
  if (!user) return undefined;

  let query: FirebaseFirestore.Query = productsCollection.where(
    'gtin',
    '==',
    gtin,
  );

  // Admins and developers can search across all companies
  if (!hasRole(user, UserRoles.ADMIN) && !hasRole(user, UserRoles.DEVELOPER)) {
    query = query.where('companyId', '==', user.companyId);
  }

  const snapshot = await query.limit(1).get();
  if (snapshot.empty) {
    return undefined;
  }
  return snapshot.docs[0].data() as Product;
}

export async function saveProduct(
  values: ProductFormValues,
  userId: string,
  productId?: string,
): Promise<Product> {
  const validatedData = productFormSchema.parse(values);
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');

  const now = new Date().toISOString();
  let savedProduct: Product;
  let productRef;

  if (productId) {
    productRef = productsCollection.doc(productId);
    const doc = await productRef.get();
    const existingProduct = doc.data() as Product | undefined;
    if (!existingProduct) throw new Error('Product not found');

    checkPermission(user, 'product:edit', existingProduct);

    if (
      validatedData.status === 'Archived' &&
      existingProduct.status !== 'Archived'
    ) {
      checkPermission(user, 'product:archive', existingProduct);
    }

    const updatedData: Partial<Product> = {
      ...validatedData,
      lastUpdated: now,
      updatedAt: now,
      verificationStatus:
        existingProduct.verificationStatus === 'Failed'
          ? 'Not Submitted'
          : existingProduct.verificationStatus,
      status:
        existingProduct.verificationStatus === 'Failed'
          ? 'Draft'
          : validatedData.status,
      isProcessing: true,
    };

    await productRef.update(updatedData);
    savedProduct = { ...existingProduct, ...updatedData };
    await logAuditEvent(
      'product.updated',
      productId,
      { changes: Object.keys(values) },
      userId,
    );
  } else {
    checkPermission(user, 'product:create');
    const company = await getCompanyById(user.companyId);
    if (!company)
      throw new Error(`Company with ID ${user.companyId} not found.`);

    const newProductData: Omit<Product, 'id'> = {
      ...validatedData,
      companyId: user.companyId,
      supplier: company.name,
      productImage:
        validatedData.productImage || 'https://placehold.co/400x400.png',
      createdAt: now,
      updatedAt: now,
      lastUpdated: now,
      endOfLifeStatus: 'Active',
      verificationStatus: 'Not Submitted',
      materials: validatedData.materials || [],
      isProcessing: true,
    };
    productRef = await productsCollection.add(newProductData);
    savedProduct = { id: productRef.id, ...newProductData };
    await productRef.update({ id: productRef.id });

    await logAuditEvent('product.created', savedProduct.id, {}, userId);
  }

  setTimeout(async () => {
    try {
      const { sustainability, qrLabelText, dataQualityWarnings } =
        await processProductAi(savedProduct);
      await productRef!.update({
        sustainability,
        qrLabelText,
        dataQualityWarnings,
        isProcessing: false,
        lastUpdated: new Date().toISOString(),
      });
    } catch (e) {
      console.error(
        `Background AI processing failed for product ${savedProduct.id}`,
        e,
      );
      await productRef!.update({ isProcessing: false });
    }
  }, 3000);

  return savedProduct;
}

export async function deleteProduct(
  productId: string,
  userId: string,
): Promise<void> {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');

  const product = await getProductById(productId, userId);
  if (!product) throw new Error('Product not found');

  checkPermission(user, 'product:delete', product);

  await productsCollection.doc(productId).delete();
  await logAuditEvent('product.deleted', productId, {}, userId);
}
