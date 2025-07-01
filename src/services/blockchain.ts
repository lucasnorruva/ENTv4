
"use server";

import { createHash } from "crypto";
import type { Product } from "@/types";
import {
  createWalletClient,
  http,
  publicActions,
  Hex,
  Address,
  keccak256,
  stringToHex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { polygonAmoy } from "viem/chains";

// --- HASHING ---

/**
 * Creates a deterministic SHA-256 hash of a product's core passport data.
 * This function only hashes data that is deterministic and user-controlled,
 * excluding AI-generated or system-updated fields.
 *
 * @param product The product object to hash.
 * @returns A SHA-256 hash of the key product data.
 */
export async function hashProductData(product: Product): Promise<string> {
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

// --- BLOCKCHAIN INTEGRATION (VIEM) ---

const rpcUrl = process.env.POLYGON_AMOY_RPC_URL;
const privateKey = process.env.WALLET_PRIVATE_KEY as Hex | undefined;
const contractAddress = process.env.SMART_CONTRACT_ADDRESS as
  | Address
  | undefined;

// A simple ABI for our mock contract's `registerPassport` function.
// In a real project, this would be imported from your contract artifacts.
const contractAbi = [
  {
    type: "function",
    name: "registerPassport",
    inputs: [
      { name: "productId", type: "bytes32", internalType: "bytes32" },
      { name: "dataHash", type: "bytes32", internalType: "bytes32" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const;

/**
 * Anchors a data hash to the Polygon Amoy testnet for immutability.
 * This function uses `viem` to interact with a smart contract.
 *
 * @param productId The ID of the product being anchored.
 * @param hash The hash to be anchored on the blockchain.
 * @returns A promise that resolves to an object with the transaction hash and a link to a block explorer.
 */
export async function anchorToPolygon(
  productId: string,
  hash: string,
): Promise<{ txHash: string; explorerUrl: string; blockHeight: number }> {
  // 1. Validate environment variables
  if (!rpcUrl || !privateKey || !contractAddress) {
    console.warn(
      "Blockchain environment variables (POLYGON_AMOY_RPC_URL, WALLET_PRIVATE_KEY, SMART_CONTRACT_ADDRESS) are not set. Returning mock data.",
    );
    // Fallback to mock data if env vars are missing
    return {
      txHash:
        "0xMOCK_TX_HASH_ENV_VAR_MISSING_" + Math.random().toString(36).substring(2),
      explorerUrl: "https://www.oklink.com/amoy/tx/mock",
      blockHeight: 0,
    };
  }

  try {
    // 2. Setup Viem client and account
    const account = privateKeyToAccount(privateKey);
    const client = createWalletClient({
      account,
      chain: polygonAmoy,
      transport: http(rpcUrl),
    }).extend(publicActions);

    console.log(`Anchoring hash for product ${productId} to Polygon Amoy...`);
    console.log(`Using wallet: ${account.address}`);
    console.log(`Contract: ${contractAddress}`);

    // Convert string IDs and hashes to bytes32 format for the contract
    const productIdBytes32 = keccak256(stringToHex(productId));
    const dataHashBytes32 = ("0x" + hash) as Hex;

    // 3. Simulate the contract write call to get gas estimates, etc.
    const { request } = await client.simulateContract({
      address: contractAddress,
      abi: contractAbi,
      functionName: "registerPassport",
      args: [productIdBytes32, dataHashBytes32],
      account,
    });

    // 4. Send the transaction
    const txHash = await client.writeContract(request);
    console.log(`Transaction sent. Hash: ${txHash}`);

    // 5. Wait for the transaction to be mined and get the receipt
    const transactionReceipt = await client.waitForTransactionReceipt({
      hash: txHash,
    });
    console.log(
      `Transaction confirmed in block: ${transactionReceipt.blockNumber}`,
    );

    return {
      txHash,
      explorerUrl: `${polygonAmoy.blockExplorers.default.url}/tx/${txHash}`,
      blockHeight: Number(transactionReceipt.blockNumber),
    };
  } catch (error: any) {
    console.error("❌ Failed to anchor hash to Polygon:", error.message);
    // In case of a real error, we might want to throw or handle it gracefully
    // For now, we'll return a mock error hash to avoid breaking the flow.
    return {
      txHash:
        "0xMOCK_TX_HASH_ERROR_OCCURRED_" + Math.random().toString(36).substring(2),
      explorerUrl: "#",
      blockHeight: 0,
    };
  }
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

  // This remains a mock as EBSI integration is a separate, complex task.
  await new Promise((resolve) => setTimeout(resolve, 500));
  const mockEbsiId = `did:ebsi:z${[...Array(22)].map(() => Math.floor(Math.random() * 36).toString(36)).join("")}`;

  console.log(`Generated EBSI Credential ID: ${mockEbsiId}`);

  return mockEbsiId;
}
