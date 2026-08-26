import type { InterviewState } from "~/routes/-knowledgeGraph";

export type ProfileOffering = "context" | "meos";

export type CarryOverClaim = {
  domainId: string;
  text: string;
  confidence: number;
  evidence: string;
};

type DomainMapping = {
  source: string;
  target: string;
  sourceLabel: string;
  exact?: boolean;
};

const CONTEXT_TO_REFLECT: DomainMapping[] = [
  { source: "goals", target: "goals", sourceLabel: "Goals", exact: true },
  { source: "constraints", target: "boundaries", sourceLabel: "Constraints and boundaries" },
  { source: "decisionFrameworks", target: "decisionPatterns", sourceLabel: "Decision frameworks" },
  { source: "identity", target: "values", sourceLabel: "Identity and values" },
];

const REFLECT_TO_CONTEXT: DomainMapping[] = [
  { source: "goals", target: "goals", sourceLabel: "Goals", exact: true },
  { source: "boundaries", target: "constraints", sourceLabel: "Boundaries" },
  { source: "decisionPatterns", target: "decisionFrameworks", sourceLabel: "Decision patterns" },
  { source: "values", target: "identity", sourceLabel: "Values" },
  { source: "workHistory", target: "identity", sourceLabel: "Work history" },
];

export function oppositeOffering(offering: ProfileOffering): ProfileOffering {
  return offering === "meos" ? "context" : "meos";
}

export function handoffTopic(topic: string, target: ProfileOffering): string {
  const suffix = target === "meos" ? "ALVIRA Reflect" : "AI Context Profile";
  return `${topic.replace(/\s+[—-]\s+(ALVIRA Reflect|AI Context Profile)$/i, "").trim()} — ${suffix}`;
}

export function buildCarryOverClaims(
  state: InterviewState,
  source: ProfileOffering,
  target: ProfileOffering,
): CarryOverClaim[] {
  if (source === target) return [];
  const mappings = source === "context" ? CONTEXT_TO_REFLECT : REFLECT_TO_CONTEXT;

  return mappings.flatMap((mapping) => {
    const answers = state.domains?.[mapping.source]?.answers ?? [];
    return answers
      .map((answer) => answer.trim())
      .filter(Boolean)
      .map((text) => ({
        domainId: mapping.target,
        text,
        confidence: mapping.exact ? 1 : 0.75,
        evidence: `Carried from ${mapping.sourceLabel} in your ${source === "meos" ? "ALVIRA Reflect" : "AI Context Profile"}.`,
      }));
  });
}
