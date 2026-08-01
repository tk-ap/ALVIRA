import { createFileRoute } from "@tanstack/react-router";
import { marked } from "marked";
import { useEffect, useMemo, useRef, useState } from "react";
import JSZip from "jszip";

import { Header } from "~/components/Header";
import { FrameworkSelector, BirthDataForm, ReviewPanel, ValidationCard, FRAMEWORKS, type FrameworkId } from "~/components/MeosOverlays";
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
import { getMeosGraph, getMeosPlaybook } from "./-meosGraph";
import { compileMeosKnowledge, generatePortrait, type MeosPortrait } from "./-meosCompiler";
import { getCurrentUser, saveProfile, saveMeosPortrait, loadProfile, trackInterview, fetchUserLimits } from "./-auth";

// ── Initialize empty interview state ──
function createInitialState(tier: Tier, topic: string, offering: "context" | "meos" = "context"): InterviewState {
  const graph = offering === "meos" ? getMeosGraph() : getKnowledgeGraph(tier);
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
      <div className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-bold">
        A
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
  { key: "overview", label: "overview.md" },
  { key: "requirements", label: "requirements.md" },
  { key: "constraints", label: "constraints.md" },
  { key: "businessRules", label: "business-rules.md" },
  { key: "workflows", label: "workflows.md" },
] as const;

const TIERS: { value: Tier; label: string; description: string }[] = [
  { value: "personal", label: "Personal", description: "Personal knowledge & preferences" },
  { value: "team", label: "Team", description: "Department or small business" },
  { value: "enterprise", label: "Enterprise", description: "Organization-wide" },
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
  {
    label: "For teams",
    tier: "team" as const,
    topics: [
      "How our support team handles customer escalations",
      "Our team's development standards and code review process",
      "Our department's approval chains and decision thresholds",
      "Our organization's compliance rules and security policies",
      "Our cross-department workflows and vendor relationships",
    ],
  },
] as const;

const STRIPE_LINKS = {
  pro: "https://buy.stripe.com/5kQdR97xU0dJ3b30Ref7i02",
  lifetime: "https://buy.stripe.com/cNi6oH7xUbWr5jb2Zmf7i03",
};

// ── Page ──
export const Route = createFileRoute("/app")({
  validateSearch: (search: Record<string, unknown>) => ({ offering: search.offering === "meos" ? "meos" as const : undefined }),
  component: AppPage,
});

// ── Auth prompt banner ──
function AuthPromptBanner({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="border-b border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950 px-6 py-2.5">
      <p className="text-sm text-amber-800 dark:text-amber-200 text-center font-mono">
        Sign in to save your interview progress.{" "}
        <a href="/login" className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300 underline underline-offset-2 transition-colors">
          Sign in →
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
        <div className="flex gap-2 flex-shrink-0">
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
            className="rounded-lg border border-amber-500 dark:border-amber-400 px-4 py-1.5 font-mono text-xs font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950 transition-colors"
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
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Upgrade to continue</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-5 font-mono">
          {reason === "profiles"
            ? "Free accounts can save 1 profile. Upgrade to Pro or Lifetime for unlimited profiles."
            : "Free accounts are limited to 3 interviews. Upgrade for unlimited interviews."}
        </p>
        <div className="space-y-3">
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
            className="block w-full text-center rounded-lg border border-amber-500 dark:border-amber-400 px-4 py-2.5 font-mono text-sm font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950 transition-colors"
          >
            Go Lifetime — $199 once
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
  // Screen state: "start" | "interview" | "output" | "api-error"
  const [screen, setScreen] = useState<"start" | "interview" | "output" | "api-error">("start");

  // Start screen state
  const [topic, setTopic] = useState("");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [customTopic, setCustomTopic] = useState("");
  const [tier, setTier] = useState<Tier>("personal");
  // A single active topic group locks the other group. Enterprise selects both,
  // so both groups remain available for that scope.
  const selectedGroups = TOPIC_GROUPS.filter((group) => group.topics.some((topicOption) => selectedTopics.includes(topicOption)));
  const activeGroup = selectedGroups.length === 1 ? selectedGroups[0] : null;
  const { offering: offeringSearch } = Route.useSearch();
  const [offering, setOffering] = useState<"context" | "meos" | null>(offeringSearch === "meos" ? "meos" : null);
  type MeosPhase = "core" | "frameworks" | "birthData" | "review" | "validation" | "compile";
  const [meosPhase, setMeosPhase] = useState<MeosPhase>("core");

  // Interview state (the single source of truth)
  const [state, setState] = useState<InterviewState | null>(null);
  const [answer, setAnswer] = useState("");
  const [waiting, setWaiting] = useState(false);
  const [interviewError, setInterviewError] = useState("");
  const [startError, setStartError] = useState("");

  // Output state
  const [generated, setGenerated] = useState<Record<string, string> | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [compiling, setCompiling] = useState(false);
  const [copyMsg, setCopyMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedProfileId, setSavedProfileId] = useState<string | null>(null);
  const [meosPortrait, setMeosPortrait] = useState<MeosPortrait | null>(null);
  const [portraitError, setPortraitError] = useState(false);

  // Auth state
  const [authUser, setAuthUser] = useState<{ id: string; email: string; tier: string } | null | undefined>(undefined);

  // Limit state
  const [limitBanner, setLimitBanner] = useState<"profiles" | "interviews" | null>(null);
  const [limitModal, setLimitModal] = useState<"profiles" | "interviews" | null>(null);
  const [interviewCount, setInterviewCount] = useState(0);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Computed values
  const graph = state ? (offering === "meos" ? getMeosGraph() : getKnowledgeGraph(state.tier)) : [];
  const playbook = offering === "meos" ? getMeosPlaybook() : (state ? getPlaybook(state.tier) : getPlaybook("personal"));
  const confThreshold = playbook.completion.minimumConfidence;
  const coveredCount = state ? countCovered(graph, state, confThreshold) : 0;
  const totalDomains = graph.length;
  const gaps = state ? detectGaps(graph, state, confThreshold) : [];
  const hasGaps = gaps.length > 0;
  const requiredCovered = state ? allRequiredCovered(graph, state, confThreshold) : false;

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

  // Check auth state, resume profile, and fetch limits
  useEffect(() => {
    let cancelled = false;
    getCurrentUser().then(async (u) => {
      if (cancelled) return;
      if (u) {
        setAuthUser({ id: u.id, email: u.email, tier: u.tier });
        setInterviewCount(u.interviewCount ?? 0);

        // Fetch detailed limits for the banner
        try {
          const limits = await fetchUserLimits();
          if (!cancelled) {
            const lim = limits as { tier: string; interviewCount: number; profileCount: number; maxInterviews: number; maxProfiles: number };
            if (lim.tier === "free" && lim.interviewCount >= lim.maxInterviews) {
              setLimitBanner("interviews");
            }
          }
        } catch { /* ignore */ }

        const profileId = new URLSearchParams(window.location.search).get("profile");
        if (profileId) {
          try {
            const profile = await loadProfile({ data: { profileId } });
            if (!cancelled) {
              setTopic(profile.topic);
              setTier(profile.tier as Tier);
              setState(profile.state as InterviewState);
              setScreen("interview");
            }
          } catch { /* dashboard remains the fallback */ }
        }
      } else {
        setAuthUser(null);
      }
    }).catch(() => {
      if (!cancelled) setAuthUser(null);
    });
    return () => { cancelled = true; };
  }, []);

  // ── Ask next question (picks top gap, calls LLM for phrasing) ──
  const askNextQuestion = async (currentState: InterviewState, isClarification = false) => {
    const currentGraph = offering === "meos" ? getMeosGraph() : getKnowledgeGraph(currentState.tier);
    const currentPlaybook = offering === "meos" ? getMeosPlaybook() : getPlaybook(currentState.tier);
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
      const result = await saveProfile({ data: { topic: state.topic, tier: state.tier, state, portrait: offering === "meos" ? meosPortrait : undefined } });
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
    const trimmed = topic.trim();
    if (!trimmed) return;

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

    setStartError("");
    setScreen("interview");
    setWaiting(true);
    setInterviewError("");

    const initialState = createInitialState(tier, topic.trim(), offering === "meos" ? "meos" : "context");

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

  const handleSend = async () => {
    const trimmed = answer.trim();
    if (!trimmed || waiting || !state) return;

    const currentDomain = state.currentDomain;

    const newHistory: Message[] = [...state.history, { role: "user", content: trimmed }];

    let updatedDomains = { ...state.domains };
    let needsClarify = false;

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
          if (authUser.tier === "free" && r.interviewCount >= 3) {
            setLimitBanner("interviews");
          }
        }
      } catch {
        // If tracking fails (e.g., not logged in), proceed anyway
      }
    }

    setCompiling(true);
    const currentGraph = offering === "meos" ? getMeosGraph() : getKnowledgeGraph(compileState.tier);
    let files: Record<string, string>;
    if (offering === "meos") {
      files = { ...compileMeosKnowledge(compileState, currentGraph).allFiles };
      setPortraitError(false);
      try {
        const result = await generatePortrait(compileState);
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
    setCompiling(false);
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
      : [["overview.md", generated.overview], ["requirements.md", generated.requirements], ["constraints.md", generated.constraints], ["business-rules.md", generated.businessRules], ["workflows.md", generated.workflows]];
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

  const startNew = () => {
    setTopic("");
    setSelectedTopics([]);
    setCustomTopic("");
    setTier("personal");
    setOffering(null);
    setMeosPhase("core");
    setState(null);
    setAnswer("");
    setGenerated(null);
    setMeosPortrait(null);
    setPortraitError(false);
    setInterviewError("");
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
        <main className="flex-1 flex items-center justify-center px-6">
          <div className="text-center max-w-md">
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30 mx-auto mb-6">
              <svg className="h-8 w-8 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">API Key Not Configured</h2>
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
        <main className="flex-1 py-8 px-6">
          <div className="mx-auto max-w-3xl">
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Generated Knowledge Files</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 font-mono">
                    based on: {state?.topic || topic}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={downloadZip} className={btnSecondary}>
                    <span className="font-mono text-xs">⬇ Download .zip</span>
                  </button>
                  {authUser && (savedProfileId ? <a href="/dashboard" className={btnSecondary}>Profile saved → View dashboard</a> : <button type="button" onClick={handleSave} disabled={saving} className={btnPrimary}>{saving ? "Saving..." : "Save Profile"}</button>)}
                  {offering === "meos" && <a href="/meos" className={btnSecondary}>View your MeOS →</a>}
                  <button type="button" onClick={startNew} className={btnPrimary}>
                    + Start new
                  </button>
                </div>
              </div>

              {offering === "meos" && portraitError && <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">Portrait generation encountered an issue. Your knowledge files are ready, and you can regenerate your portrait from your MeOS dashboard.</p>}

              {/* Tabs */}
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
            </div>
          </div>
        </main>
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
        <main className="flex-1 flex flex-col px-6">
          <div className="relative mx-auto w-full max-w-3xl flex-1 flex flex-col py-6">
            {/* Chat area */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4">
              {state?.history.map((msg, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  {/* Avatar */}
                  <div
                    className={`flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                      msg.role === "assistant"
                        ? "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                        : "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900"
                    }`}
                  >
                    {msg.role === "assistant" ? "A" : "Y"}
                  </div>
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

            {/* Progress indicator — pinned above input */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono text-xs text-gray-600 dark:text-gray-400">
                  {coveredCount} of {totalDomains} domains covered
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
                <span className="font-mono text-xs text-gray-400 dark:text-gray-500">
                  {totalDomains > 0 ? Math.round((coveredCount / totalDomains) * 100) : 0}% complete
                </span>
                <div className="flex gap-2">
                  {hasGaps && state?.currentDomain && !waiting && (
                    <button
                      type="button"
                      onClick={handleSkip}
                      className="font-mono text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors px-2 py-1"
                    >
                      Skip →
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={compiling || !state || state.history.length < 2}
                    className={`font-mono text-xs transition-colors ${
                      state && state.history.length >= 2
                        ? "text-emerald-700 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300"
                        : "text-gray-400 dark:text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    {compiling ? "Compiling..." : "Generate knowledge files →"}
                  </button>
                </div>
              </div>

              {/* Interview complete banner */}
              {!hasGaps && !waiting && (
                <div className="mb-4 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 px-4 py-3 text-sm text-green-800 dark:text-green-200 flex items-center justify-between">
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

              {/* Text input */}
              {hasGaps && (
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={waiting ? "ALVIRA is thinking..." : "Type your answer..."}
                    disabled={waiting}
                    className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-emerald-500 dark:focus:border-emerald-400 outline-none transition-colors disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-400 dark:disabled:text-gray-500"
                  />
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={!answer.trim() || waiting}
                    className="flex-shrink-0 flex h-[46px] w-[46px] items-center justify-center rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className={`mx-auto w-full ${offering === "context" ? "max-w-5xl" : "max-w-lg"}`}>
          <div className="text-center mb-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 mx-auto mb-4">
              <svg className="h-7 w-7 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-3xl">
              Knowledge Elicitation
            </h1>
            <p className="mt-3 text-gray-600 dark:text-gray-400">
              ALVIRA interviews you to capture themes, ideas, voice, and context — then compiles it into structured Markdown knowledge files transferrable between any AI model.
            </p>
          </div>

          {/* Offering selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {[
              { key: "context" as const, title: "AI Context Profile", label: "<ai-context-profile />", description: "Captures communication, decision-making, workflows, relationships, goals, values, and boundaries for use across AI agents." },
              { key: "meos" as const, title: "MeOS — Personal Alignment System", label: "<me-os />", description: "Creates an integrated portrait and private interactive companion for personal and professional alignment." },
            ].map((item) => (
              <button key={item.key} type="button" onClick={() => { setOffering(item.key); setStartError(""); }} className={`text-left rounded-lg border p-4 transition-colors ${offering === item.key ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30" : item.key === "context" ? "border-emerald-200 dark:border-emerald-800 bg-white dark:bg-gray-800 hover:border-emerald-400" : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-600"}`}>
                <div className="font-semibold text-gray-900 dark:text-gray-100">{item.title}</div>
                <div className="mt-2 font-mono text-xs text-emerald-700 dark:text-emerald-400">{item.label}</div>
                <div className="mt-2 text-xs leading-relaxed text-gray-600 dark:text-gray-400">{item.description}</div>
              </button>
            ))}
          </div>
          {offering === "meos" && <p className="mb-5 rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 p-3 text-sm leading-relaxed text-gray-700 dark:text-gray-300">Build your personal operating system. Turn your values, patterns, goals, professional history, and optional self-knowledge frameworks into a private daily companion for clearer personal and professional decisions.</p>}

          {/* Topic input */}
          {offering && <div className={offering === "context" ? "grid grid-cols-1 gap-8 md:grid-cols-[3fr_2fr] md:items-start" : "space-y-5"}>
            <div className="space-y-5">
            <div>
              <label className="block font-mono text-xs text-emerald-500 dark:text-emerald-400 tracking-wide uppercase mb-1.5">
                {offering === "meos" ? "What chapter are you in?" : "Knowledge to capture"}
              </label>
              {offering === "meos" && <input
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-emerald-500 dark:focus:border-emerald-400 outline-none transition-colors"
                placeholder={'e.g. "I\'m navigating a career transition and need clarity on my direction"'}
                value={topic}
                onChange={(e) => { setTopic(e.target.value); setStartError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleStart()}
                autoFocus
              />}
              {startError && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">{startError}</p>
              )}

              {/* Tier selector */}
              {offering === "context" && <div>
              <label className="block font-mono text-xs text-emerald-500 dark:text-emerald-400 tracking-wide uppercase mb-2">Scope</label>
                <div className="grid grid-cols-3 gap-2">
                  {TIERS.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => {
                        setTier(t.value);
                        if (t.value === "enterprise") {
                          const allTopics = TOPIC_GROUPS.flatMap(g => [...g.topics]);
                          setSelectedTopics(allTopics);
                          setCustomTopic("");
                          setTopic(allTopics.join(", "));
                        } else {
                          const group = TOPIC_GROUPS.find(g => g.tier === t.value);
                          if (group) {
                            const topics = [...group.topics];
                            setSelectedTopics(topics);
                            setCustomTopic("");
                            setTopic(topics.join(", "));
                          }
                        }
                        setStartError("");
                      }}
                      className={`rounded-lg border px-3 py-3 text-center transition-colors ${
                        tier === t.value
                          ? "border-gray-900 dark:border-gray-100 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                          : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
                      }`}
                    >
                      <div className="font-mono text-sm font-semibold">{t.label}</div>
                      <div className="text-xs mt-0.5 opacity-70">{t.description}</div>
                    </button>
                  ))}
                </div>
              </div>}

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
                      className="min-w-0 flex-1 border-b border-gray-200 bg-transparent py-1 text-xs text-gray-900 outline-none placeholder:text-gray-400 focus:border-emerald-500 dark:border-gray-700 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-emerald-400"
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
              disabled={!topic.trim()}
              className="w-full rounded-lg bg-emerald-700 dark:bg-emerald-600 px-6 py-3.5 text-base font-semibold text-white hover:bg-emerald-800 dark:hover:bg-emerald-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Start interview
            </button>
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
                    <p className="mt-1.5 text-[11px] leading-relaxed text-gray-500 dark:text-gray-500"><span className="font-semibold">Examples:</span> “My communication style and decision-making process”; “My key relationships and how I collaborate with others”</p>
                  </div>
                  <div>
                    <div className="font-mono text-sm font-bold text-gray-900 dark:text-gray-100">requirements.md <span className="font-sans font-normal italic text-gray-700 dark:text-gray-300">— What you need to know</span></div>
                    <p className="mt-1 text-xs leading-relaxed text-gray-600 dark:text-gray-400">Domain knowledge, specialized terminology, and frequently asked questions. Helps AI use the right vocabulary and understand your field.</p>
                    <p className="mt-1.5 text-[11px] leading-relaxed text-gray-500 dark:text-gray-500"><span className="font-semibold">Examples:</span> “How our support team handles customer escalations”; “Our team’s development standards and code review process”</p>
                  </div>
                  <div>
                    <div className="font-mono text-sm font-bold text-gray-900 dark:text-gray-100">constraints.md <span className="font-sans font-normal italic text-gray-700 dark:text-gray-300">— What won’t change</span></div>
                    <p className="mt-1 text-xs leading-relaxed text-gray-600 dark:text-gray-400">Your boundaries, non-negotiables, limitations, and explicit unknowns. Tells AI what not to do and what assumptions need verification.</p>
                    <p className="mt-1.5 text-[11px] leading-relaxed text-gray-500 dark:text-gray-500"><span className="font-semibold">Examples:</span> “My values, boundaries, and what I won’t compromise on”; “Our organization’s compliance rules and security policies”</p>
                  </div>
                  <div>
                    <div className="font-mono text-sm font-bold text-gray-900 dark:text-gray-100">business-rules.md <span className="font-sans font-normal italic text-gray-700 dark:text-gray-300">— How you decide</span></div>
                    <p className="mt-1 text-xs leading-relaxed text-gray-600 dark:text-gray-400">Your decision frameworks, priorities, and how you evaluate tradeoffs. Gives AI your rulebook for making judgment calls.</p>
                    <p className="mt-1.5 text-[11px] leading-relaxed text-gray-500 dark:text-gray-500"><span className="font-semibold">Examples:</span> “My goals, priorities, and how I evaluate tradeoffs”; “Our department’s approval chains and decision thresholds”</p>
                  </div>
                  <div>
                    <div className="font-mono text-sm font-bold text-gray-900 dark:text-gray-100">workflows.md <span className="font-sans font-normal italic text-gray-700 dark:text-gray-300">— How you work</span></div>
                    <p className="mt-1 text-xs leading-relaxed text-gray-600 dark:text-gray-400">Your processes, daily routines, tools, and recurring workflows. Helps AI understand your operational context.</p>
                    <p className="mt-1.5 text-[11px] leading-relaxed text-gray-500 dark:text-gray-500"><span className="font-semibold">Examples:</span> “My daily routines, habits, and personal workflows”; “Our cross-department workflows and vendor relationships”</p>
                  </div>
                </div>
              </aside>
            )}
          </div>}
        </div>
      </main>
    </div>
  );
}

// ── Style constants ──
const btnPrimary =
  "inline-flex items-center gap-2 rounded-lg bg-emerald-700 dark:bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 dark:hover:bg-emerald-500 transition-colors";
const btnSecondary =
  "inline-flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors";
