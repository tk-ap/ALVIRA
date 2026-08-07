// ── Signup route ──
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { signup } from "./-auth";
import { Header } from "~/components/Header";
import { TrustFooter } from "~/components/TrustFooter";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [{ title: 'Create your ALVIRA profile' }, { name: "description", content: 'Create an ALVIRA account and build the context your AI is missing.' }],
  }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!password || password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await signup({ data: { email, password } });
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
              Create your account
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Start building your AI knowledge profile — free.
            </p>
          </div>

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
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-system dark:focus:border-system outline-none transition-colors focus-visible:ring-2 focus-visible:ring-system/40 dark:focus-visible:ring-system/40"
              />
            </div>

            <div>
              <label
                htmlFor="confirm"
                className="block font-mono text-xs text-system dark:text-system tracking-wide uppercase mb-1.5"
              >
                Confirm password
              </label>
              <input
                id="confirm"
                type="password"
                value={confirm}
                onChange={(e) => { setConfirm(e.target.value); setError(""); }}
                placeholder="Re-enter your password"
                autoComplete="new-password"
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-system dark:focus:border-system outline-none transition-colors focus-visible:ring-2 focus-visible:ring-system/40 dark:focus-visible:ring-system/40"
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
              className="w-full rounded-lg bg-system-dark dark:bg-system px-6 py-3.5 text-base font-semibold text-white hover:bg-system-dark dark:hover:bg-system transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-system/50 dark:focus-visible:ring-system/50"
            >
              {submitting ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{" "}
            <a href="/login" className="font-mono text-system-dark dark:text-system hover:text-system dark:hover:text-system transition-colors">
              Sign in →
            </a>
          </p>
        </div>
      </main>
      <TrustFooter />
    </div>
  );
}
