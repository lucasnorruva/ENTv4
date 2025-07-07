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
 * In a real app, this would use a proper JWS/JSON-LD Signature library.
 *
 * @param product The product data to include in the credential.
 * @param company The company data to include in the credential.
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

  const credentialPayload = {
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

  // For this mock, we'll just sign the stringified payload.
  const payloadHash = await hashData(credentialPayload);
  const signature = await account.signMessage({
    message: payloadHash,
  });

  const vc = {
    ...credentialPayload,
    proof: {
      type: 'DataIntegrityProof',
      cryptosuite: 'eddsa-jcs-2022',
      created: issuanceDate,
      proofPurpose: 'assertionMethod',
      verificationMethod: `${ISSUER_DID}#keys-1`,
      proofValue: signature,
    },
  };

  console.log(`Generated Verifiable Credential for product ${product.id}`);
  return vc;
}
