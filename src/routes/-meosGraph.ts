import type { Domain, InterviewState } from "./-knowledgeGraph";

export type MeosPlaybook = {
  tier: "meos";
  phases: string[];
  knowledgePriorities: string[];
  completion: { minimumConfidence: number; unresolvedGaps: number };
  outputs: string[];
};

const definitions: Array<[string, string, string, boolean, number]> = [
  ["currentChapter", "Current Chapter", "What season of life are you in, what is ending, and what is beginning?", true, 1],
  ["desiredOutcomes", "Desired Outcomes", "What should ALVIRA Reflect help with: clarity, direction, alignment, decisions, or transitions?", true, 2],
  ["values", "Values", "Core values, what you stand for, and what you will not compromise.", true, 3],
  ["boundaries", "Boundaries", "Explicit statements about what is aligned with you and what is not aligned.", true, 4],
  ["goals", "Goals", "Short- and long-term goals and how you define and measure progress.", true, 5],
  ["decisionPatterns", "Decision Patterns", "How you make decisions, what you weigh, and patterns from past decisions.", true, 6],
  ["workHistory", "Work History", "Career evidence, professional references, and key experiences.", true, 7],
  ["definitionOfSuccess", "Definition of Success", "Your personalized definition of success, rather than society's.", true, 8],
  ["frameworks", "Frameworks", "Optional symbolic frameworks you want applied, such as astrology, Human Design, Enneagram, or numerology.", false, 9],
  ["birthData", "Birth Data", "Birth date, time, and location, collected only when selected frameworks require it.", false, 10],
  ["review", "Review", "Review extracted values and inferences as the owner.", false, 11],
  ["validation", "Validation", "Self-validation: agree, question, reject, or revise claims.", false, 12],
];

function toDomain([id, label, description, required, priority]: Array<string | boolean | number>): Domain {
  return { id: id as string, label: label as string, description: description as string, promptHint: description as string, required: required as boolean, minAnswers: 1, priority: priority as number, outputFile: "overview" };
}
export function getMeosGraph(): Domain[] { return definitions.map(toDomain); }

/** The free entry point: only the three most relatable MeOS domains. */
export function getMeosPreviewGraph(): Domain[] {
  return definitions.filter(([id]) => ["values", "decisionPatterns", "goals"].includes(id)).map(toDomain);
}

export function getMeosPlaybook(): MeosPlaybook {
  return { tier: "meos", phases: definitions.map(([id]) => id), knowledgePriorities: ["values", "boundaries", "definitionOfSuccess"], completion: { minimumConfidence: 0.85, unresolvedGaps: 0 }, outputs: ["markdown", "integratedPortrait", "meosSite"] };
}
export type MeosInterviewState = Omit<InterviewState, "tier"> & { tier: "meos" };
