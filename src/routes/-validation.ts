// ── Validation: lightweight quality signals for knowledge elicitation ──

export interface ValidationResult {
  confidence: number; // 0–1, a routing signal rather than a truth score
  warnings: string[];
  needsClarification: boolean;
  insufficientKnowledge: boolean;
  isUserQuestion: boolean;
  /** True when a turn contains both a question and potentially useful answer content. */
  isMixedQuestionAndAnswer?: boolean;
}

const VAGUE_PHRASES = [
  "it depends",
  "maybe",
  "probably",
  "kind of",
  "sort of",
  "not exactly sure",
  "hard to say",
  "that's a good question",
];

// These are treated as explicit uncertainty signals, not as failures.
const INSUFFICIENT_KNOWLEDGE_PHRASES = [
  "i don't know",
  "i'm not sure",
  "not sure yet",
  "haven't decided",
  "need to think",
  "haven't figured",
  "haven't thought",
  "need to research",
  "not certain",
  "no idea",
  "can't say",
  "unsure",
  "to be determined",
  "tbd",
  "we'll see",
  "not yet determined",
  "still figuring",
  "haven't gotten",
  "don't have that",
  "need more time",
];

const DEFLECTION_WORDS = new Set([
  "ok", "okay", "sure", "yes", "no", "maybe", "idk", "alright",
  "fine", "whatever", "nah", "yep", "nope", "yeah",
]);

const NEGATION_WORDS = ["not", "never", "don't", "doesn't", "won't", "can't", "shouldn't", "no "];

const QUESTION_STARTS = [
  "what ", "how ", "why ", "when ", "where ", "who ",
  "can you ", "could you ", "would you ", "do you ", "does ",
  "is ", "are ", "explain ", "clarify ", "elaborate", "example",
];

const QUESTION_PHRASES = [
  "what does", "what is", "what are", "how do", "how does",
];

/** True when the whole turn is best treated as a clarification request. */
export function detectUserQuestion(answer: string): boolean {
  const trimmed = answer.trim();
  if (!trimmed) return false;
  const lower = trimmed.toLowerCase();

  if (trimmed.endsWith("?")) return true;
  if (QUESTION_STARTS.some((start) => lower.startsWith(start))) return true;
  return QUESTION_PHRASES.some((phrase) => lower.includes(phrase));
}

/**
 * Detect turns such as: "I'm not sure what you mean, but I usually prefer X."
 * These should not discard the useful answer simply because a question appears.
 */
export function detectMixedQuestionAndAnswer(answer: string): boolean {
  const trimmed = answer.trim();
  if (!trimmed) return false;

  const hasQuestionSignal =
    trimmed.includes("?") ||
    QUESTION_STARTS.some((start) => trimmed.toLowerCase().startsWith(start)) ||
    QUESTION_PHRASES.some((phrase) => trimmed.toLowerCase().includes(phrase));

  if (!hasQuestionSignal) return false;

  // A question ending the turn is usually a pure clarification request.
  if (trimmed.endsWith("?")) return false;

  // Heuristic only: a longer turn containing a question signal is likely mixed.
  return trimmed.split(/\s+/).length >= 8;
}

/**
 * Validate an answer using conservative heuristics.
 *
 * Important design rule: validation provides routing signals; it does not decide
 * whether a person's lived experience is "good enough". Uncertainty is useful
 * knowledge and should be preserved rather than punished.
 */
export function validateAnswer(
  _domainId: string,
  answer: string,
  existingAnswers: string[],
): ValidationResult {
  const warnings: string[] = [];
  let score = 1.0;

  const trimmed = answer.trim();
  const words = trimmed.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const lower = trimmed.toLowerCase();

  const isMixedQuestionAndAnswer = detectMixedQuestionAndAnswer(trimmed);
  const isUserQuestion = detectUserQuestion(trimmed) && !isMixedQuestionAndAnswer;

  if (isUserQuestion) {
    return {
      confidence: 1,
      warnings: [],
      needsClarification: false,
      insufficientKnowledge: false,
      isUserQuestion: true,
      isMixedQuestionAndAnswer: false,
    };
  }

  // ── Uncertainty is a state, not a failed answer ──
  const insufficientKnowledge = INSUFFICIENT_KNOWLEDGE_PHRASES.some((phrase) =>
    lower.includes(phrase),
  );

  if (insufficientKnowledge) {
    warnings.push(
      "The user is uncertain about this topic. Preserve that uncertainty and use it to decide whether a targeted follow-up is useful.",
    );
    // Keep a usable baseline. A truthful "I don't know yet" should not force the
    // interviewer into an endless retry loop.
    score = Math.min(score, wordCount >= 6 ? 0.8 : 0.65);
  }

  if (!insufficientKnowledge && wordCount < 3) {
    const singleWord = words[0]?.toLowerCase().replace(/[^a-z]/g, "") ?? "";
    if (DEFLECTION_WORDS.has(singleWord)) {
      warnings.push("The response is very short; consider one concrete detail or example.");
      score -= 0.35;
    }
  }

  // ── Gibberish / keyboard-mashing signals ──
  if (words.length >= 3) {
    const wordFreq: Record<string, number> = {};
    for (const word of words) {
      const normalized = word.toLowerCase();
      wordFreq[normalized] = (wordFreq[normalized] || 0) + 1;
    }
    const maxFreq = Math.max(...Object.values(wordFreq));
    if (maxFreq / words.length > 0.6) {
      warnings.push("The response repeats the same word multiple times; a clearer response would help.");
      score -= 0.5;
    }
  }

  if (words.length > 0) {
    const gibberishCount = words.filter((word) => {
      const cleaned = word.toLowerCase().replace(/[^a-z]/g, "");
      if (cleaned.length === 0) return true;
      if (!/[aeiou]/i.test(cleaned)) return true;
      return /[^aeiou]{5,}/i.test(cleaned);
    }).length;

    if (gibberishCount / words.length > 0.5) {
      warnings.push("The response contains mostly unrecognizable words; please try again in clearer language.");
      score -= 0.5;
    }
  }

  // Only flag extreme symbol density. Numbers, punctuation, bullets, and normal
  // formatting are legitimate in many domains.
  const nonAlphaCount = (trimmed.match(/[^a-zA-Z\s]/g) || []).length;
  const alphaCount = (trimmed.match(/[a-zA-Z]/g) || []).length;
  const totalChars = nonAlphaCount + alphaCount;
  if (totalChars > 10 && nonAlphaCount / totalChars > 0.65) {
    warnings.push("The response contains unusually high symbol density; please check that it is readable.");
    score -= 0.35;
  }

  // ── Brevity is a gentle signal, not a quality verdict ──
  if (wordCount < 3) {
    warnings.push("Answer is very short — one concrete detail could make it more useful.");
    score -= 0.2;
  } else if (wordCount < 6) {
    warnings.push("Answer is brief — additional context may improve usefulness.");
    score -= 0.05;
  }

  // Do NOT infer specificity from capitalization, numbers, or answer length.
  // A concise personal statement can be highly valuable without any of those.

  for (const phrase of VAGUE_PHRASES) {
    if (lower.includes(phrase)) {
      warnings.push(`Answer contains potentially vague phrasing ("${phrase}"). A concrete example may help.`);
      score -= 0.05;
      break;
    }
  }

  // ── Contradiction is a warning, not an automatic rejection ──
  if (existingAnswers.length > 0) {
    const answerWords = new Set(
      lower.replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter((word) => word.length > 2),
    );

    for (const existing of existingAnswers) {
      const existingLower = existing.toLowerCase();
      const existingWords = new Set(
        existingLower
          .replace(/[^a-z0-9\s]/g, "")
          .split(/\s+/)
          .filter((word) => word.length > 2),
      );

      const hasNegInNew = NEGATION_WORDS.some((word) => lower.includes(word));
      const hasNegInExisting = NEGATION_WORDS.some((word) => existingLower.includes(word));

      if (hasNegInNew !== hasNegInExisting) {
        const sharedWords: string[] = [];
        for (const word of answerWords) {
          if (existingWords.has(word) && word.length > 3 && !NEGATION_WORDS.includes(word)) {
            sharedWords.push(word);
          }
        }

        if (sharedWords.length >= 2) {
          warnings.push(
            `Possible contradiction with a previous answer. Shared terms: ${sharedWords.join(", ")}. Treat this as something to clarify, not proof of inconsistency.`,
          );
          score -= 0.1;
          break;
        }
      }
    }
  }

  const confidence = Math.max(0, Math.min(1, score));
  const needsClarification = confidence < 0.4;

  return {
    confidence,
    warnings,
    needsClarification,
    insufficientKnowledge,
    isUserQuestion: false,
    isMixedQuestionAndAnswer,
  };
}
