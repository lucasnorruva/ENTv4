# EU Alignment, Funding Readiness, Monetization & Governance

This document outlines the strategic positioning of the Norruva platform concerning EU directives, public funding opportunities, business models, and the governance framework designed to ensure trust and data integrity.

## EU Alignment & Public Funding Readiness

### 🎯 Strategic Fit

| EU Objective                        | Platform Alignment                                             |
| ----------------------------------- | -------------------------------------------------------------- |
| ESPR (Ecodesign for Sustainable Products) | Fully compliant data model, modular integration by product group. |
| Green Deal                          | Enables traceability, sustainability scoring, and lifecycle visibility. |
| Circular Economy                    | Modular lifecycle data capture, AI enrichment, and real-time validation. |
| Digital Europe Programme            | Cross-border digital product data sharing, GS1/EBSI-based.       |

This platform supports **TRL 6–8 deployment** and is designed for piloting across regulated supply chains, positioning it for **Horizon Europe** and **EIC funding**.

### 📊 Environmental Impact Support

| Capability                | Use Case                          | Supported Metrics                     |
| ------------------------- | --------------------------------- | ------------------------------------- |
| Gemini ESG Scoring        | Product-level emissions & impact  | CO₂eq, water usage, energy intensity  |
| Lifecycle Trace Logging   | End-of-life planning              | Material recoverability               |
| Blockchain Anchoring      | Third-party verifiable data provenance | Compliance traceability             |
| QR/NFC Transparency       | Consumer-facing impact display    | Real-time footprint summary           |

## Monetization & Business Models

### 💼 DPP-as-a-Service (DPPaaS)

- Tiered pricing per SKU/month
- ESG scoring/QR generation as premium features
- Developer API tiers by usage (freemium, scale, enterprise)

### 🏢 Enterprise Deployment

- On-prem or VPC deployment option
- Private Gemini model support
- Integration with internal ERP/PLM systems

### 📱 Startup/SME Access

- Free for <10 SKUs with basic compliance templates
- Pay-per-label for GS1/QR/NFC generation
- AI-suggested improvement tool as upsell

### 💸 Sample Revenue Projection Table

| Client Type   | Monthly Users | Avg Products | Tier        | Price/User | Est. MRR |
|---------------|---------------|--------------|-------------|------------|----------|
| SME           | 10            | 50           | Starter     | €50        | €500     |
| Midmarket     | 20            | 200          | Growth      | €150       | €3,000   |
| Enterprise    | 50            | 1000         | Enterprise  | €300       | €15,000  |
| **Total**     | -             | -            | -           | -          | **€18,500** |

## Governance & Trust Design

### 🔒 Roles & Verification Layers

-   **Supplier**: Submits product data
-   **Auditor**: Approves DPP integrity
-   **Compliance Officer**: Manages pathways
-   **Certifying Body**: Anchors 3rd-party claims (via VC)

### 🧾 Data Integrity & Provenance

-   Immutable audit logs for product updates
-   Gemini AI decision audit trail (explainable prompts)
-   EBSI integration for Decentralized Identifiers (DIDs)

## Investor and EU-Scale Readiness

### Scalability Metrics
The platform is designed to scale horizontally and elastically. In testing, a Fabric-like permissioned network achieved ~0.5–1 tx/sec for basic writes (roughly 2s per transaction) on modest hardware. Reads by identifier remained fast regardless of ledger size. After adding a CouchDB index for lookups by DID or external key, query latency stayed ~10 ms even with 1,000,000+ records. In practice, moving to higher-throughput L2 chains (e.g. Polygon PoS handles thousands of TPS) or sharded networks can boost these numbers orders of magnitude. Containerizing service modules (each DPP microservice, AI worker, or compliance engine) allows autoscaling on cloud platforms. Cost estimates are a function of chain fees and cloud usage: for example, anchoring a hash on Polygon currently costs only cents, while an EBSI anchor is in the same order per transaction. A cluster can support hundreds of thousands of SKUs per tenant by partitioning data (e.g. one database per region) and sharding the ledger.

### Rollout Plan
We follow a phased deployment.
- **MVP**: Validate with a pilot (e.g. one industry) using core features: DPP creation, JSON-LD VC issuance, simple blockchain anchoring, basic RBAC.
- **SME phase**: Onboard small and medium businesses with multi-tenant SaaS on public cloud, adding guided UX and compliance wizards.
- **Midmarket**: Integrate with ERP systems, support more product categories, add advanced analytics and audit features.
- **Enterprise**: Deploy private cloud or hybrid options, SSO integration (SAML/OAuth), fine-grained ABAC, extensive SLAs, and enterprise-grade PKI integration.
- **Multinational**: Enable cross-border use, multilingual interfaces and support global standards (ISO AAS, etc.).
- **Consortia/Standards**: Finally, we participate in industry consortia to codify interoperability (e.g. GS1 DPP standards) and offer our platform as a reference implementation.

### Modular Architecture
The system is built as plug-and-play modules. Key modules include:
- **Compliance Engine**: Validates DPP data against regulations (REACH, RoHS, ESPR, battery rules, etc.).
- **AI/ML Module**: Provides intelligent BOM inference, anomaly detection, and language explainability.
- **Anchoring Service**: Handles blockchain transactions on EBSI and public chains.
- **Credential Issuer**: Builds and signs W3C VCs/VPs, connected to EBSI nodes.
- **UI/UX Frontend**: Web dashboards (tenant-specific) for data entry and tracking, with ABAC enforcement.
- **Audit & Ledger Store**: Immutable store of past DPP versions, logs, and signature proofs.
- **i18n Module**: Localizes labels and compliance rules (e.g. different EU languages and regs).

Each module communicates via APIs. For example, the frontend calls the Compliance Engine before finalizing a DPP, and the Anchoring Service asynchronously logs the VC’s root hash on-chain. This modular design enables adding new functionality easily: one could plug in a “Circularity Report” widget or swap a blockchain provider without rewriting the core.

### Market (TAM/SAM/SOM) Alignment
The addressable market is immense. Global circular economy value is projected to reach ~$4.5 trillion by 2030, driven by regulations and resource constraints. The DPP software market alone is forecasted to grow from ~$186M in 2024 to ~$1.78B by 2030 (CAGR 45.7%), fueled by EU mandates (ESPR, Battery Directive, etc.) that will require DPPs in industries like automotive, electronics and textiles. Given this, our Total Addressable Market (TAM) includes all regulated goods producers in EU/UK/US. The Serviceable Available Market (SAM) is narrower (initially EU product categories subject to DPP rules). The Serviceable Obtainable Market (SOM) is our expected share via partner channels and compliance mandates. By focusing on configurable compliance modules and enterprise integration, we aim to capture a significant portion of the EU regulatory compliance tools market, which analysts note is expanding rapidly under the Circular Economy agenda. Each of these figures and forecasts underlines why robust technical scalability, regulatory certification (e.g. EUDI Wallet conformance), and clear business alignment are critical for investor confidence.

### Sources
We cite relevant industry and EU sources, including the UN Transparency Protocol for DPPs, GS1 and ZVEI architecture guides, EBSI project documentation, and market research reports, as well as sample code patterns. These inform our design choices and ensure alignment with open standards and regulations.

## Go-to-Market by Stakeholder Persona
Our go-to-market strategy will tailor the value proposition of the DPP platform to different stakeholder personas, as each cares about different aspects:
- **Compliance Officers / Regulatory Affairs:** These stakeholders are primarily driven by the need to ensure compliance and avoid penalties. For them, the DPP platform is a compliance solution. Marketing message: “Stay ahead of regulations – our platform is your turnkey compliance for EU Digital Product Passport requirements.” We emphasize features like automatic validation against EU requirements, up-to-date schema that reflects the law, audit logs for regulators, and easy generation of compliance reports. Compliance officers will appreciate that the platform reduces the risk of fines or import/export blockage by ensuring each product has the required passport data. We should cite how regulators see DPPs: e.g., the European Commission says passports “improve transparency about products’ lifecycle impacts”, which helps with compliance. We offer peace of mind: when a new law kicks in, our customers can show they have all needed info in the correct format ready. GTM approach: webinars and whitepapers on “How to comply with the Digital Product Passport mandates in your industry” speaking directly to this audience. Possibly engage industry associations to recommend our solution to members for compliance.
- **Sustainability and CSR Leads:** These stakeholders are interested in using the DPP not only for compliance but to advance sustainability goals and brand reputation. The pitch here: DPP platform as a tool for transparency, trust, and optimization. We highlight how the platform aggregates data on material sourcing, carbon footprint, recyclability – giving the sustainability team actionable insights to improve product design and supply chain. For example, with all data in one passport, they can identify that certain components cause a high carbon footprint and target them for improvement. Also, sharing DPPs with customers builds brand trust (“look, we have nothing to hide about our product’s impact”). We emphasize features like carbon accounting integration, support for certifications (like Fair Trade, organic, etc. within the passport), and how it supports circular economy initiatives (e.g., enabling take-back schemes by scanning a product’s passport to see recycling info). Since sustainability leads often struggle to gather data from multiple silos, we show how our integration capabilities solve that, bringing procurement, manufacturing, and end-of-life data together. Essentially, the platform helps them measure and communicate sustainability – one of their key objectives. GTM tactics: case studies focusing on how using DPPs improved a company’s sustainability metrics or eased their ESG reporting. Also, position the platform as enabling compliance with not just DPP laws but also ESG disclosure regimes and voluntary commitments (like GRI or CDP reporting, where product-level data can feed into broader sustainability reporting).
- **IT Integrators / CIO / CTO:** For the technical audience, the focus is on integration, scalability, and security. Here we pitch the DPP platform as a modular, enterprise-grade software that will slot into their architecture. Key messages: it has open APIs, supports standards (JSON-LD, W3C Verifiable Credentials, OAuth, etc.), and can be deployed flexibly (cloud or on-prem) to meet IT policies. We address concerns like: “Will this work with our existing ERP/MES systems?” – Yes, we have connectors and an integration toolkit (we might mention our use of an iPaaS or API-first approach). “Is it secure and can it handle our scale?” – Yes, built on scalable cloud infrastructure, multi-tenant security, encryption, role-based access as per enterprise standards, and already tested with thousands of products. We also highlight our use of blockchain where applicable (some IT folks will be interested that we use decentralized tech for verification, though we clarify it's a permissioned chain like EBSI to calm any fears about public crypto stuff). Essentially, we make the IT stakeholder feel that adopting our platform is low-friction and will make them look good because it’s modern tech aligning with digital transformation goals. We can mention that our solution can increase efficiency – instead of building a custom system for DPP, which could take years, they can integrate ours in months and avoid diverting internal dev teams. Also, offering strong support and documentation (important to IT teams) and perhaps training for their staff or integration partners. GTM here might involve engaging systems integrators (Big 4 consultancies or niche firms) so that they recommend our platform during digital supply chain projects. Also, attending tech-oriented conferences, publishing technical whitepapers about our architecture's robustness.
- **Supply Chain & Operations Managers:** Another persona (not explicitly listed, but adjacent) might be those who handle product data day-to-day. Our approach to them: the platform makes their life easier by automating the assembly of passport data that they previously might have to chase manually. We might incorporate this into the above as secondary messages.

In practical terms, our sales and marketing strategy will have tailored materials for each persona:
- **For Compliance:** Emphasize risk mitigation and full compliance features, maybe with quotes like “Using [Platform], we achieved 100% compliance with the Battery Regulation ahead of deadline.”
- **For Sustainability:** Emphasize impact and transparency, e.g., “[Platform] enabled us to identify a 15% reduction in product carbon footprint by highlighting hotspots” or “...to confidently share product sustainability data with customers, boosting brand image.”
- **For IT:** Emphasize ease of implementation and future-proof tech, e.g., “We integrated [Platform] with our SAP and PLM in 6 weeks” or “The solution’s adherence to open standards meant no vendor lock-in and easy extension.”

Each stakeholder also has different buying triggers: compliance is often mandatory (budget appears to avoid fines), sustainability might need ROI argument (better brand loyalty, avoiding future compliance, etc.), IT might need TCO (total cost of ownership) comparison (cheaper to buy than build, plus ongoing support). We’ll prepare those arguments accordingly. By aligning our messaging to these stakeholders, we ensure during the sales process that each hears the aspects of the DPP platform that resonate with their concerns. Often the decision to adopt will involve all of them (e.g., a compliance officer says “we need this”, IT says “it fits our architecture”, sustainability says “it adds value to our goals”, and CFO signs off because each of those provided rationale). Hence a holistic but tailored GTM is key.
