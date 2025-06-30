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

### ESPR (EU Ecodesign for Sustainable Products Regulation)

-   **Scope**: EU framework regulation that mandates DPPs and sets eco-design requirements for broad product categories ([gs1.eu](https://www.gs1.eu)). It’s the umbrella under which product-specific rules (Delegated Acts) will be issued.
-   **Integration**: Our entire platform is aligned to meet ESPR’s concept of a DPP: we capture comprehensive lifecycle data (materials, carbon footprint, etc.) and make it accessible via QR code, fulfilling ESPR’s transparency goals ([data.europa.eu](https://data.europa.eu)). We monitor new Delegated Acts; for example, if a Delegated Act for textiles requires a “recyclability score,” we add a field for that.
-   **Fields**: `materialComposition`, `recycledContent`, `durabilityScore`, etc., as required per category.
-   **Validation**: Ensures that all required data points for the product’s category (as per the Delegated Act checklist) are present. Also the platform can produce a Declaration of Conformity for ESPR using the filled data. (Since ESPR itself is high-level, much is handled in specific standards below.)

### EU Battery Regulation (Battery Passport)

-   **Scope**: Regulates batteries (in vehicles, electronics, etc.), requiring a Battery Passport with detailed info on battery materials, capacity, health, and recycling ([forrester.com](https://www.forrester.com)).
-   **Integration**: For products containing batteries, we include a nested battery passport schema.
-   **Fields**: `battery.type`, `battery.capacity`, `battery.materials` (with % recycled), `battery.serial` and a link to a Battery Passport record if it exists externally.
-   **Validation**: If `category=="battery"` or product has a battery, ensure fields like carbon footprint of battery, content of recycled materials, and battery health indicators are present. The platform can integrate with the EU Battery Alliance standards: e.g., generating a Battery Passport ID, and even connecting to the Global Battery Alliance data if available. We also ensure Annex XIII info like carbon footprint data is included (we have `carbonFootprint` field for that) ([forrester.com](https://www.forrester.com)).

### EU Packaging & Packaging Waste Regulation (PPWR)

-   **Scope**: Upcoming regulation addressing packaging recyclability and recycled content.
-   **Integration**: We capture packaging info for each product.
-   **Fields**: `packaging.material` (e.g., cardboard, plastic type), `packaging.weight`, `packaging.recycledContent%`, `packaging.recyclable` (boolean or percentage recyclable).
-   **Validation**: If product has separate consumer packaging, ensure it’s documented. The rule might say “all packaging must be >50% recyclable by 2025”, so we enforce a check like `packaging.recyclable == true` or certain recycled content thresholds. Also, if any packaging contains plastics, require a recycling label field.

### WEEE (EU Waste Electrical & Electronic Equipment Directive)

-   **Scope**: Requires proper labeling and information for e-waste handling (for electronics).
-   **Integration**: We include an `endOfLife` section with disposal instructions.
-   **Fields**: `documents.userManualURL` (manual contains WEEE info), `endOfLife.recyclingInstructions` (text or link describing how to dispose or recycle the product).
-   **Validation**: For electronics, ensure we have a disposal instruction and perhaps a flag that the product is marked with the WEEE bin symbol (this could be a boolean `weeeLabelPresent`). If not present, we warn that it’s required for electronics sold in EU.

### EUPC (EU Plastic Content & Recycling initiatives)

-   **Scope**: Various EU initiatives to increase recycled plastic content (for example, in packaging, bottles, etc.).
-   **Integration**: If applicable (e.g., for packaging or product is plastic), we have the field `recycledContent`.
-   **Fields**: `recycledContent` percentage by weight for overall product or specific components.
-   **Validation**: Check against targets (like certain products must have X% recycled plastic by certain year) – these can be updated in rules config. Non-compliance might not block passport creation but could flag in the ESG report.

### Product Environmental Footprint (PEF)

-   **Scope**: The EU PEF is a methodology (not a single standard, but a framework for calculating lifecycle environmental impact).
-   **Integration**: We can store a product’s carbon footprint (CFP) as per ISO 14067 / PEF, as well as possibly other impact categories if provided.
-   **Fields**: `carbonFootprint` (in kg CO₂e for the product’s life or per declared unit), and possibly a link to a full EPD (Environmental Product Declaration) document if available.
-   **Validation**: If `carbonFootprint` is provided, ensure a methodology field (like "ISO 14067") is noted to make it credible. We allow integration with carbon footprint tools (e.g., an API could fill this field). No strict validation threshold here (since footprint is a measured result), but presence might be required in some Delegated Acts – we enforce presence if mandated.

### ISO 14067 (Carbon Footprint of Products)

-   **Scope**: International standard for quantifying a product’s greenhouse gas emissions over the lifecycle ([standict.eu](https://standict.eu)).
-   **Integration**: We use ISO 14067 as the guideline for our `carbonFootprint` field.
-   **Fields**: `carbonFootprint` (value), `carbonFootprintScope` (scope or boundaries if known, e.g., cradle-to-gate), `carbonFootprintMethod` (e.g., "ISO 14067" or "GHG Product Standard").
-   **Validation**: Ensures the footprint value is non-negative and if provided, the method is specified (to avoid numbers without context). We also might validate unit (must be in kg CO₂e). This is mostly an informational field; quality of data depends on user input or integration with LCA software.

### DIN EN ISO 22095 (Chain of Custody)

-   **Scope**: An international standard (ISO 22095:2020, adopted as DIN EN in EU) defining chain-of-custody models for materials (identity preserved, mass balance, etc.) ([cencenelec.eu](https://www.cencenelec.eu)).
-   **Integration**: This comes into play for recycled content and material traceability. We let users specify which CoC model they are using for any sustainability claims.
-   **Fields**: `chainOfCustodyModel` (enum: e.g., "MassBalance", "IdentityPreserved", etc.), possibly per material.
-   **Validation**: If a product claims recycled content or certain sourcing, we require a CoC model declaration to ensure transparency. For instance, if a plastic component is said to be “30% recycled via mass balance”, we expect `chainOfCustodyModel = "MassBalance"`; if they claim identity preserved recycled content, we might expect evidence (like a certificate reference). The system doesn’t verify the claim independently, but including this is aligned with standards and could be shown on the DPP for credibility.

### Circular Economy & Durability Standards

-   **Scope**: e.g., EN 45554 (methods for assessing the ability to repair, reuse, upgrade products) or upcoming EU durability scoring.
-   **Integration**: Provide fields for repairability scores or durability metrics if applicable.
-   **Fields**: `repairabilityScore` (say out of 10), `expectedLifespanYears`.
-   **Validation**: Not strictly validated against external source yet (since scoring is done externally), but if an EU delegated act says “must display repairability score”, we ensure the field is present.

## 3.2 Chemical & Safety Regulations

These are critical for product compliance, ensuring products do not contain or emit harmful substances:

### REACH (EC 1907/2006)

-   **Scope**: EU regulation on chemicals; for products (articles), key part is requiring notification if any Substance of Very High Concern (SVHC) is present above 0.1% w/w. Also restricts certain substances via Annex XVII.
-   **Integration**: We maintain a list of SVHCs (regularly updated from ECHA).
-   **Fields**: `reachSVHCDeclaration` (boolean if SVHC threshold exceeded and reported), and possibly a list `substances[]` with any SVHC name and % if present. We also allow storing a `scipReference` if the product was registered in the SCIP database (which is required for those SVHC cases).
-   **Validation**: When product materials are listed, our compliance module checks each against the SVHC list. If any substance amount >0.1%, then `reachSVHCDeclaration` must be true and `scipReference` provided – otherwise we flag non-compliance ([digiprodpass.com](https://digiprodpass.com)). If a banned substance (Annex XVII) is present above allowed concentration, we similarly flag it (e.g., cadmium above 0.01% in plastic is banned). The AI may also assist by reading ingredient lists if given in text and identifying known chemicals of concern.

### RoHS (2011/65/EU and updates)

-   **Scope**: Restricts hazardous substances in electronics (currently 10 substances, including lead, mercury, cadmium, PBDEs, etc., with specific max concentrations like 0.1% or 0.01% for cadmium).
-   **Integration**: We include a field `rohsCompliant` (boolean). Optionally, a detailed breakdown of restricted substances content can be stored (similar to SVHC list).
-   **Fields**: `rohsCompliant`, and if not, perhaps `rohsExemption` (some products have exemptions for certain applications).
-   **Validation**: If category is electronics (or any product with electrical components), `rohsCompliant` must be true to be sellable in EU. If false, we mark product as non-compliant. We could integrate the open source IPC-1752 declarable substances database or require the user to confirm compliance. We know from the data if, say, `leadPercent` field is present, to compare with 0.1%. But often we rely on a yes/no declaration plus maybe upload of a compliance certificate. Our system will warn if the user leaves it false or blank. (The Forrester example we saw confirms DPP should include compliance docs like these ([forrester.com](https://www.forrester.com)).)

### SCIP Database (EU Waste Framework Directive)

-   **Scope**: Database where companies must submit info on articles containing SVHCs >0.1%.
-   **Integration**: We don’t run SCIP, but we help facilitate it.
-   **Fields**: `scipReference` (the unique ID or number from the SCIP submission) and possibly `scipStatus` (submitted/pending).
-   **Validation**: If `reachSVHCDeclaration` is true, we expect a `scipReference`. While we cannot verify the reference ourselves without ECHA’s system, the presence of an ID indicates the manufacturer has done their duty. We also include in the DPP a note “SVHC present above threshold; info available in SCIP #XYZ” for transparency.

### California Proposition 65

-   **Scope**: California regulation requiring warning labels if products contain any chemicals known to cause cancer/reproductive harm above safe harbor levels.
-   **Integration**: This is a global standards example beyond EU. We include a Prop65 flag and list of substances if applicable.
-   **Fields**: `prop65WarningRequired` (boolean), `prop65Substances[]` (list of chemicals triggering it, if any).
-   **Validation**: We maintain a list of Prop65 substances (overlap with many others). If a product is shipping to the US and contains these, we flag to user that a Prop65 warning may be required. This is more of an advisory compliance: our platform might not block product creation, but it will note in the compliance report.

### US Toxic Substances Control Act (TSCA)

-   **Scope**: U.S. regulation requiring certain substances in products to be reported or prohibited.
-   **Integration**: Not deeply integrated, but as a placeholder, we could have a `tscaCompliant` flag or ensure chemicals used are on the TSCA inventory.
-   **Fields**: Potentially none by default; could be added case-by-case.
-   **Validation**: If a company indicates US market, we might cross-check their chemical list vs known TSCA restrictions.

### EU Toy Safety Directive (2009/48/EC)

-   **Scope**: Ensures toys meet chemical and physical safety standards, including limits on certain elements (like lead, cadmium migration limits), and requires a Declaration of Conformity and CE marking.
-   **Integration**: If category is “toy”, our system expects certain tests to be done.
-   **Fields**: `ceMarked` (bool), `conformityDocUrl`, and possibly fields for specific content like "phthalateFree" or "EN71TestsPassed".
-   **Validation**: If toy, must have `ceMarked=true` and a reference to a DoC. The actual test results for chemicals might not be stored, but a general compliance boolean for each relevant hazard could be (like `formaldehydeCompliant=true` if a wooden toy with formaldehyde limit).

### Food Contact Materials Regulations (EU and FDA)

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
