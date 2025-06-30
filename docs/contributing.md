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
