# ALVIRA Build Brief — Product Direction

**Status:** Agreed direction — 2026-09-05

## Decision

ALVIRA should not be positioned as a prompt-engineering generator.

ALVIRA's primary category remains **Context Intelligence**. Prompt generation is a useful output format, not the product definition.

The implemented first capability is **Build Brief**:

> Turn what ALVIRA understands about a person, idea, project, preferences, constraints, history, and desired outcome into a portable specification that can be used to start work in whichever AI builder or agentic environment the user prefers.

The broader capability is **context-derived working briefs**:

> Turn maintained understanding into the right working artifact for whatever the person is actually trying to do.

A software Build Brief is one concrete instance of that capability, not proof that ALVIRA is only for builders or technical users.

The core transformation is:

**Context → intent → reviewed working brief → adapter prompt / export**

The prompt is an adapter. The durable asset is the user's maintained context plus the canonical reviewed brief.

---

## Natural-entrypoint principle

ALVIRA should make it obvious that meaningful AI use does not begin with coding, automation, or agents.

The product should be able to meet a person at the thing they already care about:

- a streetwear founder planning a drop, shoot, campaign, supplier decision, or brand direction
- an athlete/bodybuilder organizing training logs, coach feedback, competition preparation, posing notes, or content planning
- a jewelry-boutique owner reasoning across inventory, margins, merchandising, customer questions, vendors, and pop-ups
- a pastor/community leader organizing sermon notes, study material, events, communications, and community information while retaining human theological/pastoral judgment
- a content creator working with posts, comments, analytics, scripts, audience questions, research, and sponsor briefs
- employees, students, caregivers, parents, job seekers, travelers, artists, and others working through information, decisions, planning, writing, comparison, remembering, or repeated tasks

The product question should be closer to:

> **What are you trying to do?**

than:

> **What AI workflow do you want to build?**

The lightest useful form of AI should be considered a success. A clearer decision, useful comparison, stronger draft, organized body of notes, or reusable brief may be the entire value. ALVIRA should not push users toward agentic complexity for its own sake.

---

## Why this fits ALVIRA

Any downstream AI interface can only begin from the information it receives.

A user's first request often omits material context:

- who the work is for
- why it matters
- the underlying problem or desired change
- aesthetic, communication, or interaction preferences
- prior decisions
- existing assets, history, or source material
- constraints and non-goals
- technical or subject-matter comfort
- budget or time constraints
- what the user explicitly does not want
- what success looks like
- examples that clarify intent
- unresolved questions that should be answered before action

ALVIRA is well positioned to identify, maintain, select, and package the relevant subset of this context before downstream AI work starts.

This makes working briefs a natural extension of Bridge and Context rather than a separate product category.

---

## Canonical working brief

The baseline artifact should remain portable, inspectable, editable, and human-owned. Markdown is a strong default because it is human-readable, versionable, model-readable, and independent of any single AI interface.

For software/build work, a canonical Build Brief may include:

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

Other goals may call for different shapes, for example:

- **Brand / campaign brief** — audience, positioning, desired feeling, collection/campaign goals, references, assets, channels, constraints, acceptance
- **Content brief** — audience, theme, evidence/source material, voice, format, distribution, call to action, constraints
- **Research brief** — question, why it matters, source requirements, boundaries, comparison criteria, output format, uncertainty
- **Decision brief** — decision to make, relevant history, options, criteria, constraints, risks, unresolved questions
- **Event / community brief** — audience, purpose, logistics, messaging, responsibilities, constraints, success criteria

These names are examples of output forms, **not automatic standalone products or SKUs**. ALVIRA should infer/select a useful brief structure from the user's intent and relevant Context rather than forcing users to understand a taxonomy first.

Not every brief needs every section. ALVIRA should select what is materially relevant rather than dumping the full Context profile into every request.

---

## Portable export shape

For software work, a simple export can remain:

```text
project-name/
├── BUILD.md
├── CONTEXT.md
├── REQUIREMENTS.md
├── REFERENCES.md
├── ACCEPTANCE.md
└── prompt.md
```

The durable files contain intent and context. `prompt.md` is the disposable adapter for the chosen execution environment.

Possible destinations:

- Copy Markdown
- cto.new
- Base44
- Codex
- Claude Code
- Replit
- Lovable
- any future AI builder / agentic harness

For non-software work, the reviewed Markdown brief may itself be enough; destination adaptation should be optional.

Do not make working briefs dependent on a specific destination.

---

## Bridge relationship

Bridge represents portable Context across AI tools. Working briefs make that value concrete:

> **Use my Context for what I am doing now.**

For building software, that becomes:

> **Build with my Context.**

A user should be able to select or approve the relevant ALVIRA Context, generate a canonical working brief, review/correct it, then export or adapt it to the AI interface they choose.

Bridge should adapt the canonical brief to the destination rather than regenerating the underlying intent separately for every platform.

---

## Important product boundary

ALVIRA may produce excellent prompts, but **"prompt generator" is too small a category** for the product.

The distinction:

- **Prompt:** instructions for how a piece of work should happen.
- **Context:** what the system needs to understand about the person/project/goal.
- **Working brief:** a selected, structured representation of intent and relevant context for the current job.
- **Build Brief:** the software/product-build form of a working brief.
- **Adapter prompt:** a destination-specific representation of the reviewed brief.

ALVIRA should own the understanding and canonical brief, not the execution environment.

---

## Ecosystem boundary

Working briefs also clarify the roles of adjacent ecosystem components:

### ALVIRA — Context Intelligence

**Question:** What do we actually mean, and what context materially changes the work?

**Output:** maintained Context + a relevant reviewed working brief when useful.

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

## First validation experiment — Build Brief

Do not assume the product claim is proven because the feature exists.

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

## Next validation experiment — everyday usefulness

The next test should intentionally include nontechnical users and non-software goals.

Give several people with different real responsibilities one starting question:

> **What are you trying to do right now that requires thinking, organizing, comparing, writing, remembering, planning, or making a decision?**

For each person:

1. capture their ordinary first request without ALVIRA Context;
2. identify the relevant maintained Context or ask only the missing questions;
3. generate a concise working brief appropriate to the job;
4. use the same AI interface with and without that brief;
5. compare usefulness, corrections, missing assumptions, cognitive burden, and the user's rating of "this understands what I actually needed."

Candidate cohorts: small-brand founder, retailer, creator, pastor/community leader, athlete, and a nontechnical personal-use case.

The goal is to validate the broader Context Intelligence claim, not to maximize the sophistication of the workflow.

---

## Near-term backlog

### Implemented for Build Brief

- [x] Define the minimum Build Brief schema.
- [x] Add a reviewed/correctable Build Brief generation step from ALVIRA Context.
- [x] Export canonical Markdown.
- [x] Add `Copy for builder` adapter output without hard dependency on any provider.
- [x] Add destination presets for cto.new and Base44.
- [x] Preserve selective-context behavior rather than presenting Build Brief as a full-profile dump.
- [x] Add explicit acceptance criteria, non-goals, and open questions to generated briefs.
- [x] Require authenticated ALVIRA session before server-side generation/API spend.

### Validate / expand

- [ ] Run the first-build fidelity experiment before marketing Build Brief broadly.
- [ ] Test natural entrypoints with nontechnical, non-software users.
- [ ] Prototype intent-aware working-brief selection without exposing a confusing taxonomy.
- [ ] Determine whether users benefit from named brief presets or whether ALVIRA should choose the structure invisibly.
- [ ] Explore a general "Use my Context" flow that can produce a reviewed working artifact before handoff to any AI interface.
- [ ] Measure whether Context reduces re-explanation and corrective iterations across everyday use cases, not only software builds.

## Product language

Prefer:

- **Build Brief** for software/product building
- **working brief** as an internal/general capability description
- **Build with my Context** for the software use case
- **Use my Context** for the broader portability/use-now idea
- **Turn intent into a portable specification** when a specification is actually what the user needs
- **Context → relevant working artifact** as the broader product mechanism

Avoid as primary positioning:

- prompt engineer
- prompt engineering generator
- magic prompt
- one-click perfect prompt
- agentic workflow as the default destination for every user

Prompt generation is an adapter capability. **Understanding is the product.**
