import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { marked } from "marked";
import { useEffect, useMemo, useRef, useState } from "react";
import JSZip from "jszip";
import { createMeosBuilderKit } from "~/lib/meos-builder-kit";
import { buildCarryOverClaims, handoffTopic, oppositeOffering, type ProfileOffering } from "~/lib/profile-handoff";

import { Header } from "~/components/Header";
import { MeOSCTA } from "~/components/MeOSCTA";
import { TrustFooter } from "~/components/TrustFooter";
import { FrameworkSelector, BirthDataForm, ReviewPanel, ValidationCard, FRAMEWORKS, type FrameworkId } from "~/components/MeosOverlays";
import { LIFETIME_PRICE, STRIPE_LINKS } from "~/lib/pricing";
import { extractClaims, type ExtractionResult } from "./-extractor";
import {
  getKnowledgeGraph,
  getPlaybook,
  type Domain,
  type InterviewState,
  type Message,
  type Tier,
} from "./-knowledgeGraph";
import { detectGaps, countCovered, allRequiredCovered } from "./-gapDetection";
import { generateQuestion, generateClarification } from "./-questionGenerator";
import { validateAnswer } from "./-validation";
import { compileKnowledge } from "./-knowledgeCompiler";
import { getMeosGraph, getMeosPreviewGraph, getMeosPlaybook } from "./-meosGraph";
import { compileMeosKnowledge, generatePortrait, type MeosPortrait } from "./-meosCompiler";
import { getCurrentUser, saveProfile, saveMeosPortrait, loadProfile, trackInterview, fetchUserLimits, autosaveInterview, getInterviewDraft, clearInterviewDraft, getEntitlements } from "./-auth";
// Max height (px) of the answer textarea before it scrolls instead of growing.
const MAX_ANSWER_INPUT_HEIGHT = 160;

// Max time (ms) allowed for any single async step inside generation before it is
// treated as a timeout. Guards the LLM-driven MeOS portrait call so "Compiling..."
// can never spin indefinitely with no feedback.
const GENERATE_TIMEOUT_MS = 45000;

function getInterviewDraftKey(
  userId: string | null | undefined,
  offering: string | null | undefined,
) {
  const scope = userId ? `user:${userId}` : "anonymous";
  return `alvira:interview-draft:${scope}:${offering ?? "context"}`;
}

function promiseWithTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (v) => { window.clearTimeout(timer); resolve(v); },
      (e) => { window.clearTimeout(timer); reject(e); },
    );
  });
}

type ResumableDraft = {
  offering: "context" | "meos";
  topic: string;
  state: InterviewState;
  savedAt?: number;
  source: "browser" | "account";
};

// ── Initialize empty interview state ──
function createInitialState(tier: Tier, topic: string, offering: "context" | "meos" = "context", preview = false): InterviewState {
  const graph = offering === "meos" ? (preview ? getMeosPreviewGraph() : getMeosGraph()) : getKnowledgeGraph(tier);
  const domains: InterviewState["domains"] = {};
  for (const d of graph) {
    domains[d.id] = { answers: [], confidence: 0, covered: false };
  }
  return {
    tier,
    topic,
    domains,
    history: [],
    currentDomain: null,
  };
}

// ── Continue-interview seed: build a FRESH adaptive conversation that carries
// over the user's already-compiled profile knowledge so gap detection skips
// covered domains (personal threshold 0.90) and targets new/open gaps.
// This mirrors the Upload-to-Seed pipeline: existing answers are user-owned
// content, so they seed the state with confidence 1 / covered true.
function seedStateFromExisting(existing: InterviewState, offering: "context" | "meos", preview: boolean): InterviewState {
  const graph = offering === "meos" ? (preview ? getMeosPreviewGraph() : getMeosGraph()) : getKnowledgeGraph(existing.tier);
  const initialState = createInitialState(existing.tier, existing.topic, offering, preview);
  const domains = { ...initialState.domains };
  for (const d of graph) {
    const existingAnswers = existing.domains?.[d.id]?.answers ?? [];
    if (existingAnswers.length > 0) {
      domains[d.id] = { answers: [...existingAnswers], confidence: 1, covered: true };
    }
  }
  return { ...initialState, domains };
}
// ── Document parsing helpers (Upload-to-seed) ──
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5MB cap — reject larger files gracefully
const SUPPORTED_UPLOAD_EXTENSIONS = ["txt", "md", "docx"] as const;

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read that file. Please try another one."));
    reader.readAsText(file);
  });
}

/** Extract plain text from a .docx via JSZip — unzip word/document.xml, strip tags. */
async function parseDocx(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);
  const docXml = await zip.file("word/document.xml")?.async("string");
  if (!docXml) {
    throw new Error("That doesn't look like a valid .docx file.");
  }
  const text = docXml
    .replace(/<w:p[^>]*>/g, "\n") // paragraphs
    .replace(/<w:tab[^>]*>/g, "\t") // tabs
    .replace(/<w:br[^>]*\/?>/g, "\n") // line breaks
    .replace(/<[^>]+>/g, "") // remaining tags
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n");
  return text.trim();
}

// ── Markdown preview component ──
function MarkdownPreview({ content }: { content: string }) {
  const html = useMemo(() => {
    if (!content) return "";
    const rendered = marked.parse(content, { breaks: true });
    return typeof rendered === "string" ? rendered : "";
  }, [content]);

  return (
    <div
      className="prose prose-sm max-w-none prose-headings:text-gray-900 dark:prose-headings:text-gray-100 prose-headings:font-semibold prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-li:text-gray-700 dark:prose-li:text-gray-300 prose-strong:text-gray-900 dark:prose-strong:text-gray-100 prose-code:text-gray-800 dark:prose-code:text-gray-200 prose-code:bg-gray-100 dark:prose-code:bg-gray-700 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

// ── Typing indicator ──
function TypingIndicator() {
  return (
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <img
          src="/brand/alvira-compact-mark.svg"
          alt=""
          aria-label="ALVIRA"
          className="h-8 w-8"
          />
      </div>
      <div className="rounded-lg rounded-tl-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex gap-1">
          <span className="h-2 w-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="h-2 w-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="h-2 w-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
}

// ── Constants ──
const FILES = [
  { key: "aiProfile", label: "ai-working-profile.md" },
  { key: "overview", label: "overview.md" },
  { key: "requirements", label: "requirements.md" },
  { key: "constraints", label: "constraints.md" },
  { key: "businessRules", label: "business-rules.md" },
  { key: "workflows", label: "workflows.md" },
  { key: "chatgpt", label: "chatgpt-instructions.md" },
  { key: "claude", label: "claude-instructions.md" },
  { key: "gemini", label: "gemini-instructions.md" },
  { key: "cursor", label: "cursor-rules.md" },
] as const;

const TIERS: { value: Tier; label: string; description: string }[] = [
  { value: "personal", label: "Personal", description: "Personal knowledge & preferences" },
];
const TOPIC_GROUPS = [
  {
    label: "For individuals",
    tier: "personal" as const,
    topics: [
      "My communication style and decision-making process",
      "My daily routines, habits, and personal workflows",
      "My values, boundaries, and what I won't compromise on",
      "My key relationships and how I collaborate with others",
      "My goals, priorities, and how I evaluate tradeoffs",
    ],
  },
] as const;

// ── Page ──
export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [{ title: 'ALVIRA Interview' }, { name: "description", content: 'Build your AI profile.' }],
  }),
  validateSearch: (search: Record<string, unknown>) => ({ offering: search.offering === "meos" ? "meos" as const : undefined, preview: search.preview === "true" }),
  component: AppPage,
});

// ── Auth prompt banner ──
function AuthPromptBanner({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="border-b border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 px-4 py-1.5">
      <p className="text-xs text-emerald-800 dark:text-emerald-200 text-center">
        Sign in to save your interview progress.{" "}
        <a href="/login" className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300 underline underline-offset-2 transition-colors">
          Sign in →
        </a>
      </p>
    </div>
  );
}

// ── Signup prompt banner ──
function SignupPromptBanner({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="border-t border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 px-4 py-1.5">
      <p className="text-xs text-emerald-800 dark:text-emerald-200 text-center">
        Don&apos;t have an account?{" "}
        <a href="/signup" className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300 underline underline-offset-2 transition-colors">
          Create one →
        </a>
      </p>
    </div>
  );
}
// ── Upgrade banner (free tier limit) ──
function UpgradeBanner({ reason, email }: { reason: "profiles" | "interviews"; email?: string }) {
  const prefilled = email ? `?prefilled_email=${encodeURIComponent(email)}` : "";
  return (
    <div className="border-b border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950 px-6 py-3">
      <div className="mx-auto max-w-3xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-sm text-amber-800 dark:text-amber-200 font-mono">
          {reason === "interviews"
            ? "Free tier limit reached. Upgrade to Pro for unlimited interviews."
            : "Free tier limited to 1 saved profile. Upgrade to save more."}
        </p>
        <div className="flex gap-2 flex-shrink-0 items-center">
          <a
            href="/pricing#why-alvira"
            className="font-mono text-xs text-emerald-700 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300 underline underline-offset-2"
          >
            Why upgrade?
          </a>
          <a
            href={STRIPE_LINKS.pro + prefilled}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-emerald-700 dark:bg-emerald-600 px-4 py-1.5 font-mono text-xs font-semibold text-white hover:bg-emerald-800 dark:hover:bg-emerald-500 transition-colors"
          >
            Upgrade to Pro
          </a>
          <a
            href={STRIPE_LINKS.lifetime + prefilled}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-amber-500 dark:border-amber-400 px-4 py-1.5 font-mono text-xs font-semibold text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950 transition-colors"
          >
            Go Lifetime
          </a>
        </div>
      </div>
    </div>
  );
}

// ── Upgrade modal (shown when save fails with limit_reached) ──
function UpgradeModal({ onClose, reason, email }: { onClose: () => void; reason: "profiles" | "interviews"; email?: string }) {
  const prefilled = email ? `?prefilled_email=${encodeURIComponent(email)}` : "";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="mx-4 w-full max-w-md rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Upgrade to continue</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-5 font-mono">
          {reason === "profiles"
            ? "Free accounts can save 1 profile. Upgrade to Pro for unlimited profiles."
            : "Free accounts are limited to 3 interviews. Upgrade to Pro for unlimited interviews."}
        </p>
        <div className="space-y-3">
          <a
            href="/pricing#why-alvira"
            className="block text-center font-mono text-xs text-emerald-700 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300 underline underline-offset-2"
          >
            Why upgrade?
          </a>
          <a
            href={STRIPE_LINKS.pro + prefilled}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center rounded-lg bg-emerald-700 dark:bg-emerald-600 px-4 py-2.5 font-mono text-sm font-semibold text-white hover:bg-emerald-800 dark:hover:bg-emerald-500 transition-colors"
          >
            Upgrade to Pro — $20/mo
          </a>
          <a
            href={STRIPE_LINKS.lifetime + prefilled}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center rounded-lg border border-amber-500 dark:border-amber-400 px-4 py-2.5 font-mono text-sm font-semibold text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950 transition-colors"
          >
            Go Lifetime — {LIFETIME_PRICE} once
          </a>
          <button
            type="button"
            onClick={onClose}
            className="block w-full text-center font-mono text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors pt-1"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}

function AppPage() {
  // Screen state: "start" | "seed-review" | "interview" | "output" | "api-error"
  const [screen, setScreen] = useState<"start" | "seed-review" | "interview" | "output" | "api-error">("start");

  // Start screen state
  const [topic, setTopic] = useState("");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [customTopic, setCustomTopic] = useState("");
  const [chapterSuggestions, setChapterSuggestions] = useState<string[]>([]);
  const [tier, setTier] = useState<Tier>("personal");
  // A single active topic group locks the other group. Enterprise selects both,
  // so both groups remain available for that scope.
  const selectedGroups = TOPIC_GROUPS.filter((group) => group.topics.some((topicOption) => selectedTopics.includes(topicOption)));
  const activeGroup = selectedGroups.length === 1 ? selectedGroups[0] : null;
  const { offering: offeringSearch, preview: previewSearch } = Route.useSearch();
  const [offering, setOffering] = useState<"context" | "meos" | null>(offeringSearch === "meos" ? "meos" : "context");
  const [previewMode, setPreviewMode] = useState(offeringSearch === "meos" && previewSearch === true);
  const isPreview = offering === "meos" && previewMode;
  type MeosPhase = "core" | "frameworks" | "birthData" | "review" | "validation" | "compile";
  const [meosPhase, setMeosPhase] = useState<MeosPhase>("core");

  // Interview state (the single source of truth)
  const [state, setState] = useState<InterviewState | null>(null);
  const [resumeDraft, setResumeDraft] = useState<ResumableDraft | null>(null);
  const [answer, setAnswer] = useState("");
  const [waiting, setWaiting] = useState(false);
  const [interviewError, setInterviewError] = useState("");
  const [startError, setStartError] = useState("");
  // Upload-to-seed state
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [extraction, setExtraction] = useState<ExtractionResult | null>(null);
  const [seedDecisions, setSeedDecisions] = useState<Record<number, { status: "agree" | "revise" | "skip"; text?: string }>>({});
  const [seededInfo, setSeededInfo] = useState<string | null>(null);
  const [seedSource, setSeedSource] = useState<"document" | "profile">("document");
  const seedOfferingRef = useRef<"context" | "meos">("context");
  // The inline MeOS nudge is shown once after the user's third meaningful answer.
  const meaningfulAnswerCountRef = useRef(0);
  const autosaveAnswerCountRef = useRef(0);
  const draftRestoredRef = useRef(false);
  const [showInsightCTA, setShowInsightCTA] = useState(false);

  // Output state
  const [generated, setGenerated] = useState<Record<string, string> | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [compiling, setCompiling] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [copyMsg, setCopyMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedProfileId, setSavedProfileId] = useState<string | null>(null);
  const [meosPortrait, setMeosPortrait] = useState<MeosPortrait | null>(null);
  const [portraitError, setPortraitError] = useState(false);

  // Auth state
  const [authUser, setAuthUser] = useState<{ id: string; email: string; tier: string; isOwner?: boolean } | null | undefined>(undefined);
  const [meosAuthorized, setMeosAuthorized] = useState(false);
  const navigate = useNavigate();
  // First-class "what do you want to build?" choice. Free users are routed to the
  // experience-first MeOS preview; entitled users go to the full MeOS path. The
  // entitlement path (handleStart paywall) is unchanged.
  const handleChooseOffering = (choice: "context" | "meos") => {
    setStartError("");
    if (choice === "meos") {
      setOffering("meos");
      setPreviewMode(!meosAuthorized);
      if (meosAuthorized) {
        navigate({ to: "/app", search: { offering: "meos", preview: false } });
      } else {
        navigate({ to: "/app", search: { offering: "meos", preview: true } });
      }
    } else {
      setOffering("context");
      setPreviewMode(false);
      navigate({ to: "/app", search: { offering: undefined, preview: false } });
    }
  };

  // Limit state
  const [limitBanner, setLimitBanner] = useState<"profiles" | "interviews" | null>(null);
  const [limitModal, setLimitModal] = useState<"profiles" | "interviews" | null>(null);
  const [interviewCount, setInterviewCount] = useState(0);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Computed values
  const graph = state ? (offering === "meos" ? (isPreview ? getMeosPreviewGraph() : getMeosGraph()) : getKnowledgeGraph(state.tier)) : [];
  const playbook = offering === "meos" ? getMeosPlaybook() : (state ? getPlaybook(state.tier) : getPlaybook("personal"));
  const confThreshold = playbook.completion.minimumConfidence;
  const coveredCount = state ? countCovered(graph, state, confThreshold) : 0;
  const totalDomains = graph.length;
  const answerCount = state?.history.filter((message) => message.role === "user").length ?? 0;
  const gaps = state ? detectGaps(graph, state, confThreshold) : [];
  const hasGaps = gaps.length > 0;
  const requiredCovered = state ? allRequiredCovered(graph, state, confThreshold) : false;

  // ── Knowledge quality check ──
  // Warns when compiled files would be too thin to be useful.
  const qualityWarnings: string[] = [];
  if (state && graph.length > 0 && offering !== "meos") {
    let totalChars = 0;
    let domainsWithContent = 0;
    for (const domain of graph) {
      const ds = state.domains[domain.id];
      if (ds?.answers) {
        const domainChars = ds.answers.join(" ").length;
        totalChars += domainChars;
        if (domainChars >= 30) domainsWithContent++;
      }
    }
    if (domainsWithContent < 3 || totalChars < 200) {
      if (domainsWithContent === 0) {
        qualityWarnings.push("You haven't provided enough detail yet — your knowledge files will be nearly empty.");
      } else if (domainsWithContent < 3) {
        qualityWarnings.push(`Only ${domainsWithContent} domain${domainsWithContent === 1 ? "" : "s"} with enough detail. Your knowledge files will be very thin.`);
      }
      if (totalChars < 200 && domainsWithContent > 0) {
        qualityWarnings.push("Your answers are quite brief. More detailed responses produce more useful knowledge files that AI tools can actually work with.");
      }
    }
  }
  const hasQualityWarning = qualityWarnings.length > 0;

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state?.history, waiting]);

  // Focus input when entering interview
  useEffect(() => {
    if (screen === "interview" && !waiting) {
      inputRef.current?.focus();
    }
  }, [screen, waiting]);
  // Auto-resize the answer textarea as content grows (capped at MAX_ANSWER_INPUT_HEIGHT, then scrolls).
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    // scrollHeight excludes the border (textarea scrollHeight = content + padding);
    // add the border so a single line exactly matches the 46px send button.
    const border = el.offsetHeight - el.clientHeight;
    el.style.height = `${Math.min(el.scrollHeight + border, MAX_ANSWER_INPUT_HEIGHT)}px`;
    el.style.overflowY = el.scrollHeight + border >= MAX_ANSWER_INPUT_HEIGHT ? "auto" : "hidden";
  }, [answer]);

  // Persist every in-progress state locally; authenticated users also get a server draft.
  useEffect(() => {
    if (!state || typeof window === "undefined") return;
    const key = getInterviewDraftKey(authUser?.id, offering);
    try { window.localStorage.setItem(key, JSON.stringify({ offering: offering ?? "context", topic: state.topic, state, savedAt: Date.now() })); } catch { /* storage may be unavailable */ }
    if (authUser) {
      const timer = window.setTimeout(() => { autosaveInterview({ data: { offering: offering ?? "context", topic: state.topic, state } }).catch(() => {}); }, 500);
      return () => window.clearTimeout(timer);
    }
  }, [state, offering, authUser]);
  // Check auth state, resume profile, and fetch limits
  useEffect(() => {
    let cancelled = false;
    getCurrentUser().then(async (u) => {
      if (cancelled) return;
      if (u) {
        setAuthUser({ id: u.id, email: u.email, tier: u.tier, isOwner: u.isOwner });
        // MeOS Build entitlement is always computed (not only for the meos URL) so the
        // free onboarding "what do you want to build?" choice can route free users to the
        // experience-first preview and entitled users to the full MeOS path.
        const entitlements = await getEntitlements().catch(() => [] as string[]);
        const reflectAuthorized = Boolean(u.isOwner || entitlements.includes("meos_build"));
        setMeosAuthorized(reflectAuthorized);
        setInterviewCount(u.interviewCount ?? 0);

        // Fetch detailed limits for the banner
        try {
          const limits = await fetchUserLimits();
          if (!cancelled) {
            const lim = limits as { tier: string; interviewCount: number; profileCount: number; maxInterviews: number; maxProfiles: number; isOwner?: boolean };
            if (!lim.isOwner && lim.tier === "free" && lim.interviewCount >= lim.maxInterviews) {
              setLimitBanner("interviews");
            }
          }
        } catch { /* ignore */ }

        // An authenticated account draft takes precedence over a browser-local
        // anonymous draft, which may otherwise mask a saved interview after login.
        if (!draftRestoredRef.current) {
          try {
            const localRaw = window.localStorage.getItem(
              getInterviewDraftKey(
                u.id,
                offeringSearch === "meos" ? "meos" : "context",
              ),
            );
            const serverDraft = await getInterviewDraft().catch(() => null);
            const localDraft = localRaw ? JSON.parse(localRaw) : null;
            const draft = serverDraft ?? localDraft;
            if (draft?.state && !cancelled) {
              setResumeDraft({
                offering: draft.offering === "meos" ? "meos" : "context",
                topic: draft.topic ?? draft.state.topic,
                state: draft.state as InterviewState,
                savedAt: draft.savedAt,
                source: serverDraft ? "account" : "browser",
              });
              draftRestoredRef.current = true;
            }
          } catch { /* malformed or unavailable draft */ }
        }
        const profileId = new URLSearchParams(window.location.search).get("profile");
        if (profileId) {
          try {
            const profile = await loadProfile({ data: { profileId } });
            if (!cancelled) {
              const profileOffering: ProfileOffering = profile.offering === "meos" ? "meos" : "context";
              setOffering(profileOffering);
              setPreviewMode(profileOffering === "meos" && !reflectAuthorized);
              setTopic(profile.topic);
              setTier(profile.tier as Tier);
              setState(profile.state as InterviewState);
              setScreen("interview");
            }
          } catch { /* dashboard remains the fallback */ }
        }
        const continueId = new URLSearchParams(window.location.search).get("continue");
        if (continueId) {
          void handleContinueFromProfile(continueId, reflectAuthorized);
        }
        const handoffId = new URLSearchParams(window.location.search).get("handoff");
        if (handoffId) {
          void handleCrossSeedFromProfile(handoffId, reflectAuthorized);
        }
      } else {
        setAuthUser(null);
        try {
          const raw = window.localStorage.getItem(
              getInterviewDraftKey(
                authUser?.id,
                offeringSearch === "meos" ? "meos" : "context",
              ),
            );
          if (raw) {
            const draft = JSON.parse(raw);
            if (draft?.state && !cancelled) {
              setResumeDraft({
                offering: draft.offering === "meos" ? "meos" : "context",
                topic: draft.topic ?? draft.state.topic,
                state: draft.state as InterviewState,
                savedAt: draft.savedAt,
                source: "browser",
              });
            }
          }
        } catch { /* malformed or unavailable draft */ }
      }
    }).catch(() => {
      if (!cancelled) setAuthUser(null);
    });
    return () => { cancelled = true; };
  }, []);

  const handleResumeDraft = () => {
    if (!resumeDraft) return;
    setOffering(resumeDraft.offering);
    setTopic(resumeDraft.topic);
    setTier(resumeDraft.state.tier);
    setState(resumeDraft.state);
    setResumeDraft(null);
    setScreen("interview");
  };

  const handleStartOver = async () => {
    const draftOffering = resumeDraft?.offering ?? offering ?? "context";
    try { window.localStorage.removeItem(
        getInterviewDraftKey(authUser?.id, draftOffering),
      ); } catch { /* storage may be unavailable */ }
    if (authUser) await clearInterviewDraft().catch(() => {});
    setResumeDraft(null);
    setState(null);
    setTopic("");
    setSelectedTopics([]);
    setCustomTopic("");
    setOffering(offeringSearch === "meos" ? "meos" : "context");
    setPreviewMode(offeringSearch === "meos" && previewSearch === true);
    setScreen("start");
  };

  // ── Continue / Update profile: seed a NEW adaptive conversation from the
  // user's saved profile knowledge so gap detection skips covered domains and
  // targets new/open gaps. Reuses the Upload-to-Seed seeding pattern.
  const handleContinueFromProfile = async (profileId: string, reflectAuthorized = meosAuthorized) => {
    setStartError(""); setInterviewError("");
    let profile: { topic: string; tier: string; offering: string; state: InterviewState };
    try {
      profile = (await loadProfile({ data: { profileId } })) as { topic: string; tier: string; offering: string; state: InterviewState };
    } catch (err) {
      setStartError(err instanceof Error ? err.message : "Could not load your profile to continue.");
      setScreen("start");
      return;
    }
    const activeOffering: "context" | "meos" = profile.offering === "meos" ? "meos" : "context";
    const profilePreview = activeOffering === "meos" && !reflectAuthorized;
    setOffering(activeOffering);
    setPreviewMode(profilePreview);
    setTopic(profile.topic);
    setTier(profile.tier as Tier);
    const seeded = seedStateFromExisting(profile.state, activeOffering, profilePreview);
    const carried = Object.values(seeded.domains).filter((d) => d.covered).length;
    setState(seeded);
    setSeededInfo(
      carried > 0
        ? `Continuing from your saved profile — ${carried} ${carried === 1 ? "area was" : "areas were"} carried over. Answer the remaining questions to update and expand your knowledge.`
        : "Continuing from your saved profile. Tell me anything new you want to add.",
    );
    setScreen("interview");
    setWaiting(true);
    try {
      const result = await askNextQuestion(seeded, false, activeOffering);
      if (result) setState(result);
      else setState({ ...seeded, currentDomain: null });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      if (msg !== "API key not configured") {
        setInterviewError(msg);
        setState(seeded);
      }
    } finally {
      setWaiting(false);
    }
  };

  // Reviewed cross-seed: Context and Reflect remain separate profiles, but the
  // user can review relevant same-person knowledge before it enters the other
  // graph. No shared-foundation persistence or schema migration is required.
  const handleCrossSeedFromProfile = async (profileId: string, reflectAuthorized = meosAuthorized) => {
    setStartError("");
    setInterviewError("");
    try {
      const profile = (await loadProfile({ data: { profileId } })) as {
        topic: string;
        tier: string;
        offering: string;
        state: InterviewState;
      };
      const source: ProfileOffering = profile.offering === "meos" ? "meos" : "context";
      const target = oppositeOffering(source);
      const targetPreview = target === "meos" && !reflectAuthorized;
      const targetGraph = target === "meos"
        ? (targetPreview ? getMeosPreviewGraph() : getMeosGraph())
        : getKnowledgeGraph(profile.state.tier);
      const targetDomainIds = new Set(targetGraph.map((domain) => domain.id));
      const claims = buildCarryOverClaims(profile.state, source, target).filter((claim) =>
        targetDomainIds.has(claim.domainId),
      );
      const coveredIds = new Set(claims.map((claim) => claim.domainId));

      setOffering(target);
      setPreviewMode(targetPreview);
      setTopic(handoffTopic(profile.topic, target));
      setTier(profile.state.tier);
      seedOfferingRef.current = target;
      setSeedSource("profile");
      setExtraction({
        claims,
        uncoveredDomains: targetGraph.map((domain) => domain.id).filter((id) => !coveredIds.has(id)),
        summary: `Review what your ${source === "meos" ? "ALVIRA Reflect" : "AI Context Profile"} already knows before carrying it into ${target === "meos" ? "ALVIRA Reflect" : "your AI Context Profile"}.`,
      });
      setSeedDecisions({});
      setScreen("seed-review");
    } catch (err) {
      setStartError(err instanceof Error ? err.message : "Could not prepare the profile handoff.");
      setScreen("start");
    }
  };
  // ── Ask next question (picks top gap, calls LLM for phrasing) ──
  const askNextQuestion = async (currentState: InterviewState, isClarification = false, forcedOffering?: "context" | "meos") => {
    const activeOffering = forcedOffering ?? offering;
    const currentGraph = activeOffering === "meos" ? (isPreview ? getMeosPreviewGraph() : getMeosGraph()) : getKnowledgeGraph(currentState.tier);
    const currentPlaybook = activeOffering === "meos" ? getMeosPlaybook() : getPlaybook(currentState.tier);
    const currentGaps = detectGaps(currentGraph, currentState, currentPlaybook.completion.minimumConfidence);
    if (currentGaps.length === 0) return null;

    const topGap = currentGaps[0];
    const updatedState: InterviewState = {
      ...currentState,
      currentDomain: topGap.domain.id,
    };

    try {
      const result = await generateQuestion({
        data: {
          domain: topGap.domain,
          history: currentState.history,
          tier: currentState.tier,
          isClarification,
        },
      });

      const newHistory: Message[] = [
        ...currentState.history,
        { role: "assistant", content: result.question },
      ];

      return { ...updatedState, history: newHistory };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      if (msg === "API key not configured") {
        setScreen("api-error");
      }
      throw err;
    }
  };

  // ── Handlers ──
  const handleSave = async () => {
    if (!state || !authUser || saving) return;
    setSaving(true);
    try {
      const result = await saveProfile({ data: { topic: state.topic, tier: state.tier, state, offering: offering === "meos" ? "meos" : "context", preview: isPreview, portrait: offering === "meos" ? meosPortrait : undefined } });
      // Check for limit_reached error
      const r = result as { id?: string; error?: string; limit?: string };
      if (r.error === "limit_reached") {
        setLimitModal(r.limit as "profiles" | "interviews");
        setLimitBanner(r.limit as "profiles" | "interviews");
        setSaving(false);
        return;
      }
      setSavedProfileId(r.id ?? null);
      if (offering === "meos" && r.id && meosPortrait) {
        await saveMeosPortrait({ data: { profileId: r.id, portrait: meosPortrait } });
      }
    } catch (err) {
      setInterviewError(err instanceof Error ? err.message : "Unable to save profile.");
    } finally { setSaving(false); }
  };

  const handleStart = async () => {
    // The free-form "current chapter" answer (topic) is always preserved verbatim.
    // Selected MeOS themes (chapterSuggestions) augment -- never overwrite -- it by being
    // merged into the topic that seeds the interview only at start time. This keeps the
    // typed answer safe when themes are toggled, and still lets a user who selects only
    // themes (empty typed field) start the interview.
    const trimmed = (offering === "meos" && chapterSuggestions.length > 0)
      ? [topic.trim(), ...chapterSuggestions].filter(Boolean).join(", ")
      : topic.trim();
    if (offering === "meos" && !isPreview && !meosAuthorized) { setStartError("Reflect Build ($149 one-time) must be purchased before continuing. ALVIRA Pro is optional."); return; }
    if (offering !== "meos" && !trimmed) return;

    // MeOS topics are introspective/philosophical — skip the context-oriented validation
    if (offering !== "meos") {
      const validation = validateAnswer("start", trimmed, []);
      const wordCount = trimmed.split(/\s+/).length;
      if (validation.needsClarification || wordCount < 3 || validation.confidence < 0.7) {
        const msg = wordCount < 2
          ? "Please describe what you want to capture in more detail — at least a few words. For example: \"My communication style and decision-making preferences.\""
          : validation.insufficientKnowledge
            ? "Please describe what knowledge you want to capture more specifically. What themes, context, or understanding should your AI have?"
            : "That doesn't look like a real description. Try something like \"My communication preferences and values\" or \"How our team handles customer escalations.\"";
        setStartError(msg);
        return;
      }
    }

    setStartError("");
    meaningfulAnswerCountRef.current = 0;
    setShowInsightCTA(false);
    setScreen("interview");
    setWaiting(true);
    setInterviewError("");

    const initialState = createInitialState(existing.tier, existing.topic, offering, preview);

    try {
      const result = await askNextQuestion(initialState);
      if (result) {
        setState(result);
      } else {
        setState(initialState);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      if (msg !== "API key not configured") {
        setInterviewError(msg);
        setState(initialState);
      }
    } finally {
      setWaiting(false);
    }
  };

  // ── Upload-to-seed: parse file → extract claims → review screen ──
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;

    if (!topic.trim()) {
      setUploadError("Describe what your AI should know first, then upload your document.");
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setUploadError("That file is larger than 5MB. Please upload a smaller document.");
      return;
    }
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!(SUPPORTED_UPLOAD_EXTENSIONS as readonly string[]).includes(ext)) {
      setUploadError("Only .txt, .md, and .docx files are supported right now.");
      return;
    }

    setUploading(true);
    setUploadError("");
    setInterviewError("");
    try {
      const text = ext === "docx" ? await parseDocx(file) : await readFileAsText(file);
      if (!text.trim()) {
        throw new Error("That file appears to be empty — nothing to extract.");
      }
      const seedOffering = offering === "meos" ? "meos" : "context";
      const result = await extractClaims({ data: { text, tier, topic: topic.trim(), offering: seedOffering } });
      seedOfferingRef.current = seedOffering;
      setSeedSource("document");
      setExtraction(result);
      setSeedDecisions({});
      setScreen("seed-review");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not extract knowledge from that file.";
      if (msg === "API key not configured") {
        setScreen("api-error");
      } else {
        setUploadError(msg);
      }
    } finally {
      setUploading(false);
    }
  };

  // ── Upload-to-seed: apply approved claims → seed state → continue interview ──
  const handleSeedContinue = async () => {
    if (!extraction) return;

    const seedOffering = seedOfferingRef.current;
    const currentGraph = seedOffering === "meos" ? (isPreview ? getMeosPreviewGraph() : getMeosGraph()) : getKnowledgeGraph(tier);
    const initialState = createInitialState(tier, topic.trim(), seedOffering, isPreview);
    const domains = { ...initialState.domains };

    extraction.claims.forEach((claim, index) => {
      const decision = seedDecisions[index] ?? { status: claim.confidence >= 0.8 ? "agree" : "skip" };
      if (decision.status === "skip") return;
      if (!currentGraph.some((d) => d.id === claim.domainId)) return; // safety: unknown domain
      const text =
        decision.status === "revise" && decision.text?.trim() ? decision.text.trim() : claim.text;
      if (!text) return;
      const existing = domains[claim.domainId]?.answers ?? [];
      if (!existing.includes(text)) {
        // Approved claims are user-validated → confidence 1, covered true.
        // This is what lets gap detection skip the seeded domains (personal threshold 0.90).
        domains[claim.domainId] = { answers: [...existing, text], confidence: 1, covered: true };
      }
    });

    const seededDomainCount = Object.values(domains).filter((d) => d.covered).length;
    const seededState: InterviewState = { ...initialState, domains };

    setState(seededState);
    setExtraction(null);
    setSeedDecisions({});
    setSeededInfo(
      seededDomainCount > 0
        ? `${seededDomainCount} ${seededDomainCount === 1 ? "domain was" : "domains were"} carried over from your ${seedSource === "profile" ? "other ALVIRA profile" : "document"}. Answer the remaining questions to finish your profile.`
        : "No claims were selected — starting a fresh interview.",
    );
    setScreen("interview");
    setWaiting(true);
    setInterviewError("");

    // Auto-run the next question so the interview continues with remaining gaps
    // and history is populated (Generate requires history.length >= 2).
    try {
      const result = await askNextQuestion(seededState);
      if (result) {
        setState(result);
      } else {
        setState({ ...seededState, currentDomain: null });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      if (msg !== "API key not configured") {
        setInterviewError(msg);
        setState(seededState);
      }
    } finally {
      setWaiting(false);
    }
  };

  const handleSend = async () => {
    const trimmed = answer.trim();
    if (!trimmed || waiting || !state) return;

    const currentDomain = state.currentDomain;

    const newHistory: Message[] = [...state.history, { role: "user", content: trimmed }];

    let updatedDomains = { ...state.domains };
    let needsClarify = false;
    let meaningfulAnswer = false;

    if (currentDomain) {
      const existing = updatedDomains[currentDomain]?.answers ?? [];
      const validation = validateAnswer(currentDomain, trimmed, existing);

      if (validation.isUserQuestion) {
        setState({ ...state, history: newHistory, currentDomain });
        setAnswer("");
        setWaiting(true);
        setInterviewError("");

        try {
          const domainLabel = graph.find((d) => d.id === currentDomain)?.label ?? "";
          const clarificationResult = await generateClarification({
            data: {
              userQuestion: trimmed,
              domainLabel,
              history: newHistory,
              tier: state.tier,
            },
          });

          const clarificationHistory = [
            ...newHistory,
            { role: "assistant", content: clarificationResult.clarification },
          ];
          const clarificationState: InterviewState = {
            ...state,
            history: clarificationHistory,
            currentDomain,
          };

          const result = await askNextQuestion(clarificationState, false);
          if (result) {
            setState(result);
          } else {
            setState({ ...clarificationState, currentDomain: null });
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "Something went wrong.";
          if (msg !== "API key not configured") {
            setInterviewError(msg);
            setState({ ...state, history: newHistory, currentDomain });
          }
        } finally {
          setWaiting(false);
        }
        return;
      }

      if (validation.needsClarification && validation.insufficientKnowledge) {
        needsClarify = true;
        const warningText =
          validation.warnings.length > 0
            ? validation.warnings[0]
            : "It sounds like you may not have enough clarity on this yet. No problem — take some time to research or think it through. I'll ask again when you're ready. You can also skip this domain for now and come back to it later.";
        newHistory.push({ role: "assistant", content: warningText });

        updatedDomains = {
          ...updatedDomains,
          [currentDomain]: {
            answers: [...existing, trimmed],
            confidence: validation.confidence,
            covered: false,
          },
        };
      }
      else if (validation.needsClarification) {
        needsClarify = true;
        const warningText =
          validation.warnings.length > 0
            ? `Hmm, I didn't quite catch that. ${validation.warnings.join(" ")}`
            : "Hmm, I didn't quite catch that. Could you try again with a bit more detail?";
        newHistory.push({ role: "assistant", content: warningText });

        updatedDomains = {
          ...updatedDomains,
          [currentDomain]: {
            answers: [...existing, trimmed],
            confidence: validation.confidence,
            covered: false,
          },
        };
      }
      else {
        meaningfulAnswer = true;
        updatedDomains = {
          ...updatedDomains,
          [currentDomain]: {
            answers: [...existing, trimmed],
            confidence: validation.confidence,
            covered:
              validation.confidence >= confThreshold &&
              existing.length + 1 >= (graph.find((d) => d.id === currentDomain)?.minAnswers ?? 1),
          },
        };
      }
    }

    const updatedState: InterviewState = {
      ...state,
      domains: updatedDomains,
      history: newHistory,
      currentDomain: needsClarify ? currentDomain : null,
    };

    setState(updatedState);
    setAnswer("");
    if (meaningfulAnswer && offering !== "meos" && !showInsightCTA) {
      meaningfulAnswerCountRef.current += 1;
      if (meaningfulAnswerCountRef.current >= 3) setShowInsightCTA(true);
    }
    // MeOS special flow begins once the eight required core domains are confidently covered.
    if (offering === "meos" && meosPhase === "core") {
      const coreIds = ["currentChapter", "desiredOutcomes", "values", "boundaries", "goals", "decisionPatterns", "workHistory", "definitionOfSuccess"];
      const coreComplete = coreIds.every(id => updatedState.domains[id]?.confidence >= 0.85);
      if (coreComplete) {
        setMeosPhase("frameworks");
        return;
      }
    }
    setWaiting(true);
    setInterviewError("");

    try {
      const result = await askNextQuestion(updatedState, needsClarify);
      if (result) {
        setState(result);
      } else {
        setState({ ...updatedState, currentDomain: null });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      if (msg !== "API key not configured") {
        setInterviewError(msg);
        setState(updatedState);
      }
    } finally {
      setWaiting(false);
    }
  };

  const handleSkip = async () => {
    if (waiting || !state || !state.currentDomain) return;

    const currentDomain = state.currentDomain;
    const updatedDomains = {
      ...state.domains,
      [currentDomain]: {
        ...state.domains[currentDomain],
        covered: true,
        confidence: state.domains[currentDomain].confidence || confThreshold,
      },
    };

    const updatedState: InterviewState = {
      ...state,
      domains: updatedDomains,
      currentDomain: null,
    };

    setState(updatedState);
    setWaiting(true);
    setInterviewError("");

    try {
      const result = await askNextQuestion(updatedState);
      if (result) {
        setState(result);
      } else {
        setState({ ...updatedState, currentDomain: null });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      if (msg !== "API key not configured") {
        setInterviewError(msg);
        setState(updatedState);
      }
    } finally {
      setWaiting(false);
    }
  };

  const meosClaims = useMemo(() => {
    if (!state || offering !== "meos") return [];
    const direct = ["values", "boundaries"].flatMap(id => (state.domains[id]?.answers || []).map(text => ({ text, source: "user-supplied" as const })));
    const inferred = ["decisionPatterns", "goals", "workHistory"].flatMap(id => (state.domains[id]?.answers || []).map(text => ({ text, source: "inferred" as const })));
    return [...direct, ...inferred];
  }, [state, offering]);
  const updateMeosDomain = (id: string, values: string[]) => {
    if (!state) return;
    setState({ ...state, domains: { ...state.domains, [id]: { answers: values, confidence: 1, covered: true } } });
  };
  const handleFrameworks = (ids: FrameworkId[]) => {
    updateMeosDomain("frameworks", [JSON.stringify(ids)]);
    if (ids.some(id => FRAMEWORKS.find(f => f.id === id)?.birth)) setMeosPhase("birthData");
    else setMeosPhase("review");
  };
  const handleBirthData = (data: object) => { updateMeosDomain("birthData", [JSON.stringify(data)]); setMeosPhase("review"); };
  const handleReview = (results: object[]) => { updateMeosDomain("review", results.map(x => JSON.stringify(x))); setMeosPhase("validation"); };
  const handleValidation = (note: string) => {
    if (!state) return;
    const next = { ...state, domains: { ...state.domains, validation: { answers: [note || "Validated by user."], confidence: 1, covered: true } } };
    setState(next); setMeosPhase("compile"); handleGenerate(next);
  };

  const handleGenerate = async (stateOverride?: InterviewState) => {
    const compileState = stateOverride || state;
    if (!compileState) return;
    if (compiling) return; // avoid re-entrancy while already generating

    setGenerateError(null);

    // Track interview count (for limits)
    if (authUser) {
      try {
        const result = await trackInterview();
        const r = result as { interviewCount?: number; error?: string; limit?: string };
        if (r.error === "limit_reached") {
          setLimitModal("interviews");
          setLimitBanner("interviews");
          return;
        }
        if (r.interviewCount !== undefined) {
          setInterviewCount(r.interviewCount);
          // Check if we just hit the limit
          if (!authUser.isOwner && authUser.tier === "free" && r.interviewCount >= 3) {
            setLimitBanner("interviews");
          }
        }
      } catch {
        // If tracking fails (e.g., not logged in), proceed anyway
      }
    }

    setCompiling(true);
    try {
      const currentGraph = offering === "meos" ? (isPreview ? getMeosPreviewGraph() : getMeosGraph()) : getKnowledgeGraph(compileState.tier);
      let files: Record<string, string>;
      if (offering === "meos") {
        files = { ...compileMeosKnowledge(compileState, currentGraph).allFiles };
        setPortraitError(false);
        try {
          // Bound the LLM portrait call so it can never spin forever with no feedback.
          const result = await promiseWithTimeout(
            generatePortrait(compileState),
            GENERATE_TIMEOUT_MS,
            "Generating your portrait is taking longer than expected. Your knowledge files are ready — you can retry, or leave the portrait for later from your ALVIRA Reflect dashboard.",
          );
          if ("error" in result) {
            setMeosPortrait(null);
            setPortraitError(true);
          } else {
            setMeosPortrait(result);
            files["portrait.json"] = JSON.stringify(result, null, 2);
          }
        } catch {
          setMeosPortrait(null);
          setPortraitError(true);
        }
      } else {
        files = compileKnowledge(compileState, currentGraph);
      }
      setGenerated(files);
      setActiveTab(offering === "meos" ? "portrait.md" : "overview");
      setScreen("output");
    } catch (err: unknown) {
      // Never strand the user on "Compiling...": surface a clear, human-readable
      // error and keep the retry path available.
      console.error("Knowledge generation failed:", err);
      setGenerateError(
        err instanceof Error && err.message
          ? err.message
          : "Something went wrong while generating your knowledge files. Please try again.",
      );
    } finally {
      setCompiling(false); // ALWAYS releases the button, on success, failure, or timeout
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyMsg(`Copied ${label}!`);
      setTimeout(() => setCopyMsg(""), 2000);
    } catch {
      setCopyMsg("Copy failed");
      setTimeout(() => setCopyMsg(""), 2000);
    }
  };

  const downloadZip = async () => {
    if (!generated) return;
    const zip = new JSZip();
    const fileMap: [string, string][] = offering === "meos"
      ? Object.entries(generated).map(([name, content]) => [name, content] as [string, string])
      : [
          ["ai-working-profile.md", generated.aiProfile],
          ["overview.md", generated.overview],
          ["requirements.md", generated.requirements],
          ["constraints.md", generated.constraints],
          ["business-rules.md", generated.businessRules],
          ["workflows.md", generated.workflows],
          ["chatgpt-instructions.md", generated.chatgpt],
          ["claude-instructions.md", generated.claude],
          ["gemini-instructions.md", generated.gemini],
          ["cursor-rules.md", generated.cursor],
        ];
    for (const [name, content] of fileMap) {
      zip.file(name, content);
    }
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${topic.trim().toLowerCase().replace(/\s+/g, "-") || "alvira"}-context.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadMeosBuilderKit = async () => {
    if (!generated || offering !== "meos") return;
    const zip = new JSZip();
    const kit = createMeosBuilderKit({
      topic: state?.topic || topic || "My ALVIRA Reflect",
      portrait: meosPortrait,
      interviewState: state,
      content: Object.fromEntries(Object.entries(generated).filter(([name]) => name !== "portrait.json")),
    });
    for (const [name, content] of Object.entries(kit)) zip.file(name, content);
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(state?.topic || topic || "reflect").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "reflect"}-builder-kit.zip`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const startNew = () => {
    setTopic("");
    setSelectedTopics([]);
    setCustomTopic("");
    setTier("personal");
    setOffering(null);
    setPreviewMode(false);
    setMeosPhase("core");
    setState(null);
    setAnswer("");
    setGenerated(null);
    setMeosPortrait(null);
    setPortraitError(false);
    setInterviewError("");
    setUploading(false);
    setUploadError("");
    setExtraction(null);
    setSeedDecisions({});
    setSeededInfo(null);
    meaningfulAnswerCountRef.current = 0;
    setShowInsightCTA(false);
    setScreen("start");
    setSavedProfileId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Render helpers ──
  const chatBubbleClass = (role: "user" | "assistant") =>
    role === "assistant"
      ? "rounded-lg rounded-tl-md bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700"
      : "rounded-lg rounded-tr-md bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200";

  // ── Render: API Error Screen ──
  if (screen === "api-error") {
    return (
      <div className="min-h-dvh flex flex-col">
        <Header />
        <AuthPromptBanner show={authUser === null} />
        {limitBanner && <UpgradeBanner reason={limitBanner} email={authUser?.email} />}
        <main id="main-content" className="flex-1 flex items-center justify-center px-6">
          <div className="text-center max-w-md">
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30 mx-auto mb-6">
              <svg className="h-8 w-8 text-amber-700 dark:text-amber-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">API Key Not Configured</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              The OpenAI API key is not set. Add <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono">OPENAI_API_KEY</code> to your environment to enable the knowledge elicitation engine.
            </p>
            <a
              href="/"
              className="inline-flex items-center gap-2 rounded-lg bg-gray-900 dark:bg-gray-100 dark:text-gray-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
            >
              ← Back to home
            </a>
          </div>
        </main>
        <SignupPromptBanner show={authUser === null} />
        <TrustFooter />
      </div>
    );
  }

  // ── Render: Output Screen ──
  if (screen === "output" && generated) {
    const outputFiles = offering === "meos"
      ? Object.keys(generated).map((key) => ({ key, label: key }))
      : FILES;
    const activeContent = generated[activeTab] || "";
    return (
      <div className="min-h-dvh flex flex-col">
        <Header />
        <AuthPromptBanner show={authUser === null} />
        {limitBanner && <UpgradeBanner reason={limitBanner} email={authUser?.email} />}
        {limitModal && <UpgradeModal onClose={() => setLimitModal(null)} reason={limitModal} email={authUser?.email} />}
        <main id="main-content" className="flex-1 py-8 px-6">
          <div className="mx-auto max-w-3xl">
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Compiled AI profile</h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 font-mono">
                    Source-backed instructions and portable setup files · {state?.topic || topic}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={downloadZip} className={btnSecondary}>
                    <span className="font-mono text-xs">⬇ Download .zip</span>
                  </button>
                  {offering === "meos" && <button type="button" onClick={downloadMeosBuilderKit} className={btnPrimary}>Download Builder Kit (beta)</button>}
                  {savedProfileId && <a href="/bridge" className={btnSecondary}>Your context is ready — connect an AI tool →</a>}
                  {authUser && (savedProfileId ? <a href="/dashboard" className={btnSecondary}>Profile saved → View dashboard</a> : <button type="button" onClick={handleSave} disabled={saving} className={btnPrimary}>{saving ? "Saving..." : "Confirm & save profile"}</button>)}
                  {savedProfileId && <a href={`/app?handoff=${savedProfileId}`} className={btnSecondary}>{offering === "meos" ? "Carry into AI Context" : "Continue into Reflect"} →</a>}
                  {offering === "meos" && <a href="/meos" className={btnSecondary}>View ALVIRA Reflect →</a>}
                  <button type="button" onClick={startNew} className={btnPrimary}>
                    + Start new
                  </button>
                </div>
              </div>

              {offering === "meos" && portraitError && <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">Portrait generation encountered an issue. Your knowledge files are ready, and you can regenerate your portrait from your ALVIRA Reflect dashboard.</p>}

              {/* Tabs */}
              {offering !== "meos" && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-100"><strong>Review before saving.</strong> The AI Working Profile organizes direct interview evidence into operating guidance. Provider files are portable setup instructions—not a silent sync or connection.</div>}
              <div className="flex gap-0 border-b border-gray-200 dark:border-gray-800 overflow-x-auto">
                {outputFiles.map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setActiveTab(f.key)}
                    className={`flex-shrink-0 px-4 py-2.5 text-xs font-mono border-b-2 transition-colors whitespace-nowrap ${
                      activeTab === f.key
                        ? "border-gray-900 dark:border-gray-100 text-gray-900 dark:text-gray-100"
                        : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Preview */}
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 overflow-hidden">
                <div className="flex items-center justify-between bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-2">
                  <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                    {outputFiles.find((f) => f.key === activeTab)?.label}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(activeContent, outputFiles.find((f) => f.key === activeTab)?.label || "")}
                    className="text-xs font-mono text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                  >
                    {copyMsg || "Copy"}
                  </button>
                </div>
                <div className="p-5 max-h-[500px] overflow-y-auto">
                  <MarkdownPreview content={activeContent} />
                </div>
              </div>

              <div className="mt-8">
                <MeOSCTA placement="post-interview" />
              </div>
            </div>
          </div>
        </main>
        <SignupPromptBanner show={authUser === null} />
        <TrustFooter />
      </div>
    );
  }

  // ── Render: Interview Screen ──
  if (screen === "interview") {
    const domainLabel = state?.currentDomain
      ? graph.find((d) => d.id === state.currentDomain)?.label ?? ""
      : "";

    return (
      <div className="min-h-dvh flex flex-col">
        <Header />
        <AuthPromptBanner show={authUser === null} />
        {limitBanner && <UpgradeBanner reason={limitBanner} email={authUser?.email} />}
        {limitModal && <UpgradeModal onClose={() => setLimitModal(null)} reason={limitModal} email={authUser?.email} />}
        <main id="main-content" className="flex-1 flex flex-col px-6">
          {/* a11y: interview page needs a single H1 — screen-reader-only, contextual to the active interview */}
          <h1 className="sr-only">
            {offering === "meos" ? "ALVIRA Reflect interview" : "AI profile interview"}
            {state?.topic ? ` — ${state.topic}` : ""}
          </h1>
          <div className="relative mx-auto w-full max-w-3xl flex-1 flex flex-col py-6">
            {/* Chat area */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4" aria-live="polite" aria-label="Interview conversation">
              {seededInfo && (
                <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-200">
                  {seededInfo}
                </div>
              )}
              {state?.history.map((msg, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  {/* Avatar */}
                  {msg.role === "assistant" ? (
                    <div className="flex-shrink-0 flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                      <img
                        src="/brand/alvira-compact-mark.svg"
                        alt=""
                        aria-label="ALVIRA"
                        className="h-8 w-8"
                        />
                    </div>
                  ) : (
                    <div className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-gray-900 dark:bg-gray-100 text-xs font-bold text-white dark:text-gray-900">
                      Y
                    </div>
                  )}
                  {/* Bubble */}
                  <div className={`max-w-[80%] px-4 py-3 text-sm leading-relaxed ${chatBubbleClass(msg.role)}`}>
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                </div>
              ))}

              {waiting && <TypingIndicator />}

              {interviewError && (
                <div className="rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-300">
                  {interviewError}
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {showInsightCTA && (
              <div className="mb-4 border-t border-gray-100 dark:border-gray-800 pt-3">
                <MeOSCTA placement="post-insight" variant="inline" />
              </div>
            )}

            {/* Progress indicator — pinned above input */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono text-xs text-gray-600 dark:text-gray-400">
                  Starter profile progress · {answerCount} answer{answerCount === 1 ? "" : "s"}
                </span>
                {domainLabel && (
                  <span className="font-mono text-xs text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 px-2 py-0.5 rounded">
                    {domainLabel}
                  </span>
                )}
              </div>
              <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gray-900 dark:bg-gray-100 rounded-full transition-all duration-500"
                  style={{ width: `${totalDomains > 0 ? (coveredCount / totalDomains) * 100 : 0}%` }}
                />
              </div>
            </div>

            {offering === "meos" && meosPhase === "frameworks" && state && <FrameworkSelector selected={(() => { try { return JSON.parse(state.domains.frameworks?.answers[0] || "[]"); } catch { return []; } })()} onContinue={handleFrameworks} />}
            {offering === "meos" && meosPhase === "birthData" && state && <BirthDataForm onBack={() => setMeosPhase("frameworks")} onContinue={handleBirthData} />}
            {offering === "meos" && meosPhase === "review" && <ReviewPanel claims={meosClaims} onBack={() => setMeosPhase("frameworks")} onContinue={handleReview} />}
            {offering === "meos" && meosPhase === "validation" && <ValidationCard claims={meosClaims} onBack={() => setMeosPhase("review")} onComplete={handleValidation} />}

            {/* Input area */}
            <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
              {/* Generate button — always available */}
              <div className="mb-3 flex items-center justify-between">
                <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
                  {totalDomains > 0 ? Math.round((coveredCount / totalDomains) * 100) : 0}% complete
                </span>
                <div className="flex gap-2">
                  {hasGaps && state?.currentDomain && !waiting && (
                    <button
                      type="button"
                      onClick={handleSkip}
                      className="font-mono text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors px-2 py-1 focus-visible:ring-2 focus-visible:ring-emerald-500/50 dark:focus-visible:ring-emerald-400/50 rounded"
                    >
                      Skip →
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={compiling || !state || (state.history.length < 2 && hasGaps)}
                    className={`font-mono text-xs transition-colors rounded px-1 py-1 focus-visible:ring-2 focus-visible:ring-emerald-500/50 dark:focus-visible:ring-emerald-400/50 ${
                      state && (state.history.length >= 2 || !hasGaps)
                        ? "text-emerald-700 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300"
                        : "text-gray-500 dark:text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    {compiling ? "Compiling..." : "Generate knowledge files →"}
                  </button>
                </div>
              </div>

              {/* Generation error — visible so a failure is never a silent hang */}
              {generateError && (
                <div role="alert" className="mt-3 mb-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40 px-4 py-3">
                  <p className="text-sm font-semibold text-red-800 dark:text-red-200 mb-1">Couldn't generate your knowledge files</p>
                  <p className="text-sm text-red-700 dark:text-red-300">{generateError}</p>
                  <button
                    type="button"
                    onClick={() => handleGenerate()}
                    disabled={compiling}
                    className="mt-2 text-xs font-semibold text-red-700 dark:text-red-300 underline hover:text-red-800 dark:hover:text-red-200 disabled:opacity-50 disabled:no-underline"
                  >
                    Try again
                  </button>
                </div>
              )}

              {/* Knowledge quality warning — shown when answers are too thin to produce useful files */}
              {hasQualityWarning && !waiting && (
                <div className="mb-4 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 px-4 py-3">
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-1">
                    Your starter profile is taking shape
                  </p>
                  <ul className="text-sm text-amber-700 dark:text-amber-300 list-disc list-inside space-y-0.5">
                    {qualityWarnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                  <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
                    You can generate now, or answer another question or two for a more specific result.
                  </p>
                </div>
              )}

              {/* Interview complete banner */}
              {!hasGaps && !waiting && (
                <div className="mb-4 rounded-lg bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-200 flex items-center justify-between">
                  <span>
                    {requiredCovered
                      ? "✓ All domains covered. Ready to generate your knowledge files."
                      : "✓ Interview complete (some optional domains remain uncovered)."}
                  </span>
                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={compiling}
                    className="flex-shrink-0 ml-4 rounded-lg bg-emerald-700 dark:bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-emerald-800 dark:hover:bg-emerald-500 transition-colors disabled:opacity-60"
                  >
                    {compiling ? "Compiling..." : "Generate"}
                  </button>
                </div>
              )}

              {/* Signup reminder — shown when interview is complete but user isn't signed in */}
              {!hasGaps && !waiting && authUser === null && (
                <div className="mb-4 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 px-4 py-3">
                  <p className="text-sm text-emerald-800 dark:text-emerald-200">
                    <strong>Your interview is complete.</strong>{" "}
                    Create a free account to save your results and link them to your profile — it only takes a minute.
                  </p>
                  <a
                    href="/signup"
                    className="mt-2 inline-block rounded-lg bg-emerald-700 dark:bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-emerald-800 dark:hover:bg-emerald-500 transition-colors"
                  >
                    Create account →
                  </a>
                </div>
              )}

              {/* Text input */}
              {hasGaps && (
                <div className="flex gap-2 items-end">
                  <textarea
                    ref={inputRef}
                    rows={1}
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={waiting ? "ALVIRA is thinking..." : "Type your answer...  (Shift+Enter for a new line)"}
                    disabled={waiting}
                    enterKeyHint="enter"
                    aria-label="Your answer"
                    className="flex-1 resize-none rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-emerald-500 dark:focus:border-emerald-400 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500/40 dark:focus-visible:ring-emerald-400/40 disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-400 dark:disabled:text-gray-500 max-h-40 overflow-y-auto"
                  />
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={!answer.trim() || waiting}
                    aria-label="Send answer"
                    className="flex-shrink-0 flex h-[46px] w-[46px] items-center justify-center rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-emerald-500/50 dark:focus-visible:ring-emerald-400/50"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
        <SignupPromptBanner show={authUser === null} />
        <TrustFooter />
      </div>
    );
  }

  // ── Render: Seed Review Screen (upload → claim review → seed) ──
  if (screen === "seed-review" && extraction) {
    const reviewOffering = seedOfferingRef.current;
    const reviewGraph = reviewOffering === "meos"
      ? (isPreview ? getMeosPreviewGraph() : getMeosGraph())
      : getKnowledgeGraph(tier);
    const claims = extraction.claims;
    const grouped = new Map<string, { claim: (typeof claims)[number]; index: number }[]>();
    claims.forEach((claim, index) => {
      const list = grouped.get(claim.domainId) ?? [];
      list.push({ claim, index });
      grouped.set(claim.domainId, list);
    });
    const orderedGroups = reviewGraph
      .filter((d) => grouped.has(d.id))
      .map((d) => ({ domain: d, items: grouped.get(d.id)! }));
    const decisionFor = (index: number) =>
      seedDecisions[index] ?? { status: claims[index].confidence >= 0.8 ? "agree" : "skip" };
    const approvedCount = claims.filter((_, i) => decisionFor(i).status !== "skip").length;
    const skippedCount = claims.length - approvedCount;
    const uncoveredLabels = extraction.uncoveredDomains
      .map((id) => reviewGraph.find((d) => d.id === id)?.label ?? id)
      .slice(0, 8);
    const setDecision = (index: number, status: "agree" | "revise" | "skip") =>
      setSeedDecisions((x) => ({ ...x, [index]: { status, text: x[index]?.text } }));
    const abandonUpload = () => {
      setScreen("start");
      setExtraction(null);
      setSeedDecisions({});
      setUploadError("");
    };

    return (
      <div className="min-h-dvh flex flex-col">
        <Header />
        <AuthPromptBanner show={authUser === null} />
        {limitBanner && <UpgradeBanner reason={limitBanner} email={authUser?.email} />}
        {limitModal && <UpgradeModal onClose={() => setLimitModal(null)} reason={limitModal} email={authUser?.email} />}
        <main id="main-content" className="flex-1 px-6 py-10">
          <div className="mx-auto w-full max-w-3xl">
            <button
              type="button"
              onClick={abandonUpload}
              className="mb-6 font-mono text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              ← Back
            </button>

            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Review what was extracted</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {extraction.summary || (seedSource === "profile" ? "Here's what your other ALVIRA profile already knows." : "Here's what your document contained.")} Approve, revise, or skip each claim — only approved claims are carried into your interview.
            </p>

            {/* Summary strip */}
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3">
                <div className="font-mono text-2xl font-bold text-emerald-700 dark:text-emerald-400">{claims.length}</div>
                <div className="mt-0.5 font-mono text-xs text-gray-500 dark:text-gray-400">{seedSource === "profile" ? "carry-over proposals" : "claims extracted"}</div>
              </div>
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3">
                <div className="font-mono text-2xl font-bold text-gray-900 dark:text-gray-100">{orderedGroups.length}</div>
                <div className="mt-0.5 font-mono text-xs text-gray-500 dark:text-gray-400">domains covered</div>
              </div>
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3">
                <div className="font-mono text-2xl font-bold text-amber-700 dark:text-amber-400">{extraction.uncoveredDomains.length}</div>
                <div className="mt-0.5 font-mono text-xs text-gray-500 dark:text-gray-400">domains not in document</div>
              </div>
            </div>

            {uncoveredLabels.length > 0 && (
              <p className="mt-3 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                {seedSource === "profile" ? "Your other profile doesn't cover" : "Your document doesn't cover"}:{" "}
                <span className="text-gray-700 dark:text-gray-300">{uncoveredLabels.join(", ")}</span>. These will be asked in the interview.
              </p>
            )}

            {/* Claim groups by domain */}
            <div className="mt-6 space-y-4">
              {orderedGroups.length === 0 && (
                <p className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                  Nothing maps cleanly into this experience yet. Continue to start a fresh interview.
                </p>
              )}
              {orderedGroups.map(({ domain, items }) => (
                <div key={domain.id} className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                  <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 px-4 py-2.5">
                    <span className="font-mono text-xs font-semibold text-emerald-700 dark:text-emerald-400">{domain.label}</span>
                    <span className="font-mono text-[10px] text-gray-500 dark:text-gray-400">&lt;{domain.id} /&gt;</span>
                  </div>
                  <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {items.map(({ claim, index }) => {
                      const decision = decisionFor(index);
                      const highConf = claim.confidence >= 0.8;
                      return (
                        <div key={index} className="px-4 py-3.5">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm leading-relaxed text-gray-800 dark:text-gray-200">{claim.text}</p>
                            <span className={`flex-shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] ${
                              highConf
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                                : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                            }`}>
                              {highConf ? `high · ${Math.round(claim.confidence * 100)}%` : `verify · ${Math.round(claim.confidence * 100)}%`}
                            </span>
                          </div>
                          {claim.evidence && (
                            <p className="mt-1.5 font-mono text-[10px] leading-relaxed text-gray-500 dark:text-gray-400">
                              evidence: “{claim.evidence}”
                            </p>
                          )}
                          <div className="mt-2.5 flex flex-wrap gap-1.5">
                            {([["agree", "✓ Agree"], ["revise", "✎ Revise"], ["skip", "⏭ Skip"]] as const).map(([s, label]) => (
                              <button
                                key={s}
                                type="button"
                                onClick={() => setDecision(index, s)}
                                className={`rounded border px-2 py-1 font-mono text-xs transition-colors ${
                                  decision.status === s
                                    ? s === "agree"
                                      ? "border-emerald-600 dark:border-emerald-400 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40"
                                      : s === "revise"
                                        ? "border-amber-600 dark:border-amber-400 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40"
                                        : "border-gray-500 dark:border-gray-400 text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-900"
                                    : "border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500"
                                }`}
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                          {decision.status === "revise" && (
                            <textarea
                              value={decision.text ?? claim.text}
                              onChange={(ev) => setSeedDecisions((x) => ({ ...x, [index]: { status: "revise", text: ev.target.value } }))}
                              rows={2}
                              autoFocus
                              className="mt-2 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-2.5 text-sm text-gray-900 dark:text-gray-100 focus:border-emerald-500 dark:focus:border-emerald-400 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500/40 dark:focus-visible:ring-emerald-400/40"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer actions */}
            <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-4 py-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                {approvedCount} approved · {skippedCount} skipped
                {approvedCount > 0 && (
                  <span className="block mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    Approved claims seed your interview as high-confidence answers — remaining domains are asked normally.
                  </span>
                )}
              </p>
              <div className="flex gap-2 flex-shrink-0">
                <button type="button" onClick={abandonUpload} className={btnSecondary}>
                  Start fresh
                </button>
                <button type="button" onClick={handleSeedContinue} disabled={waiting} className={btnPrimary}>
                  {waiting ? "Starting interview..." : "Continue to interview →"}
                </button>
              </div>
            </div>
          </div>
        </main>
        <SignupPromptBanner show={authUser === null} />
        <TrustFooter />
      </div>
    );
  }

  // ── Render: Start Screen ──
  return (
    <div className="min-h-dvh flex flex-col">
      <Header />
      <AuthPromptBanner show={authUser === null} />
      {limitBanner && <UpgradeBanner reason={limitBanner} email={authUser?.email} />}
      {limitModal && <UpgradeModal onClose={() => setLimitModal(null)} reason={limitModal} email={authUser?.email} />}
      <main id="main-content" className="flex-1 flex items-center justify-center px-6 py-12">
        <div className={`mx-auto w-full ${offering === "context" ? "max-w-5xl" : "max-w-lg"}`}>
          {resumeDraft && (
            <section aria-labelledby="resume-heading" className="mb-8 rounded-xl border border-emerald-300 bg-emerald-50 p-5 dark:border-emerald-800 dark:bg-emerald-950/30 sm:p-6">
              <p className="font-mono text-xs uppercase tracking-wide text-emerald-700 dark:text-emerald-400">Saved progress found</p>
              <h1 id="resume-heading" className="mt-2 text-xl font-semibold text-gray-900 dark:text-gray-100">Continue your previous interview?</h1>
              <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                {resumeDraft.topic} · {resumeDraft.state.history.filter((message) => message.role === "user").length} answers saved {resumeDraft.source === "browser" ? "in this browser" : "to your account"}.
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <button type="button" onClick={handleResumeDraft} className="inline-flex min-h-11 items-center justify-center rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-800 focus-visible:ring-2 focus-visible:ring-emerald-500/50 dark:bg-emerald-600 dark:hover:bg-emerald-500">
                  Resume interview
                </button>
                <button type="button" onClick={() => void handleStartOver()} className="inline-flex min-h-11 items-center justify-center rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:border-gray-500 hover:text-gray-900 focus-visible:ring-2 focus-visible:ring-emerald-500/50 dark:border-gray-700 dark:text-gray-300 dark:hover:border-gray-500 dark:hover:text-gray-100">
                  Start a new interview
                </button>
              </div>
            </section>
          )}
          <div className="mb-8 flex flex-col items-center gap-2">
            <div role="group" aria-label="What do you want to build?" className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1 dark:border-gray-700 dark:bg-gray-800/60">
              <button type="button" onClick={() => handleChooseOffering("context")} aria-pressed={offering === "context"} className={"rounded-md px-4 py-2 font-mono text-xs font-semibold transition " + (offering === "context" ? "bg-emerald-700 text-white" : "text-gray-600 hover:text-emerald-700 dark:text-gray-300 dark:hover:text-emerald-400")}>AI Context Profile</button>
              <button type="button" onClick={() => handleChooseOffering("meos")} aria-pressed={offering === "meos"} className={"rounded-md px-4 py-2 font-mono text-xs font-semibold transition " + (offering === "meos" ? "bg-emerald-700 text-white" : "text-gray-600 hover:text-emerald-700 dark:text-gray-300 dark:hover:text-emerald-400")}>ALVIRA Reflect</button>
            </div>
            <p className="font-mono text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">What would you like to build?</p>
          </div>

          <div className="text-center mb-8">
            {!resumeDraft && <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
              {offering === "meos" ? "Build your living reflection" : "Build your AI profile"}
            </h1>}
            <p className="text-gray-600 dark:text-gray-400">
              {offering === "meos"
                ? "A guided interview that captures your values, patterns, goals, and direction — then compiles them into a private integrated portrait and decision companion."
                : "Get a useful starter profile in about 10–15 minutes. You can deepen it over time, inspect every file, and use it across your AI tools."
              }
            </p>
          </div>

          {/* Offering selection */}
          {offering !== "meos" && <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50/60 p-4 text-sm leading-relaxed text-gray-700 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-gray-300">
            <strong className="text-gray-900 dark:text-gray-100">What you&apos;ll get:</strong> five editable Markdown files covering who you are, how you decide, what you need, your boundaries, and how you work.
            <span className="mt-2 block font-mono text-xs text-gray-500 dark:text-gray-400">Looking for personal reflection, alignment, and decision support? <a href="/meos" className="underline underline-offset-2 hover:text-emerald-700 dark:hover:text-emerald-400">Explore ALVIRA Reflect →</a></span>
          </div>}
          {offering === "meos" && <p className="mb-5 rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 p-3 text-sm leading-relaxed text-gray-700 dark:text-gray-300">Build a living reflection of what you know, value, and are becoming. ALVIRA Reflect turns your values, patterns, goals, professional history, and optional self-knowledge frameworks into an evolving source of clarity for personal and professional decisions.</p>}
          {offering === "meos" && isPreview && <div className="mb-5 rounded-lg border border-amber-300/60 bg-amber-50 p-3 text-sm leading-relaxed text-gray-700 dark:border-amber-700 dark:bg-amber-950/30 dark:text-gray-300"><strong>You&#39;re in the free ALVIRA Reflect preview — 3 of 12 domains.</strong> It gives you a taste of the experience. Upgrade to standalone Reflect Build ($149 one-time) for your full integrated portrait, purpose statements, decision compass, daily alignment, and optional frameworks. <a href="/meos#pricing-heading" className="font-mono text-xs font-semibold text-amber-700 underline dark:text-amber-400">Upgrade to Reflect Build →</a></div>}

          {/* Topic input */}
          {offering && <div className={offering === "context" ? "grid grid-cols-1 gap-8 md:grid-cols-[3fr_2fr] md:items-start" : "space-y-8"}>
            <div className="space-y-5">
            <div>
              <label className="block font-mono text-xs text-emerald-500 dark:text-emerald-400 tracking-wide uppercase mb-1.5">
                {offering === "meos" ? "Describe your current chapter in your own words" : "What should your AI know about you?"}
              </label>
              {offering === "meos" && <input
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-emerald-500 dark:focus:border-emerald-400 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500/40 dark:focus-visible:ring-emerald-400/40"
                placeholder={'e.g. "I\'m navigating a career transition and need clarity on my direction"'}
                value={topic}
                onChange={(e) => { setTopic(e.target.value); setStartError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleStart()}
                autoFocus
              />}
              {startError && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">{startError}</p>
              )}

              {/* Chapter suggestions */}
              {offering === "meos" && (
                <fieldset className="mt-3 space-y-1">
                  <legend className="font-mono text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
                    Which themes apply? <span className="normal-case tracking-normal text-gray-500 dark:text-gray-400">(choose any)</span>
                  </legend>
                  {["Navigating a career pivot", "Starting something new", "Rebuilding after a setback", "Deep in a growth phase", "Feeling stuck and seeking direction"].map((suggestion) => (
                    <label key={suggestion} className="flex items-start gap-2 rounded px-1 py-1 font-mono text-xs leading-relaxed text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800">
                      <input
                        type="checkbox"
                        checked={chapterSuggestions.includes(suggestion)}
                        onChange={() => {
                          const next = chapterSuggestions.includes(suggestion)
                            ? chapterSuggestions.filter(s => s !== suggestion)
                            : [...chapterSuggestions, suggestion];
                          setChapterSuggestions(next);
                          setStartError("");
                        }}
                        className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-emerald-600"
                      />
                      <span>{suggestion}</span>
                    </label>
                  ))}
                </fieldset>
              )}

              {/* Tier — locked to Personal for public launch */}
              {offering === "context" && (
                <p className="font-mono text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Team and enterprise coming soon. <a href="/team" className="underline hover:text-gray-600 dark:hover:text-gray-300">Join the pilot →</a>
                </p>
              )}

              {/* Example topic suggestions */}
              {offering === "context" && (
                <fieldset className="mt-3 space-y-3">
                  <legend className="font-mono text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Examples of what ALVIRA helps you uncover (select all that apply)
                  </legend>
                  {TOPIC_GROUPS.map((group) => {
                    const groupLocked = Boolean(activeGroup && activeGroup.label !== group.label);
                    return (
                    <div key={group.label} className="space-y-1.5">
                      <p className="font-mono text-xs text-emerald-600 dark:text-emerald-400">{group.label}</p>
                      <div className="space-y-1">
                        {group.topics.map((topicOption) => (
                          <label key={topicOption} className={`flex items-start gap-2 rounded px-1 py-1 font-mono text-xs leading-relaxed text-gray-700 dark:text-gray-300 ${groupLocked ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"}`}>
                            <input
                              type="checkbox"
                              checked={selectedTopics.includes(topicOption)}
                              disabled={groupLocked}
                              onChange={(e) => {
                                const nextTopics = e.target.checked
                                  ? [...selectedTopics, topicOption]
                                  : selectedTopics.filter((item) => item !== topicOption);
                                setSelectedTopics(nextTopics);
                                setTopic([...nextTopics, ...(customTopic.trim() ? [customTopic.trim()] : [])].join(", "));
                                setStartError("");
                                const selectedGroups = TOPIC_GROUPS.filter((candidate) => candidate.topics.some((item) => nextTopics.includes(item)));
                                if (selectedGroups.length === 1) setTier(selectedGroups[0].tier);
                              }}
                              className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-emerald-600"
                            />
                            <span>{topicOption}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    );
                    })}
                    <label className="flex items-center gap-2 pt-1 font-mono text-xs text-gray-500 dark:text-gray-400">
                    <span className="text-emerald-600 dark:text-emerald-400">+</span>
                    <input
                      type="text"
                      value={customTopic}
                      onChange={(e) => {
                        const value = e.target.value;
                        setCustomTopic(value);
                        setTopic([...selectedTopics, ...(value.trim() ? [value.trim()] : [])].join(", "));
                        setStartError("");
                      }}
                      placeholder="Add your own topic..."
                      autoFocus
                      className="min-w-0 flex-1 border-b border-gray-200 bg-transparent py-1 text-xs text-gray-900 outline-none placeholder:text-gray-500 focus:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500/40 dark:border-gray-700 dark:text-gray-100 dark:placeholder:text-gray-400 dark:focus:border-emerald-400 dark:focus-visible:ring-emerald-400/40"
                    />
                  </label>
                </fieldset>
              )}
            </div>

            {authUser && <div className="text-center"><a href="/dashboard" className="font-mono text-sm text-emerald-700 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300 underline">Or resume a saved profile →</a></div>}

            {/* Start button */}
            <button
              type="button"
              onClick={handleStart}
              disabled={offering !== "meos" && !topic.trim()}
              className="w-full rounded-lg bg-emerald-700 dark:bg-emerald-600 px-6 py-3.5 text-base font-semibold text-white hover:bg-emerald-800 dark:hover:bg-emerald-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-emerald-500/50 dark:focus-visible:ring-emerald-400/50"
            >
              {offering === "meos" ? "Start my Reflect interview" : "Start interview"}
            </button>

            {/* Upload-to-seed option */}
            {(offering === "context" || offering === "meos") && (
              <div className="pt-2">
                <div className="flex items-center gap-3">
                  <span className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
                  <span className="font-mono text-[10px] uppercase tracking-widest text-gray-500 dark:text-gray-400">or start from a document</span>
                  <span className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
                </div>
                <div className="mt-4 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 px-4 py-4">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{offering === "meos" ? "Upload a journal, self-assessment, or coaching notes" : "Upload a resume, bio, or notes"}</p>
                  <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                    ALVIRA extracts what it can from a .txt, .md, or .docx file — you review the claims, then the interview only asks about what's missing. Your file is never stored.
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <input ref={fileInputRef} type="file" accept=".txt,.md,.docx" className="hidden" onChange={handleFileChange} />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading || !topic.trim()}
                      className="rounded-lg border border-emerald-600 dark:border-emerald-500 px-4 py-2 font-mono text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-emerald-500/50 dark:focus-visible:ring-emerald-400/50"
                    >
                      {uploading ? "Extracting knowledge…" : "Choose file…"}
                    </button>
                    <span className="font-mono text-[10px] text-gray-500 dark:text-gray-400">.txt · .md · .docx · max 5MB</span>
                  </div>
                  {uploadError && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{uploadError}</p>}
                </div>
              </div>
            )}
            </div>

            {offering === "context" && (
              <aside className="rounded-lg border border-gray-200 bg-gray-50 p-5 dark:border-gray-700 dark:bg-gray-800/50">
                <div className="mb-5">
                  <span className="font-mono text-xs font-semibold tracking-wide text-emerald-700 dark:text-emerald-400">&lt;output-files /&gt;</span>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Five focused files give your AI the context it needs to work with you.</p>
                </div>
                <div className="space-y-5">
                  <div>
                    <div className="font-mono text-sm font-bold text-gray-900 dark:text-gray-100">overview.md <span className="font-sans font-normal italic text-gray-700 dark:text-gray-300">— Who you are</span></div>
                    <p className="mt-1 text-xs leading-relaxed text-gray-600 dark:text-gray-400">Your identity, background, goals, key relationships, and communication style. This is the file your AI reads first to understand context.</p>
                    <p className="mt-1.5 text-[11px] leading-relaxed text-gray-500 dark:text-gray-400"><span className="font-semibold">Examples:</span> “My communication style and decision-making process”; “My key relationships and how I collaborate with others”</p>
                  </div>
                  <div>
                    <div className="font-mono text-sm font-bold text-gray-900 dark:text-gray-100">requirements.md <span className="font-sans font-normal italic text-gray-700 dark:text-gray-300">— What you need to know</span></div>
                    <p className="mt-1 text-xs leading-relaxed text-gray-600 dark:text-gray-400">Domain knowledge, specialized terminology, and frequently asked questions. Helps AI use the right vocabulary and understand your field.</p>
                    <p className="mt-1.5 text-[11px] leading-relaxed text-gray-500 dark:text-gray-400"><span className="font-semibold">Examples:</span> “Key concepts and terminology from my field of work”; “Our team’s development standards and code review process”</p>
                  </div>
                  <div>
                    <div className="font-mono text-sm font-bold text-gray-900 dark:text-gray-100">constraints.md <span className="font-sans font-normal italic text-gray-700 dark:text-gray-300">— What won’t change</span></div>
                    <p className="mt-1 text-xs leading-relaxed text-gray-600 dark:text-gray-400">Your boundaries, non-negotiables, limitations, and explicit unknowns. Tells AI what not to do and what assumptions need verification.</p>
                    <p className="mt-1.5 text-[11px] leading-relaxed text-gray-500 dark:text-gray-400"><span className="font-semibold">Examples:</span> “My values, boundaries, and what I won’t compromise on”; “Our organization’s compliance rules and security policies”</p>
                  </div>
                  <div>
                    <div className="font-mono text-sm font-bold text-gray-900 dark:text-gray-100">business-rules.md <span className="font-sans font-normal italic text-gray-700 dark:text-gray-300">— How you decide</span></div>
                    <p className="mt-1 text-xs leading-relaxed text-gray-600 dark:text-gray-400">Your decision frameworks, priorities, and how you evaluate tradeoffs. Gives AI your rulebook for making judgment calls.</p>
                    <p className="mt-1.5 text-[11px] leading-relaxed text-gray-500 dark:text-gray-400"><span className="font-semibold">Examples:</span> “My goals, priorities, and how I evaluate tradeoffs”; “Our department’s approval chains and decision thresholds”</p>
                  </div>
                  <div>
                    <div className="font-mono text-sm font-bold text-gray-900 dark:text-gray-100">workflows.md <span className="font-sans font-normal italic text-gray-700 dark:text-gray-300">— How you work</span></div>
                    <p className="mt-1 text-xs leading-relaxed text-gray-600 dark:text-gray-400">Your processes, daily routines, tools, and recurring workflows. Helps AI understand your operational context.</p>
                    <p className="mt-1.5 text-[11px] leading-relaxed text-gray-500 dark:text-gray-400"><span className="font-semibold">Examples:</span> “My daily routines, habits, and personal workflows”; “Our cross-department workflows and vendor relationships”</p>
                  </div>
                </div>
              </aside>
            )}

            {offering === "meos" && (
              <aside className="rounded-lg border border-gray-200 bg-gray-50 p-5 dark:border-gray-700 dark:bg-gray-800/50">
                <div className="mb-5">
                  <span className="font-mono text-xs font-semibold tracking-wide text-emerald-700 dark:text-emerald-400">&lt;output-files /&gt;</span>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Your interview produces these files — a living, reviewable reflection grounded in what you shared.</p>
                </div>
                <div className="space-y-5">
                  <div>
                    <div className="font-mono text-sm font-bold text-gray-900 dark:text-gray-100">portrait.md <span className="font-sans font-normal italic text-gray-700 dark:text-gray-300">— Your integrated portrait</span></div>
                    <p className="mt-1 text-xs leading-relaxed text-gray-600 dark:text-gray-400">A cohesive narrative of who you are right now — your current chapter, values, desired outcomes, and what drives you.</p>
                  </div>
                  <div>
                    <div className="font-mono text-sm font-bold text-gray-900 dark:text-gray-100">purpose-statements.md <span className="font-sans font-normal italic text-gray-700 dark:text-gray-300">— Personal &amp; professional purpose</span></div>
                    <p className="mt-1 text-xs leading-relaxed text-gray-600 dark:text-gray-400">Clear articulations of what you're here to do, both personally and professionally. Gives AI your "why."</p>
                  </div>
                  <div>
                    <div className="font-mono text-sm font-bold text-gray-900 dark:text-gray-100">boundaries.md <span className="font-sans font-normal italic text-gray-700 dark:text-gray-300">— Your non-negotiables</span></div>
                    <p className="mt-1 text-xs leading-relaxed text-gray-600 dark:text-gray-400">What you won't compromise on, your limits, and how you protect your energy and focus.</p>
                  </div>
                  <div>
                    <div className="font-mono text-sm font-bold text-gray-900 dark:text-gray-100">decision-compass.md <span className="font-sans font-normal italic text-gray-700 dark:text-gray-300">— How you decide</span></div>
                    <p className="mt-1 text-xs leading-relaxed text-gray-600 dark:text-gray-400">Your decision-making framework — the questions to ask yourself when facing a crossroad. Your personal compass.</p>
                  </div>
                  <div>
                    <div className="font-mono text-sm font-bold text-gray-900 dark:text-gray-100">career-tools.md <span className="font-sans font-normal italic text-gray-700 dark:text-gray-300">— Career alignment</span></div>
                    <p className="mt-1 text-xs leading-relaxed text-gray-600 dark:text-gray-400">Insights about your professional path, strengths, and how your work aligns with your purpose and values.</p>
                  </div>
                  <div>
                    <div className="font-mono text-sm font-bold text-gray-900 dark:text-gray-100">source-trace.md <span className="font-sans font-normal italic text-gray-700 dark:text-gray-300">— Where each claim came from</span></div>
                    <p className="mt-1 text-xs leading-relaxed text-gray-600 dark:text-gray-400">Full transparency: which statements came from you directly, which were inferred, and which you self-validated.</p>
                  </div>
                </div>
              </aside>
            )}
          </div>}
        </div>
      </main>
      <SignupPromptBanner show={authUser === null} />
    </div>
  );
}

// ── Style constants ──
const btnPrimary =
  "inline-flex items-center gap-2 rounded-lg bg-emerald-700 dark:bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 dark:hover:bg-emerald-500 transition-colors";
const btnSecondary =
  "inline-flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors";
