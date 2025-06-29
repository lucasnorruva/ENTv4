'use server';

import { revalidatePath } from 'next/cache';
import { products as mockProducts } from './data';
import { compliancePaths as mockCompliancePaths } from './compliance-data';
import type { Product, CompliancePath, AuditLog } from '@/types';
import { enhancePassportInformation, type EnhancePassportInformationInput } from '@/ai/flows/enhance-passport-information';
import { calculateSustainability } from '@/ai/flows/calculate-sustainability';
import { db } from './firebase';
import { collection, getDocs, doc, setDoc, addDoc, deleteDoc, query, orderBy, writeBatch } from 'firebase/firestore';
import { Collections } from './constants';

const productsCollection = collection(db, Collections.PRODUCTS);
const compliancePathsCollection = collection(db, Collections.COMPLIANCE_PATHS);
const auditLogsCollection = collection(db, Collections.AUDIT_LOGS);

async function seedDatabase() {
    const productsSnapshot = await getDocs(productsCollection);
    const batch = writeBatch(db);

    if (productsSnapshot.empty) {
        console.log('Seeding products...');
        mockProducts.forEach(product => {
            const docRef = doc(productsCollection, product.id);
            const { id, ...productData } = product;
            batch.set(docRef, productData);
        });
    }

    const compliancePathsSnapshot = await getDocs(compliancePathsCollection);
    if (compliancePathsSnapshot.empty) {
        console.log('Seeding compliance paths...');
        mockCompliancePaths.forEach((cp, index) => {
            const docRef = doc(compliancePathsCollection, `cp-${String(index + 1).padStart(3, '0')}`);
            batch.set(docRef, cp);
        });
    }

    await batch.commit();
}

export async function getProducts(): Promise<Product[]> {
  await seedDatabase();
  
  const q = query(productsCollection, orderBy('updatedAt', 'desc'));
  const productsSnapshot = await getDocs(q);
  const products: Product[] = [];
  productsSnapshot.forEach(doc => {
    products.push({ id: doc.id, ...doc.data() } as Product);
  });
  return products;
}

export async function saveProduct(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'lastUpdated' | 'sustainabilityScore' | 'sustainabilityReport'> & { id?: string }): Promise<Product> {
  const now = new Date();
  const nowISO = now.toISOString();

  if (data.id) {
    // Update existing product
    const productRef = doc(db, Collections.PRODUCTS, data.id);
    const { id, ...saveData } = data;
    const updatedData = { 
        ...saveData, 
        updatedAt: nowISO, 
        lastUpdated: now.toISOString().split('T')[0],
        verificationStatus: 'Pending' as const, // Reset verification on update
        lastVerificationDate: nowISO,
    };
    await setDoc(productRef, updatedData, { merge: true });
    
    revalidatePath('/dashboard');
    return { ...updatedData, id: data.id, createdAt: 'N/A' } as Product;
  } else {
    // Create new product
    const newProductData = {
      ...data,
      createdAt: nowISO,
      updatedAt: nowISO,
      lastUpdated: now.toISOString().split('T')[0],
      verificationStatus: 'Pending' as const,
      lastVerificationDate: nowISO,
    };
    const docRef = await addDoc(collection(db, Collections.PRODUCTS), newProductData);
    
    // This simulates the "on-create trigger" by immediately calling the AI flow
    // and updating the document with the sustainability score.
    try {
        const aiResult = await calculateSustainability({
            productName: data.productName,
            productDescription: data.productDescription,
            category: data.category,
            currentInformation: data.currentInformation
        });

        const productWithScore = {
            ...newProductData,
            ...aiResult
        };
        
        // Update the doc with the AI insights
        await setDoc(docRef, productWithScore);
        
        revalidatePath('/dashboard');
        return { ...productWithScore, id: docRef.id };

    } catch (aiError) {
        console.error("AI sustainability calculation failed for new product:", aiError);
        // The product was created, but AI failed. We can still return the base product.
        revalidatePath('/dashboard');
        return { ...newProductData, id: docRef.id };
    }
  }
}

export async function deleteProduct(id: string): Promise<{ success: boolean }> {
  const productRef = doc(db, Collections.PRODUCTS, id);
  await deleteDoc(productRef);
  revalidatePath('/dashboard');
  return { success: true };
}

export async function runEnhancement(data: EnhancePassportInformationInput): Promise<string> {
  try {
    const result = await enhancePassportInformation(data);
    return result.enhancedInformation;
  } catch (error) {
    console.error('AI Enhancement Error:', error);
    return 'There was an error enhancing the passport information. Please try again.';
  }
}

export async function logAuditEvent(
    action: string,
    entityId: string,
    details: Record<string, any>,
    userId: string = 'system'
): Promise<void> {
  const now = new Date().toISOString();
  const auditLog: Omit<AuditLog, 'id'> = {
    userId,
    action,
    entityId,
    details,
    createdAt: now,
    updatedAt: now,
  };
  await addDoc(auditLogsCollection, auditLog);
}