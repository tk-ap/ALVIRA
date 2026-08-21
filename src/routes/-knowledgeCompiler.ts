// ── Knowledge Compiler: deterministic Markdown generation (NO LLM) ──

import type { Domain, InterviewState } from "./-knowledgeGraph";

export interface MarkdownFiles {
  overview: string;
  requirements: string;
  constraints: string;
  businessRules: string;
  workflows: string;
  aiProfile: string;
  chatgpt: string;
  claude: string;
  gemini: string;
  cursor: string;
}

// Map domain IDs to output file sections within each file
// Organized by domain for clean grouping
interface Section {
  label: string;
  content: string[];
}

/**
 * Deterministic function: takes validated interview state and produces 5 Markdown files.
 * Same input always produces the same output — no LLM involved.
 */
export function compileKnowledge(state: InterviewState, graph: Domain[]): MarkdownFiles {
  const projectName = state.topic || "My Project";
  const tierLabel =
    state.tier === "personal"
      ? "Personal"
      : state.tier === "team"
        ? "Team"
        : "Enterprise";

  // Collect sections per output file
  const sections: Record<string, Section[]> = {
    overview: [],
    requirements: [],
    constraints: [],
    businessRules: [],
    workflows: [],
  };

  for (const domain of graph) {
    const domainState = state.domains[domain.id];
    if (!domainState || domainState.answers.length === 0) continue;

    sections[domain.outputFile].push({
      label: domain.label,
      content: domainState.answers,
    });
  }

  // Build each file
  const overview = buildFile(
    `# Project: ${projectName}\n\n## Overview & Context\n\n_${tierLabel}-tier knowledge compiled by ALVIRA._\n`,
    sections.overview,
  );

  const requirements = buildFile(
    "# Requirements & Capabilities\n",
    sections.requirements,
  );

  const constraints = buildFile(
    "# Constraints, Boundaries & Compliance\n",
    sections.constraints,
  );

  const businessRules = buildFile(
    "# Business Rules & Decision Logic\n",
    sections.businessRules,
  );

  const workflows = buildFile(
    "# Workflows & Processes\n",
    sections.workflows,
  );

  const aiProfile = buildAiProfile(state, graph);
  return {
    overview,
    requirements,
    constraints,
    businessRules,
    workflows,
    aiProfile,
    chatgpt: buildProviderExport("ChatGPT", aiProfile),
    claude: buildProviderExport("Claude", aiProfile),
    gemini: buildProviderExport("Gemini", aiProfile),
    cursor: buildProviderExport("Cursor", aiProfile),
  };
}

function buildAiProfile(state: InterviewState, graph: Domain[]): string {
  const domain = (id: string) => state.domains[id]?.answers.filter(Boolean) ?? [];
  const section = (title: string, answers: string[]) => answers.length
    ? `## ${title}\n\n${answers.map((answer) => `- ${answer.trim()}`).join("\n")}\n`
    : "";
  const covered = graph.filter((item) => domain(item.id).length > 0).length;
  const projectName = state.topic || "My ALVIRA profile";

  return `# AI Working Profile: ${projectName}\n\n` +
    `> **Evidence standard:** Every statement below is drawn directly from the interview. ` +
    `Do not invent missing facts; ask a concise follow-up when context is incomplete.\n\n` +
    `## How to use this profile\n\n` +
    `Use this as durable context when helping the profile owner. Match their stated communication preferences, ` +
    `respect their constraints, surface trade-offs, and distinguish their direct instructions from assumptions.\n\n` +
    `## Coverage\n\n- **User-stated evidence:** ${covered} knowledge areas\n` +
    `- **Interview topic:** ${projectName}\n` +
    `- **Unknowns:** Ask rather than assume when a request falls outside the material below.\n\n` +
    section("Identity and context", [...domain("identity"), ...domain("background")]) +
    section("Goals and active priorities", [...domain("goals"), ...domain("currentProjects")]) +
    section("How to work with this person", [...domain("communication"), ...domain("preferences"), ...domain("relationships")]) +
    section("Decision principles", domain("decisionFrameworks")) +
    section("Constraints and non-negotiables", [...domain("constraints"), ...domain("exceptions")]) +
    section("Routines and operating context", [...domain("dailyLife"), ...domain("processes"), ...domain("toolsAndSystems")]) +
    section("Open questions and uncertainty", [...domain("unknowns"), ...domain("knowledgeGaps")]) +
    `## Assistant operating rules\n\n` +
    `1. Treat the listed material as user-stated context, not universal truth.\n` +
    `2. When priorities conflict, name the trade-off and ask for a decision.\n` +
    `3. Keep recommendations practical, specific, and aligned to the stated constraints.\n` +
    `4. Flag uncertainty explicitly instead of filling gaps with plausible guesses.\n`;
}

function buildProviderExport(provider: string, profile: string): string {
  const providerNote = provider === "Cursor"
    ? "Use this as project-level AI guidance. Keep it in a durable rules or context file and do not treat it as application source code."
    : `Paste this into ${provider}'s profile, project, or reusable-instructions area. Review it before sharing.`;
  return `# ${provider} setup\n\n${providerNote}\n\n${profile}`;
}

function buildFile(header: string, sections: Section[]): string {
  let md = header;

  if (sections.length === 0) {
    md += "\n_No information gathered for this area yet._\n";
    return md;
  }

  for (const section of sections) {
    md += `\n## ${section.label}\n\n`;
    for (let i = 0; i < section.content.length; i++) {
      const answer = section.content[i].trim();
      if (section.content.length > 1) {
        md += `### Response ${i + 1}\n\n`;
      }
      md += `${answer}\n\n`;
    }
  }

  return md;
}
