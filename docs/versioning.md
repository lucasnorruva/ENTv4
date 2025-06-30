# 11. CI/CD, Environments, and Versioning

Maintaining a platform with many moving parts requires robust DevOps practices. We have set up Continuous Integration/Continuous Deployment (CI/CD) pipelines, manage multiple environments for safe testing, handle secrets securely, and version our API and software to avoid breaking changes. This section describes how we do deployments and manage changes from development to production.

## 11.1 Continuous Integration & Deployment

### CI Pipeline (Integration)

We use GitHub Actions (or an equivalent CI service) triggered on each pull request and on merges to `main`. The CI workflow typically includes:

-   **Install & Lint**: Installs dependencies, runs `npm run lint` and `npm run build` (which type-checks via TypeScript). The lint must pass, and code must compile with no type errors.
-   **Run Tests**: Executes unit tests and integration tests. We spin up Firebase emulators for Firestore and Functions for integration tests so that triggers and HTTP functions can be tested in an isolated environment. All tests must pass, and coverage is reported.
-   **Static Analysis**: (Optional) We might run a security audit (`npm audit`) or code scanning tools for known vulnerabilities.
-   **Build Front-end**: If we have a front-end (webapp), CI also builds that (like run `npm run build` in `webapp/`).
-   **Results**: If anything fails, the PR is marked with failure and should not be merged until fixed.

### CD Pipeline (Deployment)

We maintain three main deployment targets: Development (Dev), Staging (QA), and Production. Each corresponds to a separate Firebase project (or at least separate instances).

-   **Auto-deploy on merge to dev/staging**: We might have a `develop` branch that deploys to a Dev environment automatically for internal testing. Or we use feature branch deploy previews (Firebase Hosting can do previews, but for functions, we might just use dev).
-   **Manual promote to Production**: Given the criticality, we don’t auto-deploy to production on every merge. Instead, after testing on staging, a maintainer triggers a deployment to prod (could be via a GitHub Action workflow dispatch or a manual command).
-   Our GitHub Actions is configured with secrets for the Firebase projects (like a service account or Firebase token to deploy).

#### Deploy Steps:

1.  Deploy Firestore rules and indexes.
2.  Deploy Cloud Functions (we use `firebase-tools` to deploy, which will only upload changed functions).
3.  Deploy Hosting (for front-end).
4.  Maybe deploy any other resources if used (e.g., if we had cloud run or others, include them).

#### Post-Deploy Verification

After staging deployment, the QA or team runs through critical flows (maybe with automated end-to-end tests or manually) to ensure everything works with real services (like calling the actual AI API in a test mode). We often maintain some test products in the staging environment and do sample scans. Only when satisfied, we deploy to production. Because it's Firebase, zero downtime is expected (new functions replace old seamlessly, hosting updated atomically).

#### Rollback

-   If a bug is found in production, we can quickly redeploy the previous function version. Firebase keeps the last few versions of functions. We also tag releases (e.g., `v1.2.3`) in git so we know what commit is live. A rollback might involve redeploying from the last tag or using `firebase functions:rollback` if needed.
-   Hosting also can rollback to a previous version (we can do that via the Firebase console or CLI).
-   Having staging means hopefully we catch issues before prod, but user data differences can sometimes cause new issues; we monitor logs after each prod deploy.

### Monitoring and Alerting

-   We enable Firebase/Stackdriver logging alerts: for example, if an exception occurs in functions or if response latency spikes, we get notified (perhaps integrated with Slack or email).
-   We also monitor function invocation counts; if something triggers unexpectedly often (could indicate a loop or mis-trigger), we catch it.
-   For blockchain, we monitor that transactions are being confirmed; if a backlog happens (maybe due to an RPC issue or low gas price), we want to know.
-   For AI, if an outage or slow-down (e.g., API down or hitting rate limits) occurs, our logs and maybe a custom metric (like success rate of AI calls) could alert.

By having this CI/CD, we ensure new contributions are tested and safe, and deployments are consistent and reproducible.
