import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { resetPassword } from "./-auth";
import { Header } from "~/components/Header";
import { TrustFooter } from "~/components/TrustFooter";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [{ title: 'Set a new password — ALVIRA' }, { name: "description", content: 'Set a new password for your ALVIRA account.' }],
  }), component: ResetPasswordPage });

function ResetPasswordPage() {
  const navigate = useNavigate();
  const token = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "").get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState(token ? "" : "This reset link is invalid or has expired. Please request a new one.");
  const [submitting, setSubmitting] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError("");
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setSubmitting(true);
    try { await resetPassword({ data: { token, newPassword: password } }); navigate({ to: "/login", search: { reset: "success" } }); }
    catch (err) { setError(err instanceof Error ? err.message : "Something went wrong. Try again."); }
    finally { setSubmitting(false); }
  };
  return <div className="min-h-dvh flex flex-col"><Header /><main id="main-content" className="flex-1 flex items-center justify-center px-6 py-12"><div className="mx-auto w-full max-w-md"><div className="text-center mb-10"><h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Choose a new password</h1><p className="mt-2 text-gray-600 dark:text-gray-400">Your new password must be at least 8 characters.</p></div><form onSubmit={handleSubmit} className="space-y-5"><div><label htmlFor="password" className="block font-mono text-xs text-system dark:text-system tracking-wide uppercase mb-1.5">New password</label><input id="password" type="password" value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }} autoFocus autoComplete="new-password" className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-gray-100 focus:border-system outline-none transition-colors focus-visible:ring-2 focus-visible:ring-system/40 dark:focus-visible:ring-system/40" /></div><div><label htmlFor="confirm" className="block font-mono text-xs text-system dark:text-system tracking-wide uppercase mb-1.5">Confirm password</label><input id="confirm" type="password" value={confirm} onChange={(e) => { setConfirm(e.target.value); setError(""); }} autoComplete="new-password" className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-gray-100 focus:border-system outline-none transition-colors focus-visible:ring-2 focus-visible:ring-system/40 dark:focus-visible:ring-system/40" /></div>{error && <div className="rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-300">{error}</div>}<button type="submit" disabled={submitting || !token} className="w-full rounded-lg bg-system-dark px-6 py-3.5 text-base font-semibold text-white hover:bg-system-dark transition-colors disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-system/50 dark:focus-visible:ring-system/50">{submitting ? "Updating..." : "Update password"}</button></form></div></main><TrustFooter /></div>;
}
