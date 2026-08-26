import { createServerFn } from "@tanstack/react-start";

const MAX_SOURCE_CHARS = 120_000;

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
    return { locator };
  })
  .handler(async ({ data }) => {
    const response = await fetch(data.locator, {
      headers: { Accept: "text/html,text/plain;q=0.9" },
      signal: AbortSignal.timeout(12_000),
    });
    if (!response.ok) throw new Error(`That source could not be read (${response.status}).`);
    const contentType = response.headers.get("content-type") ?? "";
    const raw = await response.text();
    const text = contentType.includes("html") ? htmlToText(raw) : raw.trim().slice(0, MAX_SOURCE_CHARS);
    if (!text) throw new Error("That source did not contain readable text.");
    return { locator: data.locator, text };
  });
