// ── Shared Header with auth state and theme toggle ──
import { useEffect, useState } from "react";
import { getCurrentUser, logout } from "~/routes/-auth";
import { ThemeToggle } from "~/routes/__root";

interface UserInfo {
  id: string;
  email: string;
  tier: string;
  interviewCount: number;
}

const OWNER_EMAIL = "tahlia.ashwood@gmail.com";
const linkClass =
  "font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-warm-gray-dark/78 transition-colors hover:text-mineral-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-system dark:text-warm-gray/78 dark:hover:text-mineral dark:focus-visible:outline-system";
const mobileLinkClass = `${linkClass} flex min-h-12 items-center border-b border-warm-gray/18`;

export function Header() {
  const [user, setUser] = useState<UserInfo | null | undefined>(undefined);
  const [loggingOut, setLoggingOut] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getCurrentUser()
      .then((u) => {
        if (!cancelled) setUser(u);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      setUser(null);
    } catch {
      setUser(null);
    } finally {
      setLoggingOut(false);
    }
  };

  const closeMenu = () => setMenuOpen(false);
  const mobileCtaHref = user ? "/dashboard" : "/app";
  const mobileCtaLabel = user ? "Dashboard" : "Start here";
  const isOwner = user?.email.trim().toLowerCase() === OWNER_EMAIL;

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-warm-gray/12 bg-ink-light/94 backdrop-blur-md dark:bg-ink/94">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-10">
          <div className="flex min-h-[68px] items-center justify-between gap-6">
            <a href="/" className="flex min-h-11 items-center gap-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-system dark:focus-visible:outline-system">
              <span className="flex items-center gap-3">
                <img src="/brand/alvira-wordmark-primary-dark.svg" alt="ALVIRA wordmark" className="hidden h-7 w-auto dark:block" />
                <img src="/brand/alvira-wordmark-primary-light.svg" alt="ALVIRA wordmark" className="h-7 w-auto dark:hidden" />
                <span className="hidden h-5 w-px bg-warm-gray/18 sm:block" aria-hidden="true" />
                <span className="hidden items-center gap-2 sm:flex">
                  <img src="/brand/alvira-context-frame.svg" alt="" className="h-[15px] w-[15px] opacity-90" aria-hidden="true" />
                  <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-warm-gray-dark/68 dark:text-warm-gray/68">
                    Context Intelligence
                  </span>
                </span>
              </span>
            </a>

            <div className="hidden items-center gap-4 md:flex">
              <nav aria-label="Primary navigation" className="flex items-center gap-4 border-r border-warm-gray/15 pr-4">
                <a href="/#possibilities" className={linkClass}>How it helps</a>
                <a href="/context" className={linkClass}>Context</a>
                <a href="/meos" className={`${linkClass} text-system-dark dark:text-system`}>Reflect</a>
                <a href="/integrations" className={linkClass}>Use elsewhere</a>
                <a href="/pricing" className={linkClass}>Pricing</a>
              </nav>

              {user === undefined ? (
                <div className="h-8 w-16 bg-gray-100 dark:bg-gray-800 animate-pulse" />
              ) : user ? (
                <div className="flex items-center gap-4">
                  <a href="/dashboard" className={linkClass}>Dashboard</a>
                  <a href="/history" className={linkClass}>History</a>
                  <a href="/account" className={linkClass}>Account</a>
                  <button type="button" onClick={handleLogout} disabled={loggingOut} className={`${linkClass} min-h-11 disabled:opacity-50`}>{loggingOut ? "..." : "Logout"}</button>
                </div>
              ) : (
                <a href="/login" className={`${linkClass} min-h-11 flex items-center`}>Sign In</a>
              )}

              <a
                href={user ? "/dashboard" : "/app"}
                className="inline-flex min-h-10 items-center justify-center gap-2 border border-mineral-dark/25 bg-mineral-dark px-4 font-mono text-[10px] font-semibold uppercase tracking-[0.11em] text-ink-light transition-opacity hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-system dark:border-mineral/25 dark:bg-mineral dark:text-ink"
              >
                <img src="/brand/alvira-context-frame.svg" alt="" className="h-3.5 w-3.5 brightness-0 invert dark:invert-0" aria-hidden="true" />
                {user ? "Open ALVIRA" : "Start here"}
              </a>
              <ThemeToggle />
            </div>

            <div className="flex items-center gap-2 md:hidden">
              <a href={mobileCtaHref} className="inline-flex min-h-11 items-center px-1 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-system-dark underline decoration-system/35 underline-offset-4 transition-colors hover:text-mineral-dark dark:text-system dark:hover:text-mineral">{mobileCtaLabel}</a>
              <ThemeToggle />
              <button type="button" onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen} aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"} aria-controls="mobile-navigation" className="flex min-h-11 min-w-11 items-center justify-center text-warm-gray-dark hover:text-mineral-dark dark:text-warm-gray dark:hover:text-mineral focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-system dark:focus-visible:outline-system">
                <span className="sr-only">{menuOpen ? "Close menu" : "Open menu"}</span>
                <span className="flex w-5 flex-col gap-1" aria-hidden="true"><span className="h-0.5 w-full bg-current" /><span className="h-0.5 w-full bg-current" /><span className="h-0.5 w-full bg-current" /></span>
              </button>
            </div>
          </div>

          <nav id="mobile-navigation" aria-label="Mobile navigation" role="navigation" className={`${menuOpen ? "block" : "hidden"} border-t border-warm-gray/18 pb-2 md:hidden`}>
            <div className="flex items-center gap-2 py-3 font-mono text-[9px] uppercase tracking-[0.18em] text-warm-gray-dark/65 dark:text-warm-gray/65">
              <img src="/brand/alvira-context-frame.svg" alt="" className="h-3.5 w-3.5" aria-hidden="true" />
              AI that starts with your context
            </div>
            <a href="/#possibilities" onClick={closeMenu} className={mobileLinkClass}>What AI can help with</a>
            <a href="/context" onClick={closeMenu} className={mobileLinkClass}>Context</a>
            <a href="/meos" onClick={closeMenu} className={`${mobileLinkClass} text-system-dark dark:text-system`}>Reflect</a>
            <a href="/integrations" onClick={closeMenu} className={mobileLinkClass}>Use elsewhere</a>
            <a href="/pricing" onClick={closeMenu} className={mobileLinkClass}>Pricing</a>
            {user ? <a href="/dashboard" onClick={closeMenu} className={mobileLinkClass}>Dashboard</a> : null}
            {user ? <a href="/history" onClick={closeMenu} className={mobileLinkClass}>History</a> : null}
            {user ? <a href="/account" onClick={closeMenu} className={mobileLinkClass}>Account</a> : null}
            {user ? (
              <button type="button" onClick={() => { closeMenu(); void handleLogout(); }} disabled={loggingOut} className={`${mobileLinkClass} w-full text-left disabled:opacity-50`}>{loggingOut ? "Logging out..." : "Logout"}</button>
            ) : user === null ? (
              <a href="/login" onClick={closeMenu} className={mobileLinkClass}>Sign In</a>
            ) : null}
          </nav>
        </div>
      </header>

      {isOwner && (
        <div className="fixed bottom-5 right-5 z-[60]">
          <a href="/dashboard" className="inline-flex items-center gap-2 border border-system/70 bg-ink px-4 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-system shadow-lg transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-system" aria-label="Open owner dashboard">
            <img src="/brand/alvira-context-frame.svg" alt="" className="h-4 w-4" aria-hidden="true" />
            Owner access
          </a>
        </div>
      )}
    </>
  );
}
