import type { Domain, InterviewState } from "~/routes/-knowledgeGraph";

type Offering = "context" | "meos";

export interface StructuredInterviewExport {
  schemaVersion: 1;
  product: "ALVIRA";
  offering: Offering;
  topic: string;
  tier: string;
  domains: Array<{
    id: string;
    label: string;
    confidence: number;
    covered: boolean;
    answers: string[];
  }>;
  sources: Array<{
    type: string;
    label: string;
    locator: string;
    status: string;
  }>;
}

export function buildStructuredInterviewExport(
  state: InterviewState,
  graph: Domain[],
  offering: Offering,
): StructuredInterviewExport {
  return {
    schemaVersion: 1,
    product: "ALVIRA",
    offering,
    topic: state.topic,
    tier: state.tier,
    domains: graph.map((domain) => {
      const domainState = state.domains[domain.id];
      return {
        id: domain.id,
        label: domain.label,
        confidence: domainState?.confidence ?? 0,
        covered: domainState?.covered ?? false,
        answers: [...(domainState?.answers ?? [])],
      };
    }),
    sources: (state.contextSources ?? []).map((source) => ({
      type: source.type,
      label: source.label,
      locator: source.locator,
      status: source.status,
    })),
  };
}

export function serializeInterviewJson(data: StructuredInterviewExport): string {
  return `${JSON.stringify(data, null, 2)}\n`;
}

function toonString(value: string): string {
  let output = '"';
  for (const char of value) {
    const code = char.charCodeAt(0);
    if (char === '"') output += '\\"';
    else if (char === "\\") output += "\\\\";
    else if (char === "\n") output += "\\n";
    else if (char === "\r") output += "\\r";
    else if (char === "\t") output += "\\t";
    else if (code <= 0x1f) output += `\\u${code.toString(16).padStart(4, "0")}`;
    else output += char;
  }
  return `${output}"`;
}

function toonPrimitiveArray(key: string, values: string[], indent: string): string[] {
  if (values.length === 0) return [`${indent}${key}: []`];
  return [`${indent}${key}[${values.length}]: ${values.map(toonString).join(",")}`];
}

/**
 * Deterministic TOON 4.x-compatible encoding of the same JSON-shaped export.
 * Domains use list form because each domain contains a nested answers array.
 */
export function serializeInterviewToon(data: StructuredInterviewExport): string {
  const lines: string[] = [
    `schemaVersion: ${data.schemaVersion}`,
    `product: ${toonString(data.product)}`,
    `offering: ${toonString(data.offering)}`,
    `topic: ${toonString(data.topic)}`,
    `tier: ${toonString(data.tier)}`,
  ];

  if (data.domains.length === 0) {
    lines.push("domains: []");
  } else {
    lines.push(`domains[${data.domains.length}]:`);
    for (const domain of data.domains) {
      lines.push(`  - id: ${toonString(domain.id)}`);
      lines.push(`    label: ${toonString(domain.label)}`);
      lines.push(`    confidence: ${domain.confidence}`);
      lines.push(`    covered: ${domain.covered ? "true" : "false"}`);
      lines.push(...toonPrimitiveArray("answers", domain.answers, "    "));
    }
  }

  if (data.sources.length === 0) {
    lines.push("sources: []");
  } else {
    lines.push(`sources[${data.sources.length}]{type,label,locator,status}:`);
    for (const source of data.sources) {
      lines.push(`  ${[source.type, source.label, source.locator, source.status].map(toonString).join(",")}`);
    }
  }

  return `${lines.join("\n")}\n`;
}
