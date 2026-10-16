// ── Question Generator: contextual reflection + targeted next question ──

import { createServerFn } from "@tanstack/react-start";
import OpenAI from "openai";
import type { Domain, Message, Tier } from "./-knowledgeGraph";
import { followUpPromptSection, goalPromptSection, type NextAreaReason } from "~/lib/interview-goal";
import { generateAtomicQuestion, type AtomicQuestionResult } from "~/lib/question-shape";

interface GenerateInput {
  domain: Domain;
  history: Message[];
  tier: Tier;
  isClarification?: boolean;
  /** What the person chose or typed on /app, as one plain-language line. */
  goal?: string;
  /** Set when the next question deliberately follows up on the latest answer. */
  followUp?: NextAreaReason;
}

interface GenerateResult {
  /** null when no new atomic question exists for the area (shape.fallback === "exhausted"). */
  question: string | null;
  /** How the one-atomic-question check went: attempts used, fallback if any, rejected problems. */
  shape: Omit<AtomicQuestionResult, "question">;
}

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
      goal: typeof d.goal === "string" ? d.goal : "",
      followUp: d.followUp === "goal-follow-up" || d.followUp === "unresolved-follow-up" ? d.followUp : undefined,
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
- Keep the next question within the current unresolved area, approached through the person's goal and what they have already said.

## Current task
The unresolved area you are probing: "${data.domain.label}" — ${data.domain.promptHint}
The user is ${tierLabel}.
${goalPromptSection(data.goal)}
${followUpPromptSection(data.followUp)}

Conversation so far:
---
${conversationText || "(this is the first question)"}
---
${clarificationInstruction}

${hasUserContext ? "Return a short context-aware reflection followed by one targeted question." : `This is the first question, so do not fabricate a reflection. Ask one targeted, conversational question${data.goal ? " that connects to their goal" : ""}.`}
Do not mention internal domain IDs, confidence scores, the knowledge graph, or system mechanics.

Respond ONLY with a JSON object: {"question": "the complete ALVIRA response, including the brief reflection when appropriate and then the single next question"}`;

    // Generate, check the shape (one atomic, non-repeating question), rewrite once with
    // specific feedback, then fall back to a safe question (src/lib/question-shape.ts).
    let lastRaw = "";
    const generate = async (feedback?: string): Promise<string> => {
      const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Continue the interview." },
      ];
      if (feedback) messages.push({ role: "assistant", content: lastRaw }, { role: "user", content: feedback });
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages,
        response_format: { type: "json_object" },
        temperature: 0.65,
      });
      lastRaw = response.choices[0]?.message?.content || "";
      try {
        const parsed = JSON.parse(lastRaw);
        return typeof parsed.question === "string" && parsed.question ? parsed.question : lastRaw;
      } catch {
        return lastRaw;
      }
    };

    const { question, ...shape } = await generateAtomicQuestion({
      generate,
      history: data.history,
      areaLabel: data.domain.label,
      hasGoal: Boolean(data.goal),
    });
    return { question, shape } as GenerateResult;
  });

export const generateClarification = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const d = data as { userQuestion: string; domainLabel: string; history: Message[]; tier: Tier; goal?: string };
    if (!d.userQuestion || !d.domainLabel) throw new Error("User input and domain label are required.");
    if (!Array.isArray(d.history)) throw new Error("History is required.");
    return {
      userQuestion: d.userQuestion as string,
      domainLabel: d.domainLabel as string,
      history: d.history as Message[],
      tier: d.tier as Tier,
      goal: typeof d.goal === "string" ? d.goal : "",
    };
  })
  .handler(async ({ data }) => {
    if (!hasApiKey()) throw new Error("API key not configured");
    const openai = getOpenAIClient();
    const systemPrompt = `You are ALVIRA, a Context Intelligence interviewer. The user's latest input cannot be safely treated as an answer to the specific area you were asking about.

The area you were asking about: "${data.domainLabel}"
The user's input: "${data.userQuestion}"
${data.goal ? `Their goal for this Context: ${data.goal}\nWhen you restate what you are trying to understand, tie it to that goal.\n` : ""}
There are three possible cases:
1. The user is asking a clarifying question. Briefly explain what you meant, concretely.
2. The user asked what you know about them. Answer briefly and plainly from what they have actually said in this conversation, then stop.
3. The user gave an answer that seems to be about something else. Thank them briefly, say in plain words that it's useful and you'll come back to it, and restate in one sentence what you're trying to understand right now. If the other topic is obvious from their words you may name it conversationally ("that sounds more like how you make decisions"), without pretending you're certain.

Speak like a person, not a system: never mention filing, saving, areas, domains, categories, labels, confidence, or any other internal mechanics.

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
