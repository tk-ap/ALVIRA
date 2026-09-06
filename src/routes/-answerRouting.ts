// ── Answer routing: the pure decision of what to do with an interview answer ──
// Extracted from handleSend so the loop's core behavior is unit-testable in
// isolation. No side effects; the caller executes the returned action.

import type { Domain, InterviewState } from "./-knowledgeGraph";
import { shouldConfirmLockedChange } from "./-knowledgeGraph";
import { validateAnswer, detectMoveOnRequest } from "./-validation";

export type NextAction =
  | { type: "soft-confirm"; domainId: string; text: string }
  | { type: "move-on"; domainId: string }
  | { type: "clarify"; domainId: string }
  | { type: "re-ask"; domainId: string; warning: string }
  | {
      type: "accept";
      domainId: string;
      answer: string;
      confidence: number;
      covered: boolean;
      deferred: boolean;
      insufficientKnowledge: boolean;
    };

export interface NextActionOptions {
  /** Skip the locked-change soft-confirm gate (used when the user just confirmed). */
  bypassConfirm?: boolean;
}

/**
 * Decide what to do with an answer to the current domain. Returns null when there
 * is nothing to route (empty answer or no current domain) — the caller guards those.
 */
export function nextAction(
  state: InterviewState,
  graph: Domain[],
  confThreshold: number,
  answer: string,
  options: NextActionOptions = {},
): NextAction | null {
  const trimmed = answer.trim();
  const domainId = state.currentDomain;
  if (!trimmed || !domainId) return null;

  const prior = state.domains[domainId]?.answers ?? [];

  // 1. A change to a locked domain is gated before it is filed.
  if (!options.bypassConfirm && shouldConfirmLockedChange(graph, domainId, prior.length)) {
    return { type: "soft-confirm", domainId, text: trimmed };
  }

  // 2. An explicit request to leave the topic.
  if (detectMoveOnRequest(trimmed)) {
    return { type: "move-on", domainId };
  }

  const validation = validateAnswer(domainId, trimmed, prior);

  // 3. The user asked a clarifying question (or strong topical mismatch).
  if (validation.isUserQuestion) {
    return { type: "clarify", domainId };
  }

  // 4. Genuinely unusable input (gibberish, contradiction) — re-ask, don't file.
  if (validation.isUnusable) {
    return { type: "re-ask", domainId, warning: validation.warnings[0] ?? "" };
  }

  // 5. Accept — weak-but-real is deferred, otherwise it's a meaningful answer.
  const minAnswers = graph.find((d) => d.id === domainId)?.minAnswers ?? 1;
  const covered = validation.confidence >= confThreshold && prior.length + 1 >= minAnswers;
  if (validation.needsClarification) {
    return {
      type: "accept",
      domainId,
      answer: trimmed,
      confidence: validation.confidence,
      covered: false,
      deferred: true,
      insufficientKnowledge: validation.insufficientKnowledge,
    };
  }
  return {
    type: "accept",
    domainId,
    answer: trimmed,
    confidence: validation.confidence,
    covered,
    deferred: false,
    insufficientKnowledge: false,
  };
}
