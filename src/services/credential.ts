// src/services/credential.ts
"use server";

import type { Product, User } from '@/types';
import { hashData } from './blockchain';
import { createWalletClient, http, Hex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { mainnet } from 'viem/chains';

const ISSUER_DID = 'did:web:norruva.com';
const SIGNING_KEY = (process.env.WALLET_PRIVATE_KEY ||
  '0x' + 'a'.repeat(64)) as Hex;

const account = privateKeyToAccount(SIGNING_KEY);

/**
 * Creates a W3C Verifiable Credential for a given product.
 * In a real implementation, the signing process would conform to
 * JSON-LD Signatures, which involves canonicalizing the document before hashing and signing.
 *
 * @param product The product data to include in the credential.
 * @param user The user issuing the credential (though the platform is the issuer).
 * @returns A signed Verifiable Credential object.
 */
export async function createVerifiableCredential(
  product: Product,
  user: User,
) {
  const issuanceDate = new Date().toISOString();

  // The claims being attested to in the credential.
  const credentialSubject = {
    id: `did:dpp:product:${product.id}`,
    type: "Product",
    productName: product.productName,
    gtin: product.gtin,
    category: product.category,
    manufacturer: product.supplier,
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
  // A real implementation would use a proper JWS/JSON-LD Signature library.
  // The signature is created over the hash of the canonicalized payload.
  const payloadHash = await hashData(credentialPayload);
  const signature = await account.signMessage({
    message: payloadHash,
  });

  const vc = {
    ...credentialPayload,
    proof: {
      type: 'EcdsaSecp256k1Signature2019', // Example type
      created: issuanceDate,
      proofPurpose: 'assertionMethod',
      verificationMethod: `${ISSUER_DID}#keys-1`,
      jws: signature, // JWS would typically be a structured token, but using the raw signature here.
    },
  };

  console.log(`Generated Verifiable Credential for product ${product.id}`);
  return vc;
}
