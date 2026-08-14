// ── Knowledge Compiler: deterministic Markdown generation (NO LLM) ──

import type { Domain, InterviewState } from "./-knowledgeGraph";

export interface MarkdownFiles {
  overview: string;
  requirements: string;
  constraints: string;
  businessRules: string;
  workflows: string;
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
export function compileKnowledge(
  state: InterviewState,
  graph: Domain[],
): MarkdownFiles {
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

  const workflows = buildFile("# Workflows & Processes\n", sections.workflows);

  return { overview, requirements, constraints, businessRules, workflows };
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
