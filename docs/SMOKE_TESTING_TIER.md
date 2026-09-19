# Smoke Testing Tier

`smoke_testing` is an internal ALVIRA account tier for persistent end-to-end product testing.

## Purpose

Use `codex-e2e-1788235310@example.com` for tests that need unrestricted customer-facing product access across Context, Reflect, Bridge-adjacent flows, exports, persistence, and future entitlement-gated UX.

This tier is deliberately separate from:

- `free` — real free customer behavior and limits;
- `pro` / `lifetime` — paid customer states;
- `founding_beta` — real early-user complimentary access;
- owner/admin access — privileged product and operating surfaces.

The tier must not imply payment, Founding Beta membership, or administrative authority.

## Acceptance testing split

- `codex-smoke-1786676512909@example.com` remains the canonical **free-tier acceptance account**. Use it to verify real free limits, upgrade prompts, and the default launch journey.
- `codex-e2e-1788235310@example.com` is the canonical **full-access E2E account**. Use it when a user-experience change must be exercised end to end without entitlement or quota limits interrupting the test.
- Owner access remains a separate secondary verification path for owner-only/admin behavior.

A successful smoke-testing-tier run never substitutes for free-tier acceptance when the feature affects free customers.

## Product behavior

When the stored tier is `smoke_testing` and no session-only access simulation is active:

- profile and interview limits are unrestricted;
- customer-facing entitlement gates treat the account as fully enabled;
- the account remains non-owner;
- the account can still use the existing session-only access simulator to test Free, Pro, or Lifetime presentation;
- Founding Beta grants must not auto-attach to the account.

## Analytics

Smoke-testing accounts are internal synthetic traffic. They should be visible as such in owner diagnostics but excluded from customer conversion, customer adoption, intervention, and funnel measurements.

Do not create fake purchases merely to unlock test access. The `smoke_testing` tier is the entitlement override.
