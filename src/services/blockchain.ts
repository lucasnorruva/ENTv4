// src/services/blockchain.ts
"use server";

import { createHash } from 'crypto';
import type { Product, BlockchainProof } from "@/types";
import {
  createWalletClient,
  http,
  Hex,
  Address,
  publicActions,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { polygonAmoy } from "viem/chains";
import { storeOnIpfs as mockStoreOnIpfs } from "./ipfs";

// --- HASHING ---

/**
 * Creates a deterministic SHA-256 hash of a string.
 *
 * @param data The string to hash.
 * @returns A SHA-256 hash of the key product data.
 */
export async function hashData(data: string): Promise<string> {
  return createHash("sha256").update(data).digest("hex");
}

// --- IPFS (MOCK) ---
/**
 * Simulates storing a file on IPFS and returns its CID.
 * @param file The file to store.
 * @returns A promise that resolves to the mock CID (which is the file's hash).
 */
export async function storeOnIpfs(file: File): Promise<string> {
  // In a real app, you'd upload the file buffer to an IPFS node.
  // For this mock, we just hash the content to get a CID.
  return mockStoreOnIpfs(file);
}


// --- BLOCKCHAIN INTEGRATION (VIEM) ---

const rpcUrl = process.env.POLYGON_AMOY_RPC_URL;
const privateKey = process.env.WALLET_PRIVATE_KEY as Hex | undefined;
const contractAddress = process.env.SMART_CONTRACT_ADDRESS as
  | Address
  | undefined;

// A simple ABI for a mock contract that registers a hash.
// In a real project, this would be imported from your contract artifacts.
const contractAbi = [
  {
    type: "function",
    name: "registerPassport",
    inputs: [
        { name: "_productId", type: "bytes32", internalType: "bytes32" },
        { name: "_dataHash", type: "bytes32", internalType: "bytes32" }
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const;

/**
 * Anchors a data hash to the Polygon Amoy testnet.
 *
 * @param hash The hash to be anchored on the blockchain.
 * @returns A promise that resolves to an object with the transaction hash and a link to a block explorer.
 */
export async function anchorToPolygon(
  hash: string,
): Promise<Omit<BlockchainProof, 'type' | 'chain' | 'merkleRoot' | 'proof'>> {
  if (!rpcUrl || !privateKey || !contractAddress) {
    console.warn(
      "Blockchain environment variables (POLYGON_AMOY_RPC_URL, WALLET_PRIVATE_KEY, SMART_CONTRACT_ADDRESS) are not set. Returning mock data.",
    );
    return {
      txHash:
        "0xMOCK_TX_HASH_ENV_VAR_MISSING_" + Math.random().toString(36).substring(2),
      explorerUrl: "https://www.oklink.com/amoy/tx/mock",
      blockHeight: 0,
    };
  }

  try {
    const account = privateKeyToAccount(privateKey);
    const client = createWalletClient({
      account,
      chain: polygonAmoy,
      transport: http(rpcUrl),
    }).extend(publicActions);

    console.log(`Anchoring hash ${hash} to Polygon Amoy...`);
    console.log(`Using wallet: ${account.address}`);
    console.log(`Contract: ${contractAddress}`);

    // For a real contract, you might pass a product ID as well
    const productIdBytes32 = ("0x" + "0".repeat(64)) as Hex; // Mock product ID
    const dataHashBytes32 = ("0x" + hash) as Hex;

    const { request } = await client.simulateContract({
      address: contractAddress,
      abi: contractAbi,
      functionName: "registerPassport",
      args: [productIdBytes32, dataHashBytes32],
      account,
    });

    const txHash = await client.writeContract(request);
    console.log(`Transaction sent. Hash: ${txHash}`);

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
    return {
      txHash:
        "0xMOCK_TX_HASH_ERROR_OCCURRED_" + Math.random().toString(36).substring(2),
      explorerUrl: "#",
      blockHeight: 0,
    };
  }
}
