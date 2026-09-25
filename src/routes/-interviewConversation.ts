import type { Domain, InterviewState } from "./-knowledgeGraph";

export function isInterviewRecallRequest(text: string): boolean {
  const normalized = text.trim().toLowerCase().replace(/[?.!]+$/g, "");
  return [
    /\bwhat do you know about me\b/,
    /\bwhat have you (?:learned|captured|got|recorded) about me\b/,
    /\bwhat do you (?:remember|have) (?:about me|so far)\b/,
    /\bwhat have you (?:got|captured|recorded) so far\b/,
    /\bsummar(?:y|ize|ise) what you know about me\b/,
    /\btell me what you know about me\b/,
    /\bwhat information (?:do you have|have you captured)\b/,
  ].some((pattern) => pattern.test(normalized));
}

export function isMoveOnRequest(text: string): boolean {
  const normalized = text.trim().toLowerCase().replace(/[?.!]+$/g, "");
  return [
    /^skip$/,
    /^skip this$/,
    /^move on$/,
    /^next$/,
    /^not relevant$/,
    /^not applicable$/,
    /^n\/a$/,
    /^pass$/,
    /^i(?:'d| would) rather skip(?: this)?$/,
    /^i don'?t want to answer(?: this)?$/,
    /^let'?s move on$/,
  ].some((pattern) => pattern.test(normalized));
}

export function extractPreferredName(text: string): string {
  const cleaned = text
    .trim()
    .replace(/^(?:you can )?(?:call me|i(?:'m| am)|my name is)\s+/i, "")
    .replace(/[.!?]+$/g, "")
    .trim();
  return cleaned.slice(0, 80);
}

function compact(text: string, max = 180): string {
  const singleLine = text.replace(/\s+/g, " ").trim();
  return singleLine.length <= max ? singleLine : `${singleLine.slice(0, max - 1).trimEnd()}…`;
}

export function buildCapturedContextResponse(state: InterviewState, graph: Domain[]): string {
  const populated = graph
    .map((domain) => {
      const answers = (state.domains[domain.id]?.answers ?? [])
        .map((answer) => compact(answer))
        .filter(Boolean);
      return { label: domain.label, answers };
    })
    .filter((entry) => entry.answers.length > 0);

  const name = state.userName?.trim();
  const prefix = name ? `${name}, ` : "";

  if (populated.length === 0) {
    return `${prefix}I don't have any substantive Context captured from you yet. Once you've answered a few questions, ask me again and I'll reflect back only what you've actually told me.`;
  }

  const visible = populated.slice(0, 8);
  const lines = visible.map((entry) => {
    const answers = entry.answers.slice(0, 2).join(" / ");
    const extra = entry.answers.length > 2 ? ` (+${entry.answers.length - 2} more)` : "";
    return `• ${entry.label}: ${answers}${extra}`;
  });

  const hidden = populated.slice(8).map((entry) => entry.label);
  const more = hidden.length > 0
    ? `\n\nI also have captured Context in: ${hidden.join(", ")}.`
    : "";

  return `${prefix}here's what I have actually captured from you so far:\n\n${lines.join("\n")}${more}\n\nThis is a reflection of your recorded answers only; I haven't added assumptions.`;
}

export function buildWelcomeBackMessage(state: InterviewState, mode: "resume" | "update" = "resume"): string {
  const name = state.userName?.trim();
  const hello = name ? `Welcome back, ${name}.` : "Welcome back.";
  return mode === "update"
    ? `${hello} I still have your existing Context. Tell me what's changed or what you'd like me to add.`
    : `${hello} I still have what you've shared so far, so we can pick up where we left off.`;
}

export function buildFirstRunIntro(name?: string): string {
  const hello = name ? `Thanks, ${name}.` : "Thanks.";
  return `${hello} I’ll build your Context one question at a time. Answer naturally; you can correct me, say “move on,” or ask what I know about you at any point.`;
}
