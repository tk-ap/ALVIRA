import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import OpenAI from "openai";
import { getSessionByToken, getUserById } from "~/db";
import {
  buildExperimentalQuestionPrompt,
  buildProductionQuestionPrompt,
} from "~/lib/interview-prompts";
import { getKnowledgeGraph, type Message, type Tier } from "./-knowledgeGraph";

export type InterviewLabPromptVersion = "production" | "lab-v2";

const SESSION_COOKIE = "alvira_session";

async function requireOwner(): Promise<void> {
  const token = getCookie(SESSION_COOKIE);
  if (!token) throw new Error("Owner access required.");

  const session = await getSessionByToken(token);
  if (!session || new Date(session.expires_at) < new Date()) {
    throw new Error("Owner access required.");
  }

  const user = await getUserById(session.user_id);
  if (!user) throw new Error("Owner access required.");

  const ownerEmail = (process.env.ALVIRA_OWNER_EMAIL ?? "tahlia.ashwood@gmail.com")
    .trim()
    .toLowerCase();

  if (user.email.trim().toLowerCase() !== ownerEmail) {
    throw new Error("Owner access required.");
  }
}

function parseTier(value: unknown): Tier {
  if (value === "team" || value === "enterprise") return value;
  return "personal";
}

function parseHistory(value: unknown): Message[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Message => {
      if (!item || typeof item !== "object") return false;
      const candidate = item as { role?: unknown; content?: unknown };
      return (
        (candidate.role === "user" || candidate.role === "assistant") &&
        typeof candidate.content === "string"
      );
    })
    .map((item) => ({ role: item.role, content: item.content.slice(0, 12000) }))
    .slice(-40);
}

export const generateInterviewLabTurn = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const input = data as {
      tier?: unknown;
      domainId?: unknown;
      history?: unknown;
      promptVersion?: unknown;
    };

    const tier = parseTier(input.tier);
    const domainId = typeof input.domainId === "string" ? input.domainId : "";
    if (!domainId) throw new Error("Choose an interview area.");

    const promptVersion: InterviewLabPromptVersion =
      input.promptVersion === "production" ? "production" : "lab-v2";

    return {
      tier,
      domainId,
      history: parseHistory(input.history),
      promptVersion,
    };
  })
  .handler(async ({ data }) => {
    await requireOwner();

    const apiKey = process.env.OPENAI_API_KEY || "";
    if (!apiKey) throw new Error("API key not configured.");

    const domain = getKnowledgeGraph(data.tier).find((candidate) => candidate.id === data.domainId);
    if (!domain) throw new Error("Interview area not found.");

    const systemPrompt =
      data.promptVersion === "production"
        ? buildProductionQuestionPrompt({
            domain,
            history: data.history,
            tier: data.tier,
          })
        : buildExperimentalQuestionPrompt({
            domain,
            history: data.history,
            tier: data.tier,
          });

    const openai = new OpenAI({ apiKey });
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
    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      parsed = {};
    }

    const question =
      typeof parsed.question === "string" && parsed.question.trim()
        ? parsed.question.trim()
        : raw.trim();

    if (!question) throw new Error("The interview model returned an empty response.");

    return {
      question,
      promptVersion: data.promptVersion,
      domain: { id: domain.id, label: domain.label },
      diagnostics:
        data.promptVersion === "lab-v2"
          ? {
              carriedForward:
                typeof parsed.carried_forward === "string" ? parsed.carried_forward : "",
              targetGap: typeof parsed.target_gap === "string" ? parsed.target_gap : "",
              questionPurpose:
                typeof parsed.question_purpose === "string" ? parsed.question_purpose : "",
            }
          : null,
    };
  });
