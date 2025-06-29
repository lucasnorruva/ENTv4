"use server";

import { createHash } from "crypto";

/**
 * Creates a deterministic SHA-256 hash of a product's core passport data.
 * This function only hashes data that is deterministic and user-controlled,
 * excluding AI-generated or system-updated fields.
 *
 * @param productData The stringified JSON of the product's passport information.
 * @returns A SHA-256 hash of the data.
 */
export async function hashProductData(productData: string): Promise<string> {
  return createHash("sha256").update(productData).digest("hex");
}

/**
 * Anchors a data hash to the Polygon blockchain for immutability.
 * In a real implementation, this would interact with a smart contract.
 *
 * @param hash The hash to be anchored on the blockchain.
 * @returns A promise that resolves to an object with the transaction hash and a link to a block explorer.
 */
export async function anchorToPolygon(
  hash: string,
): Promise<{ txHash: string; explorerUrl: string }> {
  console.log(`Anchoring hash ${hash} to Polygon...`);

  // In a real implementation, you would:
  // 1. Connect to a Polygon node via an RPC provider (e.g., Infura, Alchemy)
  //    using a library like `ethers.js` or `viem`.
  // 2. Load your pre-deployed smart contract instance.
  // 3. Send a transaction to a contract function like `recordHash(bytes32 hash)`.

  // Simulate network delay and return a mock transaction hash and explorer URL.
  await new Promise((resolve) => setTimeout(resolve, 700));
  const mockTxHash = `0x${[...Array(64)].map(() => Math.floor(Math.random() * 16).toString(16)).join("")}`;
  const explorerUrl = `https://polygonscan.com/tx/${mockTxHash}`; // Mock PolygonScan URL

  console.log(`Hash anchored in transaction: ${mockTxHash}`);

  return { txHash: mockTxHash, explorerUrl };
}
