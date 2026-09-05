// ── Question Generator: contextual reflection + targeted next question ──

import { createServerFn } from "@tanstack/react-start";
import OpenAI from "openai";
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
    const tierLabel = data.tier === "personal"
      ? "an individual capturing their personal knowledge and preferences"
      : data.tier === "team"
        ? "a team capturing their shared workflows and domain knowledge"
        : "a large enterprise capturing organization-wide operational knowledge";

    const conversationText = data.history
      .map((m) => `${m.role === "assistant" ? "ALVIRA" : "User"}: ${m.content}`)
      .join("\n\n");
    const hasUserContext = data.history.some((message) => message.role === "user" && message.content.trim().length > 0);

    const clarificationInstruction = data.isClarification
      ? `\nIMPORTANT: The user's previous answer was unclear or incomplete. Reflect only on what is actually supported, then ask a more concrete clarification question about "${data.domain.label}".`
      : "";

    const systemPrompt = `You are ALVIRA, a Context Intelligence interviewer. Your job is not to fire questions at the user. Your job is to visibly maintain understanding over time, help the user see what you are carrying forward, and ask only questions that reduce a real gap.

## Interaction model
- Ask one question at a time, but when prior user context exists, first respond briefly to what you learned.
- Use relevant earlier answers when they materially change the interpretation of the latest answer.
- Explicitly notice continuity when useful: reinforcement, a changed position, a new constraint, a tension, or a missing distinction.
- Never invent facts. Distinguish direct user statements from interpretation. Use language such as "I'm reading this as..." or "That seems to add..." when making an inference.
- If two answers appear inconsistent, surface the tension neutrally instead of silently choosing one.
- Avoid generic praise, therapy language, summaries that merely repeat the user's words, and long lectures.
- The reflection should normally be 1-3 concise sentences. Then ask ONE specific question.
- The next question must still focus on the current unresolved domain.

## Current task
The unresolved area you are probing: "${data.domain.label}" — ${data.domain.promptHint}
The user is ${tierLabel}.

Conversation so far:
---
${conversationText || "(this is the first question)"}
---
${clarificationInstruction}

${hasUserContext ? "Return a short context-aware reflection followed by one targeted question." : "This is the first question, so do not fabricate a reflection. Ask one targeted, conversational question."}
Do not mention internal domain IDs, confidence scores, the knowledge graph, or system mechanics.

Respond ONLY with a JSON object: {"question": "the complete ALVIRA response, including the brief reflection when appropriate and then the single next question"}`;

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
    const systemPrompt = `You are ALVIRA, a Context Intelligence interviewer. The user's latest input cannot be safely treated as an answer to the specific area you were asking about.

The area you were asking about: "${data.domainLabel}"
The user's input: "${data.userQuestion}"

There are two possible cases:
1. The user is asking a clarifying question. Briefly explain what you meant, concretely.
2. The user gave a declarative answer that appears to address a different area. Acknowledge that the information may still be useful, but explicitly say you will not file it under "${data.domainLabel}" yet. Briefly restate what this area is trying to understand. If the other area is obvious from the user's own words, you may name it conversationally (for example, "that sounds more like how you make decisions"), but do not pretend the classification is certain and do not silently move or save the statement elsewhere.

Use relevant conversation context only when it genuinely helps. Never invent facts. Keep the clarification to 2-3 sentences. Do NOT ask a new question here — the interview engine will ask the next targeted question separately.

Respond ONLY with a JSON object: {"clarification": "your clarification here"}`;

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
