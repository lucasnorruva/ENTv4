# Versioning and Changelog

## [1.0.0] - Initial Release

This marks the first version of the PassportFlow platform. All current API endpoints are considered `v1`.

### Features

-   **Product Passport Management**: Core CRUD operations for creating, updating, and viewing DPPs.
-   **Role-Based Access Control**: Dashboards and permissions tailored for Suppliers, Auditors, and Admins.
-   **AI-Powered Insights**:
    -   ESG Scoring and summary generation.
    -   Automated compliance gap analysis against predefined rules.
    -   AI-driven suggestions for improving passport data quality.
-   **Blockchain Anchoring**: Mock integration with Polygon for anchoring passport data hashes upon verification.
-   **Scheduled Compliance Checks**: A daily cron job to process pending verifications.

_Future versions will introduce formal API versioning in the URL (e.g., `/api/v2/...`) for any breaking changes._
