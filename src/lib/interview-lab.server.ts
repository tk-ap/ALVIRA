import OpenAI from "openai";
import {
  buildExperimentalQuestionPrompt,
  buildHistoryRecallResponse,
  buildProductionQuestionPrompt,
  isInterviewRecallRequest,
} from "~/lib/interview-prompts";
import {
  BASELINE_CLASSIFICATIONS,
  type InterviewLabBaselineFocus,
} from "~/lib/interview-lab-v2";
import {
  getKnowledgeGraph,
  type Message,
  type Tier,
} from "~/routes/-knowledgeGraph";

export type InterviewLabPromptVersion = "production" | "lab-v2";

export interface InterviewLabTurnInput {
  tier: Tier;
  domainId: string;
  history: Message[];
  promptVersion: InterviewLabPromptVersion;
  userName: string;
  baselineFocus: InterviewLabBaselineFocus[];
}

export interface InterviewLabTurnResult {
  question: string;
  promptVersion: InterviewLabPromptVersion;
  domain: { id: string; label: string };
  diagnostics: {
    carriedForward: string;
    targetGap: string;
    questionPurpose: string;
  } | null;
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

function parseBaselineFocus(value: unknown): InterviewLabBaselineFocus[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Record<string, unknown> =>
      Boolean(item && typeof item === "object"),
    )
    .map((item) => {
      const classification =
        typeof item.classification === "string" ? item.classification : "";
      return {
        label:
          typeof item.label === "string" ? item.label.trim().slice(0, 120) : "",
        classification: (
          BASELINE_CLASSIFICATIONS as readonly string[]
        ).includes(classification)
          ? (classification as InterviewLabBaselineFocus["classification"])
          : "needs_verification",
        rationale:
          typeof item.rationale === "string"
            ? item.rationale.trim().slice(0, 240)
            : "",
      };
    })
    .filter((item) => item.label)
    .slice(0, 12);
}

export function normalizeInterviewLabInput(
  data: unknown,
): InterviewLabTurnInput {
  const input = data as {
    tier?: unknown;
    domainId?: unknown;
    history?: unknown;
    promptVersion?: unknown;
    userName?: unknown;
    baselineFocus?: unknown;
  };

  const tier = parseTier(input.tier);
  const domainId =
    typeof input.domainId === "string" ? input.domainId.trim() : "";
  if (!domainId) throw new Error("Choose an interview area.");

  const promptVersion: InterviewLabPromptVersion =
    input.promptVersion === "production" ? "production" : "lab-v2";

  return {
    tier,
    domainId,
    history: parseHistory(input.history),
    promptVersion,
    userName:
      typeof input.userName === "string"
        ? input.userName.trim().slice(0, 80)
        : "",
    baselineFocus: parseBaselineFocus(input.baselineFocus),
  };
}

export async function runInterviewLabTurn(
  data: InterviewLabTurnInput,
): Promise<InterviewLabTurnResult> {
  const domain = getKnowledgeGraph(data.tier).find(
    (candidate) => candidate.id === data.domainId,
  );
  if (!domain) throw new Error("Interview area not found.");

  const latestUser = [...data.history]
    .reverse()
    .find((message) => message.role === "user");
  if (latestUser && isInterviewRecallRequest(latestUser.content)) {
    return {
      question: buildHistoryRecallResponse(data.history, data.userName),
      promptVersion: data.promptVersion,
      domain: { id: domain.id, label: domain.label },
      diagnostics:
        data.promptVersion === "lab-v2"
          ? {
              carriedForward:
                "Grounded recall from the user's own interview answers.",
              targetGap: "No new gap — user requested a recap.",
              questionPurpose:
                "Return captured context without filing the request as an interview answer.",
            }
          : null,
    };
  }

  const apiKey = process.env.OPENAI_API_KEY || "";
  if (!apiKey) throw new Error("API key not configured.");

  const systemPrompt =
    data.promptVersion === "production"
      ? buildProductionQuestionPrompt({
          domain,
          history: data.history,
          tier: data.tier,
          userName: data.userName,
        })
      : buildExperimentalQuestionPrompt({
          domain,
          history: data.history,
          tier: data.tier,
          userName: data.userName,
          baselineFocus: data.baselineFocus,
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

  if (!question)
    throw new Error("The interview model returned an empty response.");

  return {
    question,
    promptVersion: data.promptVersion,
    domain: { id: domain.id, label: domain.label },
    diagnostics:
      data.promptVersion === "lab-v2"
        ? {
            carriedForward:
              typeof parsed.carried_forward === "string"
                ? parsed.carried_forward
                : "",
            targetGap:
              typeof parsed.target_gap === "string" ? parsed.target_gap : "",
            questionPurpose:
              typeof parsed.question_purpose === "string"
                ? parsed.question_purpose
                : "",
          }
        : null,
  };
}
