# 10. Business Logic Flows

To better understand how the system operates end-to-end, this section outlines key business logic flows in a step-by-step format. These flows describe how data and processes move through the platform for major use cases. They ensure that we (and new contributors) have a clear mental model of how everything connects, and they help identify where in the codebase each step occurs.

## 10.1 Product Passport Creation & Publication Flow

This flow covers from the moment a product is input into the system to the point its passport is live and accessible:

1.  **Product Data Entry**: A new product is submitted either via the Admin UI (user fills a form and hits “Save”) or via the `POST /products` API (from an enterprise system). At this point, a Firestore document in `products` is created (with status perhaps “draft” or “processing”) containing the provided data.
2.  **Validation (Initial)**: Immediately, the API endpoint (or UI layer) performs basic validation on required fields format (e.g., numeric fields, allowed values). If something is missing but not critical (e.g., no documents uploaded yet), it can still be created as draft. Critical missing data (like no name or category) would result in a `400` error back to user.
3.  **Trigger AI Enrichment**: The Firestore `onCreate` trigger fires for the new product. This invokes the AI integration:
    *   It prepares the prompt(s) – e.g., composes the ESG scoring prompt with the data.
    *   Sends the prompt to Gemini. Our function then waits (this can be several seconds). If the response comes, it parses out the ESG score and summary.
    *   It updates the Firestore doc with those AI results (`lifecycle.esgScore`, `lifecycle.summary`). (This update may itself trigger `onUpdate` but we can ignore it or ensure our trigger logic doesn’t re-run AI on that field change).
4.  **Compliance Checking**: Still in the trigger (after AI or in parallel if we design it so), the function runs the compliance checks:
    *   It looks up which standards apply (based on category or tags). For each, it checks the corresponding fields.
    *   If any required field is missing or some rule is violated, it accumulates an error list. It updates the product doc with a `validationStatus: "errors"` and maybe a `validationErrors` array listing issues (e.g., “RoHS compliance not indicated”).
    *   If minor warnings (non-critical), could list as warnings separately.
    *   If everything required is present and okay, it sets `validationStatus: "passed"`.
5.  **Blockchain Anchoring**: If validation passed (and either auto-approval or no manual gating is set), the trigger proceeds to blockchain:
    *   It computes the product hash (from relevant fields).
    *   Calls the Polygon contract via our web3 client. This returns a transaction promise or hash. We may wait for confirmation or at least the transaction hash. Ideally, we wait for 1 confirmation to be sure it’s mined (a few seconds on Polygon).
    *   On success, update Firestore: set `blockchain.currentHash`, `blockchain.polygonTxId`, and possibly mark a `publishedAt` timestamp. If needed, set `status` from “processing” to “active”.
    *   If the blockchain call fails (network issue), we catch error: perhaps set a field `blockchainStatus: "pending"` and will retry via a scheduled function or next update.
6.  **QR Code Generation**: As soon as we have a product ID (from step 1), the front-end can already generate a QR via a library when the user views the product. Alternatively, we had a cloud function to generate an image. Some implementations: we might have an endpoint `/products/{id}/qr` which returns the PNG; it can be dynamic, encoding the URL with that ID. We might store a data URL or just generate on the fly in front-end. So this is not a blocking step. But logically:
    *   If in UI, after step 1, the user can click "Generate QR" which either uses a JS library to show it or calls our API for an image. If via API, we likely integrated a third-party chart API or have a function with a QR generation library (like using `node-qrcode` to produce base64 PNG).
    *   The QR code itself contains the link to the product’s public page or API. We ensure that by now the product can be retrieved publicly (if `status=active` and no auth needed for that public info).
7.  **Notification/Webhooks**: On completion, the system triggers a webhook event `product.published` if configured, so external systems know it's ready. Also, if internal, maybe send an email to the user, “Your product passport for EcoSmart Phone X is now live!”
8.  **Passport Accessible**: Now the product is fully published:
    *   Scanning the QR goes to our front-end route which loads data from `GET /public/products/{id}`. That endpoint pulls the latest from Firestore (with perhaps a cache).
    *   The user sees the info. They might click "Verify on Blockchain", which triggers either our verify endpoint or opens a block explorer link with the txId, demonstrating authenticity.

The cycle ends here for creation. The product is in the system and can later be updated or read anytime.

This flow is illustrated logically as: `Input -> Validate -> AI -> Compliance check -> Blockchain -> Available to scan`.

## 10.2 Product Update & Versioning Flow

When an existing passport needs changes (e.g., new info added, or correction):

1.  **Update Initiation**: A user or system calls `PUT /products/{id}` with changes, or uses the portal to edit fields. For instance, adding a new certificate or changing a material percentage.
2.  **Write to Firestore**: The product doc is updated with new data. We might also increment a version number.
3.  **Trigger onUpdate**: Our Firestore trigger catches the update. It should identify what changed (we can compute a diff or at least know if key fields changed that require re-processing).
    *   If content that affects AI output changed significantly (like material composition or a new certification), we might re-run certain AI prompts (maybe just regenerate summary if needed).
    *   Always re-run compliance validation, because new data might resolve previous errors or might introduce new issues.
    *   Recompute the hash of the relevant data. Likely, any change in attributes, compliance, or documents should change the hash (we define exactly what goes into hash).
4.  **Blockchain Update**: If the hash changed, we then call the smart contract’s `updateProduct(productId, newHash)` with the new hash. This creates a new transaction.
    *   If using an event log as history, an event will be emitted. If needed, we could also store the old hash in a `previousHashes` array in Firestore for our own record.
    *   We update `blockchain.currentHash` and set maybe `blockchain.previousTxId` or append to a history subcollection if we want to keep chain of custody of changes on our side.
5.  **Status and Notifications**: The product remains "active" during updates (unless the update triggers a compliance failure, in which case maybe we temporarily mark it as “active (issues)” but it’s still accessible). Webhooks like `product.updated` fire with details of change (if configured to provide diff or at least timestamp).
    *   If the update fixed issues, `validationStatus` might turn to "passed" and we could notify accordingly ("Product X is now compliant with Y after update").
6.  **Consumer Impact**: If a consumer scans after an update, they see the latest info immediately (since our public API always pulls the current Firestore data). If they had scanned earlier, we might worry about caching, but presumably it’s dynamic or short TTL. And if they somehow saved the old JSON, they could verify it's outdated by comparing to blockchain (the old hash no longer matches the chain after update, unless we maintain multiple on chain).
    *   We might need to clarify how verification works on updated data: if we only store latest hash on chain, verifying after update is straightforward (compares to new hash). If someone tries to verify old data printout, they cannot because chain moved on. But likely not an issue practically.
7.  **Special case**: If major changes like category change (should be rare because a product category wouldn’t usually change), we should handle it – likely treat it as a new product if the type is radically different. But if it happens, our compliance rules will adjust accordingly (maybe new fields required).

## 10.3 Product Access & Verification Flow

This describes when someone scans a code or otherwise attempts to access and verify a passport:

1.  **Scan/Access Initiation**: The user scans the QR code with their phone camera. It recognizes the URL (e.g., `dpp.example.com/p/pr_8f7a6d89`). The user taps the notification to open it.
2.  **Landing Page Load**: The URL points to a route handled by our front-end application or a redirect to an API call:
    *   If a front-end page: It likely contains a script that calls `GET /public/products/{id}` to fetch JSON data then renders it nicely.
    *   Alternatively, it could be a direct API JSON response if we allowed that (less user-friendly raw JSON though). We probably have a nice page with our branding or the manufacturer’s branding.
3.  **Data Rendering**: The page shows product info. Meanwhile, in the background or on user action, verification can occur:
    *   We might show initially a “Verifying authenticity...” indicator.
    *   The front-end calls `GET /products/{id}/verify` (if we have such endpoint) or directly calls a Web3 API to check the contract. Likely easier: call our verify endpoint which returns status.
    *   Our server (or possibly the front-end using a light web3 library if we want to avoid server call) retrieves the on-chain hash and compares with computed hash of data.
4.  **Show Verification Result**: Within a second or two, the verification endpoint responds. If `verified:true`, the page displays a badge or text “Data verified ✔️” possibly with a hyperlink “(What’s this?)” explaining blockchain to users. If it failed (very unlikely at point of scanning unless tampered data or system issue), could show a warning “Data could not be verified” or just not show the badge.
5.  **User Interaction**: The consumer can scroll, read the sustainability info, compliance list etc. They might click on links, e.g., to an external certificate or user manual.
    *   If they click "user manual", it opens the PDF (from the `documents` URL).
    *   If they click "blockchain transaction", we could direct them to Polygonscan with the `txId` (some tech-savvy users may want to see it).
    *   If the page is designed to serve both consumer and professional, maybe a hidden section is accessible via login or code for internal data. But likely we keep it simple: public sees public data, internal users have separate means to get more details (like scanning via logged-in admin app).
6.  **Analytics**: Our front-end might ping an analytics service or we log scan events (via cloud function logs or separate collection) for providing usage metrics to manufacturers.
7.  **Edge Cases**:
    *   If the product ID is not found (maybe a bad QR or product removed), the page will show “Product not found” (404).
    *   If found but status is draft or removed, maybe “Passport not available.” Or if we allow public to see only active products, our public endpoint may 404 for inactive ones. (We probably design it such that once something is published, we don't remove its info entirely to avoid dead links in the world).
    *   If the network is offline (imagine scanning in a store basement with no internet), the user can’t see the data. There’s an idea to encode a small subset of info directly in a QR or chip for offline use, but that’s optional and not implemented now. Possibly a future improvement.
8.  **Flow for internal verification (non-consumer)**:
    *   Suppose a customs officer or a retailer’s system wants to verify a product:
        *   They could either scan the same QR and use our page.
        *   Or call our API (which they have access to as a partner maybe) to get the product and verify as above.
        *   Or they could independently:
            *   Compute hash of a data snapshot (if we gave them data via some standardized form like a PDF or digital file).
            *   Then manually check on a blockchain explorer if that hash exists associated with that product. But that requires knowledge of `productId` used on chain. We could publish `productId` or incorporate it in the hash (like register by `productId`).
            *   Likely easier for them to trust our verify endpoint or UI.
