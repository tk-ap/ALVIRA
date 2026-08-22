// ── Gap Detection: compares interview state against knowledge graph ──

import type { Domain, InterviewState } from "./-knowledgeGraph";

export interface Gap {
  domain: Domain;
  coverage: "uncovered" | "shallow" | "lowConfidence";
  currentAnswers: number;
  /** Higher means resolving this gap is more valuable to the interview. */
  informationValue: number;
  /** Human-readable explanation used by the interviewer and debugging UI. */
  reason: string;
}

const DEFAULT_CONFIDENCE_THRESHOLD = 0.6;

/**
 * Estimate the value of resolving a knowledge gap.
 *
 * This intentionally stays deterministic: the graph remains the guardrail,
 * while the question generator can use this signal to decide how deeply to
 * probe the highest-value missing context.
 */
function calculateInformationValue(
  domain: Domain,
  coverage: Gap["coverage"],
  confidence: number,
): number {
  const requiredBoost = domain.required ? 40 : 0;
  const priorityBoost = Math.max(0, 60 - (domain.priority ?? 50));
  const coverageBoost =
    coverage === "uncovered" ? 35 : coverage === "shallow" ? 20 : 10;
  const uncertaintyBoost = Math.round((1 - Math.max(0, Math.min(1, confidence))) * 25);

  return requiredBoost + priorityBoost + coverageBoost + uncertaintyBoost;
}

/**
 * Pure function: compare the current interview state against the knowledge graph.
 * Returns gaps ranked by information value rather than simply by completion order.
 *
 * This is the first step toward value-of-information elicitation: the graph
 * still determines what knowledge matters, but the interview can now prioritize
 * the missing context that is most important to resolve next.
 */
export function detectGaps(
  graph: Domain[],
  state: InterviewState,
  confidenceThreshold = DEFAULT_CONFIDENCE_THRESHOLD,
): Gap[] {
  const gaps: Gap[] = [];

  for (const domain of graph) {
    const domainState = state.domains[domain.id];
    const answerCount = domainState?.answers?.length ?? 0;
    const confidence = domainState?.confidence ?? 0;

    // Fully covered: meets minAnswers AND confidence >= threshold.
    if (answerCount >= domain.minAnswers && confidence >= confidenceThreshold) {
      continue;
    }

    let coverage: Gap["coverage"];
    let reason: string;

    if (answerCount === 0) {
      coverage = "uncovered";
      reason = domain.required
        ? "Required context has not been established yet."
        : "No context has been captured for this domain yet.";
    } else if (answerCount < domain.minAnswers) {
      coverage = "shallow";
      reason = `Only ${answerCount} answer${answerCount === 1 ? "" : "s"} captured; this domain needs more depth.`;
    } else {
      coverage = "lowConfidence";
      reason = `The current information has only ${(confidence * 100).toFixed(0)}% confidence.`;
    }

    gaps.push({
      domain,
      coverage,
      currentAnswers: answerCount,
      informationValue: calculateInformationValue(domain, coverage, confidence),
      reason,
    });
  }

  gaps.sort((a, b) => {
    if (b.informationValue !== a.informationValue) {
      return b.informationValue - a.informationValue;
    }

    // Stable tie-breakers keep the interview deterministic.
    const aPriority = a.domain.priority ?? 50;
    const bPriority = b.domain.priority ?? 50;
    if (aPriority !== bPriority) return aPriority - bPriority;
    return a.domain.id.localeCompare(b.domain.id);
  });

  return gaps;
}

/** Count how many domains are fully covered. */
export function countCovered(
  graph: Domain[],
  state: InterviewState,
  confidenceThreshold = DEFAULT_CONFIDENCE_THRESHOLD,
): number {
  let covered = 0;
  for (const domain of graph) {
    const domainState = state.domains[domain.id];
    const answerCount = domainState?.answers?.length ?? 0;
    const confidence = domainState?.confidence ?? 0;
    if (answerCount >= domain.minAnswers && confidence >= confidenceThreshold) {
      covered++;
    }
  }
  return covered;
}

/** Check if all required domains are covered. */
export function allRequiredCovered(
  graph: Domain[],
  state: InterviewState,
  confidenceThreshold = DEFAULT_CONFIDENCE_THRESHOLD,
): boolean {
  for (const domain of graph) {
    if (!domain.required) continue;
    const domainState = state.domains[domain.id];
    const answerCount = domainState?.answers?.length ?? 0;
    const confidence = domainState?.confidence ?? 0;
    if (answerCount < domain.minAnswers || confidence < confidenceThreshold) {
      return false;
    }
  }
  return true;
}
