// ── Provider files: the compiled Context, ready to load into a specific AI tool ──
//
// The output screen offers an AI Working Profile and one setup file per tool (ChatGPT, Claude,
// Gemini, Cursor). They are built deterministically from the five compiled Markdown files — no
// LLM, nothing added that the interview did not record — so every tab has real content.

import type { MarkdownFiles } from "~/routes/-knowledgeCompiler";

export interface ProviderFiles {
  aiProfile: string;
  chatgpt: string;
  claude: string;
  gemini: string;
  cursor: string;
}

const EMPTY_AREA = "_No information gathered for this area yet._";

/** False for a compiled file that holds only its heading and the "nothing gathered" note: no tab, no download. */
export function hasRecordedContent(file: string | undefined): boolean {
  return Boolean(file && file.trim() && !file.includes(EMPTY_AREA));
}

/** The compiled files in reading order, empty areas dropped, headings moved down one level. */
function profileBody(files: MarkdownFiles): string {
  const parts = [files.overview, files.requirements, files.constraints, files.businessRules, files.workflows]
    .map((file) => (file ?? "").trim())
    .filter((file) => hasRecordedContent(file));
  if (parts.length === 0) return "_The interview has not recorded anything yet._\n";
  return `${parts.map((file) => file.replace(/^(#{1,5}) /gm, "#$1 ")).join("\n\n")}\n`;
}

const STANDING_INSTRUCTIONS = [
  "Treat everything below as the person's own account, recorded in an ALVIRA interview. Lines marked as inferred were not confirmed by them.",
  "Use it to tailor answers to their goal, priorities and constraints without asking them to repeat it.",
  "When something you need is not covered here, ask rather than guess, and say which part you are assuming.",
  "Links under Sources are evidence to check, not confirmed facts.",
];

function standing(): string {
  return STANDING_INSTRUCTIONS.map((line) => `- ${line}`).join("\n");
}

function title(topic: string): string {
  return topic.trim() || "My AI context";
}

function providerFile(tool: string, howTo: string, topic: string, body: string): string {
  return `# ${tool} setup — ${title(topic)}

${howTo}

## Instructions for ${tool}

${standing()}

## Context

${body}`;
}

export function buildProviderFiles(files: MarkdownFiles, topic: string): ProviderFiles {
  const body = profileBody(files);
  return {
    aiProfile: `# AI Working Profile — ${title(topic)}

_Compiled by ALVIRA from direct interview answers. One file to give any AI model the whole Context._

## How to use this Context

${standing()}

${body}`,
    chatgpt: providerFile(
      "ChatGPT",
      "Paste this file into a ChatGPT Project's instructions, or upload it as a Project file. For a shorter version, paste the Instructions section into your custom instructions.",
      topic,
      body,
    ),
    claude: providerFile(
      "Claude",
      "Add this file to a Claude Project's knowledge, or paste it into the Project's instructions.",
      topic,
      body,
    ),
    gemini: providerFile(
      "Gemini",
      "Paste this file into a Gem's instructions, or upload it as a Gem knowledge file.",
      topic,
      body,
    ),
    cursor: `---
description: ALVIRA Context — ${title(topic).replace(/\n/g, " ")}
alwaysApply: true
---

${providerFile("Cursor", "Save this file as `.cursor/rules/alvira-context.mdc` in your project so Cursor applies it to every request.", topic, body)}`,
  };
}
