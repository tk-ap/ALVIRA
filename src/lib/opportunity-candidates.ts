export type OpportunityDomainState = {
  answers?: string[];
  confidence?: number;
  covered?: boolean;
};

export type OpportunityState = {
  topic?: string;
  domains?: Record<string, OpportunityDomainState>;
};

export type OpportunityCandidate = {
  id: string;
  domainId: string;
  sourceAnswer: string;
  intent: string;
  suggestedUse: string;
  confidence: number;
};

const HIGH_SIGNAL_DOMAINS = new Set([
  "goals",
  "currentProjects",
  "dailyLife",
  "processes",
  "knowledgeGaps",
  "updates",
  "productsAndServices",
  "customers",
]);

// Outside known high-signal domains, require language that strongly implies work,
// friction, repetition, or desired change. Generic "want" / "need" wording is too
// broad and can incorrectly turn preferences or constraints into opportunities.
// Keep "create" explicit so words like "creative" do not become accidental signals.
const STRONG_SIGNAL_PATTERN = /\b(?:trying|struggl\w*|hard|difficult|repeat\w*|every\s+(?:day|week|month)|grow|improv\w*|organize|plan|decid\w*|launch|create|creating|created|creation|build|start|change|save\s+time|figure\s+out|compar\w*|track|manag\w*)\b/i;

const normalize = (value: string) => value.trim().replace(/\s+/g, " ");

function stableId(domainId: string, answer: string): string {
  const input = `${domainId}:${normalize(answer).toLowerCase()}`;
  let hash = 5381;
  for (let i = 0; i < input.length; i += 1) hash = ((hash << 5) + hash) ^ input.charCodeAt(i);
  return `opp-${(hash >>> 0).toString(36)}`;
}

function suggestedUseFor(domainId: string): string {
  if (domainId === "goals") {
    return "AI could help turn this goal into a practical plan, comparison, working brief, or next-step checklist.";
  }
  if (domainId === "currentProjects") {
    return "AI could help organize this active work, clarify next steps, prepare a brief, or compare options.";
  }
  if (domainId === "dailyLife" || domainId === "processes") {
    return "AI could help organize, simplify, or carry the repeatable parts of this while you keep the judgment calls.";
  }
  if (domainId === "knowledgeGaps") {
    return "AI could help research this, compare options, or turn the uncertainty into better questions before you decide.";
  }
  if (domainId === "customers" || domainId === "productsAndServices") {
    return "AI could help turn what you already know here into a clearer decision, plan, campaign, or working brief.";
  }
  if (domainId === "updates") {
    return "AI could help translate this change into a practical next step using the Context ALVIRA already has.";
  }
  return "AI could help turn this into a plan, comparison, draft, checklist, or other useful next step without requiring an agentic workflow.";
}

export function deriveOpportunityCandidates(state: OpportunityState | null | undefined): OpportunityCandidate[] {
  const domains = state?.domains ?? {};
  const candidates: OpportunityCandidate[] = [];

  for (const [domainId, domain] of Object.entries(domains)) {
    const confidence = Number(domain.confidence ?? 0);
    const answers = (domain.answers ?? []).map(normalize).filter((answer) => answer.length >= 12);
    if (!answers.length) continue;

    for (const answer of answers) {
      const domainSignal = HIGH_SIGNAL_DOMAINS.has(domainId);
      const wordingSignal = STRONG_SIGNAL_PATTERN.test(answer);
      const eligible = confidence >= 0.78 && (domainSignal || wordingSignal);
      if (!eligible) continue;

      candidates.push({
        id: stableId(domainId, answer),
        domainId,
        sourceAnswer: answer,
        intent: answer,
        suggestedUse: suggestedUseFor(domainId),
        confidence,
      });
    }
  }

  const seen = new Set<string>();
  return candidates
    .sort((a, b) => b.confidence - a.confidence)
    .filter((candidate) => {
      const key = candidate.sourceAnswer.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 6);
}

export function opportunityFeedbackKey(topic?: string): string {
  const safeTopic = normalize(topic ?? "context").toLowerCase().slice(0, 120);
  return `alvira:opportunity-feedback:${safeTopic || "context"}`;
}
