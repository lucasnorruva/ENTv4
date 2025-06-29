"use server";

import { revalidatePath } from "next/cache";
import { products as mockProductsData } from "./data";
import type { Product, AuditLog } from "@/types";
import {
  enhancePassportInformation,
  type EnhancePassportInformationInput,
} from "@/ai/flows/enhance-passport-information";
import { calculateSustainability } from "@/ai/flows/calculate-sustainability";
import { anchorToPolygon, hashProductData } from "@/services/blockchain";

// Use an in-memory array for mock data to simulate database operations
let mockProducts = [...mockProductsData];

export async function getProducts(): Promise<Product[]> {
  // Return mock data directly to avoid Firestore permission issues in dev
  return Promise.resolve(mockProducts);
}

export async function saveProduct(
  data: Omit<
    Product,
    | "id"
    | "createdAt"
    | "updatedAt"
    | "lastUpdated"
    | "sustainabilityScore"
    | "sustainabilityReport"
    | "blockchainProof"
  > & { id?: string },
): Promise<Product> {
  const now = new Date();
  const nowISO = now.toISOString();

  // Keep AI enrichment and blockchain for demonstration, but handle failures
  let aiResult = {};
  try {
    const aiInput = {
      productName: data.productName,
      productDescription: data.productDescription,
      category: data.category,
      currentInformation: data.currentInformation,
    };
    aiResult = await calculateSustainability(aiInput);
  } catch (e) {
    console.error("AI sustainability calculation failed (mock mode):", e);
  }

  let blockchainProof = {
    txHash: "0xmocktx" + Math.random().toString(16).slice(2),
    explorerUrl: "#",
    blockHeight: 0,
  };
  try {
    const productDataHash = await hashProductData(data.currentInformation);
    blockchainProof = await anchorToPolygon(productDataHash);
  } catch (e) {
    console.error("Blockchain anchoring failed (mock mode):", e);
  }

  if (data.id) {
    // Update existing product in mock array
    const updatedProduct = {
      ...data,
      id: data.id,
      ...aiResult,
      blockchainProof,
      updatedAt: nowISO,
      lastUpdated: now.toISOString().split("T")[0],
      verificationStatus: "Pending" as const,
      lastVerificationDate: nowISO,
      createdAt: mockProducts.find((p) => p.id === data.id)?.createdAt || nowISO,
    };
    mockProducts = mockProducts.map((p) =>
      p.id === data.id ? (updatedProduct as Product) : p,
    );
    revalidatePath("/dashboard");
    return updatedProduct as Product;
  } else {
    // Create new product in mock array
    const newProduct: Product = {
      ...data,
      ...aiResult,
      blockchainProof,
      id: `pp-mock-${Date.now()}`,
      createdAt: nowISO,
      updatedAt: nowISO,
      lastUpdated: now.toISOString().split("T")[0],
      verificationStatus: "Pending" as const,
      endOfLifeStatus: "Active" as const,
    };
    mockProducts.unshift(newProduct);
    revalidatePath("/dashboard");
    return newProduct;
  }
}

export async function deleteProduct(id: string): Promise<{ success: boolean }> {
  mockProducts = mockProducts.filter((p) => p.id !== id);
  revalidatePath("/dashboard");
  return { success: true };
}

export async function runEnhancement(
  data: EnhancePassportInformationInput,
): Promise<string> {
  try {
    const result = await enhancePassportInformation(data);
    return result.enhancedInformation;
  } catch (error) {
    console.error("AI Enhancement Error:", error);
    return "There was an error enhancing the passport information. Please try again.";
  }
}

export async function logAuditEvent(
  action: string,
  entityId: string,
  details: Record<string, any>,
  userId: string = "system",
): Promise<void> {
  console.log("AUDIT EVENT (mock mode):", {
    userId,
    action,
    entityId,
    details,
    timestamp: new Date().toISOString(),
  });
  return Promise.resolve();
}
