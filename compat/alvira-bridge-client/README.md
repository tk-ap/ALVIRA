# ALVIRA Bridge standalone compatibility client

Status: **historical compatibility source — retired, not canonical ALVIRA runtime code**

This directory preserves the small standalone client surface from the retired `tk-ap/alvira-bridge` repository. It is retained only so the implementation history is not lost; it is no longer an active authorization, context-readback, or MCP surface.

## Provenance

- original repository: `tk-ap/alvira-bridge`
- original branch: `main`
- source commit: `3ca9356bd4976677a4fc381d634896c284d9b41d`
- source was itself a reconstruction of the publicly rendered Bridge site, not the original CTO.new project export
- Vercel project: `alviratech-bridge` (`prj_NDkjEfeBFiLve5ocmkstXDMr2A5E`)
- production deployment observed during consolidation: `dpl_9dYvRoM8ogqqzfBZqbNogZ11YmuB`, built from the source commit above
- legacy public alias: `https://alviratech-bridge.vercel.app`
- consolidated into ALVIRA: 2026-09-15
- legacy credentials retired: 2026-09-15

## Retirement evidence

During retirement review:

- no real requests to the legacy deployment were observed in the preceding 30 days; the observed `/api/context` requests were unauthenticated retirement checks;
- 12 active `client_id = alvira-bridge` bearer tokens across three users were revoked;
- the post-revocation count was zero active `alvira-bridge` tokens and zero active `alvira-bridge` connections;
- no unexpired `alvira-bridge` authorization codes remained;
- no registered OAuth client advertised the legacy `alviratech-bridge.vercel.app` callback;
- a separately registered scoped MCP client remained active and was not modified;
- ALVIRA stopped allowlisting the standalone application's callback.

The Vercel deployment may continue to render until the Vercel project/domain is deleted, but it no longer has a supported credential path into ALVIRA.

## Canonical ownership

The canonical Bridge implementation lives in this ALVIRA repository:

- `src/lib/bridge.ts`
- `src/routes/bridge/`
- `src/routes/api/bridge/`
- Bridge database migrations
- `docs/BRIDGE_API_PROVIDER.md`

ALVIRA is the Context Engine and source of truth. Bridge is an ALVIRA capability for distributing approved Context. The standalone application is **not** a separate product authority and must not regain interview, Context generation, storage, authorization policy, or canonical MCP ownership.

## Preserved historical surface

The copied source records the old behavior for audit/reference:

- `app/api/auth/start/route.ts` — sent a user into ALVIRA's Bridge consent flow;
- `app/api/auth/callback/route.ts` — exchanged the legacy confidential-client authorization code and stored the access token in an HTTP-only cookie;
- `app/api/context/route.ts` — read authorized ALVIRA Context through the compatibility cookie;
- `app/api/mcp/route.ts` — the old MCP facade exposed by the legacy deployment;
- `lib/alvira.ts` — called the canonical ALVIRA Bridge token/profile APIs;
- `package.json`, `tsconfig.json`, and `vercel.json` — historical build/runtime shape.

## Intentionally not copied

The following standalone material was superseded and was not worth carrying as active source:

- reconstructed marketing landing page and styling;
- duplicated ALVIRA brand assets;
- `BridgeConnection` presentation component;
- standalone product-positioning README/AGENTS copy;
- the old Bridge architecture document where current `docs/BRIDGE_API_PROVIDER.md` is more complete;
- repository-specific workflow/configuration noise.

## Reuse rules

1. Treat everything here as **historical prior art**, not a dependency or deployable supported client.
2. Do not import this directory into ALVIRA runtime or deployment paths.
3. Do not restore the legacy callback or `BRIDGE_PUBLIC_URL` to revive this client.
4. New integrations must use the canonical ALVIRA Bridge OAuth/MCP/API surfaces.
5. If historical behavior is useful, port the concept into current owned code and re-run current security and protocol verification.

The old Vercel project/domain can be removed without migrating these source files elsewhere; they are already preserved here.
