// ── Question shape: one atomic, non-repeating question per turn ──
//
// The generator is asked for a brief reflection followed by ONE question, but a
// prompt alone does not guarantee it (E2E 2026-10-15: most questions bundled a
// second ask; two were near-duplicates). This module checks a generated
// candidate, asks for one rewrite with specific feedback, and falls back to a
// safe atomic question when the rewrite still fails.

import type { Message } from "~/routes/-knowledgeGraph";

export type ShapeProblem = "empty" | "no-question" | "compound" | "duplicate";

export interface ShapeCheck {
  ok: boolean;
  problems: ShapeProblem[];
  /** The reflection before the question (may be empty). */
  lead: string;
  /** The question part: from the start of the first questioning sentence to the end. */
  question: string;
  /** The earlier ALVIRA question this one nearly repeats, when `duplicate`. */
  duplicateOf?: string;
}

const WH = "how|what|why|when|where|who|whom|which|whether";
const AUX = "do|does|did|is|are|was|were|can|could|would|should|will|have|has";
/**
 * A second ask joined onto the first: "…, and how …", "… and do they …", "… or what …".
 * "or" + an auxiliary is a single choice ("Is it fixed, or is it flexible?"), not a second ask.
 */
const JOINED_ASK = new RegExp(`(?:[,;:]\\s*|\\s+)(?:(?:and|also|plus|as well as)\\s+(?:${WH}|${AUX})|or\\s+(?:${WH}))\\b`, "i");
/** Where a question starts listing parts: "Describe X, including A, B and C?" */
const ENUMERATION = /,?\s*\b(?:including|such as|for example|e\.g\.|as well as|like)\b/i;
/** A list item that is its own ask: a WH word, or a clause with its own subject ("formats they use"). */
const CLAUSE_ITEM = new RegExp(`^(?:and\\s+|or\\s+)?(?:${WH})\\b|\\b(?:they|he|she|you|we|tk|their team)\\s+(?!and\\b|or\\b)[a-z]+`, "i");
const STOPWORDS = new Set([
  "the", "and", "for", "are", "with", "that", "this", "they", "their", "them", "there", "what", "how", "why", "when",
  "where", "who", "which", "does", "did", "have", "has", "can", "could", "would", "should", "will", "about", "any",
  "into", "from", "your", "you", "its", "was", "were", "been", "being", "some", "such", "than", "then", "these",
  "those", "specific", "particular", "typically", "currently",
  // Low-content verbs a rewording swaps freely ("criteria they use" / "criteria they consider").
  "use", "uses", "used", "using", "make", "makes", "made", "making", "consider", "considers", "considered",
  "considering", "take", "takes", "taken", "taking", "get", "gets", "getting", "tend", "tends",
]);

/** Splits a generated response into the reflection and the question part. */
export function splitResponse(text: string): { lead: string; question: string } {
  const trimmed = text.trim();
  const firstMark = trimmed.indexOf("?");
  if (firstMark < 0) return { lead: trimmed, question: "" };
  // The questioning sentence starts after the last sentence end before the first "?".
  const before = trimmed.slice(0, firstMark);
  const boundary = Math.max(before.lastIndexOf(". "), before.lastIndexOf("! "), before.lastIndexOf("\n"));
  const start = boundary < 0 ? 0 : boundary + (trimmed.charAt(boundary) === "\n" ? 1 : 2);
  return { lead: trimmed.slice(0, start).trim(), question: trimmed.slice(start).trim() };
}

/**
 * Asks packed into a list after "including", "such as", …: "Describe their style, including how
 * formal they are, any formats they use, and terminology they employ?" (E2E deep dive Q29). A list of
 * plain examples ("such as websites, profiles, or docs") is one ask and passes.
 */
export function enumeratedAsks(sentence: string): number {
  const match = ENUMERATION.exec(sentence);
  if (!match || match.index === undefined) return 0;
  const tail = sentence.slice(match.index + match[0].length).replace(/\?\s*$/, "");
  return tail
    .split(/,\s*|;\s*|\s+and\s+(?=(?:any|specific|the|their|what|how|which|who|when|where|why)\b)/i)
    .map((item) => item.trim())
    .filter((item) => item && CLAUSE_ITEM.test(item)).length;
}

export function isCompound(question: string): boolean {
  const marks = (question.match(/\?/g) ?? []).length;
  if (marks > 1) return true;
  const firstSentence = question.slice(0, question.indexOf("?") + 1 || undefined);
  return JOINED_ASK.test(firstSentence) || enumeratedAsks(firstSentence) >= 2;
}

/** Crude stem so verb and plural forms match: deciding/decide/decides → decid, changes/change → chang. */
function stem(word: string): string {
  return word.replace(/(?:ing|ied|ies|ed|es|s|e)$/, "").replace(/(.)\1$/, "$1");
}

function tokens(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[’']/g, "")
      .split(/[^a-z0-9]+/)
      .filter((word) => word.length >= 3 && !STOPWORDS.has(word))
      .map(stem),
  );
}

/**
 * Content-word overlap measured against both asks (Dice: 2 × shared / (a + b)), so a short ask
 * cannot "match" a longer, different one on a few common words. 1 = the same content words.
 */
export function questionSimilarity(a: string, b: string): number {
  const ta = tokens(a);
  const tb = tokens(b);
  if (ta.size === 0 || tb.size === 0) return 0;
  let shared = 0;
  for (const word of ta) if (tb.has(word)) shared += 1;
  return (2 * shared) / (ta.size + tb.size);
}

/** Asks this similar to an earlier ask count as a near-duplicate. */
export const DUPLICATE_THRESHOLD = 0.7;

/** A lead-in clause that frames the ask with earlier context: "Given …, ", "Considering …, ", "With …, ". */
const LEAD_IN = /^(?:given|considering|with|based on|since|because|now that|building on|in light of|thinking about)\b[^,?]*,\s*/i;

/** Each individual ask in a question part ("…? …?" → two), with any lead-in clause removed. */
export function askCores(question: string): string[] {
  return (question.match(/[^?]+\?/g) ?? [])
    .map((ask) => ask.trim().replace(LEAD_IN, ""))
    .filter((core) => tokens(core).size > 0);
}

export function previousQuestions(history: Message[]): string[] {
  return history
    .filter((message) => message.role === "assistant")
    .map((message) => splitResponse(message.content).question)
    .filter(Boolean);
}

/** The earlier question whose asks this one nearly repeats, compared ask by ask without lead-ins. */
export function findDuplicate(question: string, history: Message[]): string | undefined {
  const cores = askCores(question);
  return previousQuestions(history).find((earlier) => {
    const earlierCores = askCores(earlier);
    return cores.some((core) => earlierCores.some((prior) => questionSimilarity(core, prior) >= DUPLICATE_THRESHOLD));
  });
}

export function checkQuestionShape(text: string, history: Message[]): ShapeCheck {
  const { lead, question } = splitResponse(text ?? "");
  const problems: ShapeProblem[] = [];
  if (!text || !text.trim()) return { ok: false, problems: ["empty"], lead: "", question: "" };
  if (!question) problems.push("no-question");
  if (question && isCompound(question)) problems.push("compound");
  let duplicateOf: string | undefined;
  if (question) {
    duplicateOf = findDuplicate(question, history);
    if (duplicateOf) problems.push("duplicate");
  }
  return { ok: problems.length === 0, problems, lead, question, ...(duplicateOf ? { duplicateOf } : {}) };
}

/** Feedback for the one rewrite, naming exactly what was wrong. */
export function rewriteFeedback(check: ShapeCheck): string {
  const reasons: string[] = [];
  if (check.problems.includes("compound")) reasons.push("it asked more than one thing in a single turn");
  if (check.problems.includes("duplicate")) reasons.push(`it repeats an earlier question ("${check.duplicateOf?.slice(0, 160)}")`);
  if (check.problems.includes("no-question") || check.problems.includes("empty")) reasons.push("it did not end with a question");
  return `Your previous draft was rejected because ${reasons.join(" and ")}. Rewrite it: keep any brief reflection, then ask exactly one question that asks for one fact, choice, or tradeoff, with a single question mark, and that has not already been asked in this conversation. Respond with the same JSON shape.`;
}

/** Keeps the reflection and only the first ask: up to the first "?", cut before any joined second ask. */
export function firstQuestionOnly(text: string): string {
  const { lead, question } = splitResponse(text);
  if (!question) return text.trim();
  let first = question.slice(0, question.indexOf("?") + 1);
  const joined = first.match(JOINED_ASK);
  if (joined && joined.index !== undefined) first = `${first.slice(0, joined.index).replace(/[,;:\s]+$/, "")}?`;
  // An "including A, B and C" list of separate asks: keep the ask before the list.
  if (enumeratedAsks(first) >= 2) {
    const list = ENUMERATION.exec(first);
    if (list && list.index !== undefined && list.index > 0) first = `${first.slice(0, list.index).replace(/[,;:\s]+$/, "")}?`;
  }
  return lead ? `${lead} ${first}` : first;
}

/** Safe atomic questions for the area, tried in order, when generation cannot produce one. */
export function fallbackQuestions(areaLabel: string, hasGoal: boolean): string[] {
  const area = areaLabel.toLowerCase();
  const purpose = hasGoal ? " for this goal" : "";
  return [
    `What is the one thing an AI most needs to know about ${area}${purpose}?`,
    `What would an AI be most likely to get wrong about ${area}${purpose}?`,
    `What is still undecided about ${area}${purpose}?`,
  ];
}

/** The first safe fallback that is not a repeat of an earlier question, or null when all were used. */
export function fallbackQuestion(areaLabel: string, hasGoal: boolean, history: Message[] = []): string | null {
  return fallbackQuestions(areaLabel, hasGoal).find((candidate) => checkQuestionShape(candidate, history).ok) ?? null;
}

/**
 * "exhausted": no new atomic question could be produced for this area (every candidate and fallback
 * repeats an earlier question). The caller must not ask anything for the area — it moves on instead.
 */
export type ShapeFallback = "trimmed" | "generic" | "exhausted";

export interface AtomicQuestionResult {
  /** null only when `fallback` is "exhausted". */
  question: string | null;
  attempts: number;
  fallback?: ShapeFallback;
  /** Problems found in each rejected candidate, in order. */
  rejected: ShapeProblem[][];
}

/**
 * Generate → check → (one rewrite with feedback) → check → safe fallback.
 * `generate` is called with no feedback first, then once with the rewrite feedback.
 */
export async function generateAtomicQuestion(options: {
  generate: (feedback?: string) => Promise<string>;
  history: Message[];
  areaLabel: string;
  hasGoal: boolean;
}): Promise<AtomicQuestionResult> {
  const rejected: ShapeProblem[][] = [];
  const first = await options.generate();
  const firstCheck = checkQuestionShape(first, options.history);
  if (firstCheck.ok) return { question: first.trim(), attempts: 1, rejected };
  rejected.push(firstCheck.problems);

  const second = await options.generate(rewriteFeedback(firstCheck));
  const secondCheck = checkQuestionShape(second, options.history);
  if (secondCheck.ok) return { question: second.trim(), attempts: 2, rejected };
  rejected.push(secondCheck.problems);

  // Still compound but new: keep its first ask. Anything else: a safe generic question.
  const base = secondCheck.question ? second : firstCheck.question ? first : "";
  if (base) {
    const trimmed = firstQuestionOnly(base);
    if (checkQuestionShape(trimmed, options.history).ok) return { question: trimmed, attempts: 2, fallback: "trimmed", rejected };
  }
  const generic = fallbackQuestion(options.areaLabel, options.hasGoal, options.history);
  if (generic) return { question: generic, attempts: 2, fallback: "generic", rejected };
  return { question: null, attempts: 2, fallback: "exhausted", rejected };
}
