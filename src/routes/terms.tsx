import { createFileRoute } from "@tanstack/react-router";
import { Header } from "~/components/Header";
import { TrustFooter } from "~/components/TrustFooter";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [{ title: "Terms of Service — ALVIRA" }, { name: "description", content: "The terms that apply to your use of ALVIRA." }],
  }),
  component: Terms,
});

function Terms() {
  return <Page title="Terms of Service">
    <h2>Acceptance</h2>
    <p>By using ALVIRA, you agree to these terms. If you do not agree, do not use the service.</p>

    <h2>Accounts</h2>
    <p>You are responsible for your account security. Provide accurate information and keep your credentials confidential. Each account is for one person.</p>

    <h2>Acceptable use</h2>
    <p>Do not misuse ALVIRA. This includes illegal activity, reverse engineering, scraping, or abuse of the interview system. We may suspend accounts that violate these terms.</p>

    <h2>Your content</h2>
    <p>You own your interview answers, profiles, and compiled knowledge files. By using ALVIRA, you grant us a limited license to store and process your content solely to provide the service. This license ends when you delete your account.</p>

    <h2>Plans and payments</h2>
    <p>The Free tier includes one profile and three interviews. Pro costs $20 per month or $192 per year and auto-renews until cancelled. Lifetime costs $399 as a one-time purchase. MeOS Build costs $149 as a one-time purchase and requires an active Pro subscription. MeOS Care costs $29 per month and auto-renews until cancelled. Prices may change with notice; we’ll notify you before your renewal.</p>

    <h2>Cancellation</h2>
    <p>Cancel anytime. Cancellation stops future renewals, but the current period is not refunded except as described in our <a href="/refunds">Refund Policy</a>.</p>

    <h2>Service availability</h2>
    <p>We work to keep ALVIRA available, but do not guarantee uninterrupted service. We may change or discontinue features with reasonable notice.</p>

    <h2>Disclaimer</h2>
    <p>ALVIRA is provided “as is” without warranties. We are not liable for decisions you make based on AI-generated output or compiled knowledge files.</p>

    <h2>Limitation of liability</h2>
    <p>To the fullest extent permitted by law, our liability is limited to the amount you have paid us in the past 12 months.</p>

    <h2>Governing law</h2>
    <p>These terms are governed by the laws of the State of Delaware.</p>

    <h2>Changes to terms</h2>
    <p>We’ll notify you of material changes by email. Continued use of ALVIRA after changes means you accept the updated terms.</p>

    <h2>Contact</h2>
    <p>Questions about these terms can be sent to <a href="mailto:contextforge-18281ce4@ctomail.io">contextforge-18281ce4@ctomail.io</a>.</p>
  </Page>;
}

function Page({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="min-h-dvh flex flex-col"><Header /><main id="main-content" className="mx-auto w-full max-w-3xl flex-1 px-6 py-16"><p className="font-mono text-xs uppercase tracking-widest text-human">&lt; trust /&gt;</p><h1 className="mt-4 text-4xl font-semibold text-gray-900 dark:text-gray-100">{title}</h1><div className="mt-10 space-y-6 text-base leading-8 text-gray-600 dark:text-gray-400">{children}</div></main><TrustFooter /></div>;
}
