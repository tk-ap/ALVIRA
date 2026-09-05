# ALVIRA launch readiness audit — 2026-09-05

> **Status: post–Revision 11 working hypothesis. Not owner-ratified direction.**
> Findings below are verified observations of the live deployment. Severity rankings and recommendations are agent judgement and require owner ratification. This audit does not approve or change product direction.

**Supersedes:** `codex/launch-readiness-report` (audited 2026-08-07 against `alvira.ctonew.app`). That report predates roughly 40 merged pull requests (#75–#135) including the Context / Reflect / Bridge unification, the move to owned Stripe billing, and the Founding Beta rails. Its findings should no longer be treated as current.

**Surface audited:** `https://alviratech.vercel.app`
**Method:** headless Chromium, native sandbox enabled, 1440x900, measured after `document.fonts.ready`. Unauthenticated crawl of all 26 page routes plus an authenticated pass using the `AGENTS.md` free-tier smoke account.
**Work item:** `.agent-os/work-items/alvira-launch-readiness-2026-09-05.json`

## Decision

**NO-GO for unattended public traffic** on one blocker: the lifetime purchase path returns a server error. A separate high-severity gap — nothing verifies that an interview answer is about the question asked — degrades artifact quality without blocking the path. Everything else is close.

---

## P1.0 — Nothing checks that an answer is about the question that was asked

**Severity: high. Corrected 2026-09-05 after source tracing — see "Correction" below.**

Source trace of the capture pipeline:

- `src/routes/app.tsx:874` `askNextQuestion` selects the next uncovered domain via gap detection, sets `state.currentDomain` to `topGap.domain.id`, and generates a question **for that domain**.
- `src/routes/app.tsx:1107-1202` `handleSend` appends the answer to `updatedDomains[currentDomain].answers`.
- `src/routes/-validation.ts:102` `validateAnswer(domainId, answer, existingAnswers)` **accepts `domainId` but never reads it.** Its checks are user-question detection, insufficient-knowledge phrases, deflection words, gibberish, non-trivial length, specificity, vague phrases and contradiction — all answer *quality*, none answer *topic*.
- `src/routes/-knowledgeCompiler.ts:42-47` groups by the stored `domain.outputFile`. There is **no re-classification at compile time.**

So the design is: ask about domain X, file the answer under X, compile it as X. **When the user answers the question they were asked, categorization is correct.**

The defect is that nothing detects the case where they do not. Conversational interviews routinely produce adjacent answers — asked about current projects, a person explains how they decide; asked about constraints, they describe what they value. That content is filed under the asked heading at full confidence, with no warning to the user and no flag in the artifact. `domainId` is already plumbed into `validateAnswer`, so a topical-fit check has the data it needs and is not an architectural change.

**Impact.** Compiled files are handed to ChatGPT or Claude as setup instructions. A drifted answer becomes a confident false assertion about the user — their communication preference recorded as a constraint, their constraints recorded as identity.

### Correction

An earlier revision of this audit recorded this as **P0.1, critical**, and stated that answers are "assigned to a fixed category sequence in arrival order rather than by content." That characterisation was wrong and is withdrawn.

The evidence was a scripted black-box run that sent a fixed list of answers without reading the question asked at each turn. That reliably produces mismatches under a correct design, so the observed pattern was an artifact of the test, not proof of positional assignment. Source tracing shows assignment follows the asked domain.

Severity is reduced from critical to high: a cooperative user answering on-topic receives correctly categorised context. The launch decision no longer rests on this finding.

## P0.2 — Lifetime checkout returns a server error

**Severity: critical. Revenue path dead.**

- `/checkout/pro-monthly` → correctly redirects to Stripe Checkout, `$20.00 per month`, account email prefilled. Working.
- `/checkout/lifetime` → renders **"Checkout needs another try."**; `POST /api/stripe/checkout` returns **502**.

Both plans are offered on `/pricing`, so half the purchase surface fails.

**Note for smoke testing:** the working path opened a `cs_live_` session. Smoke tests are running against live Stripe mode. Consider a test-mode path for automated acceptance so smoke runs cannot create real sessions.

## P1.1 — Bridge context API returns 401 for an authenticated user

`/bridge` renders correctly when signed in. However `GET /api/bridge/context` returns **401** on every load, authenticated or not. The page shell appears without its context data.

## P1.2 — Bridge is unreachable and unlinked as a customer surface

- Signed out, `/bridge` 307s to `/app?preview=false`; it is not viewable.
- **No page links to `/bridge` in either signed-in or signed-out state.**
- The "Use elsewhere" navigation item points to `/integrations`, a marketing explainer, not to the Bridge UI.

`AGENTS.md` names `/bridge` the canonical Bridge UI and states that customer-facing mentions of connecting external AI tools should route through the nested ALVIRA Bridge UI. Current wiring diverges from that ratified direction.

## P1.3 — React hydration error on the main product entry point

`Minified React error #418` (hydration text mismatch) fires on every load of `/app`. It does not appear on marketing routes. No functional failure was observed, but hydration mismatches can leave handlers unattached and are a plausible source of intermittent dead controls.

## P2.1 — Internal design tool is publicly reachable

`/brand-preview` returns 200 to anonymous visitors. Unlinked, but crawlable.

## P2.2 — Navigation label does not match its route

The "Reflect" navigation item points to `/meos`, a legacy route name.

---

## Verified working

- **All 26 page routes return 200.** No dead pages, no broken internal links. The only non-route link targets are `/samples/alvira-context-example.md`, `/checkout/pro-monthly` and `/checkout/lifetime`.
- **The guest interview runs end to end without an account** — real generated questions, progressive capture, no failed network requests across the entire flow.
- **Compilation works.** Roughly six seconds, no crash, no error state. The 2026-08-07 report's P0.1 (compilation hangs permanently on `Compiling...`) **does not reproduce**.
- **Authentication works.** Login succeeds, session persists, and a returning user is correctly offered "Update your existing Context?".
- **Authenticated navigation is complete** — Dashboard, Build Brief, History, Account, Logout, Open ALVIRA all present and resolving.
- `/build-brief` is correctly auth-gated per #134 and linked in the signed-in navigation.
- **Footer legal is complete and live:** Privacy, Terms, Refunds, Support, Data.
- Monthly checkout reaches Stripe correctly.

## Route reachability

Unlinked for signed-out visitors and correct that way: `/account`, `/dashboard`, `/history`, `/interview` (post-login surfaces), `/reset-password` (reached by email link).

Unlinked and **not** correct: `/bridge`, `/bridge/connect` — see P1.2.

## Recommended order

1. P0.2 — lifetime checkout 502. Blocks revenue outright.
2. P1.0 — topical-fit check on interview answers. Degrades the artifact whenever a user drifts off-question.
3. P1.1 / P1.2 — Bridge API authorization and customer-surface wiring.
4. P1.3 — hydration mismatch on `/app`.
5. P2.1 / P2.2 — surface hygiene.

## Not covered

Interview save/update persistence beyond the returning-user prompt, Founding Beta application flow, AgentMail rails, entitlement overrides, owner-only surfaces, and mobile authenticated flows. A completed purchase was not attempted, since the working path uses live Stripe.
