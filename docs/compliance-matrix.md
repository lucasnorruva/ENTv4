# Compliance Matrix

This document outlines the key regulations Norruva is designed to address and the corresponding data fields within the Digital Product Passport.

| Regulation / Standard   | Type          | Applicable Products      | Key Data Fields / Concepts                                                              |
| ----------------------- | ------------- | ------------------------ | --------------------------------------------------------------------------------------- |
| **ESPR (Ecodesign)**    | Core EU       | All                      | `sustainabilityScore`, `repairability_score`, `recycled_content_percentage`             |
| **GS1 Digital Link**    | Data Format   | All Packaged Goods       | URI format, QR Code data structure                                                      |
| **SCIP Database**       | Chemical      | Electronics, Plastics    | `materials`, `substances_of_very_high_concern` (SVHCs)                                  |
| **REACH / RoHS**        | Chemical      | Electronics              | `materials`, banned substance checks (e.g., Lead, Mercury, Cadmium)                     |
| **ISO 14067**           | ESG           | Industrial               | `carbon_footprint_kg_co2e`, `manufacturing_process`, `energy_efficiency`                |
| **DIN EN ISO 22095**    | Provenance    | Pharma, Food             | `batch_id`, `origin`, `supply_chain_traceability` (linked via VCs)                      |
| **EBSI VC Model**       | Blockchain    | All                      | `ebsiVcId`, links to verifiable credentials for claims                                  |
| **EU QR Code Standard** | UX/Data       | All consumer goods       | QR code content, format for consumer accessibility                                      |
| **DPP UX (EU)**         | UX            | All                      | Role-based data visibility, clear presentation of mandatory information                 |

---
_This matrix is a living document and will be updated as new regulations are integrated into the Norruva platform._
