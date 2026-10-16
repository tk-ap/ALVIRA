// ── Source links: public URLs supplied during the interview become Context sources ──
//
// Any answer may carry links (a website, a repository, a profile, a doc). They are
// captured as ContextSources with who added them, so any AI reading the Context can
// see where the facts come from, and several contributors stay distinguishable.
//
// A link found in an answer is not known to be public: it is kept as "needs-review"
// and only exported once the owner confirms it ("ready"). Links that carry credentials
// (tokens, signatures) are never stored at all.

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

/** Query parameters that make a URL a credential: signed, tokenised or keyed links. */
const CREDENTIAL_PARAM = /^(?:x-amz-[a-z-]+|x-goog-[a-z-]+|token|access_token|id_token|auth|authorization|sig|signature|key|api_?key|secret|password|pwd|code|session|sessionid|jwt|se|sp|sv|st)$/i;

/** True when the URL carries a credential in its query, fragment or userinfo; such links are never stored. */
export function carriesCredential(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.username || parsed.password) return true;
    const params = [...parsed.searchParams.keys(), ...new URLSearchParams(parsed.hash.replace(/^#/, "")).keys()];
    return params.some((name) => CREDENTIAL_PARAM.test(name));
  } catch {
    return false;
  }
}

/** Hosts whose links are usually private shares, internal or not yet public. */
const PRIVATE_HOST = /(^|\.)(docs\.google\.com|drive\.google\.com|notion\.so|notion\.site|dropbox\.com|box\.com|sharepoint\.com|onedrive\.live\.com|1drv\.ms|icloud\.com|figma\.com|airtable\.com|localhost)$/i;

/** A reason to look twice before confirming this link as public, or undefined when none is obvious. */
export function privateLinkReason(url: string): string | undefined {
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (PRIVATE_HOST.test(host)) return "Often a private share link; confirm it is public before sharing.";
    if (/^(?:10|127|192\.168|172\.(?:1[6-9]|2\d|3[01]))\./.test(host) || host.endsWith(".local") || host.endsWith(".internal")) return "A private network address.";
    if (/(^|[.-])(staging|stage|preview|dev|test|internal|admin)[.-]/.test(host)) return "Looks like a staging or internal site.";
    return undefined;
  } catch {
    return undefined;
  }
}

/** Placeholders left in a stored answer where a link was. They never contain a URL. */
export const LINK_HELD = "[link held for owner review]";
export const LINK_REMOVED = "[link removed: it carried a credential]";

/**
 * The answer text as it is stored and compiled: every link is replaced by a placeholder, so a
 * link reaches the Context only as an owner-confirmed source and a credential never does.
 * The original text is used once, by sourcesFromAnswer, before it is discarded.
 */
export function redactAnswerLinks(text: string): string {
  return text.replace(LINK, (match, offset: number, whole: string) => {
    if (offset > 0 && whole.charAt(offset - 1) === "@") return match; // an email address
    const trailing = match.match(/[.,;:!?)\]]+$/)?.[0] ?? "";
    const raw = trailing ? match.slice(0, -trailing.length) : match;
    let url: string;
    try {
      url = new URL(normalizeLocator(raw)).toString();
    } catch {
      return match;
    }
    return (carriesCredential(url) ? LINK_REMOVED : LINK_HELD) + trailing;
  });
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

/** Host plus any path, so two pages on one site stay distinguishable (E2E: ".../career" read as the bare site). */
function labelFor(url: string): string {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    const path = parsed.pathname.replace(/\/+$/, "");
    return path ? `${host}${path}` : host;
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
    .filter((url) => !carriesCredential(url))
    .filter((url) => !existing.some((source) => sameLocator(source.locator, url)))
    .map((url) => {
      const type = classifySourceLocator(url);
      const reviewNote = privateLinkReason(url);
      return {
        id: crypto.randomUUID(),
        type,
        label: labelFor(url),
        locator: url,
        status: "needs-review" as const,
        addedAt: now,
        addedBy: contributor,
        ...(reviewNote ? { reviewNote } : {}),
      };
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

/** Links found in answers that the owner has not confirmed yet. */
export function linksNeedingReview(sources: ContextSource[] | undefined): ContextSource[] {
  return (sources ?? []).filter((source) => source.status === "needs-review" && /^https?:\/\//i.test(source.locator));
}

/**
 * A "Sources" section for the compiled Context, so any AI reading it can see and follow the links.
 * Only owner-confirmed ("ready") links are exported; links still awaiting review never are.
 */
export function sourcesMarkdown(sources: ContextSource[] | undefined): string {
  const links = (sources ?? []).filter((source) => source.status === "ready" && /^https?:\/\//i.test(source.locator) && !carriesCredential(source.locator));
  if (links.length === 0) return "";
  const lines = links.map((source) => {
    const who = source.addedBy?.actor_type === "agent" ? `agent ${source.addedBy.actor_id ?? "(unnamed)"}` : source.addedBy ? "the person" : "unrecorded";
    return `- [${source.label}](${source.locator}) — ${TYPE_LABEL[source.type] ?? source.type}; added by ${who}, ${source.addedAt.slice(0, 10)}`;
  });
  return `## Sources\n\nPublic links the owner confirmed. Treat them as evidence to check, not as confirmed facts.\n\n${lines.join("\n")}`;
}
