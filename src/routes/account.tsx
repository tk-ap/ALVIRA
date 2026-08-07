import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Header } from "~/components/Header";
import { getCurrentUser, fetchUserLimits, logout, getEntitlements, claimPurchase } from "./-auth";
import { LIFETIME_PRICE, STRIPE_LINKS } from "~/lib/pricing";
import { TrustFooter } from "~/components/TrustFooter";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [{ title: 'Account — ALVIRA' }, { name: "description", content: 'Manage your ALVIRA subscription and entitlements.' }],
  }), component: AccountPage });

interface Limits {
  id: string;
  email: string;
  tier: string;
  interviewCount: number;
  profileCount: number;
  maxProfiles: number;
  maxInterviews: number;
}

const tierBadgeClass: Record<string, string> = {
  free: "border-gray-400 dark:border-gray-500 text-gray-500 dark:text-gray-400",
  pro: "border-system dark:border-system text-system dark:text-system",
  lifetime: "border-amber-500 dark:border-amber-400 text-amber-700 dark:text-amber-400",
};

function AccountPage() {
  const navigate = useNavigate();
  const [limits, setLimits] = useState<Limits | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshMsg, setRefreshMsg] = useState("");
  const [entitlements, setEntitlements] = useState<string[]>([]);
  const [claimMsg, setClaimMsg] = useState("");

  const loadLimits = async () => {
    setLoading(true);
    setError("");
    try {
      const user = await getCurrentUser();
      if (!user) {
        navigate({ to: "/login" });
        return;
      }
      const l = await fetchUserLimits();
      setLimits(l as Limits);
      setEntitlements(await getEntitlements());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load account info.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadLimits(); }, [navigate]);

  const handleRefresh = async () => {
    setRefreshMsg("Refreshing...");
    await loadLimits();
    setRefreshMsg("Account refreshed.");
    setTimeout(() => setRefreshMsg(""), 2000);
  };

  const handleLogout = async () => {
    document.cookie = "alvira_session=; path=/; max-age=0; SameSite=Lax";
    await logout();
    navigate({ to: "/" });
  };

  if (loading) {
    return (
      <div className="min-h-dvh flex flex-col">
        <Header />
        <main id="main-content" className="flex-1 px-6 py-10">
          <div className="mx-auto max-w-2xl">
            <p className="font-mono text-sm text-gray-500 dark:text-gray-400">Loading...</p>
          </div>
        </main>
        <TrustFooter />
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col">
      <Header />
      <main id="main-content" className="flex-1 px-6 py-10">
        <div className="mx-auto max-w-2xl space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Account</h1>
            <p className="mt-1 font-mono text-sm text-gray-500 dark:text-gray-400">
              Manage your plan and view usage
            </p>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 px-4 py-3 text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          {limits && (
            <>
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700"><h2 className="font-semibold text-gray-900 dark:text-gray-100">Purchases &amp; Entitlements</h2></div>
                <div className="px-5 py-4 space-y-4"><p className="text-sm text-gray-600 dark:text-gray-400">{entitlements.length ? entitlements.map((e) => e.replace(/_/g, " ")).join(", ") : "No entitlements recorded yet."}</p><button type="button" onClick={async () => { setClaimMsg("Claiming..."); try { await claimPurchase({ data: { product: "meos_build" } }); setEntitlements(await getEntitlements()); setClaimMsg("MeOS Build claimed."); } catch (e) { setClaimMsg(e instanceof Error ? e.message : "Unable to claim purchase."); } }} className="rounded-lg border border-system px-4 py-2 font-mono text-sm text-system-dark dark:text-system hover:bg-system-soft dark:hover:bg-ink focus-visible:ring-2 focus-visible:ring-system/50 dark:focus-visible:ring-system/50">{claimMsg || "Claim MeOS Build purchase"}</button><p className="text-xs text-gray-500 dark:text-gray-400">Self-serve activation for V1; Stripe verification is coming.</p></div>
              </div>
              {/* User info card */}
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="font-semibold text-gray-900 dark:text-gray-100">Profile</h2>
                </div>
                <div className="px-5 py-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm text-gray-500 dark:text-gray-400">Email</span>
                    <span className="font-mono text-sm text-gray-900 dark:text-gray-100">{limits.email}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm text-gray-500 dark:text-gray-400">Tier</span>
                    <span className={`font-mono text-xs uppercase tracking-wider border px-1.5 py-0.5 rounded ${tierBadgeClass[limits.tier] || tierBadgeClass.free}`}>
                      {limits.tier}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm text-gray-500 dark:text-gray-400">Interviews used</span>
                    <span className="font-mono text-sm text-gray-900 dark:text-gray-100">
                      {limits.interviewCount}{limits.maxInterviews < Infinity ? ` / ${limits.maxInterviews}` : ""}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm text-gray-500 dark:text-gray-400">Saved profiles</span>
                    <span className="font-mono text-sm text-gray-900 dark:text-gray-100">
                      {limits.profileCount}{limits.maxProfiles < Infinity ? ` / ${limits.maxProfiles}` : ""}
                    </span>
                  </div>
                </div>
              </div>

              {/* Upgrade section */}
              {limits.tier === "free" ? (
                <div className="rounded-lg border border-system dark:border-system-dark bg-system-soft/50 dark:bg-ink/30 overflow-hidden">
                  <div className="px-5 py-4 border-b border-system dark:border-system-dark">
                    <h2 className="font-semibold text-gray-900 dark:text-gray-100">Upgrade your plan</h2>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      Pro unlocks unlimited interviews and profiles. Lifetime gives you one permanent profile — no subscription.
                    </p>
                  </div>
                  <div className="px-5 py-4 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Pro card */}
                      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono font-semibold text-gray-900 dark:text-gray-100">Pro</span>
                          <span className="font-mono text-sm text-gray-500 dark:text-gray-400">$20/mo</span>
                        </div>
                        <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1 mb-4 font-mono">
                          <li>· Unlimited interviews</li>
                          <li>· Multiple profiles</li>
                          <li>· Version history (coming soon)</li>
                          <li>· Markdown export (JSON coming soon)</li>
                        </ul>
                        <a
                          href={`${STRIPE_LINKS.pro}?prefilled_email=${encodeURIComponent(limits.email)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-full text-center rounded-lg bg-system-dark dark:bg-system px-4 py-2.5 font-mono text-sm font-semibold text-white hover:bg-system-dark dark:hover:bg-system transition-colors"
                        >
                          Upgrade to Pro
                        </a>
                      </div>

                      {/* Lifetime card */}
                      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono font-semibold text-gray-900 dark:text-gray-100">Lifetime</span>
                          <span className="font-mono text-sm text-gray-500 dark:text-gray-400">{LIFETIME_PRICE} once</span>
                        </div>
                        <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1 mb-4 font-mono">
                          <li>· One permanent personal AI profile</li>
                          <li>· Up to 12 guided interviews in year one</li>
                          <li>· 4 refresh interviews per year after year one</li>
                          <li>· Up to 50 saved versions (coming soon)</li>
                          <li>· No subscription</li>
                        </ul>
                        <a
                          href={`${STRIPE_LINKS.lifetime}?prefilled_email=${encodeURIComponent(limits.email)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-full text-center rounded-lg border border-amber-500 dark:border-amber-400 px-4 py-2.5 font-mono text-sm font-semibold text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950 transition-colors"
                        >
                          Go Lifetime
                        </a>
                      </div>
                    </div>

                    {/* Post-purchase sync */}
                    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        Already purchased a plan? Refresh your account to apply it.
                      </p>
                      <button
                        type="button"
                        onClick={handleRefresh}
                        className="rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2 font-mono text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus-visible:ring-2 focus-visible:ring-system/50 dark:focus-visible:ring-system/50"
                      >
                        {refreshMsg || "Refresh account"}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Pro/Lifetime user */
                <div className="rounded-lg border border-system dark:border-system-dark bg-system-soft/50 dark:bg-ink/30 overflow-hidden">
                  <div className="px-5 py-4">
                    <h2 className="font-semibold text-gray-900 dark:text-gray-100">
                      You're on the {limits.tier === "pro" ? "Pro" : "Lifetime"} plan
                    </h2>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      {limits.tier === "pro"
                        ? "Unlimited interviews and profiles. Thank you for subscribing!"
                        : "Permanent access with no subscription. Your profile and exported files remain yours."}
                    </p>
                  </div>
                </div>
              )}

              {/* Logout */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="font-mono text-sm text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors focus-visible:ring-2 focus-visible:ring-red-500/50 dark:focus-visible:ring-red-400/50 rounded"
                >
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </main>
      <TrustFooter />
    </div>
  );
}
