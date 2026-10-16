# E2E demo persona: Wren Calloway (fictional)

**Fictional.** Wren Calloway is invented for ALVIRA demos and E2E runs. Any resemblance to a real person is coincidental. Never mix TK's real context into this persona, and never use this persona to describe TK.

**Bound to:** the isolated E2E test account (`codex-smoke-…@example.com`, credentials in `~/.config/alvira/test.env`) on `alvira-agent-e2e.vercel.app`, backed by the Neon E2E database. Recordings made for the public site or ASHWOOD builds use this persona, never TK's own Context.

## Why this persona

Wren is an **AI power user with context-portability pain**, the audience ALVIRA targets. They use ChatGPT, Claude and Gemini weekly and re-explain the same background every time. Their life has enough real constraints that the right answer to "what should I focus on?" is obviously different once an AI knows them. Demos file everything as normal context: Wren is fictional, so hiding details would only make the demo harder to follow. The `[SENSITIVE — release only …]` tag is a real-user feature and is not used for Wren.

## Snapshot (as of the demo date)

- **Who:** Wren Calloway (they/them), 34, Tucson, Arizona.
- **Work:** independent product-operations consultant for small software companies. Previously six years in operations at a mid-size logistics firm.
- **Side business:** Calloway Clay, a small online ceramics shop that sells glazeware in seasonal drops.
- **Current clients:** one retainer (a scheduling-software startup, 12 hours a week, ends in 6 weeks) and one project-based audit.
- **Goals this quarter:** replace the ending retainer with two new ones; launch the spring glaze collection on March 15; stop working weekends.
- **Constraints:** tools budget about $300/month; no client calls on weekends; Fridays protected for studio work; a slow laptop they don't want to replace until a retainer lands.
- **How they decide:** reversible decisions fast; anything touching income gets a 24-hour pause and a spreadsheet; asks two trusted peers before raising rates.
- **Preferences for AI help:** bullet points, a recommendation first, no motivational filler; show the trade-off, not every option.
- **Personal constraints (fictional, filed as normal context in demos):**
  - Caregiving for a parent on Tuesday and Thursday afternoons, not available for meetings then.
  - About $18,000 of business debt from the kiln and studio build-out.
- **Unknown / open:** whether to raise their rate from $95/hour this quarter; whether to hire a part-time studio assistant; what the spring drop will sell.

## Demo prompt (frozen)

> Plan my next two weeks. I need to land new consulting work, get the spring glaze launch ready, and keep my weekends free. What should I do first, and what should I say no to?

Without context, an AI gives generic time-management advice. With Wren's ALVIRA Context, it should:
- sequence retainer outreach before the retainer ends;
- protect Fridays and the caregiving afternoons;
- back-plan the March 15 launch;
- stay within the $300 tools budget;
- flag the open rate decision instead of deciding it for Wren.

## Files

- `wren-source-briefing.md`: what "Wren's other AI" knows, formatted like the ChatGPT briefing used in TK's run (each item STATED or INFERRED, dated). The demo agent reads this as its source and files it into ALVIRA through the real interview.
