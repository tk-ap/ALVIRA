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

const tierBadgeClass: Record<string, string> = {
  free: "border-gray-400 dark:border-gray-500 text-gray-500 dark:text-gray-400",
  pro: "border-emerald-500 dark:border-emerald-400 text-emerald-600 dark:text-emerald-400",
  lifetime: "border-amber-500 dark:border-amber-400 text-amber-600 dark:text-amber-400",
};

const linkClass = "font-mono text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors";
const mobileLinkClass = `${linkClass} flex min-h-11 items-center border-b border-gray-200 dark:border-gray-800`;

export function Header() {
  const [user, setUser] = useState<UserInfo | null | undefined>(undefined); // undefined = loading
  const [loggingOut, setLoggingOut] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getCurrentUser().then((u) => {
      if (!cancelled) setUser(u);
    }).catch(() => {
      if (!cancelled) setUser(null);
    });
    return () => { cancelled = true; };
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      document.cookie = "alvira_session=; path=/; max-age=0; SameSite=Lax";
      await logout();
      setUser(null);
    } catch {
      setUser(null);
    } finally {
      setLoggingOut(false);
    }
  };

  const closeMenu = () => setMenuOpen(false);
  const mobileCtaHref = user ? "/dashboard" : "/signup";
  const mobileCtaLabel = user ? "Dashboard" : "Get Started";

  return (
    <header className="w-full border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 sticky top-0 z-50">
      <div className="mx-auto max-w-4xl px-6 py-4">
        <div className="flex items-center justify-between">
          <a href="/" className="font-mono tracking-tight font-bold text-lg text-gray-900 dark:text-gray-100">
            ALVIRA
          </a>

          {/* Desktop navigation retains the existing horizontal layout. */}
          <div className="hidden items-center gap-4 md:flex">
            <a href="/why-alvira" className={linkClass}>Why ALVIRA</a>
            <a href="/pricing" className={linkClass}>Pricing</a>
            <a href="/meos" className={linkClass}>MeOS</a>
            {user === undefined ? (
              <div className="h-8 w-20 rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
            ) : user ? (
              <div className="flex items-center gap-3">
                <span className={`font-mono text-[10px] uppercase tracking-wider border px-1.5 py-0.5 rounded ${tierBadgeClass[user.tier] || tierBadgeClass.free}`}>
                  {user.tier}
                </span>
                <span className="font-mono text-sm text-gray-600 dark:text-gray-400 hidden sm:inline">
                  {user.email}
                </span>
                <a href="/dashboard" className={linkClass}>Dashboard</a>
                <a href="/account" className={linkClass}>Account</a>
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="font-mono text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors disabled:opacity-50 min-h-11"
                >
                  {loggingOut ? "..." : "Logout"}
                </button>
              </div>
            ) : (
              <a href="/login" className={`${linkClass} min-h-11 flex items-center`}>Sign In</a>
            )}
            <ThemeToggle />
          </div>

          {/* On small screens, keep one primary action visible and move the rest into the menu. */}
          <div className="flex items-center gap-2 md:hidden">
            <a
              href={mobileCtaHref}
              className="min-h-11 inline-flex items-center rounded border border-amber-500 px-3 font-mono text-xs font-semibold text-amber-700 dark:border-amber-400 dark:text-amber-300"
            >
              {mobileCtaLabel}
            </a>
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-controls="mobile-navigation"
              className="flex min-h-11 min-w-11 items-center justify-center rounded border border-gray-300 text-gray-600 hover:text-gray-900 dark:border-gray-700 dark:text-gray-300 dark:hover:text-gray-100"
            >
              <span className="sr-only">{menuOpen ? "Close menu" : "Open menu"}</span>
              <span className="flex w-5 flex-col gap-1" aria-hidden="true">
                <span className="h-0.5 w-full bg-current" />
                <span className="h-0.5 w-full bg-current" />
                <span className="h-0.5 w-full bg-current" />
              </span>
            </button>
          </div>
        </div>

        <nav
          id="mobile-navigation"
          aria-label="Mobile navigation"
          role="navigation"
          className={`${menuOpen ? "block" : "hidden"} mt-4 border-t border-gray-200 dark:border-gray-800 md:hidden`}
        >
          <a href="/why-alvira" onClick={closeMenu} className={mobileLinkClass}>Why ALVIRA</a>
          <a href="/pricing" onClick={closeMenu} className={mobileLinkClass}>Pricing</a>
          <a href="/meos" onClick={closeMenu} className={mobileLinkClass}>MeOS</a>
          {user ? (
            <>
              <a href="/account" onClick={closeMenu} className={mobileLinkClass}>Account</a>
              <button
                type="button"
                onClick={() => { closeMenu(); void handleLogout(); }}
                disabled={loggingOut}
                className={`${mobileLinkClass} w-full text-left disabled:opacity-50`}
              >
                {loggingOut ? "Signing out..." : "Sign Out"}
              </button>
            </>
          ) : user === null ? (
            <a href="/login" onClick={closeMenu} className={mobileLinkClass}>Sign In</a>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
