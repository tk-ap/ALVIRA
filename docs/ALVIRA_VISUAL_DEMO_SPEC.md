# ALVIRA Visual Demo Spec

**Status:** approved product direction / implementation spec

## Purpose

ALVIRA visuals should function as lightweight product proof. The user should be able to understand the product from realistic cause-and-effect demonstrations without having to read dense explanation first.

This extends `ALVIRA_VISUAL_SIMPLIFICATION_DIRECTION.md` and follows the rule:

> **Show first. Explain second. Detail third.**

The highest-value demos should make the user think:

> “Oh, I get it. It actually understood that.”

## Core demo principle

Every meaningful visual should prove a specific product behavior.

Preferred pattern:

**user action → ALVIRA interpretation → visible state change → smarter next step**

The relationship between cause and effect must be obvious.

Do not use animation simply to make the site feel more dynamic. Motion should clarify understanding, state, continuity, change, or reuse.

## Demo fidelity standard

Demos should use:

- realistic interview responses;
- realistic product UI;
- realistic processing speed;
- realistic ALVIRA outputs;
- actual product terminology;
- product states that match current implemented capability.

Avoid:

- fake cinematic product theater;
- impossible outputs;
- instantly appearing complex results that would not happen in the real product;
- demos that imply Bridge, Reflect, or Context behavior that is not actually supported;
- placeholder/lorem ipsum examples;
- typing speeds that feel artificial or unreadable.

If a demonstrated capability is conceptual rather than implemented, label it clearly as an illustrative concept rather than presenting it as observed behavior.

## Timing guidance

Suggested ranges:

- **micro-interaction loop:** 6–12 seconds;
- **homepage hero/demo loop:** 10–18 seconds;
- **focused product walkthrough:** 20–40 seconds;
- **narrated or expanded E2E explainer:** 45–90 seconds maximum.

Timing should be fast enough to hold attention but slow enough to read.

Use brief pauses after important state changes so the viewer can understand what changed before the next action begins.

## Priority demo scenarios

### 1. Interview understanding — primary homepage proof

**Goal:** prove that ALVIRA does more than collect answers.

**Suggested scenario:**

A user types a natural response such as:

> “I’m balancing building my company with making music again, and I don’t want AI making final creative decisions for me.”

Then show ALVIRA visibly identify relevant context such as:

- current project / founder priority;
- creative practice;
- boundary around AI involvement;
- any uncertainty that still needs confirmation.

Then show the Context Mirror update.

Then show a more targeted next question that clearly follows from what ALVIRA learned.

**What this clip must prove:**

ALVIRA converts natural conversation into maintained, structured understanding and uses that understanding immediately.

**Recommended length:** 10–18 seconds.

### 2. Context Mirror update — continuity proof

**Goal:** show that Context is living, not a static profile export.

Sequence:

1. show an existing Context card;
2. user gives a new answer;
3. one or more states update visibly;
4. label changes such as **new**, **confirmed**, **changed**, **uncertain**, or **needs review**;
5. the previous understanding remains inspectable where appropriate.

**What this clip must prove:**

ALVIRA maintains understanding over time rather than overwriting context invisibly.

**Recommended length:** 8–14 seconds.

### 3. Add Context / imported AI profile — provenance and review proof

**Goal:** show that users can bring in useful prior context without treating imported AI output as automatic truth.

Sequence:

1. user adds a realistic ChatGPT/Claude/Gemini context profile or document;
2. ALVIRA extracts several claims;
3. claims appear with review states;
4. direct statements, weaker inference, possible stale items, or conflicts are visibly distinguished;
5. user approves, revises, or skips;
6. only reviewed material becomes part of the active Context flow.

**What this clip must prove:**

ALVIRA can bootstrap from existing AI history while preserving provenance, uncertainty, and user control.

**Recommended length:** 15–25 seconds.

### 4. Smarter follow-up / gap detection — “only ask what matters” proof

**Goal:** show why ALVIRA is different from a static questionnaire.

Sequence:

1. show several areas already covered;
2. show one real gap or low-confidence area;
3. ALVIRA skips already-known information;
4. next question targets the unresolved gap.

**What this clip must prove:**

ALVIRA uses existing Context to avoid unnecessary repetition and focus on what is still genuinely unknown.

**Recommended length:** 8–14 seconds.

### 5. Reuse — portability proof

**Goal:** demonstrate the value of maintaining Context once.

Sequence:

1. select a saved Context;
2. show a compact preview of what will be shared;
3. show excluded or unselected context remaining private;
4. show a prepared Context block or supported destination flow;
5. show the downstream assistant beginning with the relevant context already available.

**What this clip must prove:**

ALVIRA helps the user carry relevant understanding forward without manually re-explaining everything.

**Recommended length:** 12–20 seconds.

### 6. Bridge — governed sharing proof

**Goal:** explain Bridge visually without requiring architecture-heavy copy.

Sequence:

**selected Context → explicit scope/consent → receiving agent/tool**

Make visible:

- what is selected;
- what is not selected;
- where it is going;
- that Context sharing is bounded and reviewable.

Do not imply that Context itself grants action authority.

**What this clip must prove:**

Bridge is governed Context access, not unrestricted sync.

**Recommended length:** 12–20 seconds.

### 7. “What changed?” — maintenance proof

**Goal:** make the value of Context history immediately legible.

Sequence:

1. previous Context state;
2. a new user statement or update;
3. changed item highlighted;
4. unchanged items remain visually quiet;
5. history/change view shows before and after.

**What this clip must prove:**

ALVIRA tracks how understanding evolves instead of pretending the latest state has always been true.

**Recommended length:** 8–14 seconds.

## Homepage placement

### Hero

Use **one primary demo**, not a carousel of competing concepts.

Recommended hero proof:

**typed interview response → visible understanding → Context Mirror update → smarter next question**

Supporting copy should be short enough that the visual carries most of the explanatory burden.

The hero demo should loop cleanly and remain understandable even if the user starts watching halfway through.

### Mid-page supporting proof

Use one or two focused visuals later in the page for concepts that need separate proof, such as:

- **Maintain** — Context update/history;
- **Reuse** — selected Context moving to another AI/tool.

Do not turn the homepage into a full product tour.

### Context Types quiz CTA

Keep the quiz as a secondary path:

**Homepage secondary CTA → `/context-type` → dedicated visual quiz → result → Build your actual Context**

The quiz should not compete with the main product demo for hero attention.

## Onboarding placement

Visual proof should continue inside `/app` rather than ending on the marketing site.

Preferred moments:

- show a small live preview of what ALVIRA understood after a meaningful answer;
- show Context Mirror updates instead of lengthy explanations;
- use visual review states for imported claims;
- let users see why the next question was selected;
- progressively disclose deeper detail only when requested.

The onboarding goal is to make value visible before the full Context is complete.

## Interaction behavior

### Typed responses

Typed demo text should feel human.

Guidelines:

- use realistic sentence lengths;
- avoid perfect marketing copy disguised as user input;
- use slight pauses at punctuation;
- do not type so slowly that the demo drags;
- do not type so quickly that viewers cannot read it;
- where practical, allow the entire answer to remain visible after typing completes.

### ALVIRA processing

Use short, believable transition states.

Examples:

- subtle thinking indicator;
- “Updating Context…”;
- one or two context cards changing;
- a concise reflection before the next question.

Do not use long artificial loading animations.

### Motion

Motion should communicate:

- input becoming structured Context;
- Context changing over time;
- relevant Context moving to another destination;
- confidence or review state changing;
- a question adapting based on prior understanding.

Prefer restrained transitions over dramatic animation.

## Visual hierarchy

A viewer should be able to understand each demo with minimal copy.

Prioritize:

1. user action;
2. ALVIRA interpretation;
3. visible state change;
4. next consequence.

Use labels sparingly and only where they clarify the state.

Examples:

- **Goal**
- **Preference**
- **Constraint**
- **New**
- **Confirmed**
- **Needs review**
- **Changed**

Avoid displaying too many metadata fields at once.

## Demo content library

Maintain a small set of approved, reusable demo personas/scenarios so the site does not invent random examples in different places.

Each scenario should include:

- initial user context;
- realistic interview response;
- claims ALVIRA is expected to identify;
- expected state changes;
- appropriate next question;
- any uncertainty or review state;
- whether the scenario is safe for public display.

Prefer broad, relatable situations such as:

- career decision;
- founder/project work;
- communication preferences;
- creative practice;
- family/logistics planning;
- learning goals;
- AI-use boundaries.

Avoid examples containing private founder information unless explicitly approved for public demonstration.

## Capture method

Preferred order:

1. **real product capture** from a stable demo/test account;
2. scripted deterministic demo state using actual product components;
3. carefully mocked UI only where real capture is not practical.

Real product capture is strongest because it also acts as lightweight product evidence.

If deterministic fixtures are used, they should exercise the same visible UI states as real users rather than a separate marketing-only implementation wherever practical.

## Accessibility and device behavior

- demos must remain understandable without audio;
- do not rely only on color to communicate state;
- preserve readable contrast;
- respect reduced-motion preferences;
- provide static fallback frames where motion is disabled;
- ensure text remains legible on mobile;
- avoid autoplay behavior that causes disruptive layout shifts;
- captions or short labels should be available when a visual cannot stand alone.

## Instrumentation / evidence

Measure whether visual proof actually reduces explanation burden.

Useful signals:

- homepage demo completion/engagement;
- hero → Build Context conversion;
- whether users interact with replay/pause/expand controls;
- time to first `/app` start;
- onboarding completion;
- reduction in “what does ALVIRA do?” feedback;
- comprehension testing after watching the demo;
- whether users correctly understand Context versus Bridge;
- whether users recognize that imported claims require review.

Do not optimize primarily for video watch time. The goal is product comprehension and conversion.

## Release criteria for a public demo

Before publishing a visual demo, verify:

- the demonstrated capability exists or is clearly labeled illustrative;
- the UI shown matches current product behavior closely enough to avoid deception;
- the timing is readable on mobile and desktop;
- cause and effect are obvious;
- no private or sensitive user data appears;
- the example does not imply Context equals authority;
- the example does not imply automatic truth from imported AI content;
- the demo works without sound;
- reduced-motion/static fallback exists where needed;
- the demo does not increase page density enough to undermine the visual simplification goal.

## Recommended implementation order

1. Build the **interview understanding** hero demo.
2. Add **Context Mirror update** as the second proof.
3. Add **Add Context/import review** proof once the import flow is stable in production.
4. Add **Reuse** proof.
5. Add **What changed?** history proof.
6. Add **Bridge** proof only when the current governed sharing behavior can be represented accurately.
7. Reuse the same visual language inside the Context Types quiz and onboarding.

## Implementation boundary

This spec does not authorize a broad redesign or marketing-only fake product surface.

Implementation must preserve current regression boundaries around:

- `/app`;
- interviews;
- Add Context;
- Reflect;
- uploads;
- auth;
- persistence/data models;
- Bridge behavior;
- deployment reliability.

The demos should be developed incrementally and should make the existing product easier to understand, not create a second product implementation solely for presentation.
