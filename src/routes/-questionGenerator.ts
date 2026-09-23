// ── Question Generator: contextual reflection + targeted next question ──

import { createServerFn } from "@tanstack/react-start";
import OpenAI from "openai";
import {
  buildExperimentalQuestionPrompt,
  buildProductionClarificationPrompt,
} from "~/lib/interview-prompts";
import type { Domain, Message, Tier } from "./-knowledgeGraph";

interface GenerateInput {
  domain: Domain;
  history: Message[];
  tier: Tier;
  isClarification?: boolean;
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
    };
  })
  .handler(async ({ data }) => {
    if (!hasApiKey()) throw new Error("API key not configured");

    const openai = getOpenAIClient();
    // Prototype branch only: run the actual customer interview through the
    // latest Interview Lab v2 prompt so the immersive product journey is
    // testing the same interview behavior rather than a separate marketing shell.
    const systemPrompt = buildExperimentalQuestionPrompt({
      domain: data.domain,
      history: data.history,
      tier: data.tier,
    });

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
    const d = data as { userQuestion: string; domainLabel: string; history: Message[]; tier: Tier };
    if (!d.userQuestion || !d.domainLabel) throw new Error("User input and domain label are required.");
    if (!Array.isArray(d.history)) throw new Error("History is required.");
    return {
      userQuestion: d.userQuestion as string,
      domainLabel: d.domainLabel as string,
      history: d.history as Message[],
      tier: d.tier as Tier,
    };
  })
  .handler(async ({ data }) => {
    if (!hasApiKey()) throw new Error("API key not configured");
    const openai = getOpenAIClient();
    const systemPrompt = buildProductionClarificationPrompt({
      userQuestion: data.userQuestion,
      domainLabel: data.domainLabel,
      history: data.history,
    });

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
