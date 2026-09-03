# Native architecture boundary

## Principle

ALVIRA has one context system and multiple clients. Native must not fork identity, Context, Reflect, entitlements, or Bridge into a second product backend.

```text
Web client ───────┐
                  ├── ALVIRA server/runtime ── Neon / model services / billing
Native client ────┘
```

## Native 0.1: container proof

The first build uses Capacitor's native container with the production `/app` origin. This is intentionally narrow: it proves device packaging and same-account/same-Context continuity without changing production server code.

This is **not** the final store architecture and should not be treated as the long-term mobile boundary.

## Native 0.2: explicit mobile API boundary

After the 0.1 proof, move the native UI toward local packaged assets and expose only the server contracts the mobile client actually needs. Prefer versioned routes such as:

- `GET /api/mobile/v1/session`
- `POST /api/mobile/v1/auth/*`
- `GET /api/mobile/v1/context`
- `POST /api/mobile/v1/context/sources`
- `GET /api/mobile/v1/reflect`
- `POST /api/mobile/v1/reflect/*`

Names above are directional, not committed public API contracts yet. Existing TanStack `createServerFn` behavior remains authoritative until those routes are deliberately introduced and tested.

## Authentication

0.1 reuses the existing web session inside the native WebView. Before public store distribution, evaluate a mobile-specific secure session/token exchange and deep-link callback flow so native identity is explicit and revocable without duplicating user records.

## Billing

0.1 does not alter billing. Existing Stripe/web entitlement behavior remains authoritative. Store billing/RevenueCat is a later milestone and must map back into ALVIRA's existing entitlement model rather than creating a second access system.

## Bridge

Bridge remains a server capability and is untouched by the native shell. Native work must not change the already-proven OAuth/MCP connection path during this phase.

## Native capability order after 0.1

1. voice/context capture
2. Share to ALVIRA
3. document/camera capture
4. biometric app protection
5. notifications/reflection prompts
6. store billing integration

Each capability should be added behind the same account and Context identity proven in 0.1.
