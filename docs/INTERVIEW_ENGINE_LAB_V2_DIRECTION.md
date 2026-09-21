# Interview Engine Lab v2 — Context Baseline and Portability Proof

**Status:** Lab behavior implemented on the isolated `codex/interview-lab` branch; not a production implementation authorization.

The Interview Engine Lab is being treated as the working **Interview Engine v2** direction. v2 extends the adaptive interview from “build a useful Context” to “help the user prove that the Context is useful, portable, and still under their control in the AI tools they actually use.”

This is both product behavior and a formal portability-proof loop. The Lab should let a user determine viability in their own environment without turning an external AI's response into unquestioned truth or implying that ALVIRA has a native integration where none exists.

The current Lab implementation keeps the entire run in browser/session state. It provides manual tool-response capture, deterministic first-pass classification with user override, baseline-aware Lab v2 prompting, an editable Context Mirror, an approved local Context receipt, manual same-question reruns, and separately recorded update, withholding, and revocation checks. It does not create a production profile, draft, Bridge authorization, or durable Context version.

## User journey

The canonical v2 journey is:

```text
OPTIONAL BASELINE
  → GAP MAP
  → ADAPTIVE INTERVIEW
  → CONTEXT MIRROR
  → APPROVE / CORRECT
  → PORTABLE CONTEXT
  → CONNECT TOOLS
  → RERUN BASELINE
  → CONTEXT LIFT REPORT
  → MAINTAIN / UPDATE / REVOKE
```

The baseline is optional. A user may skip it and start the interview immediately. Skipping must not be treated as failure or consent to fabricate a baseline; it simply means the interview uses the normal adaptive path and the user can establish a portability comparison later.

## 1. Optional pre-interview Context Baseline

Before the interview, ALVIRA offers a standardized question set that the user can run against the current stack of AI tools they already use. The user may prompt each tool manually and paste or import the outputs, or use a supported connection when one exists.

The question set must remain stable for a given proof run. It should probe context that can materially change future AI behavior: goals, active projects, constraints, preferences, recurring workflows, important decisions, boundaries, relevant history, and areas where the tool is uncertain. The same questions, target tools, and comparison rules are retained for the post-Context run.

The baseline is evidence about what each tool **appears to know in that environment at that time**. It is not a second source of truth and it must not be silently converted into ALVIRA facts. Imported outputs retain provider, tool, prompt-set version, timestamp, and source-output provenance. Direct user confirmation remains the authority for durable Context.

## 2. Gap map and adaptive scope

ALVIRA normalizes baseline responses into a gap map before generating the interview plan. The map is a planning aid and evidence summary, not a hidden profile.

Each material area should be classified as one or more of:

- **Known consistently** — compatible, useful answers appear across the tested tools.
- **Known unevenly** — one or more tools appear to know the area while others do not.
- **Conflicting** — tested tools return materially different answers or interpretations.
- **Missing** — the tools do not provide a useful answer.
- **Potentially stale** — an answer may reflect an older state or time-sensitive assumption.
- **Needs verification** — an answer sounds specific or consequential but cannot be treated as authoritative without user review.

The adaptive interview uses this map to prioritize gaps and uncertainty. It should spend less time re-asking consistently established context and more time on missing, conflicting, stale, uneven, or consequentially unverified areas. The user can still choose to review any area, and the engine must not imply that a tool's silence proves the user has no such context.

## 3. Context creation and review

The interview turns the gap map into targeted questions. Answers and imported evidence flow through the existing ALVIRA provenance and review model:

```text
BASELINE OUTPUTS
  → EVIDENCE / PROVENANCE
  → GAP MAP
  → TARGETED INTERVIEW
  → CONTEXT MIRROR
  → USER APPROVES OR CORRECTS
  → VERSIONED ALVIRA CONTEXT
```

The Context Mirror must make clear what came from the user's answer, what was imported as evidence, what ALVIRA inferred, what remains uncertain, and what the user has approved. The v2 direction does not weaken the existing rule that imported AI output is seed evidence rather than truth.

## 4. Formal portability-proof loop

After the user creates and reviews Context, ALVIRA offers the same standardized question set against the same tools used for the baseline, with only the user-approved Context made available through the chosen connection or reuse path.

The proof run records:

- the question-set version and exact questions;
- each target tool/environment;
- the ALVIRA Context version or hash used;
- the approved sharing scope and withheld categories;
- timestamps and run status;
- before/after responses or user-provided evidence;
- corrections, unresolved uncertainty, and failed or partial runs.

The resulting **Context Lift report** should show, in plain language:

- what the tool appeared to know before;
- what became available after approved Context was connected;
- what remained withheld;
- what the tool still misunderstood or guessed;
- whether repeated explanation decreased or usefulness improved;
- whether the result is comparable, partial, or not proven because the run changed or failed.

This is a proof of observed behavior in a specified environment, not a universal claim that ALVIRA works identically in every AI tool.

## 5. Control verification

Portability proof is incomplete without testing user control. The v2 loop must include explicit checks for:

1. **Update** — change a reviewed Context item, rerun the relevant question, and verify the intended new version propagates.
2. **Withhold** — exclude a category or item from the sharing scope, rerun the relevant question, and verify it is not supplied through ALVIRA's path.
3. **Revoke** — revoke the connection or authorization, rerun or inspect the target path, and verify ALVIRA Context is no longer made available through that authorization.

The report must distinguish “the target did not answer” from “ALVIRA verified that the item was withheld or revoked.” A failed or ambiguous control check remains unproven and should not receive a success badge.

## Product and implementation boundary

This document records the Interview Engine Lab v2 direction and its product contract. It does not authorize production changes, a rewrite of the current interview engine, new provider integrations, automatic Context approval, or a merge. Production behavior remains unchanged until a separate owner-approved implementation task defines the migration, storage, consent, and verification contracts.

The Lab can prototype and evaluate this loop in isolation. Any future implementation must preserve current ALVIRA provenance, user review, Context versioning, Bridge consent, read-only boundaries, and fail-closed behavior.

## v2 acceptance questions

- Can a user skip the baseline and still complete a useful interview?
- Does the baseline reveal actionable gaps without becoming an unreviewed profile?
- Does the classification distinguish consistent knowledge from uneven, conflicting, missing, stale, and unverified evidence?
- Does the adaptive interview spend its effort on genuine gaps and consequential uncertainty?
- Can the user see and correct the difference between imported evidence, inference, and approved Context?
- Does rerunning the same questions against the same tools produce a meaningful, honestly comparable Context Lift report?
- Are update, withholding, and revocation checks explicit, scoped, and fail closed?
- Can the user tell whether portability was observed, partially observed, or not proven?
