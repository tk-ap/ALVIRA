# Repository consolidation review — August 2026

## Source direction

The supplied ecosystem map calls for one clean production-ready `main`, with the product architecture consolidated into Context Engine → Bridge → Workflow Studio → AI Agents. It recommends merging grouped work through PRs, requiring passing checks, testing each group, and deleting merged branches only after verification.

## Current repository reality

The supplied map lists 20 active branches. The live repository currently contains more: 30+ `codex/*` branches plus dedicated `fix/*`, `vercel/*`, and `tk-ap-*` branches. The map is therefore a useful **target state**, not a current inventory.

## Recommended cleanup order

### 1. Bridge / integrations

Keep the Bridge product branch and paid-integration work as the integration layer. The new `codex/bridge-api-provider` branch adds the provider contract that lets Bridge consume ALVIRA context without duplicating the Context Engine.

### 2. Context Engine / MEOS

Review and consolidate:

- `codex/meos-builder-kit`
- `codex/meos-preserve-topic`
- `codex/meos-entitlements`
- `fix/meos-theme-overwrite`
- related accessibility/theme branches only when their changes are still needed on `main`

The highest priority is preserving user-entered context and avoiding destructive state changes.

### 3. Restore / draft / access

Review:

- `codex/restore-build`
- `codex/restore-owner-draft`
- `codex/fix-draft-restore-priority`
- `codex/owner-full-access`

These should converge into one account/draft integrity implementation before additional product layers depend on it.

### 4. Generation / export

Review:

- `fix/generate-hang`
- `codex/diagnose-markdown-gen`
- `codex/relax-generate-guard`
- `tk-ap-fix-ai-profile-export`

Keep one canonical generation/export implementation. Bridge should consume its output rather than fork generation logic.

### 5. Launch / infrastructure

Review:

- `codex/marketability-launch`
- `prelaunch-hardening`
- `codex/vercel-runtime-migration`
- the two `vercel/*` branches

Prefer one production runtime/configuration path. Analytics should be retained only once the package/component integration is confirmed on `main`.

### 6. Policy / brand

Review selectively:

- `codex/free-user-test-policy`
- `codex/warm-tan-palette`
- current logo/wordmark and accessibility branches

The ecosystem direction says ALVIRA should use one coherent visual system; do not merge competing palette or logo variants simply because both branches are small.

## Branch deletion rule

Do not delete branches merely because they look old. Before deletion:

1. Determine whether the branch was merged, superseded, or contains unique work.
2. Preserve any required work in `main` or a long-lived branch.
3. Run build/lint/tests and critical product-flow checks.
4. Tag a release when a major consolidation milestone is complete.
5. Delete only verified merged/superseded branches.

## Target state

`main` should become the single source of truth for the product. Long-lived branches should be exceptional and intentional. Bridge should remain a separate deployable product/repository while sharing the same ALVIRA architecture and brand contract.
