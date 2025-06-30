"use server";

import { createHash } from "crypto";
import type { Product } from "@/types";

/**
 * Creates a deterministic SHA-256 hash of a product's core passport data.
 * This function only hashes data that is deterministic and user-controlled,
 * excluding AI-generated or system-updated fields.
 *
 * @param product The product object to hash.
 * @returns A SHA-256 hash of the key product data.
 */
export async function hashProductData(product: Product): Promise<string> {
  // Select only the fields that are stable and represent the core identity
  const dataToHash = {
    productName: product.productName,
    category: product.category,
    supplier: product.supplier,
    materials: product.materials,
    manufacturing: product.manufacturing,
    certifications: product.certifications,
  };
  const dataString = JSON.stringify(dataToHash);
  return createHash("sha256").update(dataString).digest("hex");
}

/**
 * Anchors a data hash to the Polygon blockchain for immutability.
 * In a real implementation, this would interact with a smart contract
 * like `registerPassport(bytes32 productId, bytes32 dataHash)`.
 *
 * @param productId The ID of the product being anchored.
 * @param hash The hash to be anchored on the blockchain.
 * @returns A promise that resolves to an object with the transaction hash and a link to a block explorer.
 */
export async function anchorToPolygon(
  productId: string,
  hash: string,
): Promise<{ txHash: string; explorerUrl: string; blockHeight: number }> {
  console.log(`Anchoring hash for product ${productId}: ${hash} to Polygon...`);

  // In a real implementation, you would:
  // 1. Connect to a Polygon node via an RPC provider (e.g., Infura, Alchemy)
  //    using a library like `ethers.js` or `viem`.
  // 2. Load your pre-deployed smart contract instance.
  // 3. Send a transaction to a contract function like `registerPassport(bytes32 productId, bytes32 hash)`.

  // Simulate network delay and return a mock transaction hash and explorer URL.
  await new Promise((resolve) => setTimeout(resolve, 700));
  const mockTxHash = `0x${[...Array(64)].map(() => Math.floor(Math.random() * 16).toString(16)).join("")}`;
  const explorerUrl = `https://polygonscan.com/tx/${mockTxHash}`; // Mock PolygonScan URL
  const blockHeight = Math.floor(Math.random() * 1000000) + 50000000; // Mock block height

  console.log(`Hash anchored in transaction: ${mockTxHash}`);

  return { txHash: mockTxHash, explorerUrl, blockHeight };
}

/**
 * Generates a mock Verifiable Credential ID on the EBSI network.
 * In a real implementation, this would involve using EBSI's APIs to issue
 * a W3C Verifiable Credential containing the product data hash.
 *
 * @param productId The ID of the product for which to generate the credential.
 * @returns A promise that resolves to a mock EBSI DID string.
 */
export async function generateEbsiCredential(
  productId: string,
): Promise<string> {
  console.log(
    `Generating EBSI Verifiable Credential for product ${productId}...`,
  );

  // Simulate network delay for API call to EBSI
  await new Promise((resolve) => setTimeout(resolve, 500));
  const mockEbsiId = `did:ebsi:${[...Array(20)].map(() => Math.floor(Math.random() * 36).toString(36)).join("")}`;

  console.log(`Generated EBSI Credential ID: ${mockEbsiId}`);

  return mockEbsiId;
}
