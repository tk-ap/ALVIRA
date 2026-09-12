# Verifying checkout without touching live Stripe

## Why this exists

The plan catalog in `src/lib/stripe-checkout-params.ts` ships live price IDs as
defaults. A live price ID does not resolve under a test-mode secret key, so
before these overrides existed there was no way to exercise `/api/stripe/checkout`
except against live Stripe — every verification run risked opening a real
`cs_live_` session. The 2026-09-05 launch readiness audit flagged exactly this.

## The variables

| Variable | Overrides |
| --- | --- |
| `ALVIRA_STRIPE_SECRET_KEY` | the secret key, ahead of `STRIPE_SECRET_KEY` |
| `ALVIRA_STRIPE_PRICE_PRO_MONTHLY` | `pro-monthly` price |
| `ALVIRA_STRIPE_PRICE_PRO_ANNUAL` | `pro-annual` price |
| `ALVIRA_STRIPE_PRICE_LIFETIME` | `lifetime` price |

Leave a price variable unset and that plan uses its live catalog default, so
**production behaviour is unchanged by this mechanism**. Set the key without the
prices and checkout fails — that pairing is the mistake this file exists to
prevent.

## Running a test-mode check

1. In the Stripe dashboard, switch to test mode and create three prices
   mirroring the live catalog. `lifetime` **must be a one-time price**, not
   recurring; the other two must be recurring.
2. Set all four variables together — test secret key *and* all three test
   prices. Never mix a live key with test prices, or the reverse.
3. Exercise both shapes of the one-time path, because they build different
   parameters and only one of them has ever broken in production:
   - a **new** customer (no `stripe_customer_id`) → sends `customer_email` plus
     `customer_creation`
   - a **returning** customer (has `stripe_customer_id`) → sends `customer`, and
     must **not** send `customer_creation`

   The returning-customer case is the one that produced a Stripe 400, surfaced
   as a 502, and took lifetime checkout down. It is covered by
   `tests/stripe-checkout-params.test.ts`, but that test only proves which
   parameters are built — it cannot prove Stripe accepts them.
4. Confirm the session opens, then abandon it. Do not complete a payment.

## Fail-closed behaviour

A price override that is set but does not begin with `price_` **throws** rather
than falling back to the live default. Silently reverting to the live price
would hand a real charge surface to someone who believed they had configured
test mode. The thrown message maps to a 503, and the specific variable and plan
are logged as `[stripe-checkout] invalid Stripe price override`.

## Still unproven

Whether `price_1UAxB6FVePBsKetGLLCEt5Z9` (the live `lifetime` default) is
genuinely a one-time price. If it were created as recurring, `mode: payment`
would be rejected for every customer, new or returning. Nothing in the test
suite can detect that — it needs one live-mode read of the price object, or a
single observed successful session.
