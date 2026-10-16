// ── Source links: public URLs supplied during the interview become Context sources ──
//
// Any answer may carry links (a website, a repository, a profile, a doc). They are
// captured as ContextSources with who added them, so any AI reading the Context can
// see where the facts come from, and several contributors stay distinguishable.

import { classifySourceLocator, normalizeLocator, type ContextSource, type ContextSourceType, type SourceContributor } from "~/lib/context-engine";

/** http(s) URLs, plus bare domains with a path or a well-known host ("github.com/acme/app"). */
const LINK = /\bhttps?:\/\/[^\s<>()"'`]+|\b(?:[a-z0-9-]+\.)+(?:com|org|net|io|ai|app|dev|co|me|so|xyz|info|tech|vercel\.app)(?:\/[^\s<>()"'`]*)?/gi;

/** Finds public links in free text, in order, without duplicates or trailing punctuation. */
export function findLinks(text: string): string[] {
  const found: string[] = [];
  for (const match of text.matchAll(LINK)) {
    const start = match.index ?? 0;
    if (start > 0 && text.charAt(start - 1) === "@") continue; // an email address, not a link
    const raw = match[0].replace(/[.,;:!?)\]]+$/, "");
    const url = normalizeLocator(raw);
    try {
      new URL(url);
    } catch {
      continue;
    }
    if (!found.some((existing) => sameLocator(existing, url))) found.push(url);
  }
  return found;
}

/** Locators that point at the same page: case-insensitive host, no "www.", no trailing slash. */
export function sameLocator(a: string, b: string): boolean {
  const key = (value: string) => {
    try {
      const url = new URL(normalizeLocator(value));
      return `${url.hostname.replace(/^www\./, "").toLowerCase()}${url.pathname.replace(/\/+$/, "")}${url.search}`;
    } catch {
      return value.trim().toLowerCase();
    }
  };
  return key(a) === key(b);
}

/** An explicit "no links" answer for the sources area. */
export function isNoSourcesAnswer(text: string): boolean {
  return /^\s*(none|no(ne)?\s+(links?|sources?|urls?)|n\/?a|nothing( public)?( yet)?|not (yet|applicable))\b[\s.!]*$/i.test(text);
}

/** The contributor for this interview: the delegated agent when there is one, else the person. */
export function contributorFor(state: unknown): SourceContributor {
  // Interview state carries `provenance` only in delegated agent mode.
  const provenance = (state as { provenance?: { actor_type?: string; actor_id?: string } } | null | undefined)?.provenance;
  return provenance?.actor_type === "agent"
    ? { actor_type: "agent", ...(provenance.actor_id ? { actor_id: provenance.actor_id } : {}) }
    : { actor_type: "human" };
}

function labelFor(url: string, type: ContextSourceType): string {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    const path = parsed.pathname.replace(/\/+$/, "");
    return path && path !== "/" && type !== "website" ? `${host}${path}` : host;
  } catch {
    return url;
  }
}

/** New sources for the links in an answer, skipping any already in `existing`. */
export function sourcesFromAnswer(
  text: string,
  existing: ContextSource[],
  contributor: SourceContributor,
  now: string = new Date().toISOString(),
): ContextSource[] {
  return findLinks(text)
    .filter((url) => !existing.some((source) => sameLocator(source.locator, url)))
    .map((url) => {
      const type = classifySourceLocator(url);
      return { id: crypto.randomUUID(), type, label: labelFor(url, type), locator: url, status: "queued" as const, addedAt: now, addedBy: contributor };
    });
}

const TYPE_LABEL: Record<ContextSourceType, string> = {
  website: "Website",
  professional: "Professional / code",
  social: "Social",
  file: "File",
  "ai-context": "AI context",
  interview: "Interview",
};

/** A "Sources" section for the compiled Context, so any AI reading it can see and follow the links. */
export function sourcesMarkdown(sources: ContextSource[] | undefined): string {
  const links = (sources ?? []).filter((source) => /^https?:\/\//i.test(source.locator));
  if (links.length === 0) return "";
  const lines = links.map((source) => {
    const who = source.addedBy?.actor_type === "agent" ? `agent ${source.addedBy.actor_id ?? "(unnamed)"}` : source.addedBy ? "the person" : "unrecorded";
    return `- [${source.label}](${source.locator}) — ${TYPE_LABEL[source.type] ?? source.type}; added by ${who}, ${source.addedAt.slice(0, 10)}`;
  });
  return `## Sources\n\nPublic links supplied during the interview. Treat them as evidence to check, not as confirmed facts.\n\n${lines.join("\n")}`;
}
