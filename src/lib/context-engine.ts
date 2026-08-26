export type ContextSourceType =
  | "website"
  | "professional"
  | "social"
  | "file"
  | "ai-context"
  | "interview";

export type EvidenceState = "observed" | "inferred" | "confirmed" | "outdated";

export interface ContextSource {
  id: string;
  type: ContextSourceType;
  label: string;
  locator: string;
  status: "queued" | "ready" | "needs-review";
  addedAt: string;
}

export interface ContextEvidence {
  id: string;
  sourceId: string;
  domainId: string;
  statement: string;
  state: EvidenceState;
  confidence: number;
  evidence?: string;
  needsConfirmation: boolean;
}

export interface ContextGap {
  id: string;
  domainId: string;
  reason: "missing" | "conflict" | "stale" | "low-confidence";
  question: string;
  priority: "high" | "medium" | "low";
}

export interface ContextEngineSnapshot {
  sources: ContextSource[];
  evidence: ContextEvidence[];
  gaps: ContextGap[];
}

export const CONTEXT_SOURCE_OPTIONS: Array<{
  type: ContextSourceType;
  label: string;
  description: string;
  examples: string;
}> = [
  { type: "website", label: "Websites", description: "Personal sites, portfolios, blogs, company sites, and stores.", examples: "Portfolio, Shopify, personal site" },
  { type: "professional", label: "Professional", description: "Profiles and work that describe what you do.", examples: "LinkedIn, résumé, GitHub, presentations" },
  { type: "social", label: "Social", description: "Public profiles and posts that reflect your voice and interests.", examples: "Instagram, X, YouTube, TikTok" },
  { type: "file", label: "Files", description: "Documents and notes you already have.", examples: "PDFs, notes, journals, exports" },
  { type: "ai-context", label: "Existing AI context", description: "Context you've already built for another AI.", examples: "ChatGPT, Claude, Gemini exports" },
  { type: "interview", label: "Tell ALVIRA", description: "Start with your own words and let the interview fill the gaps.", examples: "Guided interview" },
];

const URL_TYPES: Array<[RegExp, ContextSourceType]> = [
  [/linkedin\.com/i, "professional"],
  [/github\.com/i, "professional"],
  [/(instagram|x\.com|twitter|tiktok|youtube)\.com/i, "social"],
  [/(shopify|myshopify)\.com/i, "website"],
];

export function classifySourceLocator(locator: string): ContextSourceType {
  for (const [pattern, type] of URL_TYPES) {
    if (pattern.test(locator)) return type;
  }
  return "website";
}

export function normalizeLocator(locator: string): string {
  const trimmed = locator.trim();
  if (!trimmed) return "";
  if (/^[a-z]+:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function makeSource(locator: string): ContextSource {
  const normalized = normalizeLocator(locator);
  const type = classifySourceLocator(normalized);
  const host = (() => {
    try { return new URL(normalized).hostname.replace(/^www\./, ""); } catch { return normalized; }
  })();
  return {
    id: crypto.randomUUID(),
    type,
    label: host || "New source",
    locator: normalized,
    status: "queued",
    addedAt: new Date().toISOString(),
  };
}

export function summarizeEvidence(evidence: ContextEvidence[]) {
  return {
    total: evidence.length,
    observed: evidence.filter((item) => item.state === "observed").length,
    inferred: evidence.filter((item) => item.state === "inferred").length,
    confirmed: evidence.filter((item) => item.state === "confirmed").length,
    needsConfirmation: evidence.filter((item) => item.needsConfirmation).length,
    averageConfidence: evidence.length
      ? Math.round((evidence.reduce((sum, item) => sum + item.confidence, 0) / evidence.length) * 100)
      : 0,
  };
}

export function buildGapQuestion(gap: ContextGap): string {
  if (gap.question) return gap.question;
  if (gap.reason === "conflict") return "Two sources describe this differently. Which reflects you now?";
  if (gap.reason === "stale") return "This may be outdated. What is true today?";
  if (gap.reason === "low-confidence") return "I found a signal here, but I’m not confident yet. Can you clarify?";
  return "I don't have enough context here yet. What should your AI understand?";
}
