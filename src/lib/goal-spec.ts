// ── Goal spec: the interview turned into a reviewable, hand-off-ready statement of one goal ──
//
// A model drafts each field from the interview, citing the answers it used. A field without a
// valid citation is "unknown", never guessed. The owner then approves, edits or rejects each field;
// only approved or edited fields leave ALVIRA (goal-spec.md / goal-spec.json). Sensitive answers,
// raw Links & sources answers and unconfirmed links are never offered for citation or exported.

import type { SourceContributor } from "~/lib/context-engine";
import { isSensitive } from "~/lib/sensitivity";
import { redactAnswerLinks, sourcesMarkdown } from "~/lib/source-links";
import type { Domain, InterviewState } from "~/routes/-knowledgeGraph";

export const GOAL_SPEC_FIELDS = [
  { key: "goal", label: "Goal", hint: "The one goal, in a sentence." },
  { key: "done", label: "Definition of done", hint: "What finished looks like." },
  { key: "successMeasures", label: "Success measures", hint: "How success is judged; numbers where stated." },
  { key: "constraints", label: "Constraints", hint: "Limits, non-negotiables, budget, time, approvals." },
  { key: "priorities", label: "Priorities and tradeoffs", hint: "What comes first and what gives way." },
  { key: "decisions", label: "Decisions made", hint: "Decisions already taken, and why." },
  { key: "currentState", label: "Where things stand", hint: "Current status and work in progress." },
  { key: "people", label: "People involved", hint: "Who decides, who helps, who is affected." },
  { key: "openQuestions", label: "Open questions", hint: "What is still undecided or unknown." },
  { key: "nextSteps", label: "Next steps", hint: "Concrete next actions." },
] as const;

export type GoalSpecKey = (typeof GOAL_SPEC_FIELDS)[number]["key"];
export type GoalSpecReview = "pending" | "approved" | "edited" | "rejected";

export interface GoalSpecField {
  /** The drafted text ("" when nothing in the interview states it). */
  value: string;
  /** Citation ids ("<domainId>#<answerIndex>" or "topic") of the answers the value rests on. */
  citations: string[];
  status: "stated" | "unknown";
  review: GoalSpecReview;
  /** The owner's wording, when they edited the field. */
  editedValue?: string;
  reviewedAt?: string;
}

export interface GoalSpec {
  version: 1;
  draftedAt: string;
  draftedBy: SourceContributor;
  /** Answers stored when drafted; a different count means the Context changed since. */
  answerCount: number;
  fields: Record<GoalSpecKey, GoalSpecField>;
}

export interface CitableAnswer {
  id: string;
  label: string;
  text: string;
}

const MAX_CITABLE = 120;
const MAX_FIELD_CHARS = 1200;

/** The topic as it may leave ALVIRA: links redacted; a sensitive topic is replaced with a neutral title. */
export function safeGoalSpecTopic(topic: string | undefined | null): string {
  const text = (topic ?? "").trim();
  if (!text || isSensitive(text)) return "My AI context";
  return redactAnswerLinks(text).slice(0, 200);
}

export function storedAnswerCount(state: Pick<InterviewState, "domains">): number {
  return Object.values(state.domains ?? {}).reduce((n, area) => n + (area?.answers?.length ?? 0), 0);
}

/**
 * Everything the draft may cite: the goal as typed on /app, then each stored answer by area.
 * Sensitive answers and the raw Links & sources answers are left out (links reach the spec only
 * as owner-confirmed sources).
 */
export function citableAnswers(state: Pick<InterviewState, "topic" | "domains">, graph: Domain[]): CitableAnswer[] {
  const out: CitableAnswer[] = [];
  const topic = (state.topic ?? "").trim();
  if (topic && !isSensitive(topic)) out.push({ id: "topic", label: "Goal as entered", text: safeGoalSpecTopic(topic) });
  for (const domain of graph) {
    if (domain.id === "sources") continue;
    (state.domains?.[domain.id]?.answers ?? []).forEach((answer, index) => {
      if (!answer?.trim() || isSensitive(answer)) return;
      out.push({ id: `${domain.id}#${index}`, label: `${domain.label}, answer ${index + 1}`, text: redactAnswerLinks(answer) });
    });
  }
  return out.slice(0, MAX_CITABLE);
}

/** A model draft turned into a safe spec: unknown unless it cites real answers; no links, no sensitive text. */
export function normalizeGoalSpecDraft(
  raw: unknown,
  citable: CitableAnswer[],
  contributor: SourceContributor,
  answerCount: number,
  now: string = new Date().toISOString(),
): GoalSpec {
  const known = new Set(citable.map((answer) => answer.id));
  const source = (raw && typeof raw === "object" ? ((raw as { fields?: unknown }).fields ?? raw) : {}) as Record<string, unknown>;
  const fields = {} as Record<GoalSpecKey, GoalSpecField>;
  for (const { key } of GOAL_SPEC_FIELDS) {
    const entry = (source[key] && typeof source[key] === "object" ? source[key] : {}) as { value?: unknown; citations?: unknown };
    const citations = Array.isArray(entry.citations)
      ? [...new Set(entry.citations.filter((id): id is string => typeof id === "string" && known.has(id)))]
      : [];
    let value = typeof entry.value === "string" ? redactAnswerLinks(entry.value.trim()).slice(0, MAX_FIELD_CHARS) : "";
    if (isSensitive(value)) value = "";
    const stated = Boolean(value) && citations.length > 0;
    fields[key] = { value: stated ? value : "", citations: stated ? citations : [], status: stated ? "stated" : "unknown", review: "pending" };
  }
  return { version: 1, draftedAt: now, draftedBy: contributor, answerCount, fields };
}

/** The owner's decision on one field. Editing approves the owner's wording. */
export function reviewGoalSpecField(
  spec: GoalSpec,
  key: GoalSpecKey,
  action: "approve" | "reject" | "edit" | "reset",
  editedValue?: string,
  now: string = new Date().toISOString(),
): GoalSpec {
  const field = spec.fields[key];
  if (!field) return spec;
  let next: GoalSpecField;
  if (action === "approve") next = { ...field, review: "approved", reviewedAt: now };
  else if (action === "reject") next = { ...field, review: "rejected", reviewedAt: now };
  else if (action === "reset") next = { value: field.value, citations: field.citations, status: field.status, review: "pending" };
  else {
    const text = redactAnswerLinks((editedValue ?? "").trim()).slice(0, MAX_FIELD_CHARS);
    // Sensitive text never becomes releasable through an edit (Codex review of 38b5ebd).
    if (!text || isSensitive(text)) return spec;
    next = { ...field, review: "edited", editedValue: text, reviewedAt: now };
  }
  return { ...spec, fields: { ...spec.fields, [key]: next } };
}

export function goalSpecIsStale(spec: GoalSpec | undefined, state: Pick<InterviewState, "domains">): boolean {
  return Boolean(spec) && spec!.answerCount !== storedAnswerCount(state);
}

interface ReleasedEntry {
  text: string;
  citations: string[];
  basis: "interview" | "owner";
}

/**
 * The one gate for anything leaving ALVIRA. The saved state is client-supplied, so every release is
 * re-checked here, not trusted from review time (Codex review of 5c30da2): only approved or edited
 * fields; text re-sanitized (links redacted, length capped); sensitive text withheld; citations kept
 * only when they name a real citable answer; a "stated" field whose citations are all invalid is withheld.
 */
function releasedEntry(field: GoalSpecField | undefined, known: Set<string>): ReleasedEntry | null {
  if (!field || (field.review !== "approved" && field.review !== "edited")) return null;
  const edited = field.review === "edited";
  const raw = edited ? field.editedValue : field.status === "stated" ? field.value : "";
  const text = typeof raw === "string" ? redactAnswerLinks(raw.trim()).slice(0, MAX_FIELD_CHARS) : "";
  if (isSensitive(text)) return null;
  if (edited) return text ? { text, citations: [], basis: "owner" } : null;
  const citations = Array.isArray(field.citations) ? [...new Set(field.citations.filter((id) => typeof id === "string" && known.has(id)))] : [];
  if (text && citations.length === 0) return null;
  return { text, citations, basis: "interview" };
}

function knownIds(citable: CitableAnswer[]): Set<string> {
  return new Set(citable.map((answer) => answer.id));
}

export function goalSpecHasReleasedFields(spec: GoalSpec | undefined, citable: CitableAnswer[]): boolean {
  if (!spec || !spec.fields) return false;
  const known = knownIds(citable);
  return GOAL_SPEC_FIELDS.some(({ key }) => releasedEntry(spec.fields[key], known) !== null);
}

/** Fail closed: nothing is released from a spec drafted before the latest answers, or with nothing that passes the release gate. */
export function goalSpecReleasable(spec: GoalSpec | undefined, state: Pick<InterviewState, "domains">, citable: CitableAnswer[]): spec is GoalSpec {
  return goalSpecHasReleasedFields(spec, citable) && !goalSpecIsStale(spec, state);
}

/** goal-spec.md: released fields only, each with what it rests on, plus confirmed sources. */
export function goalSpecMarkdown(spec: GoalSpec, citable: CitableAnswer[], state: Pick<InterviewState, "topic" | "contextSources">): string {
  const labels = new Map(citable.map((answer) => [answer.id, answer.label]));
  const known = knownIds(citable);
  const parts = [`# Goal spec: ${safeGoalSpecTopic(state.topic)}`, "", "Owner-approved statement of one goal, drafted from the ALVIRA interview. Each line says what it rests on; \"Not stated\" means the interview does not say, so do not assume it."];
  let withheld = 0;
  for (const { key, label } of GOAL_SPEC_FIELDS) {
    const entry = releasedEntry(spec.fields?.[key], known);
    if (!entry) { withheld += 1; continue; }
    const basis = entry.basis === "owner"
      ? "Stated by the owner in review."
      : entry.citations.length
        ? `From: ${entry.citations.map((id) => labels.get(id) ?? id).join("; ")}.`
        : "";
    parts.push("", `## ${label}`, "", entry.text || "_Not stated in the interview._", ...(basis && entry.text ? ["", `_${basis}_`] : []));
  }
  const sources = sourcesMarkdown(state.contextSources);
  if (sources) parts.push("", sources);
  if (withheld) parts.push("", `_${withheld} field${withheld === 1 ? " is" : "s are"} awaiting the owner's review, were rejected, or could not be released, and are not included._`);
  return `${parts.join("\n")}\n`;
}

/** goal-spec.json: the same released fields, structured for an agent or AgentOS to read. */
export function goalSpecJson(spec: GoalSpec, state: Pick<InterviewState, "topic">, citable: CitableAnswer[]): string {
  const known = knownIds(citable);
  const fields: Record<string, { value: string | null; basis: "interview" | "owner"; citations: string[] }> = {};
  for (const { key } of GOAL_SPEC_FIELDS) {
    const entry = releasedEntry(spec.fields?.[key], known);
    if (entry) fields[key] = { value: entry.text || null, basis: entry.basis, citations: entry.citations };
  }
  const by = spec.draftedBy;
  // Fail closed (Codex review of 89c259e): an agent id is exported only as a plain identifier that is
  // not marked sensitive; anything else is omitted. The server-issued identity from #200 replaces this.
  const actorId = by && typeof by.actor_id === "string" ? by.actor_id.trim() : "";
  const safeActorId = /^[A-Za-z0-9._:@-]{1,120}$/.test(actorId) && !isSensitive(actorId) ? actorId : "";
  const draftedBy = by && by.actor_type === "agent"
    ? { actor_type: "agent", ...(safeActorId ? { actor_id: safeActorId } : {}) }
    : { actor_type: "human" };
  const draftedAt = typeof spec.draftedAt === "string" && !Number.isNaN(Date.parse(spec.draftedAt)) ? new Date(spec.draftedAt).toISOString() : null;
  return `${JSON.stringify({ schema: "alvira.goal-spec.v1", topic: safeGoalSpecTopic(state.topic), drafted_at: draftedAt, drafted_by: draftedBy, fields }, null, 2)}\n`;
}

/** The drafting prompt: one JSON object, every claim cited, unknown when not stated. */
export function goalSpecPrompt(topic: string, citable: CitableAnswer[]): string {
  const lines = citable.map((answer) => `[${answer.id}] (${answer.label}) ${answer.text.replace(/\s+/g, " ").slice(0, 700)}`).join("\n");
  const fieldList = GOAL_SPEC_FIELDS.map((field) => `- "${field.key}": ${field.label}. ${field.hint}`).join("\n");
  return `You turn an interview into a goal spec that any AI or teammate could pick up to continue the goal.

Rules:
- Use ONLY the cited answers below. Never invent facts, numbers, names, dates or tools.
- Every field you fill must cite the answer ids it rests on, exactly as written in brackets.
- If the answers do not state something, return value "" and citations [] for that field. Do not guess.
- Write plainly and concretely, in the third person ("They…"), at most 3 sentences or 5 short bullet lines per field.
- Do not include links or any sensitive personal details.

Goal as entered: ${topic || "(none)"}

Fields:
${fieldList}

Answers:
${lines || "(no answers yet)"}

Return ONLY a JSON object: {"fields": {"<field key>": {"value": string, "citations": [string]}}} with all ${GOAL_SPEC_FIELDS.length} keys.`;
}
