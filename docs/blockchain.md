# Blockchain Anchoring Strategy

We anchor product integrity on the Polygon PoS blockchain by storing cryptographic hashes of the product data. Below is a sample Solidity contract that records a product’s hash and emits an event. In practice you would compile and deploy this to Polygon (Mumbai testnet or mainnet) using Hardhat/Truffle or similar tools:

### Smart Contract Deployment Strategy

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ProductRegistry {
    // Mapping from product ID to the stored hash (e.g. keccak256 of product metadata)
    mapping(uint256 => bytes32) public productHash;

    // Event emitted when a product hash is anchored on-chain
    event ProductAnchored(uint256 indexed productId, bytes32 hashValue);

    // Anchor the hash of arbitrary data for a given productId
    function anchorProductHash(uint256 productId, bytes calldata data) external {
        bytes32 h = keccak256(data);
        productHash[productId] = h;
        emit ProductAnchored(productId, h);
    }
}
```

In this example, calling `anchorProductHash(123, data)` will compute `keccak256(data)` (a 256-bit hash) and store it. Solidity’s built-in `keccak256(bytes(data))` returns a `bytes32` hash ([quicknode.com](https://www.quicknode.com)). For instance, if `data` is a serialized JSON-LD blob of the product’s metadata, the hash serves as a tamper-proof fingerprint on-chain.

### Integration Architecture

Use Firebase Cloud Functions (or similar backend workers) to push hashes to the blockchain. For example, when a product record is finalized in Firestore, a Cloud Function trigger can:

1.  Serialize the product metadata (e.g. JSON-LD) into a canonical form.
2.  (Optionally GZIP-compress to reduce size, if needed.)
3.  Compute its keccak256 hash off-chain (with `ethers.js` or `web3.js`).
4.  Call the `anchorProductHash` function on Polygon via a Web3 provider (e.g. Alchemy or Infura) and a managed service account key.

This keeps private keys and transaction logic on the server. As Moralis illustrates, Firebase can act as a secure proxy/API for Web3 calls, keeping secrets on the backend ([developers.moralis.com](https://developers.moralis.com)). After transaction confirmation, the on-chain event or tx hash can be recorded back into Firestore as proof of anchoring. This way, the DPP workflow (“create product → compute hash → send tx”) is automated within the Firebase ecosystem.

### Polygon PoS

Deploy the contract on Polygon’s PoS (Layer 2) network. Polygon is EVM-compatible, so the same Solidity code and tools apply. Transactions on Polygon are low-cost and final.

### Workflow Example

A manufacturer uploads product details to the DPP. A Cloud Function triggers, computes `bytes32 hash = keccak256(GZIP(JSON-LD))` ([quicknode.com](https://www.quicknode.com)), and calls the contract. The resulting transaction ID is stored in Firestore. Auditors can later verify by re-hashing the stored payload and comparing to `productHash[id]`.

### Metadata Standard

To ensure consistent hashing, define a strict data format. We recommend using JSON-LD with a fixed `@context` for all product metadata (as in UN/CEFACT’s DPP ontology) ([uncefact.github.io](https://uncefact.github.io)). For example, always sort keys and remove whitespace before hashing. (As the UN/CEFACT DPP spec shows, the product model is expressed in JSON-LD and JSON Schema ([uncefact.github.io](https://uncefact.github.io)).) Optionally compressing (GZIP) the JSON before hashing can standardize size and reduce off-chain data size.

### EBSI/SSI Integration (Optional)

In an advanced version, each product (and stakeholder) could have a W3C Decentralized Identifier (DID). We could issue W3C Verifiable Credentials for product attributes or compliance certificates. These VCs can be anchored on EBSI’s blockchain network. For instance, a lab could issue a VC “Product 123 is RoHS-compliant” which the DPP platform stores. The European Blockchain Services Infrastructure (EBSI) provides a Verifiable Credentials Framework (W3C VC standard) for expressing trustful info on-chain ([ec.europa.eu](https://ec.europa.eu)). In practice, we might register product DIDs via an EBSI-compatible registry and push VC hashes to EBSI. This ties the DPP to the EU-wide trust layer (useful for future regulatory interoperability).

### Hash Payload Example

Suppose the product payload (in JSON-LD) is:

```json
{
  "@context": "...",
  "id": "http://example.com/products/123",
  "name": "EcoLamp",
  "materials": [{"material": "plastic", "mass": 200}, ... ],
  "certifications": ["RoHS", "REACH"]
}
```

We would serialize this (with stable field order), then do `bytes32 hash = keccak256(data)` in Solidity or Ethers.js. Solidity’s `keccak256` has the same output as the off-chain keccak. The UNCEFACT DPP spec highlights that DPP metadata and contexts are indeed in JSON-LD format ([uncefact.github.io](https://uncefact.github.io)), which makes it easy to interoperate with semantic web tools.

By anchoring the product hash on Polygon, we obtain an immutable timestamp. Any change in the off-chain data causes a different hash, so on-chain anchoring provides a proof-of-integrity. The overall architecture thus spans Firebase (for data handling, auth, and triggers), Polygon for the immutable registry, and optional SSI layers (EBSI DIDs/VCs) for extended trust. All hashing and on-chain writes follow known crypto practices ([quicknode.com](https://www.quicknode.com), [uncefact.github.io](https://uncefact.github.io)).
