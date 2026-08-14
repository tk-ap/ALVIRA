# ALVIRA Brand Reference Assets

## Purpose

This directory stores original visual references used to guide ALVIRA brand implementation. Files here are design inputs, not production website assets.

The production application must not import or serve assets from this directory.

## Status

This workflow is an operational recommendation for safe multi-agent collaboration. It does not change Revision 11 owner-ratified product direction.

The primary and secondary `ALVIRA/>` directions added on 2026-08-02 are owner-approved brand decisions made after Revision 11. Their production adaptation remains a separate implementation task.

## Mark Usage Guidance

See [`ALVIRA_MARK_USAGE.md`](ALVIRA_MARK_USAGE.md) for the approved hierarchy, use cases, constraints, and production acceptance criteria for the primary and secondary marks.

## Current Canonical References

### Primary balanced wordmark v1

- File: `source/2026-08-02/alvira-primary-wordmark-balanced-v1.png`
- Date added: 2026-08-02
- SHA-256: `0470c3abff2177425c8331eb3752aab9e40adc33fd0ff1cc92dbf07c5e18d347`
- Status: Owner-approved primary mark direction; production vector adaptation required
- Purpose: Default `ALVIRA/>` identity for navigation, product surfaces, and compact placements
- Production use: Reference only; do not load the PNG in the website
- Preservation: Immutable

### Secondary axis wordmark v1

- File: `source/2026-08-02/alvira-secondary-axis-wordmark-v1.png`
- Date added: 2026-08-02
- SHA-256: `b6d0499f8e51e245ac4bbb11eab7306e9fbc7244ed91de5ba60618b1f4106f9e`
- Status: Owner-approved secondary mark direction; production vector adaptation required
- Purpose: Expressive `ALVIRA/>` identity for large editorial and campaign moments
- Production use: Reference only; do not load the PNG in the website
- Preservation: Immutable

### Context Frame v3

- File: `alvira-logo-context-frame-v3.png`
- Date added: 2026-08-02
- SHA-256: `0af7c1896ffced0a475034cbd29cef2329037d981f5203c130b4eb96d10df353`
- Status: Earlier owner-selected direction and current production reference at time of this update
- Purpose: Visual source for the Context Frame symbol and prior ALVIRA wordmark implementation
- Production use: Reference only; do not load the PNG in the website header
- Preservation: Keep this file unchanged because implementation briefs and repository history reference it

## Directory Convention

Use this structure for future asset intake:

```text
design/brand-references/
├── README.md
├── ALVIRA_MARK_USAGE.md
├── alvira-logo-context-frame-v3.png
├── source/
│   └── YYYY-MM-DD/
│       └── original-asset.ext
└── archive/
    └── retired-reference.ext

public/
└── brand/
    └── production-ready-assets
```

### `source/YYYY-MM-DD/`

Use for future original images, exported concepts, and other immutable reference files.

Requirements:

- Preserve the original bytes.
- Use lowercase kebab-case filenames.
- Add an inventory entry to this README.
- Record the date, purpose, status, and SHA-256 checksum.
- Do not place production-ready files here.

### `archive/`

Use only when a reference is intentionally retired or superseded and keeping it visible in the active source collection would create ambiguity.

Do not use `archive/` to make routine backup copies.

### `public/brand/`

Use only for production-ready assets referenced by the application, including optimized SVGs, favicons, and app icons.

Production files must be derived through a reviewed task branch and pull request.

## Why There Is No Duplicate Backup Folder

Git already preserves every committed version of an asset. Duplicating binaries into folders named `backup`, `copy`, or `old`:

- increases repository size;
- creates uncertainty about the canonical file;
- encourages agents to update the wrong copy;
- does not provide stronger recovery than Git history.

Use Git commits, pull requests, and tagged releases for recovery. Use the archive directory only to communicate that a reference is retired.

## Asset Intake Workflow

1. Refresh from the latest `main`.
2. Confirm the asset does not already exist.
3. Create a dedicated `codex/<asset-task>` branch.
4. Place future originals under `source/YYYY-MM-DD/`.
5. Record the asset in this README.
6. Do not modify production assets in the same commit unless the task explicitly includes implementation.
7. Commit only the intended files.
8. Open a draft pull request.
9. Verify the binary can be opened from GitHub.
10. Merge only after review.

## Asset Inventory Template

```markdown
### Asset name

- File: `source/YYYY-MM-DD/filename.ext`
- Date added: YYYY-MM-DD
- SHA-256: `checksum`
- Status: exploratory | owner-selected | approved production source | retired
- Purpose: concise description
- Production use: reference only | intended derivative
- Preservation: immutable
```

## Non-Destructive Rules

- Never overwrite an original reference.
- Never move a referenced file without updating every dependent path in the same pull request.
- Never delete a reference solely because a production derivative exists.
- Never use a concept presentation PNG directly as a navigation logo when it contains a background or presentation whitespace.
- Keep production assets and source references clearly separated.
