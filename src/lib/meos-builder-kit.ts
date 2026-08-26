export type MeosBuilderKitInput = {
  topic: string;
  portrait?: unknown;
  interviewState?: unknown;
  content: Record<string, string>;
};

export function createMeosBuilderKit(input: MeosBuilderKitInput): Record<string, string> {
  const generatedAt = new Date().toISOString();
  const contentFiles = Object.keys(input.content).sort();
  const profile = {
    schemaVersion: "1.0",
    generatedAt,
    topic: input.topic,
    portrait: input.portrait ?? null,
    interviewState: input.interviewState ?? null,
    contentFiles: contentFiles.map((name) => `content/${name}`),
    provenance: "Compiled from owner-provided and owner-reviewed ALVIRA Reflect interview material.",
  };

  const startHere = `# Start Here — Your ALVIRA Reflect Builder Kit

This package contains the personal source material and build specification needed for a capable coding agent to create a private ALVIRA Reflect companion.

## Recommended workflow

1. Review every file in \`content/\` and remove anything you do not want to share.
2. Read \`privacy-requirements.md\`.
3. Upload this package to your chosen coding agent.
4. Give the agent the instruction in \`AGENT-BUILD-BRIEF.md\`.
5. Review the generated application before connecting hosting, analytics, or external APIs.

## Security notice

This beta download is a standard ZIP archive and is **not encrypted**. Store it securely and encrypt it before uploading or sharing it if it contains sensitive information. ALVIRA will not claim encryption until password-protected package generation is implemented and verified.

Generated: ${generatedAt}
`;

  const buildBrief = `# ALVIRA Reflect Agent Build Brief

## Objective

Build a private, responsive reflection application from the supplied ALVIRA Reflect profile. The result should help the owner revisit their stated purpose, decision criteria, boundaries, daily practices, longer-term direction, and evidence of change over time.

## Canonical sources

- Use \`reflect-profile.json\` for structured metadata.
- Use files in \`content/\` for owner-approved language.
- Do not invent biographical facts, diagnoses, predictions, or personal claims.
- Preserve source qualifiers and uncertainty where present.

## Required routes

- \`/today\` — daily compass, one durable action, energy check, evening reflection
- \`/journey\` — dated evidence and progress over time
- \`/compass\` — success conditions and decision tests
- \`/purpose\` — personal and professional purpose
- \`/next-chapter\` — goals, career evidence, and experiments
- \`/portrait\` — integrated portrait
- \`/lenses\` — optional reflective frameworks with disclaimers
- \`/cycles\` — user-approved cycles and countdowns
- \`/resources\` — source documents and provenance

## Functional requirements

- Responsive and keyboard accessible.
- Private by default.
- Store daily entries locally unless the owner explicitly configures a secure backend.
- Provide export and delete controls for all user-created entries.
- Clearly distinguish owner statements, agent synthesis, and optional symbolic material.
- Never send personal content to analytics, advertising, or model providers without explicit consent.

## Visual direction

Calm, editorial, reflective, and practical. Favor strong typography, generous spacing, restrained color, visible progress, and short daily interactions over dashboard density.

## Completion standard

The application must satisfy every item in \`acceptance-criteria.md\` and display the reflective-practice disclaimer in the footer.
`;

  const privacy = `# Privacy Requirements

- Treat every supplied file as private personal data.
- Do not add third-party analytics by default.
- Do not transmit journal entries or profile content to an AI provider without an explicit, contextual confirmation.
- Keep local-only persistence as the default.
- Provide complete export and deletion controls.
- Never include secrets, API keys, passwords, or deployment tokens in client code.
- Symbolic frameworks must be described as optional reflective lenses, never scientific, diagnostic, predictive, or deterministic claims.
`;

  const dataModel = `# Data Model

## Profile

- schemaVersion
- generatedAt
- topic
- portrait
- contentFiles
- provenance

## Daily entry

- id
- date
- durableAction
- availableEnergy
- alignmentChecks
- evidence
- releasedResponsibility
- completedAt

## Source record

- id
- label
- sourceType
- ownerValidated
- contentReference
`;

  const acceptance = `# Acceptance Criteria

- All required routes are present and usable on mobile and desktop.
- Daily entries persist after refresh on the same device.
- The owner can export and permanently delete locally stored entries.
- Personal copy comes only from the supplied ALVIRA Reflect sources.
- Optional symbolic content carries a visible reflective-practice disclaimer.
- No analytics or external data transfer is enabled by default.
- Empty and incomplete profile sections fail gracefully without invented copy.
- Keyboard navigation and visible focus states work throughout.
- The footer states: “A reflective tool, not a diagnosis or guarantee. Your choices remain your own.”
`;

  return {
    "START-HERE.md": startHere,
    "AGENT-BUILD-BRIEF.md": buildBrief,
    "reflect-profile.json": JSON.stringify(profile, null, 2),
    "product-spec/routes.md": buildBrief.split("## Required routes")[1]?.split("## Functional requirements")[0]?.trim() || "See AGENT-BUILD-BRIEF.md.",
    "product-spec/data-model.md": dataModel,
    "product-spec/privacy-requirements.md": privacy,
    "product-spec/acceptance-criteria.md": acceptance,
    ...Object.fromEntries(Object.entries(input.content).map(([name, value]) => [`content/${name}`, value])),
  };
}
