# Versioning, Changelog, and Environment Management

As the platform evolves, careful versioning, clear changelogs, and robust support for multiple environments (development, staging, production) are essential for stability and predictable integration by clients. This section describes how we manage API versioning, track changes over time, and configure different deployment environments.

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

## Maintaining Compatibility and Stability

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
