// src/services/credential.ts
"use server";

import type { Product, User } from '@/types';
import { hashProductData } from './blockchain';
import { createWalletClient, http, Hex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { mainnet } from 'viem/chains';

const ISSUER_DID = 'did:web:norruva.com';
const SIGNING_KEY = (process.env.WALLET_PRIVATE_KEY ||
  '0x' + 'a'.repeat(64)) as Hex;

const account = privateKeyToAccount(SIGNING_KEY);

/**
 * Creates a W3C Verifiable Credential for a given product.
 *
 * @param product The product data to include in the credential.
 * @param user The user issuing the credential.
 * @returns A signed Verifiable Credential object.
 */
export async function createVerifiableCredential(
  product: Product,
  user: User,
) {
  const issuanceDate = new Date().toISOString();
  const dataHash = await hashProductData(product);

  const credentialSubject = {
    id: `did:dpp:product:${product.id}`,
    type: "Product",
    productName: product.productName,
    gtin: product.gtin,
    category: product.category,
    manufacturer: product.supplier,
    dataHash: dataHash,
    materials: product.materials,
    manufacturing: product.manufacturing,
    compliance: product.compliance,
  };

  const credentialPayload = {
    '@context': [
      'https://www.w3.org/2018/credentials/v1',
      'https://schema.org', // Use schema.org for product-related terms
      'https://w3id.org/dpp/v1', // Fictional DPP context
    ],
    id: `urn:uuid:${crypto.randomUUID()}`,
    type: ['VerifiableCredential', 'DigitalProductPassport'],
    issuer: {
        id: ISSUER_DID,
        name: "Norruva Platform",
    },
    issuanceDate: issuanceDate,
    credentialSubject,
  };

  // For this mock, we'll sign the stringified payload.
  // A real implementation would use a more robust signing mechanism like JWS.
  const signature = await account.signMessage({
    message: JSON.stringify(credentialPayload),
  });

  const vc = {
    ...credentialPayload,
    proof: {
      type: 'EcdsaSecp256k1Signature2019', // Example type
      created: issuanceDate,
      proofPurpose: 'assertionMethod',
      verificationMethod: `${ISSUER_DID}#keys-1`,
      jws: signature, // Using jws for clarity as per some specs
    },
  };

  console.log(`Generated Verifiable Credential for product ${product.id}`);
  return vc;
}
