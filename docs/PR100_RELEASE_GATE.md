# PR #100 release gate — life-first homepage + first-run clarity

**Scope:** `codex/life-first-homepage` → `main`  
**PR:** #100 — Make ALVIRA understandable before requiring AI literacy  
**Release thesis:** **AI can do almost anything. The harder part is knowing what matters.**  
**Product rule:** **Context before capability.**

This gate converts the remaining release work into explicit pass/fail checks. A release is blocked only when a hard gate fails or lacks required evidence.

## Release decision

Merge PR #100 only when every **hard gate** below is PASS.

Statuses:
- **PASS** — verified with current branch evidence.
- **PENDING** — required verification has not yet been completed.
- **FAIL** — a release-blocking defect is present.
- **N/A** — the gate does not apply; explain why.

## Gate 0 — branch integrity

**Hard gate. Current status: PASS.**

Requirements:
- `main` has not advanced beyond the branch base, or the branch has been reconciled with current `main`.
- PR is mergeable with no conflicts.
- Changed files belong to the approved life-first / AI-leverage scope.
- Older homepage PRs #49 and #52 are not layered into this branch without explicit reconciliation.

Current evidence:
- Branch base and current `main` are both `2afef7c5ff7391fc3be3cd293c193d045e423724` as of 2026-09-02.
- PR #100 was mergeable at the latest metadata check.

Recheck immediately before merge.

## Gate 1 — build, schema, and preview health

**Hard gate. Current status: PASS, recheck after any code change.**

Requirements:
- Latest Vercel status is successful for the exact PR head SHA.
- Homepage returns HTTP 200.
- `/app` returns HTTP 200.
- Production-schema migration/verification gate passes where invoked by the build.
- No new fatal build, runtime, or route errors are introduced.

Current evidence:
- Latest Vercel status was `success` after the context-before-capability hero/metadata update.
- Preview homepage returned HTTP 200 and served the new hero and metadata.
- Preview `/app` returned HTTP 200.
- Earlier branch build verification confirmed 14 required Neon tables.

## Gate 2 — homepage visual acceptance

**Hard gate. Current status: PENDING.**

Verify the preview at all four states:

1. Desktop — light mode.
2. Desktop — dark mode.
3. Mobile — light mode.
4. Mobile — dark mode.

Pass criteria:
- Hero headline is readable without awkward wrapping or clipping.
- The hierarchy is clear: thesis → human questions → `ALVIRA starts there.` → explanation → `Context before capability.` → CTA.
- The human-question list does not feel excessively dense on mobile.
- Primary CTA remains visually dominant.
- `See what AI can help with` remains discoverable without competing with the primary CTA.
- `No AI experience required` is legible.
- Header/navigation does not collide, wrap incorrectly, or obscure content.
- Interactive use-case section remains usable with touch-sized controls.
- No horizontal overflow or long accidental whitespace appears.
- Light/dark contrast remains accessible and intentional.

Block release for any clipping, overflow, unreadable contrast, broken navigation, or mobile density that recreates the original comprehension problem.

## Gate 3 — first-run `/app` beginner experience

**Hard gate. Current status: PENDING.**

This is the most important remaining technical/visual risk.

The server-rendered `/app` HTML still contains the legacy technical first-run wording. `AppFirstRunClarity` changes that presentation after client hydration. A browser-based check must determine whether the user perceives a flash or layout shift before the beginner presentation appears.

Verify desktop + mobile, light + dark where practical.

Pass criteria:
- On first load, the user reaches the beginner presentation without a perceptible flash of `Build your ALVIRA Context`, technical output-file explanations, or other legacy copy.
- `What would you like AI to help you with?` / beginner-language presentation appears reliably after hydration.
- No visible layout jump caused by hiding the output-files sidebar.
- On mobile, advanced/technical panels are not part of the initial decision surface.
- Topic selection still enables the existing interview start behavior.
- Document upload remains available.
- Refresh/back navigation does not strand the presentation in the wrong state.

**If this gate fails:** do not ship the DOM-relabel bridge as the final implementation. Move the beginner language/layout natively into the `/app` source rendering before merge, while preserving the existing topic values, validation, question generation, state, storage, and outputs.

## Gate 4 — anonymous education → action funnel

**Hard gate. Current status: PENDING browser interaction check.**

Test from a fresh/private browser session:

- Homepage loads with no account.
- `Start with a conversation` reaches `/app`.
- `See what AI can help with` reaches `#possibilities`.
- Each help-topic button changes the starter example correctly.
- `Try this with ALVIRA` reaches `/app`.
- Header `Start here` reaches `/app` on desktop and mobile.
- Mobile menu opens/closes and all public links remain usable.

Pass criteria: no dead ends, blocked CTAs, accidental auth wall before the intended point, or navigation that requires AI/product knowledge to understand.

## Gate 5 — interview regression boundary

**Hard gate. Current status: PENDING full smoke.**

Use the repository-defined primary smoke account first: `codex-smoke-1786676512909@example.com`.

Verify:
- User can select one or more existing Context topics and start the interview.
- Existing internal topic values still drive question generation.
- Interview questions advance normally.
- Validation/gap detection behaves as before.
- Context can be saved and reloaded.
- Existing seeded/upload context path still works.
- Generated knowledge outputs retain their existing contracts.
- Reflect and Bridge entry points are not broken by the new public navigation/presentation layer.

Do not treat successful owner-account behavior as a substitute for the free-tier smoke path.

## Gate 6 — messaging / product-truth review

**Hard gate. Current status: PASS for static copy; PENDING final owner visual review.**

Required truths:
- Homepage does not promise that ALVIRA itself can execute every AI capability shown.
- `Context before capability` is presented as the thesis, not as a claim that capability is unimportant.
- The page explains that ALVIRA builds understanding before introducing Context Intelligence terminology.
- Tool names lower on the page are framed as reuse destinations/options, not guaranteed live sync where none exists.
- Bridge remains subordinate to ALVIRA Context/Reflect.
- Newly documented AI-leverage guidance is not presented as already implemented inside the interview.

Block release for copy that implies unsupported autonomous execution, automatic live integrations, or implemented AI Leverage Map behavior that is still roadmap direction.

## Gate 7 — accessibility and interaction sanity

**Hard gate. Current status: PENDING browser check.**

Verify:
- Keyboard can reach all homepage controls in a sensible order.
- Focus state is visible in light and dark mode.
- Help-topic buttons expose selected state and remain operable without a pointer.
- Skip link works.
- Mobile touch targets are practical.
- No new icon-only action lacks an accessible name.
- Motion/transition behavior does not obstruct comprehension.

This is a focused sanity gate, not a full formal WCAG audit.

## Gate 8 — owner release approval

**Hard gate. Current status: PENDING.**

Owner reviews the final preview after Gates 2–7 and explicitly approves release/merge.

Approval should answer two questions:
1. Does the first screen make sense to someone who does not already understand AI products?
2. Does it also give an AI-literate visitor a strong reason for ALVIRA to exist?

## Merge procedure

When all gates are PASS:

1. Re-fetch PR #100 metadata and exact head SHA.
2. Reconfirm `main` has not advanced; reconcile if it has.
3. Confirm latest Vercel status is success for that exact SHA.
4. Mark PR ready for review if still draft.
5. Squash merge PR #100 using the exact expected head SHA.
6. Verify the production deployment becomes `READY`.
7. Fetch `https://alviratech.vercel.app/` and `/app` and confirm HTTP 200 + expected production metadata/copy.
8. Run a production smoke through homepage → `/app` with the free-tier acceptance user.

## Rollback criteria

Rollback or immediately hotfix if production shows any of the following:
- homepage or `/app` 5xx/blank page;
- broken signup/login or inability to start the interview;
- lost Context persistence;
- visible first-run presentation failure that exposes a confusing/broken UI;
- mobile navigation blocks primary links;
- major light/dark contrast or layout regression;
- homepage claims behavior that production does not support.

The safest rollback is the prior known-good `main` deployment. Do not attempt unrelated cleanup during an incident.

## Post-release observation

After release, collect evidence rather than immediately adding more surface area:
- homepage → `/app` click-through;
- interview-start rate;
- interview completion rate;
- exits on the first `/app` screen;
- qualitative reports from low-AI-literacy users: “What did you think ALVIRA was for?” and “Did you know what to do next?”;
- whether AI-literate users understand `Context before capability` without interpreting ALVIRA as only a profile builder.

The next implementation of interview-based AI opportunity guidance should be gated by this activation/comprehension evidence and implemented as Context Intelligence, not as a generic AI-tool recommendation catalog.
