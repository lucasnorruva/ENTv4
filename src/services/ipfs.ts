// src/services/ipfs.ts
'use server';

import { createHash } from 'crypto';

/**
 * Simulates storing a file on IPFS and returns its Content-Addressable Identifier (CID).
 * In a real-world scenario, this would involve uploading the file buffer to an IPFS node
 * and receiving the actual CID back. For this mock, we simply compute the SHA-256 hash
 * of the file content, as a CID is fundamentally a hash of the content.
 *
 * @param file The file to be "uploaded" to IPFS.
 * @returns A promise that resolves to the SHA-256 hash of the file, representing its mock CID.
 */
export async function storeOnIpfs(file: File): Promise<string> {
  const fileBuffer = await file.arrayBuffer();
  const hash = createHash('sha256').update(Buffer.from(fileBuffer)).digest('hex');
  console.log(`Mock IPFS: Stored file ${file.name}, CID (hash): ${hash}`);
  return hash;
}
