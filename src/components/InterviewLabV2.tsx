import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Header } from "~/components/Header";
import { TrustFooter } from "~/components/TrustFooter";
import {
  BASELINE_CLASSIFICATIONS,
  BASELINE_QUESTIONS,
  baselineClassificationLabel,
  buildBaselineFindings,
  buildContextClaims,
  buildInterviewBaselineFocus,
  contextHash,
  emptyBaselineResponses,
  type BaselineClassification,
  type BaselineQuestionId,
  type BaselineTool,
} from "~/lib/interview-lab-v2";
import { getCurrentUser } from "~/routes/-auth";
import {
  generateInterviewLabTurn,
  type InterviewLabPromptVersion,
} from "~/routes/-interviewLab";
import {
  getKnowledgeGraph,
  type Message,
  type Tier,
} from "~/routes/-knowledgeGraph";

type Diagnostics = {
  carriedForward: string;
  targetGap: string;
  questionPurpose: string;
};

type LabPhase =
  | "baseline"
  | "gap-map"
  | "interview"
  | "mirror"
  | "proof"
  | "report";

type ContextClaim = { id: string; value: string; approved: boolean };
type PortableContext = { version: string; hash: string; claims: string[] };
type ControlState = { update: boolean; withhold: boolean; revoke: boolean };

const phaseLabels: Record<LabPhase, string> = {
  baseline: "Baseline",
  "gap-map": "Gap map",
  interview: "Adaptive interview",
  mirror: "Context Mirror",
  proof: "Portability proof",
  report: "Context Lift report",
};

function createInitialTools(): BaselineTool[] {
  return ["ChatGPT", "Claude", "Gemini"].map((name) => ({
    id: name.toLowerCase(),
    name,
    responses: emptyBaselineResponses(),
  }));
}

function createBlankProofTools(tools: BaselineTool[]): BaselineTool[] {
  return tools.map(({ id, name }) => ({
    id,
    name,
    responses: emptyBaselineResponses(),
  }));
}

function formatStatus(status: string): string {
  return status.replaceAll("_", " ");
}

export function InterviewLabV2() {
  const [ownerAccess, setOwnerAccess] = useState<boolean | null>(null);
  const [phase, setPhase] = useState<LabPhase>("baseline");
  const [tools, setTools] = useState<BaselineTool[]>(createInitialTools);
  const [newToolName, setNewToolName] = useState("");
  const [classificationOverrides, setClassificationOverrides] = useState<
    Partial<Record<BaselineQuestionId, BaselineClassification>>
  >({});
  const [baselineSkipped, setBaselineSkipped] = useState(false);
  const [tier, setTier] = useState<Tier>("personal");
  const [userName, setUserName] = useState("");
  const promptVersion: InterviewLabPromptVersion = "lab-v2";
  const domains = useMemo(
    () => [...getKnowledgeGraph(tier)].sort((a, b) => a.priority - b.priority),
    [tier],
  );
  const [domainId, setDomainId] = useState("background");
  const [history, setHistory] = useState<Message[]>([]);
  const [answer, setAnswer] = useState("");
  const [diagnostics, setDiagnostics] = useState<Diagnostics | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [contextClaims, setContextClaims] = useState<ContextClaim[]>([]);
  const [portableContext, setPortableContext] =
    useState<PortableContext | null>(null);
  const [contextRevision, setContextRevision] = useState(1);
  const [updateNote, setUpdateNote] = useState("");
  const [updateApplied, setUpdateApplied] = useState(false);
  const [selectedToolIds, setSelectedToolIds] = useState<string[]>([]);
  const [proofTools, setProofTools] = useState<BaselineTool[]>(() =>
    createBlankProofTools(createInitialTools()),
  );
  const [proofConnected, setProofConnected] = useState(false);
  const [connectionRevoked, setConnectionRevoked] = useState(false);
  const [withheldQuestionId, setWithheldQuestionId] =
    useState<BaselineQuestionId>("constraints");
  const [withholdEvidence, setWithholdEvidence] = useState("");
  const [controls, setControls] = useState<ControlState>({
    update: false,
    withhold: false,
    revoke: false,
  });

  const findings = useMemo(
    () => buildBaselineFindings(tools, classificationOverrides),
    [tools, classificationOverrides],
  );
  const baselineFocus = useMemo(
    () => buildInterviewBaselineFocus(findings),
    [findings],
  );
  const selectedTools = tools.filter((tool) =>
    selectedToolIds.includes(tool.id),
  );
  const selectedProofTools = proofTools.filter((tool) =>
    selectedToolIds.includes(tool.id),
  );

  useEffect(() => {
    let cancelled = false;
    getCurrentUser()
      .then((user) => {
        if (!cancelled) setOwnerAccess(Boolean(user?.isOwner));
      })
      .catch(() => {
        if (!cancelled) setOwnerAccess(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!domains.some((domain) => domain.id === domainId))
      setDomainId(domains[0]?.id ?? "");
  }, [domains, domainId]);

  function resetInterview() {
    setHistory([]);
    setDiagnostics(null);
    setAnswer("");
    setError("");
  }

  async function runTurn(nextHistory: Message[], skip = baselineSkipped) {
    setBusy(true);
    setError("");
    try {
      const result = await generateInterviewLabTurn({
        data: {
          tier,
          domainId,
          history: nextHistory,
          promptVersion,
          userName,
          baselineFocus: skip ? [] : baselineFocus,
        },
      });
      setHistory([
        ...nextHistory,
        { role: "assistant", content: result.question },
      ]);
      setDiagnostics(result.diagnostics);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "The Interview Lab could not continue.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function startInterview(skipBaseline: boolean) {
    setBaselineSkipped(skipBaseline);
    setPhase("interview");
    resetInterview();
    await runTurn([], skipBaseline);
  }

  async function submitAnswer(event: FormEvent) {
    event.preventDefault();
    const content = answer.trim();
    if (!content || busy || history.length === 0) return;
    const nextHistory: Message[] = [...history, { role: "user", content }];
    setHistory(nextHistory);
    setAnswer("");
    await runTurn(nextHistory);
  }

  function updateBaselineResponse(
    toolId: string,
    questionId: BaselineQuestionId,
    value: string,
  ) {
    setTools((current) =>
      current.map((tool) =>
        tool.id === toolId
          ? { ...tool, responses: { ...tool.responses, [questionId]: value } }
          : tool,
      ),
    );
  }

  function addTool() {
    const name = newToolName.trim();
    if (
      !name ||
      tools.some((tool) => tool.name.toLowerCase() === name.toLowerCase())
    )
      return;
    const id = `tool-${Date.now()}`;
    const nextTool = { id, name, responses: emptyBaselineResponses() };
    setTools((current) => [...current, nextTool]);
    setProofTools((current) => [
      ...current,
      { ...nextTool, responses: emptyBaselineResponses() },
    ]);
    setNewToolName("");
  }

  function openGapMap() {
    setBaselineSkipped(false);
    setPhase("gap-map");
  }

  function openContextMirror() {
    const claims = buildContextClaims(history).map((value, index) => ({
      id: `answer-${index}`,
      value,
      approved: true,
    }));
    if (claims.length === 0) {
      setError(
        "Answer at least one interview question before opening the Context Mirror.",
      );
      return;
    }
    setContextClaims(claims);
    setPhase("mirror");
    setError("");
  }

  function approvePortableContext() {
    const approvedClaims = contextClaims
      .filter((claim) => claim.approved && claim.value.trim())
      .map((claim) => claim.value.trim());
    if (approvedClaims.length === 0) {
      setError("Approve or restore at least one reviewed Context claim first.");
      return;
    }
    setPortableContext({
      version: `lab-context-${contextRevision}`,
      hash: contextHash(approvedClaims),
      claims: approvedClaims,
    });
    setProofTools(createBlankProofTools(tools));
    setSelectedToolIds(
      tools
        .filter((tool) => Object.values(tool.responses).some(Boolean))
        .map((tool) => tool.id),
    );
    setProofConnected(false);
    setConnectionRevoked(false);
    setControls({ update: false, withhold: false, revoke: false });
    setUpdateApplied(false);
    setPhase("proof");
    setError("");
  }

  function toggleTool(toolId: string) {
    setSelectedToolIds((current) =>
      current.includes(toolId)
        ? current.filter((id) => id !== toolId)
        : [...current, toolId],
    );
  }

  function connectSelectedTools() {
    if (selectedToolIds.length === 0) {
      setError("Select at least one target tool for the Lab proof.");
      return;
    }
    setProofConnected(true);
    setConnectionRevoked(false);
    setError("");
  }

  function updateProofResponse(
    toolId: string,
    questionId: BaselineQuestionId,
    value: string,
  ) {
    setProofTools((current) =>
      current.map((tool) =>
        tool.id === toolId
          ? { ...tool, responses: { ...tool.responses, [questionId]: value } }
          : tool,
      ),
    );
  }

  function applyContextUpdate() {
    const note = updateNote.trim();
    if (!portableContext || !note) return;
    const claims = [...portableContext.claims, note];
    const nextRevision = contextRevision + 1;
    setContextRevision(nextRevision);
    setPortableContext({
      version: `lab-context-${nextRevision}`,
      hash: contextHash(claims),
      claims,
    });
    setUpdateNote("");
    setUpdateApplied(true);
    setControls((current) => ({ ...current, update: false }));
  }

  function recordWithheldCheck() {
    if (!withholdEvidence.trim() || !proofConnected || connectionRevoked)
      return;
    setControls((current) => ({ ...current, withhold: true }));
  }

  function revokeConnection() {
    if (!proofConnected) return;
    setConnectionRevoked(true);
    setControls((current) => ({ ...current, revoke: true }));
  }

  function buildReportRows() {
    return BASELINE_QUESTIONS.map((question) => {
      const before = selectedTools
        .map((tool) => tool.responses[question.id].trim())
        .filter(Boolean);
      const after = selectedProofTools
        .map((tool) => tool.responses[question.id].trim())
        .filter(Boolean);
      const status =
        question.id === withheldQuestionId && controls.withhold
          ? "withheld check recorded"
          : after.length > before.length
            ? "more context observed"
            : after.length < before.length
              ? "less context observed"
              : after.length > 0
                ? "similar coverage"
                : "not proven";
      return {
        ...question,
        beforeCount: before.length,
        afterCount: after.length,
        status,
        classification: findings.find(
          (finding) => finding.questionId === question.id,
        )?.classification,
      };
    });
  }

  function openReport() {
    if (!proofConnected || selectedToolIds.length === 0) {
      setError("Connect at least one Lab target before generating the report.");
      return;
    }
    setPhase("report");
    setError("");
  }

  if (ownerAccess === null)
    return (
      <div className="min-h-dvh bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100">
        <Header />
        <main className="mx-auto max-w-4xl px-6 py-20">Checking access…</main>
      </div>
    );
  if (!ownerAccess)
    return (
      <div className="min-h-dvh bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100">
        <Header />
        <main className="mx-auto max-w-4xl px-6 py-20">
          <h1 className="text-3xl font-bold">Interview Lab</h1>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Owner access is required.
          </p>
        </main>
      </div>
    );

  const reportRows = phase === "report" ? buildReportRows() : [];
  const beforeCoverage = reportRows.reduce(
    (sum, row) => sum + row.beforeCount,
    0,
  );
  const afterCoverage = reportRows.reduce(
    (sum, row) => sum + row.afterCount,
    0,
  );

  return (
    <div className="min-h-dvh bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <Header />
      <main
        id="main-content"
        className="mx-auto max-w-7xl px-6 py-10 sm:px-8 sm:py-14"
      >
        <div className="border-b border-gray-200 pb-8 dark:border-gray-800">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-system-dark dark:text-system">
            Owner sandbox / Interview Engine v2
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            Interview Lab
          </h1>
          <p className="mt-4 max-w-4xl text-base leading-7 text-gray-600 dark:text-gray-400">
            Test the optional Context Baseline, adaptive interview, reviewed
            Context Mirror, and portability proof loop without saving answers to
            ALVIRA Context. Every step is session-local and disconnected from
            production state.
          </p>
        </div>

        <nav
          aria-label="Interview Engine v2 progress"
          className="mt-6 overflow-x-auto"
        >
          <ol className="flex min-w-max items-center gap-2 text-xs font-semibold uppercase tracking-wide">
            {(Object.keys(phaseLabels) as LabPhase[]).map((item, index) => (
              <li key={item} className="flex items-center gap-2">
                <span
                  className={`rounded-full px-3 py-2 ${phase === item ? "bg-system text-ink" : "bg-gray-100 text-gray-500 dark:bg-gray-900"}`}
                >
                  {index + 1}. {phaseLabels[item]}
                </span>
                {index < Object.keys(phaseLabels).length - 1 ? (
                  <span className="text-gray-300 dark:text-gray-700">→</span>
                ) : null}
              </li>
            ))}
          </ol>
        </nav>

        {error ? (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
            {error}
          </div>
        ) : null}

        {phase === "baseline" || phase === "gap-map" ? (
          <section className="mt-8 space-y-6">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-950">
                <p className="font-mono text-xs uppercase tracking-wide text-system-dark dark:text-system">
                  01 / optional pre-interview baseline
                </p>
                <h2 className="mt-3 text-2xl font-bold">
                  What does your current AI stack appear to know?
                </h2>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-600 dark:text-gray-400">
                  Run the same questions in the tools you already use, then
                  paste what each one returned. These outputs are evidence about
                  each tool's apparent knowledge—not facts. You can skip this
                  step and start the interview now.
                </p>
                <div className="mt-6 flex flex-wrap items-end gap-3">
                  <label className="min-w-56 flex-1 text-sm font-medium">
                    Add another tool to your stack
                    <input
                      value={newToolName}
                      onChange={(event) => setNewToolName(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          addTool();
                        }
                      }}
                      placeholder="Perplexity, local model, etc."
                      className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-950"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={addTool}
                    className="rounded-md border border-gray-300 px-4 py-2.5 text-sm font-semibold dark:border-gray-700"
                  >
                    Add tool
                  </button>
                </div>
                <div className="mt-8 space-y-6">
                  {BASELINE_QUESTIONS.map((question) => (
                    <fieldset
                      key={question.id}
                      className="rounded-lg border border-gray-200 p-4 dark:border-gray-800"
                    >
                      <legend className="px-2 text-sm font-semibold">
                        {question.label}
                      </legend>
                      <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-400">
                        {question.prompt}
                      </p>
                      <div className="mt-4 grid gap-4 md:grid-cols-3">
                        {tools.map((tool) => (
                          <label
                            key={tool.id}
                            className="text-xs font-semibold uppercase tracking-wide text-gray-500"
                          >
                            {tool.name}
                            <textarea
                              value={tool.responses[question.id]}
                              onChange={(event) =>
                                updateBaselineResponse(
                                  tool.id,
                                  question.id,
                                  event.target.value,
                                )
                              }
                              rows={4}
                              placeholder="Paste the tool's answer…"
                              className="mt-2 w-full resize-y rounded-md border border-gray-300 bg-white p-3 text-sm font-normal normal-case leading-6 text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                            />
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  ))}
                </div>
                <div className="mt-8 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={openGapMap}
                    className="rounded-lg bg-gray-900 px-5 py-3 text-sm font-semibold text-white dark:bg-gray-100 dark:text-gray-900"
                  >
                    Build gap map
                  </button>
                  <button
                    type="button"
                    onClick={() => void startInterview(true)}
                    className="rounded-lg border border-system px-5 py-3 text-sm font-semibold text-system-dark dark:text-system"
                  >
                    Skip baseline and interview
                  </button>
                </div>
              </div>
              <aside className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-100">
                <p className="font-mono text-xs uppercase tracking-wide">
                  Evidence boundary
                </p>
                <p className="mt-3">
                  The Lab never turns a pasted AI profile into approved Context.
                  It only uses the comparison to decide where the interview
                  should spend attention.
                </p>
                <p className="mt-3">
                  Blank output means “not observed,” not “the user has no such
                  context.”
                </p>
              </aside>
            </div>
            {phase === "gap-map" ? (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 dark:border-gray-800 dark:bg-gray-900">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="font-mono text-xs uppercase tracking-wide text-system-dark dark:text-system">
                      02 / gap map
                    </p>
                    <h2 className="mt-2 text-2xl font-bold">
                      Prioritize what the interview still needs to learn
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => void startInterview(false)}
                    className="rounded-lg bg-gray-900 px-5 py-3 text-sm font-semibold text-white dark:bg-gray-100 dark:text-gray-900"
                  >
                    Start adaptive interview
                  </button>
                </div>
                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {findings.map((finding) => (
                    <div
                      key={finding.questionId}
                      className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-semibold">{finding.label}</h3>
                        <span className="rounded-full bg-system-soft px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-system-dark dark:text-system">
                          {finding.filledTools}/{finding.totalTools}
                        </span>
                      </div>
                      <select
                        value={finding.classification}
                        onChange={(event) =>
                          setClassificationOverrides((current) => ({
                            ...current,
                            [finding.questionId]: event.target
                              .value as BaselineClassification,
                          }))
                        }
                        className="mt-4 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm capitalize dark:border-gray-700 dark:bg-gray-950"
                      >
                        {BASELINE_CLASSIFICATIONS.map((classification) => (
                          <option key={classification} value={classification}>
                            {baselineClassificationLabel(classification)}
                          </option>
                        ))}
                      </select>
                      <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-400">
                        {finding.rationale}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        ) : null}

        {phase === "interview" ? (
          <section className="mt-8">
            <div className="grid gap-4 rounded-lg border border-gray-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-900 md:grid-cols-3">
              <label className="text-sm font-medium">
                Your name
                <input
                  value={userName}
                  onChange={(event) => setUserName(event.target.value)}
                  placeholder="Optional"
                  className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-950"
                />
              </label>
              <label className="text-sm font-medium">
                Context type
                <select
                  value={tier}
                  onChange={(event) => {
                    setTier(event.target.value as Tier);
                    resetInterview();
                  }}
                  className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-950"
                >
                  <option value="personal">Personal</option>
                  <option value="team">Team</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </label>
              <label className="text-sm font-medium">
                Target area
                <select
                  value={domainId}
                  onChange={(event) => {
                    setDomainId(event.target.value);
                    resetInterview();
                  }}
                  className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-950"
                >
                  {domains.map((domain) => (
                    <option key={domain.id} value={domain.id}>
                      {domain.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => void runTurn([])}
                disabled={busy || !domainId}
                className="rounded-lg bg-gray-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50 dark:bg-gray-100 dark:text-gray-900"
              >
                {history.length > 0 ? "Restart interview" : "Start interview"}
              </button>
              <button
                type="button"
                onClick={openContextMirror}
                disabled={history.length === 0 || busy}
                className="rounded-lg border border-system px-5 py-3 text-sm font-semibold text-system-dark disabled:opacity-50 dark:text-system"
              >
                Open Context Mirror
              </button>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {baselineSkipped
                  ? "Baseline skipped; using the normal adaptive path."
                  : `${baselineFocus.length} baseline gap${baselineFocus.length === 1 ? "" : "s"} prioritized for this interview.`}
              </p>
            </div>
            <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
                <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
                  <p className="font-mono text-xs uppercase tracking-wide text-gray-500">
                    03 / test conversation
                  </p>
                </div>
                <div className="min-h-[360px] space-y-5 p-5">
                  {history.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Start the interview to generate the first question.
                    </p>
                  ) : (
                    history.map((message, index) => (
                      <div
                        key={`${message.role}-${index}`}
                        className={
                          message.role === "assistant"
                            ? "mr-8 rounded-lg border border-system/40 bg-system-soft/40 p-4 dark:bg-ink/20"
                            : "ml-8 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900"
                        }
                      >
                        <p className="font-mono text-[10px] uppercase tracking-wide text-gray-500">
                          {message.role === "assistant" ? "ALVIRA" : "You"}
                        </p>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
                          {message.content}
                        </p>
                      </div>
                    ))
                  )}
                  {busy ? (
                    <p className="text-sm text-gray-500">ALVIRA is thinking…</p>
                  ) : null}
                </div>
                <form
                  onSubmit={submitAnswer}
                  className="border-t border-gray-200 p-5 dark:border-gray-800"
                >
                  <textarea
                    value={answer}
                    onChange={(event) => setAnswer(event.target.value)}
                    disabled={busy || history.length === 0}
                    rows={4}
                    placeholder="Answer naturally, as if this were the live interview…"
                    className="w-full resize-y rounded-lg border border-gray-300 bg-white p-3 text-sm leading-6 outline-none focus:border-system focus:ring-2 focus:ring-system/20 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-950"
                  />
                  <button
                    type="submit"
                    disabled={busy || history.length === 0 || !answer.trim()}
                    className="mt-3 rounded-lg border border-system px-5 py-2.5 text-sm font-semibold text-system-dark disabled:opacity-50 dark:text-system"
                  >
                    Send answer
                  </button>
                </form>
              </div>
              <aside className="space-y-4">
                <div className="rounded-lg border border-gray-200 p-5 dark:border-gray-800">
                  <p className="font-mono text-xs uppercase tracking-wide text-gray-500">
                    Baseline focus
                  </p>
                  {baselineSkipped ? (
                    <p className="mt-4 text-sm leading-6 text-gray-600 dark:text-gray-400">
                      No baseline supplied. This interview is not making
                      assumptions about what another tool knows.
                    </p>
                  ) : (
                    <ul className="mt-4 space-y-3 text-sm">
                      {baselineFocus.slice(0, 6).map((focus) => (
                        <li key={focus.label}>
                          <span className="font-semibold capitalize">
                            {formatStatus(focus.classification)}
                          </span>
                          <span className="block text-gray-600 dark:text-gray-400">
                            {focus.label}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="rounded-lg border border-gray-200 p-5 dark:border-gray-800">
                  <p className="font-mono text-xs uppercase tracking-wide text-gray-500">
                    Lab diagnostics
                  </p>
                  {promptVersion === "production" ? (
                    <p className="mt-4 text-sm leading-6 text-gray-600 dark:text-gray-400">
                      Production mode intentionally shows no diagnostic fields.
                    </p>
                  ) : diagnostics ? (
                    <dl className="mt-4 space-y-4 text-sm">
                      <div>
                        <dt className="font-semibold">Carried forward</dt>
                        <dd className="mt-1 leading-6 text-gray-600 dark:text-gray-400">
                          {diagnostics.carriedForward || "None yet"}
                        </dd>
                      </div>
                      <div>
                        <dt className="font-semibold">Target gap</dt>
                        <dd className="mt-1 leading-6 text-gray-600 dark:text-gray-400">
                          {diagnostics.targetGap || "Not reported"}
                        </dd>
                      </div>
                      <div>
                        <dt className="font-semibold">Why ask this</dt>
                        <dd className="mt-1 leading-6 text-gray-600 dark:text-gray-400">
                          {diagnostics.questionPurpose || "Not reported"}
                        </dd>
                      </div>
                    </dl>
                  ) : (
                    <p className="mt-4 text-sm text-gray-500">
                      Diagnostics appear after a Lab v2 turn.
                    </p>
                  )}
                </div>
              </aside>
            </div>
          </section>
        ) : null}

        {phase === "mirror" ? (
          <section className="mt-8 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-950">
            <p className="font-mono text-xs uppercase tracking-wide text-system-dark dark:text-system">
              04 / Context Mirror
            </p>
            <h2 className="mt-3 text-2xl font-bold">
              Review what could become portable Context
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-600 dark:text-gray-400">
              These are only your interview answers. Baseline tool outputs stay
              evidence and are not copied into durable Context. Edit, remove, or
              approve each candidate before creating the Lab snapshot.
            </p>
            <div className="mt-6 space-y-4">
              {contextClaims.map((claim, index) => (
                <label
                  key={claim.id}
                  className="block rounded-lg border border-gray-200 p-4 dark:border-gray-800"
                >
                  <span className="flex items-center gap-3 text-sm font-semibold">
                    <input
                      type="checkbox"
                      checked={claim.approved}
                      onChange={(event) =>
                        setContextClaims((current) =>
                          current.map((item) =>
                            item.id === claim.id
                              ? { ...item, approved: event.target.checked }
                              : item,
                          ),
                        )
                      }
                    />{" "}
                    Include claim {index + 1}
                  </span>
                  <textarea
                    value={claim.value}
                    onChange={(event) =>
                      setContextClaims((current) =>
                        current.map((item) =>
                          item.id === claim.id
                            ? { ...item, value: event.target.value }
                            : item,
                        ),
                      )
                    }
                    rows={3}
                    className="mt-3 w-full resize-y rounded-md border border-gray-300 bg-white p-3 text-sm leading-6 dark:border-gray-700 dark:bg-gray-950"
                  />
                </label>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={approvePortableContext}
                className="rounded-lg bg-gray-900 px-5 py-3 text-sm font-semibold text-white dark:bg-gray-100 dark:text-gray-900"
              >
                Approve and create portable Context
              </button>
              <button
                type="button"
                onClick={() => setPhase("interview")}
                className="rounded-lg border border-gray-300 px-5 py-3 text-sm font-semibold dark:border-gray-700"
              >
                Back to interview
              </button>
            </div>
          </section>
        ) : null}

        {phase === "proof" ? (
          <section className="mt-8 space-y-6">
            <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-950">
              <p className="font-mono text-xs uppercase tracking-wide text-system-dark dark:text-system">
                05 / portable Context + connection scope
              </p>
              <h2 className="mt-3 text-2xl font-bold">
                Rerun the same questions against the same tools
              </h2>
              <p className="mt-3 max-w-4xl text-sm leading-6 text-gray-600 dark:text-gray-400">
                This is a Lab-only proof run. Select the tools you want to
                compare, paste what each tool returned after the approved
                Context was made available, and record the three control checks.
                No real Bridge authorization is created here.
              </p>
              {portableContext ? (
                <div className="mt-5 grid gap-3 rounded-lg bg-gray-50 p-4 text-sm dark:bg-gray-900 sm:grid-cols-3">
                  <div>
                    <span className="text-gray-500">Context version</span>
                    <strong className="mt-1 block">
                      {portableContext.version}
                    </strong>
                  </div>
                  <div>
                    <span className="text-gray-500">Context hash</span>
                    <strong className="mt-1 block font-mono">
                      {portableContext.hash}
                    </strong>
                  </div>
                  <div>
                    <span className="text-gray-500">Approved claims</span>
                    <strong className="mt-1 block">
                      {portableContext.claims.length}
                    </strong>
                  </div>
                </div>
              ) : null}
              <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {tools.map((tool) => (
                  <label
                    key={tool.id}
                    className="flex items-start gap-3 rounded-lg border border-gray-200 p-4 text-sm dark:border-gray-800"
                  >
                    <input
                      type="checkbox"
                      checked={selectedToolIds.includes(tool.id)}
                      onChange={() => toggleTool(tool.id)}
                      disabled={proofConnected}
                    />
                    <span>
                      <strong>{tool.name}</strong>
                      <span className="mt-1 block text-gray-500">
                        {Object.values(tool.responses).some(Boolean)
                          ? "Baseline captured"
                          : "No baseline captured"}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={connectSelectedTools}
                  disabled={proofConnected || selectedToolIds.length === 0}
                  className="rounded-lg border border-system px-5 py-3 text-sm font-semibold text-system-dark disabled:opacity-50 dark:text-system"
                >
                  {proofConnected
                    ? "Lab targets connected"
                    : "Connect selected Lab targets"}
                </button>
                {proofConnected ? (
                  <span className="text-sm text-gray-500">
                    Local marker only — no production authorization.
                  </span>
                ) : null}
              </div>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-950">
              <p className="font-mono text-xs uppercase tracking-wide text-system-dark dark:text-system">
                06 / same-question rerun
              </p>
              <div className="mt-5 space-y-6">
                {BASELINE_QUESTIONS.map((question) => (
                  <fieldset
                    key={question.id}
                    className="rounded-lg border border-gray-200 p-4 dark:border-gray-800"
                  >
                    <legend className="px-2 text-sm font-semibold">
                      {question.label}
                    </legend>
                    <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-400">
                      {question.prompt}
                    </p>
                    <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {selectedTools.map((tool) => {
                        const proofTool = proofTools.find(
                          (candidate) => candidate.id === tool.id,
                        );
                        return (
                          <label
                            key={tool.id}
                            className="text-xs font-semibold uppercase tracking-wide text-gray-500"
                          >
                            {tool.name}
                            <textarea
                              value={proofTool?.responses[question.id] ?? ""}
                              onChange={(event) =>
                                updateProofResponse(
                                  tool.id,
                                  question.id,
                                  event.target.value,
                                )
                              }
                              disabled={!proofConnected || connectionRevoked}
                              rows={3}
                              placeholder="Paste the post-Context answer…"
                              className="mt-2 w-full resize-y rounded-md border border-gray-300 bg-white p-3 text-sm font-normal normal-case leading-6 text-gray-900 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                            />
                          </label>
                        );
                      })}
                    </div>
                  </fieldset>
                ))}
              </div>
            </div>
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="rounded-lg border border-gray-200 p-5 dark:border-gray-800">
                <p className="font-mono text-xs uppercase tracking-wide text-gray-500">
                  Update check
                </p>
                <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-400">
                  Change the approved Context, then record whether the new
                  version appeared in the target tool.
                </p>
                <textarea
                  value={updateNote}
                  onChange={(event) => setUpdateNote(event.target.value)}
                  rows={3}
                  placeholder="The change I want to test…"
                  className="mt-4 w-full rounded-md border border-gray-300 bg-white p-3 text-sm dark:border-gray-700 dark:bg-gray-950"
                />
                <button
                  type="button"
                  onClick={applyContextUpdate}
                  disabled={!updateNote.trim() || connectionRevoked}
                  className="mt-3 rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold disabled:opacity-50 dark:border-gray-700"
                >
                  Create updated Context version
                </button>
                {updateApplied ? (
                  <button
                    type="button"
                    onClick={() =>
                      setControls((current) => ({ ...current, update: true }))
                    }
                    disabled={!proofConnected || connectionRevoked}
                    className="mt-3 ml-2 rounded-md bg-system px-4 py-2 text-sm font-semibold text-ink disabled:opacity-50"
                  >
                    Record update observed
                  </button>
                ) : null}
                <p className="mt-3 text-xs uppercase tracking-wide text-gray-500">
                  {controls.update ? "Recorded" : "Not recorded"}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 p-5 dark:border-gray-800">
                <p className="font-mono text-xs uppercase tracking-wide text-gray-500">
                  Withhold check
                </p>
                <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-400">
                  Choose a category you intentionally withheld and record what
                  you observed.
                </p>
                <select
                  value={withheldQuestionId}
                  onChange={(event) => {
                    setWithheldQuestionId(
                      event.target.value as BaselineQuestionId,
                    );
                    setControls((current) => ({ ...current, withhold: false }));
                  }}
                  className="mt-4 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950"
                >
                  {BASELINE_QUESTIONS.map((question) => (
                    <option key={question.id} value={question.id}>
                      {question.label}
                    </option>
                  ))}
                </select>
                <textarea
                  value={withholdEvidence}
                  onChange={(event) => setWithholdEvidence(event.target.value)}
                  rows={3}
                  placeholder="What did the target show after withholding it?"
                  className="mt-3 w-full rounded-md border border-gray-300 bg-white p-3 text-sm dark:border-gray-700 dark:bg-gray-950"
                />
                <button
                  type="button"
                  onClick={recordWithheldCheck}
                  disabled={
                    !withholdEvidence.trim() ||
                    !proofConnected ||
                    connectionRevoked
                  }
                  className="mt-3 rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold disabled:opacity-50 dark:border-gray-700"
                >
                  Record withheld check
                </button>
                <p className="mt-3 text-xs uppercase tracking-wide text-gray-500">
                  {controls.withhold ? "Recorded" : "Not recorded"}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 p-5 dark:border-gray-800">
                <p className="font-mono text-xs uppercase tracking-wide text-gray-500">
                  Revoke check
                </p>
                <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-400">
                  Revoke the Lab connection and keep the result separate from
                  Context Lift.
                </p>
                <button
                  type="button"
                  onClick={revokeConnection}
                  disabled={!proofConnected || connectionRevoked}
                  className="mt-4 rounded-md border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 disabled:opacity-50 dark:border-red-800 dark:text-red-300"
                >
                  {connectionRevoked
                    ? "Lab connection revoked"
                    : "Revoke Lab connection"}
                </button>
                <p className="mt-3 text-xs uppercase tracking-wide text-gray-500">
                  {controls.revoke ? "Recorded" : "Not recorded"}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={openReport}
                className="rounded-lg bg-gray-900 px-5 py-3 text-sm font-semibold text-white dark:bg-gray-100 dark:text-gray-900"
              >
                Generate Context Lift report
              </button>
              <button
                type="button"
                onClick={() => setPhase("mirror")}
                className="rounded-lg border border-gray-300 px-5 py-3 text-sm font-semibold dark:border-gray-700"
              >
                Back to Context Mirror
              </button>
            </div>
          </section>
        ) : null}

        {phase === "report" ? (
          <section className="mt-8 space-y-6">
            <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-950">
              <p className="font-mono text-xs uppercase tracking-wide text-system-dark dark:text-system">
                07 / Context Lift report
              </p>
              <h2 className="mt-3 text-2xl font-bold">
                Observed portability evidence
              </h2>
              <p className="mt-3 max-w-4xl text-sm leading-6 text-gray-600 dark:text-gray-400">
                This report compares the same question set in the selected Lab
                targets. It describes observed coverage, not a universal claim
                about every AI environment.
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-4">
                <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
                  <span className="text-xs uppercase tracking-wide text-gray-500">
                    Before coverage
                  </span>
                  <strong className="mt-1 block text-2xl">
                    {beforeCoverage}
                  </strong>
                </div>
                <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
                  <span className="text-xs uppercase tracking-wide text-gray-500">
                    After coverage
                  </span>
                  <strong className="mt-1 block text-2xl">
                    {afterCoverage}
                  </strong>
                </div>
                <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
                  <span className="text-xs uppercase tracking-wide text-gray-500">
                    Coverage delta
                  </span>
                  <strong className="mt-1 block text-2xl">
                    {afterCoverage - beforeCoverage > 0 ? "+" : ""}
                    {afterCoverage - beforeCoverage}
                  </strong>
                </div>
                <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
                  <span className="text-xs uppercase tracking-wide text-gray-500">
                    Context receipt
                  </span>
                  <strong className="mt-1 block font-mono text-sm">
                    {portableContext?.hash ?? "—"}
                  </strong>
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-950">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500 dark:border-gray-800">
                      <th className="pb-3 pr-4">Area</th>
                      <th className="pb-3 pr-4">Baseline status</th>
                      <th className="pb-3 pr-4">Before</th>
                      <th className="pb-3 pr-4">After</th>
                      <th className="pb-3">Observed result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportRows.map((row) => (
                      <tr
                        key={row.id}
                        className="border-b border-gray-100 align-top dark:border-gray-900"
                      >
                        <td className="py-4 pr-4 font-semibold">
                          {row.label}
                          <span className="mt-1 block font-normal text-gray-500">
                            {row.prompt}
                          </span>
                        </td>
                        <td className="py-4 pr-4 capitalize text-gray-600 dark:text-gray-400">
                          {formatStatus(row.classification ?? "not classified")}
                        </td>
                        <td className="py-4 pr-4">
                          {row.beforeCount}/{selectedTools.length}
                        </td>
                        <td className="py-4 pr-4">
                          {row.afterCount}/{selectedTools.length}
                        </td>
                        <td className="py-4 capitalize">{row.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-lg border border-gray-200 p-5 dark:border-gray-800">
                <p className="font-mono text-xs uppercase tracking-wide text-gray-500">
                  Control receipt
                </p>
                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt>Update</dt>
                    <dd
                      className={
                        controls.update
                          ? "font-semibold text-green-700 dark:text-green-300"
                          : "text-gray-500"
                      }
                    >
                      {controls.update ? "recorded" : "not proven"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt>Withholding</dt>
                    <dd
                      className={
                        controls.withhold
                          ? "font-semibold text-green-700 dark:text-green-300"
                          : "text-gray-500"
                      }
                    >
                      {controls.withhold ? "recorded" : "not proven"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt>Revocation</dt>
                    <dd
                      className={
                        controls.revoke
                          ? "font-semibold text-green-700 dark:text-green-300"
                          : "text-gray-500"
                      }
                    >
                      {controls.revoke ? "recorded" : "not proven"}
                    </dd>
                  </div>
                </dl>
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-100">
                <p className="font-mono text-xs uppercase tracking-wide">
                  Evidence boundary
                </p>
                <p className="mt-3">
                  A blank or unchanged answer does not prove withholding,
                  revocation, or lack of Context. The report keeps those
                  controls separate so an ambiguous run remains unproven.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setPhase("proof")}
                className="rounded-lg border border-gray-300 px-5 py-3 text-sm font-semibold dark:border-gray-700"
              >
                Back to proof
              </button>
              <button
                type="button"
                onClick={() => {
                  setPhase("baseline");
                  setPortableContext(null);
                  setProofConnected(false);
                  setConnectionRevoked(false);
                }}
                className="rounded-lg border border-system px-5 py-3 text-sm font-semibold text-system-dark dark:text-system"
              >
                Start another Lab run
              </button>
            </div>
          </section>
        ) : null}

        <div className="mt-10 rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-100">
          This Interview Engine v2 behavior is isolated to the owner Lab. It
          does not save profiles, drafts, completion state, Build Brief data,
          Bridge connections, or production Context.
        </div>
      </main>
      <TrustFooter />
    </div>
  );
}
