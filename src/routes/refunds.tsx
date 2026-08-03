import { createFileRoute } from "@tanstack/react-router";
import { Header } from "~/components/Header"; import { TrustFooter } from "~/components/TrustFooter";
export const Route = createFileRoute("/refunds")({
  head: () => ({
    meta: [{ title: 'Refund Policy — ALVIRA' }, { name: "description", content: '' }],
  }), component: Refunds });
function Refunds() { return <Page title="Refunds & Cancellation"><p><strong>Pro:</strong> cancel anytime from your account or by contacting us. Cancellation stops the next renewal; the current month or billing period is not refunded.</p><p><strong>Lifetime:</strong> request a full money-back refund within 14 days of purchase by emailing <a href="mailto:hello@alvira.ai">hello@alvira.ai</a>.</p><p><strong>MeOS Build:</strong> request a refund within 7 days of purchase. MeOS Care is recurring and can be cancelled before the next renewal; the current period is not refunded.</p></Page>; }
function Page({ title, children }: { title: string; children: React.ReactNode }) { return <div className="min-h-dvh flex flex-col"><Header /><main id="main-content" className="mx-auto w-full max-w-3xl flex-1 px-6 py-16"><p className="font-mono text-xs uppercase tracking-widest text-human">&lt; trust /&gt;</p><h1 className="mt-4 text-4xl font-semibold text-gray-900 dark:text-gray-100">{title}</h1><div className="mt-10 space-y-6 text-base leading-8 text-gray-600 dark:text-gray-400">{children}</div></main><TrustFooter /></div>; }
