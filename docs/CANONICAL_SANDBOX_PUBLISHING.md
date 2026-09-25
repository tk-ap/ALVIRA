# Canonical ALVIRA here.now sandbox

The permanent static sandbox is a single complete site owned by the `sandbox/review` branch and published only to `mighty-ether-p6cn`.

Production (`main` and `https://alviratech.vercel.app/`) is a separate release boundary. This document does not authorize production deployment, database changes, authentication changes, payment changes, or server-action changes.

## Required publish flow

```bash
bash scripts/sandbox-build.sh
/home/tk/.claude/skills/here-now/scripts/publish.sh dist/client --slug mighty-ether-p6cn --client codex
```

`scripts/sandbox-build.sh` runs the static backend-call guard and `scripts/sandbox-verify.mjs`. The verification step fails unless the generated bundle contains the canonical routes and their expected content, rather than relying on a static-host HTTP 200 fallback.

Never publish a subdirectory, a route, or a historical variant to `mighty-ether-p6cn`. A here.now update replaces the full Site snapshot, so a partial publish can erase otherwise healthy routes.

## Canonical routes

- `/`
- `/app/`
- `/context/`
- `/bridge/connect/`
- `/meos/`
- `/lab/interview/`

The Interview Lab route is a static product shell. It must state that generation, authentication, Context writes, and persistence remain in the server-backed Lab; it must never fabricate those capabilities.

The static `/app/`, `/bridge/connect/`, and `/meos/` routes similarly present the product direction without calling authentication, database, OAuth, MCP, payment, or persistence endpoints. Their corresponding server-backed workflows remain available only in the real application.

## Legacy aliases and variant disposition

| Historical branch                     | Disposition                                                              | Durable route      | Legacy URL behavior                                   |
| ------------------------------------- | ------------------------------------------------------------------------ | ------------------ | ----------------------------------------------------- |
| `sandbox/variant/interview-shell`     | Port the immersive Interview Shell direction                             | `/lab/interview/`  | `/variants/interview-shell/` redirects to the Lab     |
| `sandbox/variant/dossier`             | Archive; do not adopt its unapproved product-wide rename                 | `/meos/`           | `/variants/dossier/` redirects to Reflect             |
| `sandbox/variant/context-portability` | Archive; homepage experiment is not an independent surface               | `/context/`        | `/variants/context-portability/` redirects to Context |
| `sandbox/variant/connect-loop`        | Archive; server-backed Bridge proposal work is outside this static build | `/bridge/connect/` | `/variants/connect-loop/` redirects to Connect        |

Historical branches remain recovery references. New durable sandbox work starts from `sandbox/review`; an intentionally isolated experiment is not durable until its accepted work is reconciled into this branch and passes the one-build verification gate.
