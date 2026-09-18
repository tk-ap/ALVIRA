// ── Validation: checks answer quality and returns confidence score ──

export interface ValidationResult {
  confidence: number; // 0–1
  warnings: string[];
  needsClarification: boolean; // true when confidence is too low — the answer isn't usable
  insufficientKnowledge: boolean; // true when user admits they don't know / haven't prepared
  /** True only for genuinely unusable input (gibberish, contradiction) that must be re-asked. */
  isUnusable: boolean;
  /**
   * Existing interview routing flag. Normally means the user asked a clarifying
   * question. A strong topical mismatch also uses this non-answer clarification
   * path so the answer is NOT stored under the wrong domain.
   */
  isUserQuestion: boolean;
  /** True only when strong evidence says the answer addresses another known area. */
  topicMismatch?: boolean;
  /** Best-effort destination used for diagnostics/tests only; never auto-files the answer. */
  suggestedDomainId?: string;
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
  "ok", "okay", "sure", "yes", "no", "maybe", "idk", "alright",
  "fine", "whatever", "nah", "yep", "nope", "yeah",
]);

// Negation keywords that might indicate contradiction
const NEGATION_WORDS = ["not", "never", "don't", "doesn't", "won't", "can't", "shouldn't", "no "];

// Question-starting words that indicate the user is asking a clarifying question
const QUESTION_STARTS = [
  "what ", "how ", "why ", "when ", "where ", "who ",
  "can you ", "could you ", "would you ", "do you ", "does ",
  "is ", "are ", "explain ", "clarify ", "elaborate", "example",
];

// Question phrases that can appear anywhere in the text
const QUESTION_PHRASES = [
  "what does", "what is", "what are", "how do", "how does",
];

type DomainSignalSpec = {
  label: string;
  patterns: RegExp[];
};

/**
 * Deliberately conservative topical signatures for the Context interview.
 *
 * These are NOT a classifier and never re-file user content. They exist only
 * to catch high-confidence drift such as answering a Current Projects question
 * with a statement entirely about decision style. A mismatch requires at least
 * two independent signals for another domain and zero signals for the domain
 * currently being asked. Ambiguous, broad, short, or cross-domain answers pass.
 */
const DOMAIN_TOPICALITY: Record<string, DomainSignalSpec> = {
  background: {
    label: "Background",
    patterns: [
      /\b(?:background|education|degree|school|college|university|career|occupation|profession|job|work as|based in|live in|grew up|family|parent|years? (?:in|as|doing))\b/i,
      /\b(?:i run|i own|i lead|i founded|i work in|my role)\b/i,
    ],
  },
  currentProjects: {
    label: "Current Projects",
    patterns: [
      /\b(?:project|working on|building|developing|creating|producing|preparing|initiative|campaign)\b/i,
      /\b(?:launch|deadline|due date|ship|release|milestone|this week|this month|right now|currently)\b/i,
    ],
  },
  identity: {
    label: "Identity",
    patterns: [
      /\b(?:identity|mission|purpose|values?|principles?|beliefs?|stand for|who i am|defines? me)\b/i,
      /\b(?:matters? most|important to me|core to me|i believe)\b/i,
    ],
  },
  goals: {
    label: "Goals",
    patterns: [
      /\b(?:goal|goals|want to|hope to|aim to|trying to|objective|priority|priorities|aspiration)\b/i,
      /\b(?:achieve|outcome|success|target|by next|within \d+|grow|increase|reduce|improve)\b/i,
    ],
  },
  decisionFrameworks: {
    label: "Decision Frameworks",
    patterns: [
      /\b(?:decid\w*|choose|choice|judg\w*|prioriti[sz]\w*|approval)\b/i,
      /\b(?:trade[- ]?off|weigh|criteria|risk tolerance|research|compare|before committing|pros? and cons?)\b/i,
    ],
  },
  constraints: {
    label: "Constraints",
    patterns: [
      /\b(?:constraint|constraints|limitation|limitations|boundary|boundaries|non[- ]?negotiable|restriction|restricted)\b/i,
      /\b(?:budget|cash|runway|cost|debt|legal|compliance|security|policy|policies)\b/i,
      /\b(?:cannot|can't|must not|won't|not allowed|off limits)\b/i,
    ],
  },
  dailyLife: {
    label: "Daily Life",
    patterns: [
      /\b(?:daily|every day|each day|morning|evening|routine|routines|habit|habits|calendar|schedule)\b/i,
      /\b(?:day[- ]to[- ]day|typical day|stay organized|organise|organize my|productivity)\b/i,
    ],
  },
  preferences: {
    label: "Preferences",
    patterns: [
      /\b(?:prefer|preference|preferences|i like|i dislike|i'd rather|i would rather|works best for me)\b/i,
      /\b(?:feel right|feels right|my taste|my style|i respond best)\b/i,
    ],
  },
  communication: {
    label: "Communication",
    patterns: [
      /\b(?:communicat\w*|tone|writing style|format|formatting|vocabulary|wording)\b/i,
      /\b(?:direct|concise|detailed|formal|casual|plain language|step[- ]by[- ]step)\b/i,
      /\b(?:advice|explanation|feedback|brief me|tell me|show me)\b/i,
    ],
  },
  knowledgeGaps: {
    label: "Knowledge Gaps",
    patterns: [
      /\b(?:uncertain|uncertainty|unsure|don't know|do not know|need to learn|knowledge gap|unknown)\b/i,
      /\b(?:pending decision|need to research|need to verify|assumption|assumptions|figure out)\b/i,
    ],
  },
  unknowns: {
    label: "Unknowns",
    patterns: [
      /\b(?:uncertain|uncertainty|unknown|don't know|do not know|pending|assumption|assumptions)\b/i,
      /\b(?:need to verify|needs verification|not decided|haven't decided|open question)\b/i,
    ],
  },
  processes: {
    label: "Processes",
    patterns: [
      /\b(?:process|processes|workflow|workflows|procedure|procedures|sop|standard operating)\b/i,
      /\b(?:steps|step by step|recurring|onboarding|handoff|lifecycle|how we do)\b/i,
    ],
  },
  peopleAndRoles: {
    label: "People & Roles",
    patterns: [
      /\b(?:stakeholder|stakeholders|team|manager|direct report|reports to|role|roles|responsibilit\w*)\b/i,
      /\b(?:decision maker|subject matter expert|sme|department|coworker|colleague)\b/i,
    ],
  },
  relationships: {
    label: "Relationships",
    patterns: [
      /\b(?:relationship|relationships|partner|vendor|client|customer journey|reporting line)\b/i,
      /\b(?:depend on|depends on|collaborat\w*|work with|interact with|ownership chain)\b/i,
    ],
  },
  toolsAndSystems: {
    label: "Tools & Systems",
    patterns: [
      /\b(?:software|tool|tools|system|systems|app|apps|api|apis|database|databases)\b/i,
      /\b(?:notion|slack|github|google drive|documentation|tech stack|platform)\b/i,
    ],
  },
  knowledgeAndTerminology: {
    label: "Knowledge & Terminology",
    patterns: [
      /\b(?:terminology|term|terms|acronym|acronyms|glossary|jargon|vocabulary)\b/i,
      /\b(?:domain knowledge|industry concept|internal language|specialized knowledge)\b/i,
    ],
  },
  rules: {
    label: "Rules",
    patterns: [
      /\b(?:rule|rules|eligibility|eligible|approval rule|condition|conditions)\b/i,
      /\b(?:calculation|calculate|threshold|trigger|govern|governs)\b/i,
    ],
  },
  exceptions: {
    label: "Exceptions",
    patterns: [
      /\b(?:exception|exceptions|edge case|edge cases|override|overrides)\b/i,
      /\b(?:emergency|special approval|normal process doesn't|normal process does not)\b/i,
    ],
  },
  faqs: {
    label: "FAQs",
    patterns: [
      /\b(?:faq|faqs|frequently asked|common question|common questions|people ask|customers ask)\b/i,
      /\b(?:confusion|confused about|asked repeatedly|recurring question)\b/i,
    ],
  },
};

export type TopicalMismatch = {
  mismatch: boolean;
  suggestedDomainId?: string;
  suggestedDomainLabel?: string;
};

function topicalScore(answer: string, spec: DomainSignalSpec): number {
  return spec.patterns.reduce((score, pattern) => score + (pattern.test(answer) ? 1 : 0), 0);
}

/**
 * Detect only strong cross-domain drift. This intentionally prefers false
 * negatives over false positives: if the current domain has any topical signal,
 * or another domain does not have at least two independent signals, the answer
 * is allowed through normal validation.
 */
export function detectTopicalMismatch(domainId: string, answer: string): TopicalMismatch {
  const currentSpec = DOMAIN_TOPICALITY[domainId];
  const trimmed = answer.trim();
  if (!currentSpec || trimmed.split(/\s+/).filter(Boolean).length < 5) return { mismatch: false };

  const currentScore = topicalScore(trimmed, currentSpec);
  if (currentScore > 0) return { mismatch: false };

  let bestDomainId: string | undefined;
  let bestScore = 0;
  for (const [candidateId, spec] of Object.entries(DOMAIN_TOPICALITY)) {
    if (candidateId === domainId) continue;
    const score = topicalScore(trimmed, spec);
    if (score > bestScore) {
      bestScore = score;
      bestDomainId = candidateId;
    }
  }

  if (!bestDomainId || bestScore < 2) return { mismatch: false };
  return {
    mismatch: true,
    suggestedDomainId: bestDomainId,
    suggestedDomainLabel: DOMAIN_TOPICALITY[bestDomainId]?.label,
  };
}

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

// ── Move-on / frustration detection ──
// Explicit requests to leave the current topic. When detected, the interview
// marks the domain as "unexplored / uninterested in exploration" and advances
// immediately instead of re-probing — the user is asking to move on, not for a
// follow-up question.

const MOVE_ON_PHRASES = [
  "move on", "moving on", "next question", "next topic", "next please",
  "change topic", "different topic", "let's move", "can we move on",
  "skip this", "skip it", "let's skip",
  "not interested", "uninterested", "don't care", "do not care", "no comment",
  "not relevant", "irrelevant", "doesn't apply", "does not apply", "not applicable",
  "don't want to talk", "don't want to answer", "don't want to discuss",
  "don't want to go into", "would rather not", "rather not",
  "stop asking", "tired of this", "enough about this",
  "frustrating", "i'm frustrated", "this is annoying",
];

const MOVE_ON_SHORT_RESPONSES = ["skip", "next", "pass", "boring", "irrelevant", "nah", "n/a"];

export function detectMoveOnRequest(answer: string): boolean {
  const trimmed = answer.trim();
  const lower = trimmed.toLowerCase();
  const wordCount = trimmed.split(/\s+/).filter(Boolean).length;

  for (const phrase of MOVE_ON_PHRASES) {
    if (lower.includes(phrase)) return true;
  }

  // Short, whole-word deflections — only when the answer is a brief dismissal,
  // never when a longer answer merely mentions the word.
  if (wordCount <= 5) {
    const tokens = lower.replace(/[^a-z0-9/]/g, " ").split(/\s+/).filter(Boolean);
    if (tokens.some((token) => MOVE_ON_SHORT_RESPONSES.includes(token))) return true;
  }

  return false;
}

/**
 * Pair-wise contradiction check: one statement negates while the other affirms,
 * and they share at least two meaningful terms. Basic keyword heuristic.
 */
export function answersContradict(prior: string, next: string): boolean {
  const lowerNext = next.toLowerCase();
  const lowerPrior = prior.toLowerCase();
  const hasNegInNext = NEGATION_WORDS.some((nw) => lowerNext.includes(nw));
  const hasNegInPrior = NEGATION_WORDS.some((nw) => lowerPrior.includes(nw));
  if (hasNegInNext === hasNegInPrior) return false;

  const nextWords = new Set(
    lowerNext.replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter((w) => w.length > 2),
  );
  const priorWords = new Set(
    lowerPrior.replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter((w) => w.length > 2),
  );

  let shared = 0;
  for (const w of nextWords) {
    if (priorWords.has(w) && w.length > 3 && !NEGATION_WORDS.includes(w)) shared += 1;
  }
  return shared >= 2;
}

/**
 * Pure function: validate an answer against existing answers for the same domain.
 * Returns a confidence score (0–1), any warnings, and a needsClarification flag.
 * Checks (in priority order):
 *   - User clarification-question detection
 *   - Strong topical mismatch detection (never auto-files to another domain)
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
      isUnusable: false,
      isUserQuestion: true,
    };
  }

  // ═══════════════════════════════════════════
  // -0.5. Strong topical mismatch detection
  // ═══════════════════════════════════════════
  // Reuse the existing non-answer clarification route so drifted content is kept
  // in conversation history but never appended to the wrong domain's answers.
  const topical = detectTopicalMismatch(domainId, trimmed);
  if (topical.mismatch) {
    return {
      confidence: 0,
      warnings: [
        topical.suggestedDomainLabel
          ? `This appears to answer ${topical.suggestedDomainLabel} rather than the area currently being asked about.`
          : "This appears to answer a different area than the one currently being asked about.",
      ],
      needsClarification: true,
      insufficientKnowledge: false,
      isUnusable: true,
      isUserQuestion: true,
      topicMismatch: true,
      suggestedDomainId: topical.suggestedDomainId,
    };
  }

  // ═══════════════════════════════════════════
  // 0. Insufficient knowledge detection (runs first — heavier penalty for admitting lack of knowledge)
  // ═══════════════════════════════════════════

  let insufficientKnowledge = false;
  let isUnusable = false;

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
      isUnusable = true;
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
      isUnusable = true;
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
    isUnusable = true;
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
    warnings.push("Answer lacks specific details — names, numbers, or concrete examples would help.");
    score -= 0.15;
  }

  // 4. Vague phrase check
  for (const phrase of VAGUE_PHRASES) {
    if (lower.includes(phrase)) {
      warnings.push(`Answer contains vague phrasing ("${phrase}") — try to be more definitive.`);
      score -= 0.1;
      break; // Only penalize once for vagueness
    }
  }

  // 5. Contradiction check (basic keyword-based)
  for (const existing of existingAnswers) {
    if (answersContradict(existing, trimmed)) {
      warnings.push("Possible contradiction with a previous answer. Please clarify.");
      score -= 0.2;
      isUnusable = true;
      break; // Only flag one contradiction
    }
  }

  // Clamp score
  const confidence = Math.max(0, Math.min(1, score));

  // needsClarification: true when confidence is too low for the answer to be usable
  const needsClarification = confidence < 0.4;

  return { confidence, warnings, needsClarification, insufficientKnowledge, isUnusable, isUserQuestion: false };
}
