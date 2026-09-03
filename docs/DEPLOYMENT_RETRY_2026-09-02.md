# Production deployment retry — 2026-09-02

Purpose: trigger fresh Vercel production deployments when Hobby-plan build-rate limits block the current ALVIRA `main` branch.

- Runtime code: unchanged by this marker.
- Expected production content: current `main`, including the life-first / `Context before capability` homepage, Stripe-owned billing, Founding Beta owner communication/review rails, advisory AI review, AgentMail inbound reply monitoring, the `/app` first-paint clarity fix, signup trust/accessibility polish, and the fictional Context proof surface.
- 2026-09-02 19:50 PT: Vercel preview builds were succeeding again; marker updated to trigger the then-current non-Stripe production deployment after quota reset.
- 2026-09-02 23:14 PT: production redeploy retriggered from the current `main` tree after the quota window cleared.
- 2026-09-02 23:45 PT: production redeploy requested again from the current non-Stripe `main` state.
- 2026-09-03 10:08 PT: production redeploy retriggered for current Stripe-enabled `main` after the later release-polish merges (#115, #116, #117).
- This marker can be removed in a later documentation cleanup; it has no application behavior.
