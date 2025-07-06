// src/services/credential.ts
"use server";

import type { Product, Company } from '@/types';
import { hashData } from './blockchain';
import { privateKeyToAccount } from 'viem/accounts';
import type { Hex } from 'viem';

const ISSUER_DID = 'did:web:norruva.com';
const SIGNING_KEY = (process.env.WALLET_PRIVATE_KEY ||
  '0x' + 'a'.repeat(64)) as Hex;

const account = privateKeyToAccount(SIGNING_KEY);

/**
 * Creates a W3C Verifiable Credential for a given product.
 * This mock now includes a bbs+ cryptosuite and a credentialStatus field
 * to align with the advanced cryptographic infrastructure goals.
 *
 * @param product The product data to include in the credential.
 * @param company The company issuing the credential, used for revocation list.
 * @returns A signed Verifiable Credential object.
 */
export async function createVerifiableCredential(
  product: Product,
  company: Company,
) {
  const issuanceDate = new Date().toISOString();

  // The claims being attested to in the credential.
  const credentialSubject = {
    id: `did:dpp:product:${product.id}`,
    type: 'Product',
    name: product.productName,
    gtin: product.gtin,
    category: product.category,
    manufacturer: company.name,
    compliance: product.compliance,
    materials: product.materials,
  };

  const credentialId = `urn:uuid:${crypto.randomUUID()}`;

  const credentialPayload: any = {
    '@context': [
      'https://www.w3.org/2018/credentials/v1',
      'https://schema.org',
      'https://w3id.org/dpp/v1',
    ],
    id: credentialId,
    type: ['VerifiableCredential', 'DigitalProductPassport'],
    issuer: {
      id: ISSUER_DID,
      name: 'Norruva Platform',
    },
    issuanceDate: issuanceDate,
    credentialSubject,
  };

  // Add credentialStatus for revocation, pointing to a hypothetical status list.
  if (company.revocationListUrl) {
    credentialPayload.credentialStatus = {
      id: `${company.revocationListUrl}#${product.id}`, // Simplified index
      type: 'StatusList2021Credential',
    };
  }
  
  // For this mock, we'll sign the stringified payload.
  // A real implementation would use a proper JWS/JSON-LD Signature library.
  const payloadHash = await hashData(credentialPayload);
  const signature = await account.signMessage({
    message: payloadHash,
  });

  const vc = {
    ...credentialPayload,
    // Using a DataIntegrityProof with a BBS+ cryptosuite to signal
    // support for selective disclosure.
    proof: {
      type: 'DataIntegrityProof',
      cryptosuite: 'bbs-bls12381-sha-256',
      created: issuanceDate,
      proofPurpose: 'assertionMethod',
      verificationMethod: `${ISSUER_DID}#keys-1`,
      proofValue: signature, // In a real BBS+ proof, this would be a derived proof.
    },
  };

  console.log(`Generated Verifiable Credential for product ${product.id}`);
  return vc;
}
