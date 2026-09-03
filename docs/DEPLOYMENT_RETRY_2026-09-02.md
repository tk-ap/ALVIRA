# Production deployment retry — 2026-09-02

Purpose: trigger a fresh Vercel production deployment from the current non-Stripe `main` state after the earlier Hobby-plan build-rate limit blocked deployment.

- Runtime code: unchanged.
- Stripe PR #97: intentionally excluded and remains unmerged.
- Expected production content: current `main`, including the life-first / `Context before capability` homepage, Agent OS metadata, Founding Beta owner communication/review rails, advisory AI review, and AgentMail inbound reply monitoring.
- 2026-09-02 19:50 PT: Vercel preview builds are succeeding again; marker updated to trigger the current non-Stripe production deployment after quota reset.
- This marker can be removed in a later documentation cleanup; it has no application behavior.
