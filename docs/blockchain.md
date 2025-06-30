# Smart Contract Deployment and Blockchain Anchoring

We anchor product integrity on the blockchain by storing cryptographic hashes of the product data. This provides a tamper-proof, time-stamped record of the product's state at any given point.

## Core Anchoring Strategy

The simplest method is to store a product's data hash on an EVM-compatible chain like Polygon PoS. The low transaction costs and fast finality make it ideal. A backend service, like a Firebase Cloud Function, is triggered when a passport is finalized. It serializes the product metadata (e.g., as JSON-LD), computes its `keccak256` hash, and calls a smart contract function to record it.

### Smart Contract Example: ProductRegistry

Below is a sample Solidity contract that records a product’s hash and emits an event.

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

This approach provides a solid foundation for data integrity verification.

## Advanced Concepts & EU Alignment

For deeper integration and alignment with EU frameworks like EBSI, we employ more advanced strategies including Verifiable Credentials (VCs), Decentralized Identifiers (DIDs), and NFTs.

### Cross-chain compatibility
To maximize flexibility, our smart contracts are deployable on multiple EVM-compatible networks (e.g., Polygon, Optimism, Base) and specialized chains like EBSI’s permissioned ledger. This ledger-agnostic trust model ensures that any chosen DLT can serve as a “trust registry” under EU regulations. For example, we can use EBSI nodes to issue and verify VCs while the corresponding product "digital twin" (as an NFT) resides on a public chain like Polygon.

### Solidity contract examples for VCs
A more advanced pattern uses issuer/verifier contracts for W3C Verifiable Credentials.

**Issuer Contract:**
```solidity
contract VCIssuer {
    mapping(address => bool) public issuers;
    mapping(address => mapping(string => string)) public creds;  // holder → (key → value)
    event Issued(address indexed issuer, address indexed holder, string key, string value);

    constructor() { issuers[msg.sender] = true; }
    modifier onlyIssuer() { require(issuers[msg.sender]); _; }

    function addIssuer(address newIssuer) external onlyIssuer {
        issuers[newIssuer] = true;
    }
    function issueCred(address holder, string calldata key, string calldata value) external onlyIssuer {
        creds[holder][key] = value;
        emit Issued(msg.sender, holder, key, value);
    }
}
```

**Verifier Contract:**
```solidity
contract VCVerifier {
    mapping(address => bool) public verifiers;
    event Verified(address indexed verifier, address indexed subject, string key, string value);

    constructor() { verifiers[msg.sender] = true; }
    modifier onlyVerifier() { require(verifiers[msg.sender]); _; }

    function addVerifier(address v) external onlyVerifier {
        verifiers[v] = true;
    }
    function verifyCred(address subject, string calldata key, string calldata expected) external onlyVerifier {
        // Note: This requires a way to reference the VCIssuerContract instance
        // string memory actual = VCIssuerContract(issuerAddress).creds(subject, key);
        // require(keccak256(bytes(actual)) == keccak256(bytes(expected)), "Verification failed");
        // emit Verified(msg.sender, subject, key, actual);
    }
}
```

### NFT/DID architecture
Each physical product can be represented by a unique NFT (ERC-721/1155) serving as its “digital twin.” The NFT metadata links to the DPP data, which is structured as a Verifiable Credential. The product’s globally unique identifier is a Decentralized Identifier (e.g., `did:web`, `did:ebsi`), linking the on-chain asset (NFT) to its off-chain data (VC).

### Verifiable Credential workflows
All DPPs are implemented as W3C Verifiable Credentials. The manufacturer (issuer) creates a JSON-LD credential, signs it with their private key, and makes it resolvable via the product's DID. This aligns with EU Digital Identity Wallet standards and ensures interoperability.

# Compliance Document Structuring

## JSON-LD and Semantic Web compliance
To maximize interoperability, all product passports are structured in JSON-LD (JSON for Linked Data). This allows every data point (e.g., a chemical ID) to be tied to a global, semantic definition (like a GS1 or UNECE vocabulary), making the data machine-readable and verifiable.

## Regulatory alignment (REACH, RoHS, ESPR, etc.)
The DPP schema is designed to directly map to the data requirements of major EU regulations. Fields for RoHS hazardous substances, REACH SVHCs, and ESPR-mandated data are all first-class citizens in the JSON-LD structure. This allows for automated compliance checking against regulatory thresholds.

## Credential signing workflow
Each DPP document is cryptographically signed to prevent tampering. We use JSON-LD Proofs, which are compatible with the EU's trust framework (e.g., eIDAS). In our system, an “EU-verifier” node, conforming to EBSI rules, can sign the final composite DPP as a Verifiable Credential and anchor its hash on the EBSI ledger. This provides a high degree of trust and legal non-repudiation.
