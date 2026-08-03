import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { requestPasswordReset } from "./-auth";
import { Header } from "~/components/Header";

export const Route = createFileRoute("/forgot-password")({ component: ForgotPasswordPage });

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError("");
    if (!email || !email.includes("@")) { setError("Please enter a valid email address."); return; }
    setSubmitting(true);
    try { await requestPasswordReset({ data: { email } }); setSent(true); }
    catch (err) { setError(err instanceof Error ? err.message : "Something went wrong. Try again."); }
    finally { setSubmitting(false); }
  };
  return <div className="min-h-dvh flex flex-col"><Header /><main id="main-content" className="flex-1 flex items-center justify-center px-6 py-12"><div className="mx-auto w-full max-w-md"><div className="text-center mb-10"><h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Reset your password</h1><p className="mt-2 text-gray-600 dark:text-gray-400">Enter your email and we&apos;ll send you a link to choose a new password.</p></div>{sent ? <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 px-4 py-4 text-sm text-emerald-800 dark:text-emerald-200">If an account exists for that email, a password reset link is on its way. Check your inbox, including spam.</div> : <form onSubmit={handleSubmit} className="space-y-5"><div><label htmlFor="email" className="block font-mono text-xs text-emerald-500 dark:text-emerald-400 tracking-wide uppercase mb-1.5">Email</label><input id="email" type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }} placeholder="you@company.com" autoFocus autoComplete="email" className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:border-emerald-500 outline-none transition-colors" /></div>{error && <div className="rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-300">{error}</div>}<button type="submit" disabled={submitting} className="w-full rounded-lg bg-emerald-700 px-6 py-3.5 text-base font-semibold text-white hover:bg-emerald-800 transition-colors disabled:opacity-40">{submitting ? "Sending..." : "Send reset link"}</button></form>}<p className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400"><a href="/login" className="font-mono text-emerald-700 dark:text-emerald-400 hover:text-emerald-500">← Back to sign in</a></p></div></main></div>;
}
