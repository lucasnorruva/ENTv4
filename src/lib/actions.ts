'use server';

import { revalidatePath } from 'next/cache';
import { products as mockProducts } from './data';
import type { Product } from './types';
import { enhancePassportInformation, type EnhancePassportInformationInput } from '@/ai/flows/enhance-passport-information';
import { db } from './firebase';
import { collection, getDocs, doc, setDoc, addDoc, deleteDoc, query, orderBy } from 'firebase/firestore';

const productsCollection = collection(db, 'products');

async function seedDatabase() {
    const productsSnapshot = await getDocs(productsCollection);
    if (productsSnapshot.empty) {
        const promises = mockProducts.map(product => {
            const docRef = doc(productsCollection, product.id);
            return setDoc(docRef, product);
        });
        await Promise.all(promises);
    }
}

export async function getProducts(): Promise<Product[]> {
  await seedDatabase();
  
  const q = query(productsCollection, orderBy('lastUpdated', 'desc'));
  const productsSnapshot = await getDocs(q);
  const products: Product[] = [];
  productsSnapshot.forEach(doc => {
    products.push({ id: doc.id, ...doc.data() } as Product);
  });
  return products;
}

export async function saveProduct(data: Omit<Product, 'id' | 'lastUpdated'> & { id?: string }): Promise<Product> {
  const now = new Date().toISOString().split('T')[0];

  if (data.id) {
    // Update existing product
    const productRef = doc(db, 'products', data.id);
    const saveData = { ...data };
    delete saveData.id;
    const updatedData = { ...saveData, lastUpdated: now };
    await setDoc(productRef, updatedData, { merge: true });
    revalidatePath('/');
    return { ...data, lastUpdated: now } as Product;
  } else {
    // Create new product
    const newProductData = {
      ...data,
      lastUpdated: now,
    };
    const docRef = await addDoc(collection(db, 'products'), newProductData);
    revalidatePath('/');
    return { ...newProductData, id: docRef.id };
  }
}

export async function deleteProduct(id: string): Promise<{ success: boolean }> {
  const productRef = doc(db, 'products', id);
  await deleteDoc(productRef);
  revalidatePath('/');
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
