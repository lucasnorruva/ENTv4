"use server";

import { revalidatePath } from "next/cache";
import { products as mockProducts } from "./data";
import { compliancePaths as mockCompliancePaths } from "./compliance-data";
import type { Product, CompliancePath, AuditLog } from "@/types";
import {
  enhancePassportInformation,
  type EnhancePassportInformationInput,
} from "@/ai/flows/enhance-passport-information";
import { calculateSustainability } from "@/ai/flows/calculate-sustainability";
import { db } from "./firebase";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  addDoc,
  deleteDoc,
  query,
  orderBy,
  writeBatch,
  getDoc,
} from "firebase/firestore";
import { Collections } from "./constants";
import { anchorToPolygon, hashProductData } from "@/services/blockchain";

const productsCollection = collection(db, Collections.PRODUCTS);
const compliancePathsCollection = collection(db, Collections.COMPLIANCE_PATHS);
const auditLogsCollection = collection(db, Collections.AUDIT_LOGS);

async function seedDatabase() {
  const productsSnapshot = await getDocs(productsCollection);
  const batch = writeBatch(db);

  if (productsSnapshot.empty) {
    console.log("Seeding products...");
    mockProducts.forEach((product) => {
      const docRef = doc(productsCollection, product.id);
      const { id, ...productData } = product;
      batch.set(docRef, productData);
    });
  }

  const compliancePathsSnapshot = await getDocs(compliancePathsCollection);
  if (compliancePathsSnapshot.empty) {
    console.log("Seeding compliance paths...");
    mockCompliancePaths.forEach((cp, index) => {
      const docRef = doc(
        compliancePathsCollection,
        `cp-${String(index + 1).padStart(3, "0")}`,
      );
      batch.set(docRef, cp);
    });
  }

  await batch.commit();
}

export async function getProducts(): Promise<Product[]> {
  await seedDatabase();

  const q = query(productsCollection, orderBy("updatedAt", "desc"));
  const productsSnapshot = await getDocs(q);
  const products: Product[] = [];
  productsSnapshot.forEach((doc) => {
    products.push({ id: doc.id, ...doc.data() } as Product);
  });
  return products;
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

  // --- Blockchain Anchoring Step ---
  // Hash the deterministic product data *before* AI enrichment.
  const productDataHash = await hashProductData(data.currentInformation);
  const blockchainProof = await anchorToPolygon(productDataHash);

  const aiInput = {
    productName: data.productName,
    productDescription: data.productDescription,
    category: data.category,
    currentInformation: data.currentInformation,
  };

  let aiResult = {};
  try {
    aiResult = await calculateSustainability(aiInput);
  } catch (aiError) {
    console.error(
      `AI sustainability calculation failed for product ${data.id || "new"}:`,
      aiError,
    );
    // Continue without AI data if the call fails
  }

  if (data.id) {
    // Update existing product
    const productRef = doc(db, Collections.PRODUCTS, data.id);
    const { id, ...saveData } = data;
    const updatedData = {
      ...saveData,
      ...aiResult,
      blockchainProof,
      updatedAt: nowISO,
      lastUpdated: now.toISOString().split("T")[0],
      verificationStatus: "Pending" as const,
      lastVerificationDate: nowISO,
    };
    await setDoc(productRef, updatedData, { merge: true });
    revalidatePath("/dashboard");
    const docSnap = await getDoc(productRef);
    return { id: docSnap.id, ...docSnap.data() } as Product;
  } else {
    // Create new product
    const newProductData = {
      ...data,
      ...aiResult,
      blockchainProof,
      createdAt: nowISO,
      updatedAt: nowISO,
      lastUpdated: now.toISOString().split("T")[0],
      verificationStatus: "Pending" as const,
      endOfLifeStatus: "Active" as const,
    };
    const docRef = await addDoc(
      collection(db, Collections.PRODUCTS),
      newProductData,
    );
    revalidatePath("/dashboard");
    return { ...newProductData, id: docRef.id };
  }
}

export async function deleteProduct(id: string): Promise<{ success: boolean }> {
  const productRef = doc(db, Collections.PRODUCTS, id);
  await deleteDoc(productRef);
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
  const now = new Date().toISOString();
  const auditLog: Omit<AuditLog, "id"> = {
    userId,
    action,
    entityId,
    details,
    createdAt: now,
    updatedAt: now,
  };
  await addDoc(auditLogsCollection, auditLog);
}
