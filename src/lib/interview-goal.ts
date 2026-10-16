// ── Interview goal: what the person chose or typed on /app drives the interview ──
//
// The start screen stores the selected starting points (their internal labels)
// and any typed goal together in `state.topic`, joined with ", ". This module
// turns that back into a goal the question generator can use, and picks the
// next area to ask about from the goal and what the person has already said.

import type { Domain, Message } from "~/routes/-knowledgeGraph";

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

export interface NextGapContext {
  goal: InterviewGoal;
  history: Message[];
  /** The area the last question was about, if any. */
  currentDomain?: string | null;
}

/** Follow-ups on one area stop after this many answers, so a thin area cannot trap the interview. */
const MAX_FOLLOW_UP_ANSWERS = 3;

/**
 * Picks the next area to ask about:
 * 1. stay on the current area after an answer that left it unresolved (a follow-up on the same
 *    thread), up to a few answers;
 * 2. then areas the chosen starting points ask for;
 * 3. then areas most related to the goal and the latest answers;
 * 4. then the usual priority order (the order `gaps` arrive in).
 */
export function chooseNextGap<G extends { domain: Domain; coverage: string; currentAnswers: number }>(gaps: G[], context: NextGapContext): G {
  const lastMessage = context.history[context.history.length - 1];
  const current = gaps.find((gap) => gap.domain.id === context.currentDomain);
  if (
    current &&
    current.currentAnswers > 0 &&
    current.currentAnswers < MAX_FOLLOW_UP_ANSWERS &&
    lastMessage?.role === "user"
  ) {
    return current;
  }

  const recent = recentUserAnswers(context.history);
  const ranked = gaps
    .map((gap, index) => ({
      gap,
      index,
      focus: context.goal.focusDomainIds.includes(gap.domain.id) ? 1 : 0,
      relevance: domainRelevance(gap.domain, context.goal, recent),
    }))
    .sort((a, b) => b.focus - a.focus || b.relevance - a.relevance || a.index - b.index);
  return ranked[0].gap;
}

/** Prompt section that makes the goal the purpose of every question. Empty when no goal was given. */
export function goalPromptSection(goalSummary: string | undefined): string {
  const summary = (goalSummary ?? "").trim().slice(0, MAX_GOAL_CHARS + 200);
  if (!summary) return "";
  return `
## Why this person is building their Context
${summary}
- Treat this goal as the purpose of the whole interview. Ask about the current area in a way whose answer helps with this goal, and make the connection plain in your wording.
- Prefer the details the goal or earlier answers make relevant. Do not ask about family, health, home life, or daily routines unless the goal or an earlier answer brought them up.
- If the latest answer opened a thread that matters for the goal and fits this area, follow that thread before asking something new.`;
}
