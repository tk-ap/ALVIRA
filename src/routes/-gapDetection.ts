// ── Gap Detection: compares interview state against knowledge graph ──

import type { Domain, InterviewState } from "./-knowledgeGraph";

export interface Gap {
  domain: Domain;
  coverage: "uncovered" | "shallow" | "lowConfidence";
  currentAnswers: number;
  informationValue: number;
  reason: string;
}

const DEFAULT_CONFIDENCE_THRESHOLD = 0.6;

function calculateInformationValue(
  domain: Domain,
  coverage: Gap["coverage"],
  confidence: number,
): number {
  const requiredBoost = domain.required ? 40 : 0;
  const priorityBoost = Math.max(0, 60 - (domain.priority ?? 50));
  const coverageBoost = coverage === "uncovered" ? 35 : coverage === "shallow" ? 20 : 10;
  const uncertaintyBoost = Math.round((1 - Math.max(0, Math.min(1, confidence))) * 25);
  return requiredBoost + priorityBoost + coverageBoost + uncertaintyBoost;
}

/**
 * Rank unresolved knowledge by deterministic information value.
 * Explicitly skipped domains are deferred rather than immediately re-asked.
 */
export function detectGaps(
  graph: Domain[],
  state: InterviewState,
  confidenceThreshold = DEFAULT_CONFIDENCE_THRESHOLD,
): Gap[] {
  const gaps: Gap[] = [];

  for (const domain of graph) {
    const domainState = state.domains[domain.id];

    // A skip is a user-directed deferral, not evidence that the domain is known.
    // Required-domain completion still remains false for skipped domains.
    if (domainState?.skipped) continue;

    const answerCount = domainState?.answers?.length ?? 0;
    const confidence = domainState?.confidence ?? 0;

    if (answerCount >= domain.minAnswers && confidence >= confidenceThreshold) continue;

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
    if (b.informationValue !== a.informationValue) return b.informationValue - a.informationValue;
    const aPriority = a.domain.priority ?? 50;
    const bPriority = b.domain.priority ?? 50;
    if (aPriority !== bPriority) return aPriority - bPriority;
    return a.domain.id.localeCompare(b.domain.id);
  });

  return gaps;
}

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
    if (answerCount >= domain.minAnswers && confidence >= confidenceThreshold) covered++;
  }
  return covered;
}

/** Required domains are never considered complete merely because they were skipped. */
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
    if (domainState?.skipped || answerCount < domain.minAnswers || confidence < confidenceThreshold) {
      return false;
    }
  }
  return true;
}
