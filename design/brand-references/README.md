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

## UI Audit References

Annotated evidence renders produced by the 2026-09-05 marketing-homepage design review (`ALVIRA_UI_REBALANCE_BRIEF.md`, work item `alvira-ui-rebalance-2026-09-05`). These are diagnostic overlays on the live deployment, not brand-mark direction, and they do not carry owner-ratified product direction.

Captured at 1440x5743 from `https://alviratech.vercel.app/` after `document.fonts.ready`, then colour-quantised for size.

### Homepage heading-axis audit

- File: `source/2026-09-05/ui-audit-heading-axes.png`
- Date added: 2026-09-05
- SHA-256: `a625f7fd86fb0f82f66fbddcce6c98668af4671323874049e1847b0e991ec137`
- Status: exploratory
- Purpose: Annotated full-page render marking every distinct H1/H2 left edge on the marketing homepage, with per-axis occurrence counts and per-heading column width, size and line count.
- Production use: Reference only; never load these files in the website
- Preservation: Immutable

### Homepage proposed 12-column grid

- File: `source/2026-09-05/ui-audit-proposed-12col-grid.png`
- Date added: 2026-09-05
- SHA-256: `0eaea10eb4760ab7f1d59cdb04e582e09a11e944822965a7fe092e7052a6b9bb`
- Status: exploratory
- Purpose: The proposed 12-column / 1200px / 24px-gutter grid overlaid on the current homepage, highlighting columns 1 and 5 as the only two proposed content axes.
- Production use: Reference only; never load these files in the website
- Preservation: Immutable

### Homepage display-measure audit

- File: `source/2026-09-05/ui-audit-display-measure.png`
- Date added: 2026-09-05
- SHA-256: `758d11fafbcb4c3051190205d045a4c2c7b5aaa88ceeaae37a8e581283f982b2`
- Status: exploratory
- Purpose: Every heading at or above 56px boxed, marked red where its column is under 640px, with a dashed 640px minimum-measure bar beneath each failing heading.
- Production use: Reference only; never load these files in the website
- Preservation: Immutable

### Homepage section-rhythm audit

- File: `source/2026-09-05/ui-audit-section-rhythm.png`
- Date added: 2026-09-05
- SHA-256: `14380e88c2f34ec87abcdf77da7e0f8f451f37169534af896b6a9d0b26bd9077`
- Status: exploratory
- Purpose: Each homepage section banded and labelled with its height and vertical padding, marking the four sections that carry no padding.
- Production use: Reference only; never load these files in the website
- Preservation: Immutable
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

