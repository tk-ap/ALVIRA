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

## Owner-ratified direction — AI leverage guidance

**Ratified:** 2026-09-02

ALVIRA should not assume the user already knows what AI can help them do. General capability education belongs before the interview, while context-specific opportunity discovery belongs inside the interview and post-interview experience.

The product sequence should be:

**My life → things I could use help with → AI can help → ALVIRA understands me → ALVIRA notices where AI may help → I choose the level of AI involvement → future help starts with that context.**

### Pre-interview role: general education

The public website and first-run UI should:

- teach that AI can help with ordinary life, work, communication, planning, learning, decisions, and organization;
- use recognizable situations rather than assuming knowledge of AI products, prompting, agents, or technical terminology;
- help the user start from a need rather than from a product or feature;
- avoid premature product recommendations before ALVIRA has enough personal context to make them meaningful.

Design principle: **never require the user to already know what AI can do.**

### Interview role: contextual opportunity surfacing

As ALVIRA learns enough about the user, the interview may progressively surface specific areas where AI could reduce friction or improve outcomes.

Examples:

- “You mentioned that you are comparing two career paths. AI could help you research the options, organize tradeoffs, prepare questions, and pressure-test the decision.”
- “You said you spend a lot of time rewriting important messages. AI could help you draft them while ALVIRA carries your preferred communication style.”
- “You are helping manage several family responsibilities. AI could help organize appointments, questions, notes, and follow-ups.”

These reflections should feel like **useful feedback from understanding the user**, not advertisements or interruptions.

Requirements:

- Surface an opportunity only when it is grounded in evidence from the conversation or saved Context.
- Explain the capability or outcome first; do not lead with a product name.
- Make the user’s response part of Context when appropriate.
- Preserve the distinction between direct user statements and ALVIRA interpretation.
- Do not turn every answer into an AI recommendation.
- Do not make an inferred AI-use preference durable without user review or confirmation.

Design principle: **the interview should produce practical value before the Context profile is complete.**

### AI involvement preferences

ALVIRA should be able to learn not only where AI could help, but how the user wants AI involved in that area.

Recommended involvement states:

- **Advise** — give perspective, research, explanation, or options; user decides and acts.
- **Collaborate** — work interactively with the user on drafts, plans, analysis, or decisions.
- **Delegate** — user is comfortable handing off a bounded task with clear constraints and review.
- **Automate later** — the task is a possible future automation candidate but should remain human-run for now.
- **Human-only** — the user does not want AI involved in this area.

A rejection is valuable Context. “I prefer to do this myself” should be treated as meaningful guidance, not as failed conversion.

These preferences can eventually inform Bridge permissions, workflow design, and governed agent execution. They are **authorization/context signals**, not blanket permission for autonomous action.

### Post-interview role: AI Leverage Map

Near the end of an interview, or once enough Context exists, ALVIRA may produce a user-reviewable **AI Leverage Map** summarizing where AI appears most useful.

A useful structure:

- **High leverage** — recurring or costly areas where AI assistance appears clearly useful.
- **Worth exploring** — plausible opportunities that need more experimentation or context.
- **Keep human-led** — areas where the user has explicitly said they prefer human judgment or no AI involvement.

Each opportunity should include:

1. the user need or friction observed;
2. what AI could help do;
3. the recommended involvement level;
4. any important limitations or reasons for human review;
5. optional ways to act on it.

The map should remain inspectable and editable. It is guidance, not an autonomous execution plan.

### Product and tool recommendations

Specific AI product recommendations can be useful, but they are downstream of the user need.

Required sequence:

**Need → capability → level of AI involvement → tool/product options.**

Do not make the experience:

**Product catalog → find a reason to recommend it.**

Recommendations may include ALVIRA, general assistants such as ChatGPT/Claude/Gemini, specialized tools, or a recommendation to use no additional product. The recommendation should explain why the option fits the user’s stated context and what tradeoffs or limitations matter.

ALVIRA must not become a generic AI-tool directory. Product recommendations should strengthen the Context Intelligence thesis by demonstrating that ALVIRA understands the user well enough to identify the right kind of help.

If commercial relationships, sponsorships, or affiliate incentives are ever introduced, they must be disclosed and must not override contextual fit.

### Relationship to Context + Reflect + Bridge

- **Context** learns the person, the relevant needs, and their preferred modes of AI assistance.
- **Reflect** can help the user reconsider or evolve those preferences as their life, goals, and boundaries change.
- **Bridge** can carry selected Context and approved assistance preferences into external tools.
- Future workflows/agents may use these signals only within explicit permissions and governed execution boundaries.

This preserves the core relationship: **ALVIRA understands first; tools and agents act only after that understanding is useful and authorized.**

### Implementation boundary

This direction is approved product context, not authorization to immediately rewrite the interview engine.

Before implementation, define:

- the minimum evidence threshold for surfacing an opportunity;
- how opportunity suggestions are represented in interview state;
- how user confirmation/rejection becomes Context;
- whether assistance preferences require a new domain or structured sub-schema;
- how an AI Leverage Map is generated, edited, stored, and versioned;
- how recommendations are refreshed when Context changes;
- how product recommendations remain current and unbiased;
- how Bridge and future agents consume assistance preferences without treating them as blanket authorization.

Any implementation must preserve current interview, validation, persistence, and portability contracts unless a separate owner-approved migration explicitly changes them.

## Near-term follow-up

### Failure-triggered Context correction

Owner-ratified 2026-09-08. This is the chosen answer to how maintained Context stays current
for users who do not run agents.

Maintenance framed as hygiene does not retain. Nobody returns to a product in order to tidy
their own profile, and "your Context changes over time" is true without being a reason to
come back. The forcing function has to be a moment where stale Context visibly costs the
user something.

That moment already exists and ALVIRA does not currently capture it: the user asks an AI
something, and the answer is wrong about them.

Proposed surface: a low-friction way to report that failure — paste back the answer their AI
gave, or the prompt that produced it. ALVIRA then works out **which Context was missing,
stale, contradicted, or ambiguous**, and asks one targeted question about it.

Expected behavior:

- The user reports a *symptom*, never a correction. "My AI said I work in retail" rather
  than being asked to go and edit a profile field.
- ALVIRA diagnoses which Context domain is implicated and asks about that one thing.
- The resulting change follows the existing validation path: user-confirmed before it
  becomes durable Context, with history and provenance preserved.
- Nothing is inferred silently from the pasted material. It is evidence that prompts a
  question, not a source that overwrites Context.

Design principle: **elicitation triggered by observed failure, not by surveillance.** This
deliberately keeps ALVIRA out of ambient capture. ALVIRA does not watch the user's AI usage;
the user brings the failure to ALVIRA. That distinction is the same one that separates
ALVIRA from ambient work-memory products, and it should not be weakened for convenience.

Why this ordering: the mechanic is identical to agent-emitted drift signals (see deferred,
below) but requires the user to have adopted nothing. It works for someone whose entire AI
stack is one chat window, which is the majority of the addressable market today.

Beta question: **Do users report AI failures back to ALVIRA when reporting is one step, and
does answering the resulting question feel worth the interruption?**

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

### Agent-emitted Context drift signals

Kept deliberately in view for expansion or pivot, not scheduled.

Where a user runs an agentic workflow, the executing agent can report Context problems
directly instead of waiting for the human to notice. The agent emits a **signal** — what it
observed, which Context item it relates to, how many times, with evidence — and never an
edit. ALVIRA converts signals into questions; the user still confirms. Allowing agents to
write Context back would turn confirmed Context into accumulated machine inference, which is
precisely the property that distinguishes ALVIRA from ambient capture.

A draft contract exists in the `tk-ap/agent-os` control plane as
`contracts/context-signal.schema.json`, with a `context_signals` array added to
`contracts/outcome-event.schema.json` as the return path. The draft has no field capable of
carrying a replacement value, and `additionalProperties` is false so one cannot be added at
runtime. `contracts/context-envelope.schema.json` already pins `context_origin` to the
constant `alvira-context`, so the outbound half of this loop is defined.

The reason this is deferred rather than built: it demonstrates beautifully and reproduces
badly. Showing the full loop currently requires a multi-agent control plane the customer
does not have, which makes it a compelling proof and a poor retention mechanism. It also
represents a different customer — developers, agencies, and people running their own agents
— with different pricing and a different first screen.

Revisit as a deliberate segment decision if beta evidence shows Founding Beta users already
running agentic workflows, or if failure-triggered correction above does not produce enough
return visits. Do not drift into it because it is the case that demos well.

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
- Do users understand AI possibilities better after the interview than before it?
- Which surfaced AI leverage opportunities do users accept, reject, or edit?
- Do users report AI failures back to ALVIRA when reporting is one step?
- After a reported failure, does the diagnosed Context domain match what the user says was wrong?
- How many Founding Beta users already run agentic workflows, and would they emit drift signals?
- How often do users choose advise, collaborate, delegate, automate later, or human-only?
- Does an AI Leverage Map create an immediate sense of value before or after profile completion?
- Do users find context-grounded product recommendations useful without perceiving ALVIRA as a generic tool directory?

Avoid expanding the product surface until these signals show where recurring value actually forms.
