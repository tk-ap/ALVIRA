# Production deployment retry — 2026-09-02

Purpose: trigger a fresh Vercel production deployment from the current non-Stripe `main` state after the earlier Hobby-plan build-rate limit blocked deployment.

- Runtime code: unchanged.
- Stripe PR #97: intentionally excluded and remains unmerged.
- Expected production content: current `main`, including the life-first / `Context before capability` homepage and Agent OS metadata.
- This marker can be removed in a later documentation cleanup; it has no application behavior.
