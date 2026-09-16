# ALVIRA Bridge standalone compatibility client

Status: **compatibility source — not canonical ALVIRA runtime code**

This directory preserves the small standalone client surface from the retired `tk-ap/alvira-bridge` repository that is still relevant while the legacy `alviratech-bridge.vercel.app` deployment remains a compatibility client.

## Provenance

- original repository: `tk-ap/alvira-bridge`
- original branch: `main`
- source commit: `3ca9356bd4976677a4fc381d634896c284d9b41d`
- source was itself a reconstruction of the publicly rendered Bridge site, not the original CTO.new project export
- Vercel project: `alviratech-bridge` (`prj_NDkjEfeBFiLve5ocmkstXDMr2A5E`)
- current production deployment observed during consolidation: `dpl_9dYvRoM8ogqqzfBZqbNogZ11YmuB`, built from the source commit above
- legacy public alias: `https://alviratech-bridge.vercel.app`
- consolidated into ALVIRA: 2026-09-15

The Vercel project was observed to have no current Git link, so deleting the standalone GitHub repository does not itself remove the existing immutable deployment. The deployment must still be treated as a compatibility surface until its consumers are deliberately retired.

## Canonical ownership

The canonical Bridge implementation now lives in this ALVIRA repository:

- `src/lib/bridge.ts`
- `src/routes/bridge/`
- `src/routes/api/bridge/`
- Bridge database migrations
- `docs/BRIDGE_API_PROVIDER.md`

ALVIRA is the Context Engine and source of truth. Bridge is an ALVIRA capability for distributing approved Context. The standalone application is **not** a separate product authority and must not regain interview, Context generation, storage, authorization policy, or canonical MCP ownership.

## Preserved compatibility surface

This directory preserves only the old client behavior that may still matter to consumers of the legacy domain:

- `app/api/auth/start/route.ts` — sends a user into ALVIRA's Bridge consent flow.
- `app/api/auth/callback/route.ts` — exchanges the legacy confidential-client authorization code and stores the access token in an HTTP-only cookie.
- `app/api/context/route.ts` — reads the currently authorized ALVIRA Context through the compatibility cookie.
- `app/api/mcp/route.ts` — the old MCP facade exposed by the legacy deployment.
- `lib/alvira.ts` — calls the canonical ALVIRA Bridge token/profile APIs.
- `package.json`, `tsconfig.json`, and `vercel.json` — historical build/runtime shape needed to understand or reconstruct the compatibility client.

## Intentionally not copied

The following standalone material is superseded and is not worth carrying as active source:

- reconstructed marketing landing page and styling;
- duplicated ALVIRA brand assets;
- `BridgeConnection` presentation component;
- standalone product-positioning README/AGENTS copy;
- the old Bridge architecture document where current `docs/BRIDGE_API_PROVIDER.md` is more complete;
- repository-specific workflow/configuration noise.

The immutable Vercel deployment still preserves the historical rendered landing page while it remains live. ALVIRA's `/bridge` experience is the canonical UI going forward.

## Known limitations

1. This is a **legacy confidential-client** flow that depends on `BRIDGE_CLIENT_SECRET`. New third-party/public MCP clients should use ALVIRA's current authorization architecture, including PKCE/CIMD where appropriate.
2. The old MCP facade is not the canonical protocol implementation. The canonical endpoint is `https://alviratech.vercel.app/api/bridge/mcp` and follows the current protocol/security contract documented in `docs/BRIDGE_API_PROVIDER.md`.
3. The historical `package.json` used `latest` dependency ranges. Do not redeploy from this directory without pinning/validating dependencies and running the current security/tests.
4. This directory must not be imported by the main ALVIRA application. It exists so the old GitHub repository can be deleted without losing the compatibility-client implementation.

## Retirement gate

Do not delete the Vercel compatibility deployment or remove its allowlisted callback merely because the source repository is gone.

The legacy client can be retired only after all of the following are true:

1. no known consumers still use `alviratech-bridge.vercel.app` for auth, context readback, or MCP;
2. callers have migrated to ALVIRA-owned `/api/bridge/*` endpoints;
3. `BRIDGE_PUBLIC_URL` / the legacy callback is no longer required in production;
4. active legacy tokens/connections are either migrated, expired, or deliberately revoked;
5. the old domain can be removed or redirected without breaking a supported client.

Until then, preserve the Vercel deployment even though the standalone GitHub repository may be deleted.
