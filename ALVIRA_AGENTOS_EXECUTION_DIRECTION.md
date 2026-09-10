# ALVIRA + Agent OS Execution Direction

**Status:** product/architecture direction for validation — 2026-09-10

## Decision

ALVIRA remains a **Context Intelligence** product. Agent OS remains shared, host-agnostic execution infrastructure rather than a standalone public product offering.

The commercial hypothesis is that ALVIRA may eventually expose a paid execution capability powered by Agent OS. Customers would pay for ALVIRA to carry approved work forward using maintained context, not for access to an "Agent OS" SKU.

The product progression is:

**Know me → understand what matters → carry approved work forward → verify what happened → learn from the outcome**

This document is repository prep only. It does **not** authorize any live-site, pricing, entitlement, naming, or production behavior change.

## Ownership boundary

**ALVIRA owns:** durable context, interview/capture, context maintenance, least-privilege context selection, working briefs/reviewed intent, Reflect, and the future customer-facing request/review experience for execution.

**Agent OS owns:** executable work state, accountable-agent/skill routing, execution harness/intelligence-tier selection, host selection, bounded delegation, execution persistence, retries/blockers/carry-forward, verification orchestration, and evidence.

**Authorization/enforcement remains separate:** being entitled to a paid ALVIRA feature does not authorize every action. Agent Control and/or LEDGATo participate where their defined authorization/enforcement layer is required. Existing authority lineage and verifier-independence rules remain intact.

## Context should be compiled, not dumped

Do not read a user's entire ALVIRA profile into every task. For each job, ALVIRA should provide only the context materially relevant to the task and recipient scope. Child agents receive an even narrower subset when appropriate.

The canonical ALVIRA data model remains the source of truth. Markdown/JSON projections remain interoperability formats, not canonical memory.

Useful task context can include facts, preferences, constraints, anti-patterns, exemplars, goals, relationships, prior decisions, workflow preferences, provenance, confidence, freshness, sensitivity, and scope.

## Evidence → Reflect, never silent mutation

Execution can reveal stale, contradicted, ambiguous, missing, or unnecessary context. That evidence returns to ALVIRA as an observation/candidate, not as an automatic durable-memory update.

ALVIRA Reflect decides whether to consolidate evidence, ask the user, verify a possible change, supersede older context, mark uncertainty/staleness, or discard the observation.

The loop is:

**Capture → Understand → Work → Evidence → Reflect → Better Context → Better Work**

## Candidate execution flow

1. User states an intent or accepts a surfaced next action.
2. ALVIRA identifies relevant maintained context and asks only for material gaps.
3. The user reviews/accepts the expected outcome when a gate is appropriate.
4. ALVIRA sends Agent OS a portable work item plus least-privilege context.
5. Agent OS resolves ownership, policy/authority, accountable agent, minimum sufficient support, harness/intelligence tier, and host.
6. Routing decisions and execution attempts are persisted as separate concerns.
7. Execution, delegation, blockers, retries, and evidence are recorded.
8. Independent verification closes the result where required.
9. Outcome evidence returns to ALVIRA.
10. Reflect decides whether anything learned should alter durable Context.

## Packaging hypothesis

If validated, paid execution should monetize **operational leverage**, not access to the user's own context.

Potential value signals include verified work completed, lower time-to-completion, fewer corrective iterations, lower re-explanation rate, reliable continuation across provider/harness limits, privacy-preserving delegation, and understandable evidence.

Do not set pricing, plan names, quotas, or launch claims until the execution loop is proven with real users.

## Portability must remain

Build Brief and Bridge remain useful whether or not ALVIRA-native execution is enabled.

The user should retain both paths:

**Context → reviewed working brief → export to any supported harness**

and, if native execution is chosen:

**Context → accepted intent / working brief → Agent OS → verified outcome**

Do not lock Agent OS to ALVIRA as its only context source, and do not lock ALVIRA users into Agent OS as their only execution destination.

## No-live-change rule

This direction does not authorize changes to the landing page, pricing, Stripe products, entitlements, navigation, interview behavior, customer-visible execution UI, or production side effects.

Any live implementation requires a separate approved task with explicit regression boundaries and acceptance criteria.

## Anti-patterns

Do not turn Agent OS into a customer SKU by default; equate subscription entitlement with execution authority; send the full Context profile to every worker; let execution agents directly rewrite confirmed Context; make Reflect a premium-only correction mechanism; collapse context, routing, persistence, and authorization into one system; or market autonomous execution before reliable verification and evidence exist.
