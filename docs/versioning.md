# Versioning, Changelog, and Environment Management

As the platform evolves, careful versioning, clear changelogs, and robust support for multiple environments (development, staging, production) are essential for stability and predictable integration by clients. This section describes how we manage API versioning, track changes over time, and configure different deployment environments.

## Testing Checklist

To summarize, every release must pass the following checklist:

-   **Unit Tests**: All unit tests passing (target 90%+ coverage of critical code).
-   **Integration Tests**: Key user flow scenarios simulated and passing.
-   **Security Rules Tests**: All unauthorized access attempts properly blocked; authorized flows allowed.
-   **Linting/Static Analysis**: No ESLint errors, no TypeScript errors, no critical warnings.
-   **Regression Tests**: Core functionalities manually tested in staging (especially AI outputs sanity and UI rendering on multiple devices).
-   **Smart Contract Tests**: If contract logic changed, run contract unit tests (e.g., via Hardhat/Truffle) and possibly test integration with a local blockchain or testnet.
-   **Backup and Migration Plan**: For any database rule changes or data migrations, tested migration scripts on staging and backup taken from prod (if needed).
-   **Documentation Update**: Ensure any new API or feature is documented (the markdown docs, API reference, etc.). This includes updating the compliance matrix if a new regulation is supported by the change.
-   **Approval**: At least one senior developer or tech lead code-reviewed the changes.

Only once all the above are satisfied does the pipeline push to production. This disciplined approach prevents breaking changes and maintains the platform's reliability. (These practices draw on industry best-practices: using local emulators for realistic testing [benmvp.com](https://benmvp.com), automating tests and deployments to catch issues early, and maintaining parity between environments to avoid “it works on my machine” problems [benmvp.com](https://benmvp.com). The Firebase Emulator and GitHub Actions ensure that we have a consistent, repeatable test environment, giving the team confidence in each release.)

## API Versioning & Changelog

### API Versioning Strategy

-   We adopt semantic versioning for the API (and by extension the platform features). The API endpoints include a version in the URL for REST calls, e.g., `/api/v1/products/...`.
-   Breaking changes (ones that are not backward compatible) will result in a version increment (v1 -> v2). We aim to minimize breaking changes to avoid disrupting users. Non-breaking enhancements (adding new endpoints or fields) can happen in minor releases without changing the base version.
-   We maintain multiple versions for a deprecation period when needed. For example, if we introduce v2 with changes in data format, we keep v1 operational for 6-12 months (as per deprecation policy communicated to users) to give external integrators time to migrate.
-   GraphQL (if we ever expose one) would follow a similar version tagging (though GraphQL often prefers a single evolving schema with deprecation tags on fields).

### Changelog Management

-   A `CHANGELOG.md` file is maintained in the repo and updated with each release. It lists added, changed, deprecated, and removed features, as well as fixed bugs.
-   The changelog entries reference issue/ticket IDs for traceability and often link to documentation for major changes.
-   We also surface relevant changes in an admin UI or developer portal. For example, when an Admin logs in, they might see “Platform Update: v1.2 – Added support for Battery Passport, see details” with a link.
-   For critical changes (especially breaking ones or compliance updates), proactive communication is done (email to Admins, maybe webinars if it's big like “ESPR support added, here's how to use it”).

### Release Versioning

-   We tag releases in Git (e.g., `v1.2.0`).
-   The front-end and back-end might share a version number if released together. Otherwise, we might have independent versioning (but we align them for simplicity in communication).
-   The smart contract has its own version (like `SmartContract v1`). If it ever needs upgrading, that's a separate process and version track (with migration plan).

### Deprecation Policy

-   When we plan to deprecate an API endpoint or feature, we mark it in the changelog and documentation as “Deprecated in v1.x, will be removed in vY by Date Z”.
-   The platform might emit warnings: e.g., response headers or API responses might include a deprecation notice (`X-Deprecation-Notice`).
-   Admin users might get notifications if they heavily use a feature that’s changing.

### Documentation Versioning

-   We maintain versioned documentation. We may use a docs site where one can select the API version (v1 docs, v2 docs) so integrators can find info relevant to what they use.

### Examples of Versioned Changes

-   **Minor addition**: Added a new field `product.passport.lifetimeCO2` in `v1.1` to store lifetime carbon emissions. Old clients not using it are unaffected.
-   **Breaking change**: Changed the format of compliance status from a string to an object in `v2`. This is a breaking change, so it's introduced in `/v2` endpoints only.

### Maintaining Backward Compatibility

-   We aim for database changes to be additive (e.g., adding new Firestore fields doesn’t break old code which would just ignore them).
-   Cloud Functions could have different behavior based on version passed.
-   We keep an eye on external dependencies – if we update to a new version of an AI model or external API, we do so in a way that doesn’t remove functionality unexpectedly.

### Internal Version Control

-   Internal config like security rules or environment config is version-controlled in Git. Firebase Security Rules are deployed with each release.
-   We might label Firestore documents with a `schemaVersion` if needed to handle migrations or maintain compatibility.

### Emergency Fixes and Patches

-   We follow semantic versioning: e.g., `1.2.3` would be a patch for a bug fix without new features.
-   We have hotfix pipelines for critical bugs in production.
-   These are noted in the changelog as well (with “Fixed:” entries).

---

## Multi-Environment Configuration

We maintain multiple environments to separate development/testing from production. At minimum:

-   **Development** – local dev on emulators.
-   **Staging** – a deployed environment mirroring production, used for QA and client UAT (User Acceptance Testing if needed).
-   **Production** – live environment for real data.

### Firebase Projects

-   We use separate Firebase projects for staging and prod (and possibly a third for a long-lived dev/testing environment). For example, `dpp-dev`, `dpp-staging`, `dpp-prod`.
-   Each project has its own Firestore, Auth, etc. There's no data bleed-over. We sometimes copy sanitized data from prod to staging for realistic testing (particularly to test performance or migrations).
-   Emulator usually points to a dummy project id like `dpp-emulator` which is local only.

### Config Management

-   Some settings differ by environment. For instance:
    -   API keys for external services (Gemini AI API, blockchain RPC endpoints, etc.) are different. These are stored in Firebase/Google Cloud environment config or as secrets in GitHub Actions. E.g., `functions.config().gemini.key` might be set differently in staging vs prod.
    -   Smart contract addresses: staging might use a testnet contract address, prod uses mainnet. We store those in config as well (or in a Firestore collection that is environment-specific).
    -   Feature flags: if we roll out features gradually, we might have a flag (in config or database) toggling something only on staging or enabled for certain users in prod.
-   We manage config via Firebase CLI for functions config (they allow storing config for each project separately). Or we use Cloud Secret Manager.

### Deployment Workflows

-   As described in CI/CD, code is deployed to staging first. We or a QA team test there. Then deploy to prod.
-   We might employ “blue-green” or similar strategies if needed. Cloud Functions handle traffic shifting by keeping old function versions for some time, which is fine as long as backward compatibility is maintained.

### Data Migration Between Envs

-   If a change requires data migration (say we add a collection or need to back-fill a field), we test the migration script on staging first.
-   We use Firebase Emulator or staging to simulate the migration, ensure it works, then run it on prod (could be via an Admin function or a one-time script using admin SDK).
-   We also ensure we backup critical data before large migrations (Firestore has export tools or we at least take a copy to storage).

### Logging and Monitoring Per Env

-   We separate logs: staging logs are kept separate (just using separate project means separate logs). We monitor prod logs for errors more closely.
-   We might integrate with a tool (Stackdriver alerts or Sentry) to get notifications of exceptions in prod functions or front-end.
-   For staging, we allow more verbose logging to debug issues, in prod maybe less verbose (to reduce noise/cost).

### Multi-Tenancy and Env

-   If the platform is offered as a service to multiple client companies (multi-tenant), we ensure data separation by design (orgId in data, etc.). We might not need separate prod env per client; it’s shared but logically separated. Unless a client demands data isolation, in which case either we spin a separate project or use strict partitioning.
-   But multi-env in our context is more about dev stages, not multiple clients (though possibly we have separate projects if we do a pilot for a specific industry as an isolated sandbox).

### Version Display

-   The admin UI might show the current version and environment (like “v1.2.0 (Staging)” banner on staging to avoid confusion).
-   Also any environment-specific disclaimers (e.g., “Staging environment – test data only”).

### Backing Services by Env

-   **Blockchain**: for staging, we use testnet (Mumbai for Polygon, or EBSI sandbox nodes). For prod, mainnet (Polygon main).
-   **AI**: maybe we use a smaller or cheaper model in staging to cut costs, or use a quota-limited key. But ideally we test with the real model to catch performance issues. Could integrate a toggle: e.g., environment variable `USE_GEMINI_REAL` `false` means use a stub or a cheaper model for quick tests.
-   **Webhooks**: in staging, we often disable outgoing webhooks or point them to dummy endpoints (to not spam external dev systems). Or have them configurable (the Admin of staging may put their test endpoints).
-   **Payment or billing** (if any in future): e.g., if we integrated usage billing via Stripe, in staging we'd use Stripe test mode keys.

### Rollback Plan

-   If a release in prod has a serious issue, we have the ability to rollback. For Functions, we can redeploy an earlier tag or use `firebase functions:rollback` (which might re-enable old version if still around).
-   For the database, if migration did something bad, we rely on backups. Firestore exports should be taken (we might schedule periodic exports of prod data to Cloud Storage).
-   Having staging tested well reduces such incidents, but always plan for rollback.

### Inter-Environment Data Movement

-   If needed, we can export prod data (sanitized of any sensitive info if needed) to staging for realistic test (especially for performance or analytics queries). We do that carefully not to violate any live data privacy (maybe scramble some fields).
-   Developers normally use dummy data, but occasionally a production-like dataset is useful for load testing.

### Infrastructure as Code

-   We likely script out environment setup (some parts, e.g., security rules apply to all envs, but we have them in code).
-   If something must differ, we keep separate config files or use conditional logic keyed on project ID in security rules or code (for example, if we needed to allow test users in staging that wouldn’t exist in prod).
-   But aim to keep behavior same except where explicitly intended.

By implementing proper versioning and environment separation, the platform ensures that:

-   Clients/integrators can trust that API changes won't blindside them (they have time to adapt via versioning).
-   The development team can confidently innovate, knowing issues will likely be caught in non-prod envs.
-   Compliance updates (like adding new regulations) can be rolled out in a controlled way (maybe a feature flag to not show incomplete features to all users until ready).

(This approach is critical in a regulated context: e.g., if a new law comes, we might deploy support in staging to test with a pilot group before enabling for all products. And versioning is analogous to how standards evolve – e.g., GS1 updates, we incorporate them but maintain backward compatibility for existing codes, etc. It's part of providing a stable yet evolving service.)

---

# Changelog

This document tracks major changes and versions of the Norruva platform.

## [1.0.0] - 2024-07-26

### Added

-   Initial release of the Norruva platform.
-   Core functionality for creating and managing Digital Product Passports.
-   Role-based dashboards for Supplier, Auditor, Compliance Manager, etc.
-   AI-powered flows for:
    -   Sustainability Scoring (`calculateSustainability`)
    -   Compliance Gap Analysis (`summarizeComplianceGaps`)
    -   Product Classification (`classifyProduct`)
    -   QR Label Text Generation (`generateQRLabelText`)
    -   Passport Data Enhancement (`enhancePassportInformation`)
-   Scheduled daily compliance checks via cron job.
-   Mock blockchain anchoring to Polygon.
-   Initial documentation for API, roles, and compliance.
