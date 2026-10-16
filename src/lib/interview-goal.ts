// ── Interview goal: what the person chose or typed on /app drives the interview ──
//
// The start screen stores the selected starting points (their internal labels)
// and any typed goal together in `state.topic`, joined with ", ". This module
// turns that back into a goal the question generator can use, and picks the
// next area to ask about from the goal and what the person has already said.

import type { Domain, InterviewState, Message } from "~/routes/-knowledgeGraph";
import { detectGaps, type Gap } from "~/routes/-gapDetection";

export interface StartingPoint {
  /** Label stored in `state.topic` (also what older saved topics contain). */
  topic: string;
  /** Label the person sees on the start screen. */
  label: string;
  /** Areas the interview should reach first for this starting point. */
  focus: string[];
}

export const STARTING_POINTS: StartingPoint[] = [
  { topic: "My communication style and decision-making process", label: "Write or communicate in a way that sounds like me", focus: ["communication", "decisionFrameworks"] },
  { topic: "My daily routines, habits, and personal workflows", label: "Plan and organize everyday life", focus: ["dailyLife", "processes"] },
  { topic: "My values, boundaries, and what I won't compromise on", label: "Think through choices without losing what matters to me", focus: ["identity", "constraints"] },
  { topic: "My key relationships and how I collaborate with others", label: "Handle work, family, or collaboration more thoughtfully", focus: ["relationships", "peopleAndRoles"] },
  { topic: "My goals, priorities, and how I evaluate tradeoffs", label: "Make decisions about goals, priorities, or next steps", focus: ["goals", "decisionFrameworks"] },
];

export interface InterviewGoal {
  /** Start-screen labels the person selected, in the order they appear in the topic. */
  startingPoints: string[];
  /** Anything the person typed themselves. */
  customGoal: string;
  /** Areas the selected starting points ask to reach first. */
  focusDomainIds: string[];
  /** One plain-language line for the question generator; "" when nothing was chosen. */
  summary: string;
}

const MAX_GOAL_CHARS = 600;

export function describeInterviewGoal(topic: string | undefined | null): InterviewGoal {
  let remainder = (topic ?? "").trim();
  const matched: StartingPoint[] = [];
  for (const point of STARTING_POINTS) {
    for (const text of [point.topic, point.label]) {
      if (remainder.includes(text)) {
        if (!matched.includes(point)) matched.push(point);
        remainder = remainder.split(text).join("");
      }
    }
  }
  matched.sort((a, b) => (topic ?? "").indexOf(a.topic) - (topic ?? "").indexOf(b.topic));
  const customGoal = remainder
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .join(", ")
    .slice(0, MAX_GOAL_CHARS);
  const startingPoints = matched.map((point) => point.label);
  const parts: string[] = [];
  if (startingPoints.length) parts.push(`They chose: ${startingPoints.map((label) => `"${label}"`).join("; ")}.`);
  if (customGoal) parts.push(`In their own words: "${customGoal}".`);
  return {
    startingPoints,
    customGoal,
    focusDomainIds: [...new Set(matched.flatMap((point) => point.focus))],
    summary: parts.join(" "),
  };
}

const STOPWORDS = new Set([
  "about", "after", "also", "been", "being", "does", "doing", "each", "from", "have", "having", "into", "just",
  "like", "make", "more", "most", "much", "only", "other", "over", "same", "should", "some", "such", "than",
  "that", "their", "them", "then", "there", "these", "they", "this", "those", "through", "very", "want", "what",
  "when", "where", "which", "while", "will", "with", "would", "your", "yours", "mine", "something", "things",
]);

function tokens(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((word) => word.length >= 4 && !STOPWORDS.has(word))
      .map((word) => word.replace(/(ies|es|s)$/, "")),
  );
}

function overlap(a: Set<string>, b: Set<string>): number {
  let count = 0;
  for (const word of a) if (b.has(word)) count += 1;
  return count;
}

/** How strongly an area relates to the goal (weighted double) and the person's latest answers. */
export function domainRelevance(domain: Pick<Domain, "label" | "description" | "promptHint">, goal: InterviewGoal, recentAnswers: string[]): number {
  const domainWords = tokens(`${domain.label} ${domain.description} ${domain.promptHint}`);
  const goalWords = tokens(`${goal.startingPoints.join(" ")} ${goal.customGoal}`);
  const answerWords = tokens(recentAnswers.join(" "));
  return overlap(domainWords, goalWords) * 2 + overlap(domainWords, answerWords);
}

export function recentUserAnswers(history: Message[], count = 3): string[] {
  return history.filter((message) => message.role === "user").slice(-count).map((message) => message.content);
}

export interface NextAreaContext {
  goal: InterviewGoal;
  history: Message[];
  /**
   * The area the person just answered. The app clears `currentDomain` after a
   * recorded answer, so the caller passes the answered area explicitly.
   */
  answeredDomainId?: string | null;
  /** Domain state, used to bound follow-ups. */
  domains: InterviewState["domains"];
  /** True when ALVIRA is asking for clarification of the answered area. */
  clarifying?: boolean;
  /** Follow-up limits for the chosen interview depth; defaults to the standard limits. */
  limits?: FollowUpLimits;
}

export interface FollowUpLimits {
  maxUnresolvedAnswers: number;
  /** Areas that may receive goal follow-ups across the interview. */
  maxGoalFollowUps: number;
  /** Goal follow-ups allowed on one area. */
  goalFollowUpsPerArea: number;
}

export type NextAreaReason = "unresolved-follow-up" | "goal-follow-up" | "sources" | "starting-point" | "relevance" | "priority";

export interface NextArea {
  domain: Domain;
  reason: NextAreaReason;
}

/** An area that is still unresolved after an answer is followed up until it has this many answers. */
export const MAX_UNRESOLVED_FOLLOW_UP_ANSWERS = 3;
/** A resolved area gets at most one goal follow-up, and an interview at most this many. */
export const MAX_GOAL_FOLLOW_UPS = 4;

const STANDARD_LIMITS: FollowUpLimits = {
  maxUnresolvedAnswers: MAX_UNRESOLVED_FOLLOW_UP_ANSWERS,
  maxGoalFollowUps: MAX_GOAL_FOLLOW_UPS,
  goalFollowUpsPerArea: 1,
};

function lastUserAnswer(history: Message[]): string | undefined {
  const last = history[history.length - 1];
  return last?.role === "user" ? last.content : undefined;
}

/**
 * Picks the next area to ask about:
 * 1. follow up on the area just answered while it is still unresolved (up to a few answers);
 * 2. follow up once on an area just resolved when the answer touches the person's goal
 *    (bounded per interview);
 * 3. then areas the chosen starting points ask for;
 * 4. then areas most related to the goal and the latest answers;
 * 5. then the usual priority order (the order `gaps` arrive in).
 * Returns null when there are no open areas.
 */
export function chooseNextArea(graph: Domain[], gaps: Gap[], context: NextAreaContext): NextArea | null {
  if (gaps.length === 0) return null;
  const answer = lastUserAnswer(context.history);
  const answered = context.answeredDomainId ? graph.find((domain) => domain.id === context.answeredDomainId) : undefined;
  const limits = context.limits ?? STANDARD_LIMITS;

  // A clarification stays on the area while it is below the depth's answer cap; at the cap it moves
  // on like any other capped area (Codex review of df9cd12: repeated clarifications could loop).
  if (context.clarifying && answered) {
    const openGap = gaps.find((gap) => gap.domain.id === answered.id);
    if (openGap && openGap.currentAnswers < limits.maxUnresolvedAnswers) return { domain: answered, reason: "unresolved-follow-up" };
  }

  if (answer !== undefined && answered) {
    const openGap = gaps.find((gap) => gap.domain.id === answered.id);
    if (openGap && openGap.currentAnswers > 0 && openGap.currentAnswers < limits.maxUnresolvedAnswers) {
      return { domain: answered, reason: "unresolved-follow-up" };
    }
    const answers = context.domains[answered.id]?.answers ?? [];
    const followUpsSoFar = Object.values(context.domains).filter((domain) => (domain?.answers?.length ?? 0) > 1).length;
    const goalWords = tokens(`${context.goal.startingPoints.join(" ")} ${context.goal.customGoal}`);
    if (!openGap && answers.length >= 1 && answers.length <= limits.goalFollowUpsPerArea && followUpsSoFar < limits.maxGoalFollowUps && overlap(tokens(answer), goalWords) > 0) {
      return { domain: answered, reason: "goal-follow-up" };
    }
  }

  // After the first answer, ask once for the public links behind the goal (websites,
  // repositories, profiles). They make the Context checkable by any AI that reads it.
  const sourcesGap = gaps.find((gap) => gap.domain.id === "sources" && gap.currentAnswers === 0);
  if (sourcesGap && context.history.some((message) => message.role === "user")) {
    return { domain: sourcesGap.domain, reason: "sources" };
  }

  // An area that already holds its depth's share of answers is not asked again, even if those
  // answers were rated below the confidence bar (E2E 2026-10-16: Decision frameworks was asked 15
  // times because, as a starting-point area, it ranked first every turn).
  const askable = gaps.filter((gap) => gap.currentAnswers < limits.maxUnresolvedAnswers);
  if (askable.length === 0) return null;
  const recent = recentUserAnswers(context.history);
  const ranked = askable
    .map((gap, index) => ({
      gap,
      index,
      focus: context.goal.focusDomainIds.includes(gap.domain.id) ? 1 : 0,
      relevance: domainRelevance(gap.domain, context.goal, recent),
    }))
    .sort((a, b) => b.focus - a.focus || b.relevance - a.relevance || a.index - b.index);
  const top = ranked[0];
  return {
    domain: top.gap.domain,
    reason: top.focus ? "starting-point" : top.relevance > 0 ? "relevance" : "priority",
  };
}

/**
 * Areas still open after reaching the depth's answer cap are set aside (`skipped`), the same way an
 * area with no new question to ask is, so the interview can finish instead of re-asking them.
 * Returns the same state object when nothing changes.
 */
export function setAsideCappedAreas(
  graph: Domain[],
  state: InterviewState,
  options: { confidenceThreshold?: number; limits?: FollowUpLimits },
): InterviewState {
  const max = (options.limits ?? STANDARD_LIMITS).maxUnresolvedAnswers;
  const capped = detectGaps(graph, state, options.confidenceThreshold).filter((gap) => gap.currentAnswers >= max);
  if (capped.length === 0) return state;
  const domains = { ...state.domains };
  for (const gap of capped) domains[gap.domain.id] = { ...domains[gap.domain.id], skipped: true };
  return { ...state, domains };
}

/** The app's next-question step: gap detection plus `chooseNextArea`, shared with tests. */
export function pickNextArea(
  graph: Domain[],
  state: InterviewState,
  options: { answeredDomainId?: string | null; confidenceThreshold?: number; clarifying?: boolean; limits?: FollowUpLimits },
): NextArea | null {
  const gaps = detectGaps(graph, state, options.confidenceThreshold);
  return chooseNextArea(graph, gaps, {
    goal: describeInterviewGoal(state.topic),
    history: state.history,
    answeredDomainId: options.answeredDomainId,
    domains: state.domains,
    clarifying: options.clarifying,
    limits: options.limits,
  });
}

/** Prompt section that makes the goal the purpose of every question. Empty when no goal was given. */
export function goalPromptSection(goalSummary: string | undefined): string {
  const summary = (goalSummary ?? "").trim().slice(0, MAX_GOAL_CHARS + 200);
  if (!summary) return "";
  return `
## Why this person is building their Context
${summary}
- Treat this goal as the purpose of the whole interview. Ask about the current area in a way whose answer helps with this goal, and make the connection plain in your wording.
- The point of the interview is to make this goal far clearer to any AI model that later reads this Context, and to get on record what someone else (a person or an agent) would need to pick the goal up if it were handed off. Draw out what an AI could not safely guess: what done looks like and how success is judged, priorities and tradeoffs, constraints, where things stand, decisions made and why, who is involved, the person's terms, open questions, and next steps. Ask for concrete, recordable facts, not general reflection.
- Prefer the details the goal or earlier answers make relevant. Do not ask about family, health, home life, or daily routines unless the goal or an earlier answer brought them up.
- If the latest answer opened a thread that matters for the goal and fits this area, follow that thread before asking something new.
- If this is the first question, open by naming their goal in a few plain words, then ask about it.
- Ask exactly one question: no compound or multi-part questions, and never repeat or rephrase a question already asked in this conversation.
- Stay on the current area; bring in earlier answers only when they bear on it.`;
}

/** Extra instruction when the next question is a deliberate follow-up on the latest answer. */
export function followUpPromptSection(reason: NextAreaReason | undefined): string {
  if (reason === "goal-follow-up") {
    return "\n## This is a follow-up\nThe person just answered this area and touched on their goal. Ask one question that goes deeper on what they just said and how it bears on the goal. Do not move to a new topic.";
  }
  if (reason === "unresolved-follow-up") {
    return "\n## This is a follow-up\nThe latest answer left this area unresolved. Ask one more specific question about the same thread, building on what they said.";
  }
  return "";
}
