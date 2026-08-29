# ALVIRA System Refresh Directive

**Branch:** `brand/alvira-system-refresh`  
**Status:** Preview-only rebrand work  
**Production rule:** `main` and the live production experience remain untouched unless an explicit merge/deploy decision is made later.

## Purpose

This branch exists to rebrand and reposition ALVIRA as a **Context Intelligence** product while preserving the working product beneath it.

The refresh should make ALVIRA feel less like a generic AI profile builder and more like a living intelligence layer that helps AI understand a person deeply enough to reason, reflect, and act with better context over time.

The core product idea is not a one-time profile. It is a continuous context system:

> **Capture → understand → reflect → update → reuse.**

ALVIRA should communicate that context is something living and maintained, not something completed once and forgotten.

## Brand Positioning

### Category

**Context Intelligence**

ALVIRA should explicitly own and repeatedly reinforce this category. Avoid reducing the product to generic labels such as:

- AI profile builder
- questionnaire
- onboarding tool
- prompt generator
- document summarizer
- workflow app

Those may describe pieces of the experience, but they do not describe the product category.

### Product Name

The context-building product experience should be referred to as **ALVIRA Context** where a product-level name is useful.

### Core Promise

AI already knows a lot. ALVIRA is about what becomes possible when AI can genuinely understand **you** — your goals, preferences, history, constraints, patterns, projects, decisions, and changing context.

The experience should communicate that ALVIRA turns scattered personal context into durable intelligence that can evolve over time and travel into future AI interactions.

## Core Experience Narrative

The public experience should make this loop unmistakable:

1. **Build context** — through conversation, documents, files, URLs, and other sources.
2. **Understand** — ALVIRA organizes what it learns into a coherent context model.
3. **Reflect** — ALVIRA helps surface gaps, changes, contradictions, patterns, and useful observations.
4. **Update** — the model should remain editable and capable of incorporating new context continuously.
5. **Reuse** — accumulated context becomes useful across future AI work rather than being trapped in a single session.

The continuous reflection/update loop is a defining part of the product, not a secondary feature.

## Experience Principles

### 1. Intelligence before tooling

Lead with what ALVIRA understands and enables, not with forms, uploads, or UI mechanics.

### 2. Living context, not a static profile

The product should visually and verbally suggest an intelligence layer that changes as the user changes.

### 3. Calm confidence

The interface should feel precise, premium, thoughtful, and editorial rather than over-designed, futuristic-for-its-own-sake, or saturated with generic AI visual tropes.

### 4. Depth without friction

The system may contain sophisticated context logic, but the user should experience progressive disclosure rather than complexity dumped onto one screen.

### 5. Evidence of understanding

Whenever possible, show the user that ALVIRA has actually understood something: carried-forward context, emerging patterns, changed assumptions, unresolved gaps, or meaningful reflections.

## Visual Direction

The redesign should establish a coherent ALVIRA design system before introducing large page-specific flourishes.

Priorities:

- refined typography hierarchy
- disciplined spacing and grid
- intentional color/token system
- strong ALVIRA wordmark/logo treatment
- restrained motion
- premium editorial composition
- clear hierarchy between narrative, context, reflection, and action
- subtle technical/system cues without defaulting to stereotypical AI dashboards

Avoid visual changes that make the product feel like a generic SaaS template, crypto dashboard, developer console, or sci-fi interface.

## Hero / Public Positioning

The homepage hero should strongly communicate the gap ALVIRA solves: AI can be powerful without actually knowing the person using it.

A useful directional thought is:

> **AI knows a lot. What could you do if it really knew you?**

This is directional rather than mandatory final copy. The final hero should preserve the same tension: broad AI intelligence versus missing personal context.

The supporting copy should quickly establish **Context Intelligence** and explain that ALVIRA builds and continuously updates an understanding of the user.

## Refresh Stages

### Stage 1 — Brand shell

Limit work initially to:

- design tokens
- typography
- logo / wordmark treatment
- navigation
- global shell
- hero
- category framing
- foundational visual language

Do not use this stage to rewrite product logic.

### Stage 2 — Homepage narrative

Rework the public narrative around:

- the Context Intelligence category
- why existing AI lacks durable personal context
- how ALVIRA Context learns
- continuous reflection and updating
- evidence of understanding
- future reuse of context

The homepage should explain the product before it explains every feature.

### Stage 3 — App-shell inheritance

Only after the public direction is coherent should the authenticated/app experience inherit the refreshed tokens, typography, navigation language, and component styling.

This stage must remain primarily presentational unless a separate functional change is explicitly approved.

## Hard Regression Boundaries

The refresh must **not accidentally alter, remove, or destabilize** existing functional behavior in these areas:

- `/app`
- interviews
- ALVIRA Context creation
- adding context before, during, or after an interview
- file/document uploads
- URL/source ingestion
- Reflect / Reflect Build behavior
- saved-profile continuation
- authentication
- accounts
- persistence/data models
- APIs
- backend behavior
- production deployment configuration

Treat these as protected boundaries during brand work.

Any functional change inside these systems should be isolated, intentional, separately reviewed, and explicitly documented.

## Existing Product Behaviors to Preserve

The refresh should not erase the product direction already established around flexible context collection. Users should be able to contribute context through more than one path rather than being forced through a single mega-interview.

The shared context system should continue to support the principle:

> **Seed what is already known, trust strong context, and ask only for genuine gaps.**

Reflection should build on accumulated context rather than behave like an unrelated standalone workflow.

## ALVIRA Bridge

ALVIRA Bridge should be treated as a **secondary ALVIRA capability**, not repositioned as a separate public flagship product during this refresh.

Its role should remain downstream of established user context/account state rather than competing with ALVIRA Context for the homepage narrative.

## Ecosystem Context

ALVIRA's role in the broader product ecosystem is **Context Intelligence**.

Other ecosystem products may specialize in portfolio/product intelligence, authorization/governance, or execution, but ALVIRA's identity should remain clear and independently understandable. The public ALVIRA experience should not require visitors to understand the entire ecosystem before understanding ALVIRA itself.

Cross-product references should be subtle and useful rather than turning the ALVIRA homepage into an ecosystem map.

## Implementation Rules for Agents

Any agent working on this branch should:

1. Read this directive before making redesign decisions.
2. Treat the branch as exploratory/preview-only.
3. Keep `main` and production untouched unless explicitly instructed otherwise.
4. Prefer reusable design tokens/components over one-off page styling.
5. Separate visual/brand changes from functional changes whenever possible.
6. Preserve existing routes and product behavior.
7. Verify protected flows after changes that touch shared layouts/components.
8. Avoid making unsupported capability claims in public copy.
9. Clearly distinguish demonstration/simulated states from live product intelligence when relevant.
10. Optimize for a coherent product category and experience rather than cosmetic novelty.

## Definition of Success

The refresh is successful when a new visitor can quickly understand all of the following:

- ALVIRA is a **Context Intelligence** product.
- It helps AI understand the user rather than merely collect profile fields.
- That understanding is built from multiple context sources.
- The resulting context can be reflected on and updated continuously.
- ALVIRA becomes more useful as its understanding evolves.
- The visual system feels intentional and distinctive without compromising the existing product.

And, critically, the existing working application continues to work.
