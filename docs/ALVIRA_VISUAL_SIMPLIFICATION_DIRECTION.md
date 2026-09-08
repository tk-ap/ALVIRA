# ALVIRA Visual Simplification Direction

**Status:** approved product direction

## Why this exists

ALVIRA has received credible feedback that the experience presents too much information at once. The problem is not that the product has too many ideas; it is that too many ideas are currently explained through dense copy, stacked concepts, and text-heavy surfaces.

ALVIRA should increasingly help people **see and feel the product value before asking them to read a lot about it**.

Core design rule:

> **Show first. Explain second. Detail third.**

The goal is not to decorate the product. The goal is to reduce cognitive load, improve comprehension, and make Context Intelligence legible through visual behavior.

## Product principle

Visuals should replace explanation burden where possible.

Use visuals to show:

- what context looks like;
- what fragmented or stale context looks like;
- how ALVIRA organizes and maintains context;
- what gets reused and where;
- what changed over time;
- what is certain, uncertain, outdated, or needs review;
- how another AI or tool becomes more useful when it receives the right context.

Do not add illustration simply to make the site feel more designed. Every major visual should clarify a product concept, state, relationship, or flow.

## Priority order

### 1. Homepage visual simplification

The homepage should communicate the core idea faster with fewer words.

Preferred pattern:

**scattered context inputs → ALVIRA organizes/maintains them → relevant context reaches the right AI/tool**

Use one strong hero/system visual rather than several competing explanation blocks.

Reduce or progressively disclose copy that repeats the same value proposition in different language.

The homepage should not become a catalog of every ALVIRA concept or feature.

### 2. Onboarding / first-run experience

Replace dense explanatory text with more choice-driven and visual interaction.

Prefer:

- choice cards;
- source icons;
- examples of what ALVIRA understood;
- lightweight previews;
- one decision per screen where practical;
- visible review states.

Avoid long setup instructions before the user has experienced value.

### 3. “How ALVIRA works” visual system

Use a concise visual sequence such as:

**Capture → Understand → Maintain → Reuse**

Each step should have one visual idea and one short sentence.

This should teach the product without requiring the user to learn internal architecture or technical vocabulary.

### 4. Context review / Context Mirror

The saved and live Context experience should feel less like reading a large profile and more like inspecting a maintained understanding.

Prefer visual states for:

- confirmed;
- new;
- uncertain;
- changed;
- stale/outdated;
- contradictory;
- needs review.

Use grouped cards, change highlights, confidence/status markers, and progressive disclosure instead of long undifferentiated text blocks.

### 5. Reuse / Bridge explanation

Make the sharing boundary visually obvious.

Show:

- what Context is being shared;
- what is not being shared;
- where it is going;
- what the receiving tool gets;
- whether the action is manual reuse or governed Bridge access.

A visual envelope / flow model is preferred over paragraph-heavy explanation.

### 6. Context Types quiz

The Context Types quiz should live as a dedicated visual side route rather than another dense homepage section.

Recommended architecture:

**Homepage secondary CTA → dedicated visual quiz → Context Type result → failure mode → Build your actual Context**

Use illustrated type cards, scene-based questions, soft progress, and a visually led result page.

Do not place all five archetypes as another large homepage content block.

## Reusable visual patterns

### Before / after

Show the difference between:

- AI without durable context;
- AI with relevant ALVIRA Context.

### Source → ALVIRA → destination

Use a simple systems visual for:

- chats;
- files;
- notes;
- imported AI profiles;
- ALVIRA Context;
- downstream tools or assistants.

### Context cards

Use small visual units for categories such as:

- goals;
- preferences;
- constraints;
- projects;
- history;
- relationships;
- working style.

### Change visualization

Make it easy to see:

- what changed;
- what stayed the same;
- what ALVIRA thinks may have changed;
- what requires user confirmation.

### Lightweight diagrams

Use simple diagrams for portability, Reuse, Bridge, Context maintenance, and other concepts that otherwise require multiple paragraphs.

## Interaction and visual-density guardrails

- Favor whitespace over stacking more cards.
- Keep one primary idea per section or screen.
- Prefer short labels and visual hierarchy over explanatory paragraphs.
- Use progressive disclosure for detail.
- Avoid dashboard density unless the user is explicitly in a management surface.
- Avoid turning every concept into a bordered card.
- Avoid decorative graphics that add noise without explanation value.
- Avoid excessive animation; motion should clarify state, flow, or continuity.
- Preserve accessibility and readable contrast.
- The visual system should remain premium, restrained, and calm rather than playful everywhere.

## Copy rule

Before adding explanatory copy, ask:

> Can this be shown more clearly than it can be explained?

If yes, prefer the visual explanation and keep supporting text short.

## Success criteria

Visual simplification should improve:

- time to understand what ALVIRA does;
- homepage-to-start conversion;
- onboarding completion;
- comprehension of Context, Reuse, and Bridge;
- ability to understand Context state without reading large text blocks;
- user-reported clarity;
- reduction in feedback that ALVIRA feels information-heavy or overwhelming.

## Implementation boundary

This direction does not authorize a broad redesign that risks current product functionality.

Implementation should be incremental and must preserve existing regression boundaries around:

- `/app`;
- interviews;
- Add Context;
- Reflect;
- uploads;
- auth;
- persistence/data models;
- Bridge behavior;
- current deployment reliability.

Visual simplification should reduce explanation burden without destabilizing the product.
