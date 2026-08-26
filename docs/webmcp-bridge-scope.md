# PR 89 — ALVIRA Bridge WebMCP adapter

## Goal

Make ALVIRA Bridge discoverable to browser-based agents without moving interview ownership out of ALVIRA Context or ALVIRA Reflect.

## Initial tool surface

Expose only consent-controlled, read/propose actions:

- `get_context_status`: return covered domains, freshness, and attached-source counts.
- `request_context_scope`: show an ALVIRA approval UI describing the requesting agent and requested domains.
- `propose_context_update`: submit a source or update for review; never apply silently.

## Guardrails

- Feature-detect `document.modelContext`; the normal ALVIRA UI/API remains the fallback.
- Never expose a full context snapshot by default.
- Require explicit user approval before sharing or modifying context.
- Return provenance and scope with every approved result.
- Keep Bridge account-gated/unlocked after initial context compilation.
- Reuse the existing source review overlay and context-state contract.

## Out of scope

- Replacing server-side ingestion.
- Automatic claim approval.
- A standalone Bridge product surface.
- Durable shared-foundation/schema migration.
- Broad agent permissions before consent/audit behavior is proven.

## Acceptance criteria

1. A supported browser can discover the Bridge tools.
2. Unsupported browsers are unaffected.
3. A tool call opens the same consent/review experience as the ALVIRA UI.
4. Approved context is scoped, attributable, and visible to the user.
5. Tool registration and invocation have tests covering denial, cancellation, and stale context.
