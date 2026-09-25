# ALVIRA Connect — Owner-Ratified Product Direction

Ratified: 2026-09-18
Authority: Owner-ratified addendum to Revision 11
Scope: ALVIRA Context distribution, integrations, Bridge, plugins/connectors, and the post-interview product loop

## Decision

ALVIRA's core product loop is:

Interview once → maintain living Context in ALVIRA → connect approved Context to the AI tools the user already uses.

ALVIRA should not require users to repeatedly paste prompts, export files, or recreate personal/company context inside each AI product.

The interview and ongoing Context maintenance remain native ALVIRA experiences. External AI tools consume only user-approved ALVIRA Context through controlled connections.

## Product role

ALVIRA is the user's source of truth for living AI Context.

It is not primarily another general-purpose chatbot, agent harness, or execution environment.

The intended user experience is:

1. The subject either completes the initial ALVIRA interview directly or explicitly delegates an agent to contribute Context on their behalf.
2. ALVIRA distinguishes the contributor from the subject, preserves provenance/uncertainty, and creates the subject's living Context.
3. The subject reviews and maintains that Context over time.
4. The user chooses Connect ALVIRA.
5. The user selects an AI tool or compatible destination.
6. ALVIRA shows what Context will be shared and asks for approval.
7. The destination can retrieve the approved Context when relevant.
8. When the user updates ALVIRA, connected destinations receive the current approved Context on subsequent reads.
9. The user can inspect and revoke every connection from ALVIRA.

The user should not need to understand MCP, OAuth, bearer tokens, APIs, protocol versions, or Bridge internals.

## Context intake: subject vs delegated agent

"Interview once" does not require that every fact be typed manually by the subject.

ALVIRA supports two distinct Context-ingest modes:

### Human/direct contribution

The subject answers for themselves. These statements are direct self-report and should not be presented as agent-supplied.

### Delegated-agent contribution

An authorized agent may answer on the subject's behalf using context and evidence it legitimately holds.

The product must preserve all of the following:

- contributor/actor identity is distinct from the Context subject;
- the UI clearly indicates that an agent is contributing before and during the interview;
- delegation is explicit rather than inferred from browser/session behavior;
- contributor provenance persists with the interview/profile;
- each substantive agent contribution can remain **KNOWN**, **INFERRED**, or **UNKNOWN**;
- **KNOWN** means supported by the agent's evidence, not automatically confirmed by the subject;
- **INFERRED** remains labeled as inference until the subject confirms or supersedes it;
- **UNKNOWN** is a valid answer and must not be converted into invented Context;
- the subject can later inspect, correct, confirm, or supersede agent-contributed Context.

The current Agent E2E work demonstrates these semantics with actor/subject provenance and KNOWN/INFERRED/UNKNOWN states. That prototype is evidence for the direction; this document does not claim the delegated-agent path is already a production feature.

A connected AI that has permission to **read** an approved Context view does not automatically gain permission to **contribute or write** Context. Delegated agent ingest is a separate explicit authorization mode.

## Customer-facing language

Prefer:

- Connect ALVIRA
- Use ALVIRA with [tool]
- Connected AI
- What this AI can access
- Choose what to share
- Revoke connection

Do not make Bridge, MCP, OAuth, API, connector protocol, or token the primary customer-facing abstraction.

Bridge remains the internal delivery capability. Connect ALVIRA is the product experience.

## Architecture hierarchy

Use the simplest supported connection path for each destination:

1. Native plugin/connector or pre-registered adapter when a destination offers a high-quality installation/authorization experience.
2. ALVIRA Bridge remote connection as the default interoperability layer for compatible AI tools.
3. Bridge API for custom/server-side integrations.
4. Reviewed portable Context view as a fallback when a destination cannot support a secure connection.
5. Browser extensions or prompt-injection helpers are optional fallback adapters, not the canonical architecture.

Do not create separate Context stores per integration.

## Context delivery model

Connected AI tools should not receive the user's entire raw ALVIRA Context by default on every interaction.

The target authorization unit is an approved Context view/projection.

Examples of independently approvable Context categories may include:

- working style;
- communication preferences;
- current goals;
- decision framework;
- relevant constraints;
- active projects;
- organization-specific terminology;
- selected business/process context.

The user must be able to understand what a connection can read.

A destination should retrieve only the Context relevant to the task when the destination supports selective retrieval.

## Security and authority

All connected-context delivery must preserve these rules:

- ALVIRA remains the canonical source of truth.
- External tools receive read-only Context unless a separate future write/review workflow is explicitly approved.
- Context never grants execution authority.
- Connections are destination-specific and revocable.
- No manual bearer-token copy/paste in the normal user journey.
- ALVIRA session credentials are never exposed to external tools.
- A connection must not imply access to Context the user did not approve.
- External observations may become candidate Context updates only through ALVIRA's explicit review rules; external tools do not silently mutate canonical Context.
- Material contributor provenance and uncertainty must survive approved Context projections when omitting them would falsely imply subject confirmation.
- Bridge/Connect read authorization never doubles as delegated Context-ingest authority.

## Bridge role

Bridge is not a standalone product.

Bridge is the secure infrastructure underneath Connect ALVIRA and is responsible for:

- authorization and consent;
- destination identity;
- Context scoping;
- secure credential lifecycle;
- retrieval interfaces;
- connection status;
- revocation;
- compatibility across supported connection protocols.

Bridge must continue to reuse ALVIRA identity, Context, permissions, and profile storage.

## Product priorities

### P0 — Approved Context views

Replace whole-profile sharing as the long-term default with explicit Context views/projections.

Requirements:

- the user can see what categories are being shared;
- the authorization record preserves that selection;
- retrieval cannot escape the approved selection;
- changing the underlying ALVIRA Context updates the approved view without requiring a new copy/export;
- widening the approved scope requires explicit user approval.

### P0 — Real destination verification

Prove the complete connection lifecycle against real priority AI tools before marketing support.

For each claimed destination verify:

1. installation/connection starts from a normal user-facing flow;
2. destination opens ALVIRA authorization;
3. user selects Context/view;
4. destination exchanges authorization successfully;
5. destination can retrieve approved Context;
6. unapproved Context is inaccessible;
7. ALVIRA shows the active connection accurately;
8. revocation immediately prevents further reads;
9. reconnect works;
10. updated ALVIRA Context is reflected on a later read.

Do not claim a named destination as supported until this flow is verified against the live/preview product.

### P1 — Connect ALVIRA experience

Evolve /bridge into the canonical Connect ALVIRA connection-management experience.

The experience should answer:

- Where can I use ALVIRA?
- Which tools are currently connected?
- What can each tool read?
- When was it last used/authorized when available?
- How do I change or revoke access?

Technical terminology may exist under developer/advanced details.

### P1 — Task-relevant retrieval

Expand the connected Context contract so compatible tools can request the relevant portion of approved Context rather than always receiving a monolithic profile payload.

The exact protocol shape is an implementation detail. The invariant is:

retrieve the minimum approved Context useful for the current task.

### P1 — Connection observability

ALVIRA should be able to distinguish:

- authorization initiated;
- authorization approved;
- token/connection established;
- Context read successfully;
- connection expired;
- connection revoked;
- connection failed.

A UI must not say Connected unless ALVIRA can verify an active connection.

### P2 — Portable fallback

Keep human-readable, inspectable Context export available.

Portability is a fallback and ownership guarantee, not the preferred recurring workflow when a secure live connection is supported.

## Relationship to existing work

### Existing Bridge infrastructure

The current Bridge OAuth, connection records, scoped access tokens, remote MCP endpoint, API, and revoke flow are the technical foundation for this direction and should be extended rather than replaced.

### Draft PR #131 — ALVIRA Connect free portability layer

PR #131 contains useful candidate work, including reviewed Context views, a plugin package, portable export, and a browser adapter.

Treat its components independently:

- Reviewed Context view/projection: aligned with this direction and strategically important.
- Plugin/connector packaging: aligned when it uses canonical ALVIRA Context and Bridge security.
- Portable copy/download: aligned as a fallback/ownership path.
- Browser extension: optional fallback for destinations without a secure native/Bridge connection; do not make it the primary product architecture.

Do not merge #131 wholesale solely because this direction is ratified. Reconcile it against current main, current Bridge security, and these acceptance criteria.

## Product test

For any proposed integration or portability feature, ask:

Does this make it easier for a user to teach ALVIRA once, maintain that Context in one place, and safely use the right parts of it in the AI tool they already prefer?

If yes, it is aligned.

If it creates another Context store, another interview, repeated manual copy/paste, or a destination-specific profile that can drift from ALVIRA, it is not aligned.

## Success criteria

This direction is successfully implemented when a normal user can:

1. complete an ALVIRA interview directly or explicitly delegate an agent to contribute on their behalf;
2. inspect contributor provenance and distinguish direct, known-by-agent, inferred, and unknown material where applicable;
3. save living Context;
4. choose Connect ALVIRA;
5. select a supported AI destination;
6. understand and approve what will be shared;
7. use that AI with ALVIRA Context without manual prompt/file transfer;
8. update Context once in ALVIRA and have later connected reads reflect the maintained version;
9. revoke the destination from ALVIRA.

## Non-goals

This direction does not authorize:

- turning ALVIRA into a general execution harness;
- granting connected tools action authority from Context access;
- creating a separate Bridge identity/profile database;
- silently importing external AI conversations into canonical Context;
- exposing the entire Context to every destination by default;
- claiming integrations that have not passed end-to-end verification.
