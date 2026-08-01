import type { Domain, InterviewState } from "./-knowledgeGraph";
import OpenAI from "openai";

export interface MeosPortrait {
  portrait: string;
  purposeStatements: { personal: string; professional: string };
  decisionCompass: string;
  dailyAlignment: string;
  cycles: string;
  sourceConfidence: { userSupplied: string[]; inferred: string[]; selfValidated: string[] };
}

const emptyPortrait = (): MeosPortrait => ({
  portrait: "Your portrait will take shape as you share more about your current chapter, values, and direction.",
  purposeStatements: { personal: "", professional: "" }, decisionCompass: "When facing a decision, ask yourself what aligns with your values and boundaries.",
  dailyAlignment: "Take a moment to notice what matters today and choose one action that supports it.", cycles: "Your current chapter is still unfolding.",
  sourceConfidence: { userSupplied: [], inferred: [], selfValidated: [] },
});

/** Generate a reflective portrait strictly from interview evidence. */
export async function generatePortrait(state: InterviewState): Promise<MeosPortrait> {
  const a = (id: string) => state.domains[id]?.answers ?? [];
  const source = Object.fromEntries(["currentChapter", "desiredOutcomes", "values", "boundaries", "goals", "decisionPatterns", "workHistory", "definitionOfSuccess", "frameworks", "birthData", "review", "validation"].map(id => [id, a(id)]));
  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.chat.completions.create({ model: "gpt-4o", response_format: { type: "json_object" }, messages: [
      { role: "system", content: `You generate an integrated personal portrait for a MeOS user. This is NOT a spiritual reading, horoscope, or prediction. Reflect only what the user explicitly stated, validated through interview and self-review. Return valid JSON with exactly: portrait (3-4 paragraphs, second person), purposeStatements {personal, professional}, decisionCompass (start "When facing a decision, ask yourself..." and include 3-5 questions), dailyAlignment, cycles, sourceConfidence {userSupplied, inferred, selfValidated}. Do not invent details. Birth data may inform only a cautious note about symbolic cycles, never fabricated astrological data.` },
      { role: "user", content: JSON.stringify(source) },
    ] });
    const parsed = JSON.parse(response.choices[0]?.message?.content || "{}");
    return { ...emptyPortrait(), ...parsed, purposeStatements: { ...emptyPortrait().purposeStatements, ...(parsed.purposeStatements || {}) }, sourceConfidence: { ...emptyPortrait().sourceConfidence, ...(parsed.sourceConfidence || {}) } };
  } catch (error) {
    console.error("MeOS portrait generation failed", error);
    return emptyPortrait();
  }
}

export interface MeosOutput {
  portrait: string;
  purposeStatements: string;
  boundaries: string;
  definitionOfSuccess: string;
  decisionCompass: string;
  careerTools: string;
  cycles: string;
  sourceTrace: string;
  allFiles: Record<string, string>;
}

const tag = (answer: string) => `[user-supplied] ${answer.trim()}`;
function section(title: string, answers: string[], empty = "_No information gathered yet._") {
  return `## ${title}\n\n${answers.length ? answers.map(tag).join("\n\n") : empty}\n`;
}

/** Deterministic MeOS compiler. It never calls an LLM. */
export function compileMeosKnowledge(state: InterviewState, graph: Domain[]): MeosOutput {
  const answers = (id: string) => state.domains[id]?.answers ?? [];
  const frameworkValues = answers("frameworks");
  const birthValues = answers("birthData");
  const reviewValues = answers("review");
  const validationValues = answers("validation");
  const portrait = `# Integrated Portrait: ${state.topic || "My Personal Operating System"}\n\n${section("Frameworks", frameworkValues)}\n${birthValues.length ? section("Birth Data", birthValues.map(v => { try { const d = JSON.parse(v); return `Natal chart data recorded: ${d.date || "date not supplied"}, ${d.unknownTime ? "time unknown" : d.time || "time not supplied"}, ${d.location || "location not supplied"}`; } catch { return v; } })) : ""}\n${section("Review Results", reviewValues)}\n${section("Validation Notes", validationValues)}\n${section("Current Chapter", answers("currentChapter"))}\n${section("Desired Outcomes", answers("desiredOutcomes"))}\n${section("Values", answers("values"))}\n\n> [inferred] The portrait is grounded in the user's stated chapter, outcomes, and values. Confidence: recorded interview evidence.\n`;
  const purposeStatements = `# Purpose Statements\n\n${section("Personal and Professional Purpose", answers("desiredOutcomes"))}`;
  const boundaries = `# Boundaries\n\n${section("Aligned / Not Aligned", answers("boundaries"))}`;
  const definitionOfSuccess = `# Definition of Success\n\n${section("Personal Definition", answers("definitionOfSuccess"))}`;
  const decisionCompass = `# Decision Compass\n\n${section("Decision Patterns", answers("decisionPatterns"))}\n${section("Goals", answers("goals"))}`;
  const careerTools = `# Career Tools\n\n${section("Work History", answers("workHistory"))}\n${section("Frameworks", answers("frameworks"))}`;
  const cycles = `# Cycles and Countdowns\n\n${section("Current Chapter and Birth Data", [...answers("currentChapter"), ...answers("birthData")])}`;
  const trace = graph.map((d) => {
    const ds = state.domains[d.id];
    return `- ${d.label}: ${ds?.answers.length ? ds.answers.map((a) => `[user-supplied] ${a}`).join(" | ") : "not supplied"}`;
  }).join("\n");
  const sourceTrace = `# Source Traceability\n\n${trace}\n\nReview and validation claims should be marked [self-validated] when confirmed by the owner.`;
  const allFiles = { "portrait.md": portrait, "purpose-statements.md": purposeStatements, "boundaries.md": boundaries, "definition-of-success.md": definitionOfSuccess, "decision-compass.md": decisionCompass, "career-tools.md": careerTools, "cycles.md": cycles, "source-trace.md": sourceTrace };
  return { portrait, purposeStatements, boundaries, definitionOfSuccess, decisionCompass, careerTools, cycles, sourceTrace, allFiles };
}
