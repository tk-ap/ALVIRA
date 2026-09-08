# ALVIRA Context Types Quiz

**Status:** approved product concept / backlog

## Purpose

Create a playful, consumer-friendly quiz that helps people recognize their own context-management behavior before they need to understand the term **Context Intelligence**.

This should not present itself as a psychological assessment or diagnosis. It is a lightweight self-assessment and education surface that turns an abstract product category into recognizable behavior.

## Product role

The quiz should help users recognize problems such as:

- repeatedly re-explaining themselves to AI;
- saving too much context without knowing what matters now;
- keeping useful context fragmented across multiple AI tools, notes, files, and chats;
- giving AI almost no persistent context and starting cold each time;
- manually maintaining context well, but at increasing effort and complexity.

The intended funnel is:

**Quiz → Context Type → recognizable failure mode → explain what better context management looks like → Build your actual Context**

The quiz should feel useful even before the user creates an ALVIRA Context.

## Initial Context Types

### The Context Hoarder

**Behavior:** Saves chats, files, notes, prompts, decisions, screenshots, and reference material because it might matter later.

**Failure mode:** The problem is not lack of context; it is relevance, retrieval, freshness, contradiction handling, and deciding what matters now.

**Core line:** “Your problem isn't having too much context. It's deciding what matters now.”

### The Context Repeater

**Behavior:** Gives AI useful context, but repeatedly has to explain the same preferences, background, goals, or project history in new conversations.

**Failure mode:** Good context exists, but continuity does not.

### The Context Minimalist

**Behavior:** Gives AI only what seems necessary for the immediate task.

**Failure mode:** The interaction stays clean, but the AI repeatedly starts cold and cannot build durable understanding over time.

### The Context Scatterer

**Behavior:** Different parts of useful context live in different places: ChatGPT, Claude, Gemini, Notes, documents, email, project tools, and elsewhere.

**Failure mode:** Context exists, but no system can reliably see the whole relevant picture when needed.

### The Context Curator

**Behavior:** Deliberately maintains useful context and updates it as goals, preferences, projects, and circumstances change.

**Failure mode:** Manual curation becomes expensive and tedious as the amount of context grows.

This is the closest archetype to the intended ALVIRA behavior, but it should not be framed as the “good” or winning personality type.

## Visual / interaction direction

### Core principle

**High visual clarity, low cognitive load.**

The quiz should teach through visuals and interaction rather than through walls of text. It should feel like an interactive editorial feature, not a dense survey or generic Typeform.

### Desired feel

- playful but premium;
- visually rich without becoming noisy;
- light on the eyes;
- recognizable and human rather than “AI dashboard” heavy;
- restrained enough to still feel like ALVIRA.

### Visual language

Use illustrated Context Type cards and lightweight scene-based graphics that make each behavior recognizable at a glance.

Suggested visual metaphors:

- **Context Hoarder:** stacked notes, tabs, screenshots, files, saved prompts, overflowing references;
- **Context Repeater:** looping speech bubbles, repeated instructions, circular handoff/re-explanation visual;
- **Context Minimalist:** sparse workspace, a few isolated blocks, intentionally empty space;
- **Context Scatterer:** context fragments distributed across multiple app windows/tools with broken or partial connections;
- **Context Curator:** organized folders, connected nodes, selectively surfaced context, visible maintenance/update cues.

These should be expressive and memorable, but not cartoonishly loud.

### Question interaction style

Prefer visual and lightweight interactions such as:

- tap an illustrated scenario card;
- choose between two or more visual situations;
- select “this looks most like me”;
- use a simple preference spectrum when useful;
- show small context fragments or mini-scenes rather than long descriptions.

Avoid a long sequence of plain radio-button lists.

Each screen should communicate one idea at a time.

### Progress and motion

Use soft progress indicators such as:

- progress dots;
- small pills;
- a restrained step indicator;
- subtle transitions between questions and result states.

Motion may be used to reinforce comprehension, but should remain premium and minimal rather than arcade-like.

### Result-page visual structure

The result should be visually led.

Recommended order:

1. **Large Context Type hero visual**
2. **Your Context Type**
3. Short behavior summary
4. **How your context behaves** — simple diagram/graphic
5. **Where friction shows up** — visual failure point
6. “What this gets right”
7. “Where it breaks down”
8. One memorable insight line
9. **What better context management looks like** — before/after or transformation visual
10. CTA: **Build your actual Context**

The page should explain ALVIRA through the transformation, not through a feature dump.

### UI guardrails

- Use generous whitespace.
- Keep copy short per screen.
- Avoid card-heavy dashboard composition just because the experience is interactive.
- Avoid harsh contrast, visual clutter, or too many simultaneous signals.
- Do not make every question look like a form field.
- Do not overuse gradients, glass effects, or generic AI imagery.
- Graphics should support comprehension, not decoration for its own sake.
- Preserve ALVIRA's restrained, editorial, premium design direction.

### Product lesson encoded in the visuals

The visual system should reinforce this idea:

> People recognize context behaviors before they recognize “Context Intelligence” as a category.

The graphics should help the user see how their context moves, gets lost, piles up, repeats, fragments, or gets maintained.

## Design principles

- No type is inherently good or bad.
- Results should describe recognizable behavior, not identity or psychology.
- The tone can be playful, memorable, and shareable without becoming gimmicky.
- The result should teach a context-management failure mode in plain language.
- Each result should naturally explain why Context Intelligence is useful without turning into an immediate hard sell.
- Do not require the user to already know what “Context Intelligence” means.
- The quiz should be understandable by nontechnical users.
- Avoid generic productivity/personality-test language.
- Prefer high recognition and low cognitive load over information density.

## Data / Context boundary

Quiz answers are **lightweight self-report signals**, not authoritative ALVIRA Context.

They may inform onboarding or help choose what to explain next, but should not silently become durable claims about the user.

If quiz-derived signals are ever incorporated into Context, they must follow normal ALVIRA evidence rules: provenance, explicit review/confirmation where appropriate, and separation between direct user statements and ALVIRA interpretation.

## Product hypothesis

A Context Types quiz may be a lower-friction way to teach the market what Context Intelligence solves than leading with the category name itself.

The hypothesis is not that people want a personality quiz. The hypothesis is that people already recognize behaviors such as re-explaining, scattering, hoarding, or under-sharing context, and those behaviors create a natural bridge into ALVIRA's value proposition.

## Evidence to collect

- Completion rate from quiz start to result.
- Which types are most common.
- Whether users recognize themselves in the result.
- Result → Build Context conversion.
- Whether users can explain ALVIRA's value more clearly after the quiz.
- Whether a quiz result improves onboarding completion or reduces explanation burden.
- Whether users share results organically.
- Whether visually led questions improve completion versus text-heavy questions.

## Implementation priority

Backlog as a lightweight education / acquisition experiment. It should not displace core product reliability, Context quality, onboarding, or revenue-path work.
