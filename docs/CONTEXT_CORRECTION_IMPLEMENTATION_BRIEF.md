# Implementation Brief — Failure-Triggered Context Correction

**Status:** Implementation brief for owner-ratified direction
**Ratified:** 2026-09-08 — `docs/CONTEXT_INTELLIGENCE_ROADMAP.md` → *Near-term follow-up → Failure-triggered Context correction*
**Scope:** Smallest shippable version. Post–Revision 11; the direction is owner-ratified, the interaction design below is a working hypothesis.

## Problem

Maintained Context goes stale and ALVIRA currently has no way to learn that it has. Asking
users to periodically review their profile does not work, because tidying a profile is not a
thing anyone wants to do.

The moment staleness actually costs the user something already exists and ALVIRA does not
capture it: **their AI answers wrong about them.** That moment is specific, felt, and dated.
It is the only reliable trigger available for a user who runs no agents.

## Principle

**Elicitation triggered by observed failure, not surveillance.**

ALVIRA does not watch the user's AI usage. The user brings the failure to ALVIRA. This
distinction is what keeps ALVIRA out of ambient capture, and it must not be traded away for
convenience.

The user reports a **symptom**. ALVIRA proposes a **question**. The user supplies the
**answer**. Nothing else writes Context.

## Flow

```
user notices their AI got something wrong about them
        ↓
reports it in one step (paste the answer, or describe it)
        ↓
ALVIRA diagnoses which Context is implicated
        ↓
ALVIRA asks ONE targeted question
        ↓
user confirms or corrects
        ↓
existing validation path → durable Context + history snapshot
```

## Requirements

### R1 — Reporting is one step

An affordance reachable from `/context` and from the Context Mirror. Not buried in settings,
not a multi-screen form.

The user may either paste the offending AI output or describe the problem in their own words.
Both must be accepted; requiring a paste excludes voice, screenshots, and paraphrase.

Do not ask the user which Context domain is wrong. Diagnosing that is ALVIRA's job — asking
the user to categorise their own problem is the failure mode this feature exists to avoid.

### R2 — Diagnosis names the implicated Context

Given the report, identify which existing Context items are `contradicted`, `stale`,
`ambiguous`, or `missing`. Reuse the vocabulary already established for Context state
(Observed / Inferred / Confirmed / Outdated) rather than introducing a parallel taxonomy.

Show the user what ALVIRA thinks is implicated before asking. A diagnosis the user can see is
a diagnosis they can reject.

### R3 — One question, not an interview

The output of a report is a single targeted question. If diagnosis implicates several
domains, ask about the highest-confidence one and hold the rest.

A reported failure must never open a full interview. The user came to fix one thing.

### R4 — The pasted material is evidence, never a source

This is the hard constraint.

- Pasted AI output must **not** be ingested as Context.
- Nothing in it may become Confirmed Context without the user answering the question.
- It may be stored as evidence attached to the resulting Context change, subject to R5.

Violating this turns ALVIRA into a system that infers Context from machine output, which is
the property that distinguishes it from ambient work-memory products.

### R5 — Retention of pasted material is opt-in

Pasted AI output can contain third-party information, client details, or content the user
never intended to store. Default to discarding the raw text after diagnosis and retaining
only the derived signal (which Context was implicated, what type, when).

Offer explicit retention if the user wants the evidence attached to the history entry.
State the default plainly at the point of paste.

### R6 — The resulting change follows the existing path

No new write path. A confirmed correction goes through current validation, produces a history
snapshot per the existing history model, and records provenance indicating it originated from
a user-reported AI failure rather than from an interview answer.

## Surfaces

| Surface | Change |
| --- | --- |
| `src/routes/context.tsx` | Entry affordance. Wording below. |
| `src/routes/history.tsx` | Corrections appear in history, distinguishable from interview-sourced changes. |
| New route or modal | The report → diagnosis → question flow. A modal on `/context` is sufficient for v1; a dedicated route is not required. |
| API | Accepts the report, returns diagnosis plus one question. Does not write Context. A separate confirm call performs the write through the existing validation path. |

## Copy blocks

Entry affordance:

> **Your AI got something wrong about you?**
> Tell ALVIRA what it said. We will work out what needs updating.

Paste screen, retention notice:

> Paste what your AI said, or describe what it got wrong.
> ALVIRA uses this to work out which part of your Context is out of date, then discards it.
> You can choose to keep it attached to the change.

After diagnosis, before the question:

> This looks like it came from: **{Context item}**
> Recorded as *{Observed | Inferred | Confirmed}* on {date}.

Wrong-diagnosis escape, required:

> That is not it → *(lets the user pick a different domain, or say they are not sure)*

## Acceptance criteria

1. A user can report a failure from `/context` in one interaction, by paste or by description.
2. The report produces a named implicated Context item and exactly one question.
3. The user can reject the diagnosis and still be helped.
4. No Context is written before the user answers the question.
5. Pasted text is discarded by default after diagnosis; retention is explicit and opt-in.
6. A confirmed correction produces a history entry distinguishable from an interview-sourced change.
7. Provenance on the resulting Context records the correction origin.
8. Reporting a failure never opens a full interview.

## Out of scope for v1

- Agent-emitted drift signals. Deferred; see the roadmap's *Intentionally deferred* section and
  the draft `contracts/context-signal.schema.json` in `tk-ap/agent-os`.
- Browser extension or any automatic capture of AI conversations. This would convert the
  feature into ambient surveillance and invert the principle above.
- Batch correction of multiple domains from a single report.

## Beta evidence

- Do users report failures when reporting is one step?
- Does the diagnosed domain match what the user says was wrong? (Measures whether diagnosis
  is good enough to keep; if users routinely hit "that is not it", the feature is asking them
  to categorise after all.)
- Does answering the question feel worth the interruption?
- Do reported corrections produce more return visits than history review does?
