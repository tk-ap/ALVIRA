export type Mark = "yes" | "partial" | "no";

export const MARKS: Record<Mark, string> = {
  yes: "✅",
  partial: "◑",
  no: "❌",
};
export const MARKS_LABEL: Record<Mark, string> = {
  yes: "Yes",
  partial: "Partial",
  no: "No",
};

export type Competitor = {
  id: string;
  displayName: string;
  /** Optional homepage-specific label for this competitor. */
  featureName?: string;
};

export type Dimension = {
  id: string;
  label: string;
  shortLabel: string;
  footnote?: string;
};

export const COMPARISON_COMPETITORS: Competitor[] = [
  { id: "alvira", displayName: "ALVIRA" },
  { id: "chatgpt", displayName: "ChatGPT", featureName: "ChatGPT Memory" },
  { id: "claude", displayName: "Claude", featureName: "Claude Projects" },
  { id: "gemini", displayName: "Gemini" },
  { id: "cursor", displayName: "Cursor", featureName: "Cursor Rules" },
  { id: "custom-gpts", displayName: "Custom GPTs" },
];

export const COMPARISON_DIMENSIONS: Dimension[] = [
  { id: "reusable-context", label: "Reusable context", shortLabel: "Context" },
  {
    id: "portable",
    label: "Cross-platform portability",
    shortLabel: "Portable",
  },
  {
    id: "elicitation",
    label: "Structured elicitation (guided interview)",
    shortLabel: "Elicitation",
  },
  {
    id: "validation",
    label: "Validation and confidence scoring",
    shortLabel: "Validation",
  },
  { id: "export", label: "Markdown export", shortLabel: "Export" },
  {
    id: "versions",
    label: "Version history",
    shortLabel: "Versions",
    footnote: "Coming soon for ALVIRA.",
  },
  {
    id: "ownership",
    label: "Data ownership and download",
    shortLabel: "Ownership",
  },
];

type Cell = { mark: Mark; note?: string };
export type ComparisonRow = Dimension & { cells: Record<string, Cell> };

const marks = (
  values: Record<string, Mark>,
  notes: Record<string, string> = {},
) =>
  Object.fromEntries(
    Object.entries(values).map(([id, mark]) => [
      id,
      { mark, ...(notes[id] ? { note: notes[id] } : {}) },
    ]),
  ) as Record<string, Cell>;

export const COMPARISON: ComparisonRow[] = [
  {
    ...COMPARISON_DIMENSIONS[0],
    cells: marks({
      alvira: "yes",
      chatgpt: "yes",
      claude: "yes",
      gemini: "yes",
      cursor: "yes",
      "custom-gpts": "yes",
    }),
  },
  {
    ...COMPARISON_DIMENSIONS[1],
    cells: marks({
      alvira: "yes",
      chatgpt: "no",
      claude: "no",
      gemini: "no",
      cursor: "partial",
      "custom-gpts": "no",
    }),
  },
  {
    ...COMPARISON_DIMENSIONS[2],
    cells: marks({
      alvira: "yes",
      chatgpt: "no",
      claude: "no",
      gemini: "no",
      cursor: "no",
      "custom-gpts": "no",
    }),
  },
  {
    ...COMPARISON_DIMENSIONS[3],
    cells: marks({
      alvira: "yes",
      chatgpt: "no",
      claude: "no",
      gemini: "no",
      cursor: "no",
      "custom-gpts": "no",
    }),
  },
  {
    ...COMPARISON_DIMENSIONS[4],
    cells: marks({
      alvira: "yes",
      chatgpt: "partial",
      claude: "partial",
      gemini: "partial",
      cursor: "yes",
      "custom-gpts": "no",
    }),
  },
  {
    ...COMPARISON_DIMENSIONS[5],
    cells: marks({
      alvira: "partial",
      chatgpt: "no",
      claude: "no",
      gemini: "no",
      cursor: "partial",
      "custom-gpts": "partial",
    }),
  },
  {
    ...COMPARISON_DIMENSIONS[6],
    cells: marks({
      alvira: "yes",
      chatgpt: "partial",
      claude: "partial",
      gemini: "partial",
      cursor: "yes",
      "custom-gpts": "partial",
    }),
  },
];

export const ALL_COMPARISON_COMPETITORS = COMPARISON_COMPETITORS;
