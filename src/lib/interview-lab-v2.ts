import type { Message } from "~/routes/-knowledgeGraph";

export const BASELINE_QUESTIONS = [
  {
    id: "identity",
    label: "Identity & background",
    prompt:
      "What should an AI understand about who you are and the context you come from?",
  },
  {
    id: "goals",
    label: "Goals & priorities",
    prompt:
      "What are you trying to accomplish, and what matters most right now?",
  },
  {
    id: "projects",
    label: "Active projects",
    prompt:
      "What are you working on, and what responsibilities or deadlines are active?",
  },
  {
    id: "constraints",
    label: "Constraints & boundaries",
    prompt:
      "What limits, non-negotiables, risks, or boundaries should shape advice?",
  },
  {
    id: "preferences",
    label: "Preferences & communication",
    prompt:
      "How do you prefer to work, decide, receive information, or collaborate?",
  },
  {
    id: "workflows",
    label: "Recurring workflows",
    prompt:
      "What do you repeatedly ask AI or explain when working through a normal task?",
  },
] as const;

export type BaselineQuestionId = (typeof BASELINE_QUESTIONS)[number]["id"];

export const BASELINE_CLASSIFICATIONS = [
  "known_consistently",
  "known_unevenly",
  "conflicting",
  "missing",
  "potentially_stale",
  "needs_verification",
] as const;

export type BaselineClassification = (typeof BASELINE_CLASSIFICATIONS)[number];

export interface BaselineTool {
  id: string;
  name: string;
  responses: Record<BaselineQuestionId, string>;
}

export interface BaselineFinding {
  questionId: BaselineQuestionId;
  label: string;
  classification: BaselineClassification;
  filledTools: number;
  totalTools: number;
  rationale: string;
}

export interface InterviewLabBaselineFocus {
  label: string;
  classification: BaselineClassification;
  rationale: string;
}

export function emptyBaselineResponses(): Record<BaselineQuestionId, string> {
  return Object.fromEntries(
    BASELINE_QUESTIONS.map(({ id }) => [id, ""]),
  ) as Record<BaselineQuestionId, string>;
}

function normalized(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9 ]/g, "")
    .trim();
}

function looksPotentiallyStale(texts: string[]): boolean {
  return texts.some((text) =>
    /\b(last year|years ago|used to|previously|no longer|outdated|stale|before the change|at the time)\b/i.test(
      text,
    ),
  );
}

function looksConflicting(texts: string[]): boolean {
  return texts.some((text) =>
    /\b(conflict|contradict|disagree|actually the opposite|not true|wrong about|mixed answers)\b/i.test(
      text,
    ),
  );
}

export function classifyBaselineArea(
  tools: BaselineTool[],
  questionId: BaselineQuestionId,
  override?: BaselineClassification,
): BaselineFinding {
  const question = BASELINE_QUESTIONS.find(
    (candidate) => candidate.id === questionId,
  );
  if (!question) throw new Error("Baseline question not found.");

  const texts = tools
    .map((tool) => tool.responses[questionId]?.trim() ?? "")
    .filter(Boolean);
  const totalTools = tools.length;
  const filledTools = texts.length;
  let classification: BaselineClassification;
  let rationale: string;

  if (override) {
    classification = override;
    rationale =
      "User-set classification; the Lab will use this when prioritizing the interview.";
  } else if (filledTools === 0) {
    classification = "missing";
    rationale = "None of the tested tools supplied a usable answer.";
  } else if (looksPotentiallyStale(texts)) {
    classification = "potentially_stale";
    rationale =
      "At least one output contains a time-sensitive or explicitly older claim.";
  } else if (looksConflicting(texts)) {
    classification = "conflicting";
    rationale = "The supplied evidence signals disagreement or contradiction.";
  } else if (filledTools < totalTools) {
    classification = "known_unevenly";
    rationale = `${filledTools} of ${totalTools} tested tools supplied an answer.`;
  } else if (new Set(texts.map(normalized)).size === 1) {
    classification = "known_consistently";
    rationale =
      "All supplied outputs are textually aligned; user review is still available.";
  } else {
    classification = "needs_verification";
    rationale =
      "The tools supplied different answers without enough evidence to call the difference a conflict.";
  }

  return {
    questionId,
    label: question.label,
    classification,
    filledTools,
    totalTools,
    rationale,
  };
}

export function buildBaselineFindings(
  tools: BaselineTool[],
  overrides: Partial<Record<BaselineQuestionId, BaselineClassification>> = {},
): BaselineFinding[] {
  return BASELINE_QUESTIONS.map(({ id }) =>
    classifyBaselineArea(tools, id, overrides[id]),
  );
}

export function baselineClassificationLabel(
  classification: BaselineClassification,
): string {
  return classification.replaceAll("_", " ");
}

export function buildInterviewBaselineFocus(
  findings: BaselineFinding[],
): InterviewLabBaselineFocus[] {
  return findings
    .filter((finding) => finding.classification !== "known_consistently")
    .sort((left, right) => {
      const weight: Record<BaselineClassification, number> = {
        missing: 6,
        conflicting: 5,
        potentially_stale: 4,
        needs_verification: 3,
        known_unevenly: 2,
        known_consistently: 1,
      };
      return weight[right.classification] - weight[left.classification];
    })
    .map(({ label, classification, rationale }) => ({
      label,
      classification,
      rationale,
    }));
}

export function buildContextClaims(history: Message[]): string[] {
  return history
    .filter((message) => message.role === "user")
    .map((message) => message.content.trim())
    .filter((content) => content.length >= 12)
    .slice(-12);
}

export function contextHash(claims: string[]): string {
  let hash = 2166136261;
  for (const character of claims.join("\u241e")) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}
