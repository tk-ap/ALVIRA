import { useLocation } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { getFoundingBetaStatus, submitBetaFeedback } from "~/routes/-beta";

type BetaStatus = { active: true; email: string; expiresAt: string | null };
type Mode = "problem" | "observation";
type Severity = "blocker" | "major" | "minor" | "note";

function describeSurface(pathname: string): string {
  if (pathname.startsWith("/dashboard")) return "Dashboard";
  if (pathname.startsWith("/account")) return "Account";
  if (pathname.startsWith("/bridge")) return "Bridge";
  if (pathname.startsWith("/context")) return "Context";
  if (pathname.startsWith("/meos")) return "Reflect";
  if (pathname.startsWith("/app")) {
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("offering") === "meos") return "Reflect";
    return "Context";
  }
  return pathname === "/" ? "Homepage" : "ALVIRA";
}

function diagnosticIds() {
  if (typeof window === "undefined") return { profileId: "", interviewId: "" };
  const params = new URLSearchParams(window.location.search);
  return {
    profileId: params.get("profileId") || params.get("profile") || "",
    interviewId: params.get("interviewId") || "",
  };
}

export function FoundingBetaFeedback() {
  const location = useLocation();
  const [status, setStatus] = useState<BetaStatus | null>(null);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("problem");
  const [severity, setSeverity] = useState<Severity>("minor");
  const [details, setDetails] = useState("");
  const [expected, setExpected] = useState("");
  const [includeContext, setIncludeContext] = useState(false);
  const [contextExcerpt, setContextExcerpt] = useState("");
  const [screenshotDataUrl, setScreenshotDataUrl] = useState("");
  const [screenshotName, setScreenshotName] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const surface = useMemo(() => describeSurface(location.pathname), [location.pathname]);

  useEffect(() => {
    let cancelled = false;
    getFoundingBetaStatus()
      .then((next) => { if (!cancelled) setStatus(next as BetaStatus | null); })
      .catch(() => { if (!cancelled) setStatus(null); });
    return () => { cancelled = true; };
  }, [location.pathname]);

  if (!status) return null;

  const diagnostics = () => ({
    surface,
    route: location.pathname,
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
    viewport: typeof window !== "undefined" ? `${window.innerWidth}x${window.innerHeight}` : "",
    ...diagnosticIds(),
  });

  const sendPulse = async (signal: "worked" | "confusing") => {
    setMessage("Sending...");
    try {
      await submitBetaFeedback({ data: {
        kind: "pulse",
        severity: "note",
        signal,
        details: signal === "worked" ? "Worked as expected." : "This part felt confusing.",
        ...diagnostics(),
      } });
      setMessage(signal === "worked" ? "Thanks — noted." : "Thanks — confusion noted.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not send feedback.");
    }
  };

  const readScreenshot = (file: File | undefined) => {
    setScreenshotDataUrl("");
    setScreenshotName("");
    if (!file) return;
    if (!/^image\/(png|jpeg|webp)$/i.test(file.type)) {
      setMessage("Use a PNG, JPEG, or WebP screenshot.");
      return;
    }
    if (file.size > 750_000) {
      setMessage("Keep screenshots under 750 KB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setScreenshotDataUrl(typeof reader.result === "string" ? reader.result : "");
      setScreenshotName(file.name);
      setMessage("");
    };
    reader.readAsDataURL(file);
  };

  const submit = async () => {
    setSubmitting(true);
    setMessage("");
    try {
      await submitBetaFeedback({ data: {
        kind: mode,
        severity,
        signal: mode === "problem" ? "broke" : null,
        details,
        expected,
        contextExcerpt: includeContext ? contextExcerpt : "",
        screenshotDataUrl,
        ...diagnostics(),
      } });
      setMessage("Sent to ALVIRA. Thank you.");
      setDetails("");
      setExpected("");
      setContextExcerpt("");
      setIncludeContext(false);
      setScreenshotDataUrl("");
      setScreenshotName("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not send feedback.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-[95] w-[min(390px,calc(100vw-2rem))] font-sans">
      {open ? (
        <section className="overflow-hidden rounded-2xl border border-iridescent/50 bg-ink/95 text-mineral shadow-2xl backdrop-blur-xl dark:border-iridescent-dark/50" aria-label="Founding Beta feedback">
          <div className="flex items-start justify-between gap-4 border-b border-white/10 px-4 py-3">
            <div>
              <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-iridescent-dark">Founding Beta</div>
              <p className="mt-1 text-xs text-gray-300">Your complimentary Founding Beta access stays with this account. During the beta, candid feedback helps shape what ALVIRA becomes.</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="rounded-md px-2 py-1 font-mono text-xs text-gray-400 hover:bg-white/10 hover:text-white" aria-label="Close beta feedback">Close</button>
          </div>

          <div className="space-y-4 px-4 py-4">
            <div>
              <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-gray-400">Quick signal · {surface}</div>
              <div className="grid grid-cols-3 gap-2">
                <button type="button" onClick={() => sendPulse("worked")} className="rounded-lg border border-system/40 px-2 py-2 text-xs text-system-dark hover:bg-system-soft/30">Worked as expected</button>
                <button type="button" onClick={() => sendPulse("confusing")} className="rounded-lg border border-iridescent/40 px-2 py-2 text-xs text-iridescent-dark hover:bg-iridescent-soft/30">Confusing</button>
                <button type="button" onClick={() => { setMode("problem"); setSeverity("major"); }} className="rounded-lg border border-human/50 px-2 py-2 text-xs text-human-dark hover:bg-human-soft/30">Something broke</button>
              </div>
            </div>

            <div className="flex rounded-lg border border-white/10 p-1">
              <button type="button" onClick={() => setMode("problem")} className={`flex-1 rounded-md px-3 py-2 font-mono text-xs ${mode === "problem" ? "bg-white/10 text-white" : "text-gray-400"}`}>Report a problem</button>
              <button type="button" onClick={() => setMode("observation")} className={`flex-1 rounded-md px-3 py-2 font-mono text-xs ${mode === "observation" ? "bg-white/10 text-white" : "text-gray-400"}`}>Share an observation</button>
            </div>

            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-gray-400">Severity</span>
              <select value={severity} onChange={(event) => setSeverity(event.target.value as Severity)} className="mt-1 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white">
                <option value="blocker">Blocker — I cannot continue</option>
                <option value="major">Major — materially affected the task</option>
                <option value="minor">Minor — friction, but I can continue</option>
                <option value="note">Note — observation or idea</option>
              </select>
            </label>

            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-gray-400">{mode === "problem" ? "What happened?" : "What did you notice?"}</span>
              <textarea value={details} onChange={(event) => setDetails(event.target.value)} rows={4} className="mt-1 w-full resize-y rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-gray-600" placeholder="A sentence or two is enough." />
            </label>

            {mode === "problem" && (
              <label className="block">
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-gray-400">What did you expect instead?</span>
                <textarea value={expected} onChange={(event) => setExpected(event.target.value)} rows={2} className="mt-1 w-full resize-y rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white" />
              </label>
            )}

            <label className="block rounded-lg border border-white/10 p-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-gray-400">Optional screenshot</span>
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => readScreenshot(event.target.files?.[0])} className="mt-2 block w-full text-xs text-gray-400 file:mr-3 file:rounded-md file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-xs file:text-white" />
              {screenshotName && <p className="mt-2 text-xs text-gray-400">Attached: {screenshotName}</p>}
            </label>

            <label className="block rounded-lg border border-white/10 p-3">
              <span className="flex items-center gap-2 text-xs text-gray-300">
                <input type="checkbox" checked={includeContext} onChange={(event) => setIncludeContext(event.target.checked)} />
                Include a short contextual excerpt I choose
              </span>
              {includeContext && <textarea value={contextExcerpt} onChange={(event) => setContextExcerpt(event.target.value)} rows={2} className="mt-2 w-full resize-y rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white" placeholder="Only paste what you explicitly want included in the report." />}
            </label>

            <p className="text-[11px] leading-relaxed text-gray-500">ALVIRA automatically includes page, timestamp, browser/device, your beta account ID, and relevant URL-level profile/interview IDs. It does not automatically attach your Context answers, uploads, or documents.</p>

            <button type="button" disabled={submitting || !details.trim()} onClick={submit} className="w-full rounded-lg bg-system px-4 py-3 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-white disabled:cursor-not-allowed disabled:opacity-40">{submitting ? "Sending..." : "Send to ALVIRA"}</button>
            {message && <p className="text-center font-mono text-xs text-gray-300">{message}</p>}
          </div>
        </section>
      ) : (
        <button type="button" onClick={() => setOpen(true)} className="ml-auto flex items-center gap-2 rounded-full border border-iridescent/50 bg-ink/95 px-4 py-3 text-mineral shadow-xl backdrop-blur-xl hover:border-iridescent dark:border-iridescent-dark/50">
          <span className="h-2 w-2 rounded-full bg-iridescent-dark" aria-hidden="true" />
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em]">Founding Beta · Feedback</span>
        </button>
      )}
    </div>
  );
}
