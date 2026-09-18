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

/** Extract a short, specific phrase from the answer so the suggestion names the
 *  user's actual situation instead of repeating a generic per-domain template. */
function focusPhrase(answer: string): string {
  const normalized = normalize(answer);
  const first = normalized.split(/[.!?]\s+/)[0] ?? normalized;
  const stripped = first
    .replace(/^(?:i|we)(?:\s+(?:am|are|'m|'re))?\s+(?:want to|trying to|working on|building|focused on|aiming to|planning to|hoping to|need to)\s+/i, "")
    .replace(/^(?:i|we)(?:\s+(?:am|are|'m|'re))?\s+/i, "")
    .replace(/[,\s]+$/, "");
  return stripped.split(/\s+/).filter(Boolean).slice(0, 7).join(" ");
}

/** Value-framed: what the AI gains from having this context, not what it could
 *  "turn this into". References the answer so each candidate is specific rather
 *  than a repeated per-domain slogan. */
function suggestedUseFor(domainId: string, answer: string): string {
  const focus = focusPhrase(answer);
  const f = focus.length >= 3 ? `“${focus}”` : "this";
  if (domainId === "goals") {
    return `AI that knows you're driving toward ${f} can aim every suggestion at that outcome instead of generic advice.`;
  }
  if (domainId === "currentProjects") {
    return `AI that knows ${f} is already in flight can give next steps tied to this work instead of starting from scratch.`;
  }
  if (domainId === "dailyLife" || domainId === "processes") {
    return `AI that knows ${f} is how you actually work can carry the repeatable parts and leave the judgment to you.`;
  }
  if (domainId === "knowledgeGaps") {
    return `AI that knows ${f} is an open question can start from your uncertainty instead of pretending it's already decided.`;
  }
  if (domainId === "customers" || domainId === "productsAndServices") {
    return `AI that knows ${f} about your offering can speak to it specifically instead of in marketing generalities.`;
  }
  if (domainId === "updates") {
    return `AI that knows ${f} just changed can fold that change into its next suggestion instead of giving stale advice.`;
  }
  return `AI that already knows ${f} can start from your situation instead of asking you to repeat it.`;
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
        suggestedUse: suggestedUseFor(domainId, answer),
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
