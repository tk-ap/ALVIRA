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

The homepage should read as **one composition**, not as editorial copy beside an unrelated product card.

Preferred sequence:

1. primary message and CTA establish why the product matters;
2. the demo spans the shared document width immediately beneath that message;
3. the demo reads as a restrained proof strip: prompt / answer / Context Mirror / adapted question;
4. borders and rules organize the sequence, but the demo should not look like a floating dashboard card competing with the headline.

The proof should inherit the same horizontal grid as the rest of the page. Avoid a separate boxed “Live product example” treatment with its own shadow, background weight, or independent alignment.

Keep enough whitespace that the demo remains one visual idea.

Do not surround the hero with multiple product screenshots, feature cards, or competing diagrams.

## Mobile composition

On mobile, do not shrink the desktop horizontal sequence until it becomes illegible.

Preferred sequence:

1. interview answer occupies the primary viewport;
2. Context Mirror updates reveal directly beneath it;
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
