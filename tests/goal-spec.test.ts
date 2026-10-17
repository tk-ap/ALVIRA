import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import {
  GOAL_SPEC_FIELDS,
  citableAnswers,
  goalSpecHasReleasedFields,
  goalSpecIsStale,
  goalSpecJson,
  goalSpecMarkdown,
  goalSpecPrompt,
  goalSpecReleasable,
  safeGoalSpecTopic,
  normalizeGoalSpecDraft,
  reviewGoalSpecField,
  storedAnswerCount,
} from "../src/lib/goal-spec";
import { getKnowledgeGraph, type InterviewState } from "../src/routes/-knowledgeGraph";

const OWNER = { actor_type: "human" as const };
const GRAPH = getKnowledgeGraph("personal");
const state = {
  tier: "personal",
  topic: "TK — Ashwood second brain: one central Context record",
  domains: {
    goals: { answers: ["One central, provenance-tagged Context record any AI can read.", "Done means ChatGPT and Claude both read it through the Bridge, refreshed weekly."], confidence: 1, covered: true },
    constraints: { answers: ["No spending without approval.", "[SENSITIVE — release only for money decisions] Savings run out in March."], confidence: 1, covered: true },
    sources: { answers: ["Provided: [link held for owner review]"], confidence: 1, covered: true },
  },
  history: [],
  currentDomain: null,
  contextSources: [
    { id: "a", type: "website", label: "alviratech.vercel.app", locator: "https://alviratech.vercel.app", status: "ready", addedAt: "2026-10-17T00:00:00Z" },
    { id: "b", type: "website", label: "docs.google.com", locator: "https://docs.google.com/document/d/PRIVATE123/edit", status: "needs-review", addedAt: "2026-10-17T00:00:00Z" },
  ],
} as unknown as InterviewState;
const citable = citableAnswers(state, GRAPH);

describe("what the draft may cite", () => {
  test("the goal as entered and each stored answer, by id", () => {
    expect(citable.map((c) => c.id)).toEqual(["topic", "goals#0", "goals#1", "constraints#0"]);
  });

  test("sensitive answers and raw Links & sources answers are never offered", () => {
    const text = citable.map((c) => c.text).join(" ");
    expect(text).not.toContain("Savings");
    expect(citable.some((c) => c.id.startsWith("sources#"))).toBe(false);
  });

  test("the prompt carries the ids and the no-guessing rule", () => {
    const prompt = goalSpecPrompt(state.topic, citable);
    expect(prompt).toContain("[goals#1]");
    expect(prompt).toContain('return value "" and citations [] for that field. Do not guess.');
  });
});

describe("normalizing a draft", () => {
  const draft = normalizeGoalSpecDraft(
    {
      fields: {
        goal: { value: "One central Context record any AI can read.", citations: ["goals#0", "topic"] },
        done: { value: "Both ChatGPT and Claude read it through the Bridge.", citations: ["goals#1"] },
        successMeasures: { value: "A 50% reduction in re-explaining.", citations: ["made-up#3"] },
        constraints: { value: "No spending without approval. See https://example.com/x?token=abc", citations: ["constraints#0"] },
        people: { value: "[SENSITIVE] private detail", citations: ["goals#0"] },
      },
    },
    citable,
    OWNER,
    storedAnswerCount(state),
    "2026-10-17T00:00:00Z",
  );

  test("a field resting on real answers is stated, with those citations", () => {
    expect(draft.fields.goal).toMatchObject({ status: "stated", citations: ["goals#0", "topic"], review: "pending" });
  });

  test("an invented citation makes the field unknown instead of a guess", () => {
    expect(draft.fields.successMeasures).toMatchObject({ value: "", citations: [], status: "unknown" });
  });

  test("links are redacted and sensitive text is dropped", () => {
    expect(draft.fields.constraints.value).not.toContain("example.com");
    expect(draft.fields.constraints.value).toContain("[link removed: it carried a credential]");
    expect(draft.fields.people.status).toBe("unknown");
  });

  test("every field exists, missing ones as unknown", () => {
    expect(Object.keys(draft.fields)).toEqual(GOAL_SPEC_FIELDS.map((f) => f.key));
    expect(draft.fields.nextSteps.status).toBe("unknown");
  });
});

describe("owner review and what leaves ALVIRA", () => {
  const base = normalizeGoalSpecDraft(
    { fields: { goal: { value: "One central Context record.", citations: ["goals#0"] }, done: { value: "Read by both AIs.", citations: ["goals#1"] }, constraints: { value: "No spending without approval.", citations: ["constraints#0"] } } },
    citable,
    OWNER,
    storedAnswerCount(state),
  );

  test("nothing is released until the owner approves", () => {
    expect(goalSpecHasReleasedFields(base)).toBe(false);
    expect(goalSpecMarkdown(base, citable, state)).toContain("10 fields are awaiting");
  });

  test("approved and edited fields are exported; pending and rejected ones are not", () => {
    let spec = reviewGoalSpecField(base, "goal", "approve");
    spec = reviewGoalSpecField(spec, "done", "edit", "Both ChatGPT and Claude read it every Monday.");
    spec = reviewGoalSpecField(spec, "constraints", "reject");
    const md = goalSpecMarkdown(spec, citable, state);
    expect(md).toContain("## Goal\n\nOne central Context record.");
    expect(md).toContain("_From: Goals, answer 1._");
    expect(md).toContain("Both ChatGPT and Claude read it every Monday.");
    expect(md).toContain("_Stated by the owner in review._");
    expect(md).not.toContain("No spending without approval.");
    expect(md).toContain("8 fields are awaiting");
    const json = JSON.parse(goalSpecJson(spec, state));
    expect(Object.keys(json.fields)).toEqual(["goal", "done"]);
    expect(json.fields.done).toEqual({ value: "Both ChatGPT and Claude read it every Monday.", basis: "owner", citations: [] });
  });

  test("an approved unknown field says 'not stated' rather than guessing", () => {
    const md = goalSpecMarkdown(reviewGoalSpecField(base, "people", "approve"), citable, state);
    expect(md).toContain("## People involved\n\n_Not stated in the interview._");
  });

  test("only owner-confirmed links are included, never ones awaiting review", () => {
    const md = goalSpecMarkdown(reviewGoalSpecField(base, "goal", "approve"), citable, state);
    expect(md).toContain("https://alviratech.vercel.app");
    expect(md).not.toContain("PRIVATE123");
  });

  test("undo returns a field to pending", () => {
    const spec = reviewGoalSpecField(reviewGoalSpecField(base, "goal", "approve"), "goal", "reset");
    expect(spec.fields.goal.review).toBe("pending");
  });

  test("a spec is out of date once the stored answers change", () => {
    expect(goalSpecIsStale(base, state)).toBe(false);
    const more = { ...state, domains: { ...state.domains, goals: { ...state.domains.goals, answers: [...state.domains.goals.answers, "New answer."] } } };
    expect(goalSpecIsStale(base, more)).toBe(true);
  });
});

describe("app wiring", () => {
  const app = readFileSync("src/routes/app.tsx", "utf8");

  test("only the owner reviews; a delegated agent can draft but not approve", () => {
    const review = app.slice(app.indexOf("const handleReviewGoalSpec"), app.indexOf("const handleReviewGoalSpec") + 300);
    expect(review).toContain("if (viewerIsAgent) return;");
    expect(app).toContain("canReview={!viewerIsAgent}");
  });

  test("goal-spec files are added to the download only when fields were approved", () => {
    expect(app).toContain('if (offering !== "meos" && state && goalSpecReleasable(state.goalSpec, state)) {');
    expect(app).toContain('zip.file("goal-spec.json", goalSpecJson(state.goalSpec, state));');
  });

  test("the spec and its reviews survive Continue and Update", () => {
    const seed = app.slice(app.indexOf("function seedStateFromExisting"), app.indexOf("// ── Document parsing helpers"));
    expect(seed).toContain("goalSpec: existing.goalSpec");
  });
});

describe("Codex review of 38b5ebd", () => {
  const base = normalizeGoalSpecDraft({ fields: { goal: { value: "One central Context record.", citations: ["goals#0"] } } }, citable, OWNER, storedAnswerCount(state));
  const approved = reviewGoalSpecField(base, "goal", "approve");

  test("P0: the exported topic is redacted, and a sensitive topic is replaced", () => {
    expect(safeGoalSpecTopic("[SENSITIVE — money] Pay off debt")).toBe("My AI context");
    const linked = { ...state, topic: "Ship it, notes at https://files.example.com/a?token=SECRET9 and https://docs.google.com/document/d/PRIV1/edit" };
    for (const out of [goalSpecMarkdown(approved, citable, linked), goalSpecJson(approved, linked)]) {
      expect(out).not.toContain("SECRET9");
      expect(out).not.toContain("PRIV1");
    }
    const sensitive = { ...state, topic: "[SENSITIVE — money] Pay off debt" };
    expect(goalSpecMarkdown(approved, citable, sensitive)).toContain("# Goal spec: My AI context");
    expect(goalSpecJson(approved, sensitive)).not.toContain("Pay off debt");
  });

  test("P1: an edit carrying a sensitive label is refused", () => {
    const spec = reviewGoalSpecField(base, "constraints", "edit", "[SENSITIVE — money] Savings run out in March.");
    expect(spec.fields.constraints.review).toBe("pending");
    expect(goalSpecMarkdown(spec, citable, state)).not.toContain("Savings");
  });

  test("fail closed: an out-of-date spec is not released", () => {
    expect(goalSpecReleasable(approved, state)).toBe(true);
    const more = { ...state, domains: { ...state.domains, goals: { ...state.domains.goals, answers: [...state.domains.goals.answers, "New answer."] } } };
    expect(goalSpecReleasable(approved, more)).toBe(false);
  });

  test("P0: drafting is signed-in only and derives everything from the caller's own saved draft", () => {
    const auth = readFileSync("src/routes/-auth.ts", "utf8");
    const at = auth.indexOf("export const draftGoalSpec");
    const fn = auth.slice(at, auth.indexOf("\n", at));
    expect(fn).toContain("const user = await requireUser();");
    expect(fn).toContain("FROM interview_drafts WHERE user_id = $1 AND offering = 'context'\", [user.id]");
    expect(fn).not.toContain(".validator(");
    const server = readFileSync("src/routes/-goalSpecGenerator.ts", "utf8");
    expect(server).toContain("citableAnswers({ topic: state.topic");
    const app = readFileSync("src/routes/app.tsx", "utf8");
    expect(app).toContain("const spec = await draftGoalSpec();");
    expect(app).toContain('if (!authUser) { setGoalSpecError("Sign in to draft a goal spec."); return; }');
  });
});
