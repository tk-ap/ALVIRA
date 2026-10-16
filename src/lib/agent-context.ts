// ── Existing AI context, pasted ──
//
// Memory, custom instructions or a summary from another AI can be pasted, not only uploaded. The
// text goes through the same claim review as an uploaded file; the source is recorded only when at
// least one claim is approved.
//
// Agents offering their own existing context first (once the owner opts in) needs a server-enforced
// agent viewer and owner grant (Codex review of #216); it waits for agent sign-in (#200).

import type { ContextSource, SourceContributor } from "~/lib/context-engine";

/** Pasted AI context larger than this is refused (the file upload caps at 5MB; pastes stay smaller). */
export const MAX_PASTED_CONTEXT_CHARS = 100_000;

/** Why pasted AI context cannot be reviewed, or undefined when it can. */
export function pastedContextProblem(text: string): string | undefined {
  const trimmed = text.trim();
  if (!trimmed) return "Paste the AI context first.";
  if (trimmed.length > MAX_PASTED_CONTEXT_CHARS) {
    return `That is more than ${MAX_PASTED_CONTEXT_CHARS.toLocaleString("en-US")} characters. Paste a shorter part, or upload it as a file.`;
  }
  return undefined;
}

/** The source recorded for pasted AI context once its claims are approved, with who supplied it. */
export function pastedContextSource(contributor: SourceContributor, now: string = new Date().toISOString()): ContextSource {
  const who = contributor.actor_type === "agent" ? `agent ${contributor.actor_id ?? "(unnamed)"}` : "the person";
  return {
    id: crypto.randomUUID(),
    type: "ai-context",
    label: `Existing AI context pasted by ${who}`,
    locator: `pasted:${now}`,
    status: "ready",
    addedAt: now,
    addedBy: contributor,
  };
}
