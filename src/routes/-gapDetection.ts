// ── Gap Detection: compares interview state against knowledge graph ──

import type { Domain, InterviewState } from "./-knowledgeGraph";

export interface Gap {
  domain: Domain;
  coverage: "uncovered" | "shallow" | "lowConfidence";
  currentAnswers: number;
}

const DEFAULT_CONFIDENCE_THRESHOLD = 0.6;

/**
 * Pure function: compare the current interview state against the knowledge graph.
 * Returns gaps sorted by priority:
 *   1. Required domains with zero coverage
 *   2. Partially covered domains (fewer than minAnswers)
 *   3. Domains with low confidence answers
 * Fully covered domains are excluded from results.
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

    // Fully covered: meets minAnswers AND confidence >= threshold
    if (answerCount >= domain.minAnswers && confidence >= confidenceThreshold) {
      continue;
    }

    let coverage: Gap["coverage"];
    if (answerCount === 0) {
      coverage = "uncovered";
    } else if (answerCount < domain.minAnswers) {
      coverage = "shallow";
    } else {
      coverage = "lowConfidence";
    }

    gaps.push({ domain, coverage, currentAnswers: answerCount });
  }

  // Sort by priority: coverage severity first, then domain priority (lower = ask first), then required status
  gaps.sort((a, b) => {
    const priorityScore = (gap: Gap): number => {
      const coverageScore = gap.coverage === "uncovered" ? 0 : gap.coverage === "shallow" ? 1 : 2;
      const reqScore = gap.domain.required ? 0 : 1;
      const domainPriority = gap.domain.priority ?? 50;
      return coverageScore * 1000 + reqScore * 100 + domainPriority;
    };
    return priorityScore(a) - priorityScore(b);
  });

  return gaps;
}

/**
 * Count how many domains are fully covered.
 */
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

/**
 * Check if all required domains are covered.
 */
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
