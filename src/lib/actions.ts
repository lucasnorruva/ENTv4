'use server';

import { revalidatePath } from 'next/cache';
import { passports as mockPassports } from './data';
import type { Passport } from './types';
import { enhancePassportInformation, type EnhancePassportInformationInput } from '@/ai/flows/enhance-passport-information';
import { db } from './firebase';
import { collection, getDocs, doc, setDoc, addDoc, deleteDoc, query, orderBy } from 'firebase/firestore';

const passportsCollection = collection(db, 'passports');

async function seedDatabase() {
    const passportsSnapshot = await getDocs(passportsCollection);
    if (passportsSnapshot.empty) {
        const promises = mockPassports.map(passport => {
            const docRef = doc(passportsCollection, passport.id);
            return setDoc(docRef, passport);
        });
        await Promise.all(promises);
    }
}

export async function getPassports(): Promise<Passport[]> {
  await seedDatabase();
  
  const q = query(passportsCollection, orderBy('lastUpdated', 'desc'));
  const passportsSnapshot = await getDocs(q);
  const passports: Passport[] = [];
  passportsSnapshot.forEach(doc => {
    passports.push({ id: doc.id, ...doc.data() } as Passport);
  });
  return passports;
}

export async function savePassport(data: Omit<Passport, 'id' | 'lastUpdated'> & { id?: string }): Promise<Passport> {
  const now = new Date().toISOString().split('T')[0];

  if (data.id) {
    // Update existing passport
    const passportRef = doc(db, 'passports', data.id);
    const saveData = { ...data };
    delete saveData.id;
    const updatedData = { ...saveData, lastUpdated: now };
    await setDoc(passportRef, updatedData, { merge: true });
    revalidatePath('/');
    return { ...data, lastUpdated: now } as Passport;
  } else {
    // Create new passport
    const newPassportData = {
      ...data,
      lastUpdated: now,
    };
    const docRef = await addDoc(collection(db, 'passports'), newPassportData);
    revalidatePath('/');
    return { ...newPassportData, id: docRef.id };
  }
}

export async function deletePassport(id: string): Promise<{ success: boolean }> {
  const passportRef = doc(db, 'passports', id);
  await deleteDoc(passportRef);
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
