# Agent Instructions

## Product-Direction Authority

- Revision 11 remains the baseline owner-ratified ALVIRA product direction.
- Revisions after 11 are team working hypotheses unless the owner explicitly ratifies them.
- Explicitly labeled owner-ratified addenda made after Revision 11 are authoritative for their stated scope and supersede conflicting older guidance.
- Owner-ratified addenda:
  - `docs/CONTEXT_INTELLIGENCE_ROADMAP.md` → **AI leverage guidance**, ratified 2026-09-02.
  - `docs/ALVIRA_CONNECT_DIRECTION.md` → **Connect ALVIRA / connected Context distribution**, ratified 2026-09-18.
- Label post–Revision 11 assumptions when they influence recommendations or implementation.

## Update Requests

When an answer recommends or specifies an update to ALVIRA, provide the deliverable in agent-compatible Markdown by default.

Agent-compatible Markdown should:

- Be directly copyable into a coding or product agent.
- Use explicit headings, requirements, copy blocks, routes, constraints, and acceptance criteria when relevant.
- Distinguish recommendations from approved requirements.
- State when direction relies on a post–Revision 11 working hypothesis rather than owner-ratified direction.
- Avoid relying on surrounding conversational context when the Markdown is intended to serve as an implementation brief.

## ALVIRA Product Architecture: Context + Reflect + Connect

This section is owner-ratified direction and supersedes the earlier separate-product framing for ALVIRA Bridge.

- **ALVIRA Context** is the portable context engine: build, structure, and maintain what AI should know about the user.
- **ALVIRA Reflect** is the private reflection experience: revisit, validate, and evolve the user's living understanding of themselves.
- **Connect ALVIRA** is the customer-facing connected-Context experience: approve and use maintained ALVIRA Context in external AI tools.
- **ALVIRA Bridge** is the underlying secure delivery capability used by Connect ALVIRA. It is infrastructure inside ALVIRA, not the primary customer-facing concept and not a standalone product.
- Canonical product: `https://alviratech.vercel.app/`
- Canonical connection-management surface: currently `/bridge` inside the main ALVIRA application; evolve this surface toward **Connect ALVIRA** language and experience.

### Core Product Loop

Preserve this product loop in planning and implementation:

**Interview once → maintain living Context in ALVIRA → connect approved Context to the user's preferred AI tools.**

- Do not require a separate interview for each destination.
- Do not create destination-specific Context stores that can drift from ALVIRA.
- Prefer secure live retrieval over repeated manual copy/paste when a destination supports it.
- Keep readable/exportable Context as an ownership and fallback path.
- Connected tools should receive the minimum approved Context useful to the task rather than the entire raw Context by default.
- The long-term authorization unit is an approved Context view/projection, not unconditional whole-profile access.
- A named destination must not be presented as supported until its connect → approve → read → revoke lifecycle is verified end to end.

### Context Ingest Modes: Human vs Delegated Agent

This distinction is owner-ratified product direction.

- **Context subject** and **Context contributor/actor** are separate identities. ALVIRA must know whether the subject is speaking directly or an authorized agent is contributing on the subject's behalf.
- **Human/direct mode:** the subject contributes their own Context. Treat this as direct self-report; do not label it as agent-supplied.
- **Delegated-agent mode:** an agent may complete or continue the Context interview on the subject's behalf only under explicit delegation. The session must visibly identify that an agent is contributing and persist actor provenance separately from the subject.
- Preserve provenance equivalent to the current E2E contract: `actor_type=agent`, `actor_id`, `subject_id`, `delegated=true`, and `source_type` for the ingest path. The exact storage schema may evolve, but the distinction may not be lost.
- Agent contributions must preserve epistemic state:
  - **KNOWN** = supported by evidence the agent legitimately holds; it does **not** mean the subject personally confirmed it.
  - **INFERRED** = agent reasoning or synthesis that is not confirmed by the subject; it must remain visibly marked and must never be silently promoted to fact.
  - **UNKNOWN** = the agent lacks enough evidence; ALVIRA should record the gap/unknown rather than pressure the agent to invent an answer.
- Compiled and stored Context must keep material contributor provenance and uncertainty. A later projection or connected Context view must not silently turn agent inference into subject-confirmed truth.
- The subject remains the owner of the Context and must be able to inspect, correct, confirm, or supersede agent-contributed material.
- **Connect/read permission is not ingest/write permission.** Giving an external AI access to approved Context does not authorize that AI to mutate canonical Context. Delegated agent ingest is a separate, explicit write/contribution mode.
- Human and delegated-agent interviews may share the same interview engine, but their interaction cues, validation rules, provenance, and resulting evidence semantics may differ.

### Connect / Bridge Integration Requirement

- Main ALVIRA navigation and authenticated surfaces may link to the canonical connection-management experience.
- Customer-facing integration language should prefer **Connect ALVIRA**, **Use ALVIRA with…**, and clear permission language over protocol terms.
- MCP, OAuth, tokens, APIs, and Bridge internals belong in advanced/developer details unless required by the destination.
- Bridge must reuse ALVIRA identity, navigation, Context/profile source-of-truth, and permission language.
- Bridge must not create or imply a second independent profile store.
- Native plugins/connectors or pre-registered adapters may sit above Bridge when a destination provides a better one-click experience.
- Remote Bridge/MCP is the default interoperability layer for compatible tools; Bridge API is the custom/server-side fallback; reviewed portable Context is the fallback when live connection is unavailable.
- Browser extensions or prompt-injection helpers are optional fallback adapters, not the canonical architecture.
- Preserve the product relationship: **ALVIRA builds, maintains, and reflects living Context; Connect ALVIRA carries approved Context into other tools; Bridge supplies the secure infrastructure underneath.**
- See `docs/ALVIRA_CONNECT_DIRECTION.md` for binding requirements and implementation priorities.

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

## E2E Release Boundary

This section is owner-ratified release policy.

- Treat `https://alvira-agent-e2e.vercel.app` as a separate E2E release boundary from both production and the static here.now sandbox.
- Canonical static sandbox source: `sandbox/review`, published to the permanent here.now site.
- E2E source: `e2e/agent-interview-mode`, which must act as an executable overlay on the latest deliberately reconciled **published canonical sandbox** experience while preserving isolated E2E-only runtime behavior.
- Do not point `alvira-agent-e2e.vercel.app` directly at a `sandbox/review` Vercel preview.
- Do not deploy the E2E alias from `main`.
- Update the E2E alias only through the guarded E2E deployment path documented on `e2e/agent-interview-mode` (currently `scripts/e2e/e2e-env deploy`).
- The guarded E2E deploy must preserve the isolated E2E database boundary and E2E stamping; it must never fall back to production `DATABASE_URL`.
- Routine sandbox iteration belongs on here.now and must not create Vercel deployments. Create a new E2E Vercel deployment only for a meaningful E2E checkpoint after the latest published sandbox experience has been reconciled into the E2E overlay.
- When the current healthy E2E deployment already represents the same E2E source and published sandbox baseline, reuse it rather than creating a duplicate Vercel deployment.
- E2E verification, alias changes, or sandbox verification never imply a production release. Production remains `main` → `https://alviratech.vercel.app/` under the normal production release gate.
- Never replace or repurpose the permanent here.now sandbox while updating the E2E boundary.

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
6. Treat Bridge as the gated secure delivery capability underneath Connect ALVIRA, not as a standalone product or a second context store.
7. Route portfolio-level prioritization to ailhat; route shared workforce composition/execution through Agent OS; do not assign generic authorization intelligence to ALVIRA or Bridge.
8. Preserve human gates for merge, production, secrets, destructive actions, and any other action required by Agent OS or local policy.

The default execution chain is:

`request → product boundary → work-item when crossing boundaries → governed task → agents/skills → authorized harness/host → implementation → verification → evidence`

Local `.agent-os/` metadata may narrow or add ALVIRA-specific implementation detail, but it must not redefine the canonical product role in Agent OS.
