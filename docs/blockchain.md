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

# Smart Contract Optimization

## Efficient On-Chain Metadata Hash Storage
Storing full product passports on-chain is prohibitively costly, so store only cryptographic hashes or Merkle roots of the off-chain data to anchor authenticity [dev.to](https://dev.to) [soliditydeveloper.com](https://soliditydeveloper.com). For example, multiple product attributes can be hashed into a single Merkle root which is saved on-chain, and individual proofs can later verify each attribute without storing them all on-chain [soliditydeveloper.com](https://soliditydeveloper.com) [soliditydeveloper.com](https://soliditydeveloper.com). Use content-addressable storage like IPFS for the detailed JSON-LD passport, and record a compact content identifier on-chain. A common pattern is to compress IPFS CIDs into one or two bytes32 slots instead of strings [medium.com](https://medium.com) [medium.com](https://medium.com). For instance, using a 64-byte multihash (e.g. blake2b-328) split across two 32-byte storage slots can significantly reduce gas and storage costs while preserving the ability to retrieve the original IPFS hash off-chain [medium.com](https://medium.com) [medium.com](https://medium.com). This approach avoids hashing the content twice and allows direct consumption of the hash in client applications [medium.com](https://medium.com) [medium.com](https://medium.com).

## Gas Usage Minimization for Credential Anchoring
To minimize gas during credential anchoring and verification, keep on-chain transactions lean by recording only what is strictly necessary (such as a hash or an event). For example, anchoring a verifiable credential might involve emitting an event with the credential’s hash instead of storing it in contract state, since writing to logs (events) can be cheaper and doesn’t permanently bloat storage. Batch operations can also amortize gas costs (e.g. anchoring multiple credentials’ hashes in one Merkle root or one transaction). When on-chain verification is required, leverage efficient cryptographic operations: use built-in precompiled contracts (for signature recoveries, hashing, etc.) and libraries like OpenZeppelin’s MerkleProof (which uses efficient assembly for hashing) [soliditydeveloper.com](https://soliditydeveloper.com). Off-chain verification is preferred whenever possible. In practice, verification proofs (like Merkle proofs or signature checks) are computed off-chain and just verified on-chain, reducing computation in Solidity [soliditydeveloper.com](https://soliditydeveloper.com). By storing a single root hash and verifying inclusion proofs, the contract only does a few keccak256 operations to confirm a product credential is valid [soliditydeveloper.com](https://soliditydeveloper.com). Additionally, choose data types and operations carefully – pack data into bytes32 or use bitmaps when possible, avoid expensive loops, and pre-compute values off-chain. Every on-chain step should be optimized for low gas, given the potentially large number of product credentials that need anchoring over time.

## Upgradability and Secure Design Practices
Digital Product Passport smart contracts must remain adaptable to evolving standards, so design for upgradability using proxy patterns. Smart contracts are immutable by default, but an upgradeable proxy architecture allows logic to be updated behind a persistent interface [docs.openzeppelin.com](https://docs.openzeppelin.com) [docs.openzeppelin.com](https://docs.openzeppelin.com). A common approach uses a thin proxy contract that delegates calls to an implementation contract which can be swapped as needed [docs.openzeppelin.com](https://docs.openzeppelin.com) [docs.openzeppelin.com](https://docs.openzeppelin.com). This proxy holds the state, while the implementation (business logic) can be upgraded under controlled conditions. Use OpenZeppelin’s Transparent or UUPS Proxy libraries for a battle-tested implementation of this pattern, and follow their guidelines (e.g. using an initializer function instead of constructor, and reserving storage slots for future use) for safe upgrades. Security is paramount – each contract update should undergo rigorous audits and testing. Leverage OpenZeppelin Contracts for standard functionality to reduce risk (e.g. use SafeMath, ERC standards implementations, etc. that are already audited). Integrate static analysis tools like Slither into the development pipeline; Slither can automatically detect common vulnerabilities (reentrancy, uninitialized storage, etc.) and even suggest gas optimizations [medium.com](https://medium.com) [medium.com](https://medium.com). It’s recommended to run Slither (and similar analyzers) regularly, and address all issues it flags before seeking an external audit [medium.com](https://medium.com) [medium.com](https://medium.com). Finally, perform manual code reviews and consider bug bounty programs. Upgradability must be paired with strong governance – use multi-signature wallets or timelocks for upgrade actions to prevent unauthorized or rushed upgrades. All these practices ensure the on-chain components of the DPP platform are efficient, secure, and maintainable over the long term.

# EBSI/SSI Node Deployment & Verifier Onboarding

## Becoming a Trusted Credential Issuer in EBSI
Joining the European Blockchain Services Infrastructure (EBSI) ecosystem as a credential issuer (Trusted Issuer) involves a multi-step onboarding process. First, an organization needs to set up an organization digital wallet that is EBSI-compliant, with the capability to issue and manage credentials [hub.ebsi.eu](https://hub.ebsi.eu). In this step, the org generates a Decentralized Identifier (DID) – using the EBSI DID method for legal entities (did:ebsi) – and produces a DID document containing the required public keys (notably an ES256K key as mandated by EBSI) [hub.ebsi.eu](https://hub.ebsi.eu). Next, the organization must obtain a Verifiable Authorisation to Onboard from a relevant Trust Accreditation Organization (TAO) or Root TAO [hub.ebsi.eu](https://hub.ebsi.eu) [hub.ebsi.eu](https://hub.ebsi.eu). This is essentially a credential issued by the governing authority that authorizes the new issuer to register on the EBSI network. The steps include:

1.  **Pre-authorization setup**: Ensure your organization meets preliminary requirements – having the wallet and DID in place, and being accredited or approved by whatever onboarding program is in place [hub.ebsi.eu](https://hub.ebsi.eu).
2.  **Request Verifiable Authorization**: Submit a request (often through the EBSI portal or via the TAO) to get the “authorization to onboard” credential [hub.ebsi.eu](https://hub.ebsi.eu). This likely involves providing evidence of your organization’s identity and legal status to the TAO.
3.  **Register DID on EBSI**: Once the authorization is received, use it to insert your DID document into the EBSI DID Registry via the provided API (JSON-RPC call insertDidDocument) [hub.ebsi.eu](https://hub.ebsi.eu). This on-chain registration makes your DID official and discoverable on the EBSI network.
4.  **Enroll in the Trusted Issuers Registry**: After DID registration, the organization must register as a Trusted Issuer in EBSI’s Trusted Issuers Registry (TIR). This may involve obtaining an access token (tir_invite) via EBSI’s Authorization API, proving control of the DID (e.g., by signing a challenge) [hub.ebsi.eu](https://hub.ebsi.eu). Once invited, the issuer’s profile (DID, accreditation info, etc.) is added to the registry of trusted credential issuers.
5.  **Credential Issuance Setup**: The issuer can then configure its systems to issue Verifiable Credentials (VCs) under EBSI standards. This includes hosting a VC Status List service if revocable credentials are to be issued, and using EBSI-compliant schemas for the credential data. The issuer should follow EBSI’s VC data models for specific credential types (e.g., education diploma, product passport, etc.).
6.  **Sign Credentials with EBSI-compliant Signatures**: When issuing, the credential must be signed in a format acceptable to EBSI. Specifically, EU-regulation compliant signatures are required: issuers in the European Single Market must use JAdES (JSON Advanced Electronic Signature), which is an ETSI standard augmenting JWS with eIDAS-compliant properties [hub.ebsi.eu](https://hub.ebsi.eu) [hub.ebsi.eu](https://hub.ebsi.eu). The issuer’s signing keys should be backed by certificates from an eIDAS trust service. The result is a JWT-based credential (JWT-VC) with an advanced electronic seal/signature, giving legal weight and cross-border trust.

By following these steps, an organization becomes a recognized Trusted Issuer on EBSI, able to issue Digital Product Passports or other credentials that member state wallets and verifiers will trust.

## Running a Trusted Verifier Node – Infrastructure Requirements
Organizations that frequently verify credentials (e.g., compliance authorities or large industry players) may run their own EBSI node as a verifier. EBSI’s network consists of blockchain nodes that maintain the ledger of DIDs and possibly credential status registries. Hardware and network requirements for an EBSI node are non-trivial, aimed at enterprise-grade deployment. Each node needs a dedicated server or virtual machine with a minimum of about 4–8 vCPUs, 32–64 GB of RAM, and fast storage (e.g. ≥256 GB SSD for data) [hub.ebsi.eu](https://hub.ebsi.eu). For example, EBSI’s guidance suggests ~4 vCPUs and 32 GB RAM for testing environments, and 8 vCPUs with 64 GB RAM for production nodes [hub.ebsi.eu](https://hub.ebsi.eu). Disk requirements scale from ~256 GB in pilot networks up to 500 GB or more in production for ledger data [hub.ebsi.eu](https://hub.ebsi.eu). Each node must have reliable network connectivity with at least a 100 Mbps internet link and fixed public IPv4 address(es) [hub.ebsi.eu](https://hub.ebsi.eu). Low latency (<100ms) to other European nodes is expected for proper synchronization [hub.ebsi.eu](https://hub.ebsi.eu). Node operators are typically required to host the node within the EU/EEA (to comply with data jurisdiction rules) and in a secure environment (data center or cloud in Europe) [hub.ebsi.eu](https://hub.ebsi.eu) [hub.ebsi.eu](https://hub.ebsi.eu). The software stack for an EBSI node is provided as a pre-packaged virtual appliance (e.g., as VMware OVA or a QEMU image) containing the blockchain client (EBSI uses a variant of Ethereum, Hyperledger Besu) and the auxiliary services [hub.ebsi.eu](https://hub.ebsi.eu). The node images come pre-configured to join the EBSI network, exposing APIs (such as a REST/JSON API for credential verification, DID resolution, etc.) on specified endpoints. Operational requirements include maintaining a high-availability setup (especially if running a validator node). There are Service Level Agreements – validator nodes have stricter uptime and response time obligations than regular read-only nodes [ec.europa.eu](https://ec.europa.eu). Security-wise, the node should sit behind a firewall, with only necessary ports open, and implement DDoS protection [hub.ebsi.eu](https://hub.ebsi.eu) [hub.ebsi.eu](https://hub.ebsi.eu). For production usage, EBSI mandates compliance with standards like ISO 27001 for information security management by the node operator [hub.ebsi.eu](https://hub.ebsi.eu). In summary, a verifier node deployment calls for enterprise IT infrastructure: robust hardware, secure hosting, and ongoing monitoring of CPU, memory, and bandwidth to scale resources as needed [hub.ebsi.eu](https://hub.ebsi.eu). Alternatively, if an organization does not want to host an entire node, they can use the APIs of existing nodes or third-party EBSI services to perform verification – but running a node gives direct, sovereign access to the trusted ledger and can improve verification speed and trust (since you rely on your own infrastructure).

## Integration with eIDAS Trust Services and EU Wallet Requirements
To issue verifiable credentials that will be accepted by the upcoming European Digital Identity Wallet, organizations must integrate with eIDAS-qualified trust service providers. Under eIDAS, a Qualified Trust Service Provider (QTSP) can issue qualified certificates for electronic seals or signatures. A DPP issuer should procure a Qualified Electronic Seal Certificate (QSealC) or a Qualified Certificate for Electronic Signatures, which it will use to sign the credentials. By doing so, the credentials can become Qualified Electronic Attestations of Attributes (QEAA) under the EU wallet framework [ec.europa.eu](https://ec.europa.eu). QEAAs are credentials whose issuers underwent extra trust steps and whose signatures are qualified – they enjoy the same legal validity as paper documents [ec.europa.eu](https://ec.europa.eu). For instance, a Digital Product Passport signed with a qualified certificate is legally robust and can be automatically trusted by wallet apps and regulators, as its issuer’s certificate chains to the EU Trusted List of QTSPs. In practice, integration with eIDAS trust services means the DPP platform should support JAdES digital signatures (as mentioned earlier) and the management of signing keys/certificates. Issuers might use an HSM (Hardware Security Module) or a cloud signing service provided by a QTSP to produce the JAdES signatures. EBSI’s guidelines explicitly state that in the European Single Market, JAdES must be used for VC signatures to comply with the eIDAS Regulation [hub.ebsi.eu](https://hub.ebsi.eu). These JAdES signatures embed the issuer’s certificate and meet ETSI standards for advanced electronic seals [hub.ebsi.eu](https://hub.ebsi.eu). The platform should also handle certificate renewal and verification: verifiers will need to validate the signature on a credential and ensure the certificate was valid and not revoked, which involves checking against the EU Trusted List (a public list of qualified certificates). Additionally, when issuing credentials for the EU wallet, certain wallet-specific specs must be adhered to (as per the forthcoming eIDAS 2.0 and EU Digital Identity Wallet architecture). This could include aligning with the European Wallet Architecture and Reference Framework for data formats, using the proper OIDC-4-VP/VC protocols for presenting credentials, and ensuring the credential schema matches the EU’s reference schemas for that attribute type. The DPP platform should be ready to plug into national ID wallet ecosystems – for example, by providing OIDC-compliant endpoints that wallets use to retrieve or verify a credential. In summary, eIDAS integration ensures that DPP credentials are not just technically verifiable, but legally and cross-jurisdictionally recognized. This builds trust with regulators and large enterprise customers, as the credentials carry legal weight. By using qualified signatures (JAdES) and trust list verification, the platform aligns with EU wallet requirements and becomes part of the official trust ecosystem, rather than a standalone solution [hub.ebsi.eu](https://hub.ebsi.eu) [ec.europa.eu](https://ec.europa.eu).

# JSON-LD Schema Versioning & Credential Revocation

## Evolving JSON-LD Schemas with Backward Compatibility
As Digital Product Passport schemas evolve (new data fields, updated vocabularies, etc.), it’s critical to maintain backward compatibility so that older passports remain interpretable. A best practice is to version your JSON-LD contexts deliberately. For minor, additive changes, you can often update the existing context with new term definitions (JSON-LD allows adding terms without breaking older ones). For major changes, consider creating a new context URL (for example, dpp-schema-v2.jsonld) while still supporting the old one in verifiers. JSON-LD 1.1 introduced features like the @version tag and @protected to help manage context changes. Setting "@version": 1.1 in your context and marking terms as @protected prevents accidental override of important terms in extended contexts [w3c.github.io](https://w3c.github.io) [w3c.github.io](https://w3c.github.io). This means if a new context redefines a term that was marked protected, JSON-LD processors will throw an error – a useful safeguard to avoid silently altering the meaning of data. Use this to lock in critical terms (e.g., productID, manufacturer) so that any schema evolution doesn’t reinterpret them. For introducing new fields, design the schema such that unknown terms can be ignored by older software (the JSON-LD data model inherently allows ignoring undefined terms). For example, if version 1 of DPP schema has fields A, B, C and version 2 adds field D, an old client will just skip D. Never remove or repurpose fields in a non-backward-compatible way; instead deprecate gradually. If a field must be retired, you might keep it in the context but note it as deprecated (perhaps with an @deprecated annotation in documentation) and stop using it in new credentials, but maintain it for old ones. Another strategy is to namescape your terms by version, e.g., dpp:weight vs dpp_v2:weight if the definition changes meaning, though this can complicate consumers. Prefer to extend rather than redefine. Maintaining multiple context files is also an option: e.g., a base context for core terms and extension contexts per version or per industry. This modular approach allows combining contexts so that, for instance, a verifier might load both the base context and a context for “v2025 additions” to understand all terms. All JSON-LD contexts and schema definitions should be hosted at stable URLs, and older ones should remain accessible indefinitely. Cool URIs don’t change – once you publish a context at a URL, keep it live (or redirect appropriately) [w3c.github.io](https://w3c.github.io) [w3c.github.io](https://w3c.github.io). This ensures that even years later, a verifying party or a developer tool can retrieve the context and interpret an old credential. It’s wise to use a version identifier in the file name or path (e.g., /schemas/dpp/2024/context.jsonld for the 2024 version) so you can publish updates separately. In summary, plan a versioning policy from the start: support old schemas for their lifespan, publish clear changelogs for schema updates, and use JSON-LD features (@context, @version, @protected) to manage extensions safely.

# Multilingual and Internationalized DPP Documents
Digital Product Passports will be used across borders, so the schema and data should accommodate multiple languages and locales. JSON-LD has a built-in support for language-tagged strings and even direction (ltr/rtl) markers. To internationalize text fields, define them in the context with a language mapping container. For example, a property like "productDescription" can be defined to allow a language map:
```json
"productDescription": { 
  "@id": "ex:description", 
  "@container": "@language" 
}
```
This means in the credential, productDescription can be an object with language keys: e.g., "productDescription": {"en": "High-efficiency solar panel", "de": "Hocheffizientes Solarmodul"}. Consumers will then pick the appropriate language. By indicating a default language in the context (using @language), you can also supply a default for strings without an explicit tag [stackoverflow.com](https://stackoverflow.com). There are no restrictions on language in JSON-LD data – the keys (property names) are IRIs or terms, and values can be in any language as long as appropriately tagged [stackoverflow.com](https://stackoverflow.com). We recommend providing translations for key human-readable fields (like product category names, compliance descriptions, etc.) within the DPP or via linked resources. For instance, if the DPP includes a code that represents a material type, that code could be resolvable to a concept that has rdfs:label in multiple languages in an ontology. Leverage linked data vocabularies that are already internationalized. Schema.org, for example, provides translations of terms in many languages. If suitable, mapping DPP fields to schema.org or other standard vocabularies can instantly grant multi-language support for those terms. Similarly, use controlled code lists (for product categories, materials, etc.) that publish labels in multiple languages. The DPP platform could incorporate an i18n module where all UI-facing strings or common taxonomy terms are stored with translations, ensuring that when a passport is displayed, it can show content in the user’s language. Another consideration is units and regional formats (though not strictly a language issue). Ensure that numeric data like dimensions or weight are accompanied by units (possibly SI units per regulation) so they’re unambiguous internationally. If necessary, the schema can allow multiple values with unit qualifiers (e.g., weight in kg and in local unit). However, typically the passport will standardize units to avoid confusion. For directionality, JSON-LD 1.1 supports @direction, though most product data text won’t require this unless including right-to-left scripts. In summary, to achieve multilingual DPPs: design the schema to accept language maps for text, use context @language to set defaults, pick vocabularies and code lists that come with translations, and possibly provide your own translation files for any static vocabulary. This ensures the same DPP can be understood by a German regulator or a French consumer just as well as by an English speaker, improving usability and compliance across markets. The underlying linked-data graph stays the same; it’s just enriched with language-tagged literals.
