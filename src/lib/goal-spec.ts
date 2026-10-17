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

function released(field: GoalSpecField): boolean {
  return field.review === "approved" || field.review === "edited";
}

/** The text that leaves ALVIRA for a released field. */
function releasedText(field: GoalSpecField): string {
  if (field.review === "edited") return field.editedValue ?? "";
  return field.status === "stated" ? field.value : "";
}

export function goalSpecHasReleasedFields(spec: GoalSpec | undefined): boolean {
  return Boolean(spec) && Object.values(spec!.fields).some(released);
}

/** Fail closed: a spec drafted before the latest answers is not released until it is redrafted and re-reviewed. */
export function goalSpecReleasable(spec: GoalSpec | undefined, state: Pick<InterviewState, "domains">): spec is GoalSpec {
  return goalSpecHasReleasedFields(spec) && !goalSpecIsStale(spec, state);
}

/** goal-spec.md: approved and edited fields only, each with what it rests on, plus confirmed sources. */
export function goalSpecMarkdown(spec: GoalSpec, citable: CitableAnswer[], state: Pick<InterviewState, "topic" | "contextSources">): string {
  const labels = new Map(citable.map((answer) => [answer.id, answer.label]));
  const parts = [`# Goal spec: ${safeGoalSpecTopic(state.topic)}`, "", "Owner-approved statement of one goal, drafted from the ALVIRA interview. Each line says what it rests on; \"Not stated\" means the interview does not say, so do not assume it."];
  let withheld = 0;
  for (const { key, label } of GOAL_SPEC_FIELDS) {
    const field = spec.fields[key];
    if (!field || !released(field)) { withheld += 1; continue; }
    const text = releasedText(field);
    const basis = field.review === "edited"
      ? "Stated by the owner in review."
      : field.citations.length
        ? `From: ${field.citations.map((id) => labels.get(id) ?? id).join("; ")}.`
        : "";
    parts.push("", `## ${label}`, "", text || "_Not stated in the interview._", ...(basis && text ? ["", `_${basis}_`] : []));
  }
  const sources = sourcesMarkdown(state.contextSources);
  if (sources) parts.push("", sources);
  if (withheld) parts.push("", `_${withheld} field${withheld === 1 ? " is" : "s are"} awaiting the owner's review or were rejected, and are not included._`);
  return `${parts.join("\n")}\n`;
}

/** goal-spec.json: the same released fields, structured for an agent or AgentOS to read. */
export function goalSpecJson(spec: GoalSpec, state: Pick<InterviewState, "topic">): string {
  const fields: Record<string, { value: string | null; basis: "interview" | "owner"; citations: string[] }> = {};
  for (const { key } of GOAL_SPEC_FIELDS) {
    const field = spec.fields[key];
    if (!field || !released(field)) continue;
    const text = releasedText(field);
    fields[key] = { value: text || null, basis: field.review === "edited" ? "owner" : "interview", citations: field.review === "edited" ? [] : field.citations };
  }
  return `${JSON.stringify({ schema: "alvira.goal-spec.v1", topic: safeGoalSpecTopic(state.topic), drafted_at: spec.draftedAt, drafted_by: spec.draftedBy, fields }, null, 2)}\n`;
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
