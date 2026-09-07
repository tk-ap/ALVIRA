# Build Brief Education Inheritance

**Status:** Owner-ratified addendum — 2026-09-07

## Decision

ALVIRA owns the **Build Brief capability**. ASHWOOD / AI from Zero owns the broader **Build Brief curriculum**.

The two surfaces must not fork the product definition or create competing Build Brief engines.

Use this rule:

> **ASHWOOD teaches it. ALVIRA owns it. ALVIRA carries enough of the teaching to make the capability understandable at the moment of use.**

## ALVIRA responsibility

ALVIRA remains canonical for:

- selecting relevant maintained Context;
- converting current intent + Context into a Build Brief;
- Build Brief schema and generation behavior;
- human review and correction;
- Markdown export;
- builder adapters and handoff;
- future evolution of Build Brief as a context-derived working brief.

The canonical product direction remains `ALVIRA_BUILD_BRIEF_DIRECTION.md`.

## ASHWOOD / AI from Zero responsibility

ASHWOOD / AI from Zero should own the deeper learning path for Build Brief and adjacent AI-building concepts.

That curriculum may include:

- plain-language definitions;
- worked examples;
- why the concept matters;
- common failure modes;
- terminology such as repositories, branches, pull requests, deployments, CLIs, APIs, agents, harnesses, context, permissions, and evidence;
- progressive explanations from plain language to technical depth.

ASHWOOD must not independently own Build Brief generation, storage, schema, or builder adapters.

## Education inheritance inside ALVIRA

An ALVIRA user should not have to leave ALVIRA merely to understand the feature they are already using.

The `/build-brief` experience therefore carries a lightweight in-context explanation using the pattern:

1. **Plain** — what a Build Brief is.
2. **Why you care** — why structured intent reduces avoidable builder assumptions and corrective work.
3. **Go deeper** — how Context, canonical brief, adapter prompt, and execution environment differ.

This explanation is intentionally smaller than the ASHWOOD curriculum.

When a stable ASHWOOD / AI from Zero curriculum route exists, ALVIRA may add a secondary "Learn more" link to that route. Do not hard-code an unverified or temporary destination.

## Product boundary

A Build Brief is not:

- memory;
- execution authority;
- autonomous execution;
- a destination-specific prompt;
- proof that a product should be built.

ALVIRA's transformation remains:

**Context → intent → reviewed working brief → adapter prompt / export**

The destination prompt is an adapter. The reviewed brief is the portable artifact. Maintained Context remains the durable source of understanding.

## Acceptance criteria

1. `/build-brief` explains the concept without requiring navigation to ASHWOOD.
2. The explanation is simple by default and exposes more technical depth on request.
3. No Build Brief schema, generation, export, or adapter behavior is duplicated in ASHWOOD.
4. No ALVIRA capability is moved into ASHWOOD merely for educational completeness.
5. Future ASHWOOD curriculum may be linked from ALVIRA only after a stable route exists.
6. ALVIRA remains usable and coherent if ASHWOOD is unavailable.
