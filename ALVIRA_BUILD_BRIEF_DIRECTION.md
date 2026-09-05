# ALVIRA Build Brief — Product Direction

**Status:** Agreed direction — 2026-09-05

## Decision

ALVIRA should not be positioned as a prompt-engineering generator.

ALVIRA's primary category remains **Context Intelligence**. Prompt generation is a useful output format, not the product definition.

The new capability direction is **Build Brief**:

> Turn what ALVIRA understands about a person, idea, project, preferences, constraints, history, and desired outcome into a portable specification that can be used to start work in whichever AI builder or agentic environment the user prefers.

The core transformation is:

**Context → intent → specification → adapter prompt / export**

The prompt is an adapter. The durable asset is the user's maintained context plus the canonical specification.

---

## Why this fits ALVIRA

A builder such as cto.new, Base44, Codex, Claude Code, Replit, Lovable, or a future equivalent can only begin from the information it receives.

A user's first request often omits material context:

- who the product is for
- why it should exist
- the underlying problem
- aesthetic and interaction preferences
- prior decisions
- existing assets or products
- constraints and non-goals
- technical comfort
- budget or time constraints
- what the user explicitly does not want
- what success looks like
- examples that clarify intent
- unresolved questions that should be answered before implementation

ALVIRA is well positioned to identify, maintain, select, and package the relevant subset of this context before execution starts.

This makes Build Brief a natural extension of Bridge and Context rather than a separate product category.

---

## Canonical Build Brief

The first implementation should produce a portable, inspectable artifact. Markdown is the preferred baseline because it is human-readable, versionable, model-readable, and independent of any single AI interface.

A canonical Build Brief may include:

```text
GOAL
PROBLEM
TARGET USER
DESIRED OUTCOME
USER STORIES
RELEVANT CONTEXT
DESIRED EXPERIENCE
VISUAL / PRODUCT DIRECTION
EXISTING ASSETS
MUST HAVES
NON-GOALS
CONSTRAINTS
REFERENCES
TECHNICAL REQUIREMENTS
ACCEPTANCE CRITERIA
OPEN QUESTIONS
```

Not every brief needs every section. ALVIRA should select what is materially relevant rather than dumping the full Context profile into every build request.

---

## Portable export shape

A simple export could begin as:

```text
project-name/
├── BUILD.md
├── CONTEXT.md
├── REQUIREMENTS.md
├── REFERENCES.md
├── ACCEPTANCE.md
└── prompt.md
```

The first five files contain durable intent and context. `prompt.md` is the disposable adapter for the chosen execution environment.

Possible destinations:

- Copy Markdown
- cto.new
- Base44
- Codex
- Claude Code
- Replit
- Lovable
- any future AI builder / agentic harness

Do not make Build Brief dependent on a specific destination.

---

## Bridge relationship

Bridge currently represents portable Context across AI tools. Build Brief should make that value concrete:

> **Build with my Context.**

A user should be able to select the relevant ALVIRA Context, generate a canonical Build Brief, review/correct it, then export or adapt it to an AI builder.

Bridge should adapt the canonical brief to the destination rather than regenerating the underlying intent separately for every platform.

---

## Important product boundary

ALVIRA may produce excellent prompts, but **"prompt generator" is too small a category** for the product.

The distinction:

- **Prompt:** instructions for how a piece of work should happen.
- **Context:** what the system needs to understand about the person/project.
- **Build Brief:** a selected, structured specification of intent, context, constraints, requirements, and acceptance criteria for a build.
- **Adapter prompt:** a destination-specific representation of that Build Brief.

ALVIRA should own the understanding and canonical brief, not the execution environment.

---

## Ecosystem boundary

Build Brief also clarifies the roles of adjacent ecosystem components:

### ALVIRA — Context Intelligence

**Question:** What do we actually mean, and what context materially changes the work?

**Output:** maintained Context + canonical Build Brief.

### ailhat — Portfolio Intelligence

**Question:** What deserves attention or work now, and why?

**Output:** evidence-backed work brief / opportunity / risk / drift / task candidate.

ailhat may generate a prompt as an adapter, but it should not be positioned primarily as a prompt-engineering product either.

### Agent OS / Workforce — infrastructure, not a standalone product offering

**Question:** How is identified work carried through tasks, workflows, harnesses, hosts, handoffs, state, and evidence?

Agent OS remains foundational execution/control-plane infrastructure beneath the ecosystem. Public educational references must label it as infrastructure and must not imply it is currently a standalone customer-facing product.

### LEDGATo — execution authority and operational evidence

**Question:** Was execution authorized, did it stay inside the intended boundaries, and what actually happened?

**Output:** authorization decisions, approval/resume state, evidence, cost/accountability, post-action verification, and related execution controls.

### Human acceptance

**Question:** Is this actually right and done?

The system can preserve context, identify work, carry execution, and return evidence. Human judgment remains the acceptance layer.

---

## First validation experiment

Do not begin with a deep direct integration.

Test whether ALVIRA materially improves first-build fidelity.

1. Ask a user to describe something they want to build in one ordinary paragraph.
2. Send that paragraph directly to an AI builder and capture the first result.
3. Use ALVIRA Context to generate a Build Brief for the same intent.
4. Send the Build Brief to the same builder.
5. Compare:
   - number of corrective iterations
   - missing requirements
   - unwanted assumptions
   - visual/product-direction fidelity
   - acceptance-criteria coverage
   - user's rating of "this is what I meant"

The product claim should only strengthen if this experiment demonstrates a material improvement.

---

## Near-term backlog

- [ ] Define the minimum Build Brief schema.
- [ ] Add a reviewed/correctable Build Brief generation step from ALVIRA Context.
- [ ] Export canonical Markdown.
- [ ] Add `Copy for builder` adapter output without hard dependency on any provider.
- [ ] Prototype destination presets for cto.new and Base44 after validating their current input patterns.
- [ ] Preserve selective-context behavior: never export the entire Context profile by default.
- [ ] Add explicit acceptance criteria and non-goals to generated briefs.
- [ ] Run the first-build fidelity experiment before marketing the capability broadly.

## Product language

Prefer:

- **Build Brief**
- **Build with my Context**
- **Turn intent into a portable specification**
- **Context → specification**

Avoid as primary positioning:

- prompt engineer
- prompt engineering generator
- magic prompt
- one-click perfect prompt

Prompt generation is an adapter capability. **Understanding is the product.**
