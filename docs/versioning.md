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

## 11.2 Environment & Secrets Management

### Environments

-   **Development Environment**: Usually local machines using Firebase emulators. Each dev can run `firebase emulators:start` with the Firestore and Functions. They might use a local config for environment variables (like a local AI API key to test calls against a sandbox model). This allows rapid testing without affecting any real DB or costing money.
-   **Dev (Cloud) Environment**: A Firebase project like `dpp-dev` where the latest `develop` branch code runs. It might use dummy third-party integrations (like pointing to a Polygon testnet, using a test blockchain contract).
-   **Staging Environment**: A Firebase project `dpp-staging` which mirrors production in setup. It uses Polygon Mumbai (testnet) for blockchain anchoring to not risk real transactions; uses perhaps a dev instance of any external services if available (or still real AI because we want realistic test). Staging has its own Firestore database, with perhaps anonymized or sample data. We sometimes copy a subset of prod data to staging for realistic tests (with sensitive bits scrubbed).
-   **Production Environment**: `dpp-prod` with real domain, mainnet Polygon, etc.

We store environment-specific configurations in appropriate places:

-   For Cloud Functions, we use Firebase’s environment config (`firebase functions:config:set`) for things like API keys, contract addresses, etc. This is better than plain env variables because it’s built-in. They become available in code via `functions.config()`.
-   Alternatively, since we use TypeScript, another pattern is to have a config file that picks values based on an env identifier (but since we cannot easily set `NODE_ENV` in Firebase, using `functions:config` is better).
-   We separate secrets: e.g., `functions.config().openai.key` for AI, `functions.config().polygon.rpc_url` for blockchain node, `functions.config().polygon.priv_key` for wallet (or better, use a Secret Manager and load at runtime).
-   We do not commit secrets to repo. CI has secure secrets configured for deployment (like a Firebase deploy token, not actual API keys). The actual keys are directly stored in the environment via Firebase console or CLI.
-   **Local Development Secrets**: We provide `.env.example` and `.env.local` usage. For emulator, we can set emulated config with a file. We instruct devs how to obtain dev API keys for local (for example, they might use a personal OpenAI key for testing or a dev service key, rather than the production one).
-   **Secret Rotation**: If any key is compromised or needs rotating, we update it in config and redeploy. For highly sensitive keys, consider using Google Secret Manager and have the function retrieve it at runtime (which is possible but adds latency). We weigh risk; likely fine using config for now, just ensure access to Firebase project is limited.

### Data Migration

If we change Firestore schema (like add a new field requirement or move something), we handle that carefully:

-   Ideally, make changes backwards-compatible. E.g., if we rename a field, support both until migration done.
-   Write a one-time migration script (could be a Node script using Admin SDK) to run in staging then prod to update documents.
-   We might deploy that as a temporary function or just run locally with admin credentials.
-   Because production Firestore will have data, any new code should handle old data gracefully (e.g., if new field missing, treat as null).
-   We document these migrations in release notes so everyone knows the state.

## 11.3 Versioning Strategy

We maintain versioning at multiple levels:

-   **API Versioning**: The REST API is versioned with a prefix (e.g., `/v1/products`). We plan changes in a way that v1 continues working until we deprecate it in favor of v2, etc.
    -   If we add new endpoints or optional fields, that can be done in v1 (non-breaking).
    -   If a change is breaking (say we change the format of an endpoint or remove something), we will introduce a new version. E.g., if we realize our `/products` response should be structured differently, we'd make a `/v2/products` and keep `/v1` for older clients for a while.
    -   We communicate deprecation timeline to enterprise clients so they can migrate.
    -   The front-end that we control will always use the latest internally.
-   **Smart Contract Versioning**: If we ever need to upgrade the smart contract (say a bug or adding features like storing multiple hashes), we treat that carefully:
    -   Possibly deploy a new contract and update our config to use it for new anchors, while still keeping the old one for verifying old entries (or we migrate entries).
    -   We tag contract versions (e.g., `DPPRegistry v1`, `v2`).
    -   Ideally avoid upgrading contract unless necessary since it complicates verification (but we plan for the scenario).
-   **Software Version**: We use semantic versioning for the platform itself (for internal tracking and any client SDKs).
    -   For example, version 1.0.0 for initial release. Minor bumps (1.1.0) for backward-compatible improvements (new endpoints, fields), major bumps (2.0.0) for breaking changes.
    -   We might not expose this version explicitly to users except maybe in an about section or API header. But it’s used in `CHANGELOG.md` and for internal reference.
-   **Database Version/Migrations**: Not explicitly versioned, but any structural changes are tied to software versions. We might have something like a `schemaVersion` field in config that we update after migrations, but Firestore is schemaless so it’s more about code expecting certain fields.
    -   We keep track in docs of what changes happened at which version so if someone is looking at old data they understand context.
-   **Release Process**:
    -   We bundle completed features and fixes into a release. Perhaps every sprint or bi-weekly. Each release gets a version and we tag it in git.
    -   Update the `CHANGELOG.md` with user-visible changes (especially if it requires any action from them).
    -   On deploy, we monitor as said, and we have the ability to hotfix if something goes wrong (then bump to 1.0.1 etc).
    -   In case an emergency fix must be deployed, that's done off cycle and still documented.
-   **Client SDKs/Docs**: If we provide, say, a client library (maybe in future for easier integration, e.g., a JavaScript package to wrap our API), that library is versioned and we maintain it aligning with API versions.
-   **Backward Compatibility**: We ensure that changes that could break older data or flows are handled gracefully:
    -   E.g., if a new regulation field is introduced, old products without it just show as non-compliant in the new check but nothing crashes.
    -   If we deprecate a field, we support it in API until removed in v2 (i.e., maybe just ignore it if provided).
    -   The blockchain anchoring approach is forward-compatible as long as we can always produce a hash from data. If we added fields that we initially excluded from hash, adding them later changes hash - that is a versioning problem. We define upfront what goes into the hash and ideally never change that for v1 (if we need to alter, we might then deploy a new contract and treat it as separate version of anchoring, with transition plan).
    -   The DID/VC integration would likely be a v2 feature that coexists with v1 for a while.

In conclusion, our DevOps practices ensure that the platform remains stable and high-quality even as we rapidly iterate. By isolating environments, automating testing/deployment, and carefully managing versions, we minimize the risk of downtime or user disruption. This allows the engineering team to focus on adding capabilities (like support for those "75+ standards"!) without constantly firefighting production issues.
