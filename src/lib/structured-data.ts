// ── Structured data (JSON-LD) for search and AI crawlers ──
import { LIFETIME_PRICE } from "~/lib/pricing";

export const SITE_ORIGIN = "https://alviratech.vercel.app";

/** Canonical URL for a path: the production origin, no query, no trailing slash except "/". */
export function canonicalUrl(pathname: string): string {
  const path = pathname.split("?")[0].split("#")[0] || "/";
  return `${SITE_ORIGIN}${path === "/" ? "/" : path.replace(/\/+$/, "")}`;
}

/** schema.org SoftwareApplication with the published plans (kept in sync with /pricing). */
export function softwareApplicationJsonLd(): string {
  const lifetime = Number(LIFETIME_PRICE.replace(/[^0-9.]/g, ""));
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "ALVIRA",
    applicationCategory: "ProductivityApplication",
    operatingSystem: "Web",
    url: `${SITE_ORIGIN}/`,
    description: "ALVIRA builds a portable, owner-controlled Context so any AI tool understands your goals, priorities and constraints.",
    offers: [
      { "@type": "Offer", name: "Free", price: "0", priceCurrency: "USD" },
      { "@type": "Offer", name: "Pro", price: "20", priceCurrency: "USD", description: "Billed monthly" },
      { "@type": "Offer", name: "Lifetime", price: String(lifetime), priceCurrency: "USD" },
    ],
  });
}
