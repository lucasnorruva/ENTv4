# 4. Blockchain Anchoring & Smart Contracts

To ensure trust and authenticity of Digital Product Passports, we implement blockchain anchoring. Each product’s passport data is cryptographically hashed and recorded on a blockchain. This provides an immutable, verifiable trail: anyone can confirm that the product data they see matches what was officially registered at a given time, and that it hasn’t been tampered with. Our strategy uses Polygon (a fast, energy-efficient Ethereum layer-2 network) for public anchoring, and is designed to optionally interface with EBSI for EU-specific deployments.

### Product Hash Generation

When a product is finalized (all required data present and ready to publish), the platform computes a hash of its data. We use SHA-256 as the hashing algorithm (which is standard for digital fingerprints). To ensure consistency:

-   We define a canonical JSON serialization of the key passport fields (e.g., sorted keys, excluding non-essential or user-private data like internal notes or draft status). For example, we might take the `productId`, `identifiers`, `attributes`, `compliance`, and `documents` sections (excluding things like the AI summary or status flags), convert that to a JSON string in a deterministic way, and hash it.
-   The resulting hash (64-character hex string for SHA-256) is the product’s digital fingerprint. This hash is stored in our Firestore (`blockchain.currentHash`) and will be written to the blockchain. If any field that affects the hash is changed (e.g., an update to material composition), a new hash is computed and treated as a new “version” on chain.

### Smart Contract on Polygon

We deploy a smart contract on Polygon that acts as a registry of product passport hashes. The contract is relatively simple for transparency and cost-efficiency. Key aspects:

-   It stores a mapping from a product’s unique ID to the latest hash (and possibly previous hashes or events for history).
-   It emits an event whenever a product hash is registered or updated.
-   It may also store the address of the issuer (manufacturer) for the product if we want to enforce that only the original issuer can update their product’s record.

Pseudo-code (Solidity-like) for the contract might look like:

```solidity
mapping(string => bytes32) public productHash;  // productId -> latest hash
mapping(string => address) public issuer;       // productId -> issuer address

event ProductRegistered(string productId, bytes32 hash, address issuer);
event ProductUpdated(string productId, bytes32 newHash);

function registerProduct(string calldata productId, bytes32 hash) external {
    require(productHash[productId] == 0, "Already registered");
    productHash[productId] = hash;
    issuer[productId] = msg.sender;
    emit ProductRegistered(productId, hash, msg.sender);
}

function updateProduct(string calldata productId, bytes32 newHash) external {
    require(issuer[productId] == msg.sender, "Not authorized");
    require(productHash[productId] != 0, "Product not registered");
    productHash[productId] = newHash;
    emit ProductUpdated(productId, newHash);
}
```

In our case, rather than exposing these functions directly to end-users, the platform’s backend (Cloud Function) will be the one calling them. The backend holds a blockchain wallet (private key) used to send transactions. This wallet could be specific per company in future (allowing companies to use their own keys), but initially, the platform uses a service key to simplify usage (with the understanding that we act as an authorized agent on behalf of the user to anchor the data).

**Polygon vs. other chains**: We chose Polygon due to its low transaction fees and its commitment to sustainability (Polygon’s PoS has a much lower carbon footprint than Ethereum mainnet). This aligns with our platform ethos. Additionally, Polygon’s widespread adoption (including by companies for NFTs and supply chain) means good tool support. We also remain blockchain-agnostic in design:

-   We could support multi-chain anchoring (e.g., on Polygon, Ethereum mainnet, Solana, etc.) if required by clients. In fact, some fashion DPP providers operate on multiple chains ([cointelegraph.com](https://cointelegraph.com)). Our contract code could be redeployed on other EVM chains easily.
-   For now, one network is sufficient; but the design allows adding a new module for another chain.

### Verification Path

How does one verify a product passport?

1.  Given a product ID (obtained from scanning QR or via API), one can fetch the product data from our platform (either through our API or via the public QR endpoint).
2.  The platform provides the current hash (either directly visible in the JSON or via a verification endpoint).
3.  The verifier can query the Polygon smart contract (we provide a simple Web3 endpoint or even a link to a block explorer) for the stored hash for that product ID.
4.  Compare the two hashes:
    -   If they match, the data is authenticated – it exactly matches what was anchored on blockchain at publish time.
    -   If they differ, it means the data might have been altered or is not the official version. (In practice, if an update happened, the blockchain should also have been updated. If the platform shows a new hash that isn’t on chain yet, we might label it “pending verification”.)

Because the contract is public, anyone (including regulators or consumers) can independently perform this check without solely trusting our database. This ensures data integrity, one of the EU design goals for DPP ([digimarc.com](https://www.digimarc.com)).

We also implement a verification API endpoint (`GET /products/{id}/verify`) that will do the above steps and return a simple result (e.g., `{ "verified": true, "onChainHash": "...", "currentHash": "..." }`). This is used by our front-end to display a verification badge (like a green checkmark with “Blockchain verified on Polygon”).

### Handling Updates / Versioning on Chain

If product data is updated post-sale (which is expected in circular economy scenarios – e.g., adding repair info), we have options:

-   **Update the existing record’s hash** (the smart contract method `updateProduct`). This means the contract always holds the latest hash only. The history is only in event logs (the `ProductUpdated` events). We can retrieve past events if needed for an audit trail, but it’s not directly stored in state.
-   Alternatively, not update but rather create new records per major version. For simplicity and cost, we do the update-in-place on chain and rely on event logs for history (which can be fetched if someone really needs to audit previous states).

We include a version number in the Firestore and possibly incorporate it in the hash or store it. For example, we might hash something like `hash = SHA256(productId + version + canonicalJSON)`. That way, if version increments, the hash changes even if content didn’t, which is fine to differentiate states.

If a regulator requires that every update is traceable, we have the event log. The platform could expose a “history” showing previous hashes and timestamps (from our DB and from chain event timestamps) for full transparency.

### Security & Privacy Considerations

We do not put the full product data on chain, only a hash. This preserves confidentiality (no sensitive data is public) yet ensures integrity (hash will break if data changes). The unique product ID we use on chain is not a direct human-readable identifier (it could be an encoded ID or a GUID) to avoid leaking product or company identity unless one has access to the platform. The contract doesn’t store user data except maybe an issuer address. Even the issuer address can be abstract if we use our service key; in future if manufacturers use their own wallets, their address would show as the one registering/updating their product’s passport, which could be desirable for trust (proving the manufacturer indeed anchored it).

### EBSI Integration

The European Blockchain Services Infrastructure is a permissioned network aiming to support things like product passports. EBSI works with Verifiable Credentials (VCs). Our approach to integrate:

-   When a passport is published, we can generate a VC that contains the product’s data (or a summary of it) signed by the manufacturer (or by our platform as issuer on behalf). This VC could then be registered in EBSI’s ledger or made available via the forthcoming EU Digital Identity Wallets ([ec.europa.eu](https://ec.europa.eu)).
-   We plan to map our data to the EBSI VCTF (Verifiable Credentials Trust Framework) once it’s clear. Possibly, EBSI might require a certain schema or DID method. We ensure the product has a DID (did:ebsi) that correlates with a VC.
-   Due to EBSI’s controlled nature, we may not directly write to EBSI like a public chain. Instead, we might have to go through an authorized issuer (the company or a service provider).

This is an evolving area; our design keeps the possibility open by abstracting the “anchoring” interface. For now, we anchor to Polygon, but the `blockchain/ebsiClient.ts` is a placeholder where code can go to interface with EBSI APIs (for example, to send a VC to an EBSI node or to the European Self-Sovereign Identity Framework).

In the interim, our Polygon anchoring serves the main purpose. When EBSI becomes operational for DPP, we can add that as an additional verification layer for EU-specific use cases.

### Smart Contract Deployment and Management

The contract’s address and ABI are stored in config. Only our backend (or designated addresses) can call it. We use a library (like web3.js or ethers.js in the Cloud Function) with an RPC endpoint (Infura/Alchemy or a Polygon node) to send transactions. Gas costs are paid from our service wallet; we likely will include this as part of the subscription cost to users (it’s only a few cents per product on Polygon). If volume grows, we might batch or use meta-transactions. Also, we will have a testnet version (Mumbai) for our staging environment to test the flows without real value.

In summary, blockchain anchoring adds an immutable layer of trust to our platform. It addresses the concern that a purely centralized database could be altered – with the blockchain, any attempt to modify passport data after the fact can be detected. This feature thus turns our DPP platform into a trust infrastructure, not just a database, which is vital for adoption by stakeholders who might not fully trust a single private platform. By using widely accessible networks (Polygon and soon EBSI), we ensure verification is decentralized and future-proof.
