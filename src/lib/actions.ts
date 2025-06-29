'use server';

import { revalidatePath } from 'next/cache';
import { products as mockProducts } from './data';
import type { Product } from '@/types';
import { enhancePassportInformation, type EnhancePassportInformationInput } from '@/ai/flows/enhance-passport-information';
import { db } from './firebase';
import { collection, getDocs, doc, setDoc, addDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { Collections } from './constants';

const productsCollection = collection(db, Collections.PRODUCTS);

async function seedDatabase() {
    const productsSnapshot = await getDocs(productsCollection);
    if (productsSnapshot.empty) {
        const promises = mockProducts.map(product => {
            const docRef = doc(productsCollection, product.id);
            // lastUpdated is already in the mock data, so we don't need to add it again
            const { id, ...productData } = product;
            return setDoc(docRef, productData);
        });
        await Promise.all(promises);
    }
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

export async function saveProduct(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'lastUpdated'> & { id?: string }): Promise<Product> {
  const now = new Date().toISOString();

  if (data.id) {
    // Update existing product
    const productRef = doc(db, Collections.PRODUCTS, data.id);
    const { id, ...saveData } = data;
    const updatedData = { ...saveData, updatedAt: now, lastUpdated: now.split('T')[0] };
    await setDoc(productRef, updatedData, { merge: true });
    
    revalidatePath('/dashboard');

    // To provide the full product object back, we need the createdAt timestamp.
    // In a real app, you'd fetch it, but here we'll assume it exists.
    return { ...updatedData, id: data.id, createdAt: 'N/A' } as Product;
  } else {
    // Create new product
    const newProductData = {
      ...data,
      createdAt: now,
      updatedAt: now,
      lastUpdated: now.split('T')[0],
    };
    const docRef = await addDoc(collection(db, Collections.PRODUCTS), newProductData);
    revalidatePath('/dashboard');
    return { ...newProductData, id: docRef.id };
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
