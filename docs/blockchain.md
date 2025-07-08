# Digital Product Passport – Advanced Architecture and Strategy

## Advanced Cryptographic Infrastructure
To ensure both compliance and privacy, the DPP should use cutting-edge cryptography. Zero-knowledge proofs (ZKPs) can prove statements (e.g. "material X ≥ Y% recycled") without revealing sensitive data. For instance, zk-SNARK or zk-STARK circuits can encode certified attributes (origin, composition) so verifiers learn only “true/false,” not the underlying details.

### Zero-Knowledge Compliance
Implement ZK-SNARK/STARK protocols so a manufacturer can attest to regulatory facts (e.g., “substance levels below legal limits”) without exposing full supplier lists. The choice between SNARKs (e.g., Groth16, which needs a trusted setup) and STARKs (which are transparent) depends on performance and auditability requirements.

### Zero-Knowledge Proof Developer Stack
- **Circom**: A low-level DSL for writing R1CS circuits, offering high performance. It's widely used but requires manual handling of constraints.
- **ZoKrates**: A high-level Rust-based toolbox for zk-SNARKs aimed at Ethereum, simplifying development and integration with Solidity.
- **SnarkyJS (o1js)**: A TypeScript library from the Mina Protocol team, enabling ZK programs in JS/TS, ideal for full-stack ZK apps.
- **Noir**: A Rust-inspired ZKP language focused on usability, compiling to an IR that can target multiple backends (e.g., PLONK).

For a real-world circuit (e.g., proving RoHS compliance), one would encode threshold checks on chemical composition. The circuit would take hashed material data as private inputs and enforce that each banned substance's value is below the regulatory limit, emitting a proof without revealing the raw values.

## Smart Contract Architecture and Anchoring Models

### Anchor Aggregation with Merkle Trees and ZK Proofs
The platform’s smart contracts will minimize on-chain operations by aggregating credential anchors. The primary method is **Merkle tree batching**: hash each credential into a Merkle tree and publish only the root on-chain. This drastically reduces gas costs. A holder can then provide an off-chain Merkle inclusion proof to a verifier.

Additionally, zero-knowledge proofs (ZKPs) can be combined with this. An issuer can prove a product meets certain standards (e.g., contains < X% of a restricted substance) via a ZKP, and this "proof-of-compliance" itself can be what's included in the Merkle tree. The smart contract would only need to verify the Merkle root, ensuring privacy and scalability.

### Gas Optimization in Credential Workflows
Every on-chain interaction must be optimized for cost. We will use batched operations and compact data structures. For instance, instead of writing a new state for each credential update, the contract could store only a reference to a rolling Merkle root or use event logs for off-chain aggregation. Techniques like stateless proofs (where the chain stores a constant root and clients prove changes off-chain) help minimize gas.

### Cross-Chain Validation and Modular Contracts
The DPP smart contracts will be blockchain-agnostic, enabling deployment on both EVM chains (Ethereum, Polygon, EBSI) and non-EVM ledgers. A modular architecture is used: a core library of credential logic is separated from chain-specific adapters. A product's Decentralized Identifier (DID) Document can contain multiple service endpoints or blockchain proofs, allowing verification on any supported chain.

## Verifier and Credential Issuer Onboarding

### Becoming an EBSI-Compliant Issuer/Verifier
Onboarding as a trusted issuer or verifier in the European Blockchain Services Infrastructure (EBSI) ecosystem requires establishing a legal entity DID (e.g., `did:ebsi`), obtaining a Verifiable Authorisation to Onboard, and getting listed in the Trusted Issuers Registry (TIR) on the blockchain. Our platform simulates this by allowing an administrator to mark a company as a "Trusted Issuer" in the **Blockchain Management** dashboard. This status is visually represented on the DPP, providing a clear signal of trust to consumers and partners.

### TSP Integration and Qualified Signatures (eIDAS Compliance)
To align with EU regulations, DPP credentials will be signed with high-assurance keys from Trust Service Providers (TSPs). This typically involves obtaining a Qualified Electronic Seal (QSeal) certificate under the eIDAS regulation. The DPP platform will integrate with remote signing services so that each Verifiable Credential is backed by a qualified seal, giving it legal weight across the EU.

### Role of EUDI Wallets and OIDC4VC in Distribution
The platform will interoperate with the upcoming European Digital Identity (EUDI) Wallet for credential distribution using the OpenID Connect for Verifiable Credentials (OIDC4VC) protocols. A user can scan a product's QR code to receive the DPP credential directly into their wallet. For verification, the holder's wallet can generate a Verifiable Presentation (VP) in response to a request from a verifier's app, ensuring user consent and control.

## JSON-LD Schema Versioning & Credential Revocation

### Evolving JSON-LD Schemas with Backward Compatibility
As DPP schemas evolve, we will use versioned JSON-LD contexts (e.g., `dpp-schema-v2.jsonld`) to maintain backward compatibility. We will leverage JSON-LD 1.1 features like `@version` and `@protected` to manage changes safely. Core terms will be protected to prevent redefinition, and older context URLs will remain stable and accessible.

### Credential Revocation and VC Status Architecture
The platform supports multiple revocation strategies. Our primary implementation uses the **W3C Status List 2021**, a simple and interoperable method using a bitstring to indicate revoked credentials.
-   Each Verifiable Credential (VC) generated by the platform includes a `credentialStatus` field.
-   This field points to a URL (`revocationListUrl`) which is managed by the issuing company. Administrators can set this URL for each company in the **Blockchain Management** dashboard.
-   This URL hosts a status list credential (e.g., `status.jsonld`), which verifiers can check to see if a specific VC has been revoked.

This architecture is flexible enough to accommodate other methods like cryptographic accumulators in the future, based on issuer requirements.
