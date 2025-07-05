// src/services/credential.ts
'use server';

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
    productName: product.productName,
    gtin: product.gtin,
    category: product.category,
    dataHash: dataHash,
  };

  const credentialPayload = {
    '@context': [
      'https://www.w3.org/2018/credentials/v1',
      'https://digitalproductpass.com/credentials/v1',
    ],
    id: `urn:uuid:${crypto.randomUUID()}`,
    type: ['VerifiableCredential', 'DigitalProductPassport'],
    issuer: ISSUER_DID,
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
      signatureValue: signature,
    },
  };

  console.log(`Generated Verifiable Credential for product ${product.id}`);
  return vc;
}
