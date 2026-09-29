# ALVIRA E2E durable evidence

Raw E2E evidence may contain personal Context, browser state, private screenshots, or large recordings. Those files do **not** belong in Git by default.

The durable evidence path is:

```text
private run directory
  -> owner-approved artifact list
  -> SHA-256 + size + evidence metadata
  -> committed evidence manifest
  -> AgentOS audit/outcome reference
  -> reviewer inspects original artifact when needed
```

## Canonical locations

- Raw/private run artifacts: `private://alvira-e2e-runs/<run-id>/...`
- Local workstation convention: `~/Work/alvira-e2e-runs/<run-id>/`
- Durable approved manifests: `docs/e2e/evidence/manifests/<run-id>.json`
- Manifest contract: `tk-ap/agent-os/contracts/evidence-artifact-manifest.schema.json`
- Generator: `python3 scripts/e2e/e2e-evidence`

The `private://` locator is an opaque retention reference. It avoids committing a machine-specific absolute path while preserving which retained artifact the checksum describes.

## What a manifest proves

A committed manifest proves which exact bytes were approved for durable reference at the time the manifest was produced:

- artifact identity;
- SHA-256;
- byte size;
- source run;
- source commit/branch when available;
- harness/executor;
- verification state;
- approval metadata;
- storage/visibility policy.

It does **not** prove that the artifact's contents are correct, that the run passed, or that an independent reviewer inspected the artifact.

## Raw evidence policy

Default to metadata-only references for private E2E evidence.

Never commit by default:

- screen recordings;
- raw full Context/profile exports;
- private browser screenshots;
- authentication or authorization material;
- database URLs, bearer tokens, cookies, session state, or secrets;
- blind-review keys before the review is complete;
- artifacts containing personal or sensitive Context unless a separate explicit publication decision approves the actual content.

Small sanitized reports or scorecards may be committed separately only after their contents are reviewed and approved. The evidence manifest still records the exact referenced bytes.

## Registration workflow

1. Finish the run and preserve the files in its run directory.
2. Inspect the artifacts. Do not approve files merely because they exist.
3. TK approves the exact run-relative paths that may become durable references.
4. Run `python3 scripts/e2e/e2e-evidence` with one `--include` per approved file/glob.
5. Review `<run>/evidence/evidence-artifact-manifest.json`.
6. If correct, publish the metadata manifest into this directory with `--publish`.
7. Commit only the manifest (and separately approved sanitized text evidence, if any).
8. When the run corresponds to governed AgentOS work, link the manifest from the audit/outcome evidence.

If the raw artifact is unavailable in the current environment, **do not invent the hash or size**. Leave registration unresolved until an agent or operator with legitimate access to the retained bytes can generate the manifest.

## Known September 25 backfill

The runbook records at least these September 25, 2026 E2E runs/attempts:

- `alvira-agent-e2e-20260925-01` — first Claude Code engineering run/reference report.
- founders-demo/run-02 work described in the runbook.

Their local raw directories must be inspected on the Omarchy workstation before durable manifests are added. Repository text is not a substitute for hashing the original bytes.
