import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Header } from "~/components/Header";
import { TrustFooter } from "~/components/TrustFooter";

export const Route = createFileRoute("/checkout/$plan")({ component: CheckoutRedirect });

function CheckoutRedirect() {
  const { plan } = Route.useParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const start = async () => {
      try {
        const response = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan }),
        });
        const payload = await response.json() as { url?: string; error?: string };
        if (cancelled) return;
        if (response.status === 401) {
          window.location.assign(`/login?returnTo=${encodeURIComponent(`/checkout/${plan}`)}`);
          return;
        }
        if (!response.ok || !payload.url) throw new Error("Checkout is temporarily unavailable.");
        window.location.assign(payload.url);
      } catch {
        if (!cancelled) setError("Secure checkout is temporarily unavailable. Please try again in a moment.");
      }
    };
    void start();
    return () => { cancelled = true; };
  }, [plan]);

  return (
    <div className="min-h-dvh bg-[#f4f0e9] text-[#191715] dark:bg-[#0b0e0e] dark:text-[#f4f0e9]">
      <Header />
      <main id="main-content" className="flex min-h-[70vh] items-center justify-center px-6 py-20">
        <div className="max-w-xl border border-[#191715]/12 p-8 dark:border-white/12 sm:p-10">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-system-dark dark:text-system">ALVIRA / Secure checkout</p>
          <h1 className="mt-5 font-display text-4xl font-semibold tracking-[-0.03em]">{error ? "Checkout needs another try." : "Opening secure checkout…"}</h1>
          <p className="mt-5 text-sm leading-6 text-[#6d6258] dark:text-[#a99f94]">{error ?? "Your ALVIRA account is being linked to this purchase before Stripe opens, so access can be provisioned automatically after payment."}</p>
          {error && <a href="/pricing" className="mt-7 inline-flex min-h-11 items-center border border-[#191715] px-5 font-mono text-xs font-semibold uppercase tracking-[0.1em] dark:border-[#f4f0e9]">Return to pricing</a>}
        </div>
      </main>
      <TrustFooter />
    </div>
  );
}
