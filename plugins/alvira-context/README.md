# ALVIRA Connect

**Portable by default. Connected where possible.**

ALVIRA Connect is the distribution package for taking one user-approved ALVIRA Context (or a scoped Context View) into another AI environment without making that environment the source of truth.

## Free interoperability layers

1. **Portable Context View** — copy or download a reviewed `.md` packet from ALVIRA. Works anywhere text or file upload works.
2. **Browser extension** — inserts a saved reviewed Context View into supported web-AI prompt surfaces. It never auto-sends.
3. **Native/platform adapters** — use the best installation surface a destination actually supports at the user's plan level.
4. **Remote MCP** — preferred machine-to-machine connection for capable clients.
5. **Bridge API** — fallback for custom applications.

## Existing MCP adapter

`.mcp.json` points at the canonical read-only Bridge endpoint:

`https://alviratech.vercel.app/api/bridge/mcp`

OAuth, Context selection, token scope, expiry, and revocation remain ALVIRA Bridge responsibilities.

## Security boundary

ALVIRA Connect transports Context only. It does not grant execution authority, write access to ALVIRA, or permission to infer permanent facts. Each automated connection is scoped and revocable. Portable packets are user-reviewed copies with no account credential attached.

## Package layout

- `.codex-plugin/` — Codex-specific package metadata.
- `.mcp.json` — remote MCP connection metadata.
- `browser-extension/` — Chromium Manifest V3 browser adapter MVP.

Additional native adapters should live alongside these only when the destination has an official installable surface. Do not create parallel Context stores or duplicate Bridge authorization logic inside adapters.
