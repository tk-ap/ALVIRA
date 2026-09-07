# ALVIRA Context — Canonical Onboarding Model

## Purpose

ALVIRA onboarding should minimize repeated explanation while preserving user control, provenance, and epistemic clarity.

The core rule is:

> **Seed what is already known, distinguish fact from inference, validate uncertainty, and ask only for genuine gaps.**

ALVIRA must not assume that a new account means a blank-slate user. A person may already have useful context distributed across AI assistants, conversation exports, documents, notes, URLs, files, or prior ALVIRA state.

The onboarding system should treat those sources as **seed context**, not as unquestioned truth.

---

## Canonical entry paths

Every user enters the same ALVIRA Context system through one of two starting states:

### 1. Start fresh

For users who do not have useful existing context to import.

ALVIRA begins with the normal adaptive interview and progressively builds a durable context model.

### 2. Bring what your AI already knows

For users who already use ChatGPT, Claude, Gemini, another AI assistant, or another context-bearing system.

The user may provide an AI-generated context profile, conversation/export, Markdown/text/JSON file, or another supported import source.

User-facing framing should stay simple:

> **Bring what your AI already knows**
>
> Start with context you have already built elsewhere. ALVIRA will organize it, show you what it understood, and ask only about what is missing or uncertain.

These are onboarding paths into one context model, not separate products, tiers, or downstream experiences.

---

## AI context-profile import

ALVIRA should explicitly support a user asking an existing AI assistant to summarize what it understands about them and then importing that result.

ALVIRA may provide a copyable helper prompt that asks the source AI to separate:

- explicitly stated facts;
- current goals;
- projects and responsibilities;
- preferences;
- constraints;
- working/collaboration style;
- recurring problems or repeated explanations;
- important entities and relationships where appropriate;
- decisions already made;
- likely inferences;
- potentially stale information;
- contradictions or uncertainty;
- important unknowns.

The helper prompt is a convenience. ALVIRA must also accept useful free-form output that does not follow a prescribed template.

---

## Imported context is seed evidence, not truth

An AI-generated profile may contain direct user statements, reasonable inference, stale information, overgeneralization, contradiction, or hallucination.

Therefore imported claims must enter ALVIRA with provenance and an epistemic state.

Minimum conceptual fields:

```yaml
source:
  type: ai_context_import | conversation_export | document | url | prior_alvira_state | other
  provider: optional
  imported_at:
  artifact_reference:

claim:
  value:
  source_status: explicit | inferred | unknown
  alvira_status: unverified | supported | user_confirmed | contradicted | stale | superseded
  confidence:
  provenance:
```

Exact storage implementation may differ, but the semantics must be preserved.

ALVIRA must never silently convert imported AI inference into user-confirmed fact.

---

## Context trust hierarchy

When claims conflict, use the following default ordering as evidence quality, subject to recency and domain-specific evidence:

1. **User confirmed in ALVIRA**
2. **Direct current user statement with provenance**
3. **Supported imported claim with corroborating evidence**
4. **AI inference**
5. **Unverified, conflicting, or source-unclear claim**

This hierarchy informs interview priority; it does not prevent the user from correcting any level.

A newer user-confirmed statement may supersede an older confirmed statement. Preserve the supersession history rather than deleting the old fact as though it never existed.

---

## Seed → normalize → review → ask gaps

The canonical onboarding pipeline is:

```text
SOURCE
  ↓
INGEST
  ↓
EXTRACT CLAIMS
  ↓
NORMALIZE TO ALVIRA CONTEXT MODEL
  ↓
CLASSIFY PROVENANCE / CONFIDENCE / FRESHNESS
  ↓
DETECT DUPLICATES / CONTRADICTIONS / GAPS
  ↓
USER REVIEW WHERE MATERIAL
  ↓
ADAPTIVE INTERVIEW ASKS ONLY REAL GAPS
  ↓
CONFIRMED DURABLE ALVIRA CONTEXT
```

The adaptive interview must consume seeded context before generating questions.

Do not ask a user to restate information that ALVIRA already has at sufficient confidence unless:

- the information conflicts with another material claim;
- the information appears stale;
- the source is inference rather than a direct statement and confirmation matters;
- the domain requires stronger confirmation;
- the user explicitly asks to review or rebuild it.

---

## Review experience

The user should see the result of import in human language rather than raw schema.

A useful interaction model is:

> **We found 32 useful pieces of context.**
>
> 18 look explicit and consistent  
> 7 appear inferred  
> 4 may be outdated  
> 3 conflict with something else
>
> Review the uncertain parts, or continue and let ALVIRA ask about them naturally.

Where an existing claim-review surface already exists, extend it rather than introducing a parallel review system.

The user should be able to approve, revise, reject, or defer a material claim.

---

## Multiple-source onboarding

A user may seed ALVIRA from more than one source.

Example:

```text
ChatGPT context profile ─┐
Claude conversation export ─┤
Resume / portfolio / notes ─┼→ ALVIRA normalization → one durable context model
Prior ALVIRA context ───────┘
```

ALVIRA should preserve source provenance per claim instead of flattening all sources into one anonymous text blob.

The system should deduplicate semantically equivalent claims and surface material contradictions rather than counting source repetition as independent truth.

---

## User-facing import options

The product should progressively support:

- Paste an AI context profile
- Upload a conversation/export
- Upload Markdown, text, JSON, or supported documents
- Add a URL/source
- Connect a supported AI source when available
- Start fresh

Technical terms such as schema, Markdown, context envelope, embeddings, MCP, or provenance should not be required for normal onboarding.

---

## Relationship to ALVIRA Bridge

ALVIRA Context remains the source of truth.

Imported context flows **into** ALVIRA for normalization and validation. Downstream AI tools receive only relevant context through Bridge/context-release mechanisms.

Conceptually:

```text
EXISTING AI TOOLS / FILES
          ↓
       ALVIRA
normalize + validate + maintain
          ↓
      ALVIRA Context
          ↓
 Bridge / bounded context release
          ↓
 AI tools / agents / workforces
```

The goal is not to copy one vendor's memory into another vendor. The goal is to create a vendor-independent durable context layer that can learn from many sources and selectively serve many destinations.

---

## Output forms

ALVIRA should be able to derive multiple outputs from the same underlying context:

1. **Human-readable Context** — inspectable/editable by the user.
2. **Machine-readable context** — structured internal representation.
3. **Task-specific context envelope** — minimum relevant context released to a specific consumer/purpose.
4. **Portable export** — Markdown/JSON/package formats for interoperability, debugging, backup, or local workflows.

Markdown is an export/interoperability format, not the canonical source of truth.

---

## Success criteria

The onboarding model is working when:

- an experienced AI user can bring prior context without starting over;
- imported AI inference is never silently promoted to user-confirmed truth;
- the interview asks fewer redundant questions after a strong seed;
- contradictions and stale claims are visible and resolvable;
- provenance survives normalization;
- multiple source formats converge on one ALVIRA Context model;
- the user can inspect and correct what ALVIRA believes;
- downstream tools receive only relevant context rather than the full profile by default;
- a nontechnical user can complete this flow without understanding repository, Markdown, schema, MCP, harness, or context-envelope terminology.

## Product rule

> **ALVIRA should never make a user rebuild context that can be safely imported, normalized, verified, and maintained.**
