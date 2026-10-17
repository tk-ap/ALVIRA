// ── Goal spec drafting (server only) ──
// Called from the signed-in server function draftGoalSpec in -auth.ts, which loads the caller's
// own saved interview draft; nothing the client sends is used (Codex review of 38b5ebd). Topic,
// citable answers and answer count are derived here from that stored state, and the model's draft
// is normalized so a field without a real citation comes back "unknown", links are redacted and
// sensitive text is dropped.

import OpenAI from "openai";
import { citableAnswers, goalSpecPrompt, normalizeGoalSpecDraft, safeGoalSpecTopic, storedAnswerCount, type GoalSpec } from "~/lib/goal-spec";
import { getKnowledgeGraph, type InterviewState, type Tier } from "./-knowledgeGraph";

export async function draftGoalSpecFromState(state: InterviewState): Promise<GoalSpec> {
  const tier: Tier = state.tier === "team" || state.tier === "enterprise" ? state.tier : "personal";
  const citable = citableAnswers({ topic: state.topic ?? "", domains: state.domains ?? {} }, getKnowledgeGraph(tier));
  if (citable.length === 0) throw new Error("There is nothing in the interview to draft from yet.");
  if (!(process.env.OPENAI_API_KEY || "").length) throw new Error("API key not configured");

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: goalSpecPrompt(safeGoalSpecTopic(state.topic), citable) },
      { role: "user", content: "Draft the goal spec." },
    ],
    response_format: { type: "json_object" },
    temperature: 0.2,
  });
  let parsed: unknown = {};
  try {
    parsed = JSON.parse(response.choices[0]?.message?.content || "{}");
  } catch {
    parsed = {};
  }
  // The signed-in account is the drafter; a delegated-agent identity arrives with agent sign-in (#200).
  return normalizeGoalSpecDraft(parsed, citable, { actor_type: "human" }, storedAnswerCount({ domains: state.domains ?? {} }));
}
