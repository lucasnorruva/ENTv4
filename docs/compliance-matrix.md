# 3. Compliance Matrix: Standards & Regulations

One of the platform’s core strengths is its extensive compliance matrix covering dozens of regulations and standards across markets. We track and enforce compliance with 75+ global standards spanning environmental, safety, and sustainability domains. Each relevant standard is mapped to specific data fields in the product passport, with validation rules to ensure the data meets the standard’s requirements. This section presents the matrix in an organized way, grouping related regulations and explaining our integration approach for each.

How to read this matrix: For each standard or regulation, we outline:

-   **Scope**: What the standard/regulation is about and why it matters (briefly).
-   **Integration Notes**: How the platform addresses it – e.g., fields captured, any automation (like API to external database), and workflow impacts.
-   **Key JSON Fields**: The fields in our Firestore `products` document or subcollections related to this standard.
-   **Validation Rules**: Business logic to validate compliance (executed in `compliance/rules.ts` or via AI reasoning). This includes conditionally required fields or threshold checks.

(Note: Not every one of the 75+ standards is listed individually here; many follow similar patterns. We ensure the platform is flexible to add new standards by updating configuration rather than core code.)

## 3.1 Environmental & Circular Economy Regulations

These regulations focus on product design, sustainability, and end-of-life, mostly from the EU’s green initiatives:

-   **ESPR (EU Ecodesign for Sustainable Products Regulation)**:
    -   **Scope**: EU framework regulation that mandates DPPs and sets eco-design requirements for broad product categories ([gs1.eu](https://www.gs1.eu)). It’s the umbrella under which product-specific rules (Delegated Acts) will be issued.
    -   **Integration**: Our entire platform is aligned to meet ESPR’s concept of a DPP: we capture comprehensive lifecycle data (materials, carbon footprint, etc.) and make it accessible via QR code, fulfilling ESPR’s transparency goals ([data.europa.eu](https://data.europa.eu)). We monitor new Delegated Acts; for example, if a Delegated Act for textiles requires a “recyclability score,” we add a field for that.
    -   **Fields**: `materialComposition`, `recycledContent`, `durabilityScore`, etc., as required per category.
    -   **Validation**: Ensures that all required data points for the product’s category (as per the Delegated Act checklist) are present. Also the platform can produce a Declaration of Conformity for ESPR using the filled data. (Since ESPR itself is high-level, much is handled in specific standards below.)

-   **EU Battery Regulation (Battery Passport)**:
    -   **Scope**: Regulates batteries (in vehicles, electronics, etc.), requiring a Battery Passport with detailed info on battery materials, capacity, health, and recycling ([forrester.com](https://www.forrester.com)).
    -   **Integration**: For products containing batteries, we include a nested battery passport schema.
    -   **Fields**: `battery.type`, `battery.capacity`, `battery.materials` (with % recycled), `battery.serial` and a link to a Battery Passport record if it exists externally.
    -   **Validation**: If `category=="battery"` or product has a battery, ensure fields like carbon footprint of battery, content of recycled materials, and battery health indicators are present. The platform can integrate with the EU Battery Alliance standards: e.g., generating a Battery Passport ID, and even connecting to the Global Battery Alliance data if available. We also ensure Annex XIII info like carbon footprint data is included (we have `carbonFootprint` field for that) ([forrester.com](https://www.forrester.com)).

-   **EU Packaging & Packaging Waste Regulation (PPWR)**:
    -   **Scope**: Upcoming regulation addressing packaging recyclability and recycled content.
    -   **Integration**: We capture packaging info for each product.
    -   **Fields**: `packaging.material` (e.g., cardboard, plastic type), `packaging.weight`, `packaging.recycledContent%`, `packaging.recyclable` (boolean or percentage recyclable).
    -   **Validation**: If product has separate consumer packaging, ensure it’s documented. The rule might say “all packaging must be >50% recyclable by 2025”, so we enforce a check like `packaging.recyclable == true` or certain recycled content thresholds. Also, if any packaging contains plastics, require a recycling label field.

-   **WEEE (EU Waste Electrical & Electronic Equipment Directive)**:
    -   **Scope**: Requires proper labeling and information for e-waste handling (for electronics).
    -   **Integration**: We include an `endOfLife` section with disposal instructions.
    -   **Fields**: `documents.userManualURL` (manual contains WEEE info), `endOfLife.recyclingInstructions` (text or link describing how to dispose or recycle the product).
    -   **Validation**: For electronics, ensure we have a disposal instruction and perhaps a flag that the product is marked with the WEEE bin symbol (this could be a boolean `weeeLabelPresent`). If not present, we warn that it’s required for electronics sold in EU.

-   **EUPC (EU Plastic Content & Recycling initiatives)**:
    -   **Scope**: Various EU initiatives to increase recycled plastic content (for example, in packaging, bottles, etc.).
    -   **Integration**: If applicable (e.g., for packaging or product is plastic), we have the field `recycledContent`.
    -   **Fields**: `recycledContent` percentage by weight for overall product or specific components.
    -   **Validation**: Check against targets (like certain products must have X% recycled plastic by certain year) – these can be updated in rules config. Non-compliance might not block passport creation but could flag in the ESG report.

-   **Product Environmental Footprint (PEF)**:
    -   **Scope**: The EU PEF is a methodology (not a single standard, but a framework for calculating lifecycle environmental impact).
    -   **Integration**: We can store a product’s carbon footprint (CFP) as per ISO 14067 / PEF, as well as possibly other impact categories if provided.
    -   **Fields**: `carbonFootprint` (in kg CO₂e for the product’s life or per declared unit), and possibly a link to a full EPD (Environmental Product Declaration) document if available.
    -   **Validation**: If `carbonFootprint` is provided, ensure a methodology field (like "ISO 14067") is noted to make it credible. We allow integration with carbon footprint tools (e.g., an API could fill this field). No strict validation threshold here (since footprint is a measured result), but presence might be required in some Delegated Acts – we enforce presence if mandated.

-   **ISO 14067 (Carbon Footprint of Products)**:
    -   **Scope**: International standard for quantifying a product’s greenhouse gas emissions over the lifecycle ([standict.eu](https://standict.eu)).
    -   **Integration**: We use ISO 14067 as the guideline for our `carbonFootprint` field.
    -   **Fields**: `carbonFootprint` (value), `carbonFootprintScope` (scope or boundaries if known, e.g., cradle-to-gate), `carbonFootprintMethod` (e.g., "ISO 14067" or "GHG Product Standard").
    -   **Validation**: Ensures the footprint value is non-negative and if provided, the method is specified (to avoid numbers without context). We also might validate unit (must be in kg CO₂e). This is mostly an informational field; quality of data depends on user input or integration with LCA software.

-   **DIN EN ISO 22095 (Chain of Custody)**:
    -   **Scope**: An international standard (ISO 22095:2020, adopted as DIN EN in EU) defining chain-of-custody models for materials (identity preserved, mass balance, etc.) ([cencenelec.eu](https://www.cencenelec.eu)).
    -   **Integration**: This comes into play for recycled content and material traceability. We let users specify which CoC model they are using for any sustainability claims.
    -   **Fields**: `chainOfCustodyModel` (enum: e.g., "MassBalance", "IdentityPreserved", etc.), possibly per material.
    -   **Validation**: If a product claims recycled content or certain sourcing, we require a CoC model declaration to ensure transparency. For instance, if a plastic component is said to be “30% recycled via mass balance”, we expect `chainOfCustodyModel = "MassBalance"`; if they claim identity preserved recycled content, we might expect evidence (like a certificate reference). The system doesn’t verify the claim independently, but including this is aligned with standards and could be shown on the DPP for credibility.

-   **Circular Economy & Durability Standards**:
    -   **Scope**: e.g., EN 45554 (methods for assessing the ability to repair, reuse, upgrade products) or upcoming EU durability scoring.
    -   **Integration**: Provide fields for repairability scores or durability metrics if applicable.
    -   **Fields**: `repairabilityScore` (say out of 10), `expectedLifespanYears`.
    -   **Validation**: Not strictly validated against external source yet (since scoring is done externally), but if an EU delegated act says “must display repairability score”, we ensure the field is present.

## 3.2 Chemical & Safety Regulations

These are critical for product compliance, ensuring products do not contain or emit harmful substances:

-   **REACH (EC 1907/2006)**:
    -   **Scope**: EU regulation on chemicals; for products (articles), key part is requiring notification if any Substance of Very High Concern (SVHC) is present above 0.1% w/w. Also restricts certain substances via Annex XVII.
    -   **Integration**: We maintain a list of SVHCs (regularly updated from ECHA).
    -   **Fields**: `reachSVHCDeclaration` (boolean if SVHC threshold exceeded and reported), and possibly a list `substances[]` with any SVHC name and % if present. We also allow storing a `scipReference` if the product was registered in the SCIP database (which is required for those SVHC cases).
    -   **Validation**: When product materials are listed, our compliance module checks each against the SVHC list. If any substance amount >0.1%, then `reachSVHCDeclaration` must be true and `scipReference` provided – otherwise we flag non-compliance ([digiprodpass.com](https://digiprodpass.com)). If a banned substance (Annex XVII) is present above allowed concentration, we similarly flag it (e.g., cadmium above 0.01% in plastic is banned). The AI may also assist by reading ingredient lists if given in text and identifying known chemicals of concern.

-   **RoHS (2011/65/EU and updates)**:
    -   **Scope**: Restricts hazardous substances in electronics (currently 10 substances, including lead, mercury, cadmium, PBDEs, etc., with specific max concentrations like 0.1% or 0.01% for cadmium).
    -   **Integration**: We include a field `rohsCompliant` (boolean). Optionally, a detailed breakdown of restricted substances content can be stored (similar to SVHC list).
    -   **Fields**: `rohsCompliant`, and if not, perhaps `rohsExemption` (some products have exemptions for certain applications).
    -   **Validation**: If category is electronics (or any product with electrical components), `rohsCompliant` must be true to be sellable in EU. If false, we mark product as non-compliant. We could integrate the open source IPC-1752 declarable substances database or require the user to confirm compliance. We know from the data if, say, `leadPercent` field is present, to compare with 0.1%. But often we rely on a yes/no declaration plus maybe upload of a compliance certificate. Our system will warn if the user leaves it false or blank. (The Forrester example we saw confirms DPP should include compliance docs like these ([forrester.com](https://www.forrester.com)).)

-   **SCIP Database (EU Waste Framework Directive)**:
    -   **Scope**: Database where companies must submit info on articles containing SVHCs >0.1%.
    -   **Integration**: We don’t run SCIP, but we help facilitate it.
    -   **Fields**: `scipReference` (the unique ID or number from the SCIP submission) and possibly `scipStatus` (submitted/pending).
    -   **Validation**: If `reachSVHCDeclaration` is true, we expect a `scipReference`. While we cannot verify the reference ourselves without ECHA’s system, the presence of an ID indicates the manufacturer has done their duty. We also include in the DPP a note “SVHC present above threshold; info available in SCIP #XYZ” for transparency.

-   **California Proposition 65**:
    -   **Scope**: California regulation requiring warning labels if products contain any chemicals known to cause cancer/reproductive harm above safe harbor levels.
    -   **Integration**: This is a global standards example beyond EU. We include a Prop65 flag and list of substances if applicable.
    -   **Fields**: `prop65WarningRequired` (boolean), `prop65Substances[]` (list of chemicals triggering it, if any).
    -   **Validation**: We maintain a list of Prop65 substances (overlap with many others). If a product is shipping to the US and contains these, we flag to user that a Prop65 warning may be required. This is more of an advisory compliance: our platform might not block product creation, but it will note in the compliance report.

-   **US Toxic Substances Control Act (TSCA)**:
    -   **Scope**: U.S. regulation requiring certain substances in products to be reported or prohibited.
    -   **Integration**: Not deeply integrated, but as a placeholder, we could have a `tscaCompliant` flag or ensure chemicals used are on the TSCA inventory.
    -   **Fields**: Potentially none by default; could be added case-by-case.
    -   **Validation**: If a company indicates US market, we might cross-check their chemical list vs known TSCA restrictions.

-   **EU Toy Safety Directive (2009/48/EC)**:
    -   **Scope**: Ensures toys meet chemical and physical safety standards, including limits on certain elements (like lead, cadmium migration limits), and requires a Declaration of Conformity and CE marking.
    -   **Integration**: If category is “toy”, our system expects certain tests to be done.
    -   **Fields**: `ceMarked` (bool), `conformityDocUrl`, and possibly fields for specific content like "phthalateFree" or "EN71TestsPassed".
    -   **Validation**: If toy, must have `ceMarked=true` and a reference to a DoC. The actual test results for chemicals might not be stored, but a general compliance boolean for each relevant hazard could be (like `formaldehydeCompliant=true` if a wooden toy with formaldehyde limit).

-   **Food Contact Materials Regulations (EU and FDA)**:
    -   **Scope**: For products that are food packaging or contact utensils, ensuring no harmful migration.
    -   **Integration**: If product or part is marked as food-contact, require fields like `foodGradeCompliance` and maybe an upload of a food-grade certificate.
    -   **Fields**: `foodContactSafe` (bool), `complianceStandard` (like EU 10/2011 for plastics).
    -   **Validation**: If a material is intended for food contact and the user hasn’t indicated compliance, flag it.
    -   **Note**: Pharmaceutical regulations (e.g., EU FMD for anti-counterfeiting, or FDA 21 CFR for packaging) might be beyond scope of DPP, but if pharma: ensure fields like `batchNumber` and `expiryDate` are present, and possibly integration with serialization systems (which is under supply chain rather than passport content).

In general, for Chemical compliance, our strategy is:

-   Maintain lists of restricted substances per regulation.
-   Provide UI/fields for users to list material composition. (We might integrate with databases so users can select materials with known regulatory info.)
-   Automatically flag if any problematic substance is present beyond limits.
-   Provide guidance (via AI or static text) on what to do (e.g., if lead is present, “use lead-free solder to comply with RoHS” as AI might suggest).
-   Keep record of compliance documentation. DPP includes a section for “Compliance & Safety Information” which is exactly as described by an EU source: unique ID, compliance docs, substances of concern, user manuals, disposal guidance ([forrester.com](https://www.forrester.com)). Our data model and validation enforce these are included.

## 3.3 International Standards & Frameworks

Beyond regulations, there are numerous standards and frameworks (ISO, IEEE, etc.) that inform our data model to ensure interoperability and best practices:

-   **GS1 Standards (Identification & Data Sharing)**:
    -   **Scope**: GS1 provides global standards like GTIN (barcodes), GLN (locations), and data exchange standards (EPCIS for event capture, Digital Link for URLs).
    -   **Integration**: We use GTIN as the primary product identifier whenever available. The `identifiers.gtin` field in our schema links the DPP to the global product cataloging system, which aids interoperability ([digimarc.com](https://digimarc.com)). We also utilize GS1 Digital Link syntax for our URLs (appending the GTIN and maybe a serial as a query parameter in the QR code URL). For data sharing, if companies use EPCIS to track events (like manufacturing or shipping events), our system can import those into the `events` subcollection.
    -   **Fields**: `identifiers.gtin`, `identifiers.gln` (maybe manufacturer’s GLN), and possibly events aligning to EPCIS events (with fields like event time, type, bizStep, etc.).
    -   **Validation**: Check GTIN format (valid checksum). If not provided, we can generate an internal unique ID but advise using GTIN for consumer products. GS1 standards support is highlighted as a way we meet global interoperability requirements ([gs1.eu](https://www.gs1.eu)).

-   **W3C Decentralized Identifiers (DID)**:
    -   **Scope**: A W3C standard for unique, verifiable identifiers for entities (including products).
    -   **Integration**: For future-proofing, we can derive a DID for each product, especially if using EBSI (which has its own DID method). For example, a product could have a DID like `did:ebsi:...` or `did:example:productID`.
    -   **Fields**: `identifiers.did`.
    -   **Validation**: Not mandatory for now, but if the user’s organization uses DIDs, we store and perhaps publish a DID Document linking to the DPP URL. This allows an external decentralized lookup of the product (which could return a pointer to our API).

-   **W3C Verifiable Credentials (VC)**:
    -   **Scope**: A framework for digitally signing data (could be used to sign a DPP’s data as a credential).
    -   **Integration**: We plan to offer an export where the entire product passport is serialized as a Verifiable Credential (JSON-LD with proper context) and signed by the manufacturer. This can be anchored on EBSI or elsewhere.
    -   **Fields**: Not in Firestore, but an on-demand generation; or `blockchain.ebsiCredentialId` as mentioned, which could link to a stored VC on a ledger.
    -   **Validation**: Ensure that if we generate a VC, all required claims are present. This is more about feature implementation than data validation inside Firestore.

-   **ISO 9001 / Quality Management**: Not directly stored, but we allow a field `certifications` where companies can list any certifications (ISO 9001, ISO 14001, etc.) relevant to the product or its manufacturing. This doesn’t have a strict validation, but could be displayed or included in AI reasoning (Gemini might mention “factory is ISO 14001 certified” in ESG analysis as we saw).

-   **ISO 14024 / Ecolabel Type I**: Covers programs like EU Ecolabel or Energy Star. If a product has an ecolabel, we capture that.
    -   **Fields**: `certifications.ecoLabel` (e.g., “EU Ecolabel”), `certifications.energyStar` (boolean or rating).
    -   **Validation**: If claimed, possibly verify format or existence (maybe via an API if available, but usually just trust the input).

-   **ISO 17067 (Certification schemes) and ISO/IEC 15288 (Lifecycle processes)** and other meta-standards: these inform how we design the processes but don’t map to specific fields.

-   **UN Sustainable Development Goals (SDGs)**: Some companies want to link products to SDGs. Not a compliance thing, but we could allow tagging which SDGs are addressed.
    -   **Fields**: `sustainabilityGoals: [7,12]` (for Affordable Energy, Responsible Consumption, etc.).
    -   **Validation**: None strict, just for reporting.

-   **GHG Protocol**: We mentioned this under ISO 14067, it’s essentially similar: ensure we align with how to account emissions.

-   **IEC and IEEE standards**: e.g., IEC 62474 Material Declaration (an international db of declarable substances) – our compliance logic can use IEC 62474 list for electronics materials to know what to capture.
    -   **Integration**: Behind the scenes, the `compliance/standardsMap.ts` might include substance lists from IEC 62474 which overlaps with REACH and RoHS. This improves completeness.

-   **Global Recycled Standard (GRS) or OEKO-TEX (for textiles)**: These are certifications that verify claims (not laws).
    -   **Integration**: Allow linking to these certificates in the passport.
    -   **Fields**: e.g., `certifications.OEKOTEX` (with certificate ID), or `materials[].grsCertified` flag if a material is certified recycled.
    -   **Validation**: Not automated; just stored.

In summary, our platform’s compliance matrix isn’t just a static checklist – it’s an active system. We embed the knowledge of these regulations into our data structure and code. The matrix is implemented partly as configuration (lists of required fields per category/standard) and partly as code (functions that calculate or check conditions). For transparency, we could provide a table in our docs or even in the app listing all supported standards and whether the product currently meets them (a “Compliance dashboard” that might say ✅ or ❌ next to each applicable standard).

### Example Compliance Matrix Snippet (for reference)

| Regulation/Standard                | Key Fields (Data Points)                        | Integration Notes (Platform Behavior)                                    | Validation Rules (Summary)                                                           |
| ---------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| **REACH (EU)**                     | `substances`, `reachSVHCDeclaration`, `scipReference` | SVHC list updated from ECHA. SCIP ID stored if needed.                   | Flag if SVHC >0.1% without SCIP ref. Reject banned substances above thresholds.      |
| **RoHS (EU)**                      | `rohsCompliant`, `substances` (for Pb, Hg etc)    | If electronics, must confirm RoHS. Exemptions can be noted.              | Require `rohsCompliant=true` for electronics. Warn if substances present beyond limits. |
| **ESPR (EU)**                      | Many: `materialComposition`, `carbonFootprint`, etc. | Generic DPP framework – ensure full data for category.                   | Require all Delegated-Act-specified fields for product category.                     |
| **ISO 14067 / Carbon Footprint**   | `carbonFootprint`, `carbonFootprintMethod`        | Store product carbon footprint per ISO 14067 if available.               | If footprint given, method must be specified. Suggest adding if missing.             |
| **GS1 GTIN**                       | `identifiers.gtin`                              | Use GTIN as product ID for compatibility. Included in QR code URL.       | Validate GTIN checksum and format if present. Recommend for consumer products.       |
| **EU Battery Reg.**                | `battery.*` (various battery info)              | Add battery passport data for any battery-containing product.            | If battery present, require key battery fields (chemistry, capacity, recycle info).    |
| **DIN EN ISO 22095**               | `chainOfCustodyModel`                           | Document CoC model for recycled content claims.                          | If recycled content >0, require CoC model field. For transparency.                   |
| **Prop 65 (CA)**                   | `prop65WarningRequired`, `prop65Substances`     | Mark if Prop65 warning needed.                                           | If shipping to CA and contains listed chemicals, flag warning.                       |
| **EU Toy Safety**                  | `ceMarked`, `documents.declarationOfConformityURL` | Ensure toy compliance docs and markings.                                 | If category=toy, require CE mark `true` and a DoC document.                           |
| **EU Packaging (PPWR)**            | `packaging.*` (material, recyclability)         | Track packaging sustainability metrics.                                  | If packaging exists, require recyclability info. Check recycled % meets targets.     |
| **Global Battery Alliance (GBA)**  | `battery.passportID`                            | Prepared to link to GBA battery passport registry.                       | If available, store ID. No strict validation yet (optional feature).                 |

_(This is a partial illustration; the real matrix in code covers many more line items.)_

By systematically implementing this matrix, our platform acts as a compliance assurance tool. Users can see which regulations are fulfilled for each product, and where gaps exist, often with suggested fixes. This reduces risk and effort for companies, essentially automating a large part of the compliance officer’s job within the product passport workflow.

### 3.4 Industry-Specific Standards

Different sectors have additional standards or best practices, and our platform adapts accordingly:

-   **Electronics & ICT**: We’ve covered RoHS, WEEE, Battery, etc. Additionally, we consider IEC 62321 (testing for restricted substances), IPC-1752A (material declaration format) – our data model can ingest IPC-1752A XML/JSON from suppliers to fill the substances list automatically. Also for ICT products, Energy Star or the EU Energy Label are relevant. We capture `energyEfficiencyClass` for devices with energy labeling requirements and ensure it’s displayed, though the actual label image might be a document link.

-   **Textiles & Apparel**: Key concerns are chemical safety (e.g., REACH applies for dyes, etc.), and new EU Textile Strategy requirements (like a DPP for textiles by 2027). Also standards like OEKO-TEX 100 (for harmful substances in fabric) and Global Organic Textile Standard (GOTS) for organic fibers.
    -   **Integration**: For a clothing product, we have fields like `materialComposition` (with specifics: cotton, polyester, etc.), and `certifications: { oekotex: true, gots: true }` if applicable. Also possibly a field for `deforestation-free` if materials like viscose are used (tie-in to EUDR – EU Deforestation Regulation – for textiles like leather, rubber).
    -   **Validation**: If a claim like "organic" is made, we require a certification reference (so we might require `certifications.gotsCertId` if they set an organic cotton content). We also include a `care & repair` information field as might be required (ESPR textile delegated act likely will require info on how to repair / number of washes, etc.). The platform’s flexibility allows adding those fields when they become defined.

-   **Food & Beverage**: Focus on traceability and safety. For example, a food product might need a `batch/lot` number and `expiry date` recorded, and possibly a link to where the ingredients were sourced (to address things like the EU’s new rules on deforestation for commodities, etc.).
    -   **Integration**: We have `batchNumber` and `expiryDate` fields for products if they are in scope (populated if a passport is batch-specific). We also consider GS1 EPCIS events for farm-to-store tracking; our `events` subcollection could store transformation events (e.g., slaughter, processing, etc. for food).
    -   **Sustainability**: ISO 14067 again for carbon footprint (food often has high carbon footprint), and possibly water footprint (we might include a field for water usage if provided).
    -   **Validation**: For food, ensure `expiryDate` present for perishable goods. If labeled organic (EU Organic certified), require an organic certification ID in `certifications`. If any allergen or hazardous materials (food likely not, but packaging contacting food needs to be compliant as above), ensure flagged.

-   **Pharma & Medical Devices**: They have unique identifier requirements (like Serial numbers, UDI for devices).
    -   **Integration**: We support adding `identifiers.udi` for medical devices, and for pharma, capturing `drugCode` or other regulatory IDs if needed. Also track storage conditions or handling instructions as part of the passport.
    -   **Validation**: These sectors are heavily regulated but much info might already exist in other systems. Our passport can pull data from those (maybe via API integrations). Ensure if product is a med device, `identifiers.udi` is present and that a basic validity check on it passes (UDI has standardized formats). For medicines, ensure a batch and expiry exist and consider linking to the verification systems (we might store a flag if a pack is verified).

-   **Automotive**: If we had vehicles or parts, they have standards like Global Automotive Declarable Substance List (GADSL) for chemicals, and regulations like EU End-of-Life Vehicles (ELV) directive (which restricts lead, mercury similarly to RoHS). Our system, if used for auto parts, would reuse the same fields (RoHS fields cover ELV since they overlap, plus maybe an `elvCompliant` flag if needed). For circularity, Catena-X (an automotive industry network for DPP) – we can export/import data in their format too.

-   **Construction Products**: Under the Construction Products Regulation (CPR), DPPs might come for certain materials. They often use EPDs (Environmental Product Declarations).
    -   **Integration**: For a construction product, we’d ensure fields for EPD ID or link, and durability. We saw some building-specific ISO standards in the StandICT list (like ISO 21930 for EPDs, [standict.eu](https://standict.eu)). If our user base includes construction, we’ll incorporate those (like adding an EPD document link). The CPR’s DPP requirements (like maintain data 25 years, [cencenelec.eu](https://www.cencenelec.eu)) we would respect via our data retention policies.

As a dynamic platform, we continuously update the compliance matrix. Contributors adding support for a new regulation should update the `standardsMap` config and any needed new fields or validation function. We also keep an eye on the CIRPASS project outputs and CEN/CENELEC standards to align data formats with European standardization efforts so that our DPPs remain interoperable and machine-readable as required. In essence, the compliance matrix is baked into the platform’s DNA – it’s not just a document but active code enforcing these rules, making the DPP platform a one-stop compliance solution as well as a data repository.
