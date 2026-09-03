// ── Login route ──
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { login } from "./-auth";
import { beginAuthDiagnostic, checkAuthDiagnostic } from "./-auth-diagnostic";
import { AUTH_DIAGNOSTIC_STORAGE_KEY, AUTH_PROBE_COOKIE, type AuthDiagnosticRecord, type AuthDiagnosticServerSnapshot } from "~/components/AuthDiagnosticWatcher";
import { Header } from "~/components/Header";
import { TrustFooter } from "~/components/TrustFooter";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [{ title: 'Log in — ALVIRA' }, { name: "description", content: 'Log in to your ALVIRA account.' }],
  }),
  component: LoginPage,
});

function clientHasProbe(probeId: string): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie
    .split(";")
    .map((part) => part.trim())
    .some((part) => part === `${AUTH_PROBE_COOKIE}=${probeId}`);
}

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resetSuccess] = useState(() => typeof window !== "undefined" && new URLSearchParams(window.location.search).get("reset") === "success");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!password) {
      setError("Password is required.");
      return;
    }

    setSubmitting(true);
    try {
      let probeId = "";
      try {
        const probe = await beginAuthDiagnostic();
        probeId = probe.probeId;
      } catch {
        // Diagnostics must never block login.
      }

      await login({ data: { email, password } });

      if (probeId && typeof sessionStorage !== "undefined") {
        try {
          const afterLogin = await checkAuthDiagnostic({ data: { probeId } }) as AuthDiagnosticServerSnapshot;
          const record: AuthDiagnosticRecord = {
            probeId,
            afterLogin,
            clientProbeAfterLogin: clientHasProbe(probeId),
            updatedAt: new Date().toISOString(),
          };
          sessionStorage.setItem(AUTH_DIAGNOSTIC_STORAGE_KEY, JSON.stringify(record));
        } catch {
          // Diagnostics must never block navigation after a valid login.
        }
      }

      navigate({ to: "/app" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col">
      <Header />

      <main id="main-content" className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="mx-auto w-full max-w-md">
          <div className="text-center mb-10">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Sign in
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Continue building and maintaining your ALVIRA Context.
            </p>
          </div>

          {resetSuccess && (
            <div className="mb-5 rounded-lg bg-system-soft dark:bg-ink border border-system dark:border-system-dark px-4 py-3 text-sm text-system-dark dark:text-system">
              Your password has been updated. You can now sign in.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block font-mono text-xs text-system dark:text-system tracking-wide uppercase mb-1.5"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                placeholder="you@company.com"
                autoFocus
                autoComplete="email"
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-system dark:focus:border-system outline-none transition-colors focus-visible:ring-2 focus-visible:ring-system/40 dark:focus-visible:ring-system/40"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block font-mono text-xs text-system dark:text-system tracking-wide uppercase mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 pr-20 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-system dark:focus:border-system outline-none transition-colors focus-visible:ring-2 focus-visible:ring-system/40 dark:focus-visible:ring-system/40"
                />
                <button
                  type="button"
                  aria-pressed={showPassword}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute inset-y-0 right-0 flex min-w-16 items-center justify-center px-3 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-system-dark transition-colors hover:text-system focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-system dark:text-system dark:hover:text-system-soft"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-system-dark dark:bg-system px-6 py-3.5 text-base font-semibold text-white hover:bg-system-dark dark:hover:bg-system transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-system/50 dark:focus-visible:ring-system/50"
            >
              {submitting ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="mt-4 text-center text-sm">
            <a href="/forgot-password" className="font-mono text-system-dark dark:text-system hover:text-system dark:hover:text-system transition-colors">
              Forgot password?
            </a>
          </p>

          <p className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
            Don&apos;t have an account?{" "}
            <a href="/signup" className="font-mono text-system-dark dark:text-system hover:text-system dark:hover:text-system transition-colors">
              Create one →
            </a>
          </p>
        </div>
      </main>
      <TrustFooter />
    </div>
  );
}
