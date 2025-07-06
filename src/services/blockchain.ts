// src/services/blockchain.ts
"use server";

import { createHash } from "crypto";
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

// --- HASHING ---

/**
 * Creates a deterministic SHA-256 hash of an object.
 * In a real-world scenario, this would involve a proper JSON-LD
 * canonicalization algorithm (e.g., RDF Dataset Canonicalization) to ensure
 * the hash is based on the semantic graph, not the specific JSON formatting.
 * For this mock, we'll stringify with sorted keys.
 *
 * @param data The object to hash.
 * @returns A SHA-256 hash of the key product data.
 */
export async function hashData(data: object): Promise<string> {
  // A simple but effective way to make the stringify deterministic
  const stableStringify = (obj: any): string => {
    if (obj === null) return 'null';
    if (typeof obj !== 'object') return JSON.stringify(obj);
    if (Array.isArray(obj)) {
      return `[${obj.map(stableStringify).join(',')}]`;
    }
    const keys = Object.keys(obj).sort();
    const kvPairs = keys.map(key => `${JSON.stringify(key)}:${stableStringify(obj[key])}`);
    return `{${kvPairs.join(',')}}`;
  };

  const dataString = stableStringify(data);
  return createHash("sha256").update(dataString).digest("hex");
}

// --- BLOCKCHAIN INTEGRATION (VIEM) ---

const rpcUrl = process.env.POLYGON_AMOY_RPC_URL;
const privateKey = process.env.WALLET_PRIVATE_KEY as Hex | undefined;
const contractAddress = process.env.SMART_CONTRACT_ADDRESS as
  | Address
  | undefined;

// A simple ABI for a mock contract that registers a Merkle root.
// In a real project, this would be imported from your contract artifacts.
const contractAbi = [
  {
    type: "function",
    name: "anchorMerkleRoot",
    inputs: [{ name: "merkleRoot", type: "bytes32", internalType: "bytes32" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const;

/**
 * Anchors a data hash (representing a Merkle root) to the Polygon Amoy testnet.
 *
 * @param hash The hash (Merkle root) to be anchored on the blockchain.
 * @returns A promise that resolves to an object with the transaction hash and a link to a block explorer.
 */
export async function anchorToPolygon(
  hash: string,
): Promise<Omit<BlockchainProof, 'type' | 'merkleRoot' | 'proof'>> {
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

    console.log(`Anchoring root hash ${hash} to Polygon Amoy...`);
    console.log(`Using wallet: ${account.address}`);
    console.log(`Contract: ${contractAddress}`);

    const dataHashBytes32 = ("0x" + hash) as Hex;

    const { request } = await client.simulateContract({
      address: contractAddress,
      abi: contractAbi,
      functionName: "anchorMerkleRoot",
      args: [dataHashBytes32],
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
