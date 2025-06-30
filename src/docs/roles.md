# 8. Real-World Use Cases by Sector

To illustrate the versatility of our DPP platform, let's consider how it applies to different product sectors. In each of these use cases, the core platform is the same, but certain data fields, compliance checks, and workflows are tailored to the sector’s needs. The system adapts per sector primarily through configuration (which fields and standards are active) and sometimes through custom prompt tuning for AI (focusing on what matters for that product).

## 8.1 Electronics & ICT

**Example: Smartphone (EcoSmart Phone X) – an electronic device.**

**Passport Data**: The passport for a smartphone includes detailed component information and regulatory compliance:

-   Battery details (capacity in mAh, chemistry, recycled content) because of Battery Regulation.
-   Material composition (metals, plastics, glass percentages).
-   Energy efficiency (if applicable, e.g., for a charger or a computer we’d have energy consumption metrics).
-   Repairability score or availability of spare parts (especially with right-to-repair laws emerging).
-   Software support period (maybe not a legal requirement yet, but some companies include this to show longevity).

**Compliance Focus**: Electronics must meet RoHS, WEEE, often REACH, and if wireless, maybe FCC/RED (radio equipment directive in EU, but that’s more technical compliance not usually in DPP scope beyond maybe listing the CE marking).

-   Our system ensures the phone has `rohsCompliant=true` and that hazardous substances fields are provided. If the phone had, say, a lead solder, the compliance check would flag it.
-   For WEEE, the passport’s `endOfLife` section instructs the user not to throw it in trash and maybe includes the WEEE bin symbol in the user manual (which is referenced).
-   REACH: If any part (like maybe an LCD display with certain chemicals) had SVHC above threshold, it would be declared.

**AI Adaptation**: The AI summary for a smartphone might highlight things like “This phone is made with X% recycled aluminum and comes with an energy-efficient charger” – focusing on materials and energy.

-   ESG scoring for electronics will often ding if there are critical minerals with social risks (our prompt might consider if cobalt or lithium sources are known; if not in data, the AI may mention generic risk or improvements).
-   Regulatory reasoning AI might note if something like battery capacity triggers transport regulations (though that’s outside DPP typically).

**User Journeys**:

-   **Consumer**: Scans phone’s QR on the box in a store: sees that it’s RoHS compliant, maybe a comparison of carbon footprint with industry average (if our system or AI provides context like “14.2 kg CO2e, which is 10% lower than average smartphones”).
-   **Service/Repair**: A technician might scan the QR to quickly get device info and repair guides (if we include or link to them). The DPP could eventually log that a repair was done, updating the passport (which then would update the blockchain hash, etc.).
-   **Recycling Center**: Scans it at end-of-life, sees what materials it contains (so they know if it has valuable metals or hazardous components like a Li-ion battery to remove). Possibly uses an app that integrates with our API to fetch the material breakdown.

**Platform Adaptation**:

-   The compliance matrix for electronics includes a broad set of standards (as we listed). Our UI might show an “Electronics Passport” template which explicitly asks for those fields when creating one (like a form pre-set for electronics).
-   Some fields not relevant to electronics would be hidden (e.g., if it’s not a food product, you won’t see fields for allergens). The system can do this by category.
-   The AI prompt templates might check if `category` is `electronics` and then include specific prompts like asking about e-waste or conflict minerals.
-   **Integration**: We might tie with external electronics databases. For instance, if the phone’s parts are documented in BOM format, we could import that CSV/Excel to fill `materialComposition` automatically rather than manual input.

## 8.2 Fashion & Textiles

**Example: Recycled Denim Jeans (Acme Eco Denim) – a piece of apparel.**

**Passport Data**: For clothing, key information includes:

-   Material composition (e.g., 70% cotton, 30% recycled polyester). Textiles often have blends, and the passport should list all fibers.
-   Sourcing info: Where was it made (country of manufacture), and possibly where raw materials came from (cotton from India, for example, which might matter for organic or labor standards).
-   Certifications: If the jeans are organic (GOTS certified cotton) or Fair Trade, those certificates are noted in the passport.
-   Care instructions and expected lifetime: A unique thing for textiles, ESPR might require durability info (like number of washes the item can endure, etc.). We could include `expected lifetime washes` or warranty if any.
-   End-of-life: e.g., whether the item is recyclable or if there’s a take-back scheme (some brands offer recycling of old clothes).

**Compliance Focus**: Textiles have some new regs emerging:

-   Likely an upcoming EU Textile DPP will require disclosing presence of certain chemicals (dyes, etc.), a garment’s recyclability, and possibly a unique product identifier.
-   Chemical safety: AZO dyes restrictions, etc. Our system might track if any restricted dye or chemical treatment was used (through a field or a simple declaration of compliance with REACH for textiles). There’s also the EU POPs Regulation if certain flame retardants were present (mostly for furniture but could apply to coated textiles).
-   Product labeling laws: e.g., fiber composition is legally required on labels (EU Textile Regulation) – our passport has it anyway. Care symbols per ISO standards – not exactly DPP, but we could embed the care instructions.
-   Environmental: If these jeans are to comply with France’s AGEC (which demands an environmental score on label, like an A-E rating for clothing), we could include that rating if available.
-   Circularity: Possibly a requirement to disclose if the item is recyclable or contains recycled content (e.g., 30% recycled polyester is a selling and compliance point in future).

**AI Adaptation**: For fashion, the AI summary might focus on ethical and environmental aspects:

-   “These jeans are made with organically grown cotton and recycled polyester, reducing waste and pesticide use. Manufactured in a factory running on renewable energy, they are designed to last, and you can bring them back for recycling to keep materials in use.”
-   ESG scoring in fashion might consider social factors more (worker conditions, etc.). If the data included a certification like Fair Trade, the AI could boost the social score. If not, it might point out unknown supply chain transparency.
-   The regulatory reasoning AI might cover things like: “Does it comply with EU eco-design for textiles?” If a delegated act says must be easily recyclable, and these jeans have metal rivets that complicate recycling, the AI might note a potential issue (if it had that knowledge).

**User Journeys**:

-   **Consumer at store**: Scans the NFC tag on the jeans (some brands embed NFC in luxury fashion or a QR on the tag). They see material content, maybe an explanation “30% recycled polyester means this product saved X bottles from landfill” – something AI could add in summary.
-   They also see care tips (“Wash cold to save energy, this garment is made to be repaired, etc.”). Possibly a link to request repair or new buttons (some circular initiatives do that).
-   **Brand sustainability team**: They use the system to input new season products. If certain styles differ only in color, they may clone passports and just change color (our UI could allow duplication for similar products to save time).
-   **Second-hand resale**: A reseller might scan the code to verify authenticity (blockchain check helps ensure it’s genuine if the brand anchored it, although physical item could be counterfeit with a copied code – that’s a challenge outside our scope, but if they used NFT with cryptographic chip, then authenticity could be verified; again, future possibility).
-   **Recycling sorter**: They scan at a sorting facility to see what fibers it’s made of. If it’s a blend, maybe that directs it to a certain recycling stream (e.g., mechanical cotton recycling vs thermal recovery).

**Platform Adaptation**:

-   Fields specific to fashion: We might add size or color for completeness (not needed for compliance, but for identification if user scans multiple similar items).
-   The compliance matrix enables OEKO-TEX standard or others; our platform might integrate with that by letting the brand attach their OEKO-TEX certificate or at least mark that it’s compliant (giving consumers confidence the garment is free of harmful chemicals).
-   The AI prompts might incorporate if `category=textile` to mention things like water usage if known, or microplastics release if there’s polyester ([digiprodpass.com](http://digiprodpass.com)).
-   Also, our platform might soon integrate with Circularity.ID or EON (some industry consortium solutions for fashion DPP). If needed, we could ingest/emit data in their format.

## 8.3 Food & Beverage

**Example: Organic Chocolate Bar (ChocoDelight 70% Dark) – a food product.**

**Passport Data**: For a food item, especially one marketed on sustainability:

-   Ingredients list and sourcing: e.g., Cocoa (origin: Ghana, Rainforest Alliance certified), Sugar (EU beet sugar, organic).
-   Nutritional info (though that’s usually on the physical label by law, might not be needed in DPP unless for consumer info completeness).
-   Expiration date or production date (if the passport is per batch, which likely it is; food passports might be batch-level rather than item-level due to volume).
-   Packaging details: a big deal because packaging waste is an issue. E.g., wrapper is plastic film (not recyclable?), or paper (recyclable), etc.
-   Carbon footprint or environmental impact: some companies now put carbon labels (e.g., “CO2e per bar = 2.5 kg”). If available, we include that.
-   Certifications: Organic (EU organic label), Fair Trade or similar for cocoa, UTZ/Rainforest, etc., Non-GMO if in US, etc.

**Compliance Focus**:

-   Food has strict safety regs, but those are more about health (which might not all surface in a DPP except maybe allergen info).
-   Possibly relevant are EU Deforestation Regulation for cocoa: it will require proof that commodities (like cocoa) are not from deforested land post-2020. This could mean the passport might need a statement or reference to a certificate for deforestation-free origin. The platform could have a field `deforestationCompliant` or an attached geo-verification proof.
-   Traceability: In EU, General Food Law requires one step up/one step down traceability. Some are pushing for more transparency to consumers. DPP could voluntarily show where the cocoa came from (farm cooperatives).
-   Packaging: upcoming EU rules require certain % recycled content in plastic packaging by year, etc. If that chocolate’s wrapper uses 30% recycled plastic, we include that.
-   Labeling compliance: e.g., EU 1169/2011 for ingredient and allergen labeling – in DPP context, maybe not mandatory to repeat since it’s on pack, but we might still list ingredients and highlight allergens.
-   If it’s a cross-border product, listing compliance such as FDA approvals or Halal/Kosher certifications might be relevant to certain markets – we could allow listing those in passport (for consumer trust).

**AI Adaptation**:

-   Summary for chocolate: “This organic dark chocolate bar is sourced from Rainforest Alliance Certified farms, ensuring sustainable agriculture practices. Packaged in recyclable paper and compostable film, it aims to minimize waste ([data.europa.eu](https://data.europa.eu)). Enjoy a product that supports farmers and biodiversity.”
-   The AI might need to consider health aspects carefully – not to make any nutritional claims beyond what’s factual. We likely focus on sustainability and ethical aspects in summary.
-   ESG scoring: Environmental might be moderate due to agriculture (the AI might consider land use, but if it knows it’s organic, it might give a credit; Social gets points if fair trade; Governance if the company is transparent).
-   Regulatory reasoning: If asked “Does this product meet EU regulations?”, the AI would confirm that it has proper organic certification (assuming a field indicates that) and that packaging meets upcoming requirements, etc., or flag if sugar content triggers any upcoming taxes (beyond scope likely).

**User Journeys**:

-   **Consumer in store**: Scans a QR on the shelf label or packaging. Gets info like origin of cocoa, possibly a map, and reassurance of certifications. They also see “Best before: date” to confirm freshness (though it’s on pack, digital could help if pack is gone).
-   Also disposal info: e.g., “Wrapper is compostable, please dispose in compost bin” which is increasingly common and can be in DPP for clarity.
-   **Retailer/Distributor**: They might use DPP internally to verify claims. For example, a retailer in France might use the data to feed into their own app or to ensure the supplier provided necessary info for regulatory reporting (like they need to report packaging materials for Extended Producer Responsibility).
-   **Regulator or Auditor**: Could scan and check if the product has the required documentation (like organic certificate number, etc.). If integrated, they might have access to a deeper view or link to official databases (maybe our passport could link to the entry in EU organic certification database).
-   **Recall scenario**: If a safety issue arises (say a batch contaminated), the DPP could be updated with an alert or status `recall`. This is an interesting potential: A field `recalled: true` and message could be added and anchored, so anyone scanning sees “DON’T CONSUME – recalled”. That’s not in original spec but something a digital system could do beyond static labels.

**Platform Adaptation**:

-   We may use batch-level passports for food. The product ID might represent a batch rather than a single item (since individually QR coding every chocolate bar might not be practical, but QR per batch on box or shelf could work). Firestore can handle that – either way, our model can accommodate batch info and volume.
-   Fields like `ingredients` (array of `{name, percentage}`) could be included if desired to show composition (though not mandated by DPP, but helpful).
-   The compliance matrix for food could include ISO 22000 or HACCP, but those are processes not data fields. Instead, we might just note if the manufacturer is ISO 22000 certified in the passport.
-   If we target packaging info, ensure to have fields for that as we do.
-   Our QR might often be on outer packaging rather than individual, but as long as the code can be scanned at the point of sale or by consumer, it’s fine.

## 8.4 Pharmaceutical & Healthcare

**Example: Medicine Bottle (PainAway 200mg Tablets) – a pharmaceutical product.**

**Passport Data**: A medicine would have:

-   Product details like active ingredient (e.g., Ibuprofen 200mg), dosage form, strength.
-   Manufacturer and batch number, manufacturing date, expiry date.
-   A unique identifier (in EU, each pack has a 2D DataMatrix with a code that includes a product code, serial number, lot, expiry — mandated by the Falsified Medicines Directive).
-   Perhaps storage conditions (store below 25°C).
-   For a DPP, sustainability info might not be primary, but increasingly pharma looks at eco-impact (like some medicine packaging have take-back instructions).
-   The platform could track if packaging is recyclable, if the drug has any environmental hazard (like some pharma are considering environmental risk of API in water).
-   Also, instructions for disposal (e.g., “Don’t flush unused meds; return to pharmacy”).

**Compliance Focus**:

-   Pharma is heavily regulated: FMD (EU 2011/62) requiring serialization (our passport might incorporate or link to that serial verification—though normally you verify via a separate system, not through product info).
-   Regulatory filings: not in DPP, but maybe the passport can link to the public assessment report or something for prescription drugs (like an FDA or EMA document).
-   If considered, we might mention if the product is compliant with certain pharmacopeia standards, but that’s deep technical detail probably not in a consumer-oriented passport.
-   Environmental aspects: EU is starting to ask pharma to consider environmental impact of medicines (like in Sweden there’s a program to label environmental info of drugs). Our system could include a field for “API environmental classification”.
-   However, given DPP is more about circular economy, for pharma it might emphasize packaging and waste handling. E.g., is the bottle recyclable? We include that info.

**AI Adaptation**:

-   Summary might be very simple and careful: “This medicine is produced by XYZ Pharma in {country}. The packaging is 100% recyclable plastic ([cencenelec.eu](https://www.cencenelec.eu)). Please follow local guidelines to dispose of unused medicine safely.” We avoid any medical claims beyond what's allowed (the AI must not generate unapproved uses or efficacy statements).
-   ESG scoring for a pharma product is tricky because social (access to medicine, etc.), but the AI could try, focusing on manufacturing quality or if the company has certain ethics programs (not usually in product data though).
-   Regulatory Q&A AI might not be used much here publicly, because only authorized info should be shown. But internally, maybe a quality team might ask AI: "Does this product meet all packaging waste regulations in EU?" and it could analyze packaging fields and say yes/no.

**User Journeys**:

-   **Patient/Consumer**: Scans QR on the medicine box (if we put one, which currently is not standard, but could be in future as part of DPP). They get confirmation it's authentic (perhaps by cross-checking the serial via our chain or linking to the national verification system). They also get information like “Manufactured on 2025-01-01 by XYZ in France, under GMP conditions” – but we must not confuse with official drug info. Perhaps more relevant is showing them the leaflet digitally (a link to PDF of instructions).
-   Also how to dispose packaging and any unused meds.
-   **Hospital or Pharmacy**: They could scan to quickly see product info (though they usually rely on internal databases). If our platform integrated with a hospital's inventory system, a scan could log something or verify authenticity quickly via our API.
-   **Regulator or Recall**: If a batch is recalled, having a DPP that can instantly inform a scanner “This batch was recalled” is valuable (like the recall scenario described for food, similarly for pharma). The DPP could be updated to reflect that status.

**Platform Adaptation**:

-   Likely, pharma DPPs might not be a near-term use-case mandated by law (since they have separate regimes), but if a company voluntarily uses it for sustainability, we adapt by focusing on packaging info and manufacturing info.
-   We would store `batchNumber`, `expiryDate` as we have in model, and also `identifiers.serialNumber` for serialization. This serial might actually be the one on each pack; that’s a very granular level, not sure if DPP should go that far (scanning a serial and checking blockchain could be a new way to verify authenticity bypassing the official European Medicines Verification System, but likely that stays separate due to legal oversight).
-   If needed, our system could integrate with EMVS via an API to check if a serial is valid/dispensed, but that’s a complex integration beyond our scope for now.
-   For now, our usage in pharma might be more internal (for environmental reporting to authorities about packaging, for example, or to communicate to patients how to recycle blister packs etc.).

Across these sectors, one can see the flexibility of the platform. The data model is broad enough to accommodate domain-specific fields, and the compliance engine can toggle which rules apply based on product category or tags. The AI can tailor its output by recognizing the category and focusing on relevant aspects (which we can enforce by including category-specific context in prompts). The real-world examples also show that user expectations differ: a fashion consumer cares about different info (materials, labor ethics) than a pharma consumer (safety, authenticity, disposal). Our platform’s job is to support all, delivering the info relevant to that audience through the same underlying infrastructure. We likely will build out a library of sector templates so when a new product is created, the user selects “Electronics” vs “Textile” vs “Food”, and the UI/fields adjust accordingly. Under the hood, that selection might just set the category field which our code uses to check which standards and fields to enforce. In summary, the platform’s architecture and design are validated by these examples: it’s capable of handling very different requirements by configuration rather than fundamental changes, confirming our goal of a universal DPP service that can become the "Stripe of DPPs" for any product type.

# 9. User Journeys

Our platform serves a variety of user types, primarily falling into two groups: Enterprise customers (large organizations with existing systems and complex needs) and SME/Startup/Midmarket customers (smaller companies or new ventures who need quick, low-code solutions). We design user journeys to cater to both, ensuring that each type of user can easily onboard and get value from the DPP platform.

## 9.1 Enterprise Integration

For enterprise users (e.g., a global electronics manufacturer or a major apparel brand), the key is integration and scalability. They likely have existing ERPs, PLM (Product Lifecycle Management) systems, compliance databases, etc., and they have hundreds or thousands of products. 

**Onboarding for Enterprise**:

-   Typically begins with a solution architect or IT team engaging with our platform. They might use our API keys and documentation to integrate DPP creation into their product launch process.
-   Enterprises often prefer single sign-on (SSO) – we support SSO (SAML/OAuth) so their employees can log into our Admin Portal using corporate credentials.
-   An enterprise might set up multiple user roles: e.g., “Product Manager” role can create/edit passports, “Compliance Officer” role can review/approve them, “Viewer” role for general viewing.

**Integration Points**:

-   **ERP/PLM Sync**: The enterprise can use our API to automatically create a passport whenever a new product record is created in their system. They might map fields: e.g., product name, SKU, BOM data flows into our API calls. If they have an SAP or Oracle system, they may script an export or use a middleware (like Mulesoft) to transform and push data to us.
-   **Batch Operations**: Enterprises may ingest or update many products at once. We offer batch API or CSV upload via the portal for initial seeding. For example, uploading a spreadsheet of all products with key fields to generate draft passports en masse.
-   **Webhooks to ERP**: When our system generates new info (like an ESG score) or flags compliance issues, a webhook can notify their system. Maybe it opens a task in their internal compliance workflow or sets a flag in their database that a product is pending attention.
-   **Customization**: If enterprise needs custom fields beyond standard, our flexible schema can allow extra metadata. We might not want to change Firestore schema per client, but we can have a generic `attributes.extra` map to store any client-specific data.

**Admin Portal (Enterprise view)**:

-   The admin web UI for enterprise allows them to see a dashboard of all their products with status (e.g., 100 active, 5 with issues, etc.).
-   They can filter by division or product line.
-   Possibly they have an approval workflow: e.g., a passport in “draft” created by an engineer needs a compliance manager to mark “approved for publish”. Our system can facilitate that (maybe by a field or separate collection of approvals). When approved, then trigger blockchain anchoring etc.
-   The portal might also show analytics: e.g., how many scans of their product QRs happened (if we track and report that), which could be valuable marketing data.

**Role of AI in Enterprise journey**:

-   Enterprises might use AI to reduce workload: e.g., automatically generating first drafts of sustainability text for all products. They could have a page listing AI suggestions, which a person then approves or tweaks.
-   Regulatory reasoning AI might help their compliance team. They could query the system: “List any of our products that might violate upcoming Battery regulation because they contain batteries above X weight but lack information Y.” If the AI is integrated into queries (this is more advanced, but possible if we allow natural language queries against the dataset and rules), it could answer or at least identify candidates.

**Example Flow (Enterprise)**:

A large electronics company launches a new laptop:

1.  Their PLM triggers a `POST /products` with initial data (from BOM, etc.) to our API.
2.  Our system creates the passport, runs AI, etc. Meanwhile, on their side, the PLM gets a webhook `product.published` after a couple of minutes with the new passport ID.
3.  The compliance officer gets an alert (maybe via email or in their system) that a passport is ready for review. They open our portal, see the AI’s ESG summary and compliance checklist. They might upload a missing document (DoC) and then click “Approve & Publish”.
4.  The passport is already on chain (if auto-anchored on creation) but could be held as draft until approval if they wanted that control — we can configure that.
5.  At distribution, they print the QR from our system (or we provided the QR data to their label printing system) onto product boxes.
6.  Post-launch, they use our analytics to see that in the first month, 500 consumers scanned the code and spent an average 1 minute on the page — good engagement metrics which they use in sustainability reporting (“500 consumers accessed product passports”).
7.  Six months later, a new regulation or requirement arises (say they need to add repair score). They update that field via API for all applicable products. Our compliance module now marks them compliant for that new rule.

In enterprise journey, a key concern is data confidentiality and reliability:

-   They may ask: is our product data safe? We emphasize our cloud security, encryption at rest, etc., and the fact that only hashes (not the data) go on public chain.
-   They also need uptime and support SLAs, which we provide (with monitoring and possibly dedicated instances for very large clients to handle load).
-   We often simulate that our platform is invisible to the end consumer (white-label). Enterprises might integrate the DPP into their own app or site. We allow that by API or by customizing the appearance of the public passport page with their branding (maybe our portal allows them to add a logo or color scheme for their product pages). That level of customization is important for adoption by big brands.

## 9.2 SME/Startup Onboarding

For smaller companies or startups, the appeal is ease of use and low-code/no-code onboarding. They might not have an IT department to integrate via API. They need a solution out-of-the-box where they can manually or semi-automatically create product passports.

**Onboarding for SME**:

-   Likely through our web portal. They sign up with an email (or using Google account, etc. – we support social logins to reduce friction).
-   We may provide a guided wizard: e.g., “Create your first Digital Product Passport in 5 steps.” The wizard asks:
    1.  Basic product info (name, category, maybe upload a photo).
    2.  Sustainability info (materials, any eco certifications, etc.) with friendly UI elements (like dropdowns for material type, checkboxes for compliance declarations).
    3.  Upload relevant documents (they can drag-and-drop a PDF of their compliance cert or user manual).
    4.  Review AI-generated summary and score (the wizard could show “Our AI suggests this summary for your product. [Edit if needed]”).
    5.  Confirm and publish – then it generates the QR code for them to download or print.
-   This wizard approach does not require coding. It's very much akin to how one would create a product listing on an e-commerce site.
-   If the SME has data in spreadsheets, we might allow a quick CSV import. For instance, a sustainable fashion startup might import a CSV of their inventory with columns for material, etc. Our system then creates passports for each.

**Dashboard for SME**:

-   After initial setup, the dashboard shows all their products with status (maybe a checklist like “4/5 compliance fields filled” to prompt them to complete everything).
-   It might also have a section “Insights” where our AI or analytics gives suggestions, like “Product A has no end-of-life info, consider adding recycling instructions to improve consumer perception” – more of a coaching functionality.
-   For midmarket (slightly larger SMEs), they might still integrate a bit. For example, a midmarket company could use our Zapier integration to connect their Shopify store to our platform. When they add a new product on Shopify, a Zap could call our API (we’d provide a Zapier app perhaps) to create a DPP. Or vice versa, when a DPP is created, Zapier could send the QR code image back to some database.
-   Low-code tools: We might provide a Google Sheets Add-on or similar. E.g., they maintain product info in a Google Sheet, and our add-on can sync it to our platform and generate links or QRs.

**Support and Guidance**:

-   SMEs might not know all regs. Our platform, through UI and AI, educates them:
    -   If they mark category “toy”, we might pop-up: “Ensure you have a CE mark and a safety certificate as toys are regulated. Need help? [link to resources]”.
    -   If they are selling in EU and mention a chemical, maybe a tip: “REACH requires notification if you use that chemical above 0.1%”.
-   These could be tooltips or an "Action Center" in the portal.
-   We possibly have an in-app chat or help center (to ask questions like “How do I find the RoHS directive?” where an AI chatbot could help, fine-tuned on our help content).

**Example Flow (SME)**:

A small eco-friendly detergent maker wants digital passports to stand out:

1.  The owner signs up on our website, chooses a plan (maybe a free tier for a few products, or they go for a paid plan if needed for blockchain writes).
2.  They use the wizard to create a passport for their detergent:
    -   They select category “Detergent/Chemical” which triggers fields like listing ingredients or a link to SCIP if applicable (detergents have to list certain info).
    -   They fill it out. The wizard might use lay terms (“Does your product contain any hazardous substances above 0.1%? [Yes/No]”), rather than expecting them to know what SVHC stands for.
    -   They upload their safety data sheet PDF in the documents section.
    -   The AI suggests a consumer-friendly summary about the product’s sustainability (e.g., “Our detergent is phosphate-free and the bottle is made of 100% recycled plastic!”). They tweak it to perfection.
3.  They publish and get a QR code. They then include that code on their product label (maybe printing new labels or adding a sticker).
4.  At a local store or farmers market, they have a sign “Scan to see our product’s eco passport!” which people do to verify the claims (e.g., indeed 100% recycled bottle, etc.).
5.  Over time, as regulations update or the company changes formula, they log in and update the passport accordingly (maybe new fragrance added that is allergenic, etc.). They appreciate that they can always keep info up-to-date.
6.  If they need to integrate later (say they get into a retailer that wants data in a particular format), the platform can export their product info in JSON or via API for that retailer.

**Midmarket differences**:

-   A midmarket might have a small IT team, so they use our API but in simpler ways:
    -   Possibly using our Postman collection to test and then writing a small script.
    -   Or they might just run periodic exports from their ERP and import to our system via CSV if API integration is too heavy.
-   They might have, say, 200 products. The UI can handle that, but we also ensure performance with pagination, filtering etc., in the webapp.

**Community and Help**:

-   We maintain documentation (like this guide, and a user-friendly version) to help SMEs understand concepts like blockchain or what each compliance means in plain language. Possibly an FAQ: “What is RoHS and why do I need to check it?” with answers.
-   There could also be a forum or community where users share best practices (though that’s more a business idea than technical spec).

**Pricing Consideration**:

-   Although not asked, often enterprise vs SME differ in pricing model. We might have:
    -   Free tier for up to X products or without blockchain (just generate passports but not anchored).
    -   SME tier $ per month includes Y products and moderate chain usage.
    -   Enterprise custom pricing.
-   This influences user journey: e.g., a free user might see “Upgrade to enable blockchain verification” in their dashboard if we restrict that on free.
-   We would incorporate those cues politely.

Our approach ensures that for SMEs, using the platform requires no coding skill and minimal effort, fulfilling the low-code promise. They can focus on providing the info they know about their product, and our system takes care of heavy lifting (AI to fill gaps, compliance checks to warn them, and tech like blockchain in the background). This way, even a founder of a 3-person startup can get a DPP up and running in an afternoon.
