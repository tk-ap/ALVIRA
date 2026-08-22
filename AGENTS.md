# Agent Instructions

## Product-Direction Authority

- Revision 11 is the latest owner-ratified ALVIRA product direction.
- Revisions after 11 are team working hypotheses unless the owner explicitly ratifies them.
- Label post–Revision 11 assumptions when they influence recommendations or implementation.

## ALVIRA Product Family: Bridge Brand Architecture

This section captures the current owner-approved direction for how **ALVIRA Bridge** relates to the main ALVIRA product and should guide future product, UX, copy, and visual implementation work across both repositories.

### Product Relationship

- **ALVIRA** is the context engine: it helps people discover, structure, maintain, and build the context their AI is missing.
- **ALVIRA Bridge** is the context distribution layer: it carries the user's ALVIRA context into the AI tools they use.
- The Bridge site is a **sister product/site**, not an unrelated standalone SaaS product.
- Bridge should feel like a natural extension of ALVIRA's product story and brand system.
- The core product-family narrative is:
  - **ALVIRA:** Build the context your AI is missing.
  - **Bridge:** Take your context everywhere.
- A useful architectural shorthand is **ALVIRA = Context Engine** and **Bridge = Context Distribution**. Use this internally to maintain conceptual clarity, but prefer human-facing language over infrastructure terminology.

### Bridge Positioning

Bridge should fulfill the promise established by ALVIRA rather than introduce a competing conceptual framework.

Preferred framing:

> **Take your ALVIRA profile everywhere.**
>
> Your AI profile shouldn't live in one tool. Use your ALVIRA context across ChatGPT, Claude, Gemini, Cursor, and whatever comes next.

Potential supporting language:

> Your ALVIRA profile was built to work everywhere. Bridge gives you a simple way to bring it into the AI tools you use.

The exact copy may evolve, but Bridge should consistently communicate **portability, continuity, and context**.

### Shared Vocabulary

Prefer language already established by the main ALVIRA product:

- context
- AI profile
- knowledge
- build
- missing context
- take your context everywhere
- one profile
- every AI tool
- portable
- structured
- maintain
- understand

Avoid unnecessary generic SaaS/infrastructure terminology such as:

- integration layer
- distribution problem
- integration directory
- integration infrastructure
- stack
- infrastructure-first language

Technical terminology is appropriate when describing implementation, but customer-facing copy should remain human + technical rather than technical + infrastructural.

### Brand Voice

- Concise, confident, intelligent, and technically credible.
- Human-centered without becoming casual or overly conversational.
- Explain the product through the user's relationship with their AI context rather than through infrastructure.
- Prefer short, declarative sentences.
- Avoid marketing filler, exaggerated claims, and generic SaaS language.
- Reuse established ALVIRA vocabulary before inventing new terminology.
- Bridge should sound like **ALVIRA**, not like a generic integrations marketplace.

### Copy Hierarchy

When practical, Bridge should mirror the main ALVIRA site's communication rhythm:

1. Small technical/product label.
2. Large, concise headline communicating the core promise.
3. Short explanatory paragraph.
4. Clear primary and secondary actions.

Use technical/code-style product labels where appropriate, for example:

`<alvira-bridge />`

This should be treated as a brand-language pattern, not a requirement that every page use the literal label.

### Product-Family Messaging

Maintain a clear narrative between the two sites:

**ALVIRA**

> **Build the context your AI is missing.**

Discover → structure → maintain personal AI context.

**ALVIRA Bridge**

> **Take that context everywhere.**

Connect → copy → deploy the ALVIRA profile across AI tools.

The main ALVIRA site's promise, **“One profile. Every AI tool.”**, is especially important: Bridge should be understood as a fulfillment of that promise, not as a separate product proposition.

### Typography and Visual System

- Bridge should use the same typography system as the main ALVIRA site wherever technically possible.
- Do not introduce a separate font identity for Bridge without explicit owner approval.
- Align body font, heading font, weights, letter spacing, line heights, button typography, and technical/monospace treatments with the main ALVIRA system.
- Preserve the small monospace/code-style label treatment used by ALVIRA as a recognizable part of the product-family identity.
- Treat typography and design tokens as shared ALVIRA brand infrastructure rather than per-site styling decisions.
- When implementing Bridge, inspect and reuse existing ALVIRA design tokens/assets before creating parallel values.

### Implementation Guidance

When working on either repository:

- If a copy decision affects Bridge's relationship to ALVIRA, prefer the established ALVIRA language unless there is a clear product reason not to.
- If a visual decision affects brand consistency, prefer shared ALVIRA typography, spacing, component, and token patterns.
- Keep Bridge's information architecture useful as an integrations/distribution experience while making its positioning unmistakably part of ALVIRA.
- Do not make Bridge feel like a generic developer marketplace merely because it connects technical products.
- The Bridge repository is still being built; treat this section as the source of truth for the intended relationship while its implementation evolves.
- If Bridge-specific requirements later become more detailed, document them in the Bridge repository as well, while preserving this family-level direction in the main ALVIRA repository.

### Acceptance Criteria for Cross-Site Brand Alignment

A Bridge implementation is directionally aligned when:

1. A user can immediately understand that Bridge belongs to ALVIRA.
2. Bridge's headline and supporting copy reinforce the ALVIRA context/AI-profile story rather than introducing a competing positioning.
3. Typography and major type treatments feel native to the main ALVIRA product.
4. The relationship between **ALVIRA = build context** and **Bridge = take context everywhere** is clear without requiring technical explanation.
5. Copy avoids generic integration-marketplace language unless needed for precise technical meaning.
6. New Bridge-specific terminology is introduced only when it improves user understanding and does not fragment the ALVIRA vocabulary.

## Update Requests

When an answer recommends or specifies an update to ALVIRA, provide the deliverable in agent-compatible Markdown by default.

Agent-compatible Markdown should:

- Be directly copyable into a coding or product agent.
- Use explicit headings, requirements, copy blocks, routes, constraints, and acceptance criteria when relevant.
- Distinguish recommendations from approved requirements.
- State when direction relies on a post–Revision 11 working hypothesis rather than owner-ratified direction.
- Avoid relying on surrounding conversational context when the Markdown is intended to serve as an implementation brief.

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

## Merge Gate

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
