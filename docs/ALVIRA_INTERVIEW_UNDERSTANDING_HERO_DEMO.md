# ALVIRA Interview Understanding Hero Demo

**Status:** approved implementation detail / first visual proof target

This spec expands the first-priority scenario in `ALVIRA_VISUAL_DEMO_SPEC.md`.

## Objective

The homepage hero demo should prove one thing quickly:

> **ALVIRA does not just collect answers. It turns natural conversation into maintained Context and immediately uses that understanding to ask a better next question.**

The viewer should understand the product from the visual cause-and-effect even if they read almost none of the surrounding copy.

Core sequence:

**natural answer → ALVIRA notices specific context → Context Mirror updates → next question adapts**

The intended viewer reaction is:

> “Oh, I get it. It actually understood that.”

## Public demo scenario

Use a broad fictional scenario rather than founder-private context.

### Interview prompt shown

> **What are you trying to make easier right now?**

### Typed user response

> “I’m changing careers and taking night classes. I want AI to help me stay organized, but I still want to make the actual decisions myself.”

Why this works:

- recognizable to a nontechnical audience;
- contains more than one useful signal;
- demonstrates that ALVIRA can distinguish a goal, current constraint, and AI-use preference;
- creates a genuine unresolved gap that can drive the next question;
- does not depend on private founder information;
- avoids sounding like marketing copy disguised as user input.

## Expected interpretation

The hero should not expose internal extraction machinery or a wall of metadata. Show only the few pieces needed to make the understanding visible.

Suggested Context Mirror updates:

- **Goal** — Change careers
- **Current reality** — Taking night classes
- **AI preference** — Help me organize, not decide for me

Optional fourth state only if the current product supports it clearly:

- **Needs clarity** — Career direction not yet specified

Do not show confidence percentages in the hero unless they are already a natural part of the real product UI. The goal here is comprehension, not ontology inspection.

## Smarter next question

After the Context Mirror updates, show a targeted next question such as:

> **What kind of work are you hoping to move into?**

This question matters because it visibly follows from the unresolved part of the user’s answer. It should make the adaptation legible without any explanatory paragraph.

Avoid a generic next question that could have appeared regardless of the answer.

## 14–16 second storyboard

Target duration: **approximately 15 seconds**.

### 0.0–1.2s — Establish the real product state

Show the interview UI already open.

Visible:

- current question;
- response field;
- a compact Context Mirror beside or below it, depending on breakpoint;
- no large explanatory overlays.

Hold long enough for the user to orient.

### 1.2–6.0s — Human response appears

Type the response at a readable human-like pace:

> “I’m changing careers and taking night classes. I want AI to help me stay organized, but I still want to make the actual decisions myself.”

Typing behavior:

- slight pauses after sentence punctuation;
- no exaggerated typo simulation;
- do not animate individual keystrokes so slowly that the viewer waits on the demo;
- keep the completed response visible after typing finishes.

If autoplay typing still feels too slow on mobile, the response may appear in two or three natural phrase chunks rather than letter-by-letter.

### 6.0–7.0s — Brief processing state

Show a restrained state such as:

**Updating Context…**

or the actual equivalent already used by the product.

Duration should feel believable but not theatrical.

Do not use a long spinner or fake chain-of-thought animation.

### 7.0–10.8s — Context Mirror visibly updates

Introduce the three Context items one at a time or with a restrained stagger:

1. **Goal** — Change careers
2. **Current reality** — Taking night classes
3. **AI preference** — Help me organize, not decide for me

Recommended motion:

- existing empty/neutral state resolves into the new item;
- subtle highlight when each item becomes active;
- no large flying cards or dramatic zooms;
- keep all three readable together by the end of this beat.

The viewer must be able to connect each item back to words they just saw in the answer.

### 10.8–13.8s — Better next question appears

Transition the interview prompt to:

> **What kind of work are you hoping to move into?**

A short visual cue may connect the unresolved career goal to the next question, but this is optional. Do not add explanatory copy such as “ALVIRA chose this because…” in the default hero loop.

The adapted question itself should be enough proof.

### 13.8–15.5s — Hold on proof state

Hold on the completed cause-and-effect state:

- original answer remains visible or partially visible;
- Context Mirror contains the extracted understanding;
- smarter next question is visible.

This final hold is important. Do not restart the loop immediately after the question changes.

Then fade/reset cleanly.

## Loop behavior

The demo must still make sense if someone begins watching halfway through.

Requirements:

- final state should remain visible long enough to understand;
- reset should be soft rather than a hard flash;
- do not place critical explanatory meaning only in the first second;
- if the user interacts with the demo, pause the automatic loop where practical;
- provide replay if the format supports controls without adding clutter.

## Desktop composition

Preferred composition:

- **left / primary:** interview conversation and response;
- **right / secondary:** compact Context Mirror.

The Context Mirror should feel like a live consequence of the answer, not a separate dashboard competing for attention.

Keep enough whitespace that the demo remains one visual idea.

Do not surround the hero with multiple product screenshots, feature cards, or competing diagrams.

## Mobile composition

On mobile, do not shrink the desktop split view until it becomes illegible.

Preferred sequence:

1. interview answer occupies the primary viewport;
2. Context Mirror updates slide or reveal directly beneath it;
3. next question becomes visible after the update.

Keep the same causal order even if the layout stacks vertically.

Text must remain readable without pinch zoom.

## Static / reduced-motion fallback

For `prefers-reduced-motion` or any environment where autoplay should not run, show a static proof state containing:

- the completed user response;
- the three Context Mirror items;
- the adapted next question.

Use a short label only if needed:

**ALVIRA turns what you say into Context it can use next.**

Do not replace the fallback with a generic product screenshot that loses the cause-and-effect relationship.

## Supporting hero copy

The surrounding copy should be minimal because the demo is doing the explanatory work.

Recommended pattern:

**Headline:**
> AI works better when it actually knows you.

**Support:**
> ALVIRA builds and maintains the Context your AI keeps missing.

**Primary CTA:**
> Build your Context

**Secondary CTA:**
> What’s your Context Type?

These are directional examples, not authorization to overwrite current ratified homepage copy without review. If the current copy already communicates the same idea more effectively, preserve it.

## Product fidelity requirements

The demo must use behavior the live product can genuinely support.

Before implementation, verify against the current interview engine:

- whether the shown prompt can exist in the real interview flow;
- whether these three pieces of Context can be represented in the current schema/UI;
- whether the Context Mirror can update at the demonstrated point in the flow;
- whether the next-question engine can produce a gap-driven follow-up equivalent to the one shown;
- whether the processing state matches actual behavior closely enough to avoid deception.

If any part is not currently supported, do not fake it as observed behavior. Either:

1. narrow the demo to the supported behavior; or
2. label the relevant portion as illustrative until the product catches up.

## Preferred implementation method

Order of preference:

1. **scripted deterministic fixture using actual interview and Context Mirror components**;
2. real product capture from a stable demo/test account;
3. carefully mocked marketing-only implementation only if the first two are impractical.

For the homepage hero, deterministic fixtures are likely preferable to a prerecorded video because they can:

- remain crisp across breakpoints;
- respect reduced-motion preferences;
- use real product components;
- avoid video compression and autoplay-policy problems;
- be instrumented directly;
- stay easier to update when UI changes.

However, the fixture must not create behavior that the real product cannot perform.

## Component behavior contract

The implementation should conceptually expose a small deterministic sequence rather than embedding timing logic throughout the hero.

Suggested states:

- `idle`
- `typing`
- `processing`
- `context_updated`
- `next_question`
- `hold`
- `reset`

The visual sequence should be data-driven so public demo content can later be swapped without rewriting animation logic.

Suggested fixture fields:

- `question`
- `response`
- `context_updates[]`
- `next_question`
- `timing`
- `public_safe`

Do not couple the fixture to billing tier, private user records, or production persistence.

## Visual restraint rules

- no fake terminal/code imagery;
- no floating AI-brain graphics;
- no giant animated network just to signal “context”;
- no particle effects;
- no more than three primary extracted items in the first hero proof;
- no dense confidence/provenance metadata in the hero;
- no long paragraph explaining what just happened;
- no sound required;
- no motion that competes with reading the typed response.

The visual should feel like the actual product becoming useful, not an advertisement layered on top of it.

## Accessibility

- preserve keyboard/focus behavior if the demo contains interactive controls;
- do not use color as the sole distinction between Context labels;
- maintain readable contrast;
- respect `prefers-reduced-motion`;
- ensure the entire proof is understandable without audio;
- avoid screen-reader noise from repeatedly replaying decorative demo state; animated fixture content should be hidden or summarized appropriately for assistive technology if needed.

## Instrumentation

Track whether the hero is clarifying the product rather than merely attracting attention.

Recommended events:

- `hero_demo_viewed`
- `hero_demo_completed`
- `hero_demo_replayed`
- `hero_primary_cta_clicked`
- `hero_context_type_cta_clicked`

Useful comparisons:

- hero → Build Context conversion before/after demo;
- bounce/scroll behavior around the hero;
- onboarding start rate;
- comprehension feedback such as “What does ALVIRA do?”;
- mobile versus desktop completion/engagement.

Do not optimize the sequence primarily for replay count or watch time.

## Acceptance criteria

The hero demo is ready for public use when:

- a new viewer can correctly describe the basic behavior after one loop;
- the answer → Context → next-question relationship is visually obvious;
- the full loop lands in roughly 14–16 seconds on default timing;
- the copy remains legible on representative mobile and desktop sizes;
- the static/reduced-motion state communicates the same core proof;
- all visible outputs are plausible results of the current product;
- no private or sensitive user data appears;
- the demo does not increase homepage cognitive load;
- the primary CTA remains obvious;
- existing `/app`, interview, Context Mirror, Add Context, Reflect, auth, persistence, and Bridge behavior remain untouched unless separately approved.

## Build boundary

This spec defines the hero proof and its implementation behavior. It does **not** authorize a broad homepage redesign.

Build this as a contained visual proof first. Review it in a preview environment against the current homepage, especially for:

- whether the page feels less text-heavy;
- whether the demo competes with or strengthens the current hero copy;
- mobile legibility;
- timing;
- whether viewers understand that the Context Mirror is maintained understanding, not merely a one-time summary.

Only after the proof works should additional homepage visuals be added.