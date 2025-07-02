# Platform Development Roadmap

This document outlines the planned features and enhancements for the Norruva platform, turning our strategic vision into an actionable development plan.

## Phase 1: Foundational Enhancements & Core Features

This phase focuses on strengthening the core platform, improving the developer experience, and building out the primary user role dashboards.

### Core Platform & API
- [ ] **API Versioning:** Implement `/v1/` prefix for all API endpoints to ensure future compatibility.
- [ ] **Webhook System:** Create a basic webhook management UI (Create, List, Delete) for developers.
- [ ] **Webhook Event (`product.published`):** Trigger a webhook when a product's status changes to "Published".
- [ ] **GS1 Identifier Support:** Add a `gtin` field to the Product schema and include it in the product creation form.
- [ ] **Data Export Feature:** Build a UI for Business Analysts to export all product data to CSV and JSON formats.
- [ ] **Full Audit Trail View:** Create a view on the product detail page to display the complete history of changes for that specific product.

### User Dashboards & Experience
- [ ] **Retailer Dashboard:** Create a dedicated dashboard for the "Retailer" role with views for product catalog and market analytics.
- [ ] **Service Provider Dashboard:** Build the dashboard for "Service Provider" with features for managing service tickets and viewing product manuals.
- [ ] **Recycler Dashboard:** Implement the "Recycler" dashboard for managing End-of-Life (EOL) products.
- [ ] **Manufacturer Dashboard:** Build the "Manufacturer" dashboard to monitor production lines and material composition.
- [ ] **Advanced Analytics:** Enhance the Business Analyst dashboard with more detailed charts for sustainability and material usage.

## Phase 2: AI & Automation Expansion

This phase focuses on leveraging AI to deliver on the promise of intelligent compliance and data enrichment.

### AI-Powered Flows
- [ ] **Lifecycle Assessment AI:** Implement the `analyzeProductLifecycle` Genkit flow to provide AI-driven insights on environmental impact.
- [ ] **Data Quality AI:** Integrate the `validateProductData` flow to automatically flag potential errors or inconsistencies upon saving a product.
- [ ] **AI Recommendations in UI:** Add a button in the product form to trigger the `suggestImprovements` AI flow and display the results to the user.
- [ ] **QR Code Summary AI:** Integrate the `generateQRLabelText` flow to auto-generate a consumer-friendly summary for the public passport page.

### Automation
- [ ] **Real-time Compliance Check:** Enhance the `summarizeComplianceGaps` flow to be callable on-demand from the product detail page.
- [ ] **Scheduled Compliance Job:** Create a daily cron job (`runDailyComplianceCheck`) that automatically verifies all pending products.
- [ ] **Scheduled Data Sync:** Implement a daily cron job (`runDailyReferenceDataSync`) to simulate updating compliance rules.

## Phase 3: Blockchain & Trust Layer

This phase focuses on enhancing the on-chain capabilities and preparing for broader interoperability.

- [ ] **EBSI Verifiable Credentials:** Begin beta integration with EBSI for issuing W3C Verifiable Credentials for each passport.
- [ ] **Smart Contract Upgrade:** Design and implement a more advanced `ProductRegistry.sol` smart contract that can log a history of data hashes, not just the latest one.
- [ ] **On-Chain History Viewer:** Add a UI component to display the historical data hashes anchored on the blockchain for a product.
- [ ] **Multi-Chain Support (Research):** Investigate and document the technical requirements for anchoring data on additional blockchains beyond Polygon.

## Future Phases (Beyond Next 30 Tasks)
- [ ] **Full Multi-Language Support:** Expand i18n to cover 25+ languages for all user-facing content.
- [ ] **ERP Connectors:** Develop native connectors for SAP and Oracle.
- [ ] **Mobile SDK:** Release an SDK for iOS and Android to simplify integration with mobile apps.
- [ ] **IoT Device Integration:** Develop a proof-of-concept for integrating sensor data into a DPP.
- [ ] **Open Source Core Modules:** Prepare a subset of the platform's core logic for public open-source release to foster community contribution.
