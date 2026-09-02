# Agent Instructions

## Product-Direction Authority

- Revision 11 remains the baseline owner-ratified ALVIRA product direction.
- Revisions after 11 are team working hypotheses unless the owner explicitly ratifies them.
- Explicitly labeled owner-ratified addenda made after Revision 11 are authoritative for their stated scope and supersede conflicting older guidance.
- Current owner-ratified addendum: `docs/CONTEXT_INTELLIGENCE_ROADMAP.md` → **AI leverage guidance**, ratified 2026-09-02.
- Label post–Revision 11 assumptions when they influence recommendations or implementation.

## Update Requests

When an answer recommends or specifies an update to ALVIRA, provide the deliverable in agent-compatible Markdown by default.

Agent-compatible Markdown should:

- Be directly copyable into a coding or product agent.
- Use explicit headings, requirements, copy blocks, routes, constraints, and acceptance criteria when relevant.
- Distinguish recommendations from approved requirements.
- State when direction relies on a post–Revision 11 working hypothesis rather than owner-ratified direction.
- Avoid relying on surrounding conversational context when the Markdown is intended to serve as an implementation brief.

## ALVIRA Product Architecture: Context + Reflect + Bridge

This section is owner-ratified direction and supersedes the earlier separate-product framing for ALVIRA Bridge.

- **ALVIRA Context** is the portable context engine: build, structure, and maintain what AI should know about the user.
- **ALVIRA Reflect** is the private reflection experience: revisit, validate, and evolve the user's living understanding of themselves.
- **ALVIRA Bridge** is a secondary capability inside ALVIRA: controlled distribution that carries selected ALVIRA context into external AI tools.
- Canonical product: `https://alviratech.vercel.app/`
- Canonical Bridge UI: `/bridge` inside the main ALVIRA application.

### Bridge Integration Requirement

Keep Bridge visible but subordinate to the core ALVIRA context experience.

- Main ALVIRA navigation and authenticated dashboard surfaces may link to the internal **Bridge** route.
- Customer-facing mentions of direct integrations, MCP access, connecting external AI tools, or distributing an ALVIRA profile should route through the nested ALVIRA Bridge UI.
- Bridge must reuse ALVIRA identity, navigation, profile source-of-truth, and permission language.
- Bridge must not create or imply a second independent profile store.
- A separate Bridge deployment may remain as an implementation backend or migration dependency, but it must not be positioned as a standalone customer product.
- Preserve the product relationship: **ALVIRA builds and reflects living context; Bridge carries approved context into other tools.**

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

## Agent OS Control-Plane Integration

This repository participates in `tk-ap/agent-os` as the canonical shared workforce/control-plane layer. Agent OS is infrastructure, not an ALVIRA customer-facing offering.

Before material planning or implementation:

1. Read Agent OS `BOOTSTRAP.md` and `registry/product-routing.yaml`.
2. Read this repository's `.agent-os/product.yaml` and `.agent-os/integration-surface.yaml`.
3. Resolve the ALVIRA product boundary before selecting agents or skills.
4. Use Agent OS portable contracts when work crosses product, context, authorization, capability, or outcome boundaries.
5. Keep ALVIRA as the authoritative source for living user context. Context never grants execution authority.
6. Treat Bridge as the gated secondary ALVIRA delivery capability described above, not as a standalone product or a second context store.
7. Route portfolio-level prioritization to ailhat; route shared workforce composition/execution through Agent OS; do not assign generic authorization intelligence to ALVIRA or Bridge.
8. Preserve human gates for merge, production, secrets, destructive actions, and any other action required by Agent OS or local policy.

The default execution chain is:

`request → product boundary → work-item when crossing boundaries → governed task → agents/skills → authorized harness/host → implementation → verification → evidence`

Local `.agent-os/` metadata may narrow or add ALVIRA-specific implementation detail, but it must not redefine the canonical product role in Agent OS.
