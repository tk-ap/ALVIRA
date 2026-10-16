// ── Existing AI context from a delegated agent ──
//
// An agent working for the person often already holds context about them (its memory, custom
// instructions, earlier conversations, exports). Once the owner opts in, the agent sees "Existing
// AI context" first among the source options and can paste it; the text goes through the same
// claim review as an uploaded file before anything becomes part of the Context. Without the
// owner's opt-in a delegated agent is not offered this source at all.

import { CONTEXT_SOURCE_OPTIONS, type ContextSource, type SourceContributor } from "~/lib/context-engine";

/** Pasted AI context larger than this is refused (the file upload caps at 5MB; pastes stay smaller). */
export const MAX_PASTED_CONTEXT_CHARS = 100_000;

export type SourceOption = (typeof CONTEXT_SOURCE_OPTIONS)[number];

/**
 * Source options in display order for whoever is viewing.
 * - The person: unchanged.
 * - A delegated agent the owner opted in: Existing AI context first.
 * - A delegated agent without the opt-in: Existing AI context is not offered.
 */
export function sourceOptionsFor(viewerIsAgent: boolean, agentContextOptIn: boolean): SourceOption[] {
  if (!viewerIsAgent) return [...CONTEXT_SOURCE_OPTIONS];
  const aiContext = CONTEXT_SOURCE_OPTIONS.filter((option) => option.type === "ai-context");
  const rest = CONTEXT_SOURCE_OPTIONS.filter((option) => option.type !== "ai-context");
  return agentContextOptIn ? [...aiContext, ...rest] : rest;
}

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
