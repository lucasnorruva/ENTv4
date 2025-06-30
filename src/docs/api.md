# 5. REST API & Webhook Specification

Our DPP platform offers a comprehensive RESTful API that allows external systems (client applications, enterprise software, mobile apps, etc.) to integrate with it. Through the API, users can programmatically create and manage product passports, retrieve passport data (for display or analysis), and subscribe to updates. We also provide a webhook mechanism to push notifications to client systems when certain events occur (e.g., passport created, updated, or verified). This section outlines the API endpoints, authentication, and webhook format in detail.

## 5.1 Authentication & Security

All API endpoints are secured to ensure that only authorized users (or systems) can access or modify the data:

-   **Auth Scheme**: We use Firebase Authentication JWTs (ID tokens) for user-scoped requests. Clients must include an `Authorization: Bearer <token>` header for endpoints that require identification. These tokens are verified by our Cloud Function (using Firebase Admin SDK) to extract the user ID and claims. For server-to-server integration (e.g., a company’s backend pushing many products), we support Service Account tokens or custom tokens that can be minted with limited scope.
-   **API Keys**: Optionally, we allow the use of API keys for simpler auth in server contexts. An API key is associated with a Firebase service account or a specific project and can be passed as `?key=<API_KEY>` for certain read-only endpoints. However, write operations require a user context (to tie to an owner).
-   **Authorization (Access Control)**: Once authenticated, access is controlled:
    -   **Multi-tenant separation**: Each request is associated with a company/user. A user can only act on resources they own. For example, `GET /products` will return only products where `ownerId` matches the user (unless the user has an admin role). Attempting to access another’s product by ID will result in `403 Forbidden`.
    -   **Roles**: We have roles like `admin`, `manufacturer_user`, `regulator` (read-only regulatory access). These roles might be assigned via Firebase custom claims. Certain endpoints (like a bulk export or compliance report for all products) might be limited to admin roles.
    -   **Data sensitivity**: Some data (like internal notes or full material formulas) might be marked as sensitive; even within a company, maybe only certain users (compliance managers) see it. The API may filter out fields based on roles. For now, assume all within the company have access; future enhancements could refine this.
-   Communication is over HTTPS (Firebase ensures this by default on Cloud Functions URL). We strongly encourage using the newest TLS versions for clients.
-   **Rate Limiting**: To prevent abuse, we implement basic rate limiting:
    -   Each API key or auth token is allowed X requests per minute (e.g., 100/min burst, with some leeway). This is implemented via a middleware or in-memory counter (or using Firebase’s usage quotas).
    -   If exceeded, endpoints return HTTP `429 Too Many Requests`.

## 5.2 Endpoints & Methods

Below is a list of the main API endpoints. The base URL for the API is, for example, `https://dpp-platform.web.app/api/` (if hosted on Firebase) or a custom domain `api.digitalpassport.com/v1/`. All endpoints listed are relative to the base.

### Product Endpoints:

-   `GET /products` – List all products for the authenticated user’s organization. Supports query parameters for filtering and pagination:
    -   **Query params**: `category` (filter by category), `status` (filter by status e.g. active/draft), `limit`, `offset` (for pagination).
    -   **Response**: JSON array of product objects (with possibly only summary fields for performance).
    -   **Example**: `GET /products?category=electronics&status=active` – returns all active electronics passports for that user.
-   `POST /products` – Create a new product passport.
    -   **Request body**: JSON object with product data. At minimum, it should include name, category, and any key attributes or compliance declarations available. (It can be partial; the product can start as a draft.)
    -   **Response**: `201 Created` with JSON of the created product (including its generated `productId`).
    -   **Behavior**: Triggers the async processes (AI, validation) after creation. The initial status might be “draft” or “processing” until those complete.
    -   **Example request body**:
        ```json
        {
          "name": "EcoSmart Phone X",
          "category": "electronics",
          "identifiers": { "gtin": "12345678901234" },
          "attributes": {
            "brand": "EcoSmart",
            "weight": 0.2,
            "materialComposition": [
               { "material": "Recycled Aluminum", "percentage": 20 },
               { "material": "Recycled Plastic", "percentage": 30 },
               { "material": "Virgin Plastic", "percentage": 50 }
            ],
            "originCountry": "DE"
          },
          "compliance": {
            "rohsCompliant": true,
            "reachSVHCDeclaration": true
          },
          "documents": {
            "declarationOfConformityURL": "https://docs.ecosmart.com/phoneX-doc.pdf"
          }
        }
        ```
-   `GET /products/{productId}` – Retrieve a specific product passport.
    -   **Response**: Full JSON of the product (all fields the caller is authorized to see).
    -   If the product is not owned by the caller (and the caller is not a regulator with access), returns 403.
    -   This is used by both internal systems and by the public product page (with some differences if public; see `/public` below).
-   `PUT /products/{productId}` – Update a product passport.
    -   **Request body**: JSON of fields to update (can be partial). We may restrict certain fields from change if already published (for example, once `rohsCompliant=true` was set and anchored, if someone tries to set it false, we might require special handling).
    -   **Response**: `200 OK` with updated product JSON.
    -   This triggers re-validation and possibly re-anchoring if important fields changed.
-   `DELETE /products/{productId}` – Delete a product passport.
    -   Typically, physical products shouldn’t be deleted if they were sold (and regulations may require retention of data for X years ([cencenelec.eu](https://www.cencenelec.eu))). So this is mainly to remove test data or drafts.
    -   We might disable deletion of active passports or only allow a “deprecation” where status is set to “inactive”.
    -   If allowed, `204 No Content` on success.
-   `GET /products/{productId}/verify` – Verify blockchain hash for the product.
    -   **Response**: e.g. `{ "verified": true, "onChainHash": "0xABCD...", "currentHash": "0xABCD...", "lastAnchored": "2025-06-01T12:00:00Z" }`.
    -   If not matched, `verified: false` and both hashes given for comparison. If product not anchored yet, it might return `verified: false` with `onChainHash` null or a message.
    -   **Note**: The public facing UI might not call this explicitly if the product data JSON already includes a verification stamp.
-   `GET /products/{productId}/events` – List lifecycle events (if we implement events subcollection).
    -   **Response**: array of events (e.g., manufacturing, repairs, etc.). This may be restricted or not used by all sectors.
-   `POST /products/{productId}/events` – Add a lifecycle event (could be restricted to certain roles or automated processes).
    -   E.g., when a recycler scans a product to mark it recycled, their system could call this endpoint to append an event.
    -   This would update the product (maybe setting status to “recycled”) and trigger a re-anchor of final state.

### Public Endpoints:

-   `GET /public/products/{productId}` – This endpoint is used to fetch product info without authentication, for consumer display. It returns a sanitized version of the passport (excluding any confidential fields).
    -   For instance, it will include sustainability info, materials, compliance statuses, but might exclude internal owner info or any economic data.
    -   It’s the endpoint the QR code actually points to. Alternatively, the QR might point to a web page which then uses this internally.
    -   We ensure no PII is exposed here. Also, if a product is in draft or flagged non-compliant, the public endpoint might either not show it or show a limited view (depending on config).

### User/Organization Endpoints:

-   `GET /users/me` – Returns profile info of the authenticated user (and their company info if applicable). Useful to retrieve role or company name to display in a UI.
-   `POST /organizations/{orgId}/users` – (If an admin invites a new user, etc. Out of scope for core DPP, but our platform likely has basic user management.)
-   `GET /standards` – Returns the list of standards/regulations supported (the compliance matrix entries). Could be used by front-end to show a compliance checklist UI. Not critical for API consumers, more for UI reference.

### Webhook Endpoints: These are for managing webhook subscriptions on our side:

-   `POST /webhooks` – Register a new webhook URL for the authenticated user’s organization.
    -   **Request**: JSON with `url` and list of `events` to subscribe to (if we allow filtering).
    -   E.g. `{ "url": "https://api.mycompany.com/dpp-webhook", "events": ["product.created", "product.updated"] }`.
    -   Our system will store it (likely in the user profile or a separate webhooks collection keyed by user/org).
    -   **Response**: `201 Created` with an ID or the webhook details.
-   `GET /webhooks` – List currently registered webhook endpoints for the org.
-   `DELETE /webhooks/{id}` – Remove a webhook.
-   We might also allow specifying a secret for webhooks (to sign the payloads) during registration for security.

### Examples:

#### Creating a Product – Request and Response:

```pgsql
POST /products 
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "EcoMax LED Bulb",
  "category": "electronics",
  "attributes": {
    "brand": "EcoMax",
    "powerRating": "9W",
    "materialComposition": [
      { "material": "Glass", "percentage": 50 },
      { "material": "Aluminum", "percentage": 20 },
      { "material": "Plastics", "percentage": 30 }
    ]
  },
  "compliance": {
    "rohsCompliant": true,
    "reachSVHCDeclaration": false
  }
}
```

**Response (201):**

```json
{
  "productId": "pr_8f7a6d...89", 
  "ownerId": "uid_12345",
  "name": "EcoMax LED Bulb",
  "category": "electronics",
  "identifiers": {},
  "attributes": {
    "brand": "EcoMax",
    "powerRating": "9W",
    "materialComposition": [
      { "material": "Glass", "percentage": 50 },
      { "material": "Aluminum", "percentage": 20 },
      { "material": "Plastics", "percentage": 30 }
    ]
  },
  "compliance": {
    "rohsCompliant": true,
    "reachSVHCDeclaration": false
  },
  "documents": {},
  "lifecycle": {
    "esgScore": null,
    "summary": null,
    "lastUpdated": 1686876000000
  },
  "blockchain": {
    "currentHash": null,
    "polygonTxId": null
  },
  "status": "processing"
}
```

Here we see the product is created with `status: "processing"`. A few seconds later, the AI enrichment and blockchain anchoring will occur in the background. The client could poll the `GET` endpoint or wait for a webhook to know when it's done.

#### Retrieving a Product (after processing) – The client does `GET /products/pr_8f7a6d...89` and might get:

```json
{
  "productId": "pr_8f7a6d...89",
  "name": "EcoMax LED Bulb",
  "category": "electronics",
  "attributes": { ... },
  "compliance": { 
    "rohsCompliant": true,
    "reachSVHCDeclaration": false
  },
  "documents": {},
  "lifecycle": {
    "esgScore": 75,
    "summary": "This EcoMax LED Bulb is free of hazardous substances (RoHS compliant) and ... (short summary)",
    "lastUpdated": 1686876035000
  },
  "blockchain": {
    "currentHash": "0xabc1234ef...88",
    "polygonTxId": "0x7890abcd1234...",
    "polygonTimestamp": 1686876040000
  },
  "status": "active"
}
```

Now `status` is "active", meaning published, and we have an ESG score and summary from the AI, and blockchain fields filled with a tx. A consumer scanning the QR corresponding to this product would essentially get a subset of this JSON (likely through `/public/products/...`).

#### Webhook Payload Example: Suppose a webhook is set for `product.published` events. When the above bulb finished processing, we send:

```makefile
POST https://api.mycompany.com/dpp-webhook
Content-Type: application/json
X-DPP-Event: product.published
X-DPP-Signature: sha256=...   (if signing with secret)
```

**Payload:**

```json
{
  "event": "product.published",
  "productId": "pr_8f7a6d...89",
  "timestamp": "2025-06-15T10:20:40Z",
  "data": {
    "name": "EcoMax LED Bulb",
    "category": "electronics",
    "status": "active",
    "blockchain": {
      "polygonTxId": "0x7890abcd1234..."
    }
  }
}
```

The data might be a summary, not full product, to keep payload light (full details can be fetched via API if needed). We include identifying info and what changed. For instance, if it was an update event, we might include changed fields.

## 5.3 Webhook Events

We support the following events that clients can subscribe to (the exact list might expand):

-   `product.created` – Fires when a new product passport is initially created (status might be draft/processing at that point).
-   `product.updated` – Fires on any update to a product (could be filtered to significant updates).
-   `product.published` – Fires when a product becomes fully published/active (i.e., after passing validation and anchoring). This is useful to signal that the passport is “live”.
-   `product.non_compliant` – (Optional) Fires if a product fails compliance checks (so the company can be alerted to take action).
-   `product.verified` – If perhaps after anchoring we confirm verification, though “published” covers that.
-   `product.deleted` – If a product is removed or deprecated.
-   `ai.completed` – (Optional) Fires when AI tasks are done for a product, delivering ESG score or summary. Could be combined with `product.published`.
-   `compliance.alert` – (Optional future) If a new regulation is added or thresholds change and some existing passports are now out of compliance, we could notify. This would be more of a batch/cron-driven event.

Webhook deliveries are retried on failure (commonly we'll do exponential backoff up to a few times, and if still failing, mark that webhook as failing and maybe alert the user via email). The `X-DPP-Signature` header if used will be an HMAC of the payload with the user’s secret for them to verify. Each event payload will contain an event name, a timestamp, an ID (could be used for de-duplication), and a data object with relevant information. The structure is designed to be JSON-API friendly and easy to parse.

### Security for Webhooks: We encourage clients to provide an HTTPS endpoint. The signing mechanism (shared secret) can be set at webhook creation; the example `X-DPP-Signature` shows a SHA-256 HMAC that the client can verify. This prevents spoofing of events.

## 5.4 Example API Requests & Responses

To illustrate, here are some common use-case examples:

### Use Case: Consumer scans QR -> get public info

The QR code might contain a URL like `https://dpp.ecosmart.com/p/pr_8f7a6d...89`. This could be a redirect to our `GET /public/products/pr_8f7a6d...89` endpoint’s JSON or a nicely formatted page. If an API consumer (say a retailer’s app) wants to get the info, they call that endpoint.

**Response example:**

```json
{
  "productId": "pr_8f7a6d...89",
  "name": "EcoMax LED Bulb",
  "brand": "EcoMax",
  "description": null,
  "category": "electronics",
  "identifiers": { "gtin": "12345678901234" },
  "materialComposition": [
    { "material": "Glass", "percentage": 50 },
    { "material": "Aluminum", "percentage": 20 },
    { "material": "Plastics (recycled)", "percentage": 30 }
  ],
  "sustainabilitySummary": "Approximately 30% of this bulb is made from recycled materials... (AI summary)",
  "complianceSummary": {
    "rohsCompliant": true,
    "hazardousSubstances": "None above legal limits",
    "reachSVHC": "None above 0.1% threshold"
  },
  "endOfLife": "Recycle with electronics (WEEE) – do not dispose in household trash.",
  "verification": {
    "blockchain": "Polygon",
    "verified": true,
    "txId": "0x7890abcd1234...",
    "timestamp": "2025-06-15T10:20:40Z"
  }
}
```

This is a more compact, user-oriented payload. It doesn’t expose internal fields like `ownerId` or raw numeric scores. But it includes verification status and essential compliance info.

### Use Case: Bulk upload products via API

An enterprise might push many products from an ERP. They could call `POST /products` in a loop or possibly we may provide a batch endpoint for efficiency (e.g., `POST /products/batch` accepting an array of products).

**Batch Request example:**
`POST /products/batch` with body `[ {product1}, {product2}, ... ]`.
**Response**: could be an array of results or a job ID for asynchronous processing if very large.

### Use Case: Check compliance of a product via API

If a user wants to programmatically check which standards a product complies with, they could use `GET /products/{id}` (it has compliance booleans). We might also provide a convenience: `GET /products/{id}/compliance` returning a list of standards and pass/fail. For now, the info is embedded in the product data itself, and the AI summary might note any compliance issues.

### Use Case: IoT or POS system verifying product authenticity

A point-of-sale system could call `GET /products/{id}/verify` to ensure the passport is legit before, say, printing a sustainability score on a receipt. That call gives a quick yes/no.

The API is versioned (as indicated by possibly `/v1/`). If we introduce breaking changes, we’ll expose a new version endpoint to maintain stability for integrators. All changes and deprecations will be documented in our API reference (which this guide is part of for internal devs, but we also maintain external API docs).

**Error handling**: Standard HTTP codes and JSON error messages:
-   `400 Bad Request` if input validation fails (we include details like which field is wrong).
-   `401 Unauthorized` if auth missing/invalid.
-   `403 Forbidden` if auth is fine but access to that resource is not allowed.
-   `404 Not Found` if the resource ID doesn’t exist or isn’t accessible.
-   `500 Internal Server Error` for unexpected issues (with a generic message, but we log details internally).

By adhering to RESTful conventions and providing ample examples, we ensure that integrating with our DPP platform is as straightforward as integrating with Stripe or any other modern API service, fulfilling our “Stripe of DPPs” promise in terms of developer experience.

# 6. Data Carriers & Mobile Workflows (QR, NFC)

Digital Product Passports need to be easily accessible at all points in a product’s journey — from factory to store to consumer’s home to recycling center. We support multiple data carrier technologies to link physical products with their digital passports, primarily QR codes and NFC tags. Our approach is mobile-first: the experience of scanning a code or tapping a tag is optimized for smartphones, requiring no special app when possible.

## QR Codes:

-   For each product passport, we generate a QR code that encodes a URL or URI leading to the product’s passport data. We follow the GS1 Digital Link format where feasible: for example, a URL might be `https://dpp.example.com/01/12345678901234/21/XYZ123` where `01` indicates a GTIN and `21` a serial (this is a GS1 structure) ([digimarc.com](https://www.digimarc.com)). However, if that’s too complex, we simply use a short URL with the product’s ID (like `https://dpp.example.com/p/pr_8f7a6d89`). The advantage of GS1 Digital Link is interoperability with other systems and the ability to encode more in the same QR (like a single code could be both a DPP link and also contain the GTIN for POS scanning).
-   The QR code images are generated in standard formats (PNG/SVG). We ensure they are high-contrast and can be printed even at small sizes (e.g., 2x2 cm on packaging). Error correction level is set to high, so that if codes get slightly damaged, they remain readable.
-   We embed the QR code generation either on-demand (when a user views the product in the dashboard they can click “Download QR code”) or at product publish (store the image in our storage).
-   When scanned by a smartphone camera, if it’s a URL, it will open the link in a browser (no special app needed). Our responsibility is to ensure that link loads a mobile-friendly page (or triggers the appropriate mobile app if we have one).
-   The mobile page for a passport (as described in Section 5’s public endpoint) is designed with responsive HTML/CSS so that on a phone it looks and scrolls nicely. Key info (like product name, summary, key sustainability icons, and perhaps a scannable rating) is shown at top. Users can tap to expand more technical details if they want. This design is informed by the principle of providing the right info to the right actor ([digimarc.com](https://www.digimarc.com)) (consumers get the info they care about, technical details are available for experts).
-   We avoid putting too much static info into the QR code itself. The CEN guidelines mention QR can hold thousands of characters ([cencenelec.eu](https://www.cencenelec.eu)), but we prefer a link because data might update (the passport can get new info after the product is sold). The QR remains constant, pointing to the latest data in the cloud (with blockchain verification to ensure trust).

## NFC Tags:

-   NFC tags embedded in products (common in higher-end goods or sealed items) provide a tap-to-read experience. We support encoding the same URL into an NFC NDEF record (a text or URI record). Many modern phones will recognize the tag and open the URL.
-   For products where an NFC chip is feasible (e.g., expensive electronics, fashion items, pharma shipments), the manufacturer can program it with the URL or a short identifier that our mobile app can resolve. Our platform could also output the data needed to program tags (like via an NDEF payload file).
-   NFC has the advantage of being able to be scanned without line-of-sight and potentially being more secure (some NFC chips have cryptographic features to prevent cloning; we can integrate with those to ensure authenticity, like using NXP NTAG with signatures – out of scope for now but on roadmap).
-   We note that NFC reading distance is short (~a few cm), so it’s mostly for consumer use or very short range scenarios. For supply chain scanning of many items, RFID (RAIN RFID) might be used, but that requires more infrastructure; our focus is QR/NFC as user-facing solutions. (We keep in mind the CEN note: for long-range reading, RAIN RFID is an option ([cencenelec.eu](https://www.cencenelec.eu)), but implementing that is usually outside the scope of our software, it’s more on hardware integration.)

## Mobile App / PWA:

-   While not strictly required, we provide the DPP view as a Progressive Web App (PWA). This means when a user opens the passport link on mobile, it loads quickly and can offer to “Add to Home Screen” for convenience. We use responsive design and possibly some client-side script to animate or update verification status.
-   If the user is an owner of the product (say the consumer logged into a mobile app of the brand), we could show additional features (like ability to transfer ownership or record a resale or see repair locations). These are value-add features beyond core spec, enabled by having a webapp that can log in.
-   The mobile page also emphasizes scannability of information: e.g., shows a summary, a maybe a simple icon for each key aspect (like a checkmark and “RoHS Compliant”, a recycle icon and “Made with 30% recycled content”, etc.). Visual communication is important at point of sale to influence purchase.

## Point of Sale (PoS) workflows:

-   In retail, a salesperson or customer can scan the product’s code on the shelf or box. No login needed; they see the product passport. This can help answer questions (“Is this product eco-friendly?”, “Where was it made?”, etc.).
-   We ensure the load time of the passport page is minimal by using a CDN for data or even embedding some data in the QR (like if offline mode needed, but primarily we assume connectivity).
-   Optionally, if the retailer’s system is integrated, scanning the code with a store app could allow them to pull data via our API and integrate it into their interface (some retailers might incorporate key sustainability data on receipts or shelf labels). Our API helps that as described.

## Supply Chain workflows:

-   Manufacturers and distributors can scan or tap codes during production or distribution to get info or update status:
    -   e.g., when a product is finished in factory, scanning 10 units and confirming “batch 123 ready, DPPs created”.
    -   If using an internal app, that app calls our API to create or update passports as goods move.
-   At recycling or return, a worker scans the code to retrieve info like what materials the product contains (helping sorting). If integrated, the recycler’s system could then call `POST /products/{id}/events` to mark it recycled.
-   If NFC tags are used, supply chain could benefit because an NFC reader gate could detect items in bulk (though current tech: QR is more manual one-by-one, RAIN RFID is for bulk; NFC is one-by-one too but faster than scanning a code maybe).
-   For bulk scanning (like a pallet of items), QR codes each item would be cumbersome to scan individually. In such cases, companies might use RFID, but we can accommodate that by linking RFID EPC codes to the product ID in our system (if asked, we could store an EPC in the identifiers and provide a lookup endpoint by EPC).
-   However, since our platform is mostly digital and cloud, we assume unique IDs are known, and external systems handle scanning hardware. We ensure the data model can store any needed codes.

## Labeling & Physical Integration:

-   The platform might provide a template or guidelines for printing the QR code onto product labels or packaging. We could generate a label PDF that includes the QR and maybe a short URL or number for human-readable fallback.
-   We mention to clients that the placement of the data carrier should be accessible to consumers (per ESPR, on product or packaging or docs) ([digiprodpass.com](https://digiprodpass.com)). We might include a note in our documentation for them (like “Affix the printed QR code sticker near the product’s existing label or on the packaging where it won’t be damaged. Ensure the QR is at least 2cm in size.”).
-   We acknowledge durability: QR printed on paper could degrade; NFC tags cost more but can be more durable (and, as CEN noted, some have long retention) ([cencenelec.eu](https://www.cencenelec.eu)). We provide options, but the choice is up to the product owner’s context.

## User Experience Example:

A customer buys an EcoSmart Phone X. In the box, there’s a card with a QR code that says “Scan for this product’s Digital Passport”. The customer scans with their phone camera, it opens our webapp page for that product. They see:
-   Product name, image (if we store an image URL in attributes maybe), and key sustainability highlights (AI summary).
-   A section “Environmental Impact” with maybe an icon and “14.2 kg CO2e” (if we display carbon footprint), “50% recycled content”.
-   A section “Compliance” with green checkmarks: “RoHS compliant (EU hazardous substances law)” ([data.europa.eu](https://data.europa.eu)), “REACH SVHC OK (no harmful chemicals)”, etc., possibly simplified wording.
-   A section “Instructions” with link to user manual, and “When finished, recycle via ...”.
-   A verification badge “Verified by Blockchain” with maybe a Polygon logo or just a generic blockchain icon. If tapped, it explains that the data is authenticated on a public ledger.

If the customer later hands the phone to an e-waste recycler, the recycler can scan the same code, and possibly switch to a “professional view” to see detailed material breakdown and removal instructions (we could incorporate multiple views in the webapp based on user selection or URL parameter, e.g., `?view=recycler` to display technical info like screw types, battery removal steps, etc., which might be included in the passport data).

## Future considerations:

-   We might integrate with smartphone native wallets or manufacturer apps so that when scanned, if they have a specific app, it opens there for richer functionality (e.g., warranty registration).
-   Also, exploring digital watermarks (Digimarc, etc.) for cases where QR aesthetics are an issue (especially in fashion, brands might want an invisible marker). That would be outside this scope but something to keep in mind.

In conclusion, our DPP platform ensures that the last mile of the digital passport — connecting it to the physical product — is robust and user-friendly. By using ubiquitous technologies (QR codes) and preparing for emerging ones (NFC, RFID), we make accessing and updating the passports convenient for all stakeholders, thereby increasing the likelihood of widespread use and compliance. The mobile-first design aligns with how people expect to access information today – on their phones, instantly, with a quick scan.
