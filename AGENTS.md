# Agent Instructions

## Product-Direction Authority

- Revision 11 is the latest owner-ratified ALVIRA product direction.
- Revisions after 11 are team working hypotheses unless the owner explicitly ratifies them.
- Label post–Revision 11 assumptions when they influence recommendations or implementation.

## Update Requests

When an answer recommends or specifies an update to ALVIRA, provide the deliverable in agent-compatible Markdown by default.

Agent-compatible Markdown should:

- Be directly copyable into a coding or product agent.
- Use explicit headings, requirements, copy blocks, routes, constraints, and acceptance criteria when relevant.
- Distinguish recommendations from approved requirements.
- State when direction relies on a post–Revision 11 working hypothesis rather than owner-ratified direction.
- Avoid relying on surrounding conversational context when the Markdown is intended to serve as an implementation brief.

## Product Family: ALVIRA + Bridge

ALVIRA and ALVIRA Bridge are separate products in one ecosystem.

- **ALVIRA** is the Context Engine: build, structure, and maintain the user's AI profile/context.
- **ALVIRA Bridge** is the Context Distribution product: direct integrations and MCP access that carry ALVIRA context into external AI tools.
- Main product: `https://alviratech.vercel.app/`
- Bridge product: `https://alviratech-bridge.vercel.app/`

### Cross-Linking Requirement

Keep the products clearly linked but operationally separate.

- The main ALVIRA navigation must provide a visible **Bridge** link to the Bridge product page.
- Bridge navigation/branding must provide a visible link back to the main ALVIRA product.
- Any customer-facing mention of **direct integrations**, **MCP access**, connecting external AI tools, or distributing an ALVIRA profile across tools should link to the Bridge product page rather than implying those capabilities live inside the core ALVIRA product.
- Any Bridge CTA that requires creating/building an ALVIRA profile should link to the main ALVIRA product.
- Do not merge the two products into one navigation experience or describe Bridge as merely a page/feature of ALVIRA.
- Preserve distinct product positioning: **ALVIRA builds context; Bridge carries it everywhere.**

## Owner-Approved Testing Policy

This section is an owner-ratified requirement, not a post–Revision 11 working hypothesis.

### Primary Acceptance User

- Use `codex-smoke-1786676512909@example.com` as the default account when testing added, updated, or removed customer-facing features.
- Treat this account as the canonical free-tier workflow. It represents the expected initial experience for the majority of launch customers.
- Validate the complete free-user journey before relying on owner-account results, including applicable limits, upgrade prompts, persistence, navigation, and error states.
- Do not store, commit, print, or document the test account password or authentication tokens. Obtain credentials through the approved secret-management or owner handoff flow when authentication is required.

### Secondary Owner Verification

- After the free-tier workflow passes, use the owner profile only as a secondary verification path for privileged access, entitlement overrides, administrative views, and owner-specific features.
- A successful owner-profile test does not replace free-tier acceptance testing.
- Features that are intentionally unavailable to free users must still be checked with the free account to confirm that tier labels, restrictions, and upgrade guidance are accurate before testing the unlocked owner experience.

### Acceptance Criteria

1. The default smoke test uses `codex-smoke-1786676512909@example.com` unless the feature cannot meaningfully be exercised by a free-tier user.
2. Results explicitly distinguish free-tier behavior from owner-only behavior.
3. Regressions affecting the free workflow block release even when the same feature works for the owner profile.
4. Owner-profile testing is performed when the change affects privileged access, paid entitlements, administrative behavior, or owner overrides.

## Shared Repository Safety

This repository may be accessed by multiple agents. Treat `main` as the stable integration branch.

### Main Branch

- Agents must not commit or push directly to `main`.
- Direct changes to `main` require an explicit, task-specific instruction from the owner.
- Never force-push, reset, rewrite, or delete `main`.
- Do not use `main` as an active working branch.

### Task Branches

- Start each task from the latest `main`.
- Use one short-lived branch per task.
- Use the branch pattern `codex/<short-task-name>`.
- One agent owns one active branch. Do not have two agents write to the same branch.
- Do not reuse a merged branch for unrelated work.
- Before editing, inspect the latest `main`, current repository status, and relevant open pull requests.
- If another branch or pull request touches the same files, stop and coordinate before making overlapping changes.

### Commits and Pull Requests

- Stage and commit only files belonging to the current task.
- Do not bundle unrelated formatting, cleanup, generated files, or user changes.
- Use concise commit messages that describe the outcome.
- Push the task branch and open a draft pull request.
- The pull request must explain what changed, why, affected files, verification, and remaining risks.
- Update the branch from the latest `main` before merge when `main` has advanced.
- Prefer squash merge for a focused task unless preserving separate commits materially improves history.
- Delete merged task branches when they are no longer needed.

### Merge Gate

Before merging:

1. Confirm the pull request contains only intended files.
2. Resolve conflicts against the latest `main`.
3. Run the relevant build, type, lint, and test checks.
4. Verify affected desktop, mobile, light-mode, and dark-mode states when visual code changes.
5. Require owner review or review by an agent that did not author the change.
6. Do not merge when another active pull request modifies the same files without an explicit coordination decision.

## Asset Intake and Preservation

- Store production website assets only under `public/` using the project's existing asset conventions.
- Store source or design-reference assets under `design/brand-references/`; these files must never be loaded by the production website.
- Preserve imported source assets unchanged.
- Do not overwrite a source asset with an edited derivative.
- Put future imported originals under `design/brand-references/source/YYYY-MM-DD/`.
- Put implementation briefs and handoff notes in Markdown, not inside the production asset folder.
- Do not create duplicate “backup” copies inside the repository. Git history, pull requests, and tags provide rollback.
- Use `design/brand-references/archive/` only for intentionally retired references, not routine duplication.
- Production derivatives belong under `public/brand/` and must have descriptive, stable filenames.
- Before adding a large binary, verify its purpose, size, filename, and whether an equivalent asset already exists.
- Never delete or move a referenced asset until repository search confirms that no code, documentation, or open pull request depends on its current path.

See `design/brand-references/README.md` for the asset workflow and current reference inventory.
