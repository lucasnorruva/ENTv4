# 7. Contributor Guidelines

This platform is a long-term project expected to evolve with new features, regulations, and contributions from multiple developers. To maintain code quality, consistency, and smooth collaboration, we have established clear contributor guidelines. All team members (and external collaborators, if open-sourced in parts) should follow these for any development, documentation, or testing work.

## 7.1 Git Branching & PR Review

**Repository and Branching Model**: We use a simplified Gitflow/trunk hybrid. The default branch is `main` (which reflects the production-ready code). Active development is done in feature branches or a `develop` branch if multiple features need integration.

-   Feature branches are typically named by scope/issue: e.g., `feature/add-scip-integration` or `fix/typo-readme`. Use kebab-case and descriptive names.
-   For larger efforts, create a branch off `develop` or directly off `main` and target it for PR. We try to keep PRs focused (one feature or fix at a time) to ease review.

**Pull Requests (PRs)**: All code changes must go through PRs, even for core maintainers. PRs should:

-   Include a clear description of what is changed and why. If it addresses an issue/ticket, reference it (e.g., “Closes #42 - Add support for new standard”).
-   Include any relevant screenshots (for UI changes) or sample outputs (for easier reviewing of e.g., new API output format).
-   Include updates to documentation or comments when behavior changes (if you add a new endpoint or field, update the README or relevant docs in the same PR).
-   Be linked to passing CI checks (lint, tests).

**Review Process**: At least one other team member should review and approve the PR. We encourage use of GitHub’s review feature to leave comments. Pay attention to:

-   Code style issues (though lint should catch most).
-   Adequate error handling and logging.
-   Security implications (e.g., if new input is taken, is it validated? If new secret used, is it in env and not committed?).
-   Potential performance concerns (e.g., a heavy query without an index).
-   Alignment with project architecture (does it fit into our modular design, or is it a quick hack?).

**Merge Strategy**: We generally squash and merge, to keep the `main` history clean (especially since feature branches may have WIP commits). Ensure your branch is up-to-date with `main` (rebased or merged) before merging, to avoid conflicts.

-   For urgent hotfixes on production, a maintainer may commit directly to `main` or use a `hotfix` branch, but normally even hotfix goes through PR for record.

**Git Hooks**: We have some pre-commit hooks (using husky or similar) to run linting and basic tests. Please don’t bypass them. There’s also a commit message guideline if using conventional commits (e.g., `feat:`, `fix:` prefixes), though we haven’t strictly enforced it – feel free to use them as it helps auto-changelog generation.

**Branch Protection**: The `main` branch is protected: you cannot push directly; it requires PR with at least one approval and passing CI. Admins can override in emergencies, but generally, we respect the process.

## 7.2 Coding Standards & Testing

**Code Style**: We follow consistent style rules. In this project (Node/TypeScript for Cloud Functions, plus some Python possibly for scripts), we use ESLint (with a preset like AirBnB or Google) and Prettier for formatting. This ensures indentation, quotes, semicolons etc. are uniform. The CI will fail if lint fails. Run `npm run lint` and `npm run format` before committing.

-   **Naming conventions**: use `camelCase` for variables and functions, `PascalCase` for classes and types, `UPPER_SNAKE_CASE` for constants. Filenames are usually `camelCase` or `kebab-case` (decide one and stick, we often do `kebab-case` for multi-word file names).
-   Prefer clear descriptive names over short. E.g. `computeProductHash` is better than `hashProd`.
-   Add comments for any complex logic or reasoning, especially in compliance rules (a one-liner on what a specific threshold is about, with reference if possible).

**Testing**: We maintain a test suite:

-   **Unit tests**: Each module should have unit tests (e.g., test the compliance rules with various inputs, test that the AI prompt formatting functions produce expected prompt strings, test that the hash function produces stable output given known input, etc.). Use a framework like Jest. Aim for a good coverage (we strive for >80% lines coverage).
-   **Integration tests**: We have a set of integration tests that use the Firebase emulator suite to test things like “when a product is created via API, the trigger fires and populates fields” – these run in CI with the emulators for Firestore and Functions. If you add a new trigger or API, add integration tests accordingly.
-   **Manual testing / QA**: For big changes (like upgrading Firebase version or making schema changes), do run the app locally and test critical flows (create a product, simulate a scan, etc.). We have a staging environment where QA happens before prod deployment (see CI/CD section).
-   **Write tests for bug fixes**: if a bug is reported (e.g., “RoHS validation not catching something”), first add a test that reproduces it (if possible), then fix the code.

**Performance considerations**: Our code runs in a serverless environment where memory and CPU are limited per function invocation. Avoid heavy computations in hot paths. If you need to do something large (like generate a PDF or run a complex AI analysis on hundreds of items), consider delegating it to a separate process or batching. Use Firestore indexes rather than in-memory filtering when possible.

**Firebase specifics**: Follow best practices like:

-   Don’t do client calls with admin privileges without security – use Firestore rules to enforce security where appropriate even on server (defense in depth).
-   Clean up listeners or avoid infinite loops (like a trigger writing to the same collection causing itself to re-trigger; use flags to prevent loops if needed).
-   Keep functions timeouts in mind (default 60s); our AI calls might be long, but we can set a function timeout to maybe 120s for those or handle partial results.

**Environmental Variables and Secrets**: (More in CI/CD section) – but as a dev, never hardcode secrets or API keys. Use the config (like `functions.config()` for Firebase or environment variables in local `.env`). We have a sample `.env.example` for local development. If you need a new secret (say an API key for a new integration), coordinate with the project lead to add it to the secret store and documentation on how to set it for dev/staging/prod.

## 7.3 Documentation Style

We treat documentation as a first-class deliverable. All significant contributions should include documentation updates when relevant (this guide, as well as inline code docs and potentially README sections for modules).

-   **Markdown Formatting**: We follow a consistent style (as you see in this guide). Use clear headings, bullet points, and tables where appropriate. Avoid very long paragraphs; break down steps or concepts into lists or subsections for readability. Keep line length reasonably short (for easy diffing, e.g., break lines around 120 chars in raw markdown).
    -   Use backticks for code or field names (e.g., `productId`).
    -   Use bold for emphasis on important terms when introducing them, and italics for perhaps secondary emphasis or placeholders.
    -   When adding a new section, ensure it’s added to the ToC if needed and follows the hierarchy.
-   **Inline Code Documentation**: In code, use JSDoc/TSDoc comments for functions, especially if they are exported or complex. For example:
    ```ts
    /**
     * Computes the SHA-256 hash of the product's canonical JSON.
     * @param productData - The product object to hash (partial or full).
     * @returns The hex string of the hash.
     */
    function computeProductHash(productData: Product): string { ... }
    ```
    This helps editors/IDE provide hints and is useful if we generate a code reference.
-   **Updating the Compliance Matrix**: If a contributor adds support for a new regulation or changes a threshold due to law updates, they must update documentation:
    -   In code comments or a dedicated markdown file listing standards.
    -   Possibly update the user-facing docs (like help text in the app).
    -   And certainly update this guide’s compliance matrix section if it’s a major addition. (This guide will likely be kept updated over time as the internal knowledge base.)
-   **Diagrams and Charts**: If adding any architecture diagrams or flowcharts, follow the existing style. We can embed images (ensuring they are stored in repo or accessible), or use mermaid code blocks for simple flows if text suffice (but ensure they render where we need).
-   **Spelling and Grammar**: Given we often show this to external partners (or it might become public), use a spell-checker (VSCode and CI might flag common misspellings). Write in clear English. Avoid colloquialisms; prefer formal tone (but not overly stiff). The voice can be instructive and explanatory.
-   **Changelog and Versioning Docs**: We keep a `CHANGELOG.md` – please add an entry under “Unreleased” when your change is user-impacting (e.g., “Added: Support for DIN EN 15343 recycling standard field”). Follow the style of existing entries. When we cut a release, we’ll move those under a version heading.

Finally, every contributor is encouraged to familiarize themselves with our Code of Conduct (if we have one) and ensure a collaborative, respectful environment. In PRs and code review, focus on the code, not the person; be constructive. And if any doubt, ask! It’s better to discuss a design approach in an issue or meeting before implementing a huge change that might not align.
