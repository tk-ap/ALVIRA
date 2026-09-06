# Preview URLs

## Stable branch preview — use this for smoke tests

The branch-preview URL auto-updates to the latest deployment on every push.
Always smoke-test against this alias. The per-commit deployment URL
(`alvira-<hash>-alvira2.vercel.app`) goes stale after each push — do not pin it.

- **`codex/interview-intro`**: https://alvira-git-codex-interview-intro-alvira2.vercel.app

## Deriving the branch preview URL

Format: `<project>-git-<branch-with-dashes>-<scope>.vercel.app`

- Project: `alvira`
- Scope: `alvira2`
- Branch `a/b/c` → `a-b-c` (slashes become dashes)

## Per-commit deployment URL (avoid)

```
gh api repos/tk-ap/ALVIRA/deployments/<id>/statuses --jq '.[0].target_url'
```
