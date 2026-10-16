// ── Interview depth: the person or agent decides how deep the interview goes ──
//
// "fast"     — only the areas the goal needs, with fewer follow-ups.
// "standard" — every area (the behaviour before depth existed; the default).
// "deep"     — every area, with more follow-ups on what the person says.
//
// Depth narrows the area list itself, so progress, gap detection and the
// next-area choice all agree on what "done" means for this interview.

import type { Domain, InterviewState } from "~/routes/-knowledgeGraph";
import { describeInterviewGoal, domainRelevance } from "~/lib/interview-goal";

export type InterviewDepth = "fast" | "standard" | "deep";

export interface DepthSettings {
  label: string;
  /** One line shown on the start screen. */
  description: string;
  /** An unresolved area is followed up until it has this many answers. */
  maxUnresolvedAnswers: number;
  /** Areas that may receive goal follow-ups across the interview. */
  maxGoalFollowUps: number;
  /** Goal follow-ups allowed on one area. */
  goalFollowUpsPerArea: number;
}

export const DEPTHS: Record<InterviewDepth, DepthSettings> = {
  fast: {
    label: "Fast track",
    description: "Only the areas your goal needs. About 8 questions.",
    maxUnresolvedAnswers: 2,
    maxGoalFollowUps: 1,
    goalFollowUpsPerArea: 1,
  },
  standard: {
    label: "Standard",
    description: "Every area, with a follow-up where your answer touches the goal.",
    maxUnresolvedAnswers: 3,
    maxGoalFollowUps: 4,
    goalFollowUpsPerArea: 1,
  },
  deep: {
    label: "Deep dive",
    description: "Every area, digging further into what you say.",
    maxUnresolvedAnswers: 4,
    maxGoalFollowUps: 10,
    goalFollowUpsPerArea: 2,
  },
};

export const DEPTH_ORDER: InterviewDepth[] = ["fast", "standard", "deep"];

/** Areas a fast-track interview asks about, besides "sources" (always kept). */
export const FAST_TRACK_AREAS = 6;

export function parseDepth(value: unknown): InterviewDepth | undefined {
  return value === "fast" || value === "standard" || value === "deep" ? value : undefined;
}

export function depthSettings(depth: InterviewDepth | undefined): DepthSettings {
  return DEPTHS[depth ?? "standard"];
}

/**
 * The areas this interview covers. Fast track keeps the chosen starting points' areas,
 * then the areas most related to the goal (required ones break ties), up to
 * FAST_TRACK_AREAS, plus "sources". It is computed from the goal alone, so it does not
 * shift as answers come in; areas that already hold answers always stay in.
 */
export function areasForDepth(graph: Domain[], state: Pick<InterviewState, "topic" | "domains" | "history"> & { depth?: InterviewDepth }): Domain[] {
  if (state.depth !== "fast") return graph;
  const goal = describeInterviewGoal(state.topic);
  const ranked = graph
    .filter((domain) => domain.id !== "sources" && domain.id !== "updates")
    .map((domain, index) => ({
      domain,
      index,
      focus: goal.focusDomainIds.includes(domain.id) ? 1 : 0,
      relevance: domainRelevance(domain, goal, []),
    }))
    .sort((a, b) => b.focus - a.focus || b.relevance - a.relevance || Number(b.domain.required) - Number(a.domain.required) || a.domain.priority - b.domain.priority || a.index - b.index);
  const keep = new Set(ranked.slice(0, FAST_TRACK_AREAS).map((entry) => entry.domain.id));
  keep.add("sources");
  // A continued profile starts with an empty conversation; keep the open update question.
  if (state.history.length === 0) keep.add("updates");
  for (const [id, area] of Object.entries(state.domains)) if ((area?.answers?.length ?? 0) > 0) keep.add(id);
  return graph.filter((domain) => keep.has(domain.id));
}

/** Prompt line telling the question generator how deep to go. */
export function depthPromptSection(depth: InterviewDepth | undefined): string {
  if (depth === "fast") {
    return "\n## Depth: fast track\nThe person chose a short interview. Ask for the single most useful fact for the goal in this area; skip nice-to-know detail.";
  }
  if (depth === "deep") {
    return "\n## Depth: deep dive\nThe person chose a thorough interview. Ask for specifics: examples, numbers, names, dates and the reasons behind decisions.";
  }
  return "";
}
