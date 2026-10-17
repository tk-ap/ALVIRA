// ── Goal spec drafting (server) ──
// Drafts every goal-spec field from the citable answers with the app's model, then normalizes the
// draft on the server so a field without a real citation comes back "unknown".

import { createServerFn } from "@tanstack/react-start";
import OpenAI from "openai";
import type { SourceContributor } from "~/lib/context-engine";
import { goalSpecPrompt, normalizeGoalSpecDraft, type CitableAnswer, type GoalSpec } from "~/lib/goal-spec";

interface DraftInput {
  topic: string;
  citable: CitableAnswer[];
  contributor: SourceContributor;
  answerCount: number;
}

export const draftGoalSpec = createServerFn({ method: "POST" })
  .validator((data: unknown): DraftInput => {
    const d = (data ?? {}) as Partial<DraftInput>;
    if (!Array.isArray(d.citable)) throw new Error("Answers are required.");
    const citable = d.citable
      .filter((a): a is CitableAnswer => Boolean(a) && typeof a.id === "string" && typeof a.label === "string" && typeof a.text === "string")
      .slice(0, 120)
      .map((a) => ({ id: a.id.slice(0, 80), label: a.label.slice(0, 120), text: a.text.slice(0, 2000) }));
    if (citable.length === 0) throw new Error("There is nothing in the interview to draft from yet.");
    const contributor: SourceContributor = d.contributor?.actor_type === "agent"
      ? { actor_type: "agent", ...(typeof d.contributor.actor_id === "string" ? { actor_id: d.contributor.actor_id.slice(0, 120) } : {}) }
      : { actor_type: "human" };
    return {
      topic: typeof d.topic === "string" ? d.topic.slice(0, 600) : "",
      citable,
      contributor,
      answerCount: Number.isFinite(d.answerCount) ? Number(d.answerCount) : 0,
    };
  })
  .handler(async ({ data }): Promise<GoalSpec> => {
    if (!(process.env.OPENAI_API_KEY || "").length) throw new Error("API key not configured");
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: goalSpecPrompt(data.topic, data.citable) },
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
    return normalizeGoalSpecDraft(parsed, data.citable, data.contributor, data.answerCount);
  });
