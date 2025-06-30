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
