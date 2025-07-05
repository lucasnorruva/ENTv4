// src/lib/actions/product-actions.ts
'use server';

import {
  collection,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Product, User } from '@/types';
import { productFormSchema, type ProductFormValues } from '@/lib/schemas';
import { getUserById, getCompanyById } from '@/lib/auth';
import { checkPermission } from '@/lib/permissions';
import { UserRoles, type Role } from '@/lib/constants';
import { hasRole } from '@/lib/auth-utils';
import { logAuditEvent } from './audit-actions';
import { newId } from './utils';
import { processProductAi } from './product-ai-actions';
import { runSubmissionValidation } from '@/services/validation';

const PRODUCTS_COLLECTION = 'products';

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

  const productsRef = collection(db, PRODUCTS_COLLECTION);
  let q;

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

  if (!userId) {
    q = query(productsRef, where('status', '==', 'Published'), orderBy('lastUpdated', 'desc'));
  } else if (globalReadRoles.some(role => hasRole(user!, role))) {
    q = query(productsRef, orderBy('lastUpdated', 'desc'));
  } else {
    q = query(
      productsRef,
      where('companyId', '==', user!.companyId),
      orderBy('lastUpdated', 'desc'),
    );
  }

  const snapshot = await getDocs(q);
  let results = snapshot.docs.map(
    doc => ({ ...doc.data(), id: doc.id } as Product),
  );

  // In-memory filtering after fetching
  if (filters?.searchQuery) {
    const s = filters.searchQuery.toLowerCase();
    results = results.filter(
      p =>
        p.productName.toLowerCase().includes(s) ||
        p.supplier.toLowerCase().includes(s) ||
        p.category.toLowerCase().includes(s) ||
        p.gtin?.toLowerCase().includes(s),
    );
  }
  if (filters?.category) {
    results = results.filter(p => p.category === filters.category);
  }
  if (filters?.verificationStatus) {
    results = results.filter(
      p =>
        (p.verificationStatus ?? 'Not Submitted') === filters.verificationStatus,
    );
  }

  return Promise.resolve(results);
}

export async function getProductById(
  id: string,
  userId?: string,
): Promise<Product | undefined> {
  const docRef = doc(db, PRODUCTS_COLLECTION, id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return undefined;
  }

  const product = { ...docSnap.data(), id: docSnap.id } as Product;
  
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

  const hasGlobalReadAccess = globalReadRoles.some(role => hasRole(user, role));

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

  const productsRef = collection(db, PRODUCTS_COLLECTION);
  let gtinQuery;

  if (hasRole(user, UserRoles.ADMIN) || hasRole(user, UserRoles.DEVELOPER)) {
    gtinQuery = query(
      productsRef,
      where('gtin', '==', gtin),
      limit(1),
    );
  } else {
    gtinQuery = query(
      productsRef,
      where('gtin', '==', gtin),
      where('companyId', '==', user.companyId),
      limit(1),
    );
  }

  const snapshot = await getDocs(gtinQuery);
  if (snapshot.empty) {
    return undefined;
  }
  
  const doc = snapshot.docs[0];
  return { ...doc.data(), id: doc.id } as Product;
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

  if (productId) {
    const productRef = doc(db, PRODUCTS_COLLECTION, productId);
    const existingSnap = await getDoc(productRef);
    const existingProduct = existingSnap.data() as Product | undefined;
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
    
    await updateDoc(productRef, updatedData);
    savedProduct = { ...existingProduct, ...updatedData, id: productId };

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
      submissionChecklist: {
        hasBaseInfo: false,
        hasMaterials: false,
        hasManufacturing: false,
        hasLifecycleData: false,
        hasCompliancePath: false,
        passesDataQuality: true,
      },
    };
    const docRef = await addDoc(collection(db, PRODUCTS_COLLECTION), newProductData);
    savedProduct = { id: docRef.id, ...newProductData };
    
    await logAuditEvent('product.created', savedProduct.id, {}, userId);
  }

  const checklist = await runSubmissionValidation(savedProduct);
  await updateDoc(doc(db, PRODUCTS_COLLECTION, savedProduct.id), {
    submissionChecklist: checklist,
  });
  
  // Simulate background AI processing
  setTimeout(async () => {
    try {
      const { sustainability, qrLabelText, dataQualityWarnings } =
        await processProductAi(savedProduct);
      
      const finalChecklist = await runSubmissionValidation({
        ...savedProduct,
        dataQualityWarnings,
      });

      await updateDoc(doc(db, PRODUCTS_COLLECTION, savedProduct.id), {
        sustainability,
        qrLabelText,
        dataQualityWarnings,
        submissionChecklist: finalChecklist,
        isProcessing: false,
        lastUpdated: new Date().toISOString(),
      });
    } catch (e) {
      console.error(
        `Background AI processing failed for product ${savedProduct.id}`,
        e,
      );
      await updateDoc(doc(db, PRODUCTS_COLLECTION, savedProduct.id), {
        isProcessing: false,
      });
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
  
  await deleteDoc(doc(db, PRODUCTS_COLLECTION, productId));
  
  await logAuditEvent('product.deleted', productId, {}, userId);
}
