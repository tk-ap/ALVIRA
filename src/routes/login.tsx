// ── Login route ──
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { login } from "./-auth";
import { Header } from "~/components/Header";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [{ title: 'Log in — ALVIRA' }, { name: "description", content: 'Log in to your ALVIRA account.' }],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(() => typeof window !== "undefined" && new URLSearchParams(window.location.search).get("reset") === "success");

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
      const result = await login({ data: { email, password } });
      const maxAge = 30 * 24 * 60 * 60;
      document.cookie = `alvira_session=${result.token}; path=/; max-age=${maxAge}; SameSite=Lax`;
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
              Continue building your AI knowledge profile.
            </p>
          </div>

          {resetSuccess && (
            <div className="mb-5 rounded-lg bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-200">
              Your password has been updated. You can now sign in.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block font-mono text-xs text-emerald-500 dark:text-emerald-400 tracking-wide uppercase mb-1.5"
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
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-emerald-500 dark:focus:border-emerald-400 outline-none transition-colors"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block font-mono text-xs text-emerald-500 dark:text-emerald-400 tracking-wide uppercase mb-1.5"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-emerald-500 dark:focus:border-emerald-400 outline-none transition-colors"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-emerald-700 dark:bg-emerald-600 px-6 py-3.5 text-base font-semibold text-white hover:bg-emerald-800 dark:hover:bg-emerald-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="mt-4 text-center text-sm">
            <a href="/forgot-password" className="font-mono text-emerald-700 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300 transition-colors">
              Forgot password?
            </a>
          </p>

          <p className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
            Don&apos;t have an account?{" "}
            <a href="/signup" className="font-mono text-emerald-700 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300 transition-colors">
              Create one →
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
