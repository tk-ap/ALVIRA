import { createFileRoute } from "@tanstack/react-router";
import { Header } from "~/components/Header";
import { TrustFooter } from "~/components/TrustFooter";

export const Route = createFileRoute("/refunds")({
  head: () => ({
    meta: [{ title: "Refund Policy — ALVIRA" }, { name: "description", content: "ALVIRA cancellation and refund policy." }],
  }),
  component: Refunds,
});

function Refunds() {
  return <Page title="Refunds & Cancellation">
    <h2>Pro</h2>
    <p>Cancel anytime from your account or by contacting us. Cancellation stops the next renewal; the current month or billing period is not refunded.</p>

    <h2>Annual Pro</h2>
    <p>If you cancel mid-year, your Pro benefits continue through the end of your paid term. There are no partial refunds for unused months.</p>

    <h2>Lifetime</h2>
    <p>Request a full refund within 14 days of purchase by emailing <a href="mailto:contextforge-18281ce4@ctomail.io">contextforge-18281ce4@ctomail.io</a>. After 14 days, Lifetime purchases are final.</p>

    <h2>MeOS Build</h2>
    <p>Request a refund within 7 days of purchase. After 7 days, MeOS Build purchases are final.</p>

    <h2>MeOS Care</h2>
    <p>Cancel anytime before the next renewal. The current month is not refunded.</p>

    <h2>How to cancel or request a refund</h2>
    <p>Email <a href="mailto:contextforge-18281ce4@ctomail.io">contextforge-18281ce4@ctomail.io</a>. Include your account email and what you’d like to cancel or refund. We’ll respond within 2 business days.</p>
  </Page>;
}

function Page({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="min-h-dvh flex flex-col"><Header /><main id="main-content" className="mx-auto w-full max-w-3xl flex-1 px-6 py-16"><p className="font-mono text-xs uppercase tracking-widest text-human">&lt; trust /&gt;</p><h1 className="mt-4 text-4xl font-semibold text-gray-900 dark:text-gray-100">{title}</h1><div className="mt-10 space-y-6 text-base leading-8 text-gray-600 dark:text-gray-400">{children}</div></main><TrustFooter /></div>;
}
