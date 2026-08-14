// ── Question Generator: minimal LLM call for phrasing only ──

import { createServerFn } from "@tanstack/react-start";
import OpenAI from "openai";
import type { Domain, Message, Tier } from "./-knowledgeGraph";

interface GenerateInput {
  domain: Domain;
  history: Message[];
  tier: Tier;
  isClarification?: boolean;
}

interface GenerateResult {
  question: string;
}

function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY || "";
  return new OpenAI({ apiKey });
}

function hasApiKey(): boolean {
  return (process.env.OPENAI_API_KEY || "").length > 0;
}

/**
 * Server function: calls OpenAI with a narrow prompt focused ONLY on phrasing.
 * The LLM receives: the domain to probe + conversation history.
 * It does NOT receive the knowledge graph, completion criteria, or validation state.
 */
export const generateQuestion = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const d = data as GenerateInput;
    if (!d.domain || !d.domain.label) {
      throw new Error("Domain is required.");
    }
    if (!Array.isArray(d.history)) {
      throw new Error("History is required.");
    }
    return {
      domain: d.domain as Domain,
      history: d.history as Message[],
      tier: d.tier as Tier,
      isClarification: (d.isClarification as boolean) ?? false,
    };
  })
  .handler(async ({ data }) => {
    if (!hasApiKey()) {
      throw new Error("API key not configured");
    }

    const openai = getOpenAIClient();

    const tierLabel =
      data.tier === "personal"
        ? "an individual capturing their personal knowledge and preferences"
        : data.tier === "team"
          ? "a team capturing their shared workflows and domain knowledge"
          : "a large enterprise capturing organization-wide operational knowledge";

    const conversationText = data.history
      .map((m) => `${m.role === "assistant" ? "ALVIRA" : "User"}: ${m.content}`)
      .join("\n\n");

    const clarificationInstruction = data.isClarification
      ? `\nIMPORTANT: This is a clarification question. The user's previous answer was unclear or too vague. Ask a more specific question to get better detail about "${data.domain.label}". Be encouraging but direct — guide them toward a concrete, detailed response.`
      : "";

    const systemPrompt = `You are Alvira, an AI Knowledge Elicitation Agent. Your purpose is to discover, validate, organize, and compile the knowledge required for AI systems to accurately represent, assist, and make decisions on behalf of a person or organization. You are not a chatbot — you are an adaptive interviewer whose primary goal is to uncover complete, accurate, and reusable knowledge.

## Core Principles
- Every question must have a purpose. Every answer should reduce uncertainty.
- Prefer depth over breadth until a topic is sufficiently complete.
- Assume users do not know what an AI needs to know, what information is missing, or how to organize it.
- Continuously evaluate: what do I know? what remains unknown? what assumptions exist? what could cause errors if omitted?
- Never assume missing information. Instead, investigate.
- When information appears ambiguous, incomplete, inconsistent, or unusually broad — ask follow-up questions before accepting it.
- Optimize for accuracy, completeness, consistency, specificity, and long-term usefulness — never for speed.
- Be conversational, curious. Ask one question at a time. Use previous answers to shape future questions.

## Current Task
The domain you are probing: "${data.domain.label}" — ${data.domain.promptHint}
The user is ${tierLabel}.

Conversation so far:
---
${conversationText || "(this is the first question)"}
---
${clarificationInstruction}

Ask ONE specific question to deepen understanding of the "${data.domain.label}" domain. Be conversational. Do NOT mention the domain name explicitly. Do NOT ask about other domains.

Respond ONLY with a JSON object: {"question": "your question here"}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Ask your next question." },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
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

/**
 * Server function: generates a brief clarification when the user asks
 * a clarifying question instead of answering the domain question.
 */
export const generateClarification = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const d = data as {
      userQuestion: string;
      domainLabel: string;
      history: Message[];
      tier: Tier;
    };
    if (!d.userQuestion || !d.domainLabel) {
      throw new Error("User question and domain label are required.");
    }
    if (!Array.isArray(d.history)) {
      throw new Error("History is required.");
    }
    return {
      userQuestion: d.userQuestion as string,
      domainLabel: d.domainLabel as string,
      history: d.history as Message[],
      tier: d.tier as Tier,
    };
  })
  .handler(async ({ data }) => {
    if (!hasApiKey()) {
      throw new Error("API key not configured");
    }

    const openai = getOpenAIClient();

    const systemPrompt = `You are Alvira, an AI Knowledge Elicitation Agent. The user just asked a clarifying question in response to your question about a specific domain.

The domain you were asking about: "${data.domainLabel}"
The user asked: "${data.userQuestion}"

Briefly explain what you meant by your question about this domain. Be helpful, conversational, and give a concrete example if appropriate. Keep it to 2-3 sentences. Do NOT ask a new question — just explain and clarify.

Respond ONLY with a JSON object: {"clarification": "your clarification here"}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Please clarify." },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
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
