# Changelog

This document tracks major changes and versions of the PassportFlow platform.

## [1.0.0] - 2024-07-26

### Added

-   Initial release of the PassportFlow platform.
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
