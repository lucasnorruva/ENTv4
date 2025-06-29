'use server';

import { revalidatePath } from 'next/cache';
import { passports as mockPassports } from './data';
import type { Passport } from './types';
import { enhancePassportInformation, type EnhancePassportInformationInput } from '@/ai/flows/enhance-passport-information';

// In a real application, this would be a database.
// For this demo, we're using an in-memory array which resets on each server restart.
let passports: Passport[] = [...mockPassports];

export async function getPassports(): Promise<Passport[]> {
  // Simulate network latency
  await new Promise(resolve => setTimeout(resolve, 500));
  return passports.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
}

export async function savePassport(data: Omit<Passport, 'id' | 'lastUpdated'> & { id?: string }): Promise<Passport> {
  const now = new Date().toISOString().split('T')[0];

  if (data.id) {
    // Update existing passport
    const index = passports.findIndex(p => p.id === data.id);
    if (index !== -1) {
      passports[index] = { ...passports[index], ...data, lastUpdated: now };
      revalidatePath('/');
      return passports[index];
    }
    throw new Error('Passport not found');
  } else {
    // Create new passport
    const newPassport: Passport = {
      ...data,
      id: `pp-${Date.now().toString()}`,
      lastUpdated: now,
    };
    passports.unshift(newPassport);
    revalidatePath('/');
    return newPassport;
  }
}

export async function deletePassport(id: string): Promise<{ success: boolean }> {
  const index = passports.findIndex(p => p.id === id);
  if (index !== -1) {
    passports.splice(index, 1);
    revalidatePath('/');
    return { success: true };
  }
  return { success: false };
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
