# ALVIRA Context Intelligence — near-term product roadmap

This note preserves useful launch ideas from older branches without treating stale branch code as the source of truth.

## Integrated now

### Context history / “What changed?”

ALVIRA should not silently overwrite the past while claiming to maintain living Context. The current implementation adds automatic profile snapshots before meaningful profile updates and a `/history` surface that shows which Context domains changed between stored states. The current state is shown alongside prior snapshots.

Design principle: history is evidence of maintained understanding, not a generic audit log.

### Reuse your Context

`/integrations` is reframed as **Reuse** rather than a generic integrations marketplace. Manual provider reuse is intentionally honest: ALVIRA prepares a user-reviewable Context block for ChatGPT, Claude, Gemini, or Cursor, but does not call that a live sync. Bridge remains the explicit governed authorization path for connected agent access.

Design principle: maintain once, carry forward where appropriate, with preview and consent at the boundary.

### Live Context / Context Mirror

The interview now exposes a live Context Mirror and gives short context-aware reflections before the next targeted question. The Mirror reads the active interview state so users can see what ALVIRA is carrying forward, what is developing, and what is still being clarified.

Design principle: the interview should visibly demonstrate continuity and understanding, not behave like a sequence of disconnected intake questions.

## Near-term follow-up

### Saved-Context-aware interview reflection

The current conversational reflection layer sees the active conversation history, while the Context Mirror can also show broader seeded/carried interview state. Complete the continuity model by allowing the reflection layer to reference relevant **previously saved or seeded Context** when it materially changes the interpretation of the user's newest answer.

Expected behavior:

- Explicitly recognize when new information reinforces something ALVIRA already knew.
- Surface when a new answer appears to revise or contradict older saved Context.
- Distinguish direct user statements from ALVIRA interpretation.
- Reference only relevant prior Context rather than dumping the full profile into every model call.
- Preserve user review/consent before inferred changes become durable Context.
- Make the experience feel like “ALVIRA remembered and updated its understanding,” not “the interviewer received a hidden prompt.”

Beta question: **Do users notice and trust cross-session continuity when ALVIRA appropriately references what it already knew?**

## Intentionally deferred

### Private ongoing Reflect companion

Older launch exploration included a private hosted Reflect/MeOS companion with Today, Portrait, Purpose, Compass, and Cycles. The concept remains strong because Reflect should become an ongoing place to revisit change rather than only an interview output.

Do not restore the old route wholesale. Revisit after Founding Beta evidence shows that people return to Reflect between major Context updates. If built, it should use current ALVIRA Context/Reflect state, current brand system, explicit local-vs-cloud persistence choices, and the new history model.

### WebMCP / browser-agent Bridge adapter

Keep as a Bridge follow-on. Proposed tool surface remains conservative: context status, request scoped Context, and propose an update for review. No full snapshot by default, no silent claim approval, and no standalone Bridge product positioning.

Gate implementation on stable Bridge authorization and proven consent/audit behavior.

### Encrypted dossier

Password-protected dossier export remains a useful premium/privacy enhancement, but MD + JSON + TOON portability is the current baseline. Revisit encrypted packaged export after the beta establishes which artifacts users actually carry into other systems.

## Beta evidence to collect

- Do users return to History after updating Context?
- Which domains change most often?
- Does visible history increase trust in ALVIRA’s maintained Context?
- Which Reuse destinations are actually opened after preparation?
- Do users prefer manual reviewed reuse or ask for governed live connections?
- Does Bridge become more valuable after users understand manual reuse?
- Do Reflect users return often enough to justify a persistent private companion?
- Do users notice and trust cross-session continuity when ALVIRA appropriately references previously saved Context?

Avoid expanding the product surface until these signals show where recurring value actually forms.
