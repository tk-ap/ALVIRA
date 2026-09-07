# ALVIRA In-Product Change Communication

## Purpose

ALVIRA should help returning users understand meaningful product changes without requiring them to discover new flows, pages, navigation, or features by accident.

The product rule is:

> **When a live product change materially affects how a user navigates, creates context, reviews context, uses Reflect, accesses Bridge, manages account state, or completes another established workflow, communicate the change inside the product at the next appropriate login or return visit.**

This is part of product usability and continuity, not marketing.

---

## What should trigger an in-product update

Create a user-facing change notice when a production release materially changes one or more of the following:

- primary navigation or route structure;
- onboarding or interview flow;
- ALVIRA Context creation, review, import, continuation, or editing;
- Reflect / Reflect Build flow or placement;
- Bridge access, connection, context-sharing, or permissions;
- account, entitlement, tier, or access behavior visible to the user;
- major page layout when the user's established path has moved;
- a new feature that materially expands what an existing user can do;
- removal, replacement, or renaming of an established feature;
- a workflow that now requires a different action from the user.

Do not interrupt users for invisible refactors, small visual polish, copy edits, bug fixes that restore expected behavior, or internal infrastructure changes with no meaningful workflow impact.

---

## Login / return-visit behavior

For an eligible returning user whose account has not acknowledged the applicable product-change version, show a concise update after authentication and before the user is likely to encounter the changed workflow unexpectedly.

The default experience should answer:

1. **What changed?**
2. **Why does it matter to me?**
3. **What should I do differently, if anything?**
4. **Where can I find the new or moved functionality?**

A useful pattern is:

> **ALVIRA has changed a little since your last visit.**
>
> Context imports now start from **Add context**, and you can bring in what another AI already knows about you before continuing your interview.
>
> **Show me** · **Got it**

The exact copy should be specific to the release rather than generic.

---

## Progressive disclosure

Do not turn login into a changelog wall.

Default to a short summary with optional deeper guidance:

`headline → 1–3 important changes → consequence → primary action → optional Show me / Learn more`

When useful, `Show me` may:

- navigate to the changed feature;
- visually highlight the new location;
- start a short contextual walkthrough;
- reveal a brief tip tied to the exact screen.

Avoid multi-step product tours unless the change genuinely requires several new interactions.

---

## Tips for new or changed features

Contextual tips may be shown when a user first encounters a materially new interaction.

Examples:

- a changed navigation location;
- a new import/context source;
- a new review control;
- a new Reflect capability;
- a new Bridge permission/control;
- a changed entitlement or access path.

Tips should be dismissible, concise, and tied to the user's current task. Do not repeatedly show a tip after it has been acknowledged unless the feature changes again materially.

---

## Versioning and acknowledgement

The implementation should support a machine-readable release/change identifier rather than a single global `has_seen_whats_new` boolean.

Conceptual model:

```yaml
product_change:
  id: alvira-context-import-v1
  released_at:
  audience:
  severity: informational | workflow_change | important
  surfaces:
    - onboarding
    - add-context
  summary:
  consequence:
  guidance:
  destination:

user_acknowledgement:
  user_id:
  product_change_id:
  shown_at:
  acknowledged_at:
  dismissed_at:
```

This allows ALVIRA to:

- avoid showing irrelevant changes to unaffected users;
- show a returning user only changes since their last relevant visit;
- prevent repeated notices once acknowledged;
- preserve a history of what guidance a user actually received.

Exact storage may differ, but versioned semantics should be preserved.

---

## Audience targeting

Not every user needs every notice.

Where practical, target change communication using relevant state such as:

- existing vs new user;
- completed vs incomplete interview;
- feature previously used;
- Bridge connected vs not connected;
- tier/entitlement;
- affected route/workflow;
- last-seen product-change version.

Example: a user who has never used Bridge does not need a disruptive login modal about a minor Bridge navigation change. A user with an active Bridge connection probably does.

---

## Relationship to onboarding

Initial onboarding teaches the current product. Change communication teaches **what changed since the user's established mental model was formed**.

Do not force a returning user through full onboarding again merely because the product changed.

If a change materially alters onboarding itself:

- new users receive the new canonical onboarding directly;
- returning/in-progress users receive a concise migration/update explanation;
- saved state should be preserved wherever technically possible;
- the update should explain any changed next step before the user encounters it.

---

## Relationship to ALVIRA Context

Product-change notifications are operational product state, not personal context by default.

ALVIRA may use known interaction preferences to improve explanation depth when appropriate, but acknowledgement of a feature notice should not silently become a personal-context claim.

---

## Accessibility and UX constraints

Change communication must:

- be keyboard accessible;
- work on mobile and desktop;
- support reduced motion;
- avoid trapping a user in a tour;
- preserve a direct dismiss/continue path;
- avoid obscuring urgent account or workflow tasks longer than necessary;
- avoid manipulative urgency for ordinary feature changes.

---

## Release discipline

A meaningful production change is not complete until its user-communication requirement has been classified.

Every relevant release should explicitly record one of:

- `NO_NOTICE_REQUIRED` — no material user workflow impact;
- `CONTEXTUAL_TIP` — local guidance is sufficient;
- `LOGIN_NOTICE` — returning affected users should be informed on next login/return;
- `IMPORTANT_NOTICE` — the workflow/access change is significant enough to require prominent acknowledgement.

The release owner should define the notice content alongside the change rather than after users become confused.

---

## Success criteria

This system is working when:

- returning users are not surprised by materially changed workflows;
- users can quickly understand where moved/new functionality lives;
- new features are discoverable without requiring external release notes;
- users are not repeatedly interrupted by already-acknowledged notices;
- small/internal changes do not generate notification fatigue;
- in-progress onboarding/context state survives product changes wherever possible;
- support burden from "where did this go?" and "what changed?" decreases over time.
