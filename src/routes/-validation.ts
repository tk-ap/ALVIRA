// ── Validation: checks answer quality and returns confidence score ──

export interface ValidationResult {
  confidence: number; // 0–1
  warnings: string[];
  needsClarification: boolean; // true when confidence is too low — the answer isn't usable
  insufficientKnowledge: boolean; // true when user admits they don't know / haven't prepared
  isUserQuestion: boolean; // true when the user is asking a clarifying question, not answering
}

// Vague phrases that suggest the answer isn't specific
// (Phrases now covered by INSUFFICIENT_KNOWLEDGE_PHRASES are removed to avoid double-penalty)
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

// Phrases where the user actively admits they don't know or haven't prepared
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

// Single-word deflection answers that don't engage with the question
const DEFLECTION_WORDS = new Set([
  "ok",
  "okay",
  "sure",
  "yes",
  "no",
  "maybe",
  "idk",
  "alright",
  "fine",
  "whatever",
  "nah",
  "yep",
  "nope",
  "yeah",
]);

// Negation keywords that might indicate contradiction
const NEGATION_WORDS = [
  "not",
  "never",
  "don't",
  "doesn't",
  "won't",
  "can't",
  "shouldn't",
  "no ",
];

// Question-starting words that indicate the user is asking a clarifying question
const QUESTION_STARTS = [
  "what ",
  "how ",
  "why ",
  "when ",
  "where ",
  "who ",
  "can you ",
  "could you ",
  "would you ",
  "do you ",
  "does ",
  "is ",
  "are ",
  "explain ",
  "clarify ",
  "elaborate",
  "example",
];

// Question phrases that can appear anywhere in the text
const QUESTION_PHRASES = [
  "what does",
  "what is",
  "what are",
  "how do",
  "how does",
];

/**
 * Detect whether the user's input is actually a clarifying question
 * rather than an answer to the domain question.
 */
export function detectUserQuestion(answer: string): boolean {
  const trimmed = answer.trim();
  const lower = trimmed.toLowerCase();

  // Ends with question mark
  if (trimmed.endsWith("?")) return true;

  // Starts with a question word
  for (const start of QUESTION_STARTS) {
    if (lower.startsWith(start)) return true;
  }

  // Contains a question phrase
  for (const phrase of QUESTION_PHRASES) {
    if (lower.includes(phrase)) return true;
  }

  return false;
}

/**
 * Pure function: validate an answer against existing answers for the same domain.
 * Returns a confidence score (0–1), any warnings, and a needsClarification flag.
 * Checks (in priority order):
 *   - Gibberish detection (repeated words, non-words, random characters)
 *   - Answer is non-trivial (more than a few words)
 *   - Answer is specific (contains concrete nouns, avoids vague phrases)
 *   - No direct contradiction with previous answers (basic keyword-based)
 */
export function validateAnswer(
  domainId: string,
  answer: string,
  existingAnswers: string[],
): ValidationResult {
  const warnings: string[] = [];
  let score = 1.0;

  const trimmed = answer.trim();
  const words = trimmed.split(/\s+/).filter((w) => w.length > 0);
  const wordCount = words.length;
  const lower = trimmed.toLowerCase();

  // ═══════════════════════════════════════════
  // -1. User question detection (runs before everything — skip all validation)
  // ═══════════════════════════════════════════
  const isUserQuestion = detectUserQuestion(trimmed);
  if (isUserQuestion) {
    return {
      confidence: 1.0,
      warnings: [],
      needsClarification: false,
      insufficientKnowledge: false,
      isUserQuestion: true,
    };
  }

  // ═══════════════════════════════════════════
  // 0. Insufficient knowledge detection (runs first — heavier penalty for admitting lack of knowledge)
  // ═══════════════════════════════════════════

  let insufficientKnowledge = false;

  // 0a. Insufficient knowledge phrases — user admits they don't know / haven't prepared
  if (wordCount < 20) {
    for (const phrase of INSUFFICIENT_KNOWLEDGE_PHRASES) {
      if (lower.includes(phrase)) {
        warnings.push(
          "It sounds like you may not have enough clarity on this yet. No problem — take some time to research or think it through. I'll ask again when you're ready. You can also skip this domain for now and come back to it later.",
        );
        score -= 0.6;
        insufficientKnowledge = true;
        break;
      }
    }
  }

  // 0b. Deflection patterns — single-word answers that don't engage with the question
  if (!insufficientKnowledge && wordCount < 3) {
    const singleWord = words[0]?.toLowerCase().replace(/[^a-z]/g, "") ?? "";
    if (DEFLECTION_WORDS.has(singleWord)) {
      warnings.push(
        "It sounds like you may not have enough clarity on this yet. No problem — take some time to research or think it through. I'll ask again when you're ready. You can also skip this domain for now and come back to it later.",
      );
      score -= 0.6;
      insufficientKnowledge = true;
    }
  }

  // ═══════════════════════════════════════════
  // 1. Gibberish detection
  // ═══════════════════════════════════════════

  // 1a. Repeated same word — if >60% of words are the same, likely nonsense (e.g. "asdf asdf asdf asdf")
  if (words.length >= 3) {
    const wordFreq: Record<string, number> = {};
    for (const w of words) {
      const lowerW = w.toLowerCase();
      wordFreq[lowerW] = (wordFreq[lowerW] || 0) + 1;
    }
    const maxFreq = Math.max(...Object.values(wordFreq));
    if (maxFreq / words.length > 0.6) {
      warnings.push(
        "Your answer repeats the same word multiple times — please provide a more meaningful response.",
      );
      score -= 0.5;
    }
  }

  // 1b. Gibberish word ratio — count words with no vowels or 5+ consecutive consonants
  if (words.length > 0) {
    const gibberishCount = words.filter((w) => {
      const cleaned = w.toLowerCase().replace(/[^a-z]/g, "");
      if (cleaned.length === 0) return true; // all non-alpha characters
      // No vowels at all
      if (!/[aeiou]/i.test(cleaned)) return true;
      // 5+ consecutive consonants (e.g. "asdfg", "jklmn")
      if (/[^aeiou]{5,}/i.test(cleaned)) return true;
      return false;
    }).length;

    if (gibberishCount / words.length > 0.5) {
      warnings.push(
        "Your answer contains mostly unrecognizable words — please try again with clearer language.",
      );
      score -= 0.5;
    }
  }

  // 1c. Character randomness — high ratio of non-alphabetic characters suggests keyboard mashing
  const nonAlphaCount = (trimmed.match(/[^a-zA-Z\s]/g) || []).length;
  const alphaCount = (trimmed.match(/[a-zA-Z]/g) || []).length;
  const totalChars = nonAlphaCount + alphaCount;
  if (totalChars > 0 && nonAlphaCount / totalChars > 0.4) {
    warnings.push(
      "Your answer contains many non-alphabetic characters — please provide a clearer response.",
    );
    score -= 0.5;
  }

  // ═══════════════════════════════════════════
  // 2. Non-trivial check
  // ═══════════════════════════════════════════
  if (wordCount < 3) {
    warnings.push("Answer is very short — consider providing more detail.");
    score -= 0.4;
  } else if (wordCount < 6) {
    warnings.push("Answer is brief — more detail would improve quality.");
    score -= 0.15;
  }

  // 3. Specificity check — contains concrete nouns?
  // Simple heuristic: look for capitalized words (proper nouns) or specific patterns
  const hasProperNouns = /[A-Z][a-z]{2,}/.test(trimmed);
  const hasNumbers = /\d/.test(trimmed);
  const hasConcreteNouns = hasProperNouns || hasNumbers || wordCount > 10;

  if (!hasConcreteNouns && wordCount < 15) {
    warnings.push(
      "Answer lacks specific details — names, numbers, or concrete examples would help.",
    );
    score -= 0.15;
  }

  // 4. Vague phrase check
  for (const phrase of VAGUE_PHRASES) {
    if (lower.includes(phrase)) {
      warnings.push(
        `Answer contains vague phrasing ("${phrase}") — try to be more definitive.`,
      );
      score -= 0.1;
      break; // Only penalize once for vagueness
    }
  }

  // 5. Contradiction check (basic keyword-based)
  if (existingAnswers.length > 0) {
    const answerWords = new Set(
      lower
        .replace(/[^a-z0-9\s]/g, "")
        .split(/\s+/)
        .filter((w) => w.length > 2),
    );

    for (const existing of existingAnswers) {
      const existingLower = existing.toLowerCase();
      const existingWords = new Set(
        existingLower
          .replace(/[^a-z0-9\s]/g, "")
          .split(/\s+/)
          .filter((w) => w.length > 2),
      );

      // Check for negation patterns: if an existing answer says "we use X" and new says "we don't use X"
      // Look for overlapping significant words with negation in one but not the other
      const hasNegInNew = NEGATION_WORDS.some((nw) => lower.includes(nw));
      const hasNegInExisting = NEGATION_WORDS.some((nw) =>
        existingLower.includes(nw),
      );

      if (hasNegInNew !== hasNegInExisting) {
        // One has negation, the other doesn't — check for shared key terms
        const sharedWords: string[] = [];
        for (const w of answerWords) {
          if (
            existingWords.has(w) &&
            w.length > 3 &&
            !NEGATION_WORDS.includes(w)
          ) {
            sharedWords.push(w);
          }
        }
        if (sharedWords.length >= 2) {
          warnings.push(
            `Possible contradiction with a previous answer. Shared terms: ${sharedWords.join(", ")}. Please clarify.`,
          );
          score -= 0.2;
          break; // Only flag one contradiction
        }
      }
    }
  }

  // Clamp score
  const confidence = Math.max(0, Math.min(1, score));

  // needsClarification: true when confidence is too low for the answer to be usable
  const needsClarification = confidence < 0.4;

  return {
    confidence,
    warnings,
    needsClarification,
    insufficientKnowledge,
    isUserQuestion: false,
  };
}
