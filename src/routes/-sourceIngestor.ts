import { createServerFn } from "@tanstack/react-start";

const MAX_SOURCE_CHARS = 120_000;
const MAX_SOURCE_BYTES = 2_000_000;

function isBlockedHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/[\[\]]/g, "");
  return host === "localhost" || host === "0.0.0.0" || host === "::1" || host.startsWith("127.") || host.startsWith("10.") || host.startsWith("192.168.") || /^172\.(1[6-9]|2\d|3[0-1])\./.test(host) || host.startsWith("169.254.");
}

function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?>(?=.)/gi, "\n")
    .replace(/<\/p>|<\/div>|<\/li>|<\/h[1-6]>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim()
    .slice(0, MAX_SOURCE_CHARS);
}

export const ingestUrlSource = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const locator = String((data as { locator?: unknown })?.locator ?? "").trim();
    if (!/^https?:\/\//i.test(locator)) throw new Error("Enter a valid http(s) URL.");
    const url = new URL(locator);
    if (isBlockedHostname(url.hostname)) throw new Error("That source address is not available.");
    return { locator };
  })
  .handler(async ({ data }) => {
    const response = await fetch(data.locator, {
      headers: { Accept: "text/html,text/plain;q=0.9" },
      signal: AbortSignal.timeout(12_000),
    });
    if (!response.ok) throw new Error(`That source could not be read (${response.status}).`);
    const contentLength = Number(response.headers.get("content-length") ?? 0);
    if (contentLength > MAX_SOURCE_BYTES) throw new Error("That source is too large to review (2MB maximum).");
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType && !/(text\/|application\/json)/i.test(contentType)) throw new Error("That source is not a readable text page.");
    const raw = await response.text();
    if (raw.length > MAX_SOURCE_BYTES) throw new Error("That source is too large to review (2MB maximum).");
    const text = contentType.includes("html") ? htmlToText(raw) : raw.trim().slice(0, MAX_SOURCE_CHARS);
    if (!text) throw new Error("That source did not contain readable text.");
    return { locator: data.locator, text };
  });
