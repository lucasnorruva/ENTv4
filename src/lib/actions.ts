
"use server";

import { revalidatePath } from "next/cache";
import { products as mockProductsData } from "./data";
import type { Product } from "@/types";
import {
  suggestImprovements,
  type SuggestImprovementsInput,
} from "@/ai/flows/enhance-passport-information";
import { calculateSustainability } from "@/ai/flows/calculate-sustainability";
import { anchorToPolygon, hashProductData } from "@/services/blockchain";
import { compliancePaths } from "./compliance-data";
import { summarizeComplianceGaps } from "@/ai/flows/summarize-compliance-gaps";

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
    | "verificationStatus"
    | "lastVerificationDate"
    | "complianceSummary"
    | "endOfLifeStatus"
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
    // Update existing product
    const existingProduct = mockProducts.find((p) => p.id === data.id);
    if (!existingProduct) {
      throw new Error("Product not found");
    }

    let newVerificationStatus = existingProduct.verificationStatus;
    // If a verified or failed product is edited, it needs re-verification.
    if (
      newVerificationStatus === "Verified" ||
      newVerificationStatus === "Failed"
    ) {
      newVerificationStatus = undefined;
    }

    const updatedProduct: Product = {
      ...existingProduct,
      ...data,
      ...aiResult,
      blockchainProof,
      updatedAt: nowISO,
      lastUpdated: now.toISOString().split("T")[0],
      verificationStatus: newVerificationStatus,
      complianceSummary:
        newVerificationStatus === undefined
          ? undefined
          : existingProduct.complianceSummary,
    };
    mockProducts = mockProducts.map((p) => (p.id === data.id ? updatedProduct : p));
    revalidatePath("/dashboard");
    return updatedProduct;
  } else {
    // Create new product
    const newProduct: Product = {
      ...data,
      ...aiResult,
      blockchainProof,
      id: `pp-mock-${Date.now()}`,
      createdAt: nowISO,
      updatedAt: nowISO,
      lastUpdated: now.toISOString().split("T")[0],
      endOfLifeStatus: "Active" as const,
    };
    mockProducts.unshift(newProduct);

    // Fire 'product.created' event
    await logAuditEvent(
      "product.created",
      newProduct.id,
      { productName: newProduct.productName },
      "user-supplier", // Mock user
    );

    revalidatePath("/dashboard");
    return newProduct;
  }
}

export async function deleteProduct(id: string): Promise<{ success: boolean }> {
  mockProducts = mockProducts.filter((p) => p.id !== id);
  revalidatePath("/dashboard");
  return { success: true };
}

export async function submitForReview(productId: string): Promise<Product> {
  const productIndex = mockProducts.findIndex((p) => p.id === productId);
  if (productIndex === -1) {
    throw new Error("Product not found");
  }

  const product = mockProducts[productIndex];

  const compliancePath = compliancePaths.find(
    (path) => path.category === product.category,
  );

  let complianceSummary = "Compliance check passed.";
  let isCompliant = true;

  if (compliancePath) {
    try {
      const result = await summarizeComplianceGaps({
        productName: product.productName,
        productInformation: product.currentInformation,
        compliancePathName: compliancePath.name,
        complianceRules: JSON.stringify(compliancePath.rules),
      });
      complianceSummary = result.complianceSummary;
      isCompliant = result.isCompliant;
    } catch (e) {
      console.error("AI compliance check failed during submission:", e);
      complianceSummary = "AI check failed. Manual review required.";
      isCompliant = false; // Treat AI failure as a compliance failure
    }
  } else {
    complianceSummary = `No compliance path found for category: ${product.category}. Manual review required.`;
    isCompliant = false;
  }

  const now = new Date();
  const updatedProduct: Product = {
    ...product,
    verificationStatus: "Pending",
    lastVerificationDate: now.toISOString(),
    complianceSummary: complianceSummary,
    updatedAt: now.toISOString(),
  };

  mockProducts[productIndex] = updatedProduct;

  await logAuditEvent(
    "passport.submitted",
    productId,
    { summary: complianceSummary, isCompliant },
    "user-supplier", // Mock user
  );

  revalidatePath("/dashboard");
  return updatedProduct;
}

export async function runSuggestImprovements(
  data: SuggestImprovementsInput,
): Promise<string> {
  try {
    const result = await suggestImprovements(data);
    return result.suggestedInformation;
  } catch (error) {
    console.error("AI Suggestion Error:", error);
    return "There was an error getting suggestions. Please try again.";
  }
}

export async function recalculateScore(productId: string): Promise<Product> {
  const productIndex = mockProducts.findIndex((p) => p.id === productId);
  if (productIndex === -1) {
    throw new Error("Product not found");
  }
  const product = mockProducts[productIndex];

  let aiResult = {};
  try {
    const aiInput = {
      productName: product.productName,
      productDescription: product.productDescription,
      category: product.category,
      currentInformation: product.currentInformation,
    };
    aiResult = await calculateSustainability(aiInput);
  } catch (e) {
    console.error("AI sustainability re-calculation failed:", e);
    // We can decide to throw or return the product as-is
    throw new Error("Failed to recalculate sustainability score.");
  }

  const updatedProduct: Product = {
    ...product,
    ...aiResult,
    updatedAt: new Date().toISOString(),
  };

  mockProducts[productIndex] = updatedProduct;

  await logAuditEvent(
    "product.recalculate_score",
    productId,
    { newScore: updatedProduct.sustainabilityScore },
    "user-supplier", // Mock user
  );

  revalidatePath("/dashboard");
  return updatedProduct;
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
