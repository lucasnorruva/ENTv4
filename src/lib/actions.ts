
"use server";

import { revalidatePath } from "next/cache";
import { products as mockProductsData } from "./data";
import type { Product } from "@/types";
import {
  suggestImprovements,
  type SuggestImprovementsInput,
  type SuggestImprovementsOutput,
} from "@/ai/flows/enhance-passport-information";
import { calculateSustainability } from "@/ai/flows/calculate-sustainability";
import {
  anchorToPolygon,
  generateEbsiCredential,
  hashProductData,
} from "@/services/blockchain";
import { compliancePaths } from "./compliance-data";
import { summarizeComplianceGaps } from "@/ai/flows/summarize-compliance-gaps";

// Use an in-memory array for mock data to simulate database operations
let mockProducts = [...mockProductsData];

export async function getProducts(): Promise<Product[]> {
  // Return mock data directly to avoid Firestore permission issues in dev
  return Promise.resolve(mockProducts);
}

export async function getProductById(id: string): Promise<Product | undefined> {
  return Promise.resolve(mockProducts.find((p) => p.id === id));
}

export async function saveProduct(
  data: Omit<
    Product,
    | "id"
    | "createdAt"
    | "updatedAt"
    | "lastUpdated"
    | "esg"
    | "blockchainProof"
    | "verificationStatus"
    | "lastVerificationDate"
    | "complianceSummary"
    | "complianceGaps"
    | "endOfLifeStatus"
  > & { id?: string },
  userId: string,
): Promise<Product> {
  const now = new Date();
  const nowISO = now.toISOString();

  // Keep AI enrichment for demonstration, but handle failures
  let esgResult;
  try {
    const aiInput = {
      productName: data.productName,
      productDescription: data.productDescription,
      category: data.category,
      currentInformation: data.currentInformation,
    };
    esgResult = await calculateSustainability(aiInput);
  } catch (e) {
    console.error("AI sustainability calculation failed (mock mode):", e);
  }

  if (data.id) {
    // Update existing product
    const existingProduct = mockProducts.find((p) => p.id === data.id);
    if (!existingProduct) {
      throw new Error("Product not found");
    }

    let newVerificationStatus = existingProduct.verificationStatus;
    let newComplianceSummary = existingProduct.complianceSummary;
    let newComplianceGaps = existingProduct.complianceGaps;
    // If a verified or failed product is edited, it needs re-verification.
    if (
      newVerificationStatus === "Verified" ||
      newVerificationStatus === "Failed"
    ) {
      newVerificationStatus = undefined;
      newComplianceSummary = undefined;
      newComplianceGaps = undefined;
    }

    const updatedProduct: Product = {
      ...existingProduct,
      ...data,
      esg: esgResult,
      // Note: Blockchain proof is NOT updated here. It's updated upon verification.
      blockchainProof: existingProduct.blockchainProof,
      updatedAt: nowISO,
      lastUpdated: now.toISOString().split("T")[0],
      verificationStatus: newVerificationStatus,
      complianceSummary: newComplianceSummary,
      complianceGaps: newComplianceGaps,
    };
    mockProducts = mockProducts.map((p) =>
      p.id === data.id ? updatedProduct : p,
    );

    await logAuditEvent(
      "product.updated",
      updatedProduct.id,
      { fields: Object.keys(data) },
      userId,
    );

    revalidatePath("/dashboard");
    return updatedProduct;
  } else {
    // Create new product
    const newProduct: Product = {
      ...data,
      esg: esgResult,
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
      userId,
    );

    revalidatePath("/dashboard");
    return newProduct;
  }
}

export async function deleteProduct(
  id: string,
  userId: string,
): Promise<{ success: boolean }> {
  const productToDelete = mockProducts.find((p) => p.id === id);
  if (productToDelete) {
    await logAuditEvent(
      "product.deleted",
      id,
      { productName: productToDelete.productName },
      userId,
    );
  }
  mockProducts = mockProducts.filter((p) => p.id !== id);
  revalidatePath("/dashboard");
  return { success: true };
}

export async function submitForReview(
  productId: string,
  userId: string,
): Promise<Product> {
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
  let gaps;

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
      gaps = result.gaps;
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
    complianceGaps: gaps,
    updatedAt: now.toISOString(),
  };

  mockProducts[productIndex] = updatedProduct;

  await logAuditEvent(
    "passport.submitted",
    productId,
    { summary: complianceSummary, isCompliant },
    userId,
  );

  revalidatePath("/dashboard");
  return updatedProduct;
}

export async function approvePassport(
  productId: string,
  userId: string,
): Promise<Product> {
  const productIndex = mockProducts.findIndex((p) => p.id === productId);
  if (productIndex === -1) {
    throw new Error("Product not found");
  }

  const product = mockProducts[productIndex];
  const now = new Date();

  // Anchor to blockchain on successful verification
  let blockchainProof;
  let ebsiVcId;
  try {
    const productDataHash = await hashProductData(product.currentInformation);
    blockchainProof = await anchorToPolygon(product.id, productDataHash);
    ebsiVcId = await generateEbsiCredential(product.id);
  } catch (e) {
    console.error("Blockchain/EBSI integration failed (mock mode):", e);
    throw new Error("Blockchain anchoring failed during approval.");
  }

  const updatedProduct: Product = {
    ...product,
    verificationStatus: "Verified",
    lastVerificationDate: now.toISOString(),
    blockchainProof: blockchainProof,
    ebsiVcId: ebsiVcId,
    // Clear gaps on approval
    complianceSummary: "Product manually verified and approved by auditor.",
    complianceGaps: [],
    updatedAt: now.toISOString(),
  };

  mockProducts[productIndex] = updatedProduct;

  await logAuditEvent(
    "passport.verified",
    productId,
    { status: "Verified", blockchainProof, ebsiVcId },
    userId,
  );

  revalidatePath("/dashboard");
  return updatedProduct;
}

export async function rejectPassport(
  productId: string,
  userId: string,
): Promise<Product> {
  const productIndex = mockProducts.findIndex((p) => p.id === productId);
  if (productIndex === -1) {
    throw new Error("Product not found");
  }

  const product = mockProducts[productIndex];
  const now = new Date();

  const updatedProduct: Product = {
    ...product,
    status: "Draft", // Allow supplier to edit
    verificationStatus: undefined, // Reset verification status
    lastVerificationDate: now.toISOString(),
    // Keep compliance info for supplier to see, but add a note
    complianceSummary: `Auditor requested changes. Please address the gaps and resubmit. Original summary: ${product.complianceSummary || "N/A"}`,
    // Gaps are kept so supplier knows what to fix
    updatedAt: now.toISOString(),
  };

  mockProducts[productIndex] = updatedProduct;

  await logAuditEvent(
    "passport.rejected",
    productId,
    { reason: "Auditor requested changes" },
    userId,
  );

  revalidatePath("/dashboard");
  return updatedProduct;
}

export async function runSuggestImprovements(
  data: SuggestImprovementsInput,
): Promise<SuggestImprovementsOutput> {
  try {
    const result = await suggestImprovements(data);
    return result;
  } catch (error) {
    console.error("AI Suggestion Error:", error);
    throw new Error("Could not get suggestion from AI. Please try again.");
  }
}

export async function recalculateScore(
  productId: string,
  userId: string,
): Promise<Product> {
  const productIndex = mockProducts.findIndex((p) => p.id === productId);
  if (productIndex === -1) {
    throw new Error("Product not found");
  }
  const product = mockProducts[productIndex];

  let esgResult;
  try {
    const aiInput = {
      productName: product.productName,
      productDescription: product.productDescription,
      category: product.category,
      currentInformation: product.currentInformation,
    };
    esgResult = await calculateSustainability(aiInput);
  } catch (e) {
    console.error("AI sustainability re-calculation failed:", e);
    // We can decide to throw or return the product as-is
    throw new Error("Failed to recalculate sustainability score.");
  }

  const updatedProduct: Product = {
    ...product,
    esg: esgResult,
    updatedAt: new Date().toISOString(),
  };

  mockProducts[productIndex] = updatedProduct;

  await logAuditEvent(
    "product.recalculate_score",
    productId,
    { newScore: updatedProduct.esg?.score },
    userId,
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
