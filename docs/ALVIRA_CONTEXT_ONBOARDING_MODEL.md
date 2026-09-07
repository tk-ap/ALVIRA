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

### 1. Get my context from the AI I already use

This is the preferred path for users who already have meaningful history with ChatGPT, Claude, Gemini, or another AI assistant.

The primary user question is not “Do you have a file to upload?” It is:

> **Where do you already use AI?**

The product should progressively expose provider choices such as:

- ChatGPT
- Claude
- Gemini
- Another AI
- Start fresh

Selecting a provider should open a short provider-specific guide that helps the user obtain a useful context profile from that AI and bring the result back to ALVIRA.

The default interaction pattern is:

```text
CHOOSE AI TOOL
  ↓
COPY ALVIRA-GENERATED CONTEXT PROMPT
  ↓
PASTE INTO SOURCE AI
  ↓
COPY SOURCE AI RESPONSE
  ↓
PASTE / UPLOAD INTO ALVIRA
  ↓
ALVIRA NORMALIZES + REVIEWS
  ↓
ASK ONLY REAL GAPS
```

Do not require native account connections before this flow is useful. Copy/paste must remain a viable low-friction path even after richer integrations exist.

### 2. Start fresh

For users who do not have useful existing AI context to import.

ALVIRA begins with the normal adaptive interview and progressively builds a durable context model.

These paths converge on one context model, not separate products, tiers, profiles, or downstream experiences.

---

## Provider-specific “Get my context” guidance

ALVIRA should maintain provider-specific guidance for obtaining context from major AI tools.

The product language should remain simple:

> **Get my context from ChatGPT**
>
> Copy this prompt into ChatGPT. Then bring the response back here. ALVIRA will organize what it finds and ask only about what is missing or uncertain.

Equivalent guidance should exist for Claude, Gemini, and a generic “Another AI” path.

Provider-specific prompts may differ when a tool has materially different memory/project/context behavior, but they must normalize into the same ALVIRA seed pipeline.

The user should not need to understand memory architecture, exports, schemas, embeddings, MCP, or model internals to use this flow.

---

## Canonical context-extraction prompt requirements

The source-AI prompt is a product-critical component. It must be treated as a versioned onboarding artifact, not casual copy.

At minimum, the prompt should ask the source AI to capture:

- explicitly stated facts about the user;
- current goals and priorities;
- active projects, responsibilities, and commitments;
- preferences and recurring choices;
- constraints, boundaries, and tradeoff rules;
- communication style and explanation preferences;
- working and collaboration style;
- recurring workflows, habits, or repeated processes;
- recurring problems, frustrations, or things the user repeatedly explains;
- important decisions already made and the reasoning when known;
- important people, organizations, products, projects, and relationships when relevant;
- relevant history that materially affects current decisions;
- likely inferences that are useful but not explicitly confirmed;
- potentially stale or time-sensitive information;
- contradictions, competing interpretations, or unresolved ambiguity;
- important unknowns or gaps the source AI cannot establish confidently.

The prompt must explicitly instruct the source AI:

- **do not present inference as fact**;
- distinguish direct user statements from model inference where possible;
- distinguish current information from potentially stale information;
- preserve uncertainty rather than filling gaps with plausible guesses;
- avoid generic personality filler that would not change future AI behavior;
- prioritize context that would reduce repeated explanation or materially improve future reasoning, collaboration, personalization, and task execution;
- avoid unnecessary sensitive detail when it is not relevant to the user’s AI workflow;
- produce output that is understandable to the user, not only machine-readable.

ALVIRA should accept useful free-form source output even when it does not follow the preferred structure exactly.

---

## Prompt validation and stress-test requirement

No provider-specific context-extraction prompt should be treated as production-ready merely because it returns a plausible profile.

Agents changing these prompts must test whether the resulting seed actually improves the ALVIRA workflow.

### Required test dimensions

For each materially changed prompt, test representative cases including:

1. **Rich long-term AI user** — extensive history, multiple projects, preferences, and decisions.
2. **Sparse user** — little history; the model must expose unknowns rather than invent context.
3. **Multi-project user** — context should preserve project separation rather than blending unrelated work.
4. **Changed-mind user** — newer direction should be distinguishable from stale prior direction.
5. **Contradictory history** — conflicts should be surfaced rather than silently resolved.
6. **Mostly inferred context** — the output must label uncertainty rather than overclaim.
7. **Personal + professional mix** — relevant separation and restraint around sensitive/private material.
8. **Nontechnical user** — output and instructions must remain understandable without developer terminology.
9. **Provider variation** — ChatGPT, Claude, Gemini, and generic AI output should remain usable by the same normalization/review pipeline.
10. **Adversarial verbosity/noise** — the prompt should discourage exhaustive trivia and retain high-value context.

### Required evaluation questions

Agents must explicitly evaluate:

- Did the profile capture the context most likely to affect future AI responses?
- Did it reduce the number of ALVIRA interview questions that would otherwise be necessary?
- Did it preserve explicit fact vs inference vs uncertainty?
- Did it identify stale/time-sensitive claims?
- Did it preserve material contradictions?
- Did it avoid generic filler and low-value trivia?
- Did it avoid making unsupported claims about the user?
- Could ALVIRA map the result into its existing domains/context model without a source-specific parallel profile?
- Would a normal user understand what was returned and be able to correct it?
- Did any important ALVIRA domain remain systematically under-captured?

### Regression expectation

Prompt changes should be compared against the previous prompt version using the same representative cases when possible.

A new prompt should not ship if it improves prose quality while reducing context coverage, uncertainty labeling, provenance usefulness, or downstream interview efficiency.

Where a failure is found, agents should update the prompt, normalization, or review flow according to the actual failure mode rather than adding decorative copy around weak extraction.

The long-term measurable outcome is **Context Lift**: imported context should demonstrably reduce repeated explanation and improve downstream AI usefulness compared with starting without ALVIRA context.

---

## Imported context is seed evidence, not truth

An AI-generated profile may contain direct user statements, reasonable inference, stale information, overgeneralization, contradiction, or hallucination.

Therefore imported claims must enter ALVIRA with provenance and an epistemic state.

Minimum conceptual fields:

```yaml
source:
  type: ai_context_import | conversation_export | document | url | prior_alvira_state | other
  provider: optional
  prompt_version: optional
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
SOURCE AI / OTHER SOURCE
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

> **Here’s what ALVIRA understood.**
>
> Some of this looks clear. Some may be inferred, outdated, or conflicting. Review the uncertain parts, or continue and let ALVIRA ask about them naturally.

Where an existing claim-review surface already exists, extend it rather than introducing a parallel review system.

The user should be able to approve, revise, reject, or defer a material claim.

---

## Multiple-source onboarding

A user may seed ALVIRA from more than one source.

Example:

```text
ChatGPT context profile ─┐
Claude context profile ──┤
Gemini context profile ──┤
Resume / portfolio / notes ─┼→ ALVIRA normalization → one durable context model
Prior ALVIRA context ───────┘
```

ALVIRA should preserve source provenance per claim instead of flattening all sources into one anonymous text blob.

The system should deduplicate semantically equivalent claims and surface material contradictions rather than counting source repetition as independent truth.

---

## User-facing import options

The product should progressively support:

- Get my context from ChatGPT
- Get my context from Claude
- Get my context from Gemini
- Get my context from another AI
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

## Returning-user continuity after product changes

Onboarding does not end after the first session. A returning user has an established mental model of where context, interviews, Reflect, Bridge, and other controls live.

When a production change materially alters that established workflow, apply `docs/IN_PRODUCT_CHANGE_COMMUNICATION.md`.

Relevant changes must be classified as one of:

- `NO_NOTICE_REQUIRED`
- `CONTEXTUAL_TIP`
- `LOGIN_NOTICE`
- `IMPORTANT_NOTICE`

Returning users should receive concise guidance on what changed, why it matters, what they need to do differently (if anything), and where the moved/new functionality now lives. Do not force returning users through full onboarding again solely because the product changed.

New users should simply receive the current canonical flow. In-progress users should retain saved context/interview state wherever technically possible and receive migration guidance before they encounter a materially changed next step.

---

## Success criteria

The onboarding model is working when:

- an experienced AI user can get useful context out of their preferred AI tool without understanding exports or developer tooling;
- provider-specific prompts reliably capture high-value context rather than generic summaries;
- prompt changes are stress-tested against representative user histories before production use;
- imported AI inference is never silently promoted to user-confirmed truth;
- the interview asks fewer redundant questions after a strong seed;
- contradictions and stale claims are visible and resolvable;
- provenance survives normalization, including source provider and prompt version when applicable;
- multiple source formats converge on one ALVIRA Context model;
- the user can inspect and correct what ALVIRA believes;
- downstream tools receive only relevant context rather than the full profile by default;
- returning users are informed when a live change materially alters the workflow they already learned;
- a nontechnical user can complete this flow without understanding repository, Markdown, schema, MCP, harness, or context-envelope terminology.

## Product rules

> **ALVIRA should never make a user rebuild context that can be safely imported, normalized, verified, and maintained — or make a returning user rediscover a materially changed workflow by accident.**

> **A context-extraction prompt is not good because it sounds comprehensive. It is good when its output measurably improves ALVIRA’s understanding, reduces redundant interviewing, preserves uncertainty, and improves downstream AI usefulness.**
