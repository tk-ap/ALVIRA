/**
 * Sensitive Context items carry a leading label, e.g.
 *   "[SENSITIVE — release only for money, housing or scheduling decisions] …"
 * Agents write it directly and the import extractor preserves it. Sensitive items stay in
 * the person's saved Context but are withheld from compiled files and from Bridge responses
 * unless a caller explicitly asks for them.
 */
// Fail closed: a sensitive label anywhere in an answer makes the whole answer sensitive,
// so a label embedded mid-answer can never leak its text into previews, files or the Bridge.
const SENSITIVE_LABEL = /\[SENSITIVE\b/i;
export const WITHHELD = "[withheld: sensitive — ask with include_sensitive only when the task needs it]";

export function isSensitive(text: string): boolean {
  return SENSITIVE_LABEL.test(text);
}

type Domain = { answers?: string[]; knowledge?: string[]; [key: string]: unknown };
type State = { domains?: Record<string, Domain>; history?: Array<{ role: string; content: string }>; [key: string]: unknown };

/** For on-screen previews: the latest non-sensitive answer, or a placeholder if all are sensitive. */
export function displayableLatest(answers: string[]): string {
  const visible = answers.filter((answer) => !isSensitive(answer));
  if (visible.length > 0) return visible[visible.length - 1];
  return answers.length > 0 ? "Sensitive item saved — hidden from previews." : "";
}

/** Remove sensitive answers (keeping knowledge marks aligned) and mask them in the chat history. */
export function redactSensitiveState<T extends State>(state: T): { state: T; withheld: number } {
  let withheld = 0;
  const domains: Record<string, Domain> = {};
  for (const [id, domain] of Object.entries(state.domains ?? {})) {
    const answers = domain.answers ?? [];
    const keep = answers.map((answer) => !isSensitive(answer));
    withheld += keep.filter((k) => !k).length;
    domains[id] = {
      ...domain,
      answers: answers.filter((_, i) => keep[i]),
      ...(domain.knowledge ? { knowledge: domain.knowledge.filter((_, i) => keep[i]) } : {}),
    };
  }
  const history = state.history?.map((message) => (isSensitive(message.content) ? { ...message, content: WITHHELD } : message));
  return { state: { ...state, domains, ...(history ? { history } : {}) }, withheld };
}

/** Mask any paragraph of compiled or exported text that carries a sensitive label. */
export function redactSensitiveText(text: string): string {
  return text.split(/\n{2,}/).map((block) => (block.includes("[SENSITIVE") ? WITHHELD : block)).join("\n\n");
}

export function redactSensitiveDeep<T>(value: T): T {
  if (typeof value === "string") return (value.includes("[SENSITIVE") ? redactSensitiveText(value) : value) as T;
  if (Array.isArray(value)) return value.map((item) => redactSensitiveDeep(item)) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, redactSensitiveDeep(item)])) as T;
  }
  return value;
}
