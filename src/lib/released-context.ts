// ── What may leave ALVIRA: one shaping step for every outbound copy of a saved Context ──
//
// Used by the Bridge (connected AIs) and by the structured download (context.json / context.toon),
// so they release the same thing the compiled files do:
// - links and sources: only owner-confirmed ("ready") ones, never one carrying a credential;
// - sensitive answers: withheld unless the caller explicitly asks (Bridge include_sensitive only);
// - goal spec: never the raw draft; only the owner-approved, up-to-date fields, through the
//   goal-spec release gate (goalSpecJson / releasedEntry).

import type { ContextSource } from "~/lib/context-engine";
import { citableAnswers, goalSpecJson, goalSpecReleasable } from "~/lib/goal-spec";
import { WITHHELD, isSensitive } from "~/lib/sensitivity";
import { redactAnswerLinks } from "~/lib/source-links";
import { redactSensitiveState } from "~/lib/sensitivity";
import { carriesCredential } from "~/lib/source-links";
import { getKnowledgeGraph, type InterviewState, type Tier } from "~/routes/-knowledgeGraph";

/**
 * The topic as it may leave ALVIRA (Codex review of a5f9c55): links are always redacted, so an
 * unreviewed or credential link can't ride along; a sensitive topic is withheld unless the caller
 * explicitly asked for sensitive items.
 */
export function releasedTopic(topic: string | null | undefined, options: { includeSensitive?: boolean } = {}): string {
  const text = (topic ?? "").trim();
  if (!text) return "";
  if (isSensitive(text) && !options.includeSensitive) return WITHHELD;
  return redactAnswerLinks(text);
}

/** Owner-confirmed sources only; a link carrying a credential never leaves, even if marked ready. */
export function releasedSources(sources: ContextSource[] | undefined): ContextSource[] {
  return (sources ?? []).filter((source) => source && source.status === "ready" && !carriesCredential(String(source.locator ?? "")));
}

export interface ReleasedGoalSpec {
  schema: "alvira.goal-spec.v1";
  topic: string;
  drafted_at: string | null;
  drafted_by: { actor_type: string; actor_id?: string };
  fields: Record<string, { value: string | null; basis: "interview" | "owner"; citations: string[] }>;
}

/** The owner-approved goal spec as it may leave ALVIRA, or null when nothing is releasable. */
export function releasedGoalSpec(state: InterviewState): ReleasedGoalSpec | null {
  const tier: Tier = state.tier === "team" || state.tier === "enterprise" ? state.tier : "personal";
  const citable = citableAnswers({ topic: state.topic ?? "", domains: state.domains ?? {} }, getKnowledgeGraph(tier));
  if (!goalSpecReleasable(state.goalSpec, { domains: state.domains ?? {} }, citable)) return null;
  return JSON.parse(goalSpecJson(state.goalSpec, state, citable)) as ReleasedGoalSpec;
}

/**
 * A saved Context shaped for release: raw goal-spec draft removed, sources limited to confirmed
 * ones, sensitive answers withheld unless includeSensitive, plus the released goal spec.
 */
export function releasedContextState(state: InterviewState, options: { includeSensitive?: boolean } = {}) {
  const { goalSpec: _draft, ...rest } = state;
  const base = { ...rest, topic: releasedTopic(state.topic, options), contextSources: releasedSources(state.contextSources) } as InterviewState;
  if (options.includeSensitive) return { state: base, withheld: 0, goal_spec: releasedGoalSpec(state) };
  const shaped = redactSensitiveState(base as unknown as Parameters<typeof redactSensitiveState>[0]);
  return { state: shaped.state as unknown as InterviewState, withheld: shaped.withheld, goal_spec: releasedGoalSpec(state) };
}
