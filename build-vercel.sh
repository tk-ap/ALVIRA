#!/usr/bin/env bash
# Produce a Vercel Build Output API bundle (.vercel/output) for this site, then
# deploy it with:  bunx vercel deploy --prebuilt
#
# Why Build Output API instead of Vercel's Vite/framework detection:
#  - TanStack Start emits a host-agnostic fetch handler (dist/server/server.js)
#    that dynamic-imports its own ./assets chunks and externalizes node deps.
#    Letting Vercel trace/detect that is fragile.
#  - Bundling it into one self-contained file (deps + dynamic chunks inlined) in a
#    single render.func removes all tracing/detection risk. vercel-entry.ts adapts
#    the Node (req,res) launcher to the web fetch handler.
set -euo pipefail
cd "$(dirname "$0")"
umask 002

echo "[1/4] vite build (light — safe under the sandbox memory cap)"
# The workspace starts as sources only (deps live with the image's pre-built
# placeholder copy); no-op once node_modules is current.
bun install
bun run build

echo "[2/4] schema gate: migrate + verify (fail deploy if schema can't match code)"
# This is the P0 release gate: no code ships without a schema that matches it.
# A missing DATABASE_URL here is a hard failure — a deploy without a reachable
# DB (and a verified schema) must not proceed. `db:migrate` is idempotent and
# version-tracked (scripts/migrate-db.ts), and `db:verify` fails if any
# required table — including Bridge authorization tables — is absent.
: "${DATABASE_URL:?DATABASE_URL is required for the deploy schema gate}"
bun run db:migrate
bun run db:verify

echo "[3/4] assemble .vercel/output (Build Output API v3)"
rm -rf .vercel/output
mkdir -p .vercel/output/functions/render.func
cp -R dist/client .vercel/output/static
rm -f .vercel/output/static/index.html   # SSR owns "/", not a static shell

echo "[4/4] bundle SSR handler + deps into the render function"
bun build vercel-entry.ts --target node \
  --outfile .vercel/output/functions/render.func/index.mjs

cat > .vercel/output/functions/render.func/.vc-config.json <<'JSON'
{ "runtime": "nodejs22.x", "handler": "index.mjs", "launcherType": "Nodejs", "supportsResponseStreaming": true }
JSON

# Bridge OAuth discovery must exist before the MCP client has any ALVIRA
# session. Publish it as static Build Output metadata rather than relying on a
# framework rewrite: this project deploys prebuilt output, so repo-level
# vercel.json rewrites are not authoritative for these requests.
BRIDGE_ORIGIN="https://${VERCEL_PROJECT_PRODUCTION_URL:-alviratech.vercel.app}"
cat > .vercel/output/static/bridge-oauth-resource.json <<JSON
{
  "resource": "${BRIDGE_ORIGIN}/api/bridge/mcp",
  "resource_name": "ALVIRA Bridge",
  "authorization_servers": ["${BRIDGE_ORIGIN}"],
  "scopes_supported": ["context:read", "profile:read"],
  "bearer_methods_supported": ["header"]
}
JSON
cat > .vercel/output/static/bridge-oauth-server.json <<JSON
{
  "issuer": "${BRIDGE_ORIGIN}",
  "authorization_endpoint": "${BRIDGE_ORIGIN}/api/bridge/authorize",
  "token_endpoint": "${BRIDGE_ORIGIN}/api/bridge/token",
  "client_id_metadata_document_supported": true,
  "registration_endpoint": "${BRIDGE_ORIGIN}/api/bridge/register",
  "response_types_supported": ["code"],
  "grant_types_supported": ["authorization_code"],
  "code_challenge_methods_supported": ["S256"],
  "token_endpoint_auth_methods_supported": ["none", "client_secret_post"],
  "scopes_supported": ["context:read", "profile:read"]
}
JSON

cat > .vercel/output/config.json <<'JSON'
{
  "version": 3,
  "routes": [
    { "src": "/\\.well-known/oauth-protected-resource", "dest": "/bridge-oauth-resource.json" },
    { "src": "/\\.well-known/oauth-protected-resource/api/bridge/mcp", "dest": "/bridge-oauth-resource.json" },
    { "src": "/\\.well-known/oauth-authorization-server", "dest": "/bridge-oauth-server.json" },
    { "handle": "filesystem" },
    { "src": "/(.*)", "dest": "/render" }
  ]
}
JSON

echo "done -> .vercel/output ready for: bunx vercel deploy --prebuilt"
