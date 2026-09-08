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

## Design principles

- No type is inherently good or bad.
- Results should describe recognizable behavior, not identity or psychology.
- The tone can be playful, memorable, and shareable without becoming gimmicky.
- The result should teach a context-management failure mode in plain language.
- Each result should naturally explain why Context Intelligence is useful without turning into an immediate hard sell.
- Do not require the user to already know what “Context Intelligence” means.
- The quiz should be understandable by nontechnical users.
- Avoid generic productivity/personality-test language.

## Data / Context boundary

Quiz answers are **lightweight self-report signals**, not authoritative ALVIRA Context.

They may inform onboarding or help choose what to explain next, but should not silently become durable claims about the user.

If quiz-derived signals are ever incorporated into Context, they must follow normal ALVIRA evidence rules: provenance, explicit review/confirmation where appropriate, and separation between direct user statements and ALVIRA interpretation.

## Suggested result structure

1. **Your Context Type**
2. One-line behavior summary
3. “What this gets right”
4. “Where it breaks down”
5. One memorable insight line
6. “What better context management looks like”
7. CTA: **Build your actual Context**

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

## Implementation priority

Backlog as a lightweight education / acquisition experiment. It should not displace core product reliability, Context quality, onboarding, or revenue-path work.
