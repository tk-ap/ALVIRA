// ── Question Generator: contextual reflection + targeted next question ──

import { createServerFn } from "@tanstack/react-start";
import OpenAI from "openai";
import {
  buildExperimentalQuestionPrompt,
  buildProductionClarificationPrompt,
} from "~/lib/interview-prompts";
import type { Domain, Message, Tier } from "./-knowledgeGraph";
import { followUpPromptSection, goalPromptSection, type NextAreaReason } from "~/lib/interview-goal";

/** Adds the goal (and follow-up) sections just before the prompt's final output instruction. */
function withGoal(prompt: string, sections: string): string {
  if (!sections.trim()) return prompt;
  const marker = prompt.lastIndexOf("Respond ONLY with a JSON object");
  return marker < 0 ? `${prompt}\n${sections}` : `${prompt.slice(0, marker)}${sections.trim()}\n\n${prompt.slice(marker)}`;
}

interface GenerateInput {
  domain: Domain;
  history: Message[];
  tier: Tier;
  isClarification?: boolean;
  delegatedAgent?: boolean;
  /** What the person chose or typed on /app, as one plain-language line. */
  goal?: string;
  /** Set when the next question deliberately follows up on the latest answer. */
  followUp?: NextAreaReason;
}

interface GenerateResult { question: string; }

function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY || "";
  return new OpenAI({ apiKey });
}

function hasApiKey(): boolean {
  return (process.env.OPENAI_API_KEY || "").length > 0;
}

export const generateQuestion = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const d = data as GenerateInput;
    if (!d.domain || !d.domain.label) throw new Error("Domain is required.");
    if (!Array.isArray(d.history)) throw new Error("History is required.");
    return {
      domain: d.domain as Domain,
      history: d.history as Message[],
      tier: d.tier as Tier,
      isClarification: (d.isClarification as boolean) ?? false,
      delegatedAgent: d.delegatedAgent === true,
      goal: typeof d.goal === "string" ? d.goal : "",
      followUp: d.followUp === "goal-follow-up" || d.followUp === "unresolved-follow-up" ? d.followUp : undefined,
    };
  })
  .handler(async ({ data }) => {
    if (!hasApiKey()) throw new Error("API key not configured");

    const openai = getOpenAIClient();
    // Prototype branch only: run the actual customer interview through the
    // latest Interview Lab v2 prompt so the immersive product journey is
    // testing the same interview behavior rather than a separate marketing shell.
    const systemPrompt = withGoal(
      buildExperimentalQuestionPrompt({
        domain: data.domain,
        history: data.history,
        tier: data.tier,
        delegatedAgent: data.delegatedAgent,
      }),
      `${goalPromptSection(data.goal)}\n${followUpPromptSection(data.followUp)}`,
    );

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Continue the interview." },
      ],
      response_format: { type: "json_object" },
      temperature: 0.65,
    });

    const raw = response.choices[0]?.message?.content || "";
    let question: string;
    try {
      const parsed = JSON.parse(raw);
      question = parsed.question || raw;
    } catch {
      question = raw;
    }
    return { question } as GenerateResult;
  });

export const generateClarification = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const d = data as { userQuestion: string; domainLabel: string; history: Message[]; tier: Tier; delegatedAgent?: boolean; goal?: string };
    if (!d.userQuestion || !d.domainLabel) throw new Error("User input and domain label are required.");
    if (!Array.isArray(d.history)) throw new Error("History is required.");
    return {
      userQuestion: d.userQuestion as string,
      domainLabel: d.domainLabel as string,
      history: d.history as Message[],
      tier: d.tier as Tier,
      delegatedAgent: d.delegatedAgent === true,
      goal: typeof d.goal === "string" ? d.goal : "",
    };
  })
  .handler(async ({ data }) => {
    if (!hasApiKey()) throw new Error("API key not configured");
    const openai = getOpenAIClient();
    const systemPrompt = withGoal(
      buildProductionClarificationPrompt({
        userQuestion: data.userQuestion,
        domainLabel: data.domainLabel,
        history: data.history,
        delegatedAgent: data.delegatedAgent,
      }),
      data.goal ? `Their goal for this Context: ${data.goal}\nWhen you restate what you are trying to understand, tie it to that goal.` : "",
    );

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Clarify what should happen next." },
      ],
      response_format: { type: "json_object" },
      temperature: 0.45,
    });

    const raw = response.choices[0]?.message?.content || "";
    let clarification: string;
    try {
      const parsed = JSON.parse(raw);
      clarification = parsed.clarification || raw;
    } catch {
      clarification = raw;
    }
    return { clarification };
  });
